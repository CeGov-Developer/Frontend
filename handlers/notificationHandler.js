const { getNotifications } = require('../queries/notificationQueries');

module.exports = async function notificationHandler(req, res) {
  try {
    const notifications = await getNotifications();
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};