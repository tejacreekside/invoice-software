import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { fileUploadService } from '../services/fileUploadService.js';
import path from 'path';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Get user profile
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update business profile details used on printable invoices
router.put('/', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { businessName, businessEmail, businessPhone, businessAddress } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        businessName: businessName || null,
        businessEmail: businessEmail || null,
        businessPhone: businessPhone || null,
        businessAddress: businessAddress || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
      }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload/update user avatar
router.post('/avatar', fileUploadService.getAvatarUpload().single('avatar'), async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old avatar if exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.avatar) {
      fileUploadService.deleteFile(user.avatar);
    }

    // Update user with new avatar path
    const avatarPath = req.file.path;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
      }
    });

    res.json({
      message: 'Avatar updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Delete user avatar
router.delete('/avatar', async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.avatar) {
      fileUploadService.deleteFile(user.avatar);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null }
    });

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
