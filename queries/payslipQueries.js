const oracledb = require('oracledb');

// Helper functions
function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

function getIndianCurrencyInWords(amount) {
  const words = {
    0: 'Zero', 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five',
    6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten',
    11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen',
    15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen',
    19: 'Nineteen', 20: 'Twenty', 30: 'Thirty', 40: 'Forty',
    50: 'Fifty', 60: 'Sixty', 70: 'Seventy', 80: 'Eighty',
    90: 'Ninety', 100: 'Hundred', 1000: 'Thousand',
    100000: 'Lakh', 10000000: 'Crore'
  };

  if (amount === 0) return 'Zero Rupees Only';

  const handleTens = (num) => {
    if (num < 20) return words[num];
    const ones = num % 10;
    const tens = num - ones;
    return words[tens] + (ones ? ' ' + words[ones] : '');
  };

  const handleHundreds = (num) => {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    return hundreds ? words[hundreds] + ' ' + words[100] + (remainder ? ' ' + handleTens(remainder) : '') : handleTens(num);
  };

  const handleThousands = (num) => {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return thousands ? handleHundreds(thousands) + ' ' + words[1000] + (remainder ? ' ' + handleHundreds(remainder) : '') : handleHundreds(num);
  };

  const handleLakhs = (num) => {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    return lakhs ? handleHundreds(lakhs) + ' ' + words[100000] + (remainder ? ' ' + handleThousands(remainder) : '') : handleThousands(num);
  };

  const handleCrores = (num) => {
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    return crores ? handleHundreds(crores) + ' ' + words[10000000] + (remainder ? ' ' + handleLakhs(remainder) : '') : handleLakhs(num);
  };

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let result = handleCrores(integerPart);
  if (decimalPart > 0) {
    result += ' and ' + handleTens(decimalPart) + ' Paise';
  }
  return result + ' Only';
}



async function getYear(empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT 
  ACPE_MONTH,
  ACPE_YEAR
FROM 
  AC_PAYROLL_EARNING_FINAL apef
JOIN 
  AC_LEAVE_AVAILABLE la ON apef.ACPE_STAFFID = la.LA_EMPID
WHERE 
  apef.ACPE_STAFFID = :empId
ORDER BY 
  ACPE_YEAR DESC,
  ACPE_MONTH DESC

`, // Replace with your actual holidays table name
      [empId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
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


async function getRowformAdFinanceYear(fulldate) {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING
      });
  
      const result = await connection.execute(
        `SELECT DISTINCT FY_FIN_YEAR, FY_SEQ_NO
         FROM AD_FINANCE_YEAR
         WHERE TO_DATE(:fulldate, 'dd-mm-yy') BETWEEN FY_SALARY_START_DATE AND FY_SALARY_END_DATE
         ORDER BY FY_SEQ_NO DESC`,
        [fulldate],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
  
      return result.rows;
    } catch (err) {
      console.error("Error executing query:", err);
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

async function getRowformAdFinancefromto(selectyear) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT 
        TO_CHAR(FY_SALARY_START_DATE, 'DDMMYY') AS FY_SALARY_START_DATE,
        TO_CHAR(FY_SALARY_END_DATE, 'DDMMYY') AS FY_SALARY_END_DATE
      FROM 
        AD_FINANCE_YEAR
      WHERE 
        FY_FIN_YEAR = :selectyear
      ORDER BY 
        FY_FIN_YEAR ASC`,
      [selectyear],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows[0];
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getAcPayrollEarningDate(startDate, endDate) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    // Ensure dates are strings
    const formattedStartDate = String(startDate);
    const formattedEndDate = String(endDate);

    const result = await connection.execute(
      `SELECT DISTINCT 
        ACPE_MONTH,
        ACPE_YEAR
      FROM 
        AC_PAYROLL_EARNING_FINAL
      WHERE 
        ACPE_DOP BETWEEN TO_DATE(:startDate, 'DDMMYY') AND TO_DATE(:endDate, 'DDMMYY')
      ORDER BY 
        ACPE_MONTH,
        ACPE_YEAR DESC`,
      {
        startDate: { val: formattedStartDate, type: oracledb.STRING },
        endDate: { val: formattedEndDate, type: oracledb.STRING }
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function earningfetchmonthyearlist(month, year) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT DISTINCT 
        APF_MONTH,
        APF_YEAR
      FROM 
        AC_PAYROLL_FLAG
      WHERE 
        APF_MONTH = :month AND 
        APF_YEAR = :year AND
        APF_CREDIT_FLAG = 1
      ORDER BY 
        APF_MONTH,
        APF_YEAR ASC`,
      [month, year],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}


async function getAcPayMasterDeatils(payEmpId) {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING
      });
  
      const result = await connection.execute(
        `SELECT * FROM AC_PAYROLL_EMPLOYEE_MASTER WHERE ACP_STAFFID = :payEmpId`,
        [payEmpId],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
  
      return result.rows[0];
    } finally {
      if (connection) await connection.close();
    }
  }
  
  async function getAcPayBasicCategory(status) {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING
      });
  
      const result = await connection.execute(
        `SELECT * FROM AC_PAYROLL_BASIC_CATEGORY WHERE APBC_ACTIVE_STATUS = :status`,
        [status],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
  
      return result.rows;
    } finally {
      if (connection) await connection.close();
    }
  }
  
  async function getAcPayEarningCategory(status) {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING
      });
  
      const result = await connection.execute(
        `SELECT * FROM AC_PAYROLL_ADDITIONAL_EARNINGS_CATEGORY WHERE APAEC_ACTIVE_STATUS = :status`,
        [status],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
  
      return result.rows;
    } finally {
      if (connection) await connection.close();
    }
  }
  
  async function getAcPayrollEarningwithEmpMonYr(payEmpId, PayMonth, PayYear, earningcolname) {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING
      });
  
      const result = await connection.execute(
        `SELECT ${earningcolname} FROM AC_PAYROLL_EARNING_FINAL WHERE ACPE_STAFFID = :payEmpId AND ACPE_MONTH = :PayMonth AND ACPE_YEAR = :PayYear`,
        [payEmpId, PayMonth, PayYear],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
  
      return result.rows[0];
    } finally {
      if (connection) await connection.close();
    }
  }
  
  async function getAcPayrollEarningTotal(payEmpId, PayMonth, PayYear) {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING
      });
  
      const result = await connection.execute(
        `SELECT * FROM AC_PAYROLL_EARNING_FINAL WHERE ACPE_STAFFID = :payEmpId AND ACPE_MONTH = :PayMonth AND ACPE_YEAR = :PayYear`,
        [payEmpId, PayMonth, PayYear],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
  
      return result.rows[0];
    } finally {
      if (connection) await connection.close();
    }
  }
  
  async function getAcPayDeductionCategory(status) {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING
      });
  
      const result = await connection.execute(
        `SELECT * FROM AC_PAYROLL_ADDITIONAL_DEDUCTION_CATEGORY WHERE APADC_ACTIVE_STATUS = :status`,
        [status],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
  
      return result.rows;
    } finally {
      if (connection) await connection.close();
    }
  }
  
  async function getAcPayrollDeductionWithEmpMonYr(payEmpId, PayMonth, PayYear, deductioncolname) {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING
      });
  
      const result = await connection.execute(
        `SELECT ${deductioncolname} FROM AC_PAYROLL_DEDUCTION_FINAL WHERE ACPD_STAFFID = :payEmpId AND ACPD_MONTH = :PayMonth AND ACPD_YEAR = :PayYear`,
        [payEmpId, PayMonth, PayYear],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
  
      return result.rows[0];
    } finally {
      if (connection) await connection.close();
    }
  }
  
  async function getAcPayMasterDetails(empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT * FROM AC_PAYROLL_EMPLOYEE_MASTER WHERE ACP_STAFFID = :empId`,
      [empId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows[0];
  } finally {
    if (connection) await connection.close();
  }
}

async function getAcPayrollEarningWithEmpMonYr(payEmpId, PayMonth, PayYear, earningcolname) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT ${earningcolname} FROM AC_PAYROLL_EARNING_FINAL WHERE ACPE_STAFFID = :payEmpId AND ACPE_MONTH = :PayMonth AND ACPE_YEAR = :PayYear`,
      [payEmpId, PayMonth, PayYear],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows[0];
  } finally {
    if (connection) await connection.close();
  }
}

async function payInstallmentsDetails(colname, payEmpId, maxmonth, year) {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING
      });
  
      const result = await connection.execute(
        `SELECT ${colname} FROM AC_PAYROLL_INSTALLMENTS_FINAL WHERE ACPI_STAFFID = :payEmpId AND ACPI_MONTH = :maxmonth AND ACPI_YEAR = :year`,
        [payEmpId, maxmonth, year],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
  
      return result.rows[0];
    } finally {
      if (connection) await connection.close();
    }
  }

module.exports = { 
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
  formatMoney,
  getIndianCurrencyInWords
};

