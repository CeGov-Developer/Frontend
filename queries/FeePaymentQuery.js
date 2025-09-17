const oracledb = require('oracledb');

let dbConfig = {
  user: process.env.STUDENT_DB_USER,
  password: process.env.STUDENT_DB_PASSWORD,
  connectString: process.env.STUDENT_DB_CONNECT_STRING
};

// Fetch session details for a given application number
async function getStudentSession(applicationNo) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT st.*, s.* 
       FROM FEE_STUDENT st
       JOIN FEE_SESSION s ON st.FS_SESSION_ID = s.FS_SESSION_ID
       WHERE st.FS_REG_NO = :applicationNo `,
      { applicationNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch amount from FEE_MASTER for a given session and student type
async function fetchAmountFromMaster(studentSessionId, studentType) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_MASTER WHERE FM_SESSION_ID = :studentSessionId AND FM_TYPE = :studentType`,
      { studentSessionId, studentType },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

// Fetch special amount from FEE_MASTER
async function fetchSpecialAmount(studentSessionId, studentSpecial) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FM_FEE_AMOUNT, FM_FEE_ID FROM FEE_MASTER WHERE FM_SESSION_ID = :studentSessionId AND FM_TYPE = :studentSpecial`,
      { studentSessionId, studentSpecial },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch exemption amount (FM_FEE_ID) from FEE_MASTER
async function fetchExemptionAmount(studentSessionId, studentExemption) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FM_FEE_ID FROM FEE_MASTER WHERE FM_SESSION_ID = :studentSessionId AND FM_TYPE = :studentExemption`,
      { studentSessionId, studentExemption },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

// Fetch exemption amount (FM_FEE_AMOUNT) from FEE_MASTER by feeId, feeType, and session
async function fetchExemptionAmountFromMaster(feeId, feeType, session) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FM_FEE_AMOUNT FROM FEE_MASTER WHERE FM_FEE_ID = :feeId AND FM_TYPE = :feeType AND FM_SESSION_ID = :sessionId`,
      { feeId, feeType, sessionId: session },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getSysdateFromOracleDb() {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT TO_CHAR(SYSDATE, 'DD-MON-YY') AS CURR_DATE FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const rows = result.rows;

    return rows?.[0]?.CURR_DATE ?? null;
  } catch (err) {
    console.error('Error fetching SYSDATE:', err);
    return null;
  } finally {
    await connection.close();
  }
}

// Fetch balance amount payment details
async function balanceAmtPay(reg) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE 
       WHERE AFSPB_REG_NO = :reg 
         AND AFSPB_STATUS_FLAG = 2 
         AND AFSPB_FEE_CODE IN (10,12) 
       ORDER BY AFSPB_SEMESTER DESC`,
      { reg },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(result.rows,"result.rows");
    return result.rows[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch bank service charges
async function bankServiceCharges(reg, feeCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE 
       WHERE AFSPB_REG_NO = :reg 
         AND AFSPB_STATUS_FLAG = 2 
         AND AFSPB_FEE_CODE = :feeCode`,
      { reg, feeCode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch redo data
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

// Fetch all fee details
async function getAllFeeDetails9(applicationNo) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT 
       WHERE AFSP_REG_NO = :applicationNo 
         AND AFSP_STATUS_FLAG = 2 
         AND AFSP_ACTIVE_STATUS = 1 
         AND AFSP_FEE_CODE = 10`,
      { applicationNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch session by session id
async function getSession(session) {
  const connection = await oracledb.getConnection(dbConfig);
  console.log(session,"sessiondb");
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

// Fetch last fee date
async function getLastFeeDate1(session, feeCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FDA_TO FROM FEE_DATE 
       WHERE FDA_SESSION_ID = :session 
         AND FDA_FEE_TYPE = 0 
         AND FDA_FEE_CODE = :feeCode`,
      { session, feeCode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch late fee type
async function getLateFeeType(session, givenDate, feeCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FDA_FEE_TYPE FROM FEE_DATE 
       WHERE FDA_SESSION_ID = :sessionId 
         AND FDA_FROM <= :givenDateVal 
         AND FDA_TO >= :givenDateVal 
         AND FDA_FEE_CODE = :feeCodeVal`,
      {
        sessionId: session,
        givenDateVal: givenDate,
        feeCodeVal: feeCode
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}
// Fetch penalty amount
async function getPenaltyAmt(session, feeType) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FM_FEE_AMOUNT FROM FEE_MASTER 
       WHERE FM_SESSION_ID = :session 
         AND FM_TYPE = :feeType 
       ORDER BY FM_FEE_AMOUNT ASC`,
      { session, feeType },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

// Get AC_FEE_STUDENT_PAYMENT row by regNo, feecode, sess
async function getAcpaymentfee(regNo, feecode, sess) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT
       WHERE AFSP_REG_NO = :regNo
         AND AFSP_SESSION_ID = :sess
         AND AFSP_FEE_CODE = :feecode`,
      { regNo, sess, feecode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getOriginalAmt(session, feetype) {
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT SUM(FM_FEE_AMOUNT) AS TOTAL_FEE_AMOUNT
       FROM FEE_MASTER
       WHERE FM_SESSION_ID = :sess AND FM_TYPE = :feeType`,
      { sess: session, feeType: feetype },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const row = result.rows?.[0];

    return row?.TOTAL_FEE_AMOUNT !== null && row?.TOTAL_FEE_AMOUNT !== undefined
      ? Number(row.TOTAL_FEE_AMOUNT)
      : 0;

  } catch (err) {
    console.error('Error fetching original amount:', err);
    return 0;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr);
      }
    }
  }
}

// Update FSM_SERIAL_NO in FEE_SERIAL_NO_MASTER
async function updateSerialNumberInFeeSerialNoMaster(increamentSerialNum, feeCode, sessionId) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(
      `UPDATE FEE_SERIAL_NO_MASTER
       SET FSM_SERIAL_NO = :increamentSerialNum
       WHERE FSM_FEE_CODE = :feeCode AND FSM_SESSION_ID = :sessionId`,
      { increamentSerialNum, feeCode, sessionId },
      { autoCommit: true }
    );
    return true;
  } catch {
    return false;
  } finally {
    await connection.close();
  }
}

// Update AFSP_STATUS_FLAG in AC_FEE_STUDENT_PAYMENT
async function getAllFeeDetails9Where(register, sess_id, fee_code, setStatus, previoustatus) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(
      `UPDATE AC_FEE_STUDENT_PAYMENT
       SET AFSP_STATUS_FLAG = :setStatus
       WHERE AFSP_REG_NO = :register
         AND AFSP_STATUS_FLAG = :previoustatus
         AND AFSP_SESSION_ID = :sess_id
         AND AFSP_FEE_CODE = :fee_code`,
      { setStatus, register, previoustatus, sess_id, fee_code },
      { autoCommit: true }
    );
    return true;
  } catch {
    return false;
  } finally {
    await connection.close();
  }
}

// Update FS_STATUS_FLG in FEE_STUDENT
async function updateStatusFlagStudentFee(
  studregno,
  SessionId,
  FeeCode,
  setStatus,
  previoustatus
) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `UPDATE FEE_STUDENT
       SET FS_STATUS_FLG = :setStatus
       WHERE FS_STATUS_FLG = :previoustatus
         AND FS_REG_NO = :studregno
         AND FS_SESSION_ID = :SessionId
         AND FS_FEE_CODE = :FeeCode`,
      { setStatus, previoustatus, studregno, SessionId, FeeCode },
      { autoCommit: true }
    );

    return (result.rowsAffected ?? 0) > 0;
  } finally {
    await connection.close();
  }
}

async function insertFeeStudentCummulative(
  studregno,
  FeeCode,
  FeeSessionId,
  feeType,
  special_type,
  exemption_type,
  sentFeeAmt,
  original_fee_amt,
  sentLateFee,
  sentReAdmFee,
  stud_gender,
  status_flag,
  stud_type,
  stud_name,
  stud_dob,
  stud_community,
  stud_branch,
  stud_sem,
  FeetransactionId,
  special_amt,
  excess,
  deficit,
  claim,
  status,
  bankCode,
  stud_camp,
  stud_dept,
  due_paid
) {
  const connection = await oracledb.getConnection(dbConfig);
  console.log("insertFeeStudentCummulative:", studregno, FeeCode, FeeSessionId, feeType, special_type, exemption_type, sentFeeAmt, original_fee_amt, sentLateFee, sentReAdmFee, stud_gender, status_flag, stud_type, stud_name, stud_dob, stud_community, stud_branch, stud_sem, FeetransactionId, special_amt, excess, deficit, claim, status, bankCode, stud_camp, stud_dept, due_paid);
  try {
      // Check if record exists
      const checkResult = await connection.execute(
          `SELECT 1 FROM FEE_STUDENT_CUMULATIVE_ALL 
           WHERE FSC_REG_NO = :studregno 
           AND FSC_FEE_CODE = :FeeCode 
           AND FSC_SESSION_ID = :FeeSessionId`,
          {
              studregno,
              FeeCode,
              FeeSessionId
          }
      );

      if (checkResult.rows.length > 0) {
          return false;
      }

      // Insert new record
      const insertResult = await connection.execute(
          `INSERT INTO FEE_STUDENT_CUMULATIVE_ALL (
              FSC_REG_NO,
              FSC_FEE_CODE,
              FSC_SESSION_ID,
              FSC_FEE_TYPE,
              FSC_SPECIAL_TYPE,
              FSC_EXEMPTION_TYPE,
              FSC_FEE_AMOUNT,
              FSC_FEE_ACTUAL,
              FSC_LATE_FEE,
              FSC_READMIN_FEE,
              FSC_GENDER,
              FSC_STATUS_FLG,
              FSC_STUD_TYPE_FLG,
              FSC_NAME,
              FSC_DOB,
              FSC_COMMUNITY,
              FSC_BRANCH_CODE,
              FSC_SEMESTER,
              FSC_TRANSACTION_ID,
              FSC_SPECIAL_AMT,
              FSC_EXCESS,
              FSC_DEFICIT,
              FSC_CLAIM,
              FSC_STATUS,
              FSC_BANK_ID,
              FSC_CAMP_CODE,
              FSC_DEPT_CODE,
              FSC_DUE_PAID,
              FSC_TRANSACTION_DT
          ) VALUES (
              :1, :2, :3, :4, :5, :6, :7, :8, :9, :10,
              :11, :12, :13, :14, :15, :16, :17, :18, :19, :20,
              :21, :22, :23, :24, :25, :26, :27, :28, :29, :30
          )`,
          [
              studregno,
              FeeCode,
              FeeSessionId,
              feeType,
              special_type,
              exemption_type,
              sentFeeAmt,
              original_fee_amt,
              sentLateFee,
              sentReAdmFee,
              stud_gender,
              status_flag,
              stud_type,
              stud_name,
              stud_dob,
              stud_community,
              stud_branch,
              stud_sem,
              FeetransactionId,
              special_amt,
              excess,
              deficit,
              claim,
              status,
              bankCode,
              stud_camp,
              stud_dept,
              due_paid,
              new Date() // SYSDATE equivalent
          ]
      );

      if (!insertResult.rowsAffected) {
          throw new Error('Insert failed');
      }

      await connection.commit();
      return true;
  } catch (error) {
      console.error('Error in insertFeeStudentCummulative:', error);
      throw error;
  } finally {
      await connection.close();
  }
}

// Insert into FEE_STUDENT_CUMULATIVE_ALL if not exists
async function insertFeeStudentCummulativeold(
  studregno,
  FeeCode,
  FeeSessionId,
  feeType,
  special_type,
  exemption_type,
  sentFeeAmt,
  original_fee_amt,
  sentLateFee,
  sentReAdmFee,
  stud_gender,
  status_flag,
  stud_type,
  stud_name,
  stud_dob,
  stud_community,
  stud_branch,
  stud_sem,
  FeetransactionId,
  special_amt,
  excess,
  deficit,
  claim,
  status,
  bankCode,
  stud_camp,
  stud_dept
) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    // Check if record exists
    const check = await connection.execute(
      `SELECT 1 FROM FEE_STUDENT_CUMULATIVE_ALL WHERE FSC_REG_NO = :studregno AND FSC_FEE_CODE = :FeeCode AND FSC_SESSION_ID = :FeeSessionId`,
      { studregno, FeeCode, FeeSessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (check.rows && check.rows.length > 0) {
      return false;
    }
    await connection.execute(
      `INSERT INTO FEE_STUDENT_CUMULATIVE_ALL (
        FSC_REG_NO, FSC_FEE_CODE, FSC_SESSION_ID, FSC_FEE_TYPE, FSC_SPECIAL_TYPE, FSC_EXEMPTION_TYPE,
        FSC_FEE_AMOUNT, FSC_FEE_ACTUAL, FSC_LATE_FEE, FSC_READMIN_FEE, FSC_GENDER, FSC_STATUS_FLG,
        FSC_STUD_TYPE_FLG, FSC_NAME, FSC_DOB, FSC_COMMUNITY, FSC_BRANCH_CODE, FSC_SEMESTER,
        FSC_TRANSACTION_ID, FSC_SPECIAL_AMT, FSC_EXCESS, FSC_DEFICIT, FSC_CLAIM, FSC_STATUS,
        FSC_BANK_ID, FSC_CAMP_CODE, FSC_DEPT_CODE
      ) VALUES (
        :studregno, :FeeCode, :FeeSessionId, :feeType, :special_type, :exemption_type,
        :sentFeeAmt, :original_fee_amt, :sentLateFee, :sentReAdmFee, :stud_gender, :status_flag,
        :stud_type, :stud_name, :stud_dob, :stud_community, :stud_branch, :stud_sem,
        :FeetransactionId, :special_amt, :excess, :deficit, :claim, :status,
        :bankCode, :stud_camp, :stud_dept
      )`,
      {
        studregno, FeeCode, FeeSessionId, feeType, special_type, exemption_type,
        sentFeeAmt, original_fee_amt, sentLateFee, sentReAdmFee, stud_gender, status_flag,
        stud_type, stud_name, stud_dob, stud_community, stud_branch, stud_sem,
        FeetransactionId, special_amt, excess, deficit, claim, status,
        bankCode, stud_camp, stud_dept
      },
      { autoCommit: true }
    );
    return true;
  } finally {
    await connection.close();
  }
}

// Check if payment date is valid for fee
async function getFeeDateForPayment(session_id, givenDate, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT 1 FROM FEE_DATE
       WHERE FDA_SESSION_ID = :session_id
         AND TO_DATE(:givenDate, 'dd-mm-yy') BETWEEN FDA_FROM AND FDA_TO
         AND FDA_FEE_CODE = :feecode`,
      { session_id, givenDate, feecode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return (result.rows && result.rows.length > 0) ? 1 : 0;
  } finally {
    await connection.close();
  }
}

// Fetch balance amount from AC_FEE_STUDENT_PAYMENT_BALANCE
async function fetchBalanceAmountFromStudentBalance(ApplicationNo) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE
       WHERE AFSPB_REG_NO = :ApplicationNo
         AND AFSPB_FEE_CODE = 10`,
      { ApplicationNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch FIT_REMARKS from FEE_INTERIM_STATUS
async function fetchBalanceType(type) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FIT_REMARKS FROM FEE_INTERIM_STATUS WHERE FIT_STATUS = :type`,
      { type },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch amount from AC_FEE_STUDENT_PAYMENT
async function fetchAmountfromStudentPayment(ApplicationNo) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT
       WHERE AFSP_REG_NO = :ApplicationNo
         AND AFSP_FEE_CODE = 10
         AND AFSP_STATUS_FLAG = 2`,
      { ApplicationNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch transaction receipt from AC_FEE_TRANSACTION_SUCCESS
async function fetchTransReceipt(register, sess) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_TRANSACTION_SUCCESS
       WHERE AFTS_REG_NO = :register
         AND AFTS_SESSION_ID = :sess
         AND AFTS_FEE_CODE = 10`,
      { register, sess },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch transaction receipt from AC_FEE_TRANSACTION_BALANCE_SUCCESS
async function fetch_trans_receipt_Balance(register, sess) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_TRANSACTION_BALANCE_SUCCESS
       WHERE AFTBS_REG_NO = :register
         AND AFTBS_SESSION_ID = :sess
         AND AFTBS_FEE_CODE = 10`,
      { register, sess },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Insert or update FEE_RECEIPT BLOB (simplified, actual BLOB handling may require more steps)
async function insertFeeReceiptUpdateBlob(Type, RegisterNum, Semester, Base64Pdf, TransactionId, TransactionTime) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    // Insert row with empty blob
    await connection.execute(
      `INSERT INTO FEE_RECEIPT (FR_TYPE, FR_REGNO, FR_SEMESTER, FR_TRANS_ID, FR_PDF, FR_TRANS_TIME, FR_INSERT_TIME)
       VALUES (:Type, :RegisterNum, :Semester, :TransactionId, EMPTY_BLOB(), :TransactionTime, SYSDATE)`,
      { Type, RegisterNum, Semester, TransactionId, TransactionTime },
      { autoCommit: false }
    );
    // Update the blob (this is a simplified version, for production use oracledb LOB streaming)
    await connection.execute(
      `UPDATE FEE_RECEIPT SET FR_PDF = :Base64Pdf
       WHERE FR_REGNO = :RegisterNum AND FR_TRANS_ID = :TransactionId`,
      { Base64Pdf, RegisterNum, TransactionId },
      { autoCommit: true }
    );
    return true;
  } catch {
    await connection.rollback();
    return false;
  } finally {
    await connection.close();
  }
}

// Fetch FEE_DEPARTMENT by deptCode
async function getFeeDepartmentWithDeptCode(deptCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_DEPARTMENT WHERE FD_DEPT_CODE = :deptCode`,
      { deptCode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch FEE_STUDENT by regNo and feecode
async function getFeeStudentwithRegisterNoSinglerow(regNo, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_STUDENT WHERE FS_REG_NO = :regNo AND FS_FEE_CODE = :feecode`,
      { regNo, feecode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Get fee date for payment (returns numRows and row)
async function getFeeDateForPaymentNew(session_id, givenDate, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_DATE
       WHERE FDA_SESSION_ID = :session_id
         AND TO_DATE(:givenDate, 'dd-mm-yy') BETWEEN FDA_FROM AND FDA_TO
         AND FDA_FEE_CODE = :feecode`,
      { session_id, givenDate, feecode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return {
      numRows: result.rows?.length || 0,
      row: result.rows?.[0] || null
    };
  } finally {
    await connection.close();
  }
}

// Get AC_FEE_STUDENT_PAYMENT row by RegisterNum, FeeSessionId, FeeCode, WhereStatus (array)
async function getAcFeeStudentPayment(RegisterNum, FeeSessionId, FeeCode, WhereStatus) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    // Oracle doesn't support array binding for IN by default, so use a dynamic query
    const inClause = WhereStatus.map((_, i) => `:status${i}`).join(',');
    const binds = { RegisterNum, FeeSessionId, FeeCode };
    WhereStatus.forEach((status, i) => binds[`status${i}`] = status);
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT
       WHERE AFSP_REG_NO = :RegisterNum
         AND AFSP_STATUS_FLAG IN (${inClause})
         AND AFSP_SESSION_ID = :FeeSessionId
         AND AFSP_FEE_CODE = :FeeCode`,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch FEE_STUDENT by regNo and admyear
async function getDataFromAFeeStudWithAdmYear(register, admyear) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_STUDENT 
       WHERE FS_REG_NO = :regNo 
       AND FS_FEE_CODE = '10' 
       AND FS_ADM_YEAR = :admYear`,
      {
        regNo: register,
        admYear: admyear
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } catch (error) {
    console.error('Error in getDataFromAFeeStudWithAdmYear:', error);
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

async function getAllFeeDetails1(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT
       WHERE AFSP_REG_NO = :regNo
         AND AFSP_STATUS_FLAG = 2
         AND AFSP_FEE_CODE = 10
       ORDER BY AFSP_SEMESTER ASC`,
      { regNo: register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } catch (error) {
    console.error('Error in getAllFeeDetails1:', error);
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

// Fetch a single row from AC_FEE_STUDENT_PAYMENT for a register number, status flag 2, fee code 10, ordered by semester ASC
async function getAllFeeDetails1test(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT
       WHERE AFSP_REG_NO = :register
         AND AFSP_STATUS_FLAG = 2
         AND AFSP_FEE_CODE = 10
       ORDER BY AFSP_SEMESTER ASC`,
      { register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Fetch special type amount from FEE_MASTER
async function getSpecialTypeAmt(sessionId, specialType) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_MASTER WHERE FM_SESSION_ID = :sessionId AND FM_TYPE = :specialType`,
      { sessionId, specialType },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

// Insert into AC_FEE_TRANSACTION_SUCCESS
async function insertFeeTransSuccess(
  reg,
  amt,
  bank_id,
  fee_code,
  sess_id,
  late_fee,
  readmin_fee,
  trans_id,
  status_flag
) {
  const connection = await oracledb.getConnection(dbConfig);
  console.log("insertFeeTransSuccess:", reg, amt, bank_id, fee_code, sess_id, late_fee, readmin_fee, trans_id, status_flag);
  try {
    await connection.execute(
      `INSERT INTO AC_FEE_TRANSACTION_SUCCESS (
        AFTS_REG_NO, AFTS_AMOUNT_PAID, AFTS_BANK_ID, AFTS_TRANSACTION_TIME, 
        AFTS_FEE_CODE, AFTS_SESSION_ID, AFTS_LATE_FEE, AFTS_READMISSION_FEE, 
        AFTS_TRANSACTION_ID, AFTS_BANK_TRXN_ID, AFTS_STATUS_FLG, 
        AFTS_PAYMENT_MODE, AFTS_RESPONSE_TYPE
      ) VALUES (
        :reg, :amt, :bank_id, SYSDATE, :fee_code, :sess_id, :late_fee, :readmin_fee, 
        :trans_id, NULL, :status_flag, NULL, NULL
      )`,
      {
        reg,
        amt,
        bank_id,
        fee_code,
        sess_id,
        late_fee,
        readmin_fee,
        trans_id,
        status_flag
      },
      { autoCommit: true }
    );
    return true;
  } catch (err) {
    console.error('Error inserting transaction success:', err);
    return false;
  } finally {
    await connection.close();
  }
}

// Get fee transaction details
async function getFeeTransDetails(register, sess, feecode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_TRANSACTION_SUCCESS
       WHERE AFTS_REG_NO = :register
         AND AFTS_FEE_CODE = :feecode
         AND AFTS_SESSION_ID = :sess`,
      { register, feecode, sess },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } catch (err) {
    console.error('Error fetching transaction details:', err);
    return null;
  } finally {
    await connection.close();
  }
}

async function getFeeAmountFeeMasterWhere(session_id, feetype, feeid) {
  const connection = await oracledb.getConnection(dbConfig);

  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_MASTER 
       WHERE FM_SESSION_ID = :session_id 
         AND FM_TYPE = :feetype 
         AND FM_FEE_ID = :feeid 
       ORDER BY FM_FEE_ID ASC`,
      { session_id, feetype, feeid },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows?.[0] || null;
  } catch (error) {
    console.error('Error fetching fee master:', error);
    return null;
  } finally {
    await connection.close();
  }
}

async function GetWillimgness(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_STUDENT WHERE FS_FEE_CODE = 10 AND FS_REG_NO = :register`,
      { register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function GetDueRemarks(register, sess) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_DUEMASTER WHERE FD_SESSION_ID = :sess AND FD_REG_NO = :register`,
      { sess, register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    // If a row exists, return 0, else 1 (as in PHP)
    return result.rows && result.rows.length > 0 ? 0 : 1;
  } finally {
    await connection.close();
  }
}

async function updateWillingness(
  reg,
  fullName,
  amt,
  insertDate,
  sess,
  semester
) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(
      `INSERT INTO FEE_DUEMASTER (
         FD_REG_NO,
         FD_NAME,
         FD_AMOUNT,
         FD_REMARKS,
         FD_INSERT_DATE,
         FD_SESSION_ID,
         FD_SEMESTER
       ) VALUES (
         :p_reg,
         :p_name,
         :p_amt,
         'DUE AMOUNT',
         TO_DATE(:p_date, 'DD-MM-YYYY'),
         :p_sess,
         :p_sem
       )`,
      {
        p_reg: reg,
        p_name: fullName,
        p_amt: amt,
        p_date: insertDate,
        p_sess: sess,
        p_sem: semester || null
      },
      { autoCommit: true }
    );
    return true;
  } catch (err) {
    console.error('Error in updateWillingness:', err);
    return false;
  } finally {
    await connection.close();
  }
}

async function updateFeeStudentforPaynow_SCST_PMS(
  registerNo,
  admyear,
  nowPAynowUPdate,
  payAmount,
  paymentDate,
  sessionId,
  status,
  exemptionType,
  feeCode,
  PreviousExemptionType,
) {
  const connection = await oracledb.getConnection(dbConfig);

  try {
    // Start transaction
    await connection.execute(`BEGIN COMMIT; END;`);

    // Update 1: FEE_STUDENT table
    await connection.execute(
      `UPDATE FEE_STUDENT 
       SET FS_FEE_AMOUNT = :nowPAynowUPdate,
           FS_EXEMPTION_TYPE = :exemptionType
       WHERE FS_REG_NO = :registerNo 
       AND FS_SESSION_ID = :sessionId 
       AND FS_FEE_AMOUNT = :payAmount`,
      {
        nowPAynowUPdate,
        exemptionType,
        registerNo,
        sessionId,
        payAmount
      },
      { autoCommit: false }
    );

    // Update 2: AC_FEE_STUDENT_PAYMENT table - REMOVED TRAILING COMMA
    await connection.execute(
      `UPDATE AC_FEE_STUDENT_PAYMENT
       SET AFSP_EXEMPTION_TYPE = :exemptionType,
           AFSP_FEE_AMOUNT = :nowPAynowUPdate
       WHERE AFSP_REG_NO = :registerNo
         AND AFSP_SESSION_ID = :sessionId
         AND AFSP_FEE_CODE = :feeCode 
         AND AFSP_FEE_AMOUNT = :payAmount`,
      {
        exemptionType,
        nowPAynowUPdate,
        registerNo,
        sessionId,
        feeCode,
        payAmount
      },
      { autoCommit: false }
    );

    // Insert into AC_SCST_PMS_PAYMENT_CHANGE
    await connection.execute(
      `INSERT INTO AC_SCST_PMS_PAYMENT_CHANGE (
         ASPC_REG_NO,
         ASPC_ADMN_YEAR,
         ASPC_DATE,
         ASPC_SESSION_ID,
         ASPC_EXEMPTION,
         ASPC_AMOUNT,
         ASPC_PREVIOUS_AMOUNT,
         ASPC_PREVIOUS_EXEMPTION
       ) VALUES (
         :registerNo,
         :admyear,
         SYSTIMESTAMP,
         :sessionId,
         :exemptionType,
         :nowPAynowUPdate,
         :payAmount,
          :PreviousExemptionType
       )`,
      {
        registerNo,
        admyear,
        sessionId,
        exemptionType,
        nowPAynowUPdate,
        payAmount, PreviousExemptionType
      },
      { autoCommit: false }
    );

    // Commit transaction
    await connection.commit();
    return true;

  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error('Error updating SCST/PMS payment:', error);
    return false;
  } finally {
    await connection.close();
  }
}


// Get all pending SCST fees
async function getAllPendingFeeScst(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT_SCST 
       WHERE AFSPS_REG_NO = :register 
         AND AFSPS_STATUS_FLAG = 2 
         AND AFSPS_ACTIVE_STATUS = 1 
         AND AFSPS_FEE_CODE = 10 
       ORDER BY AFSPS_SEMESTER DESC`,
      { register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

// Get late fee type for SCST
async function getLateFeeTypeScst(session, givenDate, feecode, campCode) {
  let connection;
  try {

    console.log(session, givenDate, feecode, campCode, "getLateFeeTypeScst");
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT * FROM FEE_DATE_SCST 
       WHERE FDAS_SESSION_ID = :sessionId 
         AND FDAS_FROM <= :givenDate
         AND FDAS_TO >= :givenDate
         AND FDAS_FEE_CODE = :feeCode 
         AND FDAS_CAMP_CODE = :campCode`,
      {
        sessionId: session,
        givenDate: new Date(givenDate),
        feeCode: feecode,
        campCode: campCode
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } catch (err) {
    console.error('Error in getLateFeeTypeScst:', err);
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

// Get fee type for SCST
async function getTypeScst(session, feecode, campCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FDAS_FEE_TYPE FROM FEE_DATE_SCST 
       WHERE FDAS_SESSION_ID = :session 
         AND FDAS_FEE_CODE = :feecode 
         AND FDAS_CAMP_CODE = :campCode 
       ORDER BY FDAS_DATE_ID DESC 
       FETCH FIRST 1 ROW ONLY`,
      {
        session,
        feecode,
        campCode
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Get SCST tuition fee amount
async function scstAmtPay(reg) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT_SCST 
       WHERE AFSPS_REG_NO = :reg 
         AND AFSPS_STATUS_FLAG = 2 
         AND AFSPS_FEE_CODE = 10 
       ORDER BY AFSPS_SEMESTER ASC`,
      { reg },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Get fee date for SCST payment
async function getFeeDateForScstPayment(session_id, givenDate, feecode, campCode) {
  const connection = await oracledb.getConnection(dbConfig);
  console.log(session_id, givenDate, feecode, campCode, "getFeeDateForScstPayment");
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_DATE_SCST 
WHERE FDAS_SESSION_ID = :session_id 
  AND :givenDate BETWEEN TRUNC(FDAS_FROM) AND TRUNC(FDAS_TO)
  AND FDAS_FEE_CODE = :feecode
  AND FDAS_CAMP_CODE = :campCode
  
  `,
      {
        session_id,
        givenDate,
        feecode,
        campCode
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(result.rows, "result.rows");
    const numRows = result.rows?.length;
    console.log(numRows, "numRows");
    return {
      numRows,
      row: result.rows?.[0] || null
    };
  } finally {
    await connection.close();
  }
}

// Get fee student details for SCST
async function getFeeStud(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_STUDENT 
       WHERE FS_REG_NO = :register 
         AND FS_FEE_CODE = 10`,
      { register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getdatafromafeestudWhere(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_STUDENT 
       WHERE FS_REG_NO = :register 
         AND FS_FEE_CODE = 10 AND FS_STATUS_FLG = 2`,
      { register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Insert transaction success and update payment status for SCST
async function InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatusScst(
  RegisterNum, FeeAmount, BankCode, TransactionId, TransactionTime, FeeCode, FeeSessionId,
  LateFee, ReAdmFee, BankTransId, SuccessStatus, Paymentmode, ResponseType, SetStatus, WhereStatus,
) {
  console.log('Parameters:', {
    RegisterNum, FeeAmount, BankCode, TransactionId, TransactionTime, FeeCode, FeeSessionId,
    LateFee, ReAdmFee, BankTransId, SuccessStatus, Paymentmode, ResponseType, SetStatus, WhereStatus
  });

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute('SAVEPOINT before_trans');

    // Insert into AC_FEE_TRANSACTION_SUCCESS
    const insertResult = await connection.execute(
      `INSERT INTO AC_FEE_TRANSACTION_SUCCESS (
        AFTS_REG_NO, AFTS_AMOUNT_PAID, AFTS_BANK_ID, AFTS_TRANSACTION_ID,
        AFTS_TRANSACTION_TIME, AFTS_FEE_CODE, AFTS_SESSION_ID, AFTS_LATE_FEE,
        AFTS_READMISSION_FEE, AFTS_BANK_TRXN_ID, AFTS_STATUS_FLG, AFTS_PAYMENT_MODE,
        AFTS_RESPONSE_TYPE, AFTS_INSERTED_TIME
      ) VALUES (
        :RegisterNum, :FeeAmount, :BankCode, :TransactionId,
        :TransactionTime, :FeeCode, :FeeSessionId, :LateFee,
        :ReAdmFee, :BankTransId, :SuccessStatus, :Paymentmode,
        :ResponseType, SYSDATE
      )`,
      {
        RegisterNum,
        FeeAmount,
        BankCode,
        TransactionId,
        TransactionTime,
        FeeCode,
        FeeSessionId,
        LateFee,
        ReAdmFee,
        BankTransId,
        SuccessStatus,
        Paymentmode,
        ResponseType
      }
    );
    console.log('Insert rows affected:', insertResult.rowsAffected);

    // Update AC_FEE_STUDENT_PAYMENT_SCST
    const updatePaymentResult = await connection.execute(
      `UPDATE AC_FEE_STUDENT_PAYMENT_SCST 
       SET AFSPS_STATUS_FLAG = :SetStatus 
       WHERE AFSPS_REG_NO = :RegisterNum 
         AND AFSPS_SESSION_ID = :FeeSessionId 
         AND AFSPS_FEE_CODE = :FeeCode 
         AND AFSPS_STATUS_FLAG = :WhereStatus`,
      {
        SetStatus,
        RegisterNum,
        FeeSessionId,
        FeeCode,
        WhereStatus
      }
    );
    console.log('Update payment rows affected:', updatePaymentResult.rowsAffected);

    // Update AC_FEE_BANK_SENT
    const updateBankResult = await connection.execute(
      `UPDATE AC_FEE_BANK_SENT 
       SET FBS_CLOSE_TIME = SYSDATE 
       WHERE FBS_REG_NO = :RegisterNum 
         AND FBS_TRANSACTION_ID = :TransactionId`,
      {
        RegisterNum,
        TransactionId
      }
    );
    console.log('Update bank rows affected:', updateBankResult.rowsAffected);

    await connection.commit();
    console.log('Transaction committed successfully');
    return true;
  } catch (error) {
    console.error('Error in transaction:', error);
    if (connection) {
      try {
        await connection.rollback();
        console.log('Transaction rolled back');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
    return false;
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

// Get AC_FEE_STUDENT_PAYMENT_SCST row
async function getAcFeeStudentPaymentScst(RegisterNum, FeeSessionId, FeeCode, WhereStatus) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    // Convert comma-separated status values to array of numbers
    const statuses = WhereStatus.includes(',')
      ? WhereStatus.split(',').map(Number)
      : [Number(WhereStatus)];

    // Generate dynamic bind placeholders (:status0, :status1, ...)
    const bindKeys = statuses.map((_, i) => `:status${i}`).join(', ');

    // Construct the SQL with dynamic IN clause
    const sql = `
      SELECT * FROM AC_FEE_STUDENT_PAYMENT_SCST 
      WHERE AFSPS_REG_NO = :RegisterNum 
        AND AFSPS_SESSION_ID = :FeeSessionId 
        AND AFSPS_FEE_CODE = :FeeCode 
        AND AFSPS_STATUS_FLAG IN (${bindKeys})
    `;

    // Create bind parameters object
    const binds = {
      RegisterNum,
      FeeSessionId,
      FeeCode
    };

    // Add dynamic status values to bind object
    statuses.forEach((status, i) => {
      binds[`status${i}`] = status;
    });

    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Get AC_FEE_STUDENT_PAYMENT_SCST with multiple status flags
async function getAcFeeStudentPaymentWithScst(Register, FeeCode, FeeSessionId, status) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_STUDENT_PAYMENT_SCST 
       WHERE AFSPS_REG_NO = :Register 
         AND AFSPS_FEE_CODE = :FeeCode 
         AND AFSPS_SESSION_ID = :FeeSessionId 
         AND AFSPS_STATUS_FLAG = :status`,
      {
        Register,
        FeeCode,
        FeeSessionId,
        status
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Get late fee date for SCST
async function getLateFeeDateScst(givenDate, session_id, feecode, camp_code) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_DATE_SCST 
WHERE FDAS_SESSION_ID = :session_id 
  AND :givenDate BETWEEN TRUNC(FDAS_FROM) AND TRUNC(FDAS_TO)
  AND FDAS_FEE_CODE = :feecode
  AND FDAS_CAMP_CODE = :camp_code`,
      {
        givenDate,
        session_id,
        feecode,
        camp_code
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Get transaction success for SCST
async function getTransSuccessScst(register, sess, feecode, trans_id) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_FEE_TRANSACTION_SUCCESS 
       WHERE AFTS_REG_NO = :register 
         AND AFTS_SESSION_ID = :sess 
         AND AFTS_FEE_CODE = :feecode 
         AND AFTS_TRANSACTION_ID = :trans_id`,
      {
        register,
        sess,
        feecode,
        trans_id
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// Update AC_FEE_STUDENT_PAYMENT_SCST and related tables

async function updateAcFeeStudentPaymentScstUpdate(
  RegisterNum, FeeCode, FeeSessionId, Name, FeeAmt, Remarks, SetBalanceStatus, WhereBalanceStatus,
  student, bankcode, transaction_id, LateFee, ReAdmFee
) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    // Start transaction
    await connection.execute('SAVEPOINT before_trans');

    // Update AC_FEE_STUDENT_PAYMENT_SCST
    await connection.execute(
      `UPDATE AC_FEE_STUDENT_PAYMENT_SCST 
       SET AFSPS_STATUS_FLAG = :SetBalanceStatus 
       WHERE AFSPS_REG_NO = :RegisterNum 
         AND AFSPS_FEE_CODE = :FeeCode 
         AND AFSPS_SESSION_ID = :FeeSessionId 
         AND AFSPS_STATUS_FLAG = :WhereBalanceStatus`,
      {
        SetBalanceStatus,
        RegisterNum,
        FeeCode,
        FeeSessionId,
        WhereBalanceStatus
      }
    );

    // Update AC_FEE_TRANSACTION_SUCCESS
    await connection.execute(
      `UPDATE AC_FEE_TRANSACTION_SUCCESS 
       SET AFTS_STATUS_FLG = 1 
       WHERE AFTS_REG_NO = :RegisterNum 
         AND AFTS_FEE_CODE = :FeeCode 
         AND AFTS_SESSION_ID = :FeeSessionId 
         AND AFTS_STATUS_FLG = 0`,
      {
        RegisterNum,
        FeeCode,
        FeeSessionId
      }
    );

    // Delete from FEE_DUEMASTER
    await connection.execute(
      `DELETE FROM FEE_DUEMASTER 
       WHERE FD_REG_NO = :RegisterNum 
         AND FD_REMARKS = :Remarks`,
      {
        RegisterNum,
        Remarks
      }
    );

    // Insert into FEE_DUE_PAID
    await connection.execute(
      `INSERT INTO FEE_DUE_PAID (
        FD_REG_NO, FD_NAME, FD_AMOUNT, FD_REMARKS, FD_UPDATE_DATE
      ) VALUES (
        :RegisterNum, :Name, :FeeAmt, :Remarks, SYSDATE
      )`,
      {
        RegisterNum,
        Name,
        FeeAmt,
        Remarks
      }
    );

    // Check if record exists in FEE_STUDENT_CUMULATIVE_ALL
    const result = await connection.execute(
      `SELECT * FROM FEE_STUDENT_CUMULATIVE_ALL 
       WHERE FSC_REG_NO = :RegisterNum 
         AND FSC_FEE_CODE = :FeeCode 
         AND FSC_SESSION_ID = :FeeSessionId 
         AND EXISTS (
           SELECT 1 FROM FEE_SESSION 
           WHERE FS_SESSION_ID = FSC_SESSION_ID 
             AND FS_STATUS = 1
         )`,
      {
        RegisterNum,
        FeeCode,
        FeeSessionId
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const row = result.rows?.[0];

    if (row) {
      // Update existing record
      await connection.execute(
        `UPDATE FEE_STUDENT_CUMULATIVE_ALL 
         SET FSC_DEFICIT = 0,
             FSC_DUE_PAID = :FeeAmt
         WHERE FSC_REG_NO = :RegisterNum 
           AND FSC_SESSION_ID = :FeeSessionId 
           AND FSC_FEE_CODE = :FeeCode`,
        {
          RegisterNum,
          FeeSessionId,
          FeeCode,
          FeeAmt
        }
      );
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
          :RegisterNum, :FeeCode, :FeeSessionId, :FeeType,
          :SpecialType, :ExemptionType, :FeeAmount, :FeeAmount,
          :LateFee, :ReadmFee, :Gender, :StatusFlag,
          :StudType, :Name, :Dob, :Community,
          :BranchCode, :Semester, :TransactionId, :SpecialAmt,
          :Excess, :Deficit, :Claim, :Status, :BankId,
          :CampCode, :DeptCode, :DuePaid, :PartialAmtFlag,
          SYSDATE
        )`,
        {
          RegisterNum,
          FeeCode,
          FeeSessionId,
          FeeType: student.FS_FEE_TYPE,
          SpecialType: student.FS_SPECIAL_TYPE,
          ExemptionType: student.FS_EXEMPTION_TYPE,
          FeeAmount: FeeAmt,
          LateFee,
          ReadmFee: ReAdmFee,
          Gender: student.FS_GENDER,
          StatusFlag: 1,
          StudType: student.FS_STUDENT_TYPE,
          Name: student.FS_NAME,
          Dob: student.FS_DOB,
          Community: student.FS_COMMUNITY,
          BranchCode: student.FS_BRANCH_CODE,
          Semester: student.FS_SEMESTER,
          TransactionId: transaction_id,
          SpecialAmt: 0,
          Excess: 0,
          Deficit: 0,
          Claim: 0,
          Status: 1,
          BankId: bankcode,
          CampCode: student.FS_CAMP_CODE,
          DeptCode: student.FS_DEPT_CODE,
          DuePaid: 0,
          PartialAmtFlag: 1
        }
      );
    }

    // Commit transaction
    await connection.commit();
    return true;
  } catch (error) {
    console.error('Error in updateAcFeeStudentPaymentScstUpdate:', error);
    // Rollback transaction on error
    await connection.rollback();
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Get fee type 0 for SCST
async function getFeeType0(session, feecode, campCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FDAS_FROM,FDAS_TO FROM FEE_DATE_SCST 
       WHERE FDAS_SESSION_ID = :sessionId 
         AND FDAS_FEE_CODE = :feeCode 
         AND FDAS_CAMP_CODE = :campCode 
         AND FDAS_FEE_TYPE = 0 
       ORDER BY FDAS_DATE_ID DESC 
       FETCH FIRST 1 ROW ONLY`,
      {
        sessionId: session,   // ✅ renamed from `session`
        feeCode: feecode,     // ✅ consistent naming
        campCode: campCode
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}


// Get fee type 45 for SCST
async function getFeeType45(session, feecode, campCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT FDAS_TO FROM FEE_DATE_SCST 
       WHERE FDAS_SESSION_ID = :sessionId 
         AND FDAS_FEE_CODE = :feeCode 
         AND FDAS_CAMP_CODE = :campCode 
         AND FDAS_FEE_TYPE = 45 
       ORDER BY FDAS_DATE_ID DESC 
       FETCH FIRST 1 ROW ONLY`,
      {
        sessionId: session,   // ✅ renamed to avoid conflict
        feeCode: feecode,     // ✅ renamed to match SQL
        campCode: campCode
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}


const redoCourse = async (register) => {
  try {
    const [rows] = await connection.execute(
      'SELECT FE_REGULAR_FEE_AMOUNT FROM FEE_EXAMINATION WHERE FE_REG_NO = ?',
      [register]
    );

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error in redoCourse:', error);
    throw error; // Or handle it as per your error handling strategy
  }
};

const getRedoData = async (register) => {
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM AC_FEE_STUDENT_PAYMENT_BALANCE WHERE AFSPB_REG_NO = ? AND AFSPB_FEE_CODE = 13',
      [register]
    );

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error in getRedoData:', error);
    throw error;
  }
};

async function updateCumulativewithBankServiceCharge(
  student, feecode, session_id, balAmt, lateFee, readmFee, feetype, special_type, exemption_type, transaction_id, bankcode
) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    // First check if record exists
    const result = await connection.execute(
      `SELECT FSC_FEE_AMOUNT, FSC_SPECIAL_AMT
       FROM FEE_STUDENT_CUMULATIVE_ALL
       WHERE FSC_REG_NO = :regNo
         AND FSC_SESSION_ID = :sessionId
         AND FSC_FEE_CODE = :feecode
         AND EXISTS (
           SELECT 1 FROM FEE_SESSION 
           WHERE FS_SESSION_ID = FSC_SESSION_ID 
             AND FS_STATUS = 1
         )`,
      {
        regNo: student.FS_REG_NO,
        sessionId: session_id,
        feecode: feecode
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const row = result.rows?.[0];

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
    console.error('Error in updateCumulativewithBankServiceCharge:', error);
    await connection.rollback();
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getdatafromafeestud(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_STUDENT 
       WHERE FS_REG_NO = :register 
         AND FS_FEE_CODE = 10`,
      { register },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows?.[0] || null;
  } catch (error) {
    console.error('Error in getdatafromafeestud:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}



async function getLateFeeMaster(feeType, sessionId, feeCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const query = `
      SELECT FM_FEE_ID, FM_FEE_AMOUNT
      FROM FEE_MASTER
      WHERE FM_TYPE = :feeType
        AND FM_SESSION_ID = :sessionId
        AND FM_FEE_CODE = :feeCode
    `;

    const result = await connection.execute(query, {
      feeType,
      sessionId,
      feeCode
    }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    return result.rows || [];
  } catch (error) {
    console.error('Error in getLateFeeMaster:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getLateFeeName(feeId, sessionId, feeCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const query = `
      SELECT FN_NAME
      FROM FEE_NAME
      WHERE FN_FEE_ID = :feeId
        AND FN_SESSION_ID = :sessionId
        AND FN_FEE_CODE = :feeCode
    `;

    const result = await connection.execute(query, {
      feeId,
      sessionId,
      feeCode
    }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    return result.rows?.[0] || null;
  } catch (error) {
    console.error('Error in getLateFeeName:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getFeeStudent(register) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const query = `
      SELECT *
      FROM FEE_STUDENT
      WHERE FS_APPL_NO = :register
        AND FS_FEE_CODE = 10
    `;

    const result = await connection.execute(query, {
      register
    }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    return result.rows?.[0] || null;
  } catch (error) {
    console.error('Error in getFeeStudent:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getFeedbackDates(sem_type, feedback_sess_name) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM AC_STUDENT_FEEDBACK_DATE 
       WHERE ASFD_SEMESTER = :sem_type 
       AND ASFD_SESSION_NAME = :feedback_sess_name`,
      { 
        sem_type,
        feedback_sess_name
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

async function getStudentFeedbackDetails(registerNumber, sem) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM AC_STUDENT_COURSE_DETAIL 
       WHERE SCD_REG_NO = :registerNumber 
       AND SCD_SEMESTER = :sem`,
      { 
        registerNumber,
        sem
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0]?.count || 0;
  } finally {
    await connection.close();
  }
}

async function getStudentFeedback(registerNumber, sem) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM AC_STUDENT_FEEDBACK 
       WHERE SF_REG_NO = :registerNumber 
       AND SF_SEMESTER = :sem`,
      { 
        registerNumber,
        sem
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0]?.count || 0;
  } finally {
    await connection.close();
  }
}

module.exports = {
  getdatafromafeestud,
  getStudentSession,
  fetchAmountFromMaster,
  fetchSpecialAmount,
  fetchExemptionAmount,
  fetchExemptionAmountFromMaster,
  getSysdateFromOracleDb,
  balanceAmtPay,
  bankServiceCharges,
  getRedoData2,
  getAllFeeDetails9,
  getSession,
  getLastFeeDate1,
  getLateFeeType,
  getPenaltyAmt,
  getAcpaymentfee,
  getOriginalAmt,
  updateSerialNumberInFeeSerialNoMaster,
  getAllFeeDetails9Where,
  updateStatusFlagStudentFee,
  insertFeeStudentCummulative,
  getFeeDateForPayment,
  fetchBalanceAmountFromStudentBalance,
  fetchBalanceType,
  fetchAmountfromStudentPayment,
  fetchTransReceipt,
  fetch_trans_receipt_Balance,
  insertFeeReceiptUpdateBlob,
  getFeeDepartmentWithDeptCode,
  getFeeStudentwithRegisterNoSinglerow,
  getFeeDateForPaymentNew,
  getAcFeeStudentPayment,
  getDataFromAFeeStudWithAdmYear,
  getAllFeeDetails1,
  getAllFeeDetails1test,
  getSpecialTypeAmt,
  insertFeeTransSuccess,
  getFeeTransDetails,
  getFeeAmountFeeMasterWhere,
  GetWillimgness,
  GetDueRemarks,
  updateWillingness,
  updateFeeStudentforPaynow_SCST_PMS,
  getAllPendingFeeScst,
  getLateFeeTypeScst,
  getTypeScst,
  scstAmtPay,
  getFeeDateForScstPayment,
  getFeeStud,
  InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatusScst,
  getAcFeeStudentPaymentScst,
  getAcFeeStudentPaymentWithScst,
  getLateFeeDateScst,
  getTransSuccessScst,
  updateAcFeeStudentPaymentScstUpdate,
  getFeeType0,
  getFeeType45,
  getdatafromafeestudWhere,
  redoCourse,
  getRedoData,
  updateCumulativewithBankServiceCharge,
  getLateFeeMaster,
  getLateFeeName,
  getFeeStudent,
  
  getFeedbackDates,
  getStudentFeedbackDetails,
  getStudentFeedback

};