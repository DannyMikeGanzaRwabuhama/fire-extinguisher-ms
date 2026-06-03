const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const maintenanceController = require('./maintenance.controller');

const router = express.Router();

router.post('/', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN', 'ROLE_INSPECTOR'),
  body('inspectionId').isInt().withMessage('Inspection ID must be an integer'),
  body('actions').trim().notEmpty().withMessage('Actions performed are required'),
  body('conditionsNoted').trim().notEmpty().withMessage('Conditions noted are required'),
  body('maintenanceDate').optional().isISO8601().withMessage('Maintenance date must be a valid date'),
  validate
], maintenanceController.createMaintenance);

router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], maintenanceController.getAllMaintenance);

router.get('/:id', [
  authenticateToken
], maintenanceController.getMaintenanceById);

router.put('/:id', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN', 'ROLE_INSPECTOR'),
  body('actions').optional().trim().notEmpty().withMessage('Actions cannot be empty'),
  body('conditionsNoted').optional().trim().notEmpty().withMessage('Conditions noted cannot be empty'),
  body('maintenanceDate').optional().isISO8601().withMessage('Maintenance date must be a valid date'),
  validate
], maintenanceController.updateMaintenance);

module.exports = router;
