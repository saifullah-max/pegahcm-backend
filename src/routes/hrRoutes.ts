import { Router } from 'express';
import { createOnboarding, deleteOnboarding, getAllHREmployees, getAllOnboardings, getNotOnboardedEmployees, getOnboardingById, updateOnboarding } from '../controllers/onBoardingController';
import { isAdminOrHR } from '../middlewares/roleMiddleware';
import { authenticateToken } from '../middlewares/authMiddleware';
import { deleteResignation, getResignationById, getResignations, processResignation, updateClearanceStatus, updateResignation } from '../controllers/resignationController';
import { checkPermission } from '../middlewares/checkPermissions';

const router = Router();

router.use(authenticateToken as any);

router.get('/resignation/all',checkPermission("Resignation", "view"), getResignations as any);
router.get('/resignation/:id', checkPermission("Resignation", "view"), getResignationById as any);
router.put('/resignation/:id', checkPermission("Resignation", "update"), updateResignation as any);
router.delete('/resignation/:id', checkPermission("Resignation", "delete"), deleteResignation as any);

// router.use(isAdminOrHR as any);

router.get('/all', checkPermission("HREmployee", "view"),  getAllHREmployees as any);

router.post('/', checkPermission("Onboarding", "create"), createOnboarding as any);

router.get('/onboarding', checkPermission("Onboarding", "view"), getAllOnboardings as any);

router.get('/onboarding/:id',checkPermission("Onboarding", "view"),  getOnboardingById as any);

router.put('/onboarding/:id',checkPermission("Onboarding", "update"),  updateOnboarding as any);

router.delete('/onboarding/:id', checkPermission("Onboarding", "delete"), deleteOnboarding as any);

router.get('/onboarding/not-onboarded', checkPermission("NotOnboarding", "view"), getNotOnboardedEmployees as any)

router.put('/resignation/process/:id', checkPermission("Resignation", "approve"), processResignation as any)

router.put('/resignation/edit/:id', checkPermission("Onboarding", "approve"), updateClearanceStatus as any);


export default router;