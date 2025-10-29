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
// Add your allowed origins list here
const allowedOrigins = [
 // 1. Current IP for testing
 'http://104.251.212.197',
 // 2. Final domain names (MUST include the protocol)
"http://transaction.somsoftsystems.com", // <-- ADD HTTP
 "https://transaction.somsoftsystems.com", // <-- ADD HTTPS (CRITICAL)
];

const corsOptions = {
    // This function checks if the request origin is in our allowed list
    origin: (origin, callback) => {
        // If the origin is in the allowed list, or if it's undefined (common for same-origin or server-to-server requests), allow it.
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // allow cookies/tokens
};

app.use(cors(corsOptions)); // This line remains the same
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
