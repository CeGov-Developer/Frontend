

const { getLeaveInfo } = require('../queries/LeaveQueries');
const { getEmpIdByDevice } = require('../queries/BiometricQueries');




module.exports = async function leaveHandler(req, res) {

 
    try {
        const deviceId = req.body.deviceId || req.body.deviceid;
        const notificationToken = req.body.notificationId || req.body.notificationId;

        const empId = await getEmpIdByDevice(deviceId, notificationToken);

      const LeaveInfo = await getLeaveInfo(empId);

      res.json({ success: true, data: LeaveInfo });
    } catch (error) {
      console.error('Error fetching LeaveInfo:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  
    
  

  

