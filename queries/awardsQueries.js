const oracledb = require('oracledb');

async function getEmpIdByDevice(deviceId, notificationToken) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT AL_EMPID, AL_LOGIN_STATUS FROM AC_APP_LOGIN1 
       WHERE AL_DEVICE_ID = :deviceId AND AL_NOTIFICATION_ID = :notificationToken`,
      { deviceId, notificationToken },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return null; // No record found
    }

    const row = result.rows[0];
    
    if (row.AL_LOGIN_STATUS === 1) {
      return row.AL_EMPID;
    } else {
      return { error: 'Session logged out' };
    }

  } catch (err) {
    console.error('DB error:', err);
    throw err;
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
  }
}


async function getAwardsByEmpId(empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT * FROM AC_RECOGNIZATION_AWARD WHERE ARA_EMPID = :empId`,
      { empId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
  }
}

module.exports = { getEmpIdByDevice, getAwardsByEmpId };