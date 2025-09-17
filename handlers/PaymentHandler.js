import express from 'express';
import dotenv from 'dotenv';
import { format } from 'date-fns';
import os from 'os';
import dns from 'dns/promises';
import session from 'express-session';
const app = express();

// Import queries
import {
  getStudentSession,
  fetchAmountfromStudentPayment,
  getSysdateFromOracleDb,
  getFeeDateForPayment,
  fetchAmountFromMaster,
  fetchSpecialAmount,
  fetchExemptionAmount,
  fetchExemptionAmountFromMaster,
  fetchBalanceAmountFromStudentBalance,
  updateWillingness,
  updateFeeStudentforPaynow_SCST_PMS,bankServiceCharges,balanceAmtPay,scstAmtPay,
  getdatafromafeestudWhere,getAllFeeDetails9,getRedoData,redoCourse,getFeeType0,
  getFeeType45,getLateFeeTypeScst,getLateFeeType,getFeeStud,getFeeDateForScstPayment,getdatafromafeestud
} from '../queries/FeePaymentQuery.js';

import {
  getSession,
  getFeeSerialNumMasterWithFeeCodeSess,
  updateHitCountACStudPaymentDupId,
  fetchFeeBankByBankID,
  insertFeeBankSent,
  getStudentData,
  getStudentPersonalData,
  fetchFeeSerialNumMaster,
  getFeeBankReturn,
  InsertFeeBankReturn,
  getFeeBankSentWithTransId,
  getAcFeeStudentPaymentBalanceWith,
  getAcFeeStudentPaymentWith,
  InsertBalanceSuccessUpdatePaymentBalanceUpdateBankSendCloseTime,
  UpdateAcFeeStudentPaymentBalanceUpdate,
  updateCumulativewithBalanceAmt,
  UpdateFeeStudentUpdate,
  InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatus,
  getfeeIdTutionfeeless,
  getfeeamount,
  getOriginalAmountFeeMaster,
  getAcFeeStudentPayment,
  InsertFeeStudentCummulativeUpdate,
  InsertFeeReceiptUpdateBlobFn,
  InsertAcFeeBankFailPaymentFailStatus,
  getReceiptPDF,
  getFeeStudentwithRegisterNoSinglerow,getFeeAmountAll,getExemptionAmount,get_penalty_amt
} from '../queries/RazorPaymentQuery.js';

import { default as Razorpay } from 'razorpay';
import { default as crypto } from 'crypto';
import axios from 'axios';
import cors from 'cors';
import { buildOptionsCheckout } from '../Utils/razorpayConfig.js';
const razorpay_order_id_session = '';
const transaction_id = '';

console.log(process.env.SESSION_SECRET)
// Configure session middleware
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};
// For production, use a proper session store (not memory)
if (process.env.NODE_ENV === 'production') {
  const RedisStore = require('connect-redis')(session);
  sessionConfig.store = new RedisStore({
    url: process.env.REDIS_URL
  });
}

// Mount session middleware BEFORE your routes
app.use(session(sessionConfig));

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZOR_KEY_ID,
  key_secret: process.env.RAZOR_KEY_SECRET
});


// Helper functions
const generateSignature = (orderId, paymentId) => {
  const payload = `${orderId}|${paymentId}`;
  return crypto.createHmac('sha256', process.env.RAZOR_KEY_SECRET)
    .update(payload)
    .digest('hex');
};

const createOrder = async (receipt, amount) => {
  try {
    console.log(receipt, amount)
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
      payment_capture: 1
    });
    return order;
  } catch (error) {
    throw new Error(`Razorpay order creation failed: ${error.message}`);
  }
};

const getPayment = async (paymentId) => {
  try {
    const response = await axios.get(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      auth: {
        username: process.env.RAZOR_KEY_ID,
        password: process.env.RAZOR_KEY_SECRET
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }
};

dotenv.config();

const router = express.Router();

// Configure session middleware
// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 30 * 60 * 1000 // 30 minutes
  }
}));

app.use(cors({
  origin: true,
  credentials: true
}));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


export default async function PaymentHandler(req, res) {

  console.log(req.body,'req.body')

  let data = {
    errorStatus: 0,
    errorMsg: ""
  };

  console.log(req.session);

  //   // Get stored session data
  // const razorpayData = req.session.razorpayData;
  // console.log('razorpayDatarazorpayData')
  // if (!razorpayData) {
  //   return res.status(400).json({
  //     errorStatus: 2,
  //     errorMsg: "Session data not found"
  //   });
  // }
    if (!req.session) {
      console.error('Session middleware not working - req.session is undefined');
      return res.status(500).json({
        errorStatus: 2,
        errorMsg: "Server configuration error - sessions not available"
      });
    }

    const StudentRegNo = req.body.applNo;
    // const admyear = req.body.admyear;


  try {
    console.log(StudentRegNo,'StudentRegNo')  
    // Fetch data from database (replace with your actual database calls)
    const givenDate = await getSysdateFromOracleDb();
    const bank_service_charges = await bankServiceCharges(StudentRegNo,14);
    const get_redo_fee_pending = await bankServiceCharges(StudentRegNo,13); //redo fee
    
    let dateFallRedo;
    if (get_redo_fee_pending != null) {
      dateFallRedo = await getFeeDateForPayment(
        get_redo_fee_pending.AFSPB_SESSION_ID, 
        givenDate, 
        get_redo_fee_pending.AFSPB_FEE_CODE
      );
    }

    const balance = await balanceAmtPay(StudentRegNo);
    const scstfee = await scstAmtPay(StudentRegNo);
    const get_pending_fee = await getAllFeeDetails9(StudentRegNo);
    const fee_student = await getdatafromafeestudWhere(StudentRegNo);
    const fee_student_redo = await bankServiceCharges(StudentRegNo,13);
    const fee_student_bank = await bankServiceCharges(StudentRegNo,14 );

    console.log(balance,'balance')
    console.log(scstfee,'scstfee')
    console.log(get_pending_fee,'get_pending_fee')
    console.log(fee_student,'fee_student')
    console.log(fee_student_redo,'fee_student_redo')
    console.log(fee_student_bank,'fee_student_bank')
    console.log(bank_service_charges,'bank_service_charges')
    console.log(get_pending_fee != null && fee_student != null,'get_pending_fee != null && fee_student != null')


    let RzPayFeeCode, RzPaySessioId, RzPaySumFees, RzPayLate, RzPayReAdmin, final_amt_masterFS =0 ;

    if (bank_service_charges != null) {
      console.log(bank_service_charges,'bank_service_charges')
      const FetchSerialNo = await getFeeSerialNumMasterWithFeeCodeSess(
        bank_service_charges.AFSPB_FEE_CODE, 
        bank_service_charges.AFSPB_SESSION_ID
      );

      if (fee_student_bank != null && 
          parseInt(bank_service_charges.AFSPB_FEE_AMOUNT) === parseInt(fee_student_bank.FS_FEE_AMOUNT) && 
          FetchSerialNo != null) {
        
        RzPayFeeCode = bank_service_charges.AFSPB_FEE_CODE;
        RzPaySessioId = bank_service_charges.AFSPB_SESSION_ID;
        RzPaySumFees = bank_service_charges.AFSPB_FEE_AMOUNT;
        RzPayLate = 0;
        RzPayReAdmin = 0;
      } else {
        data.errorStatus = 2;
        data.errorMsg = "Contact CeGov office (044-22357973/74)";
      }
    } 
    else if (get_redo_fee_pending != null) {
      const get_redo_fee = await redoCourse(StudentRegNo);

      if (get_redo_fee != null && fee_student_redo != null && dateFallRedo.numRows > 0) {
        const FetchSerialNo = await getFeeSerialNumMasterWithFeeCodeSess(
          get_redo_fee_pending.AFSPB_FEE_CODE, 
          get_redo_fee_pending.AFSPB_SESSION_ID
        );

        if (parseInt(get_redo_fee.FE_REGULAR_FEE_AMOUNT) === parseInt(get_redo_fee_pending.AFSPB_FEE_AMOUNT) && 
            parseInt(get_redo_fee_pending.AFSPB_FEE_AMOUNT) === parseInt(fee_student_redo.FS_FEE_AMOUNT) && 
            FetchSerialNo != null) {
          
          RzPayFeeCode = get_redo_fee_pending.AFSPB_FEE_CODE;
          RzPaySessioId = get_redo_fee_pending.AFSPB_SESSION_ID;
          RzPaySumFees = get_redo_fee_pending.AFSPB_FEE_AMOUNT;
          RzPayLate = 0;
          RzPayReAdmin = 0;
        } else {
          data.errorStatus = 2;
          data.errorMsg = "Contact CeGov office (044-22357973/74)";
        }
      } else {
        data.errorStatus = dateFallRedo.numRows > 0 ? 2 : 4;
        data.errorMsg = dateFallRedo.numRows > 0 
          ? "Contact CeGov office (044-22357973/74)" 
          : "Fee payment is closed- Contact CeGov.";
      }
    } 
    else if (balance != null) {
      const BalanceDate = new Date(balance.AFSPB_DATE_START);
      BalanceDate.setDate(BalanceDate.getDate() + balance.AFSPB_NOF_DAYS);
      
      const FetchSerialNo = await getFeeSerialNumMasterWithFeeCodeSess(
        balance.AFSPB_FEE_CODE, 
        balance.AFSPB_SESSION_ID
      );
      console.log(BalanceDate ,'BalanceDate', new Date(givenDate))
      
      if (FetchSerialNo != null) {
        if (BalanceDate > new Date(givenDate)) {
          RzPayFeeCode = balance.AFSPB_FEE_CODE;
          RzPaySessioId = balance.AFSPB_SESSION_ID;
          RzPaySumFees = balance.AFSPB_FEE_AMOUNT;
          RzPayLate = 0;
          RzPayReAdmin = 0;
        } else {
          data.errorStatus = 4;
          data.errorMsg = "Fee payment is closed. To enable fee payment, a request letter forwarded by HOD and Dean is to be submitted at CeGov.";
        }
      } else {
        data.errorStatus = 2;
        data.errorMsg = "Contact CeGov office (044-22357973/74)";
      }
    } 
    else if (scstfee != null) {
      const session_id = scstfee.AFSPS_SESSION_ID;
      const fee_code = scstfee.AFSPS_FEE_CODE;
      const my_table_amt = scstfee.AFSPS_FEE_AMOUNT;
      const campCode = await getFeeStud(StudentRegNo);

      const checkDate = await getFeeDateForScstPayment(
        session_id, 
        givenDate, 
        fee_code, 
        campCode.FS_CAMP_CODE
      );
      
      const check_curr_sess = await getSession(scstfee.AFSPS_SESSION_ID);
      const FetchSerialNo = await getFeeSerialNumMasterWithFeeCodeSess(
        scstfee.AFSPS_FEE_CODE, 
        scstfee.AFSPS_SESSION_ID
      );
      console.log(check_curr_sess,'check_curr_sess')

      const late_type = await getLateFeeTypeScst(
        session_id, 
        givenDate, 
        fee_code, 
        campCode.FS_CAMP_CODE
      );
      console.log(late_type,'late_type')

      const feeType0 = await getFeeType0(
        session_id, 
        fee_code, 
        campCode.FS_CAMP_CODE
      );
      console.log(feeType0,'feeType0')
      
      const feeType45 = await getFeeType45(
        session_id, 
        fee_code, 
        campCode.FS_CAMP_CODE
      );
      console.log(feeType45,'feeType45')

      const currentDate = new Date().toISOString().split('T')[0];
      console.log(new Date(currentDate) > new Date(feeType0.FDAS_TO),'new Date(currentDate) > new Date(feeType0.FDAS_TO)')

      if (feeType0 && new Date(currentDate) > new Date(feeType0.FDAS_TO)) {
        data.errorStatus = 4;
        data.errorMsg = "Fee payment is closed.";
      }

      let late, readm;
      if (late_type != null && late_type.FDAS_FEE_TYPE != 0) {
        const gpa = await get_penalty_amt(session_id, late_type.FDAS_FEE_TYPE);
        
        if (gpa != null) {
          if (late_type.FDAS_FEE_TYPE == 41) {
            late = gpa[0].FM_FEE_AMOUNT;
            readm = 0;
          } else if (late_type.FDAS_FEE_TYPE == 42) {
            late = gpa[0].FM_FEE_AMOUNT;
            readm = gpa[1].FM_FEE_AMOUNT;
          } else if (late_type.FDAS_FEE_TYPE == 45) {
            late = gpa[0].FM_FEE_AMOUNT;
            readm = gpa[1].FM_FEE_AMOUNT + gpa[2].FM_FEE_AMOUNT;
          }
        } else {
          late = null;
          readm = null;
        }
      } else {
        late = 0;
        readm = 0;
      }
    

      if (checkDate.numRows > 0 && 
          parseInt(scstfee.AFSPS_ACTIVE_STATUS) === parseInt(check_curr_sess.FS_STATUS) && 
          late !== null && 
          readm !== null && 
          FetchSerialNo != null) {
        
        RzPayFeeCode = fee_code;
        RzPaySessioId = session_id;
        RzPaySumFees = my_table_amt;
        RzPayLate = late;
        RzPayReAdmin = readm;
      } else {
        // console.log(data.errorStatus,'feeType0feeType0')
        if (data.errorStatus == 2) {
          data.errorMsg = "Fee payment will start from " + feeType0.FDAS_FROM + ".";
        } else if (data.errorStatus == 4) {
          data.errorMsg = "Fee payment is closed.";
        }
      }
    } 
    else if (get_pending_fee != null && fee_student != null) {

      const session_id = get_pending_fee.AFSP_SESSION_ID;
      const fee_code = get_pending_fee.AFSP_FEE_CODE;
      const my_table_amt = get_pending_fee.AFSP_FEE_AMOUNT;

      const masteramt = await getOriginalAmountFeeMaster(
        get_pending_fee.AFSP_SESSION_ID, 
        get_pending_fee.AFSP_FEE_TYPE
      );

      // console.log(masteramt,'masteramt')

      let master_full_amtFS = masteramt.TOTAL_FEE_AMOUNT;
      let final_amt_master = 0;
      let Special_type_amt = 0;

      if (get_pending_fee.AFSP_SPECIAL_TYPE > 0) {
        const get_Special_type_amt = await getFeeAmountAll(
          get_pending_fee.AFSP_SESSION_ID, 
          get_pending_fee.AFSP_SPECIAL_TYPE
        );

        get_Special_type_amt.forEach(value => {
          Special_type_amt += value.FM_FEE_AMOUNT;
        });
        master_full_amtFS += Special_type_amt;
      }

      let totalFeeExempAmount = 0;
      if (get_pending_fee.AFSP_EXEMPTION_TYPE != 0) {
        const checkExemption = await getFeeAmountAll(
          get_pending_fee.AFSP_SESSION_ID, 
          get_pending_fee.AFSP_EXEMPTION_TYPE
        );

        if (checkExemption != null) {
          for (const row of checkExemption) {
            const ExemptionAmount = await getfeeIdTutionfeeless(
              get_pending_fee.AFSP_FEE_TYPE, 
              get_pending_fee.AFSP_SESSION_ID, 
              row.FM_FEE_ID
            );

            if (ExemptionAmount != null && typeof ExemptionAmount === 'object') {
              totalFeeExempAmount += ExemptionAmount.FM_FEE_AMOUNT;
            }
          }
          master_full_amtFS -= totalFeeExempAmount;
        }
      }

      final_amt_master = master_full_amtFS;
      console.log(final_amt_master,'final_amt_master')

      // For fee_student
      const masteramtFS = await getOriginalAmountFeeMaster(
        fee_student.FS_SESSION_ID, 
        fee_student.FS_FEE_TYPE
      );

      let master_full_amt = masteramtFS.TOTAL_FEE_AMOUNT;
      let final_amt_master1 = 0;
      Special_type_amt = 0;

      if (fee_student.FS_SPECIAL_TYPE > 0) {
        const get_Special_type_amtFS = await fetchExemptionAmount(
          fee_student.FS_SESSION_ID, 
          fee_student.FS_SPECIAL_TYPE
        );

        get_Special_type_amtFS.forEach(value => {
          Special_type_amt += value.FM_FEE_AMOUNT;
        });
        master_full_amt += Special_type_amt;
      }

      totalFeeExempAmount = 0;
      if (fee_student.FS_EXEMPTION_TYPE != 0) {
        const checkExemptionFS = await getfeeamount(
          fee_student.FS_SESSION_ID, 
          fee_student.FS_EXEMPTION_TYPE
        );

        if (checkExemptionFS != null) {
          for (const row of checkExemptionFS) {
            const ExemptionAmountFS = await getfeeIdTutionfeeless(
              fee_student.FS_FEE_TYPE, 
              fee_student.FS_SESSION_ID, 
              row.FM_FEE_ID
            );

            if (ExemptionAmountFS != null && typeof ExemptionAmountFS === 'object') {
              totalFeeExempAmount += ExemptionAmountFS.FM_FEE_AMOUNT;
            }
          }
          master_full_amt -= totalFeeExempAmount;
        }
      }

      final_amt_masterFS = master_full_amt;

      const late_type = await getLateFeeType(
        session_id, 
        givenDate, 
        fee_code
      );

      let late, readm;
      if (late_type != null && late_type.FDA_FEE_TYPE != 0) {
        const gpa = await get_penalty_amt(
          session_id, 
          late_type.FDA_FEE_TYPE
        );
        console.log(gpa,'gpa')
        if (gpa != null) {
          if (late_type.FDA_FEE_TYPE == 41) {
            late = gpa[0].FM_FEE_AMOUNT;
            readm = 0;
          } else if (late_type.FDA_FEE_TYPE == 42) {
            late = gpa[0].FM_FEE_AMOUNT;
            readm = gpa[1].FM_FEE_AMOUNT;
          } else if (late_type.FDA_FEE_TYPE == 45) {
            late = gpa[0].FM_FEE_AMOUNT;
            readm = gpa[1].FM_FEE_AMOUNT + gpa[2].FM_FEE_AMOUNT;
          }
        } else {
          late = null;
          readm = null;
        }
      } else {
        late = 0;
        readm = 0;
      }

      const checkDate = await getFeeDateForPayment(
        session_id, 
        givenDate, 
        fee_code
      );
      const values = [
        fee_student.FS_FEE_AMOUNT,
        final_amt_masterFS,
        my_table_amt,
        final_amt_master
      ];

      const check_curr_sess = await getSession(get_pending_fee.AFSP_SESSION_ID);
      const FetchSerialNo = await getFeeSerialNumMasterWithFeeCodeSess(
        fee_code, 
        session_id
      );

      const uniqueValues = [...new Set(values)];
    
      if (checkDate > 0 && 
          uniqueValues.length === 1 && 
          parseInt(get_pending_fee.AFSP_ACTIVE_STATUS) === parseInt(check_curr_sess.FS_STATUS) && 
          late !== null && 
          readm !== null && 
          FetchSerialNo != null) {
        
        RzPayFeeCode = fee_code;
        RzPaySessioId = session_id;
        RzPaySumFees = my_table_amt;
        RzPayLate = late;
        RzPayReAdmin = readm;
      } else {
        data.errorStatus = checkDate > 0 ? 2 : 4;
        data.errorMsg = checkDate > 0 
          ? "Contact CeGov office (044-22357973/74)" 
          : "Fee payment is closed. To enable fee payment, a request letter forwarded by HOD and Dean is to be submitted at CeGov.";
      }
    } 
    else {
      data.errorStatus = 2;
      data.errorMsg = "Contact CeGov office (044-22357973/74)";
    }

    console.log(RzPaySessioId,RzPayFeeCode,'RzPaySessioId');

    // RazorPay Integration
    if (data.errorStatus === 0) {
      const RegisterNum = StudentRegNo;
      const StudentAppNo =   StudentRegNo || fee_student.FS_REG_NO ||0;
      // const FeeStudent = await getFeeStudentwithRegNo(RegisterNum);
      const RegisterNumPers = (StudentAppNo != 0) ? StudentAppNo : RegisterNum;

      await updateHitCountACStudPaymentDupId(
        RegisterNum, 
        RzPaySessioId, 
        RzPayFeeCode
      );

      // Transaction Number
      const FeeSerialNumMaster = await getFeeSerialNumMasterWithFeeCodeSess(
        RzPayFeeCode, 
        RzPaySessioId
      );

   

      let FeetranctionId;
      if (FeeSerialNumMaster) {
        const randTxnId = Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0');
        FeetranctionId = `${RzPayFeeCode}${RzPaySessioId}${FeeSerialNumMaster.FSM_SERIAL_NO}${randTxnId}`;
      }


      const BrowsersessionId = generateSessionId(); // Replace with your session ID generation logic
      const host_addr = os.hostname();
      const ip_address = "1"; // Simplified for mobile - might need actual device IP
      console.log(ip_address,'ip_address')

      const Feebank = await fetchFeeBankByBankID(17);

      const payAmount = RzPaySumFees + RzPayLate + RzPayReAdmin;
    
      
     let feebankdetails=false;
     if( FeetranctionId == null){
        data.errorStatus = 2;
        data.errorMsg = "Contact CeGov office (044-22357973/74)";
        res.json(data);
        return;
     }

     const receipt = FeetranctionId;
     console.log(receipt,'receipt')
     console.log(payAmount,'payAmount')

     // Call RazorPay API to create order
     const OrderResponse = await createOrder(receipt, payAmount);


      if (RegisterNum && FeetranctionId && payAmount) {
        feebankdetails = await insertFeeBankSent(
          RegisterNum, 
          Feebank.FB_BANK_ID, 
          FeetranctionId, 
          ip_address, 
          RzPaySumFees, 
          RzPaySessioId, 
          RzPayFeeCode, 
          RzPayLate, 
          RzPayReAdmin, 
          BrowsersessionId, 
          OrderResponse.id
        );
      }

      const razorpay_order_id_session = OrderResponse.id;
      console.log(RegisterNum,'RegisterNumrazorpay_order_id_session')

      const FeeStudentDetails = await getdatafromafeestud(RegisterNum);
      console.log(FeeStudentDetails,'FeeStudentDetails')
    
      const FeeStudentPersonal = await getStudentPersonalData(RegisterNum);
      console.log(FeeStudentPersonal,'FeeStudentPersonal')

      if (OrderResponse && OrderResponse.status === 'created' && feebankdetails) {
        const razorkey = process.env.RAZOR_KEY_ID;

        const orderAmount = OrderResponse.amount;
        const currency = OrderResponse.currency;
        
        const optionsData = {
          key: razorkey,
          amount: orderAmount,
          currency: currency,
          name: "Payment Gateway",
          description: "Semester Fees",
          image: "https://www.auegov.ac.in/AcademicConnect/public/assets/img/cegov.png",
          order_id: OrderResponse.id,
          prefill: {
            name: FeeStudentDetails.FS_NAME,
            email: FeeStudentPersonal.FSP_EMAIL,
            contact: FeeStudentPersonal.FSP_MBL_NO,
          },
          notes: {
            registerNumber: RegisterNum,
            name: FeeStudentDetails.FS_NAME,
            feeCode: RzPayFeeCode,
            session: RzPaySessioId,
            payable: payAmount,
            transactionId: FeetranctionId,
            bankCode: Feebank.FB_BANK_ID,
            paymentType: "1",
          },
          theme: {
            color: "rgba(94, 114, 228, 1)"
          }
        };

        data.optionsData = optionsData;
        data.OrderResponse = OrderResponse.status;
        data.errorStatus = 1;
        data.razorpay_order_id = OrderResponse.id;
      } else {
        data.errorStatus = 2;
        data.errorMsg = "Payment Failure";
      }
    }
    res.json(data);
  } catch (error) {
    console.error("Error in RazorPayNow:", error);
    return {
      errorStatus: 2,
      errorMsg: "An error occurred while processing your request"
    };
  }
};

// Helper function to generate session ID
function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}



//   try {
//     const {
//       razorpay_payment_id,
//       razorpay_order_id,
//       razorpay_signature
//     } = req.body;

//     // Get order ID from session
//     const razorpay_order_id_session = req.session.razorpay_order_id;
//     const transaction_id = req.session.transaction_id;

//     if (!razorpay_order_id_session || !transaction_id) {
//       return res.status(400).json({
//         errorStatus: 2,
//         errorMsg: "Session expired or invalid request"
//       });
//     }

//     // Verify the payment signature
//     const orderIdPaymentID = `${razorpay_order_id_session}|${razorpay_payment_id}`;
//     const GeneratedSignature = generateSignature(razorpay_order_id_session, razorpay_payment_id);

//     if (razorpay_signature !== GeneratedSignature) {
//       return res.status(400).json({
//         errorStatus: 2,
//         errorMsg: "Invalid payment signature"
//       });
//     }

//     // Compose encoded values
//     const BankReturnRazorpayEnc = `${razorpay_payment_id}|^|${razorpay_order_id}|^|${razorpay_signature}`;
//     const BankReturnRazorpayEncShort = `${razorpay_payment_id}|^|${razorpay_order_id}`;
//     // const orderIdPaymentID = `${razorpay_order_id_session}|${razorpay_payment_id}`;

//     // Generate signature and fetch payment details
//     const PaymentDetails = await getPayment(razorpay_payment_id);

//     const FeeBankReturn = await getFeeBankReturn(17, BankReturnRazorpayEncShort, transaction_id);

//     if (
//       razorpay_signature === GeneratedSignature &&
//       PaymentDetails.status === 'captured' &&
//       PaymentDetails.captured === true &&
//       !FeeBankReturn &&
//       PaymentDetails.notes.paymentType === '1'
//     ) {
//       await InsertFeeBankReturn(BankReturnRazorpayEncShort, transaction_id, 17);
//       const FeeBankSent = await getFeeBankSentWithTransId(transaction_id);
//       const timestamp = PaymentDetails.created_at;
//       const date = new Date(timestamp * 1000);
//       const RazorpayPaymentTime = format(date, 'dd-MMM-yy hh.mm.ss.SSSSSSSSS a').toUpperCase();

//       const CheckAcFeeStudentPaymentBalance = await getAcFeeStudentPaymentBalanceWith(
//         PaymentDetails.notes.registerNumber,
//         Number(PaymentDetails.notes.feeCode),
//         Number(PaymentDetails.notes.session),
//         2
//       );

//       const CheckAcFeeStudentPayment = await getAcFeeStudentPaymentWith(
//         PaymentDetails.notes.registerNumber,
//         Number(PaymentDetails.notes.feeCode),
//         Number(PaymentDetails.notes.session),
//         2
//       );

//       if (CheckAcFeeStudentPaymentBalance) {
//         const InsertBalanceSuccess = await InsertBalanceSuccessUpdatePaymentBalanceUpdateBankSendCloseTime(
//           PaymentDetails.notes.registerNumber,
//           FeeBankSent.FBS_FEE_AMOUNT,
//           Number(PaymentDetails.notes.bankCode),
//           transaction_id,
//           RazorpayPaymentTime,
//           Number(PaymentDetails.notes.feeCode),
//           Number(PaymentDetails.notes.session),
//           FeeBankSent.FBS_LATE_FEE,
//           FeeBankSent.FBS_READMISSION,
//           razorpay_payment_id,
//           0,
//           PaymentDetails.method,
//           0,
//           12,
//           2
//         );

//         if (Number(PaymentDetails.notes.feeCode) !== 14 && InsertBalanceSuccess) {
//           const Base64PdfBalance = await generate_fee_receipt_due_amt(
//             PaymentDetails.notes.registerNumber,
//             Number(PaymentDetails.notes.session),
//             Number(PaymentDetails.notes.feeCode)
//           );

//           const InsertFeeReceiptUpdateBlob = await InsertFeeReceiptUpdateBlobFn(
//             1,
//             PaymentDetails.notes.registerNumber,
//             CheckAcFeeStudentPaymentBalance.AFSPB_SEMESTER,
//             Base64PdfBalance,
//             transaction_id,
//             RazorpayPaymentTime
//           );
          
//           if (InsertFeeReceiptUpdateBlob) {
//             await UpdateAcFeeStudentPaymentBalanceUpdate(
//               PaymentDetails.notes.registerNumber,
//               Number(PaymentDetails.notes.feeCode),
//               Number(PaymentDetails.notes.session),
//               9,
//               12
//             );
//           }
          
//           if (Number(PaymentDetails.notes.feeCode) === 10) {
//             await updateCumulativewithBalanceAmt(
//               PaymentDetails.notes.registerNumber,
//               Number(PaymentDetails.notes.session),
//               Number(PaymentDetails.notes.feeCode),
//               FeeBankSent.FBS_FEE_AMOUNT
//             );
//           }
//         } else if (Number(PaymentDetails.notes.feeCode) === 14 && InsertBalanceSuccess) {
//           await UpdateFeeStudentUpdate(
//             PaymentDetails.notes.registerNumber,
//             Number(PaymentDetails.notes.feeCode),
//             Number(PaymentDetails.notes.session),
//             8,
//             2
//           );
//         }
//       } else if (CheckAcFeeStudentPayment) {
//         const InsertTransactionSuccess = await InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatus(
//           PaymentDetails.notes.registerNumber,
//           FeeBankSent.FBS_FEE_AMOUNT,
//           Number(PaymentDetails.notes.bankCode),
//           transaction_id,
//           RazorpayPaymentTime,
//           Number(PaymentDetails.notes.feeCode),
//           Number(PaymentDetails.notes.session),
//           FeeBankSent.FBS_LATE_FEE,
//           FeeBankSent.FBS_READMISSION,
//           razorpay_payment_id,
//           0,
//           PaymentDetails.method,
//           0,
//           12,
//           2
//         );

//         if (InsertTransactionSuccess) {
//           const FeeStudentPayment = await getAcFeeStudentPayment(
//             PaymentDetails.notes.registerNumber,
//             Number(PaymentDetails.notes.session),
//             Number(PaymentDetails.notes.feeCode),
//             "8,12"
//           );
          
//           const FeeStudent = await getFeeStudentwithRegisterNoSinglerow(
//             PaymentDetails.notes.registerNumber,
//             10
//           );
          
//           const OriginalAmountFeeMasterOG = await getOriginalAmountFeeMaster(
//             Number(PaymentDetails.notes.session),
//             FeeStudentPayment.AFSP_FEE_TYPE
//           );
          
//           const OriginalAmountFeeMasterSpl = await getOriginalAmountFeeMaster(
//             Number(PaymentDetails.notes.session),
//             FeeStudentPayment.AFSP_SPECIAL_TYPE
//           );
          
//           let OriginalAmountFeeMasterwithspl = FeeStudentPayment.AFSP_SPECIAL_TYPE > 0
//             ? OriginalAmountFeeMasterSpl.TOTAL_FEE_AMOUNT
//             : 0;
            
//           let OgAmount = OriginalAmountFeeMasterOG.TOTAL_FEE_AMOUNT + OriginalAmountFeeMasterwithspl;

//           let Claim = 0;
//           if (FeeStudentPayment.AFSP_EXEMPTION_TYPE > 0) {
//             const checkExemption = await getfeeamount(
//               Number(PaymentDetails.notes.session),
//               FeeStudentPayment.AFSP_EXEMPTION_TYPE
//             );

//             if (checkExemption) {
//               for (const row of checkExemption) {
//                 const ExemptionAmount = await getfeeIdTutionfeeless(
//                   FeeStudentPayment.AFSP_FEE_TYPE,
//                   Number(PaymentDetails.notes.session),
//                   row.FM_FEE_ID
//                 );
//                 if (ExemptionAmount) {
//                   Claim += ExemptionAmount.FM_FEE_AMOUNT;
//                 }
//               }
//             }
//           }
          
//           const Base64PdfPayment = await generateFeeReceipt(
//             PaymentDetails.notes.registerNumber,
//             Number(PaymentDetails.notes.session),
//             Number(PaymentDetails.notes.feeCode)
//           );
          
//           const InsertFeeReceiptUpdateBlob = await InsertFeeReceiptUpdateBlobFn(
//             1,
//             PaymentDetails.notes.registerNumber,
//             FeeStudentPayment.AFSP_SEMESTER,
//             Base64PdfPayment,
//             transaction_id,
//             RazorpayPaymentTime
//           );
          
//           if (InsertFeeReceiptUpdateBlob) {
//             await InsertFeeStudentCummulativeUpdate(
//               Number(PaymentDetails.notes.registerNumber),
//               Number(PaymentDetails.notes.feeCode),
//               Number(PaymentDetails.notes.session),
//               FeeStudentPayment.AFSP_FEE_TYPE,
//               FeeStudentPayment.AFSP_SPECIAL_TYPE,
//               FeeStudentPayment.AFSP_EXEMPTION_TYPE,
//               FeeBankSent.FBS_FEE_AMOUNT,
//               OgAmount,
//               FeeBankSent.FBS_LATE_FEE,
//               FeeBankSent.FBS_READMISSION,
//               FeeStudent.FS_GENDER,
//               1,
//               FeeStudent.FS_STUDENT_TYPE,
//               FeeStudent.FS_NAME,
//               FeeStudent.FS_DOB,
//               FeeStudent.FS_COMMUNITY,
//               FeeStudent.FS_BRANCH_CODE,
//               FeeStudentPayment.AFSP_SEMESTER,
//               Number(transaction_id),
//               FeeBankSent.FBS_FEE_AMOUNT,
//               0,
//               0,
//               Claim,
//               1,
//               Number(PaymentDetails.notes.bankCode),
//               FeeStudent.FS_CAMP_CODE,
//               9,
//               12,
//               FeeStudent.FS_DEPT_CODE
//             );
//           }
//         }
//       }
//     }

//     return res.json({ status: 1 });
//   } catch (error) {
//     console.error('Error in /razorpay-payment-success:', error);
//     return res.status(500).json({
//       errorStatus: 2,
//       errorMsg: "Internal Server Error",
//       details: error instanceof Error ? error.message : String(error)
//     });
//   }
// };

// Export the router and functions
// export { paynowrazor, razorpaypaymentsuccess };