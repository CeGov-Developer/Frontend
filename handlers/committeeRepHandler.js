

const { getListAcRepresentationBodies } = require('../queries/CommitteeRepQueries');
const { getEmpIdByDevice } = require('../queries/BiometricQueries');



module.exports = async function committeeRepHandler(req, res) {
    try {
         const deviceId = req.body.deviceId || req.body.deviceid;
        const notificationToken = req.body.notificationId || req.body.notificationid;

        const empId = await getEmpIdByDevice(deviceId, notificationToken);
      const committeeRepInfo = await getListAcRepresentationBodies(empId);
    
      //console.log(committeeRepInfo);
      res.json({ success: true, data: committeeRepInfo });
    } catch (error) {
      console.error('Error fetching committeeRepInfo:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };