const express = require('express');
const { query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const reportsController = require('./reports.controller');

const router = express.Router();

router.get('/extinguishers/stock', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN'),
  query('format').optional().isIn(['json', 'pdf', 'csv']).withMessage('Invalid format'),
  query('period').optional().isIn(['daily', 'monthly', 'yearly']).withMessage('Invalid period'),
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], reportsController.getStockReport);

router.get('/inspections/status', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN'),
  query('format').optional().isIn(['json', 'pdf', 'csv']).withMessage('Invalid format'),
  query('status').optional().isIn(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  query('from').optional().isISO8601().withMessage('Invalid from date'),
  query('to').optional().isISO8601().withMessage('Invalid to date'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], reportsController.getInspectionStatusReport);

router.get('/extinguishers/expired', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN'),
  query('format').optional().isIn(['json', 'pdf', 'csv']).withMessage('Invalid format'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], reportsController.getExpiredReport);

router.get('/maintenance/history', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN'),
  query('format').optional().isIn(['json', 'pdf', 'csv']).withMessage('Invalid format'),
  query('extinguisherId').optional().isInt().toInt(),
  query('from').optional().isISO8601().withMessage('Invalid from date'),
  query('to').optional().isISO8601().withMessage('Invalid to date'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], reportsController.getMainMaintenanceHistoryReport);

router.get('/compliance', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN'),
  query('format').optional().isIn(['json', 'pdf', 'csv']).withMessage('Invalid format'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], reportsController.getComplianceReport);

module.exports = router;
