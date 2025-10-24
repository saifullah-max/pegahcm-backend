import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import { checkPermission } from '../middlewares/checkPermissions';
import { createTicketComment, getCommentsByTicketId } from '../controllers/ticketCommentsController';

const router = express.Router();

router.use(authenticateToken);

router.route('/').post(uploadMiddleware, checkPermission("Ticket", "comment"), createTicketComment)
router.route('/get/:ticketId').get(getCommentsByTicketId)

export default router;