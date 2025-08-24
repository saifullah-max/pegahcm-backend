import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initSocket } from "./utils/socket";
import http from "http";
import path from "path";

// Routes imports
import authRoutes from "./routes/authRoutes";
import roleRoutes from "./routes/roleRoutes";
import subRoleRoutes from "./routes/subRolesRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import shiftRoutes from "./routes/shift.routes";
import departmentRoutes from "./routes/department.routes";
import subDepartmentRoutes from "./routes/subDepartment.routes";
import userRoutes from "./routes/userRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import adminAttendanceRoutes from "./routes/adminAttendanceRoutes";
import hrRoutes from "./routes/hrRoutes";
import permissionRoutes from "./routes/permissionRoutes";
import impersonateRoutes from "./routes/impersonateRoutes";
import fixAttendanceRoutes from "./routes/fixAttendanceRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import salaryRoutes from "./routes/salaryRoutes";

// Load env
dotenv.config();

const app = express();
const port = process.env.PORT || 3003;
const server = http.createServer(app);

// ✅ Prepare allowed origins dynamically
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:5173",
    "https://pegahcm.netlify.app",
  ]
).map((origin) => origin.trim().replace(/\/$/, "")); // remove trailing slash

console.log("✅ Allowed Origins:", allowedOrigins);

// ✅ Express CORS
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("[EXPRESS CORS CHECK] Incoming origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        console.log("[EXPRESS CORS ALLOWED]:", origin);
        callback(null, true);
      } else {
        console.warn("[EXPRESS CORS BLOCKED]:", origin);
        callback(new Error(`CORS not allowed for ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ✅ Initialize Socket.IO
initSocket(server, allowedOrigins);

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/sub-roles", subRoleRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/sub-departments", subDepartmentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fix-attendance", fixAttendanceRoutes);
app.use("/api/admin", adminAttendanceRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/impersonate", impersonateRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/salary", salaryRoutes);

// ✅ Basic route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to PegaHCM API" });
});

// ✅ Start server
server.listen(port, () => {
  console.log(`✅ Server + Socket.IO running on port ${port}`);
});
