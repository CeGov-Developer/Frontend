const oracledb = require('oracledb');

// Adjust DEVICE_TABLE and EMPID column as per your schema
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

async function insertTask(empid, date, time, description) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    // Get current max ASC_EVENT_ID
    const maxResult = await connection.execute(
      `SELECT NVL(MAX(ASC_EVENT_ID), 0) AS MAX_ID FROM AC_STAFF_CALENDAR WHERE ASC_STAFF_ID = :empid`,
      { empid },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const nextEventId = (maxResult.rows[0]?.MAX_ID || 0) + 1;

    // Combine date and time for start/end time
    const dateTime = `${date} ${time}`;

    // Insert new task
    await connection.execute(
      `INSERT INTO AC_STAFF_CALENDAR (
        ASC_STAFF_ID,
        ASC_EVENT_ID,
        ASC_EVENT_NAME,
        ASC_EVENT_DIS,
        ASC_START_TIME,
        ASC_END_TIME,
        ASC_COLOR,
        ASC_STATUS_FLAG,
        ASC_TIME,
        ASC_EVENT_TYPE
      ) VALUES (
        :empid,
        :nextEventId,
        :description,
        NULL,
        TO_DATE(:dateTime, 'YYYY-MM-DD HH24:MI'),
        TO_DATE(:dateTime, 'YYYY-MM-DD HH24:MI'),
        NULL,
        1,
        SYSTIMESTAMP,
        'A'
      )`,
      { empid, nextEventId, description, dateTime },
      { autoCommit: true }
    );

    return nextEventId;
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
  }
}

async function fetchTasks(empid) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT ASC_EVENT_NAME AS description, TO_CHAR(ASC_START_TIME, 'YYYY-MM-DD HH24:MI') AS date
       FROM AC_STAFF_CALENDAR
       WHERE ASC_STAFF_ID = :empid AND ASC_STATUS_FLAG = 1`,
      { empid },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows;
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
  }
}

module.exports = {
  getEmpIdByDevice,
  insertTask,
  fetchTasks
};