import express from 'express';
import {
    create_target,
    get_all_targets,
    get_target_by_id,
    update_target,
    delete_target,
} from '../controllers/targetController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.route('/').post(create_target).get(get_all_targets);
router
    .route('/:id')
    .get(get_target_by_id)
    .put(update_target)
    .delete(delete_target);

export default router;
