// src/middleware/uploadMiddleware.ts
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import fs from 'fs/promises';

// Detect environment
const isProd = process.env.NODE_ENV === 'production';

// Base upload directory (relative to project root)
const baseUploadPath = path.join(__dirname, '../../uploads');

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let folder = file.fieldname === 'profileImage' ? 'profiles' : 'documents';
    const uploadPath = path.join(baseUploadPath, folder);

    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      cb(err as Error, uploadPath);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.fieldname === 'profileImage') {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only images are allowed for profileImage'));
  }

  if (file.fieldname === 'documents') {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Invalid file type for documents'));
  }

  cb(new Error('Unknown field'));
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// Image processing middleware
const processProfileImage = async (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files?.profileImage) return next();

  try {
    const file = files.profileImage[0];
    const processedPath = path.join(path.dirname(file.path), `processed-${file.filename}`);

    await sharp(file.path)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(processedPath);

    await fs.unlink(file.path); // delete original

    // Update file object to point to processed version
    file.filename = `processed-${file.filename}`;
    file.path = processedPath;

    next();
  } catch (err) {
    next(err);
  }
};

// Final export
export const uploadMiddleware = [
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]),
  processProfileImage
];
