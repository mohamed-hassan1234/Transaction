import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import guarantorRoutes from './routes/guarantors.js';
import transactionRoutes from './routes/transactions.js';
import settingsRoutes from './routes/settings.js';
import reportRoutes from './routes/reports.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();
const app = express();
const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true); // allow all origins dynamically
  },
  credentials: true, // allow cookies
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/guarantors', guarantorRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
import taxLogRoutes from './routes/taxLogRoutes.js';
app.use('/api/taxlogs', taxLogRoutes);
import dashboardRoutes from "./routes/dashboardRoutes.js";
app.use("/api/dashboard", dashboardRoutes);
 
import withdrawRoutes from "./routes/withdrawRoutes.js";
app.use("/api/withdraw", withdrawRoutes);

// error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/finance_db';

mongoose.connect(MONGO, { })
  .then(() => {
    console.log('Mongo connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Mongo connection error', err);
    process.exit(1);
  });
