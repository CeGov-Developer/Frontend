const { getEmpIdByDevice, getForeignVisitByEmpId } = require('../queries/foreignVisitQueries');

module.exports = async function foreignVisitHandler(req, res) {
  const { deviceid, notificationid } = req.body;
  if (!deviceid || !notificationid) {
    return res.status(400).json({ success: false, message: 'deviceid and notificationid are required' });
  }

  try {
    const empId = await getEmpIdByDevice(deviceid, notificationid);
    if (!empId) {
      return res.status(404).json({ success: false, message: 'No employee found for this device/notification token' });
    }

    const foreignVisitData = await getForeignVisitByEmpId(empId);
    res.json({ success: true, data: foreignVisitData });
  } catch (error) {
    console.error('Error fetching foreign visit:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};