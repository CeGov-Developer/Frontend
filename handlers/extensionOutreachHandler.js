const { getEmpIdByDevice, getExtensionOutreachByEmpId } = require('../queries/extensionOutreachQueries');

module.exports = async function extensionOutreachHandler(req, res) {
  const { deviceid, notificationid } = req.body;
//console.log(req.body);
  if (!deviceid || !notificationid) {
    return res.status(400).json({ success: false, message: 'deviceid and notificationid are required' });
  }

  try {
    const empId = await getEmpIdByDevice(deviceid, notificationid);
    if (!empId) {
      return res.status(404).json({ success: false, message: 'No employee found for this device/notification token' });
    }

    const outreachData = await getExtensionOutreachByEmpId(empId);
    //console.log("outreachData", outreachData);
    res.json({ success: true, data: outreachData });
  } catch (error) {
    console.error('Error fetching extension outreach:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};