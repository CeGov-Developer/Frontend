const {
    getYear,
    getRowformAdFinanceYear,
    getRowformAdFinancefromto,
    getAcPayrollEarningDate,
    earningfetchmonthyearlist,
    getAcPayMasterDetails,
    getAcPayBasicCategory,
    getAcPayEarningCategory,
    getAcPayrollEarningWithEmpMonYr,
    getAcPayrollEarningTotal,
    getAcPayDeductionCategory,
    getAcPayrollDeductionWithEmpMonYr,
    payInstallmentsDetails,
    getIndianCurrencyInWords,
    formatMoney,
    
  } = require('../queries/payslipQueries');
  const { getEmpIdByDevice } = require('../queries/BiometricQueries');

  async function payslipGetEmployeeID(req, res) {
  try {
    const deviceId = req.body.deviceId || req.body.deviceid;
    const notificationToken = req.body.notificationToken || req.body.notificationid;
    const empId = await getEmpIdByDevice(deviceId, notificationToken);
    console.log("empId:", empId);
    res.status(200).json({ empId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employee ID' });
  }
}

module.exports = async function payslipHandler(req, res) {

  try {
    if (req.path === '/api/payslipGetEmployeeID') {
 const deviceId = req.body.deviceId || req.body.deviceid;
    const notificationToken = req.body.notificationToken || req.body.notificationid;
    const empId = await getEmpIdByDevice(deviceId, notificationToken);
    console.log("empId:", empId);
    res.status(200).json({ empId });
    }
    else if (req.path === '/api/payslip_getYear') {

      const YearInfo = await getYear(req.body.empId);
      const Finyear = [];

      for (const val of YearInfo) {
        const date = '01';
        const month = String(val.ACPE_MONTH).padStart(2, '0');
        const year = val.ACPE_YEAR;
        const fulldate = `${date}-${month}-${year}`;

        const AdFinanceYear = await getRowformAdFinanceYear(fulldate);

        for (const fy of AdFinanceYear) {
          const [start, end] = fy.FY_FIN_YEAR.split('-');
          const formattedOption = `20${start}-20${end}`;

          if (!Finyear.some(f => f.option === formattedOption)) {
            Finyear.push({
              value: fy.FY_FIN_YEAR,
              option: formattedOption,
            });
          }
        }
      }

      res.json({ success: true, data: Finyear });
    } else // Inside your Express route
    if (req.path === '/api/payslip_fetchPayslipByMonth') {

      // const { empId, month, year } = req.body;
      // const { empId, month, year } = req.query;
      const empId = req.body.empId;
      const month = req.body.month;
      const year = req.body.year;
      console.log("empId:", empId, "month:", month, "year:", year);
    
      if (!empId || !month || !year) {
        return res.status(400).json({ success: false, message: 'Missing parameters' });
      }
    
      try {
        // Example call to fetch master details (like GPF/CPS type)
        const payMasterDetails = await getAcPayMasterDetails(empId, 'A');
    
        const type = payMasterDetails.ACP_GPF_CPS_TYPE === 'C'
          ? 'CPS Number'
          : 'GPF Number';
    
        const monthName = new Date(`2000-${month}-01`).toLocaleString('default', { month: 'long' });
        const fullMonthYear = `${monthName} - 20${year}`;
    
        const basicCategories = await getAcPayBasicCategory(1);
        const earningCategories = await getAcPayEarningCategory(1);
    
        const EarnCat = [];
        const EarnAmt = [];

        for (const cat of [...basicCategories, ...earningCategories]) {
          const colName = cat.APBC_COLUMN_NAME || cat.APAEC_COLUMN_NAME;
          const desc = cat.APBC_DESCRPITION || cat.APAEC_DESCRPITION;

          const earn = await getAcPayrollEarningWithEmpMonYr(empId, month, year, colName);
          if (earn && earn[colName] > 0) {
            EarnCat.push(desc);
            EarnAmt.push(formatMoney(earn[colName]));
          }
        }

        const gross = await getAcPayrollEarningTotal(empId, month, year);

        //console.log("gross", gross);
        if (gross) {
          EarnCat.push('Total Gross Pay');
          EarnAmt.push(`₹ ${formatMoney(gross.ACPE_GROSS_PAY)}`);
        }

        const DeductionCat = [];
        const DeductionAmt = [];
        const DeductionEmi = [];
    
        const deductionCats = await getAcPayDeductionCategory(1);
    
        for (const cat of deductionCats) {
          const colName = cat.APADC_COLUMN_NAME;
          const deduct = await getAcPayrollDeductionWithEmpMonYr(empId, month, year, colName);
    
          if (deduct && deduct[colName] > 0) {
            DeductionCat.push(cat.APADC_DESCRPITION);
            DeductionAmt.push(formatMoney(deduct[colName]));
    
            if (cat.APADC_INSTALLMENT_FLG === 1) {
              const insta = await payInstallmentsDetails(
                [cat.APADC_INSTA_PAID_COL_NAME, cat.APADC_INSTA_TOTAL_COL_NAME],
                empId, month, year
              );
    
              DeductionEmi.push(`(${insta[cat.APADC_INSTA_PAID_COL_NAME]}/${insta[cat.APADC_INSTA_TOTAL_COL_NAME]})`);
            } else {
              DeductionEmi.push('');
            }
          }
        }
    
        if (gross) {
          DeductionCat.push('Total Deduction');
          DeductionAmt.push(`${formatMoney(gross.ACPE_DEDUCTION)}`);
          DeductionEmi.push('');
    
          const net = `${formatMoney(gross.ACPE_NET_PAY)}`;
          const netWords = getIndianCurrencyInWords(gross.ACPE_NET_PAY);
    
          return res.json({
            success: true,
            data: {
              monthyear: fullMonthYear,
              type,
              EarnCat,
              EarnAmt,
              DeductionCat,
              DeductionAmt,
              DeductionEmi,
              Net: [net],
              netpay: [netWords],
            }
          });
        }
    
        return res.json({ success: false, message: 'No payroll found' });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }
    
    
    
    else if (req.path === '/api/payslip_fetchMonthsByYear') {

      const selectyear = req.body.year;
      if (!selectyear) {
        return res.status(400).json({ success: false, message: 'Missing selectyear parameter' });
      }

      // Get financial year date range
      const fromto = await getRowformAdFinancefromto(selectyear);
      if (!fromto) {
        return res.status(404).json({ success: false, message: 'Finance year not found' });
      }

      // Format dates for Oracle (remove hyphens and ensure proper format)
      const formattedStartDate = fromto.FY_SALARY_START_DATE.replace(/-/g, '');
      const formattedEndDate = fromto.FY_SALARY_END_DATE.replace(/-/g, '');
      
      // Get payroll earning dates in that range
      const earningdate = await getAcPayrollEarningDate(
        formattedStartDate,
        formattedEndDate
      );

      const MonthYear = [];

      // Create a set to store unique month-year combinations
      const uniqueMonths = new Set();

      for (const row of earningdate) {
        const earningmonthyear = await earningfetchmonthyearlist(row.ACPE_MONTH, row.ACPE_YEAR);

        for (const val of earningmonthyear) {
          // Create a unique key for this month-year combination
          const key = `${val.APF_MONTH}~${val.APF_YEAR}`;
          
          // Only add if we haven't seen this combination before
          if (!uniqueMonths.has(key)) {
            uniqueMonths.add(key);
            
            // Convert year to 4-digit format (e.g., '23' becomes '2023')
            const fullYear = parseInt(val.APF_YEAR) + 2000;
            
            // Create month-year string (e.g., "January 2023")
            const monthYearStr = new Date(fullYear, val.APF_MONTH - 1).toLocaleString('en-US', {
              month: 'long',
              year: 'numeric'
            });
            
            MonthYear.push({
              value: key,
              option: monthYearStr
            });
          }
        }
      }

      // Sort the months by year and month
      MonthYear.sort((a, b) => {
        const [aMonth, aYear] = a.value.split('~').map(Number);
        const [bMonth, bYear] = b.value.split('~').map(Number);
        
        // First compare years, then months
        if (aYear !== bYear) return aYear - bYear;
        return aMonth - bMonth;
      });

      try {
        res.json({ success: true, data: MonthYear });
      } catch (error) {
        console.error('Error sending response:', error);
        res.status(500).json({ success: false, message: 'Failed to send response' });
      }
    } else {
      try {
        res.status(404).json({ success: false, message: 'Endpoint not found' });
      } catch (error) {
        console.error('Error sending response:', error);
        res.status(500).json({ success: false, message: 'Failed to send response' });
      }
    }
  } catch (error) {
    console.error('Error in payslip handler:', error);
    try {
      res.status(500).json({ success: false, message: 'Internal server error' });
    } catch (error) {
      console.error('Error sending response:', error);
    }
  }
};