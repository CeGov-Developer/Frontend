import oracledb from 'oracledb';

async function getCampusList(category) {
  console.log("Fetching campus list for category:", category);
  let connection;
  let result; // Declare result outside the if/else block

  try {
    connection = await oracledb.getConnection({
      user: process.env.STUDENT_DB_USER,
  password: process.env.STUDENT_DB_PASSWORD,
  connectString: process.env.STUDENT_DB_CONNECT_STRING
    });

    if (category === "ud") {
      // Assuming 'ud' campuses have FC_CAMP_CODE up to 4
      result = await connection.execute(
        `SELECT * FROM FEE_CAMPUS WHERE FC_CAMP_CODE <= 4`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
    } else {
      // Assuming 'uce' campuses have FC_CAMP_CODE greater than 4
      result = await connection.execute(
        `SELECT * FROM FEE_CAMPUS WHERE FC_CAMP_CODE > 4 AND FC_CAMP_CODE!=50 AND FC_CAMP_CODE!=11`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
    }

    // Check if result.rows is defined before returning
    if (result && result.rows) {
      return result.rows;
    } else {
      console.warn("No rows returned for category:", category);
      return []; // Return an empty array if no rows are found
    }

  } catch (err) {
    console.error('Error fetching campus list:', err);
    // Re-throw the error or handle it as appropriate for your application
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("OracleDB connection closed.");
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

async function getDepartmentList(category, campusCode) {
  console.log("Fetching department list for category:", category, "and campus code:", campusCode);
  let connection;
  let connectionAdmin;
  let result;
  let sessionIds;

  try {
    // First get active session IDs
    connection = await oracledb.getConnection({
     user: process.env.STUDENT_DB_USER,
     password: process.env.STUDENT_DB_PASSWORD,
     connectString: process.env.STUDENT_DB_CONNECT_STRING
    });
if(category === "ud"){
var status1=1
}else{
var status1=0
}
    connectionAdmin = await oracledb.getConnection({
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          connectString: process.env.DB_CONNECT_STRING

      });

    // Get active session IDs
    const sessionResult = await connection.execute(
      `SELECT FS_SESSION_ID 
       FROM FEE_SESSION 
       WHERE FS_STATUS = 1 AND FS_UD_UCE=:status1`,
      [status1],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!sessionResult || !sessionResult.rows || sessionResult.rows.length === 0) {
      return [];
    }

    // Convert session IDs to array format for IN clause
    sessionIds = sessionResult.rows.map(row => row.FS_SESSION_ID);
    const sessionIdsString = sessionIds.join(',');
    // Get departments with active students
     // FD_DEPT_NAME as departmentName,
        // FD_DEPT_CODE as deptCode,
        // FD_CAMP_CODE as campusCode,
        // FS_BRANCH_CODE as branchCode,
        // 1 as status
    result = await connection.execute(
      `SELECT DISTINCT 
       FD_DEPT_CODE,
       FD_DEPT_NAME,
       FS_CAMP_CODE,
       FS_DEPT_CODE
      FROM FEE_STUDENT 
      JOIN FEE_DEPARTMENT ON FEE_DEPARTMENT.FD_DEPT_CODE = FEE_STUDENT.FS_DEPT_CODE 
      WHERE FS_SESSION_ID IN (${sessionIdsString}) 
      AND FS_CAMP_CODE = :campusCode AND FS_FEE_CODE=10`,
      [campusCode],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );


    if (result && result.rows) {
      // Get HOD names for each department
      connectionAdmin = await oracledb.getConnection({
        user: 'tempadms070425',
        password: 'tempadms070425',
        connectString: '10.150.0.35:1521/ORCL'
      });

      // Add HOD name to each department
      const departmentsWithHOD = await Promise.all(
        result.rows.map(async (dept) => {
          try {
            const hodResult = await connectionAdmin.execute(
              `SELECT EM_DISPLAY_NAME as hodName 
               FROM AC_POSTING_DETAILS 
               JOIN AD_EMPLOYEE_MASTER ON AD_EMPLOYEE_MASTER.EM_EMPLOYEE_ID = AC_POSTING_DETAILS.APD_EMPID 
               WHERE APD_CAMP_CODE = :campusCode 
               AND APD_DEPT_CODE = :FS_DEPT_CODE AND APD_CAT_CODE = 2
             `,
              [dept.FS_CAMP_CODE, dept.FS_DEPT_CODE],
              { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );


            return {
              ...dept,
              HODNAME: hodResult.rows[0]?.HODNAME || 'No HOD assigned'
            };
          } catch (err) {
            return {
              ...dept,
              HODNAME: 'Error fetching HOD'
            };
          }
        })
      );

      return departmentsWithHOD;
    } else {
      console.warn("No departments found for category:", category, "and campus code:", campusCode);
      return [];
    }
  } catch (err) {
    console.error('Error fetching department list:', err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
    if (connectionAdmin) {
      try {
        await connectionAdmin.close();
      } catch (err) {
        console.error('Error closing admin connection:', err);
      }
    }
  }
}

async function getActiveDepartments(campusCode) {
  console.log("Fetching active departments for campus code:", campusCode);
  let connection;
  let result;

  try {
    connection = await oracledb.getConnection({
     user: process.env.STUDENT_DB_USER,
     password: process.env.STUDENT_DB_PASSWORD,
     connectString: process.env.STUDENT_DB_CONNECT_STRING
    });

    // First get active session IDs
    const sessionResult = await connection.execute(
      `SELECT FS_SESSION_ID 
       FROM FEE_SESSION 
       WHERE FS_STATUS = 1`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
 
    if (!sessionResult || !sessionResult.rows || sessionResult.rows.length === 0) {
      console.log('No active sessions found');
      return [];
    }

    // Convert session IDs to array format for IN clause
    const sessionIds = sessionResult.rows.map(row => row.FS_SESSION_ID);
    const sessionIdsString = sessionIds.join(',');

    // Get distinct department and campus codes from students
    const studentResult = await connection.execute(
      `SELECT DISTINCT FS_DEPT_CODE, FS_CAMP_CODE 
       FROM FEE_STUDENT 
       WHERE FS_SESSION_ID IN (${sessionIdsString})`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!studentResult || !studentResult.rows || studentResult.rows.length === 0) {
      return [];
    }

    // Get department names
    result = await connection.execute(
      `SELECT 
        FD_DEPT_NAME as departmentName,
        FD_DEPT_CODE as deptCode,
        FD_CAMP_CODE as campusCode
      FROM FEE_DEPARTMENT 
      WHERE FD_DEPT_CODE IN (
        SELECT FS_DEPT_CODE 
        FROM FEE_STUDENT 
        WHERE FS_SESSION_ID IN (${sessionIdsString})
        AND FS_CAMP_CODE = :campusCode
      )`,
      [campusCode],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result && result.rows) {
      return result.rows;
    } else {
      return [];
    }

  } catch (err) {
    console.error('Error fetching active departments:', err);
    throw err;
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

async function getDepartmentBranches(departmentCode, campusCode) {
  let connection;
  console.log(`Fetching branches for department: ${departmentCode}, campus: ${campusCode}`);
  
  try {
    connection = await oracledb.getConnection({
      user: process.env.STUDENT_DB_USER,
      password: process.env.STUDENT_DB_PASSWORD,
      connectString: process.env.STUDENT_DB_CONNECT_STRING
    });

    // This is a sample query - adjust according to your database schema
    const result = await connection.execute(
      `SELECT 
      FEE_DEGREE.FDG_SHORT_NAME as "degreeName",
          FB_BRANCH_NAME as "branchName",
          FB_PROGRAMME as "programmeType",
          FB_MODE as "mode"
       FROM FEE_DEPT_BRANCH 
       JOIN FEE_BRANCH ON FEE_DEPT_BRANCH.FDB_BRANCH_CODE = FEE_BRANCH.FB_BRANCH_CODE
       JOIN FEE_DEGREE ON FEE_DEGREE.FDG_DEGREE_CODE = FEE_BRANCH.FB_DEGREE_CODE
       WHERE FDB_DEPT_CODE = :deptCode 
       AND FDB_CAMP_CODE = :campusCode
       ORDER BY FB_BRANCH_NAME`,
      {
        deptCode: departmentCode,
        campusCode: campusCode
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
console.log(result.rows);
    return result.rows || [];
  } catch (err) {
    console.error('Error fetching department branches:', err);
    throw err;
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

export { 
  getCampusList, 
  getDepartmentList, 
  getActiveDepartments, 
  getDepartmentBranches 
};
