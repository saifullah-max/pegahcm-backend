import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkPermission } from "../middlewares/checkPermissions";
import { deleteFixRequest, editFixRequest, getAllFixRequests, getFixRequestById, getFixRequestsByEmployee, submitFixAttendanceRequest, updateFixRequestStatus } from "../controllers/fixAttendanceController";
import { canApproveFixRequest } from "../middlewares/canApproveAttendanceFixReq";

const router = Router();

router.use(authenticateToken as any);

// create fix attendance req - user
router.post('/', checkPermission("FixAttendance", "create"), submitFixAttendanceRequest as any)

// get all reqs - admin or subRole having permission
router.get('/', checkPermission("FixAttendance", "approve"), getAllFixRequests as any);

// get reqs of specific employee - user can see
router.get('/:employeeId', checkPermission("FixAttendance", "view"), getFixRequestsByEmployee as any)

// update status of req - admin or subRole having permission
router.put('/:id', canApproveFixRequest as any, checkPermission("FixAttendance", "approve"), updateFixRequestStatus as any)

// update any field of data - admin or subRole having permission (in case users given working hour seems bogous or false -- something like that)
router.put('/edit/:id', canApproveFixRequest as any, checkPermission("FixAttendance", "approve"), editFixRequest as any)

// delete entry - admin - or subRole having permission
router.delete('/:id', checkPermission("FixAttendance", "delete"), deleteFixRequest as any)

// Get single record - admin or subRole having permission (form autoFills by this)
router.get('/single/:id', checkPermission("FixAttendance", "approve"), getFixRequestById as any)

export default router;