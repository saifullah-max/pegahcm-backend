import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { createTicket, deleteTicket, getAllTickets, getTicketById, updateTicket } from '../controllers/ticketController';

const router = express.Router();

router.route('/').post(createTicket).get(getAllTickets)

router.route('/:id').get(getTicketById).put(updateTicket)

router.route('/delete/:id').put(deleteTicket)

router.use(authenticateToken);

export default router;