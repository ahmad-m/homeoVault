import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import userRepository from '../repositories/user.repository.js';
import authRepository from '../repositories/auth.repository.js';
import { generateUuid } from '../utils/uuid.js';
import { AppError } from '../utils/errorFormatter.js';
import logger from '../utils/logger.js';
import connectionPool from '../database/connectionPool.js';

class AuthService {
  /**
   * Registers a new user.
   */
  async registerUser({ email, password, first_name, last_name, mobile, roleName = 'Family Member' }) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email address is already registered.', 400);
    }

    // Retrieve role ID
    const roleResult = await connectionPool.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [roleName]);
    const roleId = roleResult.rows[0]?.id;
    if (!roleId) {
      throw new AppError(`Role [${roleName}] does not exist in the system.`, 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Save user
    const newUser = await userRepository.insert({
      role_id: roleId,
      email,
      password_hash: passwordHash,
      first_name,
      last_name,
      mobile,
      is_active: true
    });

    const { password_hash, ...userProfile } = newUser;
    return userProfile;
  }

  /**
   * Authenticates a user and registers an active session.
   */
  async loginUser(email, password, { ipAddress, browser, operatingSystem }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Check account lockout status
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const lockDuration = Math.ceil((new Date(user.locked_until) - new Date()) / (60 * 1000));
      throw new AppError(`This account is temporarily locked. Try again in ${lockDuration} minute(s).`, 401);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      // Increment failed attempts
      const attempts = await userRepository.incrementLoginAttempts(user.id);
      
      if (attempts >= 5) {
        // Lock out account for 15 minutes
        const lockTime = new Date(Date.now() + 15 * 60 * 1000);
        await userRepository.lockAccount(user.id, lockTime);
        throw new AppError('Too many failed login attempts. Your account has been locked for 15 minutes.', 401);
      } else {
        throw new AppError(`Invalid email or password. Attempt ${attempts} of 5.`, 401);
      }
    }

    // Reset login failures and update last login time
    await userRepository.resetLoginAttempts(user.id);
    await userRepository.updateLastLogin(user.id);

    // Generate dynamic JWT session details
    const jti = generateUuid();
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role_name: user.role_name,
      jti
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

    // Log active session in database
    await authRepository.createSession({
      jwt_id: jti,
      user_id: user.id,
      ip_address: ipAddress || '127.0.0.1',
      browser: browser || 'Unknown Browser',
      operating_system: operatingSystem || 'Unknown OS',
      expires_at: sessionExpiry,
      is_active: true
    });

    const { password_hash, login_attempts, locked_until, ...profile } = user;
    
    logger.info(`User logged in: ${email} | Session ID: ${jti}`);
    return { user: profile, token };
  }

  /**
   * Invalidates a session (Logout).
   */
  async logoutUser(jwtId) {
    if (jwtId) {
      await authRepository.invalidateSession(jwtId);
      logger.info(`User logged out. Session invalidated: ${jwtId}`);
    }
  }

  /**
   * Changes user password and invalidates all other active sessions.
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError('Incorrect current password.', 400);
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);
    
    // Update and log out other sessions
    await userRepository.update(userId, { password_hash: hashed });
    await authRepository.invalidateAllUserSessions(userId);
    logger.info(`Password changed for user ID: ${userId}. Sessions invalidated.`);
  }

  /**
   * Registers a password reset token.
   */
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Return neutral message to prevent user enumeration attacks
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return { status: 'success' };
    }

    // Generate reset token and write to database
    const token = generateUuid();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 Hour

    await authRepository.createResetToken({
      user_id: user.id,
      token,
      expires_at: expiresAt
    });

    // In production, an email would be dispatched. For testing, we output to our logger.
    const resetUrl = `http://localhost:${config.port}/reset-password.html?token=${token}`;
    logger.info(`[Reset Password Link] Send to user [${email}]: ${resetUrl}`);

    // Return token in dev mode for API manual testing convenience
    return { status: 'success', token };
  }

  /**
   * Consumes a reset token to update password.
   */
  async resetPassword(token, newPassword) {
    const resetRecord = await authRepository.findResetToken(token);
    if (!resetRecord) {
      throw new AppError('Invalid, expired, or consumed reset token.', 400);
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Run updates atomically within a transaction
    await connectionPool.pool.query('BEGIN');
    try {
      await connectionPool.pool.query(
        'UPDATE users SET password_hash = $1, login_attempts = 0, locked_until = NULL WHERE id = $2',
        [hashed, resetRecord.user_id]
      );
      await connectionPool.pool.query(
        'UPDATE password_reset_tokens SET is_used = true WHERE id = $1',
        [resetRecord.id]
      );
      await connectionPool.pool.query(
        'UPDATE user_sessions SET is_active = false, logout_time = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_active = true',
        [resetRecord.user_id]
      );
      await connectionPool.pool.query('COMMIT');
      logger.info(`Password reset successfully for user ID: ${resetRecord.user_id}`);
    } catch (err) {
      await connectionPool.pool.query('ROLLBACK');
      logger.error('Failed to complete reset password transaction', err);
      throw new AppError('Failed to reset password. Transaction rolled back.', 500);
    }
  }
}

export default new AuthService();
