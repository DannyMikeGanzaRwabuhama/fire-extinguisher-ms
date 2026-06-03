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
    // 1. Verify inspection exists
    const inspCheck = await db.query('SELECT id FROM inspections WHERE id = $1', [inspectionId]);
    if (inspCheck.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Inspection not found',
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
    const existing = await db.query('SELECT * FROM maintenance WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Maintenance record not found',
        timestamp: new Date().toISOString(),
      });
    }

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
