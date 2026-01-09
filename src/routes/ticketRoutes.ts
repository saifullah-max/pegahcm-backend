import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { createTicket, deleteTicket, getAllTickets, getTicketById, updateTicket } from '../controllers/ticketController';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import { checkPermission } from '../middlewares/checkPermissions';

const router = express.Router();

router.use(authenticateToken);

router.route('/').post(uploadMiddleware, checkPermission("Ticket", "create") ,createTicket).get(checkPermission("Ticket", "view"), getAllTickets)

router.route('/:id').get(getTicketById).put(uploadMiddleware, checkPermission("Ticket", "update") ,updateTicket)

router.route('/delete/:id').put(checkPermission("Ticket", "delete"), deleteTicket)


export default router;