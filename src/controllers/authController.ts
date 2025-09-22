// controllers/authController.ts

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import EmailService from '../utils/emailService'; // You'll create this email helper
import prisma from '../utils/Prisma';

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

    const existingUser = await prisma.users.findFirst({
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

    const role = await prisma.roles.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      return res.status(400).json({ success: false, message: `Role '${roleName}' not found` });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        username,
        password_hash: passwordHash,
        email,
        full_name: fullName,
        role_id: role.id, // Use roleId from fetched role
        sub_role_id: subRoleId || null,
        status: 'active',
        date_joined: new Date()
      },
      include: {
        sub_role: true,
        role: true // 👈 include role.name for JWT and response
      }
    });

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role.name,
        sub_role_id: user.sub_role_id
      } as any,
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
          full_name: user.full_name,
          role: user.role.name,
          sub_role: user.sub_role,
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

    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        role: true,     // 👈 include full role
        sub_role: true,
        employee: true
      }
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role.name,
        email: user.email,
        full_name: user.full_name,
        employee: user.employee,
        sub_role: {
          id: user.sub_role_id,
          name: user.sub_role?.name || null
        }
      } as any,
      process.env.JWT_SECRET || 'poiuytrewasdfghjkl0998877!!!3?><>:&^&hjn',
      { expiresIn: '24h' }
    );

    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          role: user.role.name,
          sub_role: user.sub_role,
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
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      // Respond generically
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.users.update({
      where: { email },
      data: {
        reset_password_token: hashedToken,
        reset_password_expires: new Date(Date.now() + 3600000), // 1 hour expiry
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

    const user = await prisma.users.findFirst({
      where: {
        reset_password_token: hashedToken,
        reset_password_expires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        reset_password_token: null,
        reset_password_expires: null,
      }
    });

    return res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset Password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
