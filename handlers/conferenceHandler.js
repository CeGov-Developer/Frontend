const { getEmpIdByDevice, getConferenceDataByEmpId } = require('../queries/conferenceQueries');

const TABLE_MAP = {
  confAttended: { table: 'AC_CONF_ATTENDED', empCol: 'ACA_EMPID' },
  confChaired: { table: 'AC_CONF_CHAIRED', empCol: 'ACC_EMPID' },
  confOrganized: { table: 'AC_CONF_ORGANIZED', empCol: 'ACO_EMPID' },
  confPresentation: { table: 'AC_CONF_PRESENTATION', empCol: 'ACP_EMPID' }
};

module.exports = async function conferenceHandler(req, res) {
    //console.log(req);
    const { type } = req.params; // expects /api/conference/:type
  const { deviceid, notificationid } = req.body;

  if (!deviceid || !notificationid) {
    return res.status(400).json({ success: false, message: 'deviceid and notificationid are required' });
  }
  if (!TABLE_MAP[type]) {
    return res.status(400).json({ success: false, message: 'Invalid conference type' });
  }

  try {
    const empId = await getEmpIdByDevice(deviceid, notificationid);
    if (!empId) {
      return res.status(404).json({ success: false, message: 'No employee found for this device/notification token' });
    }
    const { table, empCol } = TABLE_MAP[type];
    const data = await getConferenceDataByEmpId(table, empCol, empId);
    res.json({ success: true, data });
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};