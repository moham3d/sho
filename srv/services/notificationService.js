class NotificationService {
    // Set notification in session
    static set(req, type, message) {
        req.session.notification = {
            type: type,
            message: message
        };
    }

    // Get notification from session and clear it
    static get(req) {
        const notification = req.session.notification;
        if (req.session.notification) {
            delete req.session.notification;
        }
        return notification;
    }
}

module.exports = NotificationService;