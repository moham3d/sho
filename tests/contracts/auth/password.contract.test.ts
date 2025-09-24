import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { TestSetup } from './setup';
import { TestUtils } from './utils';
import { TEST_USERS, ChangePasswordRequest } from './fixtures';

describe('Password Management Contract Tests', () => {
  let app: any;
  let authToken: string;

  beforeEach(async () => {
    app = TestSetup.getApp();

    // Create test user
    const hashedPassword = await TestUtils.hashPassword(TEST_USERS.ADMIN.password);
    await TestSetup.createTestUser({
      ...TEST_USERS.ADMIN,
      password: hashedPassword
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: TEST_USERS.ADMIN.username,
        password: TEST_USERS.ADMIN.password
      });

    authToken = loginResponse.body.data.accessToken;
  });

  describe('POST /api/auth/change-password', () => {
    const validPasswordChange: ChangePasswordRequest = {
      currentPassword: TEST_USERS.ADMIN.password,
      newPassword: 'NewSecurePassword123!',
      confirmNewPassword: 'NewSecurePassword123!'
    };

    it('should return 200 for valid password change', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPasswordChange)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String)
      });

      // Verify login with new password works
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.ADMIN.username,
          password: validPasswordChange.newPassword
        });

      expect(newLoginResponse.status).toBe(200);
    });

    it('should return 400 for incorrect current password', async () => {
      const invalidPasswordChange = {
        ...validPasswordChange,
        currentPassword: 'WrongCurrentPassword123!'
      };

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPasswordChange)
        .expect(400);
    });

    it('should return 400 for password confirmation mismatch', async () => {
      const mismatchedPasswordChange = {
        currentPassword: TEST_USERS.ADMIN.password,
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'DifferentPassword123!'
      };

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mismatchedPasswordChange)
        .expect(400);
    });

    it('should return 400 for weak new password', async () => {
      const weakPasswords = [
        'short',
        'longenoughbutnocaps123',
        'LongEnoughButNoNumbers',
        'longenoughwithnumbers1butnospecialchars'
      ];

      for (const weakPassword of weakPasswords) {
        const weakPasswordChange = {
          currentPassword: TEST_USERS.ADMIN.password,
          newPassword: weakPassword,
          confirmNewPassword: weakPassword
        };

        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(weakPasswordChange);

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should return 400 for reusing current password', async () => {
      const reusePasswordChange = {
        currentPassword: TEST_USERS.ADMIN.password,
        newPassword: TEST_USERS.ADMIN.password,
        confirmNewPassword: TEST_USERS.ADMIN.password
      };

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reusePasswordChange)
        .expect(400);
    });

    it('should return 400 for missing current password', async () => {
      const incompleteChange = {
        newPassword: validPasswordChange.newPassword,
        confirmNewPassword: validPasswordChange.confirmNewPassword
      };

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteChange)
        .expect(400);
    });

    it('should return 400 for missing new password', async () => {
      const incompleteChange = {
        currentPassword: validPasswordChange.currentPassword,
        confirmNewPassword: validPasswordChange.confirmNewPassword
      };

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteChange)
        .expect(400);
    });

    it('should return 400 for missing password confirmation', async () => {
      const incompleteChange = {
        currentPassword: validPasswordChange.currentPassword,
        newPassword: validPasswordChange.newPassword
      };

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteChange)
        .expect(400);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .post('/api/auth/change-password')
        .send(validPasswordChange)
        .expect(401);
    });

    it('should return 401 for invalid auth token', async () => {
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer invalid-token')
        .send(validPasswordChange)
        .expect(401);
    });

    it('should invalidate existing sessions after password change', async () => {
      // Change password
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPasswordChange)
        .expect(200);

      // Try to use old token for protected endpoint
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Should be unauthorized (old token should be invalidated)
      expect([401, 403]).toContain(profileResponse.status);
    });

    it('should handle password change rate limiting', async () => {
      const rateLimitChange = {
        currentPassword: TEST_USERS.ADMIN.password,
        newPassword: 'RateLimitTest123!',
        confirmNewPassword: 'RateLimitTest123!'
      };

      // Make multiple password change attempts to trigger rate limiting
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(rateLimitChange);
      }

      // Next request should be rate limited
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rateLimitChange);

      expect([429, 400]).toContain(response.status);
    });

    it('should validate password history and prevent reuse', async () => {
      const firstPassword = TEST_USERS.ADMIN.password;
      const secondPassword = 'SecondPassword123!';
      const thirdPassword = 'ThirdPassword123!';

      // First password change
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: firstPassword,
          newPassword: secondPassword,
          confirmNewPassword: secondPassword
        })
        .expect(200);

      // Get new token after first password change
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.ADMIN.username,
          password: secondPassword
        });

      const newAuthToken = newLoginResponse.body.data.accessToken;

      // Second password change
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${newAuthToken}`)
        .send({
          currentPassword: secondPassword,
          newPassword: thirdPassword,
          confirmNewPassword: thirdPassword
        })
        .expect(200);

      // Try to reuse first password
      const reuseResponse = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${newAuthToken}`)
        .send({
          currentPassword: thirdPassword,
          newPassword: firstPassword,
          confirmNewPassword: firstPassword
        });

      expect([400, 409]).toContain(reuseResponse.status);
    });

    it('should handle special characters in new password', async () => {
      const specialCharPassword = {
        currentPassword: TEST_USERS.ADMIN.password,
        newPassword: 'SpecialChars!@#$%^&*()_+123',
        confirmNewPassword: 'SpecialChars!@#$%^&*()_+123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(specialCharPassword)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify login with special character password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.ADMIN.username,
          password: specialCharPassword.newPassword
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should handle password with spaces', async () => {
      const spacePassword = {
        currentPassword: TEST_USERS.ADMIN.password,
        newPassword: 'Valid Password With Spaces 123!',
        confirmNewPassword: 'Valid Password With Spaces 123!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(spacePassword)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for excessively long password', async () => {
      const longPassword = 'a'.repeat(129) + 'A1!'; // 130+ characters

      const longPasswordChange = {
        currentPassword: TEST_USERS.ADMIN.password,
        newPassword: longPassword,
        confirmNewPassword: longPassword
      };

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(longPasswordChange)
        .expect(400);
    });

    it('should trim whitespace from password fields', async () => {
      const trimmedPasswordChange = {
        currentPassword: `  ${TEST_USERS.ADMIN.password}  `,
        newPassword: '  TrimmedPassword123!  ',
        confirmNewPassword: '  TrimmedPassword123!  '
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(trimmedPasswordChange)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify login with trimmed password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.ADMIN.username,
          password: 'TrimmedPassword123!'
        });

      expect(loginResponse.status).toBe(200);
    });
  });
});