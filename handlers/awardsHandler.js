const { getEmpIdByDevice, getAwardsByEmpId } = require('../queries/awardsQueries');

module.exports = async function awardsHandler(req, res) {
  const { deviceid, notificationid } = req.body;
  //console.log('Received request:', req.body);
  if (!deviceid || !notificationid) {
    return res.status(400).json({ success: false, message: 'deviceid and notificationid are required' });
  }

  try {
    const empId = await getEmpIdByDevice(deviceid, notificationid);
    if (!empId) {
      return res.status(404).json({ success: false, message: 'No employee found for this device/notification token' });
    }

    const awardsData = await getAwardsByEmpId(empId);
    res.json({ success: true, data: awardsData });
  } catch (error) {
    console.error('Error fetching awards:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};