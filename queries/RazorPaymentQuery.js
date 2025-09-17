const oracledb = require('oracledb');
const { format } = require('date-fns');

let dbConfig = {
  user: process.env.STUDENT_DB_USER,
  password: process.env.STUDENT_DB_PASSWORD,
  connectString: process.env.STUDENT_DB_CONNECT_STRING
};

let dcbDbConfig = {
  user: process.env.DCB_DB_USER,
  password: process.env.DCB_DB_PASSWORD,
  connectString: process.env.DCB_DB_CONNECT_STRING
};

async function getReceiptPDF(student, sem, trans_id) {
  const connection = await oracledb.getConnection(dcbDbConfig);

  try {
    const query = `
      SELECT FR_PDF
      FROM FEE_RECEIPT
      WHERE FR_REGNO = :student
        AND FR_SEMESTER = :sem
        AND FR_TRANS_ID = :trans_id
    `;

    const result = await connection.execute(
      query,
      { student, sem, trans_id },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        fetchInfo: {
          FR_PDF: { type: oracledb.BUFFER }
        },
      }
    );

    const row = result.rows?.[0];

    if (!row) return null;

    return {
      buffer: row.FR_PDF,
      mimeType: 'application/pdf',
      fileName: 'receipt.pdf',
    };
  } catch (err) {
    console.error('❌ Error fetching receipt PDF:', err);
    throw err;
  } finally {
    await connection.close();
  }
}

async function getDeptName(deptCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FD_DEPT_NAME FROM FEE_DEPARTMENT WHERE FD_DEPT_CODE = :deptCode`,
      [deptCode],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getFeeStudent(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_STUDENT WHERE FS_REG_NO = :reg AND FS_FEE_CODE = '10'`,
      [register],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function updateFeeStatusFlag(regNo, sessId, feeCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(
      `UPDATE AC_FEE_STUDENT_PAYMENT
       SET AFSP_STATUS_FLAG = 8
       WHERE AFSP_REG_NO = :regNo
         AND AFSP_STATUS_FLAG = 2
         AND AFSP_SESSION_ID = :sessId
         AND AFSP_FEE_CODE = :feeCode`,
      { regNo, sessId, feeCode },
      { autoCommit: true }
    );
    return true;
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    await connection.close();
  }
}

async function getFeeDetails(regNo, activeStatus, onlyOne = false) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT 
       WHERE AFSP_REG_NO = :regNo AND AFSP_STATUS_FLAG = 2 AND AFSP_ACTIVE_STATUS = :activeStatus AND AFSP_FEE_CODE = 10
       ORDER BY AFSP_SEMESTER ASC`,
      [regNo, activeStatus],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return onlyOne ? result.rows?.[0] || null : result.rows;
  } finally {
    await connection.close();
  }
}

async function getAllPendingFeeNew(regNo) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT 
       WHERE AFSP_REG_NO = :regNo 
       AND AFSP_STATUS_FLAG = 2 
       AND AFSP_ACTIVE_STATUS = 1 
       AND AFSP_FEE_CODE = 10`,
      [regNo],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

async function getAllPendingFeeNew8(regNo) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT 
       WHERE AFSP_REG_NO = :regNo 
       AND AFSP_STATUS_FLAG IN (12, 8) 
       AND AFSP_ACTIVE_STATUS = 1 
       AND AFSP_FEE_CODE = 10 
       ORDER BY AFSP_SEMESTER DESC`,
      [regNo],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

async function getAllPendingFeeOld8(regNo) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT 
       WHERE AFSP_REG_NO = :regNo 
       AND AFSP_STATUS_FLAG IN (12, 8) 
       AND AFSP_ACTIVE_STATUS = 0 
       AND AFSP_FEE_CODE = 10 
       ORDER BY AFSP_SEMESTER DESC`,
      [regNo],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

async function getAllPendingFeeOld(regNo) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT 
       WHERE AFSP_REG_NO = :regNo 
       AND AFSP_STATUS_FLAG = 2 
       AND AFSP_ACTIVE_STATUS = 0 
       AND AFSP_FEE_CODE = 10`,
      [regNo],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

async function getfeeamount(sessionId, feeType) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_MASTER 
       WHERE FM_SESSION_ID = :sessionId AND FM_TYPE = :feeType`,
      [sessionId, feeType],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

async function getSession(sessionId) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_SESSION WHERE FS_SESSION_ID = :sessionId`,
      [sessionId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function matchTempReceipt(regNo, transId) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FR_SEMESTER FROM FEE_RECEIPT 
       WHERE FR_REGNO = :regNo AND FR_TRANS_ID = :transId`,
      [regNo, transId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function insertFeeTransactionSuccess(data) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(`BEGIN NULL; END;`);
    await connection.execute(
      `INSERT INTO AC_FEE_TRANSACTION_SUCCESS (
        AFTS_REG_NO, AFTS_AMOUNT_PAID, AFTS_BANK_ID, AFTS_TRANSACTION_TIME,
        AFTS_FEE_CODE, AFTS_SESSION_ID, AFTS_LATE_FEE, AFTS_READMISSION_FEE,
        AFTS_TRANSACTION_ID, AFTS_BANK_TRXN_ID, AFTS_STATUS_FLG,
        AFTS_PAYMENT_MODE, AFTS_RESPONSE_TYPE
      ) VALUES (
        :regNo, :amount, :bankId, SYSDATE,
        :feeCode, :sessionId, :lateFee, :readmissionFee,
        :transId, NULL, :statusFlag,
        NULL, NULL
      )`,
      {
        regNo: data.regNo,
        amount: data.amount,
        bankId: data.bankId,
        feeCode: data.feeCode,
        sessionId: data.sessionId,
        lateFee: data.lateFee,
        readmissionFee: data.readmissionFee,
        transId: data.transId,
        statusFlag: data.statusFlag
      },
      { autoCommit: true }
    );
    return true;
  } catch (err) {
    console.error('Insert failed:', err);
    return false;
  } finally {
    await connection.close();
  }
}

async function getFeeTransBalanceDetails(register, sess, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_TRANSACTION_BALANCE_SUCCESS 
       WHERE AFTBS_REG_NO = :register 
         AND AFTBS_SESSION_ID = :sess 
         AND AFTBS_FEE_CODE = :feecode`,
      { register, sess, feecode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getFeeTransDetails(register, sess, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_TRANSACTION_SUCCESS 
       WHERE AFTS_REG_NO = :register 
         AND AFTS_SESSION_ID = :sess 
         AND AFTS_FEE_CODE = :feecode 
       ORDER BY AFTS_TRANSACTION_TIME DESC`,
      { register, sess, feecode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getFeeRedoTransDetails(register, sess, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_TRANSACTION_BALANCE_SUCCESS 
       WHERE AFTBS_REG_NO = :register 
         AND AFTBS_SESSION_ID = :sess 
         AND AFTBS_FEE_CODE = :feecode`,
      { register, sess, feecode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function fetchFeeSerialNumMaster(feeCode, sessionId) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_SERIAL_NO_MASTER 
       WHERE FSM_FEE_CODE = :feeCode AND FSM_SESSION_ID = :sessionId`,
      { feeCode, sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function updateSerialNumber(fsmSerialNo, feeCode, sessionId) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(`BEGIN NULL; END;`);
    await connection.execute(
      `UPDATE FEE_SERIAL_NO_MASTER 
       SET FSM_SERIAL_NO = :fsmSerialNo 
       WHERE FSM_FEE_CODE = :feeCode AND FSM_SESSION_ID = :sessionId`,
      { fsmSerialNo, feeCode, sessionId },
      { autoCommit: true }
    );
    return true;
  } catch (err) {
    console.error('Update serial failed:', err);
    return false;
  } finally {
    await connection.close();
  }
}

async function getRedoData2(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE 
       WHERE AFSPB_REG_NO = :register 
         AND AFSPB_FEE_CODE = 13 
         AND AFSPB_STATUS_FLAG = 2`,
      { register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getRedoData(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE 
       WHERE AFSPB_REG_NO = :register 
         AND AFSPB_FEE_CODE = 13`,
      { register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function redoCourse(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FE_REGULAR_FEE_AMOUNT FROM FEE_EXAMINATION 
       WHERE FE_REG_NO = :register`,
      { register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getTransTimeForZeroFee(register, sess, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_TRANSACTION_BALANCE_SUCCESS 
       WHERE AFTBS_REG_NO = :register 
         AND AFTBS_SESSION_ID = :sess 
         AND AFTBS_FEE_CODE = :feecode`,
      { register, sess, feecode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function bankChargesFee(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE 
       WHERE AFSPB_REG_NO = :register 
         AND AFSPB_FEE_CODE = 14`,
      { register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getfeeIdTutionfeeless(feeType, feeSession, feeId) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FM_FEE_ID, FM_FEE_AMOUNT
       FROM FEE_MASTER
       WHERE FM_SESSION_ID = :feeSession
         AND FM_TYPE = :feeType
         AND FM_FEE_ID = :feeId
       ORDER BY FM_FEE_ID ASC`,
      { feeSession, feeType, feeId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function get_penalty_amt(session, feetype) {
  if (!session || !feetype) {
    throw new Error('Session and feetype are required parameters');
  }

  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FM_FEE_AMOUNT FROM FEE_MASTER 
       WHERE FM_SESSION_ID = :1 
         AND FM_TYPE = :2 
       ORDER BY FM_FEE_AMOUNT ASC`,
      [session, feetype],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Return the first row's FM_FEE_AMOUNT if exists, otherwise return 0
    return  result.rows || [] ;
  } catch (error) {
    console.error('Error in get_penalty_amt:', error);
    throw error; // Re-throw the error to be handled by the caller
  } finally {
    await connection.close();
  }
}

async function getFeeBankReturn(bankCode, retString, transId) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_BANK_RETURN
       WHERE FBR_BANK_ID = :bankCode
         AND FBR_RET_STRING = :retString
         AND FBR_TRANSACTION_ID = :transId`,
      { bankCode, retString, transId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function updateHitCountACStudPaymentDupId(studRegNo, sessionId, feeCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(
      `UPDATE AC_FEE_STUDENT_PAYMENT
       SET AFSP_HIT_COUNT = NVL(AFSP_HIT_COUNT,0) + 1
       WHERE AFSP_REG_NO = :studRegNo
         AND AFSP_SESSION_ID = :sessionId
         AND AFSP_FEE_CODE = :feeCode`,
      { studRegNo, sessionId, feeCode },
      { autoCommit: true }
    );
    return true;
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    await connection.close();
  }
}

async function getFeeSerialNumMasterWithFeeCodeSess(feeCode, sessionId) {
  const connection = await oracledb.getConnection(dbConfig);
  console.log(feeCode, sessionId, 'feeCode, sessionId');
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_SERIAL_NO_MASTER
       WHERE FSM_FEE_CODE = :feeCode
         AND FSM_SESSION_ID = :sessionId`,
      { feeCode, sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function fetchFeeBankByBankID(bankId) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_BANK WHERE FB_BANK_ID = :bankId`,
      { bankId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function insertFeeBankSent(
  studRegNo,
  bankCode,
  feeTransactionId,
  ipAddress,
  feeAmountTotal,
  sessionId,
  feeCode,
  lateFee,
  reAdmFee,
  uniqueSessionId,
  orderId
) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(
      `INSERT INTO AC_FEE_BANK_SENT (
        FBS_REG_NO, FBS_BANK_CODE, FBS_TRANSACTION_ID, FBS_IP_ADDRESS,
        FBS_FEE_AMOUNT, FBS_LATE_FEE, FBS_READMISSION, FBS_UNIQUE_SESSID,
        FBS_BANK_ORDER_ID, FBS_STATUS, FBS_HIT_TIME
      ) VALUES (
        :studRegNo, :bankCode, :feeTransactionId, :ipAddress,
        :feeAmountTotal, :lateFee, :reAdmFee, :uniqueSessionId,
        :orderId, 0, SYSDATE
      )`,
      {
        studRegNo, bankCode, feeTransactionId, ipAddress,
        feeAmountTotal, lateFee, reAdmFee, uniqueSessionId, orderId
      },
      { autoCommit: true }
    );
    await connection.execute(
      `UPDATE FEE_SERIAL_NO_MASTER
       SET FSM_SERIAL_NO = FSM_SERIAL_NO + 1
       WHERE FSM_FEE_CODE = :feeCode AND FSM_SESSION_ID = :sessionId`,
      { feeCode, sessionId },
      { autoCommit: true }
    );
    return true;
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    await connection.close();
  }
}

async function getFeeBankSentWithTransId(transactionId) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_BANK_SENT WHERE FBS_TRANSACTION_ID = :transactionId`,
      { transactionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function InsertFeeBankReturn(bankEncryptValue, feeTransactionId, bankId) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(
      `INSERT INTO AC_FEE_BANK_RETURN (
        FBR_RET_STRING, FBR_TRANSACTION_ID, FBR_BANK_ID, FBR_TIME
      ) VALUES (
        :bankEncryptValue, :feeTransactionId, :bankId, SYSDATE
      )`,
      { bankEncryptValue, feeTransactionId, bankId },
      { autoCommit: true }
    );
    return true;
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    await connection.close();
  }
}

async function getAcFeeStudentPaymentBalanceWith(register, feeCode, feeSessionId, status) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE
       WHERE AFSPB_REG_NO = :register
         AND AFSPB_FEE_CODE = :feeCode
         AND AFSPB_SESSION_ID = :feeSessionId
         AND AFSPB_STATUS_FLAG = :status`,
      { register, feeCode, feeSessionId, status },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getAcFeeStudentPaymentWith(register, feeCode, feeSessionId, status) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT
       WHERE AFSP_REG_NO = :register
         AND AFSP_FEE_CODE = :feeCode
         AND AFSP_SESSION_ID = :feeSessionId
         AND AFSP_STATUS_FLAG = :status`,
      { register, feeCode, feeSessionId, status },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function InsertBalanceSuccessUpdatePaymentBalanceUpdateBankSendCloseTime(
  registerNum,
  feeAmount,
  bankCode,
  transactionId,
  transactionTime,
  feeCode,
  feeSessionId,
  lateFee,
  reAdmFee,
  bankTransId,
  successStatus,
  paymentMode,
  responseType,
  setBalanceStatus,
  whereBalanceStatus
) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute('BEGIN NULL; END;');
    await connection.execute('SAVEPOINT before_trans');
    await connection.execute(
      `INSERT INTO AC_FEE_TRANSACTION_BALANCE_SUCCESS (
        AFTBS_REG_NO, AFTBS_AMOUNT_PAID, AFTBS_BANK_ID, AFTBS_TRANSACTION_ID, AFTBS_TRANSACTION_TIME,
        AFTBS_FEE_CODE, AFTBS_SESSION_ID, AFTBS_LATE_FEE, AFTBS_READMISSION_FEE, AFTBS_BANK_TRXN_ID,
        AFTBS_STATUS_FLG, AFTBS_PAYMENT_MODE, AFTBS_RESPONSE_TYPE, AFTBS_INSERTED_TIME
      ) VALUES (
        :registerNum, :feeAmount, :bankCode, :transactionId, :transactionTime,
        :feeCode, :feeSessionId, :lateFee, :reAdmFee, :bankTransId,
        :successStatus, :paymentMode, :responseType, SYSDATE
      )`,
      {
        registerNum, feeAmount, bankCode, transactionId, transactionTime,
        feeCode, feeSessionId, lateFee, reAdmFee, bankTransId,
        successStatus, paymentMode, responseType
      }
    );
    await connection.execute(
      `UPDATE AC_FEE_STUDENT_PAYMENT_BALANCE
       SET AFSPB_STATUS_FLAG = :setBalanceStatus
       WHERE AFSPB_REG_NO = :registerNum
         AND AFSPB_SESSION_ID = :feeSessionId
         AND AFSPB_FEE_CODE = :feeCode
         AND AFSPB_STATUS_FLAG = :whereBalanceStatus`,
      { setBalanceStatus, registerNum, feeSessionId, feeCode, whereBalanceStatus }
    );
    await connection.execute(
      `UPDATE AC_FEE_BANK_SENT
       SET FBS_CLOSE_TIME = SYSDATE
       WHERE FBS_REG_NO = :registerNum
         AND FBS_TRANSACTION_ID = :transactionId`,
      { registerNum, transactionId }
    );
    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return false;
  } finally {
    await connection.close();
  }
}

async function InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatus(
  registerNum,
  feeAmount,
  bankCode,
  transactionId,
  transactionTime,
  feeCode,
  feeSessionId,
  lateFee,
  reAdmFee,
  bankTransId,
  successStatus,
  paymentMode,
  responseType,
  setStatus,
  whereStatus
) {
  const connection = await oracledb.getConnection(dbConfig);
  console.log(transactionTime,'Starting transaction...');
  try {
    await connection.execute('BEGIN NULL; END;');
    await connection.execute('SAVEPOINT before_trans');
    await connection.execute(
      `INSERT INTO AC_FEE_TRANSACTION_SUCCESS (
        AFTS_REG_NO, AFTS_AMOUNT_PAID, AFTS_BANK_ID, AFTS_TRANSACTION_ID, AFTS_TRANSACTION_TIME,
        AFTS_FEE_CODE, AFTS_SESSION_ID, AFTS_LATE_FEE, AFTS_READMISSION_FEE, AFTS_BANK_TRXN_ID,
        AFTS_STATUS_FLG, AFTS_PAYMENT_MODE, AFTS_RESPONSE_TYPE, AFTS_INSERTED_TIME
      ) VALUES (
        :registerNum, :feeAmount, :bankCode, :transactionId, :transactionTime,
        :feeCode, :feeSessionId, :lateFee, :reAdmFee, :bankTransId,
        :successStatus, :paymentMode, :responseType, SYSDATE
      )`,
      {
        registerNum, feeAmount, bankCode, transactionId, transactionTime,
        feeCode, feeSessionId, lateFee, reAdmFee, bankTransId,
        successStatus, paymentMode, responseType
      }
    );
    await connection.execute(
      `UPDATE AC_FEE_STUDENT_PAYMENT
       SET AFSP_STATUS_FLAG = :setStatus
       WHERE AFSP_REG_NO = :registerNum
         AND AFSP_SESSION_ID = :feeSessionId
         AND AFSP_FEE_CODE = :feeCode
         AND AFSP_STATUS_FLAG = :whereStatus`,
      { setStatus, registerNum, feeSessionId, feeCode, whereStatus }
    );
    await connection.execute(
      `UPDATE AC_FEE_BANK_SENT
       SET FBS_CLOSE_TIME = SYSDATE
       WHERE FBS_REG_NO = :registerNum
         AND FBS_TRANSACTION_ID = :transactionId`,
      { registerNum, transactionId }
    );
    await connection.execute(
      `UPDATE FEE_STUDENT
       SET FS_STATUS_FLG = :setStatus
       WHERE FS_REG_NO = :registerNum
         AND FS_SESSION_ID = :feeSessionId
         AND FS_FEE_CODE = :feeCode
         AND FS_STATUS_FLG = :whereStatus`,
      { setStatus, registerNum, feeSessionId, feeCode, whereStatus }
    );
    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return false;
  } finally {
    await connection.close();
  }
}

async function getAcFeeStudentPayment(registerNum, feeSessionId, feeCode, whereStatus) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const statusArray = whereStatus.split(',').map(Number);

    const sql = `
      SELECT *
      FROM AC_FEE_STUDENT_PAYMENT
      WHERE AFSP_REG_NO = :registerNum
        AND AFSP_SESSION_ID = :feeSessionId
        AND AFSP_FEE_CODE = :feeCode
        AND AFSP_STATUS_FLAG IN (${statusArray.map((_, i) => `:status${i}`).join(', ')})
    `;

    const binds = {
      registerNum,
      feeSessionId,
      feeCode,
    };

    statusArray.forEach((val, i) => {
      binds[`status${i}`] = val;
    });

    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getSessionForPDF(session) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_SESSION WHERE FS_SESSION_ID = :sessionId`,
      { sessionId: session },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getFeeStudentwithRegisterNoSinglerow(regNo, feeCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_STUDENT WHERE FS_REG_NO = :regNo AND FS_FEE_CODE = :feeCode`,
      { regNo, feeCode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getFeeInterimStatuswith(balanceType) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FIT_REMARKS FROM FEE_INTERIM_STATUS WHERE FIT_STATUS = :balanceType`,
      { balanceType },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getTransSuccessBalance(register, sess, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_TRANSACTION_BALANCE_SUCCESS
       WHERE AFTBS_REG_NO = :register
         AND AFTBS_SESSION_ID = :sess
         AND AFTBS_FEE_CODE = :feecode`,
      { register, sess, feecode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getTransSuccess(register, sess, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_TRANSACTION_SUCCESS
       WHERE AFTS_REG_NO = :register
         AND AFTS_SESSION_ID = :sess
         AND AFTS_FEE_CODE = :feecode`,
      { register, sess, feecode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function fetchAcStudPaymentByFeeCodeAndSessionId(studRegNo, feeCode, feeSessionId) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT
       WHERE AFSP_REG_NO = :studRegNo
         AND AFSP_FEE_CODE = :feeCode
         AND AFSP_SESSION_ID = :feeSessionId`,
      { studRegNo, feeCode, feeSessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getExemptionAmount(feeSession,feeExemptionType) {
  console.log(feeSession,feeExemptionType)
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FM_FEE_ID, FM_FEE_AMOUNT, FM_TYPE
       FROM FEE_MASTER
       WHERE FM_SESSION_ID = :feeSession
         AND FM_TYPE = :feeExemptionType`,
      { feeSession, feeExemptionType },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getFeeAmountAll(feeSession, feeType) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_MASTER
       WHERE FM_SESSION_ID = :feeSession
         AND FM_TYPE = :feeType
       ORDER BY FM_FEE_ID ASC`,
      { feeSession, feeType },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

async function getFeeId(feeType, feeSession, feeCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_MASTER
       WHERE FM_SESSION_ID = :feeSession
         AND FM_TYPE = :feeType
         AND FM_FEE_CODE = :feeCode
       ORDER BY FM_FEE_ID ASC`,
      { feeSession, feeType, feeCode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

async function getFeeName(feeId, feeSession, feeCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FN_FEE_ID, FN_NAME
       FROM FEE_NAME
       WHERE FN_SESSION_ID = :feeSession
         AND FN_FEE_ID = :feeId
         AND FN_FEE_CODE = :feeCode`,
      { feeSession, feeId, feeCode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

async function getOriginalAmountFeeMaster(session, feeType) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    console.log(session, feeType);
    const result = await connection.execute(
      `SELECT SUM(FM_FEE_AMOUNT) AS TOTAL_FEE_AMOUNT
       FROM FEE_MASTER
       WHERE FM_SESSION_ID = :sessionId
         AND FM_TYPE = :feeType`,
      { sessionId: session, feeType },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || { TOTAL_FEE_AMOUNT: 0 };
  } finally {
    await connection.close();
  }
}

async function InsertFeeReceiptUpdateBlobFn(
  type,
  registerNum,
  semester,
  base64Pdf,
  transactionId,
  transactionTime
) {
  const connection = await oracledb.getConnection(dcbDbConfig);
  try {
    await connection.execute(
      `INSERT INTO FEE_RECEIPT (
        FR_TYPE, FR_REGNO, FR_SEMESTER, FR_TRANS_ID, FR_PDF, FR_TRANS_TIME, FR_INSERT_TIME
      ) VALUES (
        :type, :registerNum, :semester, :transactionId, EMPTY_BLOB(), :transactionTime, SYSDATE
      )`,
      { type, registerNum, semester, transactionId, transactionTime },
      { autoCommit: false }
    );

    const result = await connection.execute(
      `SELECT FR_PDF FROM FEE_RECEIPT
       WHERE FR_REGNO = :registerNum AND FR_TRANS_ID = :transactionId
       FOR UPDATE`,
      { registerNum, transactionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const row = result.rows?.[0];
    const lob = row?.FR_PDF;

    if (lob && Buffer.isBuffer(base64Pdf)) {
      await new Promise((resolve, reject) => {
        lob.on('error', reject);
        lob.on('finish', resolve);
        lob.write(base64Pdf);
        lob.end();
      });
      await connection.commit();
      return true;
    } else {
      await connection.rollback();
      return false;
    }
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return false;
  } finally {
    await connection.close();
  }
}

async function UpdateAcFeeStudentPaymentBalanceUpdate(
  registerNum,
  feeCode,
  feeSessionId,
  setBalanceStatus,
  whereBalanceStatus
) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute('SAVEPOINT before_trans');
    await connection.execute(
      `UPDATE AC_FEE_STUDENT_PAYMENT_BALANCE
       SET AFSPB_STATUS_FLAG = :setBalanceStatus
       WHERE AFSPB_REG_NO = :registerNum
         AND AFSPB_FEE_CODE = :feeCode
         AND AFSPB_SESSION_ID = :feeSessionId
         AND AFSPB_STATUS_FLAG = :whereBalanceStatus`,
      { setBalanceStatus, registerNum, feeCode, feeSessionId, whereBalanceStatus }
    );
    await connection.execute(
      `UPDATE AC_FEE_TRANSACTION_BALANCE_SUCCESS
       SET AFTBS_STATUS_FLG = 1
       WHERE AFTBS_REG_NO = :registerNum
         AND AFTBS_FEE_CODE = :feeCode
         AND AFTBS_SESSION_ID = :feeSessionId
         AND AFTBS_STATUS_FLG = 0`,
      { registerNum, feeCode, feeSessionId }
    );
    if (feeCode !== 10) {
      await connection.execute(
        `UPDATE FEE_STUDENT
         SET FS_STATUS_FLG = :setBalanceStatus
         WHERE FS_REG_NO = :registerNum
           AND FS_SESSION_ID = :feeSessionId
           AND FS_FEE_CODE = :feeCode`,
        { setBalanceStatus, registerNum, feeSessionId, feeCode }
      );
    }
    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return false;
  } finally {
    await connection.close();
  }
}

async function InsertFeeStudentCummulativeUpdate(
  registerNum,
  feeCode,
  feeSessionId,
  feeType,
  specialType,
  exemptionType,
  sentFeeAmt,
  originalFeeAmt,
  lateFee,
  reAdmFee,
  gender,
  statusFlag,
  studType,
  name,
  dob,
  community,
  branchCode,
  semester,
  feeTransactionId,
  specialAmt,
  excess,
  deficit,
  claim,
  status,
  bankCode,
  campCode,
  setBalanceStatus,
  whereBalanceStatus,
  studDept
) {
  const connection = await oracledb.getConnection(dbConfig);
  console.log('Starting transaction...');
  console.log('RegisterNum:', registerNum);
  console.log(registerNum, feeCode, feeSessionId, feeType, specialType, exemptionType,
    sentFeeAmt, originalFeeAmt, lateFee, reAdmFee, gender, statusFlag,
    studType, name, dob, community, branchCode, semester,
    feeTransactionId, specialAmt, excess, deficit, claim, status,
    bankCode, campCode, studDept);
  try {
    await connection.execute('SAVEPOINT before_trans');
    await connection.execute(
      `UPDATE AC_FEE_STUDENT_PAYMENT
       SET AFSP_STATUS_FLAG = :setBalanceStatus
       WHERE AFSP_REG_NO = :registerNum
         AND AFSP_FEE_CODE = :feeCode
         AND AFSP_SESSION_ID = :feeSessionId
         AND AFSP_STATUS_FLAG = :whereBalanceStatus`,
      { setBalanceStatus, registerNum, feeCode, feeSessionId, whereBalanceStatus }
    );
    await connection.execute(
      `UPDATE AC_FEE_TRANSACTION_SUCCESS
       SET AFTS_STATUS_FLG = 1
       WHERE AFTS_REG_NO = :registerNum
         AND AFTS_FEE_CODE = :feeCode
         AND AFTS_SESSION_ID = :feeSessionId
         AND AFTS_STATUS_FLG = 0`,
      { registerNum, feeCode, feeSessionId }
    );
    await connection.execute(
      `UPDATE FEE_STUDENT
       SET FS_STATUS_FLG = :setBalanceStatus
       WHERE FS_REG_NO = :registerNum
         AND FS_SESSION_ID = :feeSessionId
         AND FS_FEE_CODE = :feeCode`,
      { setBalanceStatus, registerNum, feeSessionId, feeCode }
    );

    const dobFormatted = format(new Date(dob), 'dd-MM-yyyy');

    await connection.execute(
      `INSERT INTO FEE_STUDENT_CUMULATIVE_ALL (
        FSC_REG_NO, FSC_FEE_CODE, FSC_SESSION_ID, FSC_FEE_TYPE, FSC_SPECIAL_TYPE, FSC_EXEMPTION_TYPE,
        FSC_FEE_AMOUNT, FSC_FEE_ACTUAL, FSC_LATE_FEE, FSC_READMIN_FEE, FSC_GENDER, FSC_STATUS_FLG,
        FSC_STUD_TYPE_FLG, FSC_NAME, FSC_DOB, FSC_COMMUNITY, FSC_BRANCH_CODE, FSC_SEMESTER,
        FSC_TRANSACTION_ID, FSC_SPECIAL_AMT, FSC_EXCESS, FSC_DEFICIT, FSC_CLAIM, FSC_STATUS,
        FSC_BANK_ID, FSC_CAMP_CODE, FSC_DEPT_CODE
      ) VALUES (
        :registerNum, :feeCode, :feeSessionId, :feeType, :specialType, :exemptionType,
        :sentFeeAmt, :originalFeeAmt, :lateFee, :reAdmFee, :gender, :statusFlag,
        :studType, :name, TO_DATE(:dob, 'DD-MM-YYYY'), :community, :branchCode, :semester,
        :feeTransactionId, :specialAmt, :excess, :deficit, :claim, :status,
        :bankCode, :campCode, :studDept
      )`,
      {
        registerNum, feeCode, feeSessionId, feeType, specialType, exemptionType,
        sentFeeAmt, originalFeeAmt, lateFee, reAdmFee, gender, statusFlag,
        studType, name, dob: dobFormatted, community, branchCode, semester,
        feeTransactionId, specialAmt, excess, deficit, claim, status,
        bankCode, campCode, studDept
      }
    );
    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return false;
  } finally {
    await connection.close();
  }
}

async function InsertAcFeeBankFailPaymentFailStatus(
  bankId,
  feeTransactionId,
  registerNum,
  feeAmount,
  reason
) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(
      `INSERT INTO AC_FEE_BANK_FAIL (
        FBF_BANK_ID, FBF_TRANSACTION_ID, FBF_REG_NO, FBF_AMOUNT, FBF_REMARKS, FBF_TIME
      ) VALUES (
        :bankId, :feeTransactionId, :registerNum, :feeAmount, :reason, SYSDATE
      )`,
      { bankId, feeTransactionId, registerNum, feeAmount, reason },
      { autoCommit: true }
    );
    return true;
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    await connection.close();
  }
}

async function UpdateFeeStudentUpdate(
  registerNum,
  feeCode,
  feeSessionId,
  setStatus,
  whereStatus
) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(
      `UPDATE FEE_STUDENT
       SET FS_STATUS_FLG = :setStatus
       WHERE FS_REG_NO = :registerNum
         AND FS_SESSION_ID = :feeSessionId
         AND FS_FEE_CODE = :feeCode
         AND FS_STATUS_FLG = :whereStatus`,
      { setStatus, registerNum, feeSessionId, feeCode, whereStatus },
      { autoCommit: true }
    );
    return true;
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    await connection.close();
  }
}

// async function updateCumulativewithBalanceAmt(regNo, session, feecode, balAmt) {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT FSC_FEE_AMOUNT, FSC_SPECIAL_AMT
//        FROM FEE_STUDENT_CUMULATIVE_ALL
//        WHERE FSC_REG_NO = :regNo
//          AND FSC_SESSION_ID = :session
//          AND FSC_FEE_CODE = :feecode`,
//       { regNo, session, feecode },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     const row = result.rows?.[0];
//     console.log(row,'rowrow')
//     if (row) {
//       await connection.execute(
//         `UPDATE FEE_STUDENT_CUMULATIVE_ALL
//          SET FSC_FEE_AMOUNT = :feeAmount,
//              FSC_SPECIAL_AMT = :specialAmt
//          WHERE FSC_REG_NO = :regNo
//            AND FSC_SESSION_ID = :session
//            AND FSC_FEE_CODE = :feecode`,
//         {
//           feeAmount: (row.FSC_FEE_AMOUNT || 0) + balAmt,
//           specialAmt: (row.FSC_SPECIAL_AMT || 0) + balAmt,
//           regNo, 
//           session, 
//           feecode
//         },
//         { autoCommit: true }
//       );
//       return true;
//     }
//     return false;
//   } catch (err) {
//     console.error(err);
//     return false;
//   } finally {
//     await connection.close();
//   }
// }

async function getStudentData(RegisterNum) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_STUDENT WHERE FS_REG_NO = :reg AND FS_FEE_CODE = '10'`,
      [RegisterNum],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getStudentPersonalData(regNum) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_STUDENT_PERSONAL WHERE FSP_REG_NO = :regNum`,
      [regNum],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getFeeBranchWithBranchCode(branchCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_BRANCH WHERE FB_BRANCH_CODE = :branchCode`,
      [branchCode],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getFeeDepartmentWithDeptCode(deptCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_DEPARTMENT WHERE FD_DEPT_CODE = :deptCode`,
      [deptCode],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getType(session, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FDA_FEE_TYPE FROM FEE_DATE
       WHERE FDA_SESSION_ID = :session AND FDA_FEE_CODE = :feecode
       ORDER BY FDA_DATE_ID DESC`,
      [session, feecode],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getAcBankSent(reg) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_BANK_SENT
       WHERE FBS_REG_NO = :reg
       ORDER BY FBS_HIT_TIME DESC`,
      [reg],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function get_trans_success_balance(register, sess, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_TRANSACTION_SUCCESS
       WHERE AFTS_REG_NO = :register
         AND AFTS_SESSION_ID = :sess
         AND AFTS_FEE_CODE = :feecode`,
      { register, sess, feecode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function updateCumulativewithBalanceAmt(student, session_id,feecode, balAmt, lateFee, readmFee, feetype, special_type, exemption_type, transaction_id, bankcode) {

console.log(student, feecode, session_id, balAmt, lateFee, readmFee, feetype, special_type,
   exemption_type, transaction_id, bankcode);
   
  const connection = await oracledb.getConnection(dbConfig);
  try {
    // First check if record exists
    const result = await connection.execute(
      `SELECT FSC_FEE_AMOUNT, FSC_SPECIAL_AMT
       FROM FEE_STUDENT_CUMULATIVE_ALL
       WHERE FSC_REG_NO = :regNo
         AND FSC_SESSION_ID = :sessionId
         AND FSC_FEE_CODE = :feecode`,
      { 
        regNo: student.FS_REG_NO,
        sessionId: session_id,
        feecode: feecode
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const row = result.rows?.[0];
    console.log(row,'rowrow')
    
    if (row) {
      // Update existing record
      await connection.execute(
        `UPDATE FEE_STUDENT_CUMULATIVE_ALL
         SET FSC_FEE_AMOUNT = FSC_FEE_AMOUNT + :balAmt,
             FSC_SPECIAL_AMT = FSC_SPECIAL_AMT + :balAmt
         WHERE FSC_REG_NO = :regNo
           AND FSC_SESSION_ID = :sessionId
           AND FSC_FEE_CODE = :feecode`,
        {
          regNo: student.FS_REG_NO,
          sessionId: session_id,
          feecode: feecode,
          balAmt: balAmt
        }
      );
      return true;
    } else {
      // Insert new record
      await connection.execute(
        `INSERT INTO FEE_STUDENT_CUMULATIVE_ALL (
          FSC_REG_NO, FSC_FEE_CODE, FSC_SESSION_ID, FSC_FEE_TYPE,
          FSC_SPECIAL_TYPE, FSC_EXEMPTION_TYPE, FSC_FEE_AMOUNT, FSC_FEE_ACTUAL,
          FSC_LATE_FEE, FSC_READMIN_FEE, FSC_GENDER, FSC_STATUS_FLG,
          FSC_STUD_TYPE_FLG, FSC_NAME, FSC_DOB, FSC_COMMUNITY,
          FSC_BRANCH_CODE, FSC_SEMESTER, FSC_TRANSACTION_ID, FSC_SPECIAL_AMT,
          FSC_EXCESS, FSC_DEFICIT, FSC_CLAIM, FSC_STATUS, FSC_BANK_ID,
          FSC_CAMP_CODE, FSC_DEPT_CODE, FSC_DUE_PAID, FSC_PARTIAL_AMT_FLAG,
          FSC_TRANSACTION_DT
        ) VALUES (
          :regNo, :feeCode, :sessionId, :feeType,
          :specialType, :exemptionType, :feeAmount, :feeAmount,
          :lateFee, :readmFee, :gender, :statusFlag,
          :studType, :name, :dob, :community,
          :branchCode, :semester, :transactionId, :specialAmt,
          :excess, :deficit, :claim, :status, :bankId,
          :campCode, :deptCode, :duePaid, :partialAmtFlag,
          SYSDATE
        )`,
        {
          regNo: student.FS_REG_NO,
          feeCode: feecode,
          sessionId: session_id,
          feeType: feetype,
          specialType: special_type,
          exemptionType: exemption_type,
          feeAmount: balAmt,
          lateFee: lateFee,
          readmFee: readmFee,
          gender: student.FS_GENDER,
          statusFlag: 1,
          studType: student.FS_STUDENT_TYPE,
          name: student.FS_NAME,
          dob: student.FS_DOB,
          community: student.FS_COMMUNITY,
          branchCode: student.FS_BRANCH_CODE,
          semester: student.FS_SEMESTER,
          transactionId: transaction_id,
          specialAmt: 0,
          excess: 0,
          deficit: 0,
          claim: 0,
          status: 1,
          bankId: bankcode,
          campCode: student.FS_CAMP_CODE,
          deptCode: student.FS_DEPT_CODE,
          duePaid: 0,
          partialAmtFlag: 1
        }
      );
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    console.error('Error in updateCumulativewithBalanceAmt:', error);
    await connection.rollback();
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  getReceiptPDF,
  getDeptName,
  getFeeStudent,
  updateFeeStatusFlag,
  getFeeDetails,
  getAllPendingFeeNew,
  getAllPendingFeeNew8,
  getAllPendingFeeOld8,
  getAllPendingFeeOld,
  getfeeamount,
  getSession,
  matchTempReceipt,
  insertFeeTransactionSuccess,
  getFeeTransBalanceDetails,
  getFeeTransDetails,
  getFeeRedoTransDetails,
  fetchFeeSerialNumMaster,
  updateSerialNumber,
  getRedoData2,
  getRedoData,
  redoCourse,
  getTransTimeForZeroFee,
  bankChargesFee,
  getfeeIdTutionfeeless,
  getFeeBankReturn,
  updateHitCountACStudPaymentDupId,
  getFeeSerialNumMasterWithFeeCodeSess,
  fetchFeeBankByBankID,
  insertFeeBankSent,
  getFeeBankSentWithTransId,
  InsertFeeBankReturn,
  getAcFeeStudentPaymentBalanceWith,
  getAcFeeStudentPaymentWith,
  InsertBalanceSuccessUpdatePaymentBalanceUpdateBankSendCloseTime,
  InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatus,
  getAcFeeStudentPayment,
  getSessionForPDF,
  getFeeStudentwithRegisterNoSinglerow,
  getFeeInterimStatuswith,
  getTransSuccessBalance,
  getTransSuccess,
  fetchAcStudPaymentByFeeCodeAndSessionId,
  getExemptionAmount,
  getFeeAmountAll,
  getFeeId,
  getFeeName,
  getOriginalAmountFeeMaster,
  InsertFeeReceiptUpdateBlobFn,
  UpdateAcFeeStudentPaymentBalanceUpdate,
  InsertFeeStudentCummulativeUpdate,
  InsertAcFeeBankFailPaymentFailStatus,
  UpdateFeeStudentUpdate,
  updateCumulativewithBalanceAmt,
  getStudentData,
  getStudentPersonalData,
  getFeeBranchWithBranchCode,
  getFeeDepartmentWithDeptCode,
  getType,
  getAcBankSent,
  get_trans_success_balance,
  get_penalty_amt,
  
};