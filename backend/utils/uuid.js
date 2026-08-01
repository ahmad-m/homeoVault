import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * Generates a random version-4 UUID.
 * @returns {string} UUID string
 */
export const generateUuid = () => uuidv4();

/**
 * Validates whether a string is a valid UUID format.
 * @param {string} id - ID string to validate
 * @returns {boolean} True if valid
 */
export const isValidUuid = (id) => uuidValidate(id);

export default {
  generate: generateUuid,
  validate: isValidUuid
};
