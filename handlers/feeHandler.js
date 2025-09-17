// Import with .js extension for ES modules
console.log('Loading feeHandler.js...');
import {
  getStudentFeeDetails,
  balanceAmtCount8New as balance_amt_count_8New,
  checkStudentAdmissionStatusForLogin,
  getTransAll,
  matchTempReceipt,
  getSemesterInFeeStudCumAll,
  getFeeBranchWithBranchCode,
  feeDegree,
  getSysdateFromOracleDb,
  balanceAmtCount,
  balanceRemarks,
  balanceAmtCount8,
  getFeeTransBalanceDetails,
  bankChargesFee,
  getTransTimeForZeroFee,
  getRedoData,
  getFeeRedoTransDetails,
  getAllPendingFeeOld,
  getLateFeeType,
  getType,
  getPenaltyAmt,
  getAllPendingFeeScst,
  getLateFeeTypeScst,
  getTypeScst,
  getFeeType0,
  getFeeType45,
  getAllPendingFeeNew,
  getDataFromFeeStudWhere,
  getFeeAmount,
  getFeeIdTutionfeeless,
  getDueRemarks,
  getOriginalAmt,
  getWillimgness,
  getAllPendingFeeNew8,
  getTransAllFirstYear,getEmpIdByDevice,getAdmYear
} from '../queries/feeQueries.js';


// Example Express handler for /api/studentfee/initialloader
async function initialloader(req, res) {
  console.log(req.body,'req.bodyinitial');

try {
    
    const deviceId = req.body.deviceId || req.body.deviceid;
    const notificationToken = req.body.notificationId || req.body.notificationId;

    const regno = await getEmpIdByDevice(deviceId, notificationToken);    // 1. Get session data (adapt to your session middleware)
   console.log(regno,'regnoregno')
   
    const getRegister = regno;
    const AdmYr = await getAdmYear(regno);    // 1. Get session data (adapt to your session middleware)
    const StudentAdmissionYear = AdmYr;
   
    const register = getRegister;
    console.log(getRegister,'getRegisterregisterregister')


    // 2. Fetch main student fee data
    const Fee_Student = await getStudentFeeDetails(getRegister);
    const BalancePayment = await balance_amt_count_8New(getRegister);
    const FeeSession = await checkStudentAdmissionStatusForLogin(getRegister);
    let allTransactions = [];

    if (FeeSession && FeeSession.FS_ADM_STATUS == 1 && Fee_Student && Fee_Student.FS_READM_STATUS == 0) {
      allTransactions = [
        ...(await getTransAllFirstYear(register, StudentAdmissionYear)),
      ];

      if (BalancePayment && BalancePayment.length > 0) {
        allTransactions = [
          ...allTransactions,
          ...(await getTransAll(getRegister)),
        ];
      }
    } else {
      allTransactions = [
        ...(await getTransAll(register)),
      ];


    }

    // 3. Process transactions for form summary (mimic PHP foreach)
    const formsummary = [];
    for (const row of allTransactions) {

        

      let sem = null;
      const feeamt = row.FT_AMOUNT_PAID;
      const late_fee = row.FT_LATE_FEE;
      const readmission_fee = row.FT_READMISSION_FEE;
      let receipt_status = 0;
      const check_if_receipt_generated = await matchTempReceipt(row.FT_TRANSACTION_ID);

      if (check_if_receipt_generated) {
        sem = check_if_receipt_generated;

        receipt_status = 1;
      } else {
        const get_sem = await getSemesterInFeeStudCumAll(row.FT_SESSION_ID, row.FT_TRANSACTION_ID);
        if (get_sem) sem = get_sem.FSC_SEMESTER;
      }


      if (sem != null) {

        const feebranch = await getFeeBranchWithBranchCode(Fee_Student.FS_BRANCH_CODE);
        const feedegree = await feeDegree(feebranch.FB_DEGREE_CODE);
        
      // Defensive: ensure FT_TRANSACTION_TIME is a string before split
      let transtime = '';
      if (typeof row.FT_TRANSACTION_TIME === 'string') {
        transtime = row.FT_TRANSACTION_TIME.split(' ')[0];
      } else if (row.FT_TRANSACTION_TIME instanceof Date) {
        transtime = row.FT_TRANSACTION_TIME.toISOString().slice(0, 10);
      } else if (row.FT_TRANSACTION_TIME) {
        transtime = String(row.FT_TRANSACTION_TIME).split(' ')[0];
      }

        formsummary.push({
          trans_id: row.FT_TRANSACTION_ID,
          transtime,
          sem,
          feeamt,
          late_fee,
          readmission_fee,
          penalty_latefee: 0,
          feeStatus: (feeamt > 0 || late_fee > 0) ? 'Fee Paid' : 'Confirmed',
          MaxSem: feedegree.FDG_MAX_SEMESTER,
          Exemption: Fee_Student.FS_EXEMPTION_TYPE,
          receipt_status
        });
      }
    }

    // console.log('Form Summary:', formsummary);
    const data = {};
    data.displaytable = formsummary;

    // Get current date from DB
    const givenDate = await getSysdateFromOracleDb();

    // Balance count
    data.balance_count = await balanceAmtCount(getRegister);
    if (data.balance_count && data.balance_count.length > 0) {
      let formsummary2 = [];
      for (const value of data.balance_count) {
        const balance_remarks = await balanceRemarks(value.AFSPB_BALANCE_STATUS);
        data.remarks = balance_remarks ? balance_remarks.FIT_REMARKS : 'Balance Fee';
        data.fee_status1 = 'Pending';
        formsummary2.push({
          balance_status: value.AFSPB_STATUS_FLAG,
          transtime1: '-',
          sem1: value.AFSPB_SEMESTER,
          feeamt1: value.AFSPB_FEE_AMOUNT,
          late_fee1: 0,
          readmission_fee1: 0,
          penalty_latefee1: 0
        });
      }
      data.balance_fee = formsummary2;
    }

    // Balance count of 8
    data.balance_countof8 = await balanceAmtCount8(getRegister);
    if (data.balance_countof8 && data.balance_countof8.length > 0) {
      let formsummary3 = [];
      for (const value1 of data.balance_countof8) {
        const balance_remarks = await balanceRemarks(value1.AFSPB_BALANCE_STATUS);
        data.remarks = balance_remarks ? balance_remarks.FIT_REMARKS : 'Balance Fee';
        const success_trans = await getFeeTransBalanceDetails(getRegister, value1.AFSPB_SESSION_ID, value1.AFSPB_FEE_CODE);
        if (success_trans) {
          const ZeroTransTime = (success_trans.AFTBS_TRANSACTION_TIME || '').split(' ')[0];
          data.bal_tran_id = success_trans.AFTBS_TRANSACTION_ID;
          data.fee_status1 = 'Fee paid';
          formsummary3.push({
            balance_status: value1.AFSPB_STATUS_FLAG,
            transtime1: ZeroTransTime,
            sem1: value1.AFSPB_SEMESTER,
            feeamt1: success_trans.AFTBS_AMOUNT_PAID,
            late_fee1: success_trans.AFTBS_LATE_FEE,
            readmission_fee1: success_trans.AFTBS_READMISSION_FEE,
            penalty_latefee1: 0
          });
        }
      }
      data.balance_fee8 = formsummary3;
    }

    // Bank service charges
    const get_bank_Service = await bankChargesFee(getRegister);
    if (get_bank_Service) {
      data.bank_service_status = get_bank_Service.AFSPB_STATUS_FLAG;
      data.desc1 = 'Bank charges';
      if (data.bank_service_status == 2) {
        data.late_fee2 = 0;
        data.readmin_fee2 = 0;
        data.penalty_latefee2 = 0;
        data.fee_Amount2 = get_bank_Service.AFSPB_FEE_AMOUNT;
        data.late_due_fee_amount2 = get_bank_Service.AFSPB_FEE_AMOUNT;
        data.trans_time2 = '-';
        data.fee_status2 = 'Pending';
      } else if (data.bank_service_status == 8 || data.bank_service_status == 12) {
        const transaction = await getTransTimeForZeroFee(getRegister, get_bank_Service.AFSPB_SESSION_ID, get_bank_Service.AFSPB_FEE_CODE);
        const ZeroTransTime = (transaction.AFTBS_TRANSACTION_TIME || '').split(' ')[0];
        data.late_fee2 = transaction.AFTBS_LATE_FEE;
        data.readmin_fee2 = transaction.AFTBS_READMISSION_FEE;
        data.penalty_latefee2 = 0;
        data.fee_Amount2 = transaction.AFTBS_AMOUNT_PAID;
        data.late_due_fee_amount2 = transaction.AFTBS_AMOUNT_PAID;
        data.trans_time2 = ZeroTransTime;
        data.fee_status2 = 'Fee paid';
      }
    }

    // Redo course fee
    const get_redo_fee_all = await getRedoData(getRegister);
    if (get_redo_fee_all) {
      data.sem_redo = get_redo_fee_all.AFSPB_SEMESTER;
      data.status_flag_REDO = get_redo_fee_all.AFSPB_STATUS_FLAG;
      data.redo_desc = 'Redo fee';
      if (data.status_flag_REDO == 2) {
        data.late_fee_REDO = 0;
        data.readmin_fee_REDO = 0;
        data.penalty_latefee_REDO = 0;
        data.fee_Amount_REDO = get_redo_fee_all.AFSPB_FEE_AMOUNT;
        data.late_due_fee_amount_REDO = get_redo_fee_all.AFSPB_FEE_AMOUNT;
        data.trans_time_REDO = '-';
      } else if ([8, 12, 9].includes(data.status_flag_REDO)) {
        const transaction = await getFeeRedoTransDetails(getRegister, get_redo_fee_all.AFSPB_SESSION_ID, get_redo_fee_all.AFSPB_FEE_CODE);
        data.trans_id_REDO = transaction.AFTBS_TRANSACTION_ID;
        const ZeroTransTime = (transaction.AFTBS_TRANSACTION_TIME || '').split(' ')[0];
        data.late_fee_REDO = transaction.AFTBS_LATE_FEE;
        data.readmin_fee_REDO = transaction.AFTBS_READMISSION_FEE;
        data.penalty_latefee_REDO = 0;
        data.fee_Amount_REDO = transaction.AFTBS_AMOUNT_PAID;
        data.late_due_fee_amount_REDO = transaction.AFTBS_AMOUNT_PAID;
        data.trans_time_REDO = ZeroTransTime;
      }
    }

    // Old pending fees
    data.fee_student_payment_old = await getAllPendingFeeOld(getRegister);
    if (data.fee_student_payment_old && data.fee_student_payment_old.length > 0) {
      let formsummary_old = [];
      for (const value of data.fee_student_payment_old) {
        const checkDateInTable = await getLateFeeType(value.AFSP_SESSION_ID, givenDate, value.AFSP_FEE_CODE);
        const FeePaymentClosed = await getType(value.AFSP_SESSION_ID, value.AFSP_FEE_CODE);
        let get_fee_type = 0;
        if (checkDateInTable) {
          get_fee_type = checkDateInTable.FDA_FEE_TYPE;
        } else if (FeePaymentClosed) {
          get_fee_type = FeePaymentClosed.FDA_FEE_TYPE;
        }
        const get_penalty_amt = await getPenaltyAmt(value.AFSP_SESSION_ID, get_fee_type);
        let late = 0, redmin = 0, penalty = 0;
        if (get_penalty_amt) {
          if (get_fee_type == 41) late = get_penalty_amt[0].FM_FEE_AMOUNT;
          else if (get_fee_type == 42) { late = get_penalty_amt[0].FM_FEE_AMOUNT; redmin = get_penalty_amt[1].FM_FEE_AMOUNT; }
          else if (get_fee_type == 45) { late = get_penalty_amt[0].FM_FEE_AMOUNT; redmin = get_penalty_amt[1].FM_FEE_AMOUNT; penalty = get_penalty_amt[2].FM_FEE_AMOUNT; }
        }
        formsummary_old.push({
          status_flag: value.AFSP_STATUS_FLAG,
          transtime: '-',
          sem: value.AFSP_SEMESTER,
          feeamt: value.AFSP_FEE_AMOUNT,
          late_fee: late,
          readmission_fee: redmin,
          penalty_latefee: penalty,
          late_fee_Amt: value.AFSP_FEE_AMOUNT + late + redmin + penalty
        });
      }
      data.displaytable1 = formsummary_old;
    }


    // console.log('Data after processing old fees:', data);
    console.log(getRegister,'getRegistergetRegister')

    // SCST tuition fee
    data.fee_student_payment_scst = await getAllPendingFeeScst(getRegister);
    console.log( data.fee_student_payment_scst ,' data.fee_student_payment_scst ')
    if (data.fee_student_payment_scst && data.fee_student_payment_scst.length > 0) {
      let formsummary_scst = [];
      for (const value of data.fee_student_payment_scst) {

        // const checkDateInTable = await getLateFeeTypeScst(value.AFSPS_SESSION_ID, givenDate, value.AFSPS_FEE_CODE, Fee_Student.FS_CAMP_CODE);
        const checkDateInTable = await getLateFeeTypeScst(231, givenDate, 10, Fee_Student.FS_CAMP_CODE);
        const FeePaymentClosed = await getTypeScst(value.AFSPS_SESSION_ID, value.AFSPS_FEE_CODE, Fee_Student.FS_CAMP_CODE);
        let get_fee_type = 0;
        if (checkDateInTable) {
          get_fee_type = checkDateInTable.FDAS_FEE_TYPE;
          const get_fee_date_id = checkDateInTable.FDAS_DATE_ID;
          if (get_fee_date_id == 1) data.Fee_Date_Check = `Last date for Fee payment without fine is ${checkDateInTable.FDAS_TO}`;
          else if (get_fee_date_id == 2) data.Fee_Date_Check = `Last date for Fee payment with fine is ${checkDateInTable.FDAS_TO}`;
          else if (get_fee_date_id == 3) data.Fee_Date_Check = `Last date for Fee payment with fine and re-admission fee is ${checkDateInTable.FDAS_TO}`;
        } else {
          // Check if the current date is before FDAS_FROM of fee type 0
          const currentDate = new Date().toISOString().slice(0, 10);
          const feeType0Data = await getFeeType0(value.AFSPS_SESSION_ID, value.AFSPS_FEE_CODE, Fee_Student.FS_CAMP_CODE);
          if (feeType0Data && new Date(currentDate) < new Date(feeType0Data.FDAS_FROM)) get_fee_type = 0;
          else {
            const feeType45Data = await getFeeType45(value.AFSPS_SESSION_ID, value.AFSPS_FEE_CODE, Fee_Student.FS_CAMP_CODE);
            if (feeType45Data && new Date(currentDate) > new Date(feeType45Data.FDAS_TO)) get_fee_type = 45;
            else get_fee_type = 0;
          }
        }
        const get_penalty_amt = await getPenaltyAmt(value.AFSPS_SESSION_ID, get_fee_type);
        let late = 0, redmin = 0, penalty = 0;
        if (get_penalty_amt) {
          if (get_fee_type == 41) late = get_penalty_amt[0].FM_FEE_AMOUNT;
          else if (get_fee_type == 42) { late = get_penalty_amt[0].FM_FEE_AMOUNT; redmin = get_penalty_amt[1].FM_FEE_AMOUNT; }
          else if (get_fee_type == 45) { late = get_penalty_amt[0].FM_FEE_AMOUNT; redmin = get_penalty_amt[1].FM_FEE_AMOUNT; penalty = get_penalty_amt[2].FM_FEE_AMOUNT; }
        }
        // Format all fields as strings, and match PHP output structure
        formsummary_scst.push({
          status_flag: value.AFSPS_STATUS_FLAG != null ? value.AFSPS_STATUS_FLAG.toString() : '',
          transtime: '-',
          sem: value.AFSPS_SEMESTER != null ? value.AFSPS_SEMESTER.toString() : '',
          feeamt: value.AFSPS_FEE_AMOUNT != null ? value.AFSPS_FEE_AMOUNT.toString() : '',
          late_fee: late != null ? late.toString() : '0',
          readmission_fee: redmin != null ? redmin.toString() : '0',
          penalty_latefee: penalty != null ? penalty.toString() : '0',
          late_fee_Amt: (Number(value.AFSPS_FEE_AMOUNT || 0) + Number(late || 0) + Number(redmin || 0) + Number(penalty || 0)).toString()
        });
      }
      data.displaytable2 = formsummary_scst;
    }

    // New pending fees
    data.fee_student_payment_new = await getAllPendingFeeNew(getRegister);
    if (data.fee_student_payment_new) {
      let claim = 0;
      const getdatafromafeestudWhere = await getDataFromFeeStudWhere(getRegister);
      if (getdatafromafeestudWhere && getdatafromafeestudWhere.FS_EXEMPTION_TYPE > 0) {
        const checkExemption = await getFeeAmount(getdatafromafeestudWhere.FS_SESSION_ID, getdatafromafeestudWhere.FS_EXEMPTION_TYPE);
        if (checkExemption) {
          for (const row of checkExemption) {
            const ExemptionAmount = await getFeeIdTutionfeeless(getdatafromafeestudWhere.FS_FEE_TYPE, getdatafromafeestudWhere.FS_SESSION_ID, row.FM_FEE_ID);
            if (ExemptionAmount) claim += ExemptionAmount.FM_FEE_AMOUNT;
          }
        }
        data.claim = claim;
        data.fullAmt = getdatafromafeestudWhere.FS_FEE_AMOUNT;
        data.GetDueRemarks = await getDueRemarks(getRegister, getdatafromafeestudWhere.FS_SESSION_ID);
        const TotalAmt = await getOriginalAmt(getdatafromafeestudWhere.FS_SESSION_ID, getdatafromafeestudWhere.FS_FEE_TYPE);
        data.TotalAmt = TotalAmt?.TOTAL_FEE_AMOUNT || 0;
        data.GetWillimgness = await getWillimgness(getRegister);
      }
      const checkDateInTable = await getLateFeeType(data.fee_student_payment_new.AFSP_SESSION_ID, givenDate, data.fee_student_payment_new.AFSP_FEE_CODE);
      const FeePaymentClosed = await getType(data.fee_student_payment_new.AFSP_SESSION_ID, data.fee_student_payment_new.AFSP_FEE_CODE);
      let get_fee_type = 0;
      if (checkDateInTable) {
        get_fee_type = checkDateInTable.FDA_FEE_TYPE;
        if (get_fee_type == 0) data.Fee_Date_Check = `Last date for Fee payment without fine is ${checkDateInTable.FDA_TO}`;
        else if (get_fee_type == 41) data.Fee_Date_Check = `Last date for Fee payment with fine is ${checkDateInTable.FDA_TO}`;
        else if (get_fee_type == 42) data.Fee_Date_Check = `Last date for Fee payment with fine and re-admission fee is ${checkDateInTable.FDA_TO}`;
      } else if (FeePaymentClosed) {
        get_fee_type = FeePaymentClosed.FDA_FEE_TYPE;
      }
      const get_penalty_amt = await getPenaltyAmt(data.fee_student_payment_new.AFSP_SESSION_ID, get_fee_type);
      let late = 0, readmin = 0, penalty = 0;
      if (getdatafromafeestudWhere && get_penalty_amt && getdatafromafeestudWhere.FS_EXEMPTION_TYPE != 98) {
        if (get_fee_type == 41) late = get_penalty_amt[0].FM_FEE_AMOUNT;
        else if (get_fee_type == 42) { late = get_penalty_amt[0].FM_FEE_AMOUNT; readmin = get_penalty_amt[1].FM_FEE_AMOUNT; }
        else if (get_fee_type == 45) { late = get_penalty_amt[0].FM_FEE_AMOUNT; readmin = get_penalty_amt[1].FM_FEE_AMOUNT; penalty = get_penalty_amt[2].FM_FEE_AMOUNT; }
      }
      let formsummary_new_2 = [];
      formsummary_new_2.push({
        status_flag: data.fee_student_payment_new.AFSP_STATUS_FLAG,
        transtime: '-',
        sem: data.fee_student_payment_new.AFSP_SEMESTER,
        feeamt: data.fee_student_payment_new.AFSP_FEE_AMOUNT,
        late_fee: late,
        readmission_fee: readmin,
        penalty_latefee: penalty,
        late_fee_Amt: data.fee_student_payment_new.AFSP_FEE_AMOUNT + late + readmin + penalty
      });
      data.displaytable_new_fee_2 = formsummary_new_2;
    }

    // New 8 pending fees
    const fee_student_payment_new_8 = await getAllPendingFeeNew8(getRegister);
    if (fee_student_payment_new_8 && fee_student_payment_new_8.length > 0) {
      let formsummary_new_8 = [];
      for (const value of fee_student_payment_new_8) {
        const success_trans = await getFeeTransBalanceDetails(getRegister, value.AFSP_SESSION_ID, value.AFSP_FEE_CODE);
        if (success_trans) {
          const split_trans = (success_trans.AFTBS_TRANSACTION_TIME || '').split(' ');
          let readmin_fee = success_trans.AFTBS_READMISSION_FEE || 0;
          let penalty = (readmin_fee > 500) ? readmin_fee - 500 : 0;
          readmin_fee = Math.min(readmin_fee, 500);
          formsummary_new_8.push({
            transtime: split_trans[0] || '',
            sem: value.AFSP_SEMESTER,
            feeamt: success_trans.AFTBS_AMOUNT_PAID || 0,
            late_fee: success_trans.AFTBS_LATE_FEE || 0,
            readmission_fee: readmin_fee,
            penalty_latefee: penalty,
            late_fee_Amt: (success_trans.AFTBS_AMOUNT_PAID || 0) + (success_trans.AFTBS_LATE_FEE || 0) + readmin_fee,
            new_trans_id: success_trans.AFTBS_TRANSACTION_ID
          });
        }
      }
      data.displaytable_new_8 = formsummary_new_8;
    }
    data.Fee_Student = Fee_Student;

    res.json(data);
  } catch (error) {
    console.error('Error in initialLoader:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export the handler as a named export
export { initialloader };
