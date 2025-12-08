import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { connectMongo } from './utils/mongo';
import { auditMiddleware } from './middlewares/auditMiddleware';
import authRoutes from './routes/authRoutes';
import roleRoutes from './routes/roleRoutes';
import subRoleRoutes from './routes/subRolesRoutes'
import employeeRoutes from './routes/employeeRoutes';
import shiftRoutes from './routes/shift.routes';
import departmentRoutes from './routes/department.routes';
// import subDepartmentRoutes from './routes/subDepartment.routes';
import userRoutes from './routes/userRoutes'
import attendanceRoutes from './routes/attendanceRoutes'
import adminAttendanceRoutes from './routes/adminAttendanceRoutes';
import hrRoutes from './routes/hrRoutes';
import permissionRoutes from './routes/permissionRoutes'
import impersonateRoutes from './routes/impersonateRoutes'
import fixAttendanceRoutes from './routes/fixAttendanceRoutes'
import notificationRoutes from './routes/notificationRoutes'
import salaryRoutes from './routes/salaryRoutes'
import bidRoutes from './routes/bidRoutes';
import projectRoutes from './routes/projectRoutes';
import milestoneRoutes from './routes/milestoneRoutes';
import targetRoutes from './routes/targetRoutes';
import designationRoutes from './routes/designationRoutes'
import upworkRoutes from './routes/upworkRoutes'
import ticketRoutes from './routes/ticketRoutes'
import { runAutoCheckout, startCleanupJobs, autoCheckoutCron } from './utils/CronJob';
import ticketCommentsRoutes from './routes/ticketCommentsRoutes'
import { initSocket } from './utils/socket';


// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

const server = http.createServer(app);

// Initialize Socket.IO cleanly
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Connect Mongo for audit logs and register audit middleware early
connectMongo('mongodb+srv://saifullahahmed380:dsu241064@pegahub.zmgqxdy.mongodb.net/?appName=pegahub');
app.use(auditMiddleware);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/sub-roles', subRoleRoutes)
app.use('/api/employees', employeeRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/departments', departmentRoutes);
// app.use('/api/sub-departments', subDepartmentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/attendance', attendanceRoutes)
app.use('/api/fix-attendance', fixAttendanceRoutes)
app.use('/api/admin', adminAttendanceRoutes)
app.use('/api/hr', hrRoutes)
app.use('/api/permissions', permissionRoutes)
app.use('/api/impersonate', impersonateRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/salary', salaryRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/designations', designationRoutes)
app.use('/api/upwork', upworkRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/tickets/comments', ticketCommentsRoutes)
// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to PegaHCM API' });
});

app.get('/api/health', (req, res) => {
  return res.json({ success: true, message: "Health check passed!" })
})

startCleanupJobs();

// start the scheduled auto checkout cron (schedule created in CronJob.ts will run automatically)
// calling .start() is safe if you want to ensure it is started explicitly
autoCheckoutCron.start();

// Start server
server.listen(port, () => {
  console.log(`Server + Socket.IO running on port ${port}`);
});