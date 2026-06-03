const db = require('../../config/db');

const mapNotification = (row) => ({
  id: row.id,
  userId: row.user_id,
  message: row.message,
  createdAt: row.created_at,
  isRead: row.is_read,
});

const getMyNotifications = async (req, res, next) => {
  const userId = req.user.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const countResult = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY id DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: result.rows.map(mapNotification),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Notification not found or access denied',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json(mapNotification(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
};
