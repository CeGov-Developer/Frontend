const oracledb = require('oracledb');

async function getUserByUsername(username) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT * FROM AC_LOGIN WHERE AL_EMPID = :username`,
      { username },
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

// Student login (AC_FEE_STUDENT_LOGIN)
async function getStudentUserByUsername(username) {
  if (getStudentInfo(username)) {


    let connection;
    try {
      connection = await oracledb.getConnection({
        user: process.env.STUDENT_DB_USER,
        password: process.env.STUDENT_DB_PASSWORD,
        connectString: process.env.STUDENT_DB_CONNECT_STRING
      });

      let result = await connection.execute(
        `SELECT * FROM AC_FEE_LOGIN WHERE AFL_REG_NO = :username`,
        { username },
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
  else {
    return null;
  }
}

// Student info (FEE_STUDENT + branch, degree, campus, personal, contact)
async function getStudentInfo(regNo) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.STUDENT_DB_USER,
      password: process.env.STUDENT_DB_PASSWORD,
      connectString: process.env.STUDENT_DB_CONNECT_STRING
    });

    // Get main student info (with session status)
    const studentResult = await connection.execute(
     `SELECT FS.*
                FROM FEE_STUDENT FS
                JOIN FEE_SESSION SES ON FS.FS_SESSION_ID = SES.FS_SESSION_ID
                WHERE FS.FS_REG_NO = :regNo
                AND FS.FS_FEE_CODE = 10
                AND FS.FS_STATUS_FLG NOT IN (3, 4, 5, 7, 21, 32, 42, 43, 47, 50, 51, 52)
                AND SES.FS_STATUS = 1
                AND EXISTS (
                    SELECT 1 
                    FROM FEE_ADMISSION_CONFIRM FAC
                    WHERE FAC.FAC_ROLNO = :regNo)`,

      { regNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const student = studentResult.rows[0];
    if (!student) {
      const ifStudent = await connection.execute(
        `SELECT * 
       FROM FEE_STUDENT
       WHERE FS_REG_NO = :regNo AND FS_FEE_CODE = 10`,
        { regNo },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if (ifStudent.rows.length > 0) {
        return { error: 'Student is not currently enrolled in any active session.' };
      }
      else {
        return { error: "Please visit www.auegov.ac.in" }
      }
    }

    console.log(student)
    // Get branch info
    let branch = null, degree = null, campus = null, personal = null, contact = null;
    if (student.FS_BRANCH_CODE) {
      const branchResult = await connection.execute(
        `SELECT * FROM FEE_BRANCH WHERE FB_BRANCH_CODE = :branchCode`,
        { branchCode: student.FS_BRANCH_CODE || null },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      branch = branchResult.rows[0] || null;

      // Get degree info
      if (branch && branch.FB_DEGREE_CODE) {
        const degreeResult = await connection.execute(
          `SELECT * FROM FEE_DEGREE WHERE FDG_DEGREE_CODE = :degreeCode`,
          { degreeCode: branch.FB_DEGREE_CODE },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        degree = degreeResult.rows[0] || null;
      }
    }

    // Get campus info
    if (student.FS_CAMP_CODE) {
      const campusResult = await connection.execute(
        `SELECT * FROM FEE_CAMPUS WHERE FC_CAMP_CODE = :campCode`,
        { campCode: student.FS_CAMP_CODE },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      campus = campusResult.rows[0] || null;
    }

    // Get personal info
    const personalResult = await connection.execute(
      `SELECT * FROM FEE_STUDENT_PERSONAL WHERE FSP_REG_NO = :regNo`,
      { regNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    personal = personalResult.rows[0] || null;
    let address = null;
    let bloodGroup = null;
    let bloodGroupName = null;
    if (student.FS_APPL_NO) {
      const addressResult = await connection.execute(
        `SELECT * FROM vm_fee_data_address_details WHERE fdad_appl_no = :applNo`,
        { applNo: student.FS_APPL_NO },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      address = addressResult.rows[0] || null;
      const bloodResult = await connection.execute(
        `SELECT FDPS_BLOOD_GRP FROM vm_fee_data_personal_details WHERE FDPS_APPL_NO = :applNo`,
        { applNo: student.FS_APPL_NO },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      bloodGroup = bloodResult.rows[0]?.FDPS_BLOOD_GRP || null;

      // Get blood group name if code exists
      if (bloodGroup) {
        const bloodNameResult = await connection.execute(
          `SELECT FBG_NAME FROM FEE_BLOOD_GROUP WHERE FBG_ID = :bloodGroup`,
          { bloodGroup },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        bloodGroupName = bloodNameResult.rows[0]?.FBG_NAME || null;
      }
    }


    return {
      ...student,
      branch,
      degree,
      campus,
      personal,
      contact,
      address,
      bloodGroupName
    };
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

// Student photo (AC_STUDENT_PHOTO)
// async function getStudentPhoto(regNo) {
//   let connection;
//   try {
//     connection = await oracledb.getConnection({
//       user: process.env.PHOTO_USER,
//       password: process.env.PHOTO_PASSWORD,
//       connectString: process.env.PHOTO_CONNECT_STRING,
//     });

//     let result = await connection.execute(
//       `SELECT * FROM STUDENT_PHOTO WHERE SP_REG_NO = :regNo`,
//       { regNo },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
   
    
//     if (result.rows.length >0) {
//       result = await connection.execute(
//       `SELECT * FROM STUDENT_PHOTO WHERE SP_REG_NO = 1`,
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     }
//     const lob = result.rows[0]?.SP_PHOTO;
//     const buffer = await lobToBuffer(lob);  // assumes you have this helper
//     return {
//       image: buffer.toString('base64')
//     };
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (err) {
//         console.error('Error closing connection:', err);
//       }
//     }
//   }
// }

async function getStudentPhoto(regNo) {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: process.env.PHOTO_USER,
      password: process.env.PHOTO_PASSWORD,
      connectString: process.env.PHOTO_CONNECT_STRING,
    });

    // Try to get the original student's photo
    let result = await connection.execute(
      `SELECT SP_PHOTO FROM STUDENT_PHOTO WHERE SP_REG_NO = :regNo`,
      { regNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let lob = result.rows?.[0]?.SP_PHOTO || null;

    // If not found or null, fallback to default photo (SP_REG_NO = 1)
    if (!lob) {
      const fallbackResult = await connection.execute(
        `SELECT SP_PHOTO FROM STUDENT_PHOTO WHERE SP_REG_NO = 1`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      lob = fallbackResult.rows?.[0]?.SP_PHOTO || null;

      // Still null? Return no image
      if (!lob) {
        return { image: null };
      }
    }

    const buffer = await lobToBuffer(lob); // assumes your LOB to buffer conversion works
    return {
      image: buffer.toString('base64')
    };

  } catch (error) {
    console.error('Error fetching student photo:', error);
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

function lobToBuffer(lob) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    lob.on('data', chunk => chunks.push(chunk));
    lob.on('end', () => resolve(Buffer.concat(chunks)));
    lob.on('error', reject);
  });
}

// Employee contact info (AD_EMPLOYEE_CONTACT)
async function getEmployeeContact(empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT * FROM AD_EMPLOYEE_CONTACT WHERE EC_EMPLOYEE_ID = :empId`,
      { empId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('Employee Contact:', result.rows[0]);
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

// Student contact info (AC_STUDENT_CONTACT)
async function getStudentContact(regNo) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.STUDENT_DB_USER,
      password: process.env.STUDENT_DB_PASSWORD,
      connectString: process.env.STUDENT_DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT * FROM AC_STUDENT_CONTACT WHERE ASC_REG_NO = :regNo`,
      { regNo },
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

// Department details (AC_DEPT_DETAILS)
async function getDepartmentDetails(deptCode, campCode) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT * FROM AC_DEPT_DETAIL WHERE DD_DEPT_CODE = :deptCode AND DD_CAMP_CODE = :campCode`,
      { deptCode, campCode },
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

module.exports = {
  getUserByUsername,
  getStudentUserByUsername,
  getStudentInfo,
  getStudentPhoto,
  getEmployeeContact,
  getStudentContact,
  getDepartmentDetails
};