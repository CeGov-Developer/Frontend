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
      `SELECT AL_EMPID FROM AC_APP_LOGIN1 WHERE AL_DEVICE_ID = :deviceId AND AL_NOTIFICATION_ID = :notificationToken AND  AL_LOGIN_STATUS = 1`,
      { deviceId, notificationToken },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows.length > 0 ? result.rows[0].AL_EMPID : null;
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
  }
}

async function getForeignVisitByEmpId(empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT * FROM AC_FOREIGN_VISIT WHERE AFV_EMPID = :empId`,
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

module.exports = { getEmpIdByDevice, getForeignVisitByEmpId };