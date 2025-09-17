const { registerDevice, checkDevice } = require('../queries/deviceQueries');
const { getEmployeeInfo } = require('../queries/employeeQueries');
const { getStaffPhoto } = require('../queries/photoQueries');

const { getUserByUsername, getStudentUserByUsername, getStudentInfo, getStudentPhoto, getEmployeeContact, getStudentContact, getDepartmentDetails } = require('../queries/loginQueries');

module.exports = async function deviceHandler(req, res) {
  const { deviceId, notificationToken } = req.body;
console.log(deviceId, notificationToken);
  if (!deviceId || !notificationToken) {
    return res.status(400).json({ success: false, message: 'deviceId and notificationToken are required' });
  }
  
  try {
    if (req.path === '/api/deviceRegister') {
      const result = await registerDevice(deviceId, notificationToken);
      console.log('Device Register Result:', result);
      if (result) {
        res.json({ success: true, message: 'Device registered successfully' });
      } else {
        if(!result && result.newId) {
          res.status(400).json({ success: true, message: 'Device registration failed', newId: result.newId });
        }
        else {
          res.status(400).json({ success: false, message: 'Device registration failed' });
        }
      }
    } else if (req.path === '/api/deviceCheck') {
      const result = await checkDevice(deviceId, notificationToken);
      console.log('Device Check Result:', result);
      if (result.status === 1) {
        // Fetch employee details using deviceId as empId
        let employeeDetails = await getEmployeeInfo(result.empId);
        if(employeeDetails === null) {
        const studentInfo = await getStudentInfo(result.empId);
         photo = await getStudentPhoto(result.empId);
         return res.json({
          success: true,
          loggedin: true,
          message: 'Device registered and logged in',
          campus: studentInfo.campus.FC_CAMP_NAME,
          branch: studentInfo.branch.FB_BRANCH_NAME,
          course: studentInfo.degree.FDG_SHORT_NAME,
          contact: studentInfo.personal,
          address: studentInfo.address,
          bloodgroup: studentInfo.bloodGroupName,
          employeeDets: studentInfo,
          photo: photo, 
          userType: 'student'
        });
        }
        else{
      const empInfo = await getEmployeeInfo(result.empId);
      // Fetch staff photo from AC_STAFF_PHOTO
      const photo = await getStaffPhoto(result.empId);
      // Fetch employee contact
      const empContact = await getEmployeeContact(result.empId);
      console.log('Employee Contact:', empContact);
      
      // Fetch department details using empInfo.EM_DEPT_CODE and empInfo.EM_CAMP_CODE
      let deptDetails = null;
      if (empInfo && empInfo.EM_DEPT_CODE && empInfo.EM_CAMP_CODE) {
        deptDetails = await getDepartmentDetails(empInfo.EM_DEPT_CODE, empInfo.EM_CAMP_CODE);
      }
      return res.json({
          success: true,
          loggedin: true,
          message: 'Device registered and logged in',
          employeeDets: employeeDetails,
          photo: photo,
        contact: empContact,
        department: deptDetails,
        userType: 'staff'
        });
        }
        
      } else if (result.status === 2) {
        return res.json({ success: true, loggedin: false, message: 'Device registered but not logged in' });
      } else  if (result.status === 3 || result.status === 0) {
        res.json({ success: false, message: 'Device has not been registered' });
      }
    } else {
      res.json({ success: false, error: 'Invalid endpoint' });
    }
  } catch (error) {
    console.error('Error in device handler:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }

  
};