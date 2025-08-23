"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
// src/middleware/uploadMiddleware.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const promises_1 = __importDefault(require("fs/promises"));
// Detect environment
const isProd = process.env.NODE_ENV === 'production';
// Base upload directory (relative to project root)
const baseUploadPath = path_1.default.join(__dirname, '../../uploads');
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        let folder = file.fieldname === 'profileImage' ? 'profiles' : 'documents';
        const uploadPath = path_1.default.join(baseUploadPath, folder);
        try {
            await promises_1.default.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        }
        catch (err) {
            cb(err, uploadPath);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    }
});
// File filter
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'profileImage') {
        if (file.mimetype.startsWith('image/'))
            return cb(null, true);
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
        if (allowedTypes.includes(file.mimetype))
            return cb(null, true);
        return cb(new Error('Invalid file type for documents'));
    }
    cb(new Error('Unknown field'));
};
// Multer instance
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});
// Image processing middleware
const processProfileImage = async (req, res, next) => {
    const files = req.files;
    if (!files?.profileImage)
        return next();
    try {
        const file = files.profileImage[0];
        const processedPath = path_1.default.join(path_1.default.dirname(file.path), `processed-${file.filename}`);
        await (0, sharp_1.default)(file.path)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(processedPath);
        await promises_1.default.unlink(file.path); // delete original
        // Update file object to point to processed version
        file.filename = `processed-${file.filename}`;
        file.path = processedPath;
        next();
    }
    catch (err) {
        next(err);
    }
};
// Final export
exports.uploadMiddleware = [
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'documents', maxCount: 5 }
    ]),
    processProfileImage
];
