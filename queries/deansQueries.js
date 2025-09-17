
const oracledb = require('oracledb');

async function getDeans() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT EM_NAME, EM_DISPLAY_NAME,APD_CAMP_CODE,  APD_SEAT_NAME, EM_EMPLOYEE_ID
       FROM AC_POSTING_DETAILS
       JOIN AD_EMPLOYEE_MASTER ON AC_POSTING_DETAILS.APD_EMPID = AD_EMPLOYEE_MASTER.EM_EMPLOYEE_ID
       WHERE AC_POSTING_DETAILS.APD_CAT_CODE = 9
         AND AC_POSTING_DETAILS.APD_SEAT_CODE = 70 ORDER BY APD_CAMP_CODE ASC` ,
      [],
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

async function getDeansContactDetails(campCodes) {
    // //console.log(campCodes)
    let connection;
    try {
      connection = await oracledb.getConnection({
       user: process.env.STUDENT_DB_USER,
  password: process.env.STUDENT_DB_PASSWORD,
  connectString: process.env.STUDENT_DB_CONNECT_STRING
      });
  
      const bindParams = {};
      const placeholders = campCodes.map((id, index) => {
        const key = `id${index}`;
        bindParams[key] = id;
        return `:${key}`;
      });
      const result = await connection.execute(
        `SELECT *
         FROM AC_DEAN_DETAILS
         WHERE ADD_CAMP_CODE IN (${placeholders.join(',')})`,
        bindParams,
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



async function getDeansImage(employeeIds) {
    const connection = await oracledb.getConnection({
      user: process.env.PHOTO_USER,
      password: process.env.PHOTO_PASSWORD,
      connectString: process.env.PHOTO_CONNECT_STRING,
    });
  
   
    try {
        // Generate dynamic placeholders
        const bindParams = {};
        const placeholders = employeeIds.map((id, index) => {
          const key = `id${index}`;
          bindParams[key] = id;
          return `:${key}`;
        });
    
        const query = `SELECT ASP_PHOTO, ASP_EMPID FROM AC_STAFF_PHOTO WHERE ASP_EMPID IN (${placeholders.join(',')})`;
    
        const result = await connection.execute(query, bindParams, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
        const images = await Promise.all(result.rows.map(async row => {
          const lob = row.ASP_PHOTO;
          const empid = row.ASP_EMPID;
    
          if (lob === null) {
            return { EM_EMPLOYEE_ID: empid, image: null };
          }
    
          const buffer = await lobToBuffer(lob);  // assumes you have this helper
          return {
            EM_EMPLOYEE_ID: empid,
            image: buffer.toString('base64')
          };
        }));
    
        return images;
      } finally {
        await connection.close();
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
  
  
  module.exports = { getDeans, getDeansImage, getDeansContactDetails };