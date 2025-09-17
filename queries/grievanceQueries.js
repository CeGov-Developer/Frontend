const oracledb = require('oracledb');

async function getConnection() {
    return await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING
    });
}


async function submitGrievance(empId, submitTo, nature, ticketNumber,type) {
    const parts = submitTo.split("~");
    let connection;
  
    try {
      connection = await getConnection();
  
      const parts = submitTo.split("~"); // example: "2~12250"
      const submittedToId = parts[0];
      const submittedToEmpId = parts[1];
      
      const result1 = await connection.execute(
        `INSERT INTO AC_HELP_DESK 
          (AHD_ID, AHD_NATURE, AHD_SUBMITTED_TO, AHD_TIME, AHD_STATUS, AHD_SEQUENCE_NO, AHD_TKT_ID, AHD_CURRENT_LOCATION, AHD_SUBMITTED_TO_EMPID,AHD_USER_TYPE,AHD_CREATED_DATE)
         VALUES 
          (:empId, :nature, :submittedTo, SYSDATE, 1, 1, :ticketNumber, :currentLocation, :submittedToEmpId,:type,SYSDATE)`,
        {
          empId: empId,
          nature: nature,
          submittedTo: submittedToId,
          ticketNumber: ticketNumber,
          currentLocation: submittedToEmpId,
          submittedToEmpId: submittedToEmpId,
          type: type
        },
        { autoCommit: false }
      );
      
      // 2nd Insert - AC_HELPDESK_LOG
      const result2 = await connection.execute(
        `INSERT INTO AC_HELPDESK_LOG (AHL_TKTID, AHL_ASSIGNEDTO, AHL_STATUS_TEXT, AHL_SEQ_NO, AHL_INSERTED_DATETIME)
         VALUES (:ticketNumber, :assignedTo, 'Submitted', 1, SYSDATE)`,
        {
          ticketNumber: ticketNumber,
          assignedTo: parts[1], // Second part or fallback to first part if only one part exists
        },
        { autoCommit: false }
      );
  
      // COMMIT if both succeeded
      await connection.commit();
  
      return { success: true, message: 'Both inserts successful' };
    } catch (error) {
      console.error('Error in submitGrievance:', error);
  
      // ROLLBACK on error
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
  
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('Error closing connection:', closeError);
        }
      }
    }
  }

  async function getSubmittedGrievance(empId) {
    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        `SELECT 
         *
        FROM AC_HELP_DESK
        WHERE 
          AHD_ID = :empId`,
        { empId: empId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      return result.rows;
    } catch (error) {
      console.error('Error in getSubmittedGrievance:', error);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('Error closing connection:', closeError);
        }
      }
    }
  }
  
// async function submitGrievance(empId, submitTo,nature, ticketNumber) {

//     console.log(submitTo)
//     const parts = submitTo.split("~");
//     let connection;
//     try {
//         connection = await getConnection();
//         const result = await connection.execute(
//             `INSERT INTO AC_HELP_DESK (AHD_ID, AHD_NATURE, AHD_SUBMITTED_TO, AHD_TIME)
//              VALUES (:empId, :nature, :submitTo, SYSDATE)`,
//             { 
//                 empId: empId, 
//                 nature: nature, 
//                 submitTo: parts[0], 
//             },
//             { autoCommit: true }
//         );

//         return result.rows;
//     } catch (error) {
//         console.error('Error in submitGrievance:', error);
//         throw error;
//     } finally {
//         if (connection) {
//             try {
//                 await connection.close();
//             } catch (closeError) {
//                 console.error('Error closing connection:', closeError);
//             }
//         }
//     }
// }

async function getLatestTicket() {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT 
                AHL_TKTID as "id"
            FROM 
                AC_HELPDESK_LOG
            ORDER BY 
                AHL_TKTID DESC
            FETCH FIRST 1 ROWS ONLY`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || { id:"" }; // Return default ID if no records exist
    } catch (error) {
        console.error('Error in getLatestTicket:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
}

module.exports = {
    submitGrievance,
    getLatestTicket,
    getSubmittedGrievance
};