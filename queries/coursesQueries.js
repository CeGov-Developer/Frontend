const oracledb = require('oracledb');

async function getListAcCourseOffered(empId) {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING
        });

        const result = await connection.execute(
            `SELECT * FROM AC_COURSE_OFFERED 
             WHERE ACO_EMPID = :empId 
             ORDER BY ACO_YEAR DESC, ACO_SESSION DESC`,
            [empId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        return result.rows;
    } catch (error) {
        console.error('Error in getListAcCourseOffered:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

const mapSessionToText = (session) => {
    switch (String(session)) {
        case '1': return 'January - April';
        case '2': return 'May - August';
        case '3': return 'September - December';
        default: return 'N/A';
    }
};

const mapCourseData = (dbCourse) => ({
    code: dbCourse.ACO_COURSE_CODE || '',
    name: dbCourse.ACO_COURSE_NAME || '',
    organization: dbCourse.ACO_ORGANIZATION || 'MIT CAMPUS',
    department: dbCourse.ACO_DEPARTMENT || 'Computer Technology',
    year: dbCourse.ACO_YEAR ? `${dbCourse.ACO_YEAR} / Semester - ${dbCourse.ACO_SEMESTER || 'N/A'}` : 'N/A',
    session: mapSessionToText(dbCourse.ACO_SESSION),
    info: {
        scheduled: dbCourse.ACO_SCHEDULED_HOURS || 0,
        handled: dbCourse.ACO_HANDLED_HOURS || 0,
        registered: dbCourse.ACO_REGISTERED || 0,
        passed: dbCourse.ACO_PASSED || 0
    }
});

async function getCourses(empId) {
    try {
        const courses = await getListAcCourseOffered(empId);
        return courses.map(mapCourseData);
    } catch (error) {
        console.error('Error in getCourses:', error);
        throw error;
    }
}

module.exports = {
    getCourses,
    getListAcCourseOffered
};