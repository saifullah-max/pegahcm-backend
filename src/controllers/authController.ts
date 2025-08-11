// controllers/authController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import EmailService from '../utils/emailService'; // You'll create this email helper


const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const {
      username = '',
      password,
      email,
      fullName,
      roleName = 'user', // <- Use roleName instead of role
      subRoleId
    } = req.body;

    if (!password || !email || !fullName || !roleName) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username || undefined },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      return res.status(400).json({ success: false, message: `Role '${roleName}' not found` });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        email,
        fullName,
        roleId: role.id, // Use roleId from fetched role
        subRoleId: subRoleId || null,
        status: 'active',
        dateJoined: new Date()
      },
      include: {
        subRole: true,
        role: true // 👈 include role.name for JWT and response
      }
    });

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role.name,
        subRoleId: user.subRoleId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role.name,
          subRole: user.subRole,
          status: user.status
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,     // 👈 include full role
        subRole: true,
        employee: true
      }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role.name,
        email: user.email,
        fullName: user.fullName,
        employee: user.employee,
        subRole: {
          id: user.subRoleId,
          name: user.subRole?.name || null
        }
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role.name,
          subRole: user.subRole,
          status: user.status,
          employee: user.employee
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Respond generically
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour expiry
      },
    });

    // Use your EmailService here
    await EmailService.sendPasswordResetEmail(email, resetToken);

    return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot Password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ success: false, message: 'Password is required' });

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      }
    });

    return res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset Password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
