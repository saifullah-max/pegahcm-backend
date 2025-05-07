import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import roleRoutes from './routes/roleRoutes';
import employeeRoutes from './routes/employeeRoutes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/employees', employeeRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to PegaHCM API' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 