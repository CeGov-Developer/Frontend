

const crypto = require('crypto');
const {
  getUserByUsername,
  getStudentUserByUsername,
  getStudentInfo,
  getStudentPhoto,
  getEmployeeContact,
  getStudentContact,
  getDepartmentDetails
} = require('../queries/loginQueries');

const { getEmployeeInfo } = require('../queries/employeeQueries');
const { getStaffPhoto } = require('../queries/photoQueries');
const {
  updateEmployeeIdForDevice,
  resetLoginStatusIfActive
} = require('../queries/deviceQueries');

module.exports = async function loginHandler(req, res) {
  const { username, password, deviceId, notificationToken } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const hashedPassword = crypto.createHash('md5').update(password).digest('hex');

  try {
    /** ========== STAFF LOGIN ========== */
    const user = await getUserByUsername(username);
    if (user) {
      const correctPwd = user.AL_PASSWORD || user.AL_PWD;
      if (correctPwd == hashedPassword) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }

      await resetLoginStatusIfActive(username);

      const empInfo = await getEmployeeInfo(username);
      if (!empInfo) {
        return res.status(404).json({
          success: false,
          message: 'Employee details not found. Please contact admin or visit www.auegov.ac.in'
        });
      }

      const photo = await getStaffPhoto(username).catch(() => null);
      const empContact = await getEmployeeContact(username).catch(() => null);

      let deptDetails = null;
      if (empInfo.EM_DEPT_CODE && empInfo.EM_CAMP_CODE) {
        deptDetails = await getDepartmentDetails(empInfo.EM_DEPT_CODE, empInfo.EM_CAMP_CODE).catch(() => null);
      }

      if (deviceId && notificationToken) {
        await updateEmployeeIdForDevice(deviceId, notificationToken, username).catch(console.error);
      }

      return res.json({
        success: true,
        message: 'Login successful',
        user,
        info: empInfo,
        photo,
        contact: empContact,
        department: deptDetails,
        userType: 'staff'
      });
    }

    /** ========== STUDENT LOGIN ========== */
    const studentUser = await getStudentUserByUsername(username);
    if (studentUser) {
      const correctPwd = studentUser.AFL_PASSWORD || studentUser.AFL_PWD;
      if (correctPwd ==hashedPassword) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }

      const studentInfo = await getStudentInfo(username);
      if (!studentInfo || studentInfo.error) {
        return res.status(404).json({
          success: false,
          message: 'Student not found in current session. Please visit www.auegov.ac.in'
        });
      }

      await resetLoginStatusIfActive(username).catch(console.error);
      const studentPhoto = await getStudentPhoto(username).catch(() => null);

      if (deviceId && notificationToken) {
        await updateEmployeeIdForDevice(deviceId, notificationToken, username).catch(console.error);
      }

      return res.json({
        success: true,
        message: 'Login successful',
        user: studentUser,
        info: studentInfo,
        photo: studentPhoto,
        campus: studentInfo.campus?.FC_CAMP_NAME,
        branch: studentInfo.branch?.FB_BRANCH_NAME,
        course: studentInfo.degree?.FDG_SHORT_NAME,
        contact: studentInfo.personal,
        address: studentInfo.address,
        bloodgroup: studentInfo.bloodGroupName,
        userType: 'student'
      });
    }

    /** ========== NOT FOUND ========== */
    return res.status(401).json({ success: false, message: 'User not found' });

  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};
