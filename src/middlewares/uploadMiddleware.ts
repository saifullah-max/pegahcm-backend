import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import fs from 'fs/promises';

// Configure storage
const storage = multer.diskStorage({
  destination: async (req: Request, file: Express.Multer.File, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine upload path based on file type
    if (file.fieldname === 'profileImage') {
      uploadPath += 'profiles/';
    } else if (file.fieldname === 'documents') {
      uploadPath += 'documents/';
    }
    
    // Ensure directory exists
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images for profile
  if (file.fieldname === 'profileImage') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile picture'));
    }
  }
  // Accept documents
  else if (file.fieldname === 'documents') {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for documents'));
    }
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware to process profile images
const processProfileImage = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || !req.files.profileImage) {
    return next();
  }

  try {
    const file = req.files.profileImage[0];
    const filePath = path.join('uploads', 'profiles', file.filename);

    // Process image with Sharp
    await sharp(file.path)
      .resize(300, 300, { // Resize to 300x300
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
      .toFile(filePath);

    // Update the file path in the request
    file.path = filePath;
    next();
  } catch (error) {
    next(error);
  }
};

// Export the upload middleware with image processing
export const uploadMiddleware = [
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]) as any,
  processProfileImage as any
]; 