import authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import asyncHandler from '../utils/asyncHandler.js';

// Cookie options helper
const getCookieOptions = () => ({
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Hours
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
});

/**
 * Registers a new user.
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, first_name, last_name, mobile, roleName } = req.body;
  const user = await authService.registerUser({ email, password, first_name, last_name, mobile, roleName });
  return sendSuccess(res, user, 'User registered successfully. Please login.', 201);
});

/**
 * Authenticates user credentials, sets security cookie.
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Capture user metadata for audit trails
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  
  // Extract browser and OS from user agent
  let browser = 'Unknown Browser';
  let operatingSystem = 'Unknown OS';
  
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  if (userAgent.includes('Windows')) operatingSystem = 'Windows';
  else if (userAgent.includes('Macintosh')) operatingSystem = 'macOS';
  else if (userAgent.includes('Linux')) operatingSystem = 'Linux';
  else if (userAgent.includes('Android')) operatingSystem = 'Android';
  else if (userAgent.includes('iPhone')) operatingSystem = 'iOS';

  const { user, token } = await authService.loginUser(email, password, {
    ipAddress,
    browser,
    operatingSystem
  });

  // Set httpOnly token cookie
  res.cookie('token', token, getCookieOptions());

  return sendSuccess(res, { user, token }, 'Login successful.');
});

/**
 * Invalidates current user session and clears cookie.
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.sessionJwtId);
  res.clearCookie('token');
  return sendSuccess(res, null, 'Logged out successfully.');
});

/**
 * Regenerates the active token session (Token Refresh).
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { ip, headers, user, sessionJwtId } = req;
  
  // Invalidate previous session
  await authService.logoutUser(sessionJwtId);

  // Generate new token & session
  const ipAddress = ip || headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = headers['user-agent'] || '';
  
  const { token, user: profile } = await authService.loginUser(user.email, 'password_placeholders_bypass', {
    ipAddress,
    browser: 'Token Refresh Session',
    operatingSystem: 'Session Renewal'
  });

  res.cookie('token', token, getCookieOptions());
  return sendSuccess(res, { user: profile, token }, 'Token refreshed successfully.');
});

/**
 * Updates password and invalidates active session.
 * POST /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.clearCookie('token'); // Invalidate current login cookie
  return sendSuccess(res, null, 'Password updated successfully. Please login again.');
});

/**
 * Triggers password reset generation link.
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  return sendSuccess(res, { token: result.token }, 'If the email exists, a password reset link has been dispatched.');
});

/**
 * Updates password using a valid reset token.
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  return sendSuccess(res, null, 'Password reset successfully. You can now login.');
});
