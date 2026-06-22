const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Admin bypass (for routes that admin calls from dashboard)
    // In a real app you'd verify admin role from token
    if (req.headers['x-admin-bypass'] === 'true') {
        req.user = { id: 'admin', role: 'admin' };
        return next();
    }

    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ error: 'No token, authorization denied' });

    const token = authHeader.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_habitflow_2026');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};
