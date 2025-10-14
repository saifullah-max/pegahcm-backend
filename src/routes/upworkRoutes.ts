import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { create_upwork_id, delete_upwork_id, get_all_upwork_ids, get_upwork_by_id, update_upwork_id } from '../controllers/upworkController';

const router = express.Router();

router.use(authenticateToken);

router.route('/').post(create_upwork_id).get(get_all_upwork_ids)

router.route('/:id').put(update_upwork_id).get(get_upwork_by_id)

router.route('/delete/:id').put(delete_upwork_id)

export default router;
