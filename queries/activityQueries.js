const oracledb = require('oracledb');

async function getDepartmentalActivities(empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT 
      ADA_EMPID as "id",
          ADA_ACTIVITY as "description",
          ADA_SESSION as "title",
          ADA_YEAR as "year",
          ADA_SESSION as "session",
          ADA_SEMESTER as "semester"
         
       FROM 
          AC_DEPARTMENTAL_ACTIVITY 
       WHERE 
          ADA_EMPID = :empId
       ORDER BY 
          ADA_YEAR DESC, ADA_SESSION DESC`,
      { empId: empId || 60028 },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
  } catch (error) {
    console.error('Error in getDepartmentalActivities:', error);
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

async function getInstitutionalActivities(empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT 
          AIA_EMPID as "id",
          AIA_YEAR as "year",
          AIA_ACTIVITY as "description",
          AIA_SESSION as "session",
          AIA_SEMESTER as "semester"
          
       FROM 
          AC_INSTITUTE_ACTIVITY 
       WHERE 
          AIA_EMPID = :empId
       ORDER BY 
          AIA_YEAR DESC, AIA_SESSION DESC`,
      { empId: empId || 60028 },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
  } catch (error) {
    console.error('Error in getInstitutionalActivities:', error);
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

async function getSocietyActivities(empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT 
          ASC_EMPID as "id",
          ASC_YEAR as "year",
          ASC_ACTIVITY as "description",
          ASC_SESSION as "session",
          ASC_SEMESTER as "semester"
          
       FROM 
          AC_SOCIETY_CONTRIBUTION 
       WHERE 
          ASC_EMPID = :empId
       ORDER BY 
          ASC_YEAR DESC, ASC_SESSION DESC`,
      { empId: empId || 60028 },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
  } catch (error) {
    console.error('Error in getSocietyActivities:', error);
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

module.exports = {
  getDepartmentalActivities,
  getInstitutionalActivities,
  getSocietyActivities
};
    