import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { createTicket, deleteTicket, getAllTickets, getTicketById, updateTicket } from '../controllers/ticketController';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.route('/').post(uploadMiddleware, createTicket).get(getAllTickets)

router.route('/:id').get(getTicketById).put(updateTicket)

router.route('/delete/:id').put(deleteTicket)


export default router;