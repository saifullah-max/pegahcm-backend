import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import { checkPermission } from '../middlewares/checkPermissions';
import { createTicketComment, DeleteCommentById, getCommentsByTicketId } from '../controllers/ticketCommentsController';

const router = express.Router();

router.use(authenticateToken);
console.log("Using updated createTicketComment controller file");


router.route('/').post(uploadMiddleware, checkPermission("Comment", "create"), createTicketComment)
router.route('/get/:ticketId').get(getCommentsByTicketId)

router.put('/delete/:id', checkPermission("Ticket", "delete"), DeleteCommentById)

export default router;