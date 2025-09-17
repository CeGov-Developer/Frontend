const oracledb = require('oracledb');
const { v4: uuidv4 } = require('uuid');
async function updateEmployeeIdForDevice(deviceId, notificationToken, empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });
    console.log("here1");
    await connection.execute(
      `UPDATE AC_APP_LOGIN1 SET AL_EMPID = :empId , AL_LOGIN_STATUS = 1 WHERE AL_DEVICE_ID = :deviceId AND AL_NOTIFICATION_ID = :notificationToken`,
      { empId, deviceId, notificationToken },
      { autoCommit: true }
    );
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
  }
}
async function registerDevice(deviceId, notificationToken) {
  console.log('Registering device:', deviceId, notificationToken);
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });

    console.log('Connection established');

    const result = await connection.execute(
      `INSERT INTO AC_APP_LOGIN1 (AL_EMPID, AL_DEVICE_ID, AL_NOTIFICATION_ID, AL_LOGIN_STATUS, AL_NOTIFICATION_SEND_TIME)
       VALUES (null, :deviceId, :notificationToken, 0, SYSTIMESTAMP)`,
      { deviceId, notificationToken },
      { autoCommit: true }
    );

    // Check if a row was inserted
    if (result.rowsAffected && result.rowsAffected > 0) {
      return true;
    } else {
      // Generate a new UUID and try to insert with that
      const newDeviceId = uuidv4();
      try {
        await connection.execute(
          `INSERT INTO AC_APP_LOGIN1 (AL_EMPID, AL_DEVICE_ID, AL_NOTIFICATION_ID, AL_LOGIN_STATUS, AL_NOTIFICATION_SEND_TIME)
           VALUES (null, :deviceId, :notificationToken, 0, SYSTIMESTAMP)`,
          { deviceId: newDeviceId, notificationToken },
          { autoCommit: true }
        );
        // Return false and the new uuid
        return { success: false, newId: newDeviceId };
      } catch (err) {
        // If even this fails, just return false
        return false;
      }
    }

  } catch (err) {
    console.error('Error inserting device record:', err);
    return false;
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

async function checkDevice(deviceId, notificationToken) {
  console.log("checkDevice called with deviceId:", deviceId, "and notificationToken:", notificationToken);
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT AL_LOGIN_STATUS, AL_EMPID FROM AC_APP_LOGIN1 WHERE AL_DEVICE_ID = :deviceId AND AL_NOTIFICATION_ID = :notificationToken`,
      { deviceId, notificationToken },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log("Query executed successfully, result:", result);
    if (!result.rows || result.rows.length === 0) {
      // No device found
      console.log("No device found with the provided deviceId and notificationToken");
      return { status: 0 };
    }
    console.log("Device found:", result.rows);
    const row = result.rows[0];
    if (row.AL_LOGIN_STATUS === 1 && row.AL_EMPID != null) {
      // Device found, login status is 1, and employee ID is present
      return { status: 1, empId: row.AL_EMPID };
    } else if (row.AL_LOGIN_STATUS === 0 && row.AL_EMPID == null) {
      // Device found, login status is 1, but employee ID is null
      return { status: 2 };
    } else {
      console.log("Device found but not logged in or employee ID is null");
      // Device found, but login status is not 1 or employee ID is null
      return { status: 3 };
    }
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
async function logoutDevice(deviceId, notificationToken) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    await connection.execute(
      `UPDATE AC_APP_LOGIN1 SET AL_EMPID = NULL, AL_LOGIN_STATUS = 0 WHERE AL_DEVICE_ID = :deviceId AND AL_NOTIFICATION_ID = :notificationToken`,
      { deviceId, notificationToken },
      { autoCommit: true }
    );
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
  }
}
async function resetLoginStatusIfActive(username) {
  console.log("here");
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    // Set AL_LOGIN_STATUS to 0 where AL_EMPID matches and AL_LOGIN_STATUS is 1
    await connection.execute(
      `UPDATE AC_APP_LOGIN1 SET AL_LOGIN_STATUS = 0 , AL_EMPID = null WHERE AL_EMPID = :username AND AL_LOGIN_STATUS = 1`,
      { username },
      { autoCommit: true }
    );
    // No error thrown if no rows are updated
  } catch (err) {
    console.error('Error resetting login status:', err);
    // Do not throw error, just log it
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
  }
}

module.exports = { logoutDevice, registerDevice, checkDevice, updateEmployeeIdForDevice, resetLoginStatusIfActive };