const db = require('../../config/db');

const mapMaintenance = (row) => ({
  id: row.id,
  inspectionId: row.inspection_id,
  inspectorId: row.inspector_id,
  actions: row.actions,
  maintenanceDate: row.maintenance_date,
  conditionsNoted: row.conditions_noted,
  inspector: row.inspector_email ? {
    id: row.inspector_id,
    firstName: row.inspector_first_name,
    lastName: row.inspector_last_name,
    email: row.inspector_email,
  } : undefined,
  inspection: row.extinguisher_id ? {
    id: row.inspection_id,
    inspectionDate: row.inspection_date,
    status: row.status,
    extinguisherId: row.extinguisher_id,
    serialNumber: row.serial_number,
  } : undefined,
});

const createMaintenance = async (req, res, next) => {
  const { inspectionId, actions, conditionsNoted, maintenanceDate } = req.body;
  const inspectorId = req.user.userId;
  const date = maintenanceDate || new Date().toISOString().split('T')[0];

  try {
    // 1. Verify inspection exists and fetch details
    const inspCheck = await db.query(
      `SELECT i.status AS inspection_status, i.inspector_id, e.status AS extinguisher_status, e.expiry_date 
       FROM inspections i 
       JOIN extinguishers e ON i.extinguisher_id = e.id 
       WHERE i.id = $1`,
      [inspectionId]
    );
    if (inspCheck.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Inspection not found',
        timestamp: new Date().toISOString(),
      });
    }
    const insp = inspCheck.rows[0];

    // Check extinguisher status
    const isExpired = insp.extinguisher_status === 'EXPIRED' || new Date(insp.expiry_date) < new Date();
    if (isExpired || insp.extinguisher_status === 'DECOMMISSIONED') {
      return res.status(400).json({
        status: 400,
        message: 'Bad Request: Cannot log maintenance on an expired or decommissioned extinguisher.',
        timestamp: new Date().toISOString(),
      });
    }

    // Check inspection is completed
    if (insp.inspection_status !== 'COMPLETED') {
      return res.status(400).json({
        status: 400,
        message: 'Bad Request: Cannot log maintenance on an inspection that is not completed.',
        timestamp: new Date().toISOString(),
      });
    }

    // If Inspector role, check inspection is assigned to them
    if (req.user.role === 'ROLE_INSPECTOR' && insp.inspector_id !== req.user.userId) {
      return res.status(403).json({
        status: 403,
        message: 'Forbidden: You cannot log maintenance for an inspection not assigned to you.',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Insert maintenance record
    const result = await db.query(
      `INSERT INTO maintenance (inspection_id, inspector_id, actions, maintenance_date, conditions_noted)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [inspectionId, inspectorId, actions, date, conditionsNoted]
    );

    res.status(201).json(mapMaintenance(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

const getAllMaintenance = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const countResult = await db.query('SELECT COUNT(*) FROM maintenance');
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT m.*, 
             u.first_name AS inspector_first_name, u.last_name AS inspector_last_name, u.email AS inspector_email,
             i.inspection_date, i.status, i.extinguisher_id,
             e.serial_number
      FROM maintenance m
      LEFT JOIN users u ON m.inspector_id = u.id
      LEFT JOIN inspections i ON m.inspection_id = i.id
      LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
      ORDER BY m.id DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: result.rows.map(mapMaintenance),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const getMaintenanceById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT m.*, 
             u.first_name AS inspector_first_name, u.last_name AS inspector_last_name, u.email AS inspector_email,
             i.inspection_date, i.status, i.extinguisher_id,
             e.serial_number
      FROM maintenance m
      LEFT JOIN users u ON m.inspector_id = u.id
      LEFT JOIN inspections i ON m.inspection_id = i.id
      LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
      WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Maintenance record not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json(mapMaintenance(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

const updateMaintenance = async (req, res, next) => {
  const { id } = req.params;
  const fields = req.body;

  try {
    const maintCheck = await db.query(
      `SELECT m.*, e.status AS extinguisher_status, e.expiry_date AS extinguisher_expiry_date 
       FROM maintenance m
       JOIN inspections i ON m.inspection_id = i.id
       JOIN extinguishers e ON i.extinguisher_id = e.id
       WHERE m.id = $1`,
      [id]
    );
    if (maintCheck.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Maintenance record not found',
        timestamp: new Date().toISOString(),
      });
    }
    const extStatus = maintCheck.rows[0].extinguisher_status;
    const extExpiry = maintCheck.rows[0].extinguisher_expiry_date;
    const isExpired = extStatus === 'EXPIRED' || new Date(extExpiry) < new Date();
    if (isExpired || extStatus === 'DECOMMISSIONED') {
      return res.status(400).json({
        status: 400,
        message: 'Bad Request: Cannot update maintenance record on an expired or decommissioned extinguisher.',
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.role === 'ROLE_INSPECTOR' && maintCheck.rows[0].inspector_id !== req.user.userId) {
      return res.status(403).json({
        status: 403,
        message: 'Forbidden: You cannot modify maintenance records not logged by you.',
        timestamp: new Date().toISOString(),
      });
    }

    const existing = maintCheck.rows[0];

    const keyMapping = {
      actions: 'actions',
      conditionsNoted: 'conditions_noted',
      maintenanceDate: 'maintenance_date',
    };

    const updateFields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (keyMapping[key] !== undefined && value !== undefined) {
        updateFields.push(`${keyMapping[key]} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(200).json(mapMaintenance(existing.rows[0]));
    }

    values.push(id);
    const queryText = `
      UPDATE maintenance 
      SET ${updateFields.join(', ')} 
      WHERE id = $${index} 
      RETURNING *`;

    const result = await db.query(queryText, values);
    res.status(200).json(mapMaintenance(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMaintenance,
  getAllMaintenance,
  getMaintenanceById,
  updateMaintenance,
};
