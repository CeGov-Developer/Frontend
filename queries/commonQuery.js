


import oracledb from 'oracledb';
// // import { dbConfig, admsDbConfig,photoDbConfig } from '../db/oracle';
// const oracledb = require('oracledb');



   let admsDbConfig = ({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

  let dbConfig = ({
      user: process.env.STUDENT_DB_USER,
      password: process.env.STUDENT_DB_PASSWORD,
      connectString: process.env.STUDENT_DB_CONNECT_STRING
    });
    

// export async function fetchSmsManagement(code: number): Promise<any> {
//   const connection = await oracledb.getConnection(admsDbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM SMS_MANAGEMENT WHERE SM_SNO = :code`,
//       { code }, // If SM_SNO is VARCHAR2, use { code: String(code) }
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     if (!result.rows || result.rows.length === 0) {
//       console.warn('No rows found for code:', code);
//     }

//     return result.rows?.[0] || null;
//   } catch (err) {
//     console.error('Error fetching SMS management:', err);
//     throw err;
//   } finally {
//     await connection.close();
//   }
// }


// export async function InsertFeeStudentHandleAWelcomeNote(applNo: number, admyear: number,status:number): Promise<boolean> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `UPDATE FEE_STUDENT SET FS_INSTRUCTION_STATUS = :status WHERE FS_APPL_NO = :applNo AND FS_ADM_YEAR = :admyear `,
//       {  applNo, admyear,status },
//       { autoCommit: true }
//     );
//     return result.rowsAffected === 1;
//   } finally {
//     await connection.close();
//   }
// }



// export async function getFeeStudentwithApplNoAdmYear(applNo: number, admyear: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_STUDENT WHERE FS_APPL_NO = :applNo AND FS_ADM_YEAR = :admyear`,
//       { applNo, admyear },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// export async function getFeeStudentwithApplNoAdmYearFeeCode(applNo: number, admyear: number, feeCode: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_STUDENT WHERE FS_APPL_NO = :applNo AND FS_ADM_YEAR = :admyear AND FS_FEE_CODE = :feeCode`,
//       { applNo, admyear, feeCode },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// export async function getFeeStudentMarkswithApplNoAdmYear(applNo: number, admyear: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_STUDENT_MARKS WHERE FSM_APPL_NO = :applNo AND FSM_YEAR = :admyear`,
//       { applNo, admyear },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// export async function getFeeGenderwithId(genderID: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_GENDER WHERE FG_ID = :genderID`,
//       { genderID },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// export async function getFeeDepartmentWithDeptCode(deptCode: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_DEPARTMENT WHERE FD_DEPT_CODE = :deptCode`,
//       { deptCode },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// export async function getFeeBranchWithBranchCode(branchCode: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_BRANCH WHERE FB_BRANCH_CODE = :branchCode`,
//       { branchCode },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

export async function getFeeDegreeWithDegreeCode(degCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {
    const result = await connection.execute(
      `SELECT * FROM FEE_DEGREE WHERE FDG_DEGREE_CODE = :degCode`,
      { degCode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

export async function getFeeCampusWithCampusCode(campCode) {
  const connection = await oracledb.getConnection(dbConfig);
  try {

    const result = await connection.execute(
      `SELECT * FROM FEE_CAMPUS WHERE FC_CAMP_CODE = :campCode`,
      { campCode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection.close();
  }
}

// export async function getFeeCommunityWithCommunityCode(commuCode: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_COMMUNITY WHERE FC_COMMU_CODE = :commuCode`,
//       { commuCode },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// export async function getFeeStudentPersonalWithApplNoAdmYear(applNo: number, admyear: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_STUDENT_PERSONAL WHERE FSP_REG_NO = :applNo AND FSP_YEAR = :admyear`,
//       { applNo, admyear },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// export async function getFeeDataFgPmsWillingnessWithApplNoAdmYear(applNo: number, admyear: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT COUNT(*) AS SCOUNT FROM FEE_DATA_FG_PMS_WILLINGNESS WHERE FDFPW_REGNO = :applNo AND FDFPW_ADM_YEAR = :admyear`,
//       { applNo, admyear },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// export async function getFeeDataFgPmsWillingnessWithApplNoAdmYearName(applNo: number, admyear: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_DATA_FG_PMS_WILLINGNESS WHERE FDFPW_REGNO = :applNo AND FDFPW_ADM_YEAR = :admyear`,
//       { applNo, admyear },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// export async function getFeeDataSheetStatuswithApplNoAdmYear(applNo: number, admyear: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_DATA_SHEET_STATUS WHERE FDSS_APPL_NO = :applNo AND FDSS_YEAR = :admyear`,
//       { applNo, admyear },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// export async function fetchAdEmployeeMasterContact(empid: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM AD_EMPLOYEE_MASTER 
//        JOIN AD_EMPLOYEE_CONTACT ON AD_EMPLOYEE_CONTACT.EC_EMPLOYEE_ID = AD_EMPLOYEE_MASTER.EM_EMPLOYEE_ID
//        WHERE EM_EMPLOYEE_ID = :empid`,
//       { empid },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// export async function fetchAcDeptDeatils(catCode: number, deptCode: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM AC_DEPT_DETAIL WHERE DD_CAT_CODE = :catCode AND DD_DEPT_CODE = :deptCode`,
//       { catCode, deptCode },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch amount from FEE_MASTER based on sessionId and studentType
// export async function fetchAmountFromMaster(studentSessionId: number, studentType: number): Promise<any[]> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_MASTER WHERE FM_SESSION_ID = :studentSessionId AND FM_TYPE = :studentType`,
//       { studentSessionId, studentType },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows || [];
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch fee name from FEE_NAME table based on feeId, session, and feeCode
// export async function fetchFeeName(feeId: number, feeSession: number, feeCode: number): Promise<any[]> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT FN_FEE_ID, FN_NAME FROM FEE_NAME WHERE FN_SESSION_ID = :feeSession AND FN_FEE_ID = :feeId AND FN_FEE_CODE = :feeCode`,
//       { feeSession, feeId, feeCode },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows || [];
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch fee amount from FEE_MASTER based on feeType, sessionId, and feeID
// export async function fetchFeeAmountByFeeId(feeType: number, sessionId: number, feeID: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT FM_FEE_AMOUNT FROM FEE_MASTER WHERE FM_SESSION_ID = :sessionId AND FM_TYPE = :feeType AND FM_FEE_ID = :feeID`,
//       { sessionId, feeType, feeID },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch FEE_DATA_PERSONAL_DETAILS by applNo and admyear
// export async function getFeeDataPersonalDetailsWithApplNoAdmYear(applNo: number, admyear: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_DATA_PERSONAL_DETAILS WHERE FDPS_APPL_NO = :applNo AND FDPS_YEAR = :admyear`,
//       { applNo, admyear },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch FEE_DATA_DISTRICT where FDD_CODE != DTCode
// export async function getFeeDataDistrictWithCode(DTCode: number): Promise<any[]> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_DATA_DISTRICT WHERE FDD_CODE != :DTCode ORDER BY FDD_CODE ASC`,
//       { DTCode },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows || [];
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch FEE_DATA_DISTRICT where FDD_CODE = DTCode
// export async function getFeeDataDistrictOnlyOtherState(DTCode: number): Promise<any[]> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_DATA_DISTRICT WHERE FDD_CODE = :DTCode ORDER BY FDD_CODE ASC`,
//       { DTCode },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows || [];
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch FEE_STUDENT_CATEGORY with FSC_STATUS_FLG in StatusFlg (array)
// export async function getFeeStudentCategoryWithStatusFlg(StatusFlg: number[]): Promise<any[]> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     // Oracle doesn't support array binding for IN directly, so build query dynamically
//     const binds = StatusFlg.map((_, idx) => `:flg${idx}`).join(',');
//     const bindVars: any = {};
//     StatusFlg.forEach((val, idx) => { bindVars[`flg${idx}`] = val; });
//     const result = await connection.execute(
//       `SELECT * FROM FEE_STUDENT_CATEGORY WHERE FSC_STATUS_FLG IN (${binds}) ORDER BY FSC_STATUS_FLG ASC`,
//       bindVars,
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows || [];
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch FEE_STUDENT_IDTYPE by FSI_CODE
// export async function getFeeStudentIDtypeWithId(IdType: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_STUDENT_IDTYPE WHERE FSI_CODE = :IdType`,
//       { IdType },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch FEE_BLOOD_GROUP by FBG_ID
// export async function getFeeBloodGroupWithId(Id: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_BLOOD_GROUP WHERE FBG_ID = :Id`,
//       { Id },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch FEE_STUDENT_RELIGION by FSR_CODE
// export async function getFeeStudentReligionWithCode(Code: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_STUDENT_RELIGION WHERE FSR_CODE = :Code`,
//       { Code },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch COMMUNITY_SUBCASTE by CS_CASTE_CODE
// export async function getCommunitySubcasteWithCode(Code: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM COMMUNITY_SUBCASTE WHERE CS_CASTE_CODE = :Code`,
//       { Code },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch FEE_DATA_PERSONAL_DETAILS_SCST_DISTRICT by applNo and year
// export async function getFeeDataPersonalDetailsScstDistrictWithAppNoYear(applNo: number, year: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_DATA_PERSONAL_DETAILS_SCST_DISTRICT WHERE FDPDSD_APPL_NO = :applNo AND FDPDSD_YEAR = :year`,
//       { applNo, year },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch FEE_DATA_DISTRICT by FDD_CODE
// export async function getFeeDataDistrictNameWithCode(DTCode: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_DATA_DISTRICT WHERE FDD_CODE = :DTCode`,
//       { DTCode },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// // Fetch FEE_STUDENT_CATEGORY by FSC_STATUS_FLG = CatFlg
// export async function getFeeStudentCategoryWithCat(CatFlg: number): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_STUDENT_CATEGORY WHERE FSC_STATUS_FLG = :CatFlg`,
//       { CatFlg },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }

// // DML Section

// export async function updateFeeDataSheetStatus(applNo: number, admyear: number, status: number, whereSt: number): Promise<boolean> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `UPDATE FEE_DATA_SHEET_STATUS SET FDSS_STATUS = :status WHERE FDSS_APPL_NO = :applNo AND FDSS_YEAR = :admyear AND FDSS_STATUS = :whereSt`,
//       { status, applNo, admyear, whereSt },
//       { autoCommit: true }
//     );
//     return result.rowsAffected === 1;
//   } finally {
//     await connection.close();
//   }
// }

// export async function updateONEFeeDataSheetStatus(applNo: number, admyear: number, one: number): Promise<boolean> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `UPDATE FEE_DATA_SHEET_STATUS SET FDSS_ONE = :one WHERE FDSS_APPL_NO = :applNo AND FDSS_YEAR = :admyear`,
//       { one, applNo, admyear },
//       { autoCommit: true }
//     );
//     return result.rowsAffected === 1;
//   } finally {
//     await connection.close();
//   }
// }

// export async function updateTWOFeeDataSheetStatus(applNo: number, admyear: number, two: number): Promise<boolean> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `UPDATE FEE_DATA_SHEET_STATUS SET FDSS_TWO = :two WHERE FDSS_APPL_NO = :applNo AND FDSS_YEAR = :admyear`,
//       { two, applNo, admyear },
//       { autoCommit: true }
//     );
//     return result.rowsAffected === 1;
//   } finally {
//     await connection.close();
//   }
// }

// export async function updateTHREEFeeDataSheetStatus(applNo: number, admyear: number, three: number): Promise<boolean> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `UPDATE FEE_DATA_SHEET_STATUS SET FDSS_THREE = :three WHERE FDSS_APPL_NO = :applNo AND FDSS_YEAR = :admyear`,
//       { three, applNo, admyear },
//       { autoCommit: true }
//     );
//     return result.rowsAffected === 1;
//   } finally {
//     await connection.close();
//   }
// }

// export async function updateFOURFeeDataSheetStatus(applNo: number, admyear: number, four: number): Promise<boolean> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `UPDATE FEE_DATA_SHEET_STATUS SET FDSS_FOUR = :four WHERE FDSS_APPL_NO = :applNo AND FDSS_YEAR = :admyear`,
//       { four, applNo, admyear },
//       { autoCommit: true }
//     );
//     return result.rowsAffected === 1;
//   } finally {
//     await connection.close();
//   }
// }

// export async function updateFIVEFeeDataSheetStatus(applNo: number, admyear: number, five: number): Promise<boolean> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `UPDATE FEE_DATA_SHEET_STATUS SET FDSS_FIVE = :five WHERE FDSS_APPL_NO = :applNo AND FDSS_YEAR = :admyear`,
//       { five, applNo, admyear },
//       { autoCommit: true }
//     );
//     return result.rowsAffected === 1;
//   } finally {
//     await connection.close();
//   }
// }

// export async function updateSIXFeeDataSheetStatus(applNo: number, admyear: number, six: number): Promise<boolean> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `UPDATE FEE_DATA_SHEET_STATUS SET FDSS_SIX = :six WHERE FDSS_APPL_NO = :applNo AND FDSS_YEAR = :admyear`,
//       { six, applNo, admyear },
//       { autoCommit: true }
//     );
//     return result.rowsAffected === 1;
//   } finally {
//     await connection.close();
//   }
// }

// export async function updateSEVENFeeDataSheetStatus(applNo: number, admyear: number, seven: number): Promise<boolean> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `UPDATE FEE_DATA_SHEET_STATUS SET FDSS_SEVEN = :seven WHERE FDSS_APPL_NO = :applNo AND FDSS_YEAR = :admyear`,
//       { seven, applNo, admyear },
//       { autoCommit: true }
//     );
//     return result.rowsAffected === 1;
//   } finally {
//     await connection.close();
//   }
// }

// export async function updateFeeStudentwithApplNoAdmYearStatus(applNo: number, admyear: number, setStatus: number, whereStatus: number): Promise<boolean> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `UPDATE FEE_STUDENT SET FS_STATUS_FLG = :setStatus WHERE FS_APPL_NO = :applNo AND FS_ADM_YEAR = :admyear AND FS_STATUS_FLG = :whereStatus`,
//       { setStatus, applNo, admyear, whereStatus },
//       { autoCommit: true }
//     );
//     return result.rowsAffected === 1;
//   } finally {
//     await connection.close();
//   }
// }

// export async function updateFeeStudentDataStatuswithApplNoAdmYearDataStatus(applNo: number, admyear: number, setStatus: number, whereStatus: number): Promise<boolean> {
//   const connection = await oracledb.getConnection(dbConfig);
//   try {
//     const result = await connection.execute(
//       `UPDATE FEE_STUDENT SET FS_DATA_STATUS = :setStatus WHERE FS_APPL_NO = :applNo AND FS_ADM_YEAR = :admyear AND FS_DATA_STATUS = :whereStatus`,
//       { setStatus, applNo, admyear, whereStatus },
//       { autoCommit: true }
//     );
//     return result.rowsAffected === 1;
//   } finally {
//     await connection.close();
//   }
// }

// export async function getFeeAdmissionConfirmwithApplNoAdmYear(
//   applNo: number | string,
//   admyear: number | string
// ): Promise<any> {
//   const connection = await oracledb.getConnection(dbConfig);
//   console.log('Fetching Fee Admission Confirm for:', { applNo, admyear });
//   try {
//     const result = await connection.execute(
//       `SELECT * FROM FEE_ADMISSION_CONFIRM WHERE FAC_REGNO = :applNo AND FAC_ADM_YEAR = :admyear`,
//       { applNo, admyear },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
//     return result.rows?.[0] || null;
//   } finally {
//     await connection.close();
//   }
// }