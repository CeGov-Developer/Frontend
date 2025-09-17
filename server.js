const express = require('express');
const cors = require('cors');
const app = express();
const multer = require("multer");
const path = require("path");
// const { initialloader } = await import('./handlers/feeHandler.js');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const authMiddleware = require('./auth.js');

console.log('Auth middleware loaded:');

const { logoutDevice } = require('./queries/deviceQueries');
require('dotenv').config();
const conferenceHandler = require('./handlers/conferenceHandler');
const loginHandler = require('./handlers/loginHandler');
const notificationHandler = require('./handlers/notificationHandler');
const invBioHandler = require('./handlers/invBioHandler');
const holidayHandler = require('./handlers/holidayHandler');
// const Qrhandler=require('./handlers/Qrhandler');
const { Qrhandler, SubmitQrHandler } = require('./handlers/QrHandler');


const {upload,uploadHandler}= require('./handlers/uploadHandler');
const deviceHandler = require('./handlers/deviceHandler');
const deansHandler = require('./handlers/deansHandler');
const payslipHandler = require('./handlers/payslipHandler');
const extensionOutreachHandler = require('./handlers/extensionOutreachHandler'); 
const workshopSeminarHandler = require('./handlers/workshopSeminarHandler');
const foreignVisitHandler = require('./handlers/foreignVisitHandler');
const invitedLecturesHandler = require('./handlers/invitedLecturesHandler');
const awardsHandler = require('./handlers/awardsHandler');
const {
  getDepartmentalActivitiesHandler,
  getInstitutionalActivitiesHandler,
  getSocietyActivitiesHandler
} = require('./handlers/activityHandler');
const committeeRepHandler = require('./handlers/committeeRepHandler');
const coursesHandler = require('./handlers/coursesHandler');
const { handleGetFeedback } = require('./handlers/yearHandler');
const { handleGetYears } = require('./handlers/yearHandler');
// const { initialloader } = require('./handlers/feeHandler');
const leaveHandler = require('./handlers/leaveHandler');
const { 
    getCampusListHandler, 
    getDepartmentListHandler,
    getDepartmentBranchesHandler 
} = require('./handlers/departmentHandler.js');


app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(session({
  secret: process.env.SESSION_SECRET || 'rAZORPAY',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Test route
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from Node.js backend!' });
});

// Notification route

console.log('Notification route is being set up');
app.get('/api/notification/Getnotification', authMiddleware, notificationHandler);

app.get('/api/holidays', authMiddleware, holidayHandler);
// Login route
app.post('/api/login', authMiddleware, loginHandler);
app.post('/api/invBio', authMiddleware, invBioHandler);
app.post('/api/deviceRegister', authMiddleware, deviceHandler); // Uncommenting the staff photo route
app.post('/api/deviceCheck', authMiddleware, deviceHandler);
//Deans
app.get('/api/deans', authMiddleware, deansHandler);
app.post('/api/qr', authMiddleware, Qrhandler);
app.post('/api/submitQr', authMiddleware, SubmitQrHandler);

// ✅ Serve static uploads
app.use("/uploads", express.static("uploads"));

// ✅ Upload route
app.post("/api/upload", upload.single("file"), uploadHandler);
// app.post('/api/upload', authMiddleware, uploadHandler);



app.post('/api/extensionOutreach', authMiddleware, extensionOutreachHandler);
app.post('/api/foreignVisits', authMiddleware, foreignVisitHandler);
app.post('/api/invitedLectures', authMiddleware, invitedLecturesHandler);
app.post('/api/awards', authMiddleware, awardsHandler);
app.post('/api/conference/:type', authMiddleware, conferenceHandler);
app.post('/api/workshopSeminar/:type', authMiddleware, workshopSeminarHandler);

// Department routes
app.get('/api/department/getCampusList', authMiddleware, (req, res) => {
  console.log('Received request for getCampusList with category:', req.query.category);
  getCampusListHandler(req, res);
});



app.get('/api/department/getDepartmentList', authMiddleware, (req, res) => {
  console.log('Received request for getDepartmentList with category:', req.query.category);
  console.log('Received request for getDepartmentList with campusCode:', req.query.campusCode);
  getDepartmentListHandler(req, res);
});

// Department Branches Endpoint
app.get('/api/department/getDepartmentBranches', authMiddleware, (req, res) => {
  getDepartmentBranchesHandler(req, res);
});





app.post('/api/payslip_getYear', authMiddleware, payslipHandler);
app.post('/api/payslip_fetchMonthsByYear', authMiddleware, payslipHandler);
app.post('/api/payslip_fetchPayslipByMonth', authMiddleware, payslipHandler);
app.post('/api/payslipGetEmployeeID', authMiddleware, payslipHandler);
// Activities
app.get('/api/activities/departmental', authMiddleware, getDepartmentalActivitiesHandler);
app.get('/api/activities/institutional', authMiddleware, getInstitutionalActivitiesHandler);
app.get('/api/activities/society', authMiddleware, getSocietyActivitiesHandler);
app.post('/api/leave', authMiddleware, leaveHandler);
//Courses

app.post('/api/courses', authMiddleware, coursesHandler);

//Committee Rep
app.post('/api/committeeRep', authMiddleware, committeeRepHandler);

app.post('/api/logout', authMiddleware, async (req, res) => {
  const { empid, deviceid, notificationToken } = req.body;
  console.log('Received logout request for deviceId:', deviceid);
  console.log('Received logout request for notificationToken:', notificationToken);
  if (!deviceid || !notificationToken) {
    return res.status(400).json({ success: false, message: 'deviceId and notificationToken are required' });
  }

  try {
    await logoutDevice(deviceid, notificationToken);
    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/feedback', authMiddleware, (req, res) => {

  console.log('Received feedback query:', { reqBody: req.body});


  if (req.body['acyr'] && req.body['sem'] && req.body['sessid']) {
    handleGetFeedback(req, res);
  
  } else {
    console.log('Missing feedback query parameters');
    handleGetYears(req, res);
  }
});

app.post('/api/feedback', authMiddleware, handleGetFeedback);
const cpHandler = require('./handlers/chairpersonHandler');
app.get('/api/chairpersons', authMiddleware, cpHandler);


// Student Fee Endpoint
// Year Handler

const { initialloader } = require('./handlers/feeHandler');
app.post('/api/studentFee/initialloader', authMiddleware, initialloader);


const { grievanceSubmitGrievance } = require('./handlers/grievanceSubmitGrievance');
app.post('/api/grievance/submitGrievance', authMiddleware, grievanceSubmitGrievance);

const { GetSubmittedGrievance } = require('./handlers/grievanceSubmitGrievance');
app.post('/api/grievance/getSubmittedGrievance', authMiddleware, GetSubmittedGrievance);
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


//start of Payment Handler

// const{paynowrazor}=require('./handlers/PaymentHandler');
const PaymentHandler = require('./handlers/PaymentHandler').default;
app.post('/api/razorpay/paynowrazor', PaymentHandler);

const PaymentsuccessHandler = require('./handlers/PaymentsuccessHandler').default;
app.post('/api/razorpay/razorpaypaymentsuccess', PaymentsuccessHandler);

const PaymentFailHandler = require('./handlers/PaymentFailHandler').default;
app.post('/api/razorpay/paymentfailure', PaymentFailHandler);


const { handleScSctPaycurrent } = require('./handlers/PaymentViewHandler');
app.post('/api/razorpay/handleScSctPaycurrent', handleScSctPaycurrent);

const { getStudentFeeDetails1 } = require('./handlers/PaymentViewHandler');
app.post('/api/razorpay/getStudentFeeDetails1', getStudentFeeDetails1);


const { HandleConfirmFees } = require('./handlers/PaymentViewHandler');
app.post('/api/razorpay/handleConfirmFees', HandleConfirmFees);

const { handleScScthandlePayLaterFunc } = require('./handlers/PaymentViewHandler');
app.post('/api/razorpay/handleScScthandlePayLaterFunc', handleScScthandlePayLaterFunc);
//end of Payment Handler


const taskHandler = require('./handlers/taskHandler');
app.post('/api/tasks', authMiddleware, taskHandler);





