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

  const requiredEnvVars = ['PORT', 'CLIENT_URL', 'MONGODB_URL'];
  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  }

  const app = express();
  const server = http.createServer(app);

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
    })
  );


  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);

  app.use(passport.initialize());
  require('./config/passport');

  const authRoutes = require('./routes/user');
  const cardRoutes = require('./routes/cardroutes');
  const oauthRoutes = require('./routes/oauthRoute');
  const notificationRoutes = require('./routes/notificationRoutes');

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/card', cardRoutes);
  app.use('/api/v1/auth/oauth', oauthRoutes);
  app.use('/api/v1/notifications', notificationRoutes);

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
  });

  app.get('/', (req, res) => {
    res.status(200).send('✅ Auth Server Running');
  });

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

  connectDB();

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
  });

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

  process.on('uncaughtException', () => {
    shutdown();
  });

  process.on('unhandledRejection', () => {
    shutdown();
  });
