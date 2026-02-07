/**
 * Middleware לבדיקת הרשאות לפי תפקיד
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'לא מאומת' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'אין לך הרשאה לבצע פעולה זו'
      });
    }

    next();
  };
};

/**
 * בדיקת הרשאה ספציפית לפי resource ו-action
 */
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'לא מאומת' });
      }

      // Super admin יש גישה לכל דבר
      if (req.user.role === 'super_admin') {
        return next();
      }

      // TODO: בדיקה מול Role model כאשר הוא מוגדר
      // כרגע, בדיקה בסיסית לפי תפקיד
      const rolePermissions = {
        admin: {
          leads: ['view', 'create', 'update', 'delete'],
          customers: ['view', 'create', 'update', 'delete'],
          courses: ['view', 'create', 'update', 'delete'],
          workshops: ['view', 'create', 'update', 'delete'],
          events: ['view', 'create', 'update', 'delete'],
          accounting: ['view', 'create', 'update'],
          campaigns: ['view', 'create', 'update', 'delete'],
          users: ['view', 'create', 'update'],
          config: ['view', 'update'],
          knowledge_base: ['view', 'create', 'update', 'delete'],
        },
        instructor: {
          courses: ['view', 'update'],
          workshops: ['view', 'update'],
          events: ['view', 'update'],
          customers: ['view'],
        },
        sales: {
          leads: ['view', 'create', 'update'],
          customers: ['view', 'create', 'update'],
          courses: ['view'],
          workshops: ['view'],
          events: ['view', 'create', 'update'],
        },
        admin_staff: {
          leads: ['view', 'create', 'update'],
          customers: ['view', 'create', 'update'],
          courses: ['view'],
          workshops: ['view'],
          events: ['view', 'create', 'update'],
          accounting: ['view'],
        },
      };

      const permissions = rolePermissions[req.user.role] || {};
      const resourcePermissions = permissions[resource] || [];

      if (!resourcePermissions.includes(action)) {
        return res.status(403).json({
          message: `אין לך הרשאה ל-${action} ב-${resource}`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בבדיקת הרשאות' });
    }
  };
};

module.exports = {
  authorize,
  checkPermission,
};
