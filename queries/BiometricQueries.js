const sql = require('mssql');
const oracledb = require('oracledb');

// Export getEmpIdByDevice so it can be reused in any file
async function getEmpIdByDevice(deviceId, notificationToken) {

  console.log('Received deviceId:', deviceId, 'and notificationToken:', notificationToken);
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT AL_EMPID FROM AC_APP_LOGIN1 WHERE AL_DEVICE_ID = :deviceId AND AL_NOTIFICATION_ID = :notificationToken AND  AL_LOGIN_STATUS = 1`,
      { deviceId, notificationToken },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("Query executed to fetch empId:", result.rows);

    return result.rows.length > 0 ? result.rows[0].AL_EMPID : null;
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
  }
}
const config = {
  user: 'sa',
  password: 'matrix_1',
  server: '10.1.6.45', // Hostname or IP address
  database: 'cosecdb', // Database name
  port: 1433, // Port number
  options: {
    encrypt: false, // Set to true if using SSL
    trustServerCertificate: true, // Trust the server certificate
  },
};

async function fetchBiometricInfoBydate(convertedDate, empId) {
  // Ensure empId is a string for SQL Server input
  const empIdStr = String(empId);

  let pool;
  try {
    // Establish a connection to the SQL Server database
    pool = await sql.connect(config);

    // Define the query to fetch biometric information
    const query = `
      SELECT 
        UserID AS AB_EMPID, 
        Edate AS AB_DATE, 
        MIN(EventDateTime) AS AB_INTIME, 
        CASE 
          WHEN COUNT(*) > 1 THEN MAX(EventDateTime) 
          ELSE NULL 
        END AS AB_OUTTIME,
        (SELECT TOP 1 device_name 
         FROM dbo.Mx_VEW_APIUserAttendanceEvents AS sub 
         WHERE sub.EventDateTime = MIN(dbo.Mx_VEW_APIUserAttendanceEvents.EventDateTime)
           AND sub.UserID = dbo.Mx_VEW_APIUserAttendanceEvents.UserID
           AND sub.Edate = dbo.Mx_VEW_APIUserAttendanceEvents.Edate) AS MIN_DEVICE_NAME,
        (SELECT TOP 1 device_name 
         FROM dbo.Mx_VEW_APIUserAttendanceEvents AS sub 
         WHERE sub.EventDateTime = MAX(dbo.Mx_VEW_APIUserAttendanceEvents.EventDateTime)
           AND sub.UserID = dbo.Mx_VEW_APIUserAttendanceEvents.UserID
           AND sub.Edate = dbo.Mx_VEW_APIUserAttendanceEvents.Edate) AS MAX_DEVICE_NAME
      FROM dbo.Mx_VEW_APIUserAttendanceEvents
      WHERE UserID = @empId AND Edate = @convertedDate
      GROUP BY UserID, Edate
    `;

    // Execute the query
    const result = await pool.request()
      .input('empId', sql.VarChar, empIdStr)
      .input('convertedDate', sql.VarChar, convertedDate)
      .query(query);

    // Return the first row or null if no data is found
    return result.recordset[0] || null;
  } catch (err) {
    console.error('Error executing query:', err.message);
    throw err;
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error closing connection:', err.message);
      }
    }
  }
}

module.exports = { 
  fetchBiometricInfoBydate, 
  getEmpIdByDevice 
  // add other exports as needed
};

// Usage in any other file:
// const { getEmpIdByDevice } = require('./queries/BiometricQueries');
// const empId = await getEmpIdByDevice(deviceId, notificationToken);