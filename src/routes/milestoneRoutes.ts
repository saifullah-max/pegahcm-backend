import express from 'express';
import {
    create_milestone,
    get_all_milestones,
    get_milestone_by_id,
    update_milestone,
    delete_milestone,
} from '../controllers/milestoneController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.route('/').post(uploadMiddleware, create_milestone).get(get_all_milestones);
router
    .route('/:id')
    .get(get_milestone_by_id)
    .put(uploadMiddleware, update_milestone)

router.route('/delete/:id')
    .put(delete_milestone);

export default router;
