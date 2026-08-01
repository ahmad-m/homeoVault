/**
 * HomeoVault - Native Test Runner
 * Executes unit and integration validation checks on core utilities, handlers, and formatters.
 */

import assert from 'assert';
import bcrypt from 'bcrypt';
import { sendSuccess, sendError } from '../backend/utils/responseFormatter.js';
import { AppError } from '../backend/utils/errorFormatter.js';

const testSuite = {
  // 1. Password Hashing Checks
  testPasswordHashing: async () => {
    console.log('  -> Running Password Hashing Checks...');
    const pass = 'SamuelHahnemann1810';
    const hash = await bcrypt.hash(pass, 10);
    
    assert.ok(hash, 'Hash should not be empty.');
    assert.notStrictEqual(hash, pass, 'Hash should not match raw password.');
    
    const isValid = await bcrypt.compare(pass, hash);
    assert.strictEqual(isValid, true, 'Correct password comparison should yield true.');
    
    const isInvalid = await bcrypt.compare('wrongPass', hash);
    assert.strictEqual(isInvalid, false, 'Incorrect password comparison should yield false.');
  },

  // 2. Response Formatter Checks
  testResponseFormatter: () => {
    console.log('  -> Running Response Formatter Checks...');
    
    let mockStatus = null;
    let mockJson = null;
    
    const mockRes = {
      status: (code) => {
        mockStatus = code;
        return mockRes;
      },
      json: (payload) => {
        mockJson = payload;
        return mockRes;
      }
    };

    sendSuccess(mockRes, { item: 'test' }, 'Success msg', 201);
    assert.strictEqual(mockStatus, 201, 'HTTP status code should match 201.');
    assert.strictEqual(mockJson.success, true, 'success attribute should be true.');
    assert.strictEqual(mockJson.message, 'Success msg', 'Message attribute should match.');
    assert.deepStrictEqual(mockJson.data, { item: 'test' }, 'Data payload should match.');

    sendError(mockRes, 'Error msg', { fields: 'invalid' }, 400);
    assert.strictEqual(mockStatus, 400, 'HTTP status code should match 400.');
    assert.strictEqual(mockJson.success, false, 'success attribute should be false.');
    assert.strictEqual(mockJson.message, 'Error msg', 'Error message attribute should match.');
    assert.deepStrictEqual(mockJson.error, { fields: 'invalid' }, 'Error details should match.');
  },

  // 3. Error Formatter Checks
  testErrorFormatter: () => {
    console.log('  -> Running Error Formatter Checks...');
    const err = new AppError('Resource not found', 404);
    assert.strictEqual(err.message, 'Resource not found', 'Message should be saved.');
    assert.strictEqual(err.statusCode, 404, 'Status code should be 404.');
    assert.strictEqual(err.isOperational, true, 'isOperational should default to true.');
  }
};

async function runAll() {
  console.log('=== HOMEOVAULT NATIVE TEST SUITE ===');
  let passedCount = 0;
  let failedCount = 0;

  for (const [name, fn] of Object.entries(testSuite)) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(err);
      failedCount++;
    }
  }

  console.log('====================================');
  console.log(`Summary: Passed: ${passedCount} | Failed: ${failedCount}`);
  if (failedCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runAll();
