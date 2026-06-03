const { verifyToken } = require('../config/jwt');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 401,
      message: 'Access token is missing or invalid',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Attach { userId, role } to req.user
    next();
  } catch (error) {
    return res.status(401).json({
      status: 401,
      message: 'Invalid or expired access token',
      timestamp: new Date().toISOString(),
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 403,
        message: 'Forbidden: You do not have permission to perform this action',
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
