const db = require('../../config/db');

const mapExtinguisher = (row) => ({
  id: row.id,
  serialNumber: row.serial_number,
  location: row.location,
  type: row.type,
  size: row.size,
  installationDate: row.installation_date,
  expiryDate: row.expiry_date,
  status: row.status,
});

const autoUpdateExpired = async () => {
  await db.query(
    `UPDATE extinguishers 
     SET status = 'EXPIRED' 
     WHERE expiry_date < CURRENT_DATE AND status != 'EXPIRED'`
  );
};

const createExtinguisher = async (req, res, next) => {
  const { serialNumber, location, type, size, installationDate, expiryDate, status } = req.body;
  const initialStatus = status || 'OPERATIONAL';

  try {
    const existing = await db.query('SELECT id FROM extinguishers WHERE serial_number = $1', [serialNumber]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        status: 409,
        message: 'Conflict: Extinguisher with this serial number already exists.',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await db.query(
      `INSERT INTO extinguishers (serial_number, location, type, size, installation_date, expiry_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [serialNumber, location, type, size, installationDate, expiryDate, initialStatus]
    );

    res.status(201).json(mapExtinguisher(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

const getAllExtinguishers = async (req, res, next) => {
  try {
    await autoUpdateExpired();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await db.query('SELECT COUNT(*) FROM extinguishers');
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT * FROM extinguishers 
       ORDER BY id DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: result.rows.map(mapExtinguisher),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const getExtinguisherById = async (req, res, next) => {
  const { id } = req.params;

  try {
    await autoUpdateExpired();

    const result = await db.query('SELECT * FROM extinguishers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Extinguisher not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json(mapExtinguisher(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

const updateExtinguisher = async (req, res, next) => {
  const { id } = req.params;
  const fields = req.body;

  try {
    const existing = await db.query('SELECT * FROM extinguishers WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Extinguisher not found',
        timestamp: new Date().toISOString(),
      });
    }

    if (fields.serialNumber && fields.serialNumber !== existing.rows[0].serial_number) {
      const dup = await db.query('SELECT id FROM extinguishers WHERE serial_number = $1', [fields.serialNumber]);
      if (dup.rows.length > 0) {
        return res.status(409).json({
          status: 409,
          message: 'Conflict: Serial number is already in use.',
          timestamp: new Date().toISOString(),
        });
      }
    }

    const keyMapping = {
      serialNumber: 'serial_number',
      location: 'location',
      type: 'type',
      size: 'size',
      installationDate: 'installation_date',
      expiryDate: 'expiry_date',
      status: 'status',
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
      return res.status(200).json(mapExtinguisher(existing.rows[0]));
    }

    values.push(id);
    const queryText = `
      UPDATE extinguishers 
      SET ${updateFields.join(', ')} 
      WHERE id = $${index} 
      RETURNING *`;

    const result = await db.query(queryText, values);
    res.status(200).json(mapExtinguisher(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

const deleteExtinguisher = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM extinguishers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Extinguisher not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      status: 200,
      message: 'Extinguisher deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExtinguisher,
  getAllExtinguishers,
  getExtinguisherById,
  updateExtinguisher,
  deleteExtinguisher,
};
