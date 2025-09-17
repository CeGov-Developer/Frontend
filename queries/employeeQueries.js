const oracledb = require('oracledb');

async function getEmployeeInfo(empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });
    //console.log("here1");
    const result = await connection.execute(
      `SELECT * FROM AD_EMPLOYEE_MASTER WHERE EM_EMPLOYEE_ID = :empId AND EM_STATUS_FLAG = 2 AND EM_CAMP_CODE <5`,
      { empId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows[0] || null;
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

module.exports = { getEmployeeInfo };