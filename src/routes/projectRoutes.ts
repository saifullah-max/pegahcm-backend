import express from 'express';
import {
    create_project,
    get_all_projects,
    get_project_by_id,
    update_project,
    delete_project
} from '../controllers/projectController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.route('/').post(uploadMiddleware, create_project).get(get_all_projects);
router
    .route('/:id')
    .get(get_project_by_id)
    .put(update_project)
    .put(delete_project);

export default router;
