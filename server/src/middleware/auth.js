const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
};

const requireStaff = (req, res, next) => {
  if (!req.session.user || !['admin', 'teacher'].includes(req.session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
};

module.exports = { requireAuth, requireAdmin, requireStaff };
