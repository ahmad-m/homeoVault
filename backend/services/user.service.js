import userRepository from '../repositories/user.repository.js';
import { AppError } from '../utils/errorFormatter.js';
import connectionPool from '../database/connectionPool.js';

class UserService {
  /**
   * Retrieves user profile details.
   */
  async getUserProfile(userId) {
    const user = await userRepository.findByIdWithRole(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    const { password_hash, login_attempts, locked_until, ...profile } = user;
    return profile;
  }

  /**
   * Updates user profile parameters.
   */
  async updateUserProfile(userId, data) {
    const updatedUser = await userRepository.update(userId, data);
    if (!updatedUser) {
      throw new AppError('User not found.', 404);
    }
    const { password_hash, login_attempts, locked_until, ...profile } = updatedUser;
    return profile;
  }

  /**
   * Lists all users.
   */
  async listAllUsers() {
    return await userRepository.findAllWithRoles();
  }

  /**
   * Toggles the active status of a user (deactivate/activate).
   */
  async toggleUserStatus(userId, isActive, operatorId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const updatedUser = await userRepository.update(userId, {
      is_active: isActive,
      updated_by: operatorId
    });

    const action = isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER';
    const details = `User status toggled to [${isActive ? 'Active' : 'Inactive'}] by operator ID: ${operatorId}`;

    // Log action to activity logs
    await connectionPool.query(
      'INSERT INTO activity_logs (user_id, action, details, created_by) VALUES ($1, $2, $3, $4)',
      [userId, action, details, operatorId]
    );

    const { password_hash, ...profile } = updatedUser;
    return profile;
  }

  /**
   * Soft deletes a user by setting is_active to false.
   */
  async softDeleteUser(userId, operatorId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const deletedUser = await userRepository.softDelete(userId);
    
    // Invalidate user sessions immediately
    await connectionPool.query(
      'UPDATE user_sessions SET is_active = false, logout_time = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const action = 'SOFT_DELETE_USER';
    const details = `User account soft-deleted by operator ID: ${operatorId}`;

    // Log action to activity logs
    await connectionPool.query(
      'INSERT INTO activity_logs (user_id, action, details, created_by) VALUES ($1, $2, $3, $4)',
      [userId, action, details, operatorId]
    );

    const { password_hash, ...profile } = deletedUser;
    return profile;
  }
}

export default new UserService();
