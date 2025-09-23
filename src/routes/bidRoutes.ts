import express from 'express';
import {
    create_bid,
    get_all_bids,
    get_bid_by_id,
    update_bid,
    delete_bid,
} from '../controllers/bidController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.route('/').post(create_bid).get(get_all_bids);
router
    .route('/:id')
    .get(get_bid_by_id)
    .put(update_bid)
    .delete(delete_bid);

export default router;