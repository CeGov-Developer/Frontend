const { getCourses } = require('../queries/coursesQueries');
const { getEmpIdByDevice } = require('../queries/BiometricQueries');

const coursesHandler = async (req, res) => {
   

    try {
        // Accept both camelCase and snake_case/cased keys from frontend
        const deviceId = req.body.deviceId || req.body.deviceid;
        const notificationToken = req.body.notificationToken || req.body.notificationid;

       

        if (!deviceId || !notificationToken) {
            return res.status(400).json({ 
                success: false, 
                message: 'deviceId and notificationToken are required' 
            });
        }
        
        // Fetch employee ID using device ID and notification token
        const empId = await getEmpIdByDevice(deviceId, notificationToken);

        if (!empId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee ID is required' 
            });
        }
        console.log('Employee ID:', empId);
        const courses = await getCourses(empId);
        console.log('Courses fetched:', courses);
        
        res.json({
            success: true,
            data: courses
        });
        
    } catch (error) {
        console.error('Error in coursesHandler:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch courses',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = coursesHandler;



