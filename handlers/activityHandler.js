const {
  getDepartmentalActivities,
  getInstitutionalActivities,
  getSocietyActivities
} = require('../queries/activityQueries');
const { getEmpIdByDevice } = require('../queries/BiometricQueries');


async function getDepartmentalActivitiesHandler(req, res) {
  try {
    // Get employee ID from query params or use default (60028)
    
    const empId = req.query.empId;
        console.log("empId:", empId);
        // Fetch employee ID using device ID and notification token
       
    const activities = await getDepartmentalActivities(empId);

    console.log("activities:", activities);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching departmental activities:', error);
    res.status(500).json({ error: 'Failed to fetch departmental activities' });
  }
}

async function getInstitutionalActivitiesHandler(req, res) {
  try {
    // Get employee ID from query params or use default (60028)
    const empId = req.query.empId;
    const activities = await getInstitutionalActivities(empId);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching institutional activities:', error);
    res.status(500).json({ error: 'Failed to fetch institutional activities' });
  }
}

async function getSocietyActivitiesHandler(req, res) {
  try {
    // Get employee ID from query params or use default (60028)
    const empId = req.query.empId;
    const activities = await getSocietyActivities(empId);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching society activities:', error);
    res.status(500).json({ error: 'Failed to fetch society activities' });
  }
}

module.exports = {
  getDepartmentalActivitiesHandler,
  getInstitutionalActivitiesHandler,
  getSocietyActivitiesHandler
};
