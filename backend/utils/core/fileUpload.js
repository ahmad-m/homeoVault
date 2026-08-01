import path from 'path';
import { generateUuid } from '../uuid.js';
import { AppError } from '../errorFormatter.js';

class FileUploadUtility {
  constructor() {
    this.defaultAllowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    this.defaultMaxSize = 5 * 1024 * 1024; // 5 MB
  }

  /**
   * Validates metadata of a file.
   * @param {Object} file - Express file object (e.g. from multer)
   * @param {Array} [allowedMimes] - Override default allowed mime types
   * @param {number} [maxSize] - Override default max size limit
   */
  validateFile(file, allowedMimes = this.defaultAllowedMimeTypes, maxSize = this.defaultMaxSize) {
    if (!file) {
      throw new AppError('No file provided for upload.', 400);
    }

    // Validate size limit
    if (file.size > maxSize) {
      const sizeMB = Math.round(maxSize / (1024 * 1024));
      throw new AppError(`File exceeds maximum size limit of ${sizeMB}MB.`, 400);
    }

    // Validate MIME type
    if (!allowedMimes.includes(file.mimetype)) {
      throw new AppError(`File type [${file.mimetype}] is not permitted.`, 400);
    }

    return true;
  }

  /**
   * Generates a randomized, secure unique storage key for files.
   * @param {string} originalName - User's local file name
   * @returns {string} Safe, unique storage filename key
   */
  generateStorageKey(originalName) {
    const ext = path.extname(originalName).toLowerCase();
    const uniqueId = generateUuid();
    return `${uniqueId}${ext}`;
  }
}

const fileUpload = new FileUploadUtility();

export default fileUpload;
