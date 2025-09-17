const { getAcademicYearData, getFeedbackData } = require('../queries/yearQueries');
const { getEmpIdByDevice } = require('../queries/BiometricQueries');

async function handleGetYears(req, res) {
  try {
    const empId = await getEmpIdByDevice(req.body['deviceId'], req.body['notificationId']);
    console.log("empId:", empId);
    const data = await getAcademicYearData(empId); // <-- use await!
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch academic years' });
  }
}

async function handleGetFeedback(req, res) {
  try {
    const empId = await getEmpIdByDevice(req.body['deviceId'], req.body['notificationId']);

    // console.log("empIertettd:", req.body['acyr'], req.body['sem'], req.body['sessid'], empId);
    const data = await getFeedbackData(req.body['acyr'], req.body['sem'], req.body['sessid'], empId);

    console.log("Feedback data:", data);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
}

module.exports = { handleGetYears, handleGetFeedback };