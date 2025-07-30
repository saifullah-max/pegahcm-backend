import express from 'express';
import { assignPermissionsToUser, createPermission, getAllPermissions } from '../controllers/permissionController';

const router = express.Router();

router.post("/", createPermission as any)

router.get('/', getAllPermissions as any)

router.post('/user', assignPermissionsToUser as any)

export default router;
