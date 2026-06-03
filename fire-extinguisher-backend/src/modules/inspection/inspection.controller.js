const db = require('../../config/db');

const mapInspection = (row) => ({
  id: row.id,
  userId: row.user_id,
  extinguisherId: row.extinguisher_id,
  inspectorId: row.inspector_id,
  inspectionDate: row.inspection_date,
  inspectionTime: row.inspection_time,
  status: row.status,
  user: row.user_email ? {
    id: row.user_id,
    firstName: row.user_first_name,
    lastName: row.user_last_name,
    email: row.user_email,
  } : undefined,
  inspector: row.inspector_email ? {
    id: row.inspector_id,
    firstName: row.inspector_first_name,
    lastName: row.inspector_last_name,
    email: row.inspector_email,
  } : undefined,
  extinguisher: row.serial_number ? {
    id: row.extinguisher_id,
    serialNumber: row.serial_number,
    location: row.location,
    type: row.type,
    size: row.size,
  } : undefined,
});

const createInspection = async (req, res, next) => {
  const { extinguisherId, inspectorId, inspectionDate, inspectionTime, status } = req.body;
  const initialStatus = status || 'SCHEDULED';
  const userId = req.user.userId;

  try {
    // 1. Verify extinguisher exists
    const extCheck = await db.query('SELECT id FROM extinguishers WHERE id = $1', [extinguisherId]);
    if (extCheck.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Extinguisher not found',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Check no existing SCHEDULED inspection for same extinguisher + same date + time
    const dupCheck = await db.query(
      `SELECT id FROM inspections 
       WHERE extinguisher_id = $1 
         AND inspection_date = $2 
         AND inspection_time = $3 
         AND status = 'SCHEDULED'`,
      [extinguisherId, inspectionDate, inspectionTime]
    );

    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        status: 409,
        message: 'Conflict: An inspection is already scheduled for this extinguisher at the specified date and time.',
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Insert inspection
    const result = await db.query(
      `INSERT INTO inspections (user_id, extinguisher_id, inspector_id, inspection_date, inspection_time, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, extinguisherId, inspectorId || null, inspectionDate, inspectionTime, initialStatus]
    );

    res.status(201).json(mapInspection(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

const getAllInspections = async (req, res, next) => {
  const statusFilter = req.query.status;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    let countQuery = 'SELECT COUNT(*) FROM inspections';
    let dataQuery = `
      SELECT i.*, 
             u.first_name AS user_first_name, u.last_name AS user_last_name, u.email AS user_email,
             ins.first_name AS inspector_first_name, ins.last_name AS inspector_last_name, ins.email AS inspector_email,
             e.serial_number, e.location, e.type, e.size
      FROM inspections i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN users ins ON i.inspector_id = ins.id
      LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
    `;
    const params = [];
    const countParams = [];

    if (statusFilter) {
      countQuery += ' WHERE status = $1';
      dataQuery += ' WHERE i.status = $1';
      params.push(statusFilter);
      countParams.push(statusFilter);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    dataQuery += ` ORDER BY i.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(dataQuery, params);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: result.rows.map(mapInspection),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const getInspectionById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT i.*, 
             u.first_name AS user_first_name, u.last_name AS user_last_name, u.email AS user_email,
             ins.first_name AS inspector_first_name, ins.last_name AS inspector_last_name, ins.email AS inspector_email,
             e.serial_number, e.location, e.type, e.size
      FROM inspections i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN users ins ON i.inspector_id = ins.id
      LEFT JOIN extinguishers e ON i.extinguisher_id = e.id
      WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Inspection not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json(mapInspection(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

const updateInspectionStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await db.query(
      `UPDATE inspections 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Inspection not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json(mapInspection(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInspection,
  getAllInspections,
  getInspectionById,
  updateInspectionStatus,
};
