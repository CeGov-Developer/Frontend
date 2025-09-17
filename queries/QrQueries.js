import oracledb from 'oracledb';

async function getConnection() {
  return await oracledb.getConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING
  });
}

async function InsertData(decryptedData, value, seqNo,empId) {
  let connection;
  try {
    connection = await getConnection();
    const photoNo = `${decryptedData}_${seqNo}`;
    
    const sql = `
      INSERT INTO AC_EO_BUILDINGS_RESOURCE_FEEDBACK 
        (AERF_SEQ_NO, AERF_CODE, AERF_REASON_NO, AERF_PHOTO_NO, AERF_STATUS, AERF_DATE_TIME,AERF_SUBMITTEDBY)
      VALUES (:seqNo, :decryptedData, :value, :photoNo, :status, SYSTIMESTAMP, :empId)
    `;

    const result = await connection.execute(
      sql,
      {
        seqNo: seqNo,
        decryptedData: decryptedData,
        value: value,
        photoNo: photoNo,
        status: 0,
        empId: empId
      },
      { 
        autoCommit: true, // This commits the transaction
        outFormat: oracledb.OUT_FORMAT_OBJECT 
      }
    );

    
    // For INSERT operations, return the result or a success indicator
    return {
      success: true,
      rowsAffected: result.rowsAffected,
      sequenceNo: seqNo
    };
    
  } catch (error) {
    console.error('❌ Error inserting data:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getNextSequenceNo() {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = `
      SELECT MAX(AERF_SEQ_NO) as MAX_SEQ
      FROM AC_EO_BUILDINGS_RESOURCE_FEEDBACK
    `;

    const result = await connection.execute(
      sql,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // If no rows or MAX_SEQ is null, return 1
    if (!result.rows || result.rows.length === 0 || result.rows[0].MAX_SEQ === null) {
      return 1;
    }
    
    // Return max sequence number + 1
    return result.rows[0].MAX_SEQ + 1;
    
  } catch (error) {
    console.error('Error getting next sequence number:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getBuildingResourceReasonDetails(resource) {
  let connection;
  try {
    connection = await getConnection();
   
    const sql = `
      SELECT AEBRRL_CODE, AEBRRL_NAME, AEBRRL_RESOURCE_ID
      FROM AC_EO_BUILDINGS_RESOURCE_REASON_LIST
      JOIN AC_EO_BUILDINGS_RESOURCE_LIST 
        ON ABR_CODE = AEBRRL_RESOURCE_ID
      WHERE ABR_CODE = :b_resource
      ORDER BY AEBRRL_CODE ASC
    `;

    const result = await connection.execute(
      sql,
      { b_resource: Number(resource) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
  } catch (err) {
    console.error("DB Error:", err);
    throw err;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getRoomDetails(campus, buildingId, floor, resource, roomId) {
  let connection;
  try {
    connection = await getConnection();

    const sql = `
      SELECT 
        AEBC_CAMP_NAME, AEBM_CAMPUS, AEBM_ID, AEBM_BLOCK_NO, AEBM_BUILDING_NAME, ABR_NAME,
        ABRD_CAMPUS, ABRD_BUILDING_ID, ABRD_FLOOR, ABRD_RESOURCE, ABRD_ROOM_ID,
        ABRD_ROOM_NO, ABRD_ROOM_NAME, ABRD_CODE
      FROM AC_EO_BUILDINGS_ROOM_DETAILS
      LEFT JOIN AC_EO_BUILDINGS_MASTER 
        ON ABRD_CAMPUS = AEBM_CAMPUS AND ABRD_BUILDING_ID = AEBM_ID
      JOIN AC_EO_BUILDINGS_CAMPUS 
        ON AEBC_CAMP_CODE = AEBM_CAMPUS
      JOIN AC_EO_BUILDINGS_RESOURCE_LIST 
        ON ABR_CODE = ABRD_RESOURCE
      WHERE 
        AEBM_CAMPUS   = :b_campus
        AND AEBM_ID   = :b_buildingId
        AND ABRD_FLOOR = :b_floor
        AND ABRD_RESOURCE = :b_resource
        AND ABRD_ROOM_ID = :b_roomId
      ORDER BY ABRD_CODE ASC
    `;

    const result = await connection.execute(
      sql,
      {
        b_campus: campus,
        b_buildingId: buildingId,
        b_floor: floor,
        b_resource: resource,
        b_roomId: roomId
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
  } catch (err) {
    console.error("DB Error:", err);
    throw err;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export {
  getBuildingResourceReasonDetails,
  getRoomDetails,
  getNextSequenceNo,
  InsertData
};