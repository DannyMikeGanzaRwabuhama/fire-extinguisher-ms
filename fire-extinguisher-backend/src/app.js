const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const extinguisherRoutes = require('./modules/extinguisher/extinguisher.routes');
const inspectionRoutes = require('./modules/inspection/inspection.routes');
const maintenanceRoutes = require('./modules/maintenance/maintenance.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const userRoutes = require('./modules/user/user.routes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'TZW Fire Extinguisher API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/modules/**/*.routes.js'],
};
const specs = swaggerJsDoc(options);

const morgan = require('morgan');

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use(morgan('dev'));

// Routes (Public permitAll and Protected routes)
// Note: /api/auth exposes public endpoints (register, login, verify-email, forgot-password, reset-password)
app.use('/api/auth', authRoutes);
app.use('/api/extinguishers', extinguisherRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', userRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 404,
    message: 'Resource not found',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use(errorHandler);

// DB and Server startup
const startServer = async () => {
  try {
    // Run db.js table creation, then run trigger SQL file (handled by initDb)
    await db.initDb();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
