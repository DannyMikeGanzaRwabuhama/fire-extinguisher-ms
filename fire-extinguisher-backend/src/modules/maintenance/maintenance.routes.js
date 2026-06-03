const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const maintenanceController = require('./maintenance.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Maintenance
 *   description: Logging maintenance history and actions taken
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Maintenance:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         inspectionId:
 *           type: integer
 *           example: 2
 *         inspectorId:
 *           type: integer
 *           example: 2
 *         actions:
 *           type: string
 *           example: "Recharged CO2 cylinder, replaced nozzle safety seal."
 *         maintenanceDate:
 *           type: string
 *           format: date
 *           example: "2026-05-10"
 *         conditionsNoted:
 *           type: string
 *           example: "Extinguisher pressure was slightly low."
 *     MaintenanceListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Maintenance'
 *         total:
 *           type: integer
 *           example: 2
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         totalPages:
 *           type: integer
 *           example: 1
 */

/**
 * @swagger
 * /api/maintenance:
 *   post:
 *     summary: Create a new maintenance record (Admin/Inspector)
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inspectionId
 *               - actions
 *               - conditionsNoted
 *             properties:
 *               inspectionId:
 *                 type: integer
 *               actions:
 *                 type: string
 *               conditionsNoted:
 *                 type: string
 *               maintenanceDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Maintenance logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Maintenance'
 *       404:
 *         description: Inspection not found
 */
router.post('/', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN', 'ROLE_INSPECTOR'),
  body('inspectionId').isInt().withMessage('Inspection ID must be an integer'),
  body('actions').trim().notEmpty().withMessage('Actions performed are required'),
  body('conditionsNoted').trim().notEmpty().withMessage('Conditions noted are required'),
  body('maintenanceDate').optional().isISO8601().withMessage('Maintenance date must be a valid date'),
  validate
], maintenanceController.createMaintenance);

/**
 * @swagger
 * /api/maintenance:
 *   get:
 *     summary: Retrieve a paginated list of maintenance logs (All Users)
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MaintenanceListResponse'
 */
router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], maintenanceController.getAllMaintenance);

/**
 * @swagger
 * /api/maintenance/{id}:
 *   get:
 *     summary: Retrieve a maintenance log by ID (All Users)
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Maintenance'
 *       404:
 *         description: Maintenance log not found
 */
router.get('/:id', [
  authenticateToken
], maintenanceController.getMaintenanceById);

/**
 * @swagger
 * /api/maintenance/{id}:
 *   put:
 *     summary: Update a maintenance record (Admin/Inspector)
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actions:
 *                 type: string
 *               conditionsNoted:
 *                 type: string
 *               maintenanceDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Maintenance updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Maintenance'
 *       404:
 *         description: Maintenance log not found
 */
router.put('/:id', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN', 'ROLE_INSPECTOR'),
  body('actions').optional().trim().notEmpty().withMessage('Actions cannot be empty'),
  body('conditionsNoted').optional().trim().notEmpty().withMessage('Conditions noted cannot be empty'),
  body('maintenanceDate').optional().isISO8601().withMessage('Maintenance date must be a valid date'),
  validate
], maintenanceController.updateMaintenance);

module.exports = router;
