import express from 'express';
import {
    create_milestone,
    get_all_milestones,
    get_milestone_by_id,
    update_milestone,
    delete_milestone,
} from '../controllers/milestoneController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.route('/').post(create_milestone).get(get_all_milestones);
router
    .route('/:id')
    .get(get_milestone_by_id)
    .put(update_milestone)
    .delete(delete_milestone);

export default router;
