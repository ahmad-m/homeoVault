import userService from '../services/user.service.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Retrieves the profile details of the authenticated user.
 * GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getUserProfile(req.user.id);
  return sendSuccess(res, profile, 'Profile details retrieved successfully.');
});

/**
 * Updates profile details of the authenticated user.
 * PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { first_name, last_name, mobile, profile_image } = req.body;
  
  // Clean up input fields to prevent empty writes
  const updateData = {};
  if (first_name) updateData.first_name = first_name;
  if (last_name) updateData.last_name = last_name;
  if (mobile !== undefined) updateData.mobile = mobile;
  if (profile_image !== undefined) updateData.profile_image = profile_image;

  const profile = await userService.updateUserProfile(req.user.id, updateData);
  return sendSuccess(res, profile, 'Profile updated successfully.');
});

/**
 * Lists all registered users (Administrator only).
 * GET /api/users
 */
export const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listAllUsers();
  return sendSuccess(res, users, 'User directory list retrieved successfully.');
});

/**
 * Toggles a user's active status (Administrator only).
 * PUT /api/users/:id/status
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;
  const { is_active } = req.body;

  if (is_active === undefined) {
    return res.status(400).json({
      success: false,
      message: 'is_active parameter is required in request body.'
    });
  }

  const profile = await userService.toggleUserStatus(targetUserId, is_active, req.user.id);
  const statusLabel = is_active ? 'activated' : 'deactivated';
  return sendSuccess(res, profile, `User has been successfully ${statusLabel}.`);
});

/**
 * Soft deletes a user (Administrator only).
 * DELETE /api/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;
  const profile = await userService.softDeleteUser(targetUserId, req.user.id);
  return sendSuccess(res, profile, 'User account has been soft-deleted successfully.');
});
