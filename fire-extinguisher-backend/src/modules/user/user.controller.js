const db = require('../../config/db');

const mapUser = (row) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  role: row.role,
  phone: row.phone,
});

const getAllUsers = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const countResult = await db.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT id, first_name, last_name, email, role, phone 
       FROM users 
       ORDER BY id DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: result.rows.map(mapUser),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const promoteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'User not found.',
        timestamp: new Date().toISOString(),
      });
    }

    if (user.role === 'ROLE_ADMIN') {
      return res.status(403).json({
        status: 403,
        message: 'Cannot change admin role',
        timestamp: new Date().toISOString(),
      });
    }

    const newRole = user.role === 'ROLE_USER' ? 'ROLE_INSPECTOR' : 'ROLE_USER';

    const updateResult = await db.query(
      `UPDATE users 
       SET role = $1 
       WHERE id = $2 
       RETURNING id, first_name, last_name, email, role, phone`,
      [newRole, id]
    );

    res.status(200).json(mapUser(updateResult.rows[0]));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  promoteUser,
};
