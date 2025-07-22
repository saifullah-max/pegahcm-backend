import { Router } from 'express';
import { ListSingleEmployee } from '../controllers/employeeController';

const router = Router();

router.get('/:id', ListSingleEmployee as any); 

export default router;