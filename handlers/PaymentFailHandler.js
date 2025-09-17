import express from 'express';
import dotenv from 'dotenv';
import { format } from 'date-fns';
import os from 'os';
import dns from 'dns/promises';
import session from 'express-session';

import {

    getFeeBankReturn,
    InsertFeeBankReturn,
    InsertAcFeeBankFailPaymentFailStatus,getFeeSerialNumMasterWithFeeCodeSess
} from '../queries/RazorPaymentQuery.js';

import { default as Razorpay } from 'razorpay';
import { default as crypto } from 'crypto';
import axios from 'axios';
import cors from 'cors';
import {
    buildOptionsCheckout, paymentSuccessSignatureGenerate, getPaymentWithPaymentIdAPI,
    getOrderWithOrderIdAPI, webHookSignatureGenerate, getAllPayments
} from '../Utils/razorpayConfig.js';
import { generateFeeReceipt, generate_fee_receipt_due_amt } from '../Utils/FeeReceiptPdfGenerator.js';

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


export default async function PaymentFailHandler(req, res) {

    console.log(11213,'PaymentFailHandler')
    try {

        console.log(req.body,'req.bodyfail')
       
        const {
            code,
            description,
            source,
            step,
            reason,
            metadata: { order_id, payment_id }
        } = req.body.error;

        console.log(order_id,'order_id')
        console.log(payment_id,'payment_id')



        if (order_id && payment_id) {
            const PaymentDetails = await getPaymentWithPaymentIdAPI(payment_id);
            const BankReturnRazorpayEnc = `${PaymentDetails.id}|^|${PaymentDetails.order_id}`;
            const FeeBankReturn = await getFeeBankReturn(17, BankReturnRazorpayEnc, PaymentDetails.notes.transactionId);

            if (
                PaymentDetails.status === 'failed' &&
                PaymentDetails.captured === false &&
                !FeeBankReturn
            ) {
                await InsertFeeBankReturn(BankReturnRazorpayEnc, PaymentDetails.notes.transactionId, 17);
                await InsertAcFeeBankFailPaymentFailStatus(
                    Number(PaymentDetails.notes.bankCode),
                    PaymentDetails.notes.transactionId,
                    PaymentDetails.notes.registerNumber,
                    Number(PaymentDetails.notes.payable),
                    reason
                );
            }
        }

        res.json({ status: 1 });
    } catch (error) {
        res.status(500).json({
            errorStatus: 2,
            errorMsg: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

// Export the router and functions
// export { paynowrazor, razorpaypaymentsuccess };