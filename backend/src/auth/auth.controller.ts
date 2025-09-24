import { Request, Response } from 'express';
import { AuthService } from './AuthService';
import { LoginCredentials } from './AuthService';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials: LoginCredentials = req.body;

      // Validate input
      if (!credentials.username || !credentials.password) {
        res.status(400).json({
          error: 'Validation error',
          details: {
            field: 'username/password',
            message: 'Username and password are required'
          }
        });
        return;
      }

      const result = await this.authService.login(credentials);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);

      if (error.message === 'Invalid credentials') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid username or password'
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: 'An error occurred during login'
        });
      }
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({
          error: 'Validation error',
          details: {
            field: 'refresh_token',
            message: 'Refresh token is required'
          }
        });
        return;
      }

      const result = await this.authService.refreshToken(refresh_token);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Refresh token error:', error);

      if (error.message === 'Invalid refresh token') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token'
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: 'An error occurred during token refresh'
        });
      }
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Bearer token is required'
        });
        return;
      }

      const token = authHeader.substring(7);
      await this.authService.logout(token);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred during logout'
      });
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.sub;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const user = await this.authService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          error: 'Not found',
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred while fetching user profile'
      });
    }
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.sub;
      const { current_password, new_password } = req.body;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      if (!current_password || !new_password) {
        res.status(400).json({
          error: 'Validation error',
          details: {
            field: 'password',
            message: 'Current password and new password are required'
          }
        });
        return;
      }

      // Validate new password strength
      if (new_password.length < 8) {
        res.status(400).json({
          error: 'Validation error',
          details: {
            field: 'new_password',
            message: 'Password must be at least 8 characters long'
          }
        });
        return;
      }

      // Get current user
      const user = await this.authService.getUserById(userId);
      if (!user) {
        res.status(404).json({
          error: 'Not found',
          message: 'User not found'
        });
        return;
      }

      // Verify current password
      const authService = this.authService as any;
      const isCurrentPasswordValid = await authService.authService.comparePassword(
        current_password,
        user.password_hash
      );

      if (!isCurrentPasswordValid) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Current password is incorrect'
        });
        return;
      }

      // Update password
      await this.authService.updateUser(userId, { password: new_password });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred while changing password'
      });
    }
  };
}