import express from 'express';
import dotenv from 'dotenv';
import { format } from 'date-fns';
import os from 'os';
import dns from 'dns/promises';
import session from 'express-session';

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
  updateAcFeeStudentPaymentScstUpdate, updateCumulativewithBankServiceCharge
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
  getFeeStudentwithRegisterNoSinglerow
} from '../queries/RazorPaymentQuery.js';

import { default as Razorpay } from 'razorpay';
import { default as crypto } from 'crypto';
import axios from 'axios';
import cors from 'cors';
import {
  buildOptionsCheckout, paymentSuccessSignatureGenerate, getPaymentWithPaymentIdAPI,
  getOrderWithOrderIdAPI, webHookSignatureGenerate, getAllPayments
} from '../Utils/razorpayConfig.js';
import { generateFeeReceipt, generate_fee_receipt_due_amt, generatefeereceiptduescsttuitionfee } from '../Utils/FeeReceiptPdfGenerator.js';

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
router.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 30 * 60 * 1000 // 30 minutes
  }
}));

// Configure CORS for mobile app
router.use(cors({
  origin: true,
  credentials: true
}));

// Middleware to parse JSON bodies
router.use(express.json());
router.use(express.urlencoded({ extended: true }));


export default async function PaymentsuccessHandler(req, res) {
  try {

    console.log(req.body.response, 'req.body')
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body.response;

    // Get order ID from session
    const razorpay_order_id_session = req.session.razorpay_order_id || razorpay_order_id;
    console.log(razorpay_signature, razorpay_order_id_session, razorpay_payment_id)
    // const transaction_id = req.session.transaction_id ;
    if (razorpay_payment_id && razorpay_order_id_session) {

      // Compose encoded values
      const BankReturnRazorpayEnc = `${razorpay_payment_id}|^|${razorpay_order_id}|^|${razorpay_signature}`;
      const BankReturnRazorpayEncShort = `${razorpay_payment_id}|^|${razorpay_order_id}`;
      const orderIdPaymentID = `${razorpay_order_id_session}|${razorpay_payment_id}`;

      // Generate signature and fetch payment details
      const GeneratedSignature = await paymentSuccessSignatureGenerate(orderIdPaymentID);

      const PaymentDetails = await getPaymentWithPaymentIdAPI(razorpay_payment_id);

      const FeeBankReturn = await getFeeBankReturn(17, BankReturnRazorpayEncShort, PaymentDetails.notes.transactionId);

      console.log(FeeBankReturn, 'FeeBankReturn')
      if (
        razorpay_signature === GeneratedSignature &&
        PaymentDetails.status === 'captured' &&
        PaymentDetails.captured === true &&
        !FeeBankReturn &&
        PaymentDetails.notes.paymentType === '1'
      ) {
        await InsertFeeBankReturn(BankReturnRazorpayEncShort, PaymentDetails.notes.transactionId, 17);
        const FeeBankSent = await getFeeBankSentWithTransId(PaymentDetails.notes.transactionId);
        const timestamp = PaymentDetails.created_at;
        const date = new Date(timestamp * 1000);
        const RazorpayPaymentTime = format(date, 'dd-MMM-yy hh.mm.ss.SSSSSSSSS a').toUpperCase();

        console.log(InsertFeeBankReturn, 'InsertFeeBankReturn')

        const CheckAcFeeStudentPaymentBalance = await getAcFeeStudentPaymentBalanceWith(
          PaymentDetails.notes.registerNumber,
          Number(PaymentDetails.notes.feeCode),
          Number(PaymentDetails.notes.session),
          2
        );

        const CheckAcFeeStudentPayment = await getAcFeeStudentPaymentWith(
          PaymentDetails.notes.registerNumber,
          Number(PaymentDetails.notes.feeCode),
          Number(PaymentDetails.notes.session),
          2
        );
        const CheckAcFeeStudentPaymentSCST = await getAcFeeStudentPaymentWithScst(
          PaymentDetails.notes.registerNumber,
          PaymentDetails.notes.feeCode,
          PaymentDetails.notes.session,
          2
        );

        if (CheckAcFeeStudentPaymentSCST) {
          console.log(CheckAcFeeStudentPaymentSCST, 'CheckAcFeeStudentPaymentSCST')

          console.log("CheckAcFeeStudentPaymentSCST")
          // Insert transaction success and update payment
          const InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatusSCST = await InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatusScst(
            PaymentDetails.notes.registerNumber,
            FeeBankSent.FBS_FEE_AMOUNT,
            PaymentDetails.notes.bankCode,
            PaymentDetails.notes.transactionId,
            RazorpayPaymentTime,
            PaymentDetails.notes.feeCode,
            PaymentDetails.notes.session,
            FeeBankSent.FBS_LATE_FEE,
            FeeBankSent.FBS_READMISSION,
            razorpay_payment_id,
            0,
            PaymentDetails.method,
            0,
            12,
            2
          );
          console.log(InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatusSCST)

          if (InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatusSCST) {
            // Get fee student payment SCST details
            const FeeStudentPaymentSCST = await getAcFeeStudentPaymentScst(
              PaymentDetails.notes.registerNumber,
              PaymentDetails.notes.session,
              PaymentDetails.notes.feeCode,
              "8,12"
            );
            console.log(FeeStudentPaymentSCST,'FeeStudentPaymentSCST')

            // Get fee student details
            const FeeStudent = await getFeeStudentwithRegisterNoSinglerow(
              PaymentDetails.notes.registerNumber,
              10
            );

            const Remarks = "DUE AMOUNT";

            // Generate fee receipt PDF
            const Base64PdfPayment = await generatefeereceiptduescsttuitionfee(
              PaymentDetails.notes.registerNumber,
              PaymentDetails.notes.session,
              PaymentDetails.notes.feeCode,
              PaymentDetails.notes.transactionId
            );
            console.log(Base64PdfPayment,'Base64PdfPaymentscst')

            // Insert fee receipt and update blob
            const InsertFeeReceiptUpdateBlob = await InsertFeeReceiptUpdateBlobFn(
              1,
              PaymentDetails.notes.registerNumber,
              FeeStudentPaymentSCST.AFSPS_SEMESTER,
              Base64PdfPayment,
              PaymentDetails.notes.transactionId,
              RazorpayPaymentTime
            );
            console.log(InsertFeeReceiptUpdateBlob,'InsertFeeReceiptUpdateBlobscst')

            if (InsertFeeReceiptUpdateBlob) {
              // Update SCST payment status
              await updateAcFeeStudentPaymentScstUpdate(
                PaymentDetails.notes.registerNumber,
                PaymentDetails.notes.feeCode,
                PaymentDetails.notes.session,
                PaymentDetails.notes.name,
                PaymentDetails.notes.payable,
                Remarks,
                9,
                12,
                FeeStudent,
                PaymentDetails.notes.bankCode,
                PaymentDetails.notes.transactionId,
                FeeBankSent.FBS_LATE_FEE,
                FeeBankSent.FBS_READMISSION
              );


            }
          }
        } else
          if (CheckAcFeeStudentPaymentBalance) {
            const FeeStudent = await getFeeStudentwithRegisterNoSinglerow(
              PaymentDetails.notes.registerNumber,
              10
            );
            const InsertBalanceSuccess = await InsertBalanceSuccessUpdatePaymentBalanceUpdateBankSendCloseTime(
              PaymentDetails.notes.registerNumber,
              FeeBankSent.FBS_FEE_AMOUNT,
              Number(PaymentDetails.notes.bankCode),
              PaymentDetails.notes.transactionId,
              RazorpayPaymentTime,
              Number(PaymentDetails.notes.feeCode),
              Number(PaymentDetails.notes.session),
              FeeBankSent.FBS_LATE_FEE,
              FeeBankSent.FBS_READMISSION,
              razorpay_payment_id,
              0,
              PaymentDetails.method,
              0,
              12,
              2
            );
            console.log(InsertBalanceSuccess,'InsertBalanceSuccess');
            console.log(Number(PaymentDetails.notes.feeCode) !== 14 && InsertBalanceSuccess,'Number(PaymentDetails.notes.feeCode) !== 14 && InsertBalanceSuccess');

            if (Number(PaymentDetails.notes.feeCode) !== 14 && InsertBalanceSuccess) {

              console.log(PaymentDetails.notes.registerNumber,
                Number(PaymentDetails.notes.session),
                Number(PaymentDetails.notes.feeCode));
              const Base64PdfBalance = await generate_fee_receipt_due_amt(
                PaymentDetails.notes.registerNumber,
                Number(PaymentDetails.notes.session),
                Number(PaymentDetails.notes.feeCode)
              );
              // const Base64PdfBalance = Base64PdfBalanceBuffer.toString('base64');

              const InsertFeeReceiptUpdateBlob = await InsertFeeReceiptUpdateBlobFn(
                1,
                PaymentDetails.notes.registerNumber,
                CheckAcFeeStudentPaymentBalance.AFSPB_SEMESTER,
                Base64PdfBalance,
                PaymentDetails.notes.transactionId,
                RazorpayPaymentTime
              );
              console.log(InsertFeeReceiptUpdateBlob,'InsertFeeReceiptUpdateBlobblan')
              if (InsertFeeReceiptUpdateBlob) {
                await UpdateAcFeeStudentPaymentBalanceUpdate(
                  PaymentDetails.notes.registerNumber,
                  Number(PaymentDetails.notes.feeCode),
                  Number(PaymentDetails.notes.session),
                  9,
                  12
                );
              }
              if (Number(PaymentDetails.notes.feeCode) === 10) {

                await updateCumulativewithBalanceAmt(
                  FeeStudent,
                  Number(PaymentDetails.notes.session),
                  Number(PaymentDetails.notes.feeCode),
                  FeeBankSent.FBS_FEE_AMOUNT,
                  FeeBankSent.FBS_LATE_FEE,
                  FeeBankSent.FBS_READMISSION,
                  CheckAcFeeStudentPaymentBalance.AFSPB_FEE_TYPE,
                  CheckAcFeeStudentPaymentBalance.AFSPB_SPECIAL_TYPE,
                  CheckAcFeeStudentPaymentBalance.AFSPB_EMEPTION_TYPE,
                  PaymentDetails.notes.transactionId,
                  Number(PaymentDetails.notes.bankCode)
                );

                // $this->studentFeeModel->updateCumulativewithBalanceAmt($FeeStudent,
                //   $feecode, $session_id,
                //    $FeeBankSent->FBS_FEE_AMOUNT, 
                //     $FeeBankSent->FBS_LATE_FEE, 
                //     $FeeBankSent->FBS_READMISSION, 
                //     $feetype, $special_type,
                //       $exemption_type, $PaymentDetails['notes']['transactionId'],
                //        $PaymentDetails['notes']['bankCode']);
              }
            } else if (Number(PaymentDetails.notes.feeCode) === 14 && InsertBalanceSuccess) {
              await UpdateFeeStudentUpdate(
                PaymentDetails.notes.registerNumber,
                Number(PaymentDetails.notes.feeCode),
                Number(PaymentDetails.notes.session),
                8,
                2
              );
              await updateCumulativewithBankServiceCharge(FeeStudent, Number(PaymentDetails.notes.feeCode), Number(PaymentDetails.notes.session),
                FeeBankSent.FBS_FEE_AMOUNT, FeeBankSent.FBS_LATE_FEE, FeeBankSent.FBS_READMISSION,
                feetype, special_type, PaymentDetails.notes.transactionId,
                exemption_type, PaymentDetails.notes.bankCode);

            }
          } else if (CheckAcFeeStudentPayment) {
            const InsertTransactionSuccess = await InsertTransactionSuccessUpdatePaymentUpdateBankSendCloseTimeUpdateStudentStatus(
              PaymentDetails.notes.registerNumber,
              FeeBankSent.FBS_FEE_AMOUNT,
              Number(PaymentDetails.notes.bankCode),
              PaymentDetails.notes.transactionId,
              RazorpayPaymentTime,
              Number(PaymentDetails.notes.feeCode),
              Number(PaymentDetails.notes.session),
              FeeBankSent.FBS_LATE_FEE,
              FeeBankSent.FBS_READMISSION,
              razorpay_payment_id,
              0,
              PaymentDetails.method,
              0,
              12,
              2
            );

            const FeeStudent = await getFeeStudentwithRegisterNoSinglerow(
              PaymentDetails.notes.registerNumber,
              10
            );

            if (InsertTransactionSuccess) {
              const FeeStudentPayment = await getAcFeeStudentPayment(
                PaymentDetails.notes.registerNumber,
                Number(PaymentDetails.notes.session),
                Number(PaymentDetails.notes.feeCode),
                "8,12"
              );
              const FeeStudent = await getFeeStudentwithRegisterNoSinglerow(
                PaymentDetails.notes.registerNumber,
                10
              );
              const OriginalAmountFeeMasterOG = await getOriginalAmountFeeMaster(
                Number(PaymentDetails.notes.session),
                FeeStudentPayment.AFSP_FEE_TYPE
              );
              const OriginalAmountFeeMasterSpl = await getOriginalAmountFeeMaster(
                Number(PaymentDetails.notes.session),
                FeeStudentPayment.AFSP_SPECIAL_TYPE
              );
              let OriginalAmountFeeMasterwithspl = FeeStudentPayment.AFSP_SPECIAL_TYPE > 0
                ? OriginalAmountFeeMasterSpl.TOTAL_FEE_AMOUNT
                : 0;
              let OgAmount = OriginalAmountFeeMasterOG.TOTAL_FEE_AMOUNT + OriginalAmountFeeMasterwithspl;

              let Claim = 0;
              if (FeeStudentPayment.AFSP_EXEMPTION_TYPE > 0) {
                const checkExemption = await getfeeamount(
                  Number(PaymentDetails.notes.session),
                  FeeStudentPayment.AFSP_EXEMPTION_TYPE
                );

                if (checkExemption) {
                  for (const row of checkExemption) {
                    const ExemptionAmount = await getfeeIdTutionfeeless(
                      FeeStudentPayment.AFSP_FEE_TYPE,
                      Number(PaymentDetails.notes.session),
                      row.FM_FEE_ID
                    );
                    if (ExemptionAmount) {
                      Claim += ExemptionAmount.FM_FEE_AMOUNT;
                    }
                  }
                }
              }
              const Base64PdfPayment = await generateFeeReceipt(
                PaymentDetails.notes.registerNumber,
                Number(PaymentDetails.notes.session),
                Number(PaymentDetails.notes.feeCode)
              );
              const InsertFeeReceiptUpdateBlob = await InsertFeeReceiptUpdateBlobFn(
                1,
                PaymentDetails.notes.registerNumber,
                FeeStudentPayment.AFSP_SEMESTER,
                Base64PdfPayment,
                PaymentDetails.notes.transactionId,
                RazorpayPaymentTime
              );
              let due_paid = 0;
              let deficit = 0;
              if ([91, 92].includes(FeeStudent.FS_BASE_EXEMPTION)) {
                if (FeeStudentPayment.AFSP_EXEMPTION_TYPE === 0) {
                  due_paid = Claim;
                } else {
                  deficit = Claim;
                }
              }
              console.log(InsertFeeReceiptUpdateBlob, 'InsertFeeReceiptUpdateBlob')
              if (InsertFeeReceiptUpdateBlob) {
                await InsertFeeStudentCummulativeUpdate(
                  Number(PaymentDetails.notes.registerNumber),
                  Number(PaymentDetails.notes.feeCode),
                  Number(PaymentDetails.notes.session),
                  FeeStudentPayment.AFSP_FEE_TYPE,
                  FeeStudentPayment.AFSP_SPECIAL_TYPE,
                  FeeStudentPayment.AFSP_EXEMPTION_TYPE,
                  FeeBankSent.FBS_FEE_AMOUNT,
                  OgAmount,
                  FeeBankSent.FBS_LATE_FEE,
                  FeeBankSent.FBS_READMISSION,
                  FeeStudent.FS_GENDER,
                  1,
                  FeeStudent.FS_STUDENT_TYPE,
                  FeeStudent.FS_NAME,
                  FeeStudent.FS_DOB,
                  FeeStudent.FS_COMMUNITY,
                  FeeStudent.FS_BRANCH_CODE,
                  FeeStudentPayment.AFSP_SEMESTER,
                  Number(PaymentDetails.notes.transactionId),
                  FeeBankSent.FBS_FEE_AMOUNT,
                  0,
                  deficit,
                  Claim,
                  1,
                  Number(PaymentDetails.notes.bankCode),
                  FeeStudent.FS_CAMP_CODE,
                  9,
                  12,
                  FeeStudent.FS_DEPT_CODE,
                  due_paid
                );
              }



            }
          }
      }
      return res.json({ status: 'success' });

    }

  } catch (error) {
    console.error('Error in /razorpay-payment-success:', error);
    return res.status(500).json({
      errorStatus: 2,
      errorMsg: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Export the router and functions
// export { paynowrazor, razorpaypaymentsuccess };