import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import sequelize from './config/database';
import { authLimiter, generalLimiter } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import studentRoutes from './routes/students';
import subjectRoutes from './routes/subjects';
import resultRoutes from './routes/results';
import reportRoutes from './routes/reports';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/reports', reportRoutes);

// API documentation (in development)
if (process.env.NODE_ENV === 'development') {
  import swaggerJsdoc from 'swagger-jsdoc';
  import swaggerUi from 'swagger-ui-express';

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Folusho Schools API',
        version: '1.0.0',
        description: 'API for Folusho Victory Schools Result Management System',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server',
        },
      ],
    },
    apis: ['./src/routes/*.ts'],
  };

  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join user to their role-based room
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // Handle real-time grade updates
  socket.on('grade-updated', (data) => {
    socket.to(`class-${data.className}`).emit('grade-change', data);
    socket.to(`parent-${data.studentId}`).emit('student-grade-updated', data);
  });

  // Handle attendance updates
  socket.on('attendance-updated', (data) => {
    socket.to(`class-${data.className}`).emit('attendance-change', data);
  });

  // Handle new notifications
  socket.on('notification', (data) => {
    socket.to(`user-${data.userId}`).emit('new-notification', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Sync database models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false });
      console.log('Database synchronized');
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
      }
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await sequelize.close();
      console.log('Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await sequelize.close();
      console.log('Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export { app, io };
