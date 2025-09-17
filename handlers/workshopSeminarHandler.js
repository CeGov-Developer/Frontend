const { getEmpIdByDevice, getWorkshopSeminarDataByEmpId } = require('../queries/workshopSeminarQueries');

const TABLE_MAP = {
  seminarPresentation: { table: 'AC_WSHOP_SEMINAR_PRESENTATION', empCol: 'AWSP_EMPID' },
  seminarOrganized: { table: 'AC_WSHOP_SEMINAR_ORGANIZED', empCol: 'AWSO_EMPID' },
  seminarAttended: { table: 'AC_WSHOP_SEMINAR_ATTENDED', empCol: 'AWSA_EMPID' }
};

module.exports = async function workshopSeminarHandler(req, res) {
    console.log('Received request for workshop/seminar type:', req.params.type);
  const { type } = req.params; // expects /api/workshopSeminar/:type
  const { deviceid, notificationid } = req.body;

  if (!deviceid || !notificationid) {
    return res.status(400).json({ success: false, message: 'deviceid and notificationid are required' });
  }
  if (!TABLE_MAP[type]) {
    return res.status(400).json({ success: false, message: 'Invalid workshop/seminar type' });
  }

  try {
    const empId = await getEmpIdByDevice(deviceid, notificationid);
    if (!empId) {
      return res.status(404).json({ success: false, message: 'No employee found for this device/notification token' });
    }
    const { table, empCol } = TABLE_MAP[type];
    const data = await getWorkshopSeminarDataByEmpId(table, empCol, empId);
    res.json({ success: true, data });
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};