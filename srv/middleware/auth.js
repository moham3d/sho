function requireAuth(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

function requireRole(role) {
    return function(req, res, next) {
        if (req.session.userId && req.session.role === role) {
            return next();
        }
        res.status(403).send('Access denied');
    };
}

module.exports = { requireAuth, requireRole };