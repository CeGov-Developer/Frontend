const { fetchBiometricInfoBydate,getEmpIdByDevice } = require('../queries/BiometricQueries');

module.exports = async function invBioHandler(req, res) {

    console.log('Received request:', req.body);
  try {


     const empId = await getEmpIdByDevice(req.body['deviceId'], req.body['notificationId']);
    console.log("empId:", empId);
    // Check if empId is found
    if (!empId) {
      return res.status(404).json({ success: false, message: 'No employee found for this device/notification token' });
    }
    // Sample date for testing (in 'YYYY-MM-DD' format)
    const sampleDate = req.body['date'];


    // Validate and convert date from 'YYYY-MM-DD' to 'DD/MM/YYYY'
    const dateParts = sampleDate.split('-');
    if (dateParts.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    const convertedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // Converts '2025-05-07' to '07/05/2025'

    // Fetch biometric information using the converted date
    const user = await fetchBiometricInfoBydate(convertedDate, empId);
    // console.log("Converted Date:", req);
   
    if (!user) {
      return res.status(404).json({ success: false, message: 'No data found for the given date' });
    }

    // Return the fetched user data
    res.json({
      success: true,
      message: 'Data fetched successfully',
      data: user,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};