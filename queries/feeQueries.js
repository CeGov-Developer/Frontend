const oracledb = require('oracledb');

// Database configuration
const dbConfig = {
  user: process.env.STUDENT_DB_USER,
  password: process.env.STUDENT_DB_PASSWORD,
  connectString: process.env.STUDENT_DB_CONNECT_STRING};

// Additional connection for specific operations
const dcbConfig = {
   user: process.env.DCB_DB_USER,
  password: process.env.DCB_DB_PASSWORD,
  connectString: process.env.DCB_DB_CONNECT_STRING};

let connection1;


async function getEmpIdByDevice(deviceId, notificationToken) {

  console.log('Received deviceId:', deviceId, 'and notificationToken:', notificationToken);
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

    console.log("Query executed to fetch empId:", result.rows);

    return result.rows.length > 0 ? result.rows[0].AL_EMPID : null;
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
  }
}

async function getAdmYear(empId) {

    let connection;
    try {
      connection = await oracledb.getConnection({
        user: process.env.STUDENT_DB_USER,
        password: process.env.STUDENT_DB_PASSWORD,
        connectString: process.env.STUDENT_DB_CONNECT_STRING
      });
  
      const result = await connection.execute(
        `SELECT FS_ADM_YEAR FROM FEE_STUDENT WHERE FS_REG_NO = :empId AND FS_FEE_CODE = 10`,
        { empId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
  
      console.log("Query executed to fetch empId:", result.rows);
  
      return result.rows.length > 0 ? result.rows[0].FS_ADM_YEAR : null;
    } finally {
      if (connection) {
        try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
      }
    }
  }
// Initialize the database connections
async function initializeConnections() {
  try {
    // Create connection pool
    await oracledb.createPool({
      ...dbConfig,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1
    });

    // Create direct connection for specific operations
    connection1 = await oracledb.getConnection(dcbConfig);
    console.log('Database connections established successfully');
  } catch (error) {
    console.error('Error initializing database connections:', error);
    throw error;
  }
}

// Helper to get a connection from the pool
async function getConnection() {
  return oracledb.getConnection();
}

/**
 * Get student fee data by registration number
 * @param {string} register - Student registration number
 * @param {string} [feeCode='10'] - Fee code (defaults to '10')
 * @returns {Promise<Object>} Student fee data
 */
async function getDataFromFeeStud(register, feeCode = '10') {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM FEE_STUDENT WHERE FS_REG_NO = :1 AND FS_FEE_CODE = :2',
            [register, feeCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getDataFromFeeStud:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get student photo by registration number
 * @param {string} regNo - Student registration number
 * @returns {Promise<Object>} Student photo data
 */
async function getStudentPhotoByRegNo(regNo) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM STUDENT_PHOTO WHERE SP_REG_NO = :1',
            [regNo],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getStudentPhotoByRegNo:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get department name by department code
 * @param {string} dept - Department code
 * @returns {Promise<Object>} Department data
 */
async function getDeptName(dept) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT FD_DEPT_NAME FROM FEE_DEPARTMENT WHERE FD_DEPT_CODE = :1',
            [dept],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getDeptName:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee payment details by registration number
 * @param {string} register - Student registration number
 * @param {number} [statusFlag=2] - Status flag (defaults to 2)
 * @param {number} [feeCode=10] - Fee code (defaults to 10)
 * @returns {Promise<Object>} Fee payment details
 */
async function getAllFeeDetails(register, statusFlag = 2, feeCode = 10) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT 
             WHERE AFSP_REG_NO = :1 AND AFSP_STATUS_FLAG = :2 AND AFSP_FEE_CODE = :3
             ORDER BY AFSP_SEMESTER ASC`,
            [register, statusFlag, feeCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getAllFeeDetails:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get pending fees for a student
 * @param {string} register - Student registration number
 * @param {number} [statusFlag=2] - Status flag (defaults to 2)
 * @param {number} [activeStatus=0] - Active status (defaults to 0)
 * @param {number} [feeCode=10] - Fee code (defaults to 10)
 * @returns {Promise<Array>} List of pending fees
 */
async function getAllPendingFee(register, statusFlag = 2, activeStatus = 0, feeCode = 10) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT 
             WHERE AFSP_REG_NO = :1 AND AFSP_STATUS_FLAG = :2 
             AND AFSP_ACTIVE_STATUS = :3 AND AFSP_FEE_CODE = :4
             ORDER BY AFSP_SEMESTER DESC`,
            [register, statusFlag, activeStatus, feeCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } catch (error) {
        console.error('Error in getAllPendingFee:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get transaction history for a student
 * @param {string} register - Student registration number
 * @param {string} [feeCode='10'] - Fee code (defaults to '10')
 * @returns {Promise<Array>} Transaction history
 */
async function getTransactionHistory(register, feeCode = '10') {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM FEE_TRANSACTION_ALL 
             WHERE FSA_REG_NO = :1 AND FT_FEE_CODE = :2
             ORDER BY FT_TRANSACTION_TIME ASC`,
            [register, feeCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } catch (error) {
        console.error('Error in getTransactionHistory:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Insert fee transaction
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<boolean>} Success status
 */
async function insertFeeTransaction(transactionData) {
    const {
        reg, amount, bank_id, fee_code, sess_id,
        late_fee, readmin_fee, trans_id, status_flag
    } = transactionData;

    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();
        
        await connection.execute(
            `INSERT INTO AC_FEE_TRANSACTION_SUCCESS (
                AFTS_REG_NO, AFTS_AMOUNT_PAID, AFTS_BANK_ID, 
                AFTS_TRANSACTION_TIME, AFTS_FEE_CODE, AFTS_SESSION_ID,
                AFTS_LATE_FEE, AFTS_READMISSION_FEE, AFTS_TRANSACTION_ID,
                AFTS_STATUS_FLG
            ) VALUES (:1, :2, :3, NOW(), :4, :5, :6, :7, :8, :9)`,
            [reg, amount, bank_id, fee_code, sess_id, late_fee, readmin_fee, trans_id, status_flag],
            { autoCommit: false },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        await connection.commit();
        return true;
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error in insertFeeTransaction:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Update fee payment status
 * @param {string} register - Student registration number
 * @param {number} sessionId - Session ID
 * @param {number} feeCode - Fee code
 * @param {number} updateStatus - New status
 * @param {number} previousStatus - Previous status
 * @returns {Promise<boolean>} Success status
 */
async function updateFeePaymentStatus(register, sessionId, feeCode, updateStatus, previousStatus) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `UPDATE AC_FEE_STUDENT_PAYMENT 
             SET AFSP_STATUS_FLAG = :1 
             WHERE AFSP_REG_NO = :2 AND AFSP_STATUS_FLAG = :3 
             AND AFSP_SESSION_ID = :4 AND AFSP_FEE_CODE = :5`,
            [updateStatus, register, previousStatus, sessionId, feeCode],
            { autoCommit: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error in updateFeePaymentStatus:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee details by session and fee type
 * @param {number} sessionId - Session ID
 * @param {string} feeType - Fee type
 * @returns {Promise<Array>} Fee details
 */
async function getFeeAmount(sessionId, feeType) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM FEE_MASTER WHERE FM_SESSION_ID = :1 AND FM_TYPE = :2',
            [sessionId, feeType],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } catch (error) {
        console.error('Error in getFeeAmount:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get student's balance amount
 * @param {string} register - Student registration number
 * @param {number} [statusFlag=2] - Status flag (defaults to 2)
 * @param {Array<number>} [feeCodes=[10, 12]] - Array of fee codes (defaults to [10, 12])
 * @returns {Promise<Object>} Balance details
 */
async function getBalanceAmount(register, statusFlag = 2, feeCodes = [10, 12]) {
    let connection;
    try {
        connection = await getConnection();
        const placeholders = feeCodes.map(() => '?').join(',');
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE 
             WHERE AFSPB_REG_NO = :1 AND AFSPB_STATUS_FLAG = :2 
             AND AFSPB_FEE_CODE IN (${placeholders})
             ORDER BY AFSPB_SEMESTER ASC`,
            [register, statusFlag, ...feeCodes],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getBalanceAmount:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee details for a specific fee ID and session
 * @param {string} feeType - Fee type
 * @param {number} sessionId - Session ID
 * @param {string} feeId - Fee ID
 * @returns {Promise<Object>} Fee details
 */
async function getFeeByIdAndSession(feeType, sessionId, feeId) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM FEE_MASTER WHERE FM_TYPE = :1 AND FM_SESSION_ID = :2 AND FM_FEE_ID = :3',
            [feeType, sessionId, feeId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getFeeByIdAndSession:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee name by ID, session and fee code
 * @param {string} feeId - Fee ID
 * @param {number} sessionId - Session ID
 * @param {string} feeCode - Fee code
 * @returns {Promise<Object>} Fee name details
 */
async function getFeeName(feeId, sessionId, feeCode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT FN_FEE_ID, FN_NAME FROM FEE_NAME WHERE FN_FEE_ID = :1 AND FN_SESSION_ID = :2 AND FN_FEE_CODE = :3',
            [feeId, sessionId, feeCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } catch (error) {
        console.error('Error in getFeeName:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get student fee details by registration number (FS_FEE_CODE = '10')
 * @param {string|number} register - Student registration number
 * @returns {Promise<Object>} Student fee details
 */
      async function getStudentFeeDetails(register) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM FEE_STUDENT WHERE FS_REG_NO = :1 AND FS_FEE_CODE = :2',
            [register, '10'],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getStudentFeeDetails:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get student admission status for login (join FEE_STUDENT and FEE_SESSION)
 * @param {string|number} register - Student registration number
 * @returns {Promise<Object>} Admission status info
 */
async function checkStudentAdmissionStatusForLogin(register) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT FEE_STUDENT.FS_SESSION_ID, FEE_SESSION.FS_ADM_STATUS, FEE_STUDENT.FS_READM_STATUS
             FROM FEE_STUDENT
             JOIN FEE_SESSION ON FEE_SESSION.FS_SESSION_ID = FEE_STUDENT.FS_SESSION_ID
             WHERE FEE_STUDENT.FS_REG_NO = :1`,
            [register],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in checkStudentAdmissionStatusForLogin:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get payment balance records for a student with status flag 9 and fee codes 10/12 (mirrors balance_amt_count_8New in PHP)
 * @param {string|number} register - Student registration number
 * @returns {Promise<Array>} List of payment balance records
 */
async function balanceAmtCount8New(register) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE 
             WHERE AFSPB_REG_NO = :1 
             AND AFSPB_FEE_CODE IN (10, 12)
             AND AFSPB_STATUS_FLAG = 9
             ORDER BY AFSPB_SEMESTER DESC`,
            [register],
             { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in balanceAmtCount8New:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get PDF for a student, semester, and transaction ID
 * @param {string|number} student - Student registration number
 * @param {string|number} sem - Semester
 * @param {string|number} transId - Transaction ID
 * @returns {Promise<Object|null>} PDF data or null if not found
 */
async function getPdf(student, sem, transId) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT FR_PDF FROM FEE_RECEIPT WHERE FR_SEMESTER = :1 AND FR_TRANS_ID = :2',
            [sem, transId],
             { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getPdf:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection in getPdf:', err);
            }
        }
    }
}

/**
 * Update AFSP_STATUS_FLAG for a student/fee/session (get_All_fee_details9_where)
 */
async function getAllFeeDetails9Where(register, sessId, feeCode, updateStatus, previousStatus) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `UPDATE AC_FEE_STUDENT_PAYMENT SET AFSP_STATUS_FLAG = :1
             WHERE AFSP_REG_NO = :2 AND AFSP_STATUS_FLAG = :3 AND AFSP_SESSION_ID = :4 AND AFSP_FEE_CODE = :5`,
            [updateStatus, register, previousStatus, sessId, feeCode],
             { outFormat: oracledb.OUT_FORMAT_OBJECT },
            { autoCommit: true }
        );
        return result.rowsAffected > 0;
    } catch (error) {
        console.error('Error in getAllFeeDetails9Where:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get all pending fees (old)
 */
async function getAllPendingFeeOld(register) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT WHERE AFSP_REG_NO = :1 AND AFSP_STATUS_FLAG = 2 AND AFSP_ACTIVE_STATUS = 0 AND AFSP_FEE_CODE = 10 ORDER BY AFSP_SEMESTER DESC`,
            [register],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in getAllPendingFeeOld:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get all pending fees (new_8)
 */
async function getAllPendingFeeNew8(register) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT WHERE AFSP_REG_NO = :1 AND AFSP_STATUS_FLAG IN (12,8) AND AFSP_ACTIVE_STATUS = 1 AND AFSP_FEE_CODE = 10 ORDER BY AFSP_SEMESTER DESC`,
            [register],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in getAllPendingFeeNew8:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get all pending fees (new)
 */
async function getAllPendingFeeNew(register) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT WHERE AFSP_REG_NO = :1 AND AFSP_STATUS_FLAG = 2 AND AFSP_ACTIVE_STATUS = 1 AND AFSP_FEE_CODE = 10`,
            [register],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getAllPendingFeeNew:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get balance amount pay (single row)
 */
async function balanceAmtPay(reg) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE WHERE AFSPB_REG_NO = :1 AND AFSPB_STATUS_FLAG = 2 AND AFSPB_FEE_CODE IN (10,12) ORDER BY AFSPB_SEMESTER ASC`,
            [reg],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in balanceAmtPay:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get bank service charges (single row)
 */
async function bankChargesFee(reg) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE WHERE AFSPB_REG_NO = :1 AND AFSPB_STATUS_FLAG = 2 AND AFSPB_FEE_CODE = 14`,
            [reg],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in bankChargesFee:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get balance amount count (all rows)
 */
async function balanceAmtCount(reg) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE WHERE AFSPB_REG_NO = :1 AND AFSPB_FEE_CODE IN (10,12) AND AFSPB_STATUS_FLAG = 2 ORDER BY AFSPB_SEMESTER DESC`,
            [reg],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in balanceAmtCount:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get balance amount count 8 (all rows)
 */
async function balanceAmtCount8(reg) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE WHERE AFSPB_REG_NO = :1 AND AFSPB_FEE_CODE IN (10,12) AND AFSPB_STATUS_FLAG IN (12,8) ORDER BY AFSPB_SEMESTER DESC`,
            [reg],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in balanceAmtCount8:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get balance amount count 8 New (all rows) - status flag 9, fee codes 10/12, ordered by semester desc
 * @param {string|number} reg - Student registration number
 * @returns {Promise<Array>} List of payment balance records
 */
async function balance_amt_count_8New(reg) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE WHERE AFSPB_REG_NO = :1 AND AFSPB_FEE_CODE IN (10,12) AND AFSPB_STATUS_FLAG = 9 ORDER BY AFSPB_SEMESTER DESC`,
            [reg],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in balance_amt_count_8New:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get remarks for a balance type
 */
async function balanceRemarks(balanceType) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT FIT_REMARKS FROM FEE_INTERIM_STATUS WHERE FIT_STATUS = :1',
            [balanceType],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in balanceRemarks:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get all transactions for a student
 */
async function getTransAll(register) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM FEE_TRANSACTION_ALL WHERE FSA_REG_NO = :1 AND FT_FEE_CODE = \'10\' ORDER BY FT_TRANSACTION_TIME ASC',
            [register],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in getTransAll:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get all transactions for a first-year student
 * @param {string|number} register - Student registration number
 * @param {number} admissionYear - Student admission year
 * @returns {Promise<Array>} List of transaction objects
 */
async function getTransAllFirstYear(register, admissionYear) {
    let connection;
    try {
        connection = await getConnection();
        // Assuming first year means session or semester = 1, or session year = admissionYear
        // Adjust the query as per your schema if needed
        const result = await connection.execute(
            `SELECT * FROM FEE_TRANSACTION_ALL 
             WHERE FSA_REG_NO = :1 
               AND FT_FEE_CODE = '10'
               AND (FT_SESSION_YEAR = :2 OR FT_SEMESTER = 1)
             ORDER BY FT_TRANSACTION_TIME ASC`,
            [register, admissionYear],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in getTransAllFirstYear:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Match temp receipt (get semester for a transaction)
 * @param {string|number} transId - Transaction ID
 * @returns {Promise<Object|null>} Semester data or null if not found
 */
async function matchTempReceipt(transId) {
    let connection;
    try {
        connection = await oracledb.getConnection(dcbConfig);
        // console.log('[matchTempReceipt] Query:', 'SELECT FR_SEMESTER FROM FEE_RECEIPT WHERE FR_TRANS_ID = :1', 'Value:', transId);
        const result = await connection.execute(
            'SELECT FR_SEMESTER FROM FEE_RECEIPT WHERE FR_TRANS_ID = :1',
            [transId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in matchTempReceipt:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection in matchTempReceipt:', err);
            }
        }
    }
}

/**
 * Get session by session ID
 */
async function getSession(session) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM FEE_SESSION WHERE FS_SESSION_ID = :1',
            [session],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getSession:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee amount from FEE_MASTER
 */
async function getFeeAmountFeeMaster(sess, feeType) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM FEE_MASTER WHERE FM_SESSION_ID = :1 AND FM_TYPE = :2',
            [sess, feeType],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in getFeeAmountFeeMaster:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee amount from FEE_MASTER with feeid
 */
async function getFeeAmountFeeMasterWhere(sessionId, feeType, feeId) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM FEE_MASTER WHERE FM_SESSION_ID = :1 AND FM_TYPE = :2 AND FM_FEE_ID = :3',
            [sessionId, feeType, feeId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in getFeeAmountFeeMasterWhere:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get special type amount from FEE_MASTER
 */
async function getSpecialTypeAmt(sess, specialType) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM FEE_MASTER WHERE FM_SESSION_ID = :1 AND FM_TYPE = :2',
            [sess, specialType],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in getSpecialTypeAmt:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get late fee type from FEE_DATE
 */
async function getLateFeeType(session, givenDate, feeCode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM FEE_DATE WHERE FDA_SESSION_ID = :1 AND FDA_FROM <= TO_DATE(:2, 'YYYY-MM-DD') AND FDA_TO >= TO_DATE(:2, 'YYYY-MM-DD') AND FDA_FEE_CODE = :3`,
            [session, givenDate, givenDate, feeCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getLateFeeType:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get penalty amount from FEE_MASTER
 */
async function getPenaltyAmt(session, feeType) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT FM_FEE_AMOUNT FROM FEE_MASTER WHERE FM_SESSION_ID = :1 AND FM_TYPE = :2 ORDER BY FM_FEE_AMOUNT ASC',
            [session, feeType],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in getPenaltyAmt:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get semester for a transaction/session
 * @param {number} sessionId - Session ID
 * @param {string} transId - Transaction ID
 * @returns {Promise<Object>} Semester data
 */
async function getSemesterInFeeStudCumAll(sessionId, transId) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT FSC_SEMESTER FROM FEE_STUD_CUM_ALL WHERE FT_TRANSACTION_ID = :1 AND FSC_SESSION_ID = :2`,
      [transId, sessionId],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getSemesterInFeeStudCumAll:', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

/**
 * Get current sysdate from Oracle DB
 * @returns {Promise<string>} The current sysdate as a string
 */
async function getSysdateFromOracleDb() {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute('SELECT SYSDATE FROM DUAL');
        // Oracle returns date as JS Date object in result.rows[0][0]
        if (result.rows && result.rows[0] && result.rows[0][0]) {
            // Convert to ISO string (or any format you need)
            return result.rows[0][0].toISOString().slice(0, 10); // 'YYYY-MM-DD'
        }
        return null;
    } catch (error) {
        console.error('Error in getSysdateFromOracleDb:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get redo data 2 for a student (AFSPB_FEE_CODE = 13, AFSPB_STATUS_FLAG = 2)
 * @param {string|number} register - Student registration number
 * @returns {Promise<Object|null>} Redo data row or null
 */
async function getRedoData(register) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE WHERE AFSPB_REG_NO = :1 AND AFSPB_FEE_CODE = 13 AND AFSPB_STATUS_FLAG = 2`,
            [register],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getRedoData:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get all pending SC/ST fees for a student
 * @param {string|number} register - Student registration number
 * @returns {Promise<Array>} List of pending SC/ST fees
 */
async function getAllPendingFeeScst(register) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_STUDENT_PAYMENT_SCST 
             WHERE AFSPS_REG_NO = :1 
             AND AFSPS_STATUS_FLAG = 2 
             AND AFSPS_ACTIVE_STATUS = 1 
             AND AFSPS_FEE_CODE = 10 
             ORDER BY AFSPS_SEMESTER DESC`,
            [register],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows || [];
    } catch (error) {
        console.error('Error in getAllPendingFeeScst:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee branch details by branch code
 * @param {string|number} branchCode - Branch code
 * @returns {Promise<Object|null>} Fee branch row or null
 */
async function getFeeBranchWithBranchCode(branchCode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM FEE_BRANCH WHERE FB_BRANCH_CODE = :1',
            [branchCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getFeeBranchWithBranchCode:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee degree details by degree code
 * @param {string|number} degCode - Degree code
 * @returns {Promise<Object|null>} Fee degree row or null
 */
async function feeDegree(degCode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            'SELECT * FROM FEE_DEGREE WHERE FDG_DEGREE_CODE = :1',
            [degCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }

        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in feeDegree:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee transaction balance details
 * @param {string|number} register - Student registration number
 * @param {string|number} sess - Session ID
 * @param {string|number} feecode - Fee code
 * @returns {Promise<Object|null>} Transaction balance row or null
 */
async function getFeeTransBalanceDetails(register, sess, feecode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_TRANSACTION_BALANCE_SUCCESS WHERE AFTBS_FEE_CODE = :1 AND AFTBS_SESSION_ID = :2 AND AFTBS_REG_NO = :3`,
            [feecode, sess, register],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getFeeTransBalanceDetails:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get transaction time for zero fee
 * @param {string|number} register - Student registration number
 * @param {string|number} sess - Session ID
 * @param {string|number} feecode - Fee code
 * @returns {Promise<Object|null>} Transaction row or null
 */
async function getTransTimeForZeroFee(register, sess, feecode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_TRANSACTION_BALANCE_SUCCESS WHERE AFTBS_REG_NO = :1 AND AFTBS_SESSION_ID = :2 AND AFTBS_FEE_CODE = :3`,
            [register, sess, feecode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getTransTimeForZeroFee:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee redo transaction details
 * @param {string|number} register - Student registration number
 * @param {string|number} sess - Session ID
 * @param {string|number} feecode - Fee code
 * @returns {Promise<Object|null>} Redo transaction row or null
 */
async function getFeeRedoTransDetails(register, sess, feecode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM AC_FEE_TRANSACTION_BALANCE_SUCCESS WHERE AFTBS_REG_NO = :1 AND AFTBS_FEE_CODE = :2 AND AFTBS_SESSION_ID = :3`,
            [register, feecode, sess],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getFeeRedoTransDetails:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get type (FDA_FEE_TYPE) from FEE_DATE
 * @param {string|number} session - Session ID
 * @param {string|number} feecode - Fee code
 * @returns {Promise<Object|null>} Fee type row or null
 */
async function getType(session, feecode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT FDA_FEE_TYPE FROM FEE_DATE WHERE FDA_SESSION_ID = :1 AND FDA_FEE_CODE = :2 ORDER BY FDA_DATE_ID DESC FETCH FIRST 1 ROWS ONLY`,
            [session, feecode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getType:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get late fee type for SCST from FEE_DATE_SCST
 * @param {string|number} session - Session ID
 * @param {string} givenDate - Date string (YYYY-MM-DD)
 * @param {string|number} feecode - Fee code
 * @param {string|number} campCode - Campus code
 * @returns {Promise<Object|null>} Late fee type row or null
 */
async function getLateFeeTypeScst(session, givenDate, feecode,campCode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM FEE_DATE_SCST WHERE FDAS_SESSION_ID = :1 AND TRUNC(FDAS_FROM) <= TO_DATE(:2, 'YYYY-MM-DD') AND TRUNC(FDAS_TO) >= TO_DATE(:2, 'YYYY-MM-DD') AND FDAS_FEE_CODE = :3 AND FDAS_CAMP_CODE = :4`,
            [session, givenDate, givenDate, feecode, campCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getLateFeeTypeScst:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get type for SCST (FDAS_FEE_TYPE) from FEE_DATE_SCST
 * @param {string|number} session - Session ID
 * @param {string|number} feecode - Fee code
 * @param {string|number} campCode - Campus code
 * @returns {Promise<Object|null>} Fee type row or null
 */
async function getTypeScst(session, feecode, campCode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT FDAS_FEE_TYPE FROM FEE_DATE_SCST WHERE FDAS_SESSION_ID = :1 AND FDAS_FEE_CODE = :2 AND FDAS_CAMP_CODE = :3 ORDER BY FDAS_DATE_ID DESC FETCH FIRST 1 ROWS ONLY`,
            [session, feecode, campCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getTypeScst:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee type 0 for SCST (FDAS_FROM, FDAS_TO)
 * @param {string|number} session - Session ID
 * @param {string|number} feecode - Fee code
 * @param {string|number} campCode - Campus code
 * @returns {Promise<Object|null>} Fee type 0 row or null
 */
async function getFeeType0(session, feecode, campCode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT FDAS_FROM, FDAS_TO FROM FEE_DATE_SCST WHERE FDAS_SESSION_ID = :1 AND FDAS_FEE_CODE = :2 AND FDAS_CAMP_CODE = :3 AND FDAS_FEE_TYPE = 0 ORDER BY FDAS_DATE_ID DESC FETCH FIRST 1 ROWS ONLY`,
            [session, feecode, campCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getFeeType0:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get fee type 45 for SCST (FDAS_TO)
 * @param {string|number} session - Session ID
 * @param {string|number} feecode - Fee code
 * @param {string|number} campCode - Campus code
 * @returns {Promise<Object|null>} Fee type 45 row or null
 */
async function getFeeType45(session, feecode, campCode) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT FDAS_TO FROM FEE_DATE_SCST WHERE FDAS_SESSION_ID = :1 AND FDAS_FEE_CODE = :2 AND FDAS_CAMP_CODE = :3 AND FDAS_FEE_TYPE = 45 ORDER BY FDAS_DATE_ID DESC FETCH FIRST 1 ROWS ONLY`,
            [session, feecode, campCode],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getFeeType45:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get tution fee less amount by feeType, session, and feeid
 * @param {string|number} feeType
 * @param {string|number} feeSession
 * @param {string|number} feeid
 * @returns {Promise<Object|null>} Fee master row or null
 */
async function getFeeIdTutionfeeless(feeType, feeSession, feeid) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM FEE_MASTER WHERE FM_SESSION_ID = :1 AND FM_TYPE = :2 AND FM_FEE_ID = :3 ORDER BY FM_FEE_ID ASC`,
            [feeSession, feeType, feeid],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getFeeIdTutionfeeless:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get due remarks (returns 0 if found, 1 if not found)
 * @param {string|number} Register
 * @param {string|number} sess
 * @returns {Promise<number>} 0 if found, 1 if not found
 */
async function getDueRemarks(Register, sess) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM FEE_DUEMASTER WHERE FD_SESSION_ID = :1 AND FD_REG_NO = :2`,
            [sess, Register],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const row = result.rows[0];
        if (row) {
            return 0;
        } else {
            return 1;
        }
    } catch (error) {
        console.error('Error in getDueRemarks:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get original amount (sum) from FEE_MASTER
 * @param {string|number} session
 * @param {string|number} feetype
 * @returns {Promise<Object|null>} Object with TOTAL_FEE_AMOUNT or null
 */
async function getOriginalAmt(session, feetype) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT SUM(FM_FEE_AMOUNT) AS TOTAL_FEE_AMOUNT FROM FEE_MASTER WHERE FM_SESSION_ID = :1 AND FM_TYPE = :2`,
            [session, feetype],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getOriginalAmt:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get willingness (row from FEE_STUDENT for FS_FEE_CODE=10)
 * @param {string|number} Register
 * @returns {Promise<Object|null>} FEE_STUDENT row or null
 */
async function getWillimgness(Register) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM FEE_STUDENT WHERE FS_FEE_CODE = 10 AND FS_REG_NO = :1`,
            [Register], 
            { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getWillimgness:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * Get data from FEE_STUDENT where FS_REG_NO = register, FS_STATUS_FLG in ('2'), FS_FEE_CODE = '10'
 * @param {string|number} register - Student registration number
 * @returns {Promise<Object|null>} FEE_STUDENT row or null
 */
async function getDataFromFeeStudWhere(register) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM FEE_STUDENT WHERE FS_REG_NO = :1 AND FS_STATUS_FLG IN ('2') AND FS_FEE_CODE = '10'`,
            [register],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getDataFromFeeStudWhere:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    }
}

// Initialize connections when this module is loaded
initializeConnections().catch(console.error);

// Export all functions as named exports
module.exports = {
    getDataFromFeeStud,
    getStudentPhotoByRegNo,
    getDeptName,
    getAllFeeDetails,
    getAllPendingFee,
    getTransactionHistory,
    insertFeeTransaction,
    updateFeePaymentStatus,
    getFeeAmount,
    getBalanceAmount,
    getFeeByIdAndSession,
    getFeeName,
    getStudentFeeDetails,
    checkStudentAdmissionStatusForLogin,
    getPdf,
    getAllFeeDetails9Where,
    getAllPendingFeeOld,
    getAllPendingFeeNew8,
    getAllPendingFeeNew,
    balanceAmtPay,
    bankChargesFee,
    balanceAmtCount,
    balanceAmtCount8,
    balanceAmtCount8New,
    balanceRemarks,
    getTransAll,
    getTransAllFirstYear,
    matchTempReceipt,
    getSession,
    getFeeAmountFeeMaster,
    getFeeAmountFeeMasterWhere,
    getSpecialTypeAmt,
    getLateFeeType,
    getPenaltyAmt,
    balance_amt_count_8New,
    getSemesterInFeeStudCumAll,
    getSysdateFromOracleDb,
    getRedoData,
    getAllPendingFeeScst,
    getFeeBranchWithBranchCode,
    feeDegree,
    getFeeTransBalanceDetails,
    getTransTimeForZeroFee,
    getFeeRedoTransDetails,
    getType,
    getLateFeeTypeScst,
    getTypeScst,
    getFeeType0,
    getFeeType45,
    getFeeIdTutionfeeless,
    getDueRemarks,
    getOriginalAmt,
    getWillimgness,
    getDataFromFeeStudWhere,
    getEmpIdByDevice,
    getAdmYear
};