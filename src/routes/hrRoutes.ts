import { Router } from 'express';
import { createOnboarding, deleteOnboarding, getAllHREmployees, getAllOnboardings, getNotOnboardedEmployees, getOnboardingById, updateOnboarding } from '../controllers/onBoardingController';
import { isAdminOrHR } from '../middlewares/roleMiddleware';
import { authenticateToken } from '../middlewares/authMiddleware';
import { deleteResignation, getResignationById, getResignations, processResignation, updateClearanceStatus, updateResignation } from '../controllers/resignationController';

const router = Router();

router.use(authenticateToken as any);

router.get('/resignation/all',getResignations as any);
router.get('/resignation/:id', getResignationById as any);
router.put('/resignation/:id', updateResignation as any);
router.delete('/resignation/:id', deleteResignation as any);

router.use(isAdminOrHR as any);

router.get('/all', getAllHREmployees as any);

router.post('/', createOnboarding as any);

router.get('/onboarding', getAllOnboardings as any);

router.get('/onboarding/:id', getOnboardingById as any);

router.put('/onboarding/:id', updateOnboarding as any);

router.delete('/onboarding/:id', deleteOnboarding as any);

router.get('/onboarding/not-onboarded', getNotOnboardedEmployees as any)

router.put('/resignation/process/:id', processResignation as any)

router.put('/resignation/edit/:id', updateClearanceStatus as any);


export default router;