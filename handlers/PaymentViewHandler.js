
// Import queries

const {
  getSysdateFromOracleDb,
  updateFeeStudentforPaynow_SCST_PMS, getDataFromAFeeStudWithAdmYear, GetWillimgness, GetDueRemarks,
  getOriginalAmt, getAllFeeDetails1, updateWillingness, insertFeeStudentCummulative, getSpecialTypeAmt,
  getFeeAmountFeeMasterWhere, getFeeDateForPaymentNew, getSession, fetchAmountFromMaster, fetchExemptionAmountFromMaster,
  insertFeeTransSuccess, updateSerialNumberInFeeSerialNoMaster, getAllFeeDetails9Where, updateStatusFlagStudentFee, getFeeTransDetails,
  getFeedbackDates,
  getStudentFeedbackDetails,
  getStudentFeedback,
} = require('../queries/FeePaymentQuery');



const {
  getFeeBranchWithBranchCode,
  
  getfeeIdTutionfeeless,
  getfeeamount,

  getAcFeeStudentPayment,
  InsertFeeStudentCummulativeUpdate,
  InsertFeeReceiptUpdateBlobFn,
  InsertAcFeeBankFailPaymentFailStatus,
  getReceiptPDF,
  getFeeStudentwithRegisterNoSinglerow, getFeeAmountAll, getExemptionAmount, get_penalty_amt,
  getFeeBankReturn,
  InsertFeeBankReturn,
  getFeeBankSentWithTransId,
  getAcFeeStudentPaymentBalanceWith,
  getAcFeeStudentPaymentWith,
  InsertBalanceSuccessUpdatePaymentBalanceUpdateBankSendCloseTime,
  UpdateAcFeeStudentPaymentBalanceUpdate,
  updateCumulativewithBalanceAmt,
  UpdateFeeStudentUpdate,
  InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatus, getFeeSerialNumMasterWithFeeCodeSess

} = require('../queries/RazorPaymentQuery');

// import {generateFeeReceipt,generate_fee_receipt_due_amt} from '../Utils/FeeReceiptPdfGenerator.js';

const { generateFeeExemption } = require('../Utils/FeeReceiptPdfGenerator.js');

async function HandleConfirmFees(req, res) {
  let data = { errorStatus: 0 };

  try {
    console.log("req.body2424242:", req.body);
    const { registerNumber, admyear } = req.body;

    // If using sessions:
    const user = req.session.user;


    if (!registerNumber) {
      data.errorStatus = 2;
      data.errorMsg = "Missing Application Number";
      res.json(data);
      return;
    }

    // Fetch data
    const Ac_Fee_Student = await getAllFeeDetails1(registerNumber);
    console.log("Ac_Fee_Student:", Ac_Fee_Student);
    const Fee_Student = await getDataFromAFeeStudWithAdmYear(registerNumber, admyear);
    console.log("Fee_Student:", Fee_Student);

    
    if (!Ac_Fee_Student || !Fee_Student) {
      data.errorStatus = 2;
      data.errorMsg = "Contact CeGov office1 (044-22357973/74)";
      return res.json(data);
    }


    if (Ac_Fee_Student && Fee_Student) {
      let my_table_amt = Ac_Fee_Student.AFSP_FEE_AMOUNT;
      let exem_type = Ac_Fee_Student.AFSP_EXEMPTION_TYPE;
      let session_id = Ac_Fee_Student.AFSP_SESSION_ID;
      let status_flag = Ac_Fee_Student.AFSP_STATUS_FLAG;
      let fee_code = Ac_Fee_Student.AFSP_FEE_CODE;
      let fee_type = Ac_Fee_Student.AFSP_FEE_TYPE;
      let special_type = Ac_Fee_Student.AFSP_SPECIAL_TYPE;
      let sem = Ac_Fee_Student.AFSP_SEMESTER;
      console.log("sem:", sem);

      // Master amount
      let masteramt = await getOriginalAmt(session_id, fee_type);
      console.log("masteramt:", masteramt);
      let final_amt_master = masteramt || 0;
      console.log("final_amt_master:", final_amt_master);

      // Special type amount
      let Special_type_amt = 0, totalFeeExempAmount = 0;
      if (special_type > 0) {
        const get_Special_type_amt = await getSpecialTypeAmt(session_id, special_type);
        if (get_Special_type_amt) {
          for (const value of get_Special_type_amt) {
            Special_type_amt += value.FM_FEE_AMOUNT;
          }
        }
        final_amt_master += Special_type_amt;
      }
      let spl_typeamt = final_amt_master;


      // Exemption
      if (exem_type != 0) {
        const checkExemption = await getSpecialTypeAmt(session_id, exem_type);
        if (checkExemption) {
          for (const row of checkExemption) {
            const ExemptionAmount = await getFeeAmountFeeMasterWhere(session_id, fee_type, row.FM_FEE_ID);
            if (ExemptionAmount) {
              totalFeeExempAmount += ExemptionAmount.FM_FEE_AMOUNT;
            }
          }
          final_amt_master -= totalFeeExempAmount;
        }
      }

      // Master amount for Fee_Student
      let masteramtFS = await getOriginalAmt(Fee_Student.FS_SESSION_ID, Fee_Student.FS_FEE_TYPE);
      let master_full_amtFS = masteramtFS || 0;
      Special_type_amt = 0;
      if (special_type > 0) {
        const get_Special_type_amt = await getSpecialTypeAmt(Fee_Student.FS_SESSION_ID, Fee_Student.FS_SPECIAL_TYPE);
        if (get_Special_type_amt) {
          for (const value of get_Special_type_amt) {
            Special_type_amt += value.FM_FEE_AMOUNT;
          }
        }
        master_full_amtFS += Special_type_amt;
      }
      totalFeeExempAmount = 0;
      if (exem_type != 0) {
        const checkExemption = await getSpecialTypeAmt(Fee_Student.FS_SESSION_ID, Fee_Student.FS_EXEMPTION_TYPE);
        if (checkExemption) {
          for (const row of checkExemption) {
            const ExemptionAmount = await getFeeAmountFeeMasterWhere(Fee_Student.FS_SESSION_ID, Fee_Student.FS_FEE_TYPE, row.FM_FEE_ID);
            if (ExemptionAmount) {
              totalFeeExempAmount += ExemptionAmount.FM_FEE_AMOUNT;
            }
          }
          master_full_amtFS -= totalFeeExempAmount;
        }
      }

      const givenDate = await getSysdateFromOracleDb();
      if (!givenDate) {
        data.errorStatus = 2;
        data.errorMsg = "Could not get system date";
        res.json(data);
        res.status(500).json({ data });

        return;
      }

      // Check fee date
      //   const givenDate = await getSysdateFromOracleDb();
      const checkDate = await getFeeDateForPaymentNew(session_id, givenDate, fee_code);
      console.log("checkDate:", checkDate);

      if (checkDate?.numRows > 0) {
        console.log("checkDate?.numRows:", checkDate?.numRows);
        const values = [
          my_table_amt,
          final_amt_master,
          Fee_Student.FS_FEE_AMOUNT,
          master_full_amtFS
        ];
        console.log(values, "values");
        console.log(session_id, "session_id");
        const check_curr_sess = await getSession(session_id);
        console.log("check_curr_sess:", check_curr_sess);

        if (
          new Set(values).size === 1 &&
          Number(Ac_Fee_Student.AFSP_ACTIVE_STATUS) === Number(check_curr_sess.FS_STATUS)
        ) {

          console.log("new Set(values).size === 1 && Number(Ac_Fee_Student.AFSP_ACTIVE_STATUS) === Number(check_curr_sess.FS_STATUS)");

          // Bank ID logic
          let bank_id = 10;
          if (exem_type == 95) bank_id = 8;
          else if (exem_type == 99) bank_id = 18;
          else if (exem_type == 96) bank_id = 9;
          else if (exem_type == 92) bank_id = 7;


          let late_fee = 0;
          let readmin_fee = 0;

          // Transaction ID
          const get_trans_id = await getFeeSerialNumMasterWithFeeCodeSess(fee_code, session_id);


          const trans_id = `${get_trans_id.FSM_FEE_CODE}${get_trans_id.FSM_SESSION_ID}${get_trans_id.FSM_SERIAL_NO}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
          console.log("trans_id:", trans_id);

          // Claim
          let claim = 0;
          if (exem_type > 0) {
            const checkExemption = await fetchAmountFromMaster(session_id, exem_type);
            console.log("checkExemption:", checkExemption);
            if (checkExemption) {
              for (const row of checkExemption) {
                const ExemptionAmount = await fetchExemptionAmountFromMaster(row.FM_FEE_ID, fee_type, session_id);
                if (ExemptionAmount) {
                  claim += ExemptionAmount.FM_FEE_AMOUNT;
                }
              }
            }
          }

          let special_amt = my_table_amt;
          console.log("special_amt:", special_amt);

          let increamentSerialNum = get_trans_id.FSM_SERIAL_NO + 1;
          console.log("increamentSerialNum:", increamentSerialNum);

          // Calculate previous semester
          const Previoussem = sem - 1;

          // Determine sem_type
          const sem_type = Previoussem - 1 <= 2 ? "lower" : "higher";

          // Determine feedback session name
          const feedback_sess_name = Previoussem % 2 === 0 ? "even" : "odd";

          // Get feedback dates
          const date = await getFeedbackDates(sem_type, feedback_sess_name);
          console.log("date:", date);
          const from_feedbackdate = new Date(date.ASFD_START_DATE);
          const to_feedbackdate = new Date(date.ASFD_END_DATE);

          // Get feedback details
          const acstudfeedbackdetails = await getStudentFeedbackDetails(registerNumber, Previoussem);
          const acstudfeedback = await getStudentFeedback(registerNumber, Previoussem);
          console.log("acstudfeedbackdetails:", acstudfeedbackdetails);
          console.log("acstudfeedback:", acstudfeedback);

          // Get current date
          const currentDate = new Date();

          // Check if we're within feedback period
          if (currentDate >= from_feedbackdate && currentDate <= to_feedbackdate) {
            console.log("from_feedbackdate:", from_feedbackdate);
            console.log("to_feedbackdate:", to_feedbackdate);
            // Check if feedback is completed
            if (acstudfeedbackdetails !== acstudfeedback) {
              throw new Error("Please complete the feedback to enable the payment option.");
            }
          }

          // Insert transaction
          await insertFeeTransSuccess(registerNumber, my_table_amt, bank_id, fee_code, session_id, late_fee, readmin_fee, trans_id, 1);
          const get_success_pay = await getFeeTransDetails(registerNumber, session_id, fee_code);
          console.log("get_success_pay:", get_success_pay);
          await updateSerialNumberInFeeSerialNoMaster(increamentSerialNum, fee_code, session_id);
          await getAllFeeDetails9Where(registerNumber, session_id, fee_code, 8, 2);
          await updateStatusFlagStudentFee(registerNumber, session_id, fee_code, 8, 2);

          const feebranch = await getFeeBranchWithBranchCode(Fee_Student.FS_BRANCH_CODE);
          // const feedegree = await getFeeDegreeWithDegreeCode(feebranch.FB_DEGREE_CODE);
          console.log("feebranch:", feebranch);
          // console.log("feedegree:", feedegree);
          let due_paid = 0;
          let deficit = 0;

          if ([91, 92].includes(Ac_Fee_Student.AFSP_BASE_EXEMPTION)) {
            if (Ac_Fee_Student.AFSP_EXEMPTION_TYPE === 0) {
              due_paid = claim;
            } else {
              deficit = claim;
            }
          }
          console.log("due_paid:", due_paid);
          console.log("deficit:", deficit);

         const insertFeeStudentCummulativeResult = await insertFeeStudentCummulative(
            registerNumber,
            fee_code,
            session_id,
            Ac_Fee_Student.AFSP_FEE_TYPE,
            Ac_Fee_Student.AFSP_SPECIAL_TYPE,
            Ac_Fee_Student.AFSP_EXEMPTION_TYPE,
            my_table_amt,
            spl_typeamt,
            get_success_pay.AFTS_LATE_FEE,
            get_success_pay.AFTS_READMISSION_FEE,
            Fee_Student.FS_GENDER,
            1,
            Fee_Student.FS_STUDENT_TYPE,
            Fee_Student.FS_NAME,
            Fee_Student.FS_DOB,
            Fee_Student.FS_COMMUNITY,
            Fee_Student.FS_BRANCH_CODE,
            Ac_Fee_Student.AFSP_SEMESTER,
            get_success_pay.AFTS_TRANSACTION_ID,
            special_amt,
            0,
            deficit,
            claim,
            1,
            bank_id,
            Fee_Student.FS_CAMP_CODE,
            Fee_Student.FS_DEPT_CODE,
            due_paid
          );
          console.log("insertFeeStudentCummulativeResult:", insertFeeStudentCummulativeResult);
          // Generate and save receipt
          const generate_fee_receipt = await generateFeeExemption(registerNumber, session_id, fee_code, admyear);
          console.log("generate_fee_receipt:", generate_fee_receipt);
          const insertBlob = await InsertFeeReceiptUpdateBlobFn(
            1,
            registerNumber,
            sem,
            generate_fee_receipt,
            get_success_pay.AFTS_TRANSACTION_ID,
            get_success_pay.AFTS_TRANSACTION_TIME
          );
          console.log("insertBlob:", insertBlob);

          // Update status
          await getAllFeeDetails9Where(registerNumber, session_id, fee_code, 9, 8);
          await updateStatusFlagStudentFee(registerNumber, session_id, fee_code, 9, 8);

          res.json({ status: 1 });
        }
        else {
          res.json({ errorStatus: 2, errorMsg: "Contact CeGov office (044-22357973/74)" });
        }
      } else {
        res.json({ errorStatus: 4, errorMsgPayment: "Fee payment is closed.Contact CeGov." });
      }
    } else {
      res.json({ errorStatus: 2, errorMsg: "Contact CeGov office (044-22357973/74)" });
    }
    res.json({ status: 1 });

  } catch (error) {
    res.status(500).json({
      errorStatus: 2,
      errorMsg: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    });
  }

}

async function handleScSctPaycurrent(req, res) {

  console.log("req.body1212:", req.body);

  try {
    // You may use session middleware to get session data if needed
    // const session = req.session;
    // const getRegister = session.StudentRegNo;
    // const getApplno = session.StudentAppNo;
    // const getName = session.StudentName;
    let data = { errorStatus: 0 };

    // For API, get from body (or session if you use it)
    const { applNo, Name, admyear, totalAmount, fullAmt, DueAmount } = req.body;
    let getRegister = applNo;
    let getName = Name;

    // If using session, uncomment above and remove these lines
    if (!getRegister) {
      res.status(400).json({ status: 0, message: "Missing register number" });
      return;
    }

    // Get system date
    const givenDate = await getSysdateFromOracleDb();

    let claim = 0;

    // Get student fee row
    const getdatafromafeestudWhere = await getDataFromAFeeStudWithAdmYear(getRegister, admyear);

    // Get master amount
    const masteramt = await getOriginalAmt(getdatafromafeestudWhere.FS_SESSION_ID, getdatafromafeestudWhere.FS_FEE_TYPE);

    if (getdatafromafeestudWhere.FS_EXEMPTION_TYPE > 0) {
      // If exemption type is greater than 0, we need to check for exemptions
      const checkExemption = await getfeeamount(getdatafromafeestudWhere.FS_SESSION_ID, getdatafromafeestudWhere.FS_EXEMPTION_TYPE);

      if (checkExemption) {
        for (const row of checkExemption) {
          const ExemptionAmount = await getfeeIdTutionfeeless(
            getdatafromafeestudWhere.FS_FEE_TYPE,
            getdatafromafeestudWhere.FS_SESSION_ID,
            row.FM_FEE_ID
          );
          if (ExemptionAmount && typeof ExemptionAmount === 'object') {
            claim += ExemptionAmount.FM_FEE_AMOUNT;
          }
        }
      } else {
        console.error("No exemption found for the given session and type");
        data.errorStatus = 2;
        data.errorMsg = "No exemption found for the given session and type";
        res.json(data);
        res.status(500).json({ data });
        return;
      }
    }

    const NowpAyAmount = getdatafromafeestudWhere.FS_FEE_AMOUNT;

    let nowPAynowUPdate;
    if (claim === 0 && masteramt && masteramt) {
      claim = masteramt;
      nowPAynowUPdate = claim;
    } else {
      nowPAynowUPdate = NowpAyAmount + claim;
    }


    if (!givenDate) {
      data.errorStatus = 2;
      data.errorMsg = "Could not get system date";
      res.json(data);
      res.status(500).json({ data });

      return;
    }


    // Update willingness
    await updateFeeStudentforPaynow_SCST_PMS(
      getRegister,
      admyear,
      nowPAynowUPdate,
      NowpAyAmount,
      givenDate,
      getdatafromafeestudWhere.FS_SESSION_ID,
      2, 0, 10, getdatafromafeestudWhere.FS_EXEMPTION_TYPE// Assuming 2 is the status for SC/ST/PMS
    );

    res.json({ status: 1 });
  } catch (error) {
    res.status(500).json({ status: 0, message: error instanceof Error ? error.message : String(error) });
  }
}

async function getStudentFeeDetails1(req, res) {
  let data = {};
  let claim = 0;
  console.log("req.body:", req.body);
  const { registerNumber, admyear } = req.body;
  const register = registerNumber;

  try {
    // Fetch student fee row
    const feeStud = await getDataFromAFeeStudWithAdmYear(register, admyear);
    console.log("feeStud:", feeStud);

    if (feeStud && feeStud.FS_EXEMPTION_TYPE > 0) {
      // Get exemption amounts
      const checkExemption = await getfeeamount(feeStud.FS_SESSION_ID, feeStud.FS_EXEMPTION_TYPE);
      console.log("checkExemption:", checkExemption);
      if (checkExemption) {
        for (const row of checkExemption) {
          const ExemptionAmount = await getfeeIdTutionfeeless(
            feeStud.FS_FEE_TYPE,
            feeStud.FS_SESSION_ID,
            row.FM_FEE_ID
          );
          if (ExemptionAmount && typeof ExemptionAmount === 'object') {
            claim += ExemptionAmount.FM_FEE_AMOUNT;
          }
        }
      }

      data.claim = claim;
      data.fullAmt = feeStud.FS_FEE_AMOUNT;

      // Get due remarks
      data.GetDueRemarks = await GetDueRemarks(register, feeStud.FS_SESSION_ID);
      console.log("data.GetDueRemarks:", data.GetDueRemarks);

      // Get total amount
      const TotalAmt = await getOriginalAmt(feeStud.FS_SESSION_ID, feeStud.FS_FEE_TYPE);
      data.TotalAmt = TotalAmt ?? 0;

      // Get willingness
      data.GetWillingness = await GetWillimgness(register);
    }
    console.log("data:", data);


    // Send the response back to the client
    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error in getStudentFeeDetails1:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching student fee details'
    });
  }


}

async function handleScScthandlePayLaterFunc(req, res) {

  try {

    let data = { errorStatus: 0 };

    // For API, get from body (or session if you use it)
    const { applNo,admyear, totalAmount, fullAmt, DueAmount, Name, sem } = req.body;
    console.log("req.body1212432434:", req.body);
    let getRegister = applNo;
    let getName = Name;

    // If using session, uncomment above and remove these lines
    if (!getRegister) {
      res.status(400).json({ status: 0, message: "Missing register number" });
      return;
    }

    // Get system date
    const givenDate = await getSysdateFromOracleDb();
    if (!givenDate) {
      data.errorStatus = 2;
      data.errorMsg = "Could not get system date";
      res.json(data);
      res.status(500).json({ data });

      return;
    }
    let claim = 0;

    // Get student fee row
    const getdatafromafeestudWhere = await getDataFromAFeeStudWithAdmYear(getRegister, admyear);

    // Get master amount
    const masteramt = await getOriginalAmt(getdatafromafeestudWhere.FS_SESSION_ID, getdatafromafeestudWhere.FS_FEE_TYPE);

    if (getdatafromafeestudWhere.FS_EXEMPTION_TYPE > 0) {
      // If exemption type is greater than 0, we need to check for exemptions
      const checkExemption = await getfeeamount(getdatafromafeestudWhere.FS_SESSION_ID, getdatafromafeestudWhere.FS_EXEMPTION_TYPE);
      if (checkExemption) {
        for (const row of checkExemption) {
          const ExemptionAmount = await getfeeIdTutionfeeless(
            getdatafromafeestudWhere.FS_FEE_TYPE,
            getdatafromafeestudWhere.FS_SESSION_ID,
            row.FM_FEE_ID
          );
          if (ExemptionAmount && typeof ExemptionAmount === 'object') {
            claim += ExemptionAmount.FM_FEE_AMOUNT;
          }
        }
      }
    }

    if (claim === 0 && masteramt && masteramt) {
      claim = masteramt;
    }
    console.log("claim:", claim);
    // Update willingness
    await updateWillingness(
      getRegister,
      getName,
      claim,
      givenDate,
      getdatafromafeestudWhere.FS_SESSION_ID,
      sem,
    );

    res.json({ status: 1 });
  } catch (error) {
    res.status(500).json({ status: 0, message: error instanceof Error ? error.message : String(error) });
  }
}



module.exports = { handleScSctPaycurrent, getStudentFeeDetails1, HandleConfirmFees, handleScScthandlePayLaterFunc };