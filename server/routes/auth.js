import express from 'express';
import { User } from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, linkedSocialAccounts = {} } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists with this email'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      linkedSocialAccounts
    });

    console.log(`👤 New user registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Failed to register user',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login user (simplified - in production you'd use proper authentication)
 */
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Find user by email
    let user = await User.findByEmail(email);
    
    // If user doesn't exist, create them (simplified for demo)
    if (!user) {
      user = await User.create({ email });
      console.log(`👤 New user auto-created during login: ${email}`);
    }

    console.log(`🔐 User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      // In production, you'd return a JWT token here
      token: `demo_token_${user.userId}`
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Failed to login',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/user/:userId
 * Get user profile
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: error.message
    });
  }
});

/**
 * PUT /api/auth/user/:userId
 * Update user profile
 */
router.put('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    await user.update(updateData);

    console.log(`👤 User updated: ${userId}`);

    res.json({
      message: 'User updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/user/:userId/social-accounts
 * Link social media accounts
 */
router.post('/user/:userId/social-accounts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { platform, accountData } = req.body;

    if (!platform || !accountData) {
      return res.status(400).json({
        error: 'Platform and account data are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const updatedAccounts = {
      ...user.linkedSocialAccounts,
      [platform]: {
        ...accountData,
        linkedAt: new Date().toISOString()
      }
    };

    await user.update({ linkedSocialAccounts: updatedAccounts });

    console.log(`🔗 Social account linked: ${platform} for user ${userId}`);

    res.json({
      message: 'Social account linked successfully',
      linkedAccounts: updatedAccounts
    });

  } catch (error) {
    console.error('Link social account error:', error);
    res.status(500).json({
      error: 'Failed to link social account',
      message: error.message
    });
  }
});

/**
 * DELETE /api/auth/user/:userId/social-accounts/:platform
 * Unlink social media account
 */
router.delete('/user/:userId/social-accounts/:platform', async (req, res) => {
  try {
    const { userId, platform } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const updatedAccounts = { ...user.linkedSocialAccounts };
    delete updatedAccounts[platform];

    await user.update({ linkedSocialAccounts: updatedAccounts });

    console.log(`🔗 Social account unlinked: ${platform} for user ${userId}`);

    res.json({
      message: 'Social account unlinked successfully',
      linkedAccounts: updatedAccounts
    });

  } catch (error) {
    console.error('Unlink social account error:', error);
    res.status(500).json({
      error: 'Failed to unlink social account',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/user/:userId/ad-batches
 * Get user's ad batches
 */
router.get('/user/:userId/ad-batches', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const adBatches = await user.getAdBatches(parseInt(limit), parseInt(offset));

    res.json({
      adBatches,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: adBatches.length
      }
    });

  } catch (error) {
    console.error('Get ad batches error:', error);
    res.status(500).json({
      error: 'Failed to get ad batches',
      message: error.message
    });
  }
});

export default router;
