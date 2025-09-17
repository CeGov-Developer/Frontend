const { getEmpIdByDevice, insertTask } = require('../queries/taskQueries');

async function taskHandler(req, res) {
    console.log('Received request to /api/tasks with body:', req.body);
    const { date, time, description, deviceId, notificationToken } = req.body;
    if (!deviceId || !notificationToken) {
        console.log('Missing deviceId or notificationToken');
        return res.status(400).json({ success: false, message: 'deviceId and notificationToken are required' });
    }

    try {
        const empid = await getEmpIdByDevice(deviceId, notificationToken);
        if (!empid) {
            return res.status(404).json({ success: false, message: 'Employee not found for device' });
        }
        // Insert the task with the provided date, time, and description
        const eventId = await insertTask(empid, date, time, description);
        res.json({ success: true, eventId });
    } catch (err) {
        console.error('Error in /api/tasks:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = taskHandler;