const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');
const http = require('http');
const { connect: connectDB } = require('./config/database');

dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['PORT', 'CLIENT_URL', 'MONGODB_URL'];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing environment variables: ${missingEnvVars.join(', ')}`
  );
}

const app = express();
const server = http.createServer(app);

// Basic security & performance middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    exposedHeaders: ['Content-Disposition']
  })
);

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Passport initialization
// app.use(passport.initialize());
// require('./config/passport');
// === ROUTES ===
const authRoutes = require('./routes/user');
// const googleRoutes = require('./routes/googleAuthRoutes');
const cardRoutes = require('./routes/cardroutes');
const oauthRoutes = require('./routes/oauthRoute');
const profileRoutes = require('./routes/profileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const groupInvitationRoutes = require('./routes/groupInvitationRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const cronRoutes = require('./routes/cronRoutes');
const yodleeRoutes = require('./routes/yodlee');

app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/auth/google', googleRoutes);
app.use('/api/v1/card', cardRoutes);
app.use('/api/v1/auth/oauth', oauthRoutes);
app.use('/api/profile', profileRoutes); // <-- profile route for image upload
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/group/invitation', groupInvitationRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/cron', cronRoutes);
app.use('/api/v1/yodlee', yodleeRoutes);

// startCronJob();



// === Health Check ===
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// === Root Route ===
app.get('/', (req, res) => {
  res.status(200).send('✅ Auth Server Running');
});

// === Error Handling Middleware ===
app.use((err, _req, res, _next) => {
  console.error(`Error: ${err.stack}`);
  res.status(err.status || 500).json({
    error: {
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal Server Error'
          : err.message,
    },
  });
});

// === Connect to MongoDB ===
connectDB();
// startCronJob();
// === Start Server ===
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(
    `🚀 Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`
  );
});

// === Graceful Shutdown ===
const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => {
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', shutdown);
process.on('unhandledRejection', shutdown);
