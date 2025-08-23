"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_1 = require("./utils/socket");
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const roleRoutes_1 = __importDefault(require("./routes/roleRoutes"));
const subRolesRoutes_1 = __importDefault(require("./routes/subRolesRoutes"));
const employeeRoutes_1 = __importDefault(require("./routes/employeeRoutes"));
const shift_routes_1 = __importDefault(require("./routes/shift.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const subDepartment_routes_1 = __importDefault(require("./routes/subDepartment.routes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const adminAttendanceRoutes_1 = __importDefault(require("./routes/adminAttendanceRoutes"));
const hrRoutes_1 = __importDefault(require("./routes/hrRoutes"));
const permissionRoutes_1 = __importDefault(require("./routes/permissionRoutes"));
const impersonateRoutes_1 = __importDefault(require("./routes/impersonateRoutes"));
const fixAttendanceRoutes_1 = __importDefault(require("./routes/fixAttendanceRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const salaryRoutes_1 = __importDefault(require("./routes/salaryRoutes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3003;
const server = http_1.default.createServer(app);
// Initialize Socket.IO cleanly
(0, socket_1.initSocket)(server);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/roles', roleRoutes_1.default);
app.use('/api/sub-roles', subRolesRoutes_1.default);
app.use('/api/employees', employeeRoutes_1.default);
app.use('/api/shifts', shift_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/sub-departments', subDepartment_routes_1.default);
app.use('/api/user', userRoutes_1.default);
app.use('/api/attendance', attendanceRoutes_1.default);
app.use('/api/fix-attendance', fixAttendanceRoutes_1.default);
app.use('/api/admin', adminAttendanceRoutes_1.default);
app.use('/api/hr', hrRoutes_1.default);
app.use('/api/permissions', permissionRoutes_1.default);
app.use('/api/impersonate', impersonateRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/salary', salaryRoutes_1.default);
// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to PegaHCM API' });
});
// Start server
server.listen(port, () => {
    console.log(`Server + Socket.IO running on port ${port}`);
});
