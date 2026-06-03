const express = require('express');
const { query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const reportsController = require('./reports.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Analytical reports for fire extinguishers (Admin only)
 */

/**
 * @swagger
 * /api/reports/extinguishers/stock:
 *   get:
 *     summary: Retrieve total extinguishers stock status (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf, csv]
 *           default: json
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, monthly, yearly]
 *           default: monthly
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success (Returns paginated JSON, or downloads CSV/PDF file stream)
 */
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

/**
 * @swagger
 * /api/reports/inspections/status:
 *   get:
 *     summary: Retrieve inspections status logs summary (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf, csv]
 *           default: json
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, ONGOING, COMPLETED, CANCELLED]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success (Returns paginated JSON, or downloads CSV/PDF file stream)
 */
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

/**
 * @swagger
 * /api/reports/extinguishers/expired:
 *   get:
 *     summary: Retrieve a list of expired fire extinguishers (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf, csv]
 *           default: json
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success (Returns paginated JSON, or downloads CSV/PDF file stream)
 */
router.get('/extinguishers/expired', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN'),
  query('format').optional().isIn(['json', 'pdf', 'csv']).withMessage('Invalid format'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], reportsController.getExpiredReport);

/**
 * @swagger
 * /api/reports/maintenance/history:
 *   get:
 *     summary: Retrieve history log of performed maintenance actions (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf, csv]
 *           default: json
 *       - in: query
 *         name: extinguisherId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success (Returns paginated JSON, or downloads CSV/PDF file stream)
 */
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

/**
 * @swagger
 * /api/reports/compliance:
 *   get:
 *     summary: Retrieve a compliance report of extinguishers with no COMPLETED inspection in the last 12 months (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf, csv]
 *           default: json
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success (Returns paginated JSON, or downloads CSV/PDF file stream)
 */
router.get('/compliance', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN'),
  query('format').optional().isIn(['json', 'pdf', 'csv']).withMessage('Invalid format'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], reportsController.getComplianceReport);

module.exports = router;
