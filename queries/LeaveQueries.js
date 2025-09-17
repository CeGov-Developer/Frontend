const oracledb = require('oracledb');

async function getLeaveInfo(empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT 
 *
FROM 
  AC_LEAVE_AVAILABLE_OTHER lao
JOIN 
  AC_LEAVE_AVAILABLE la ON lao.LAO_EMPID = la.LA_EMPID
WHERE 
  lao.LAO_EMPID = :empId AND lao.LAO_YEAR = TO_CHAR(SYSDATE, 'YYYY')
`,
      { empId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
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

module.exports = { getLeaveInfo };
