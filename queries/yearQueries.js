const oracledb = require('oracledb');

async function getAcademicYearData(empId) {
  let connection;
  try {

  
    connection = await oracledb.getConnection({
      user: process.env.STUDENT_DB_USER,
      password: process.env.STUDENT_DB_PASSWORD,
      connectString: process.env.STUDENT_DB_CONNECT_STRING
    });

    
    // Fetch session1 (from AC_SUBJECT_LINK)
   
    const session1Result = await connection.execute(
      `SELECT  ASL_SESSION_ID, AS_ACADEMIC_YR, AS_SEMESTER
       FROM AC_SUBJECT_LINK sl
       JOIN AC_SESSION s ON s.AS_SESSION_ID = sl.ASL_SESSION_ID
       WHERE sl.ASL_STAFFID = :empId`,
      { empId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const session11 = session1Result.rows;

    const session1 = [];
const seen = new Set();

for (const row of session11) {
  const key = `${row.ASL_SESSION_ID}|${row.AS_ACADEMIC_YR}|${row.AS_SEMESTER}`;
  if (!seen.has(key)) {
    seen.add(key);
    session1.push(row);
  }
}

// Now use uniqueSession1 instead of session1

    // Fetch academicCourse (from AC_STUDENT_FEEDBACK_COURSES)
    const academicCourseResult = await connection.execute(
      `SELECT ASFC_ACYR, ASFC_SEMESTER
       FROM AC_STUDENT_FEEDBACK_COURSES
       WHERE ASFC_EMPID = :empId
         AND ASFC_FLAG = '2'`,
      { empId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const academicCourse = academicCourseResult.rows;

    let data = { acyr: [], semester: [], sessId: [], status: 0 };

    if (session1.length !== 0) {
      data.status = 1;
      for (const row of session1) {
        data.acyr.push(row.AS_ACADEMIC_YR);
        data.semester.push(row.AS_SEMESTER);
        data.sessId.push(row.ASL_SESSION_ID);

        // Fetch session2 for each session1 row
        let session2Query = `
          SELECT ASFC_ACYR, ASFC_SEMESTER
          FROM AC_STUDENT_FEEDBACK_COURSES
          WHERE ASFC_EMPID = :empId
            AND ASFC_FLAG = '2'
            AND ASFC_ACYR != :acyr
        `;
        if (row.AS_SEMESTER == '1') {
          session2Query += ' AND MOD(ASFC_SEMESTER, 2) != 1';
        } else if (row.AS_SEMESTER == '0') {
          session2Query += ' AND MOD(ASFC_SEMESTER, 2) != 0';
        }

        const session2Result = await connection.execute(
          session2Query,
          { empId, acyr: row.AS_ACADEMIC_YR },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const session2 = session2Result.rows[0];
        if (session2) {
          data.acyr.push(session2.ASFC_ACYR);
          data.sessId.push(null);
          data.semester.push(String(session2.ASFC_SEMESTER % 2));
        }
      }
    } else if (academicCourse.length > 0) {
      for (const row of academicCourse) {
        data.acyr.push(row.ASFC_ACYR);
        data.sessId.push(null);
        data.semester.push(String(row.ASFC_SEMESTER % 2));
      }
      data.status = 1;
    } else {
      data.status = 0;
    }

    return data;
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

async function getFeedbackData(acyr, sem, sessid, empId) {
  
  // In production, get empId from session/user context. For now, use a stub.
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.STUDENT_DB_USER,
      password: process.env.STUDENT_DB_PASSWORD,
      connectString: process.env.STUDENT_DB_CONNECT_STRING
    });


    // Check if feedback courses exist for this acyr/sem/empId
    const fbCoursesResult = await connection.execute(
      `SELECT * FROM AC_STUDENT_FEEDBACK_COURSES
       WHERE ASFC_EMPID = :empId AND ASFC_FLAG = '2' AND ASFC_ACYR = :acyr AND MOD(ASFC_SEMESTER,2) = :sem`,
      { empId, acyr, sem },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const fbCourses = fbCoursesResult.rows;
    console.log("fbCourses", fbCourses);
    let fbResult = [];

    if (fbCourses.length === 0) {
      // Fetch subject link course detail for insert (Node.js equivalent of fetchSubjectlinkCourseDetailForInsertFBCourses)
      const subjectLinkQuery = `
        SELECT sl.ASL_MARKID, s.AS_SESSION_ID, sl.ASL_CAMP_CODE, sl.ASL_COURSE_CODE, sl.ASL_DEPT_CODE, s.AS_ACADEMIC_YR, s.AS_SEMESTER, sl.ASL_STAFFID
        FROM AC_SESSION s
        INNER JOIN AC_SUBJECT_LINK sl ON sl.ASL_SESSION_ID = s.AS_SESSION_ID AND sl.ASL_STAFFID = :empId
        WHERE s.AS_ACTIVE = 1
          AND LENGTH(sl.ASL_COURSE_CODE) >= 4
        GROUP BY sl.ASL_MARKID, s.AS_SESSION_ID, sl.ASL_CAMP_CODE, sl.ASL_COURSE_CODE, sl.ASL_DEPT_CODE, s.AS_ACADEMIC_YR, s.AS_SEMESTER, sl.ASL_STAFFID
      `;
      const subjectLinkResult = await connection.execute(subjectLinkQuery, { empId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      const subjectLinkData = subjectLinkResult.rows;
      for (const row of subjectLinkData) {
        // Fetch enrolled student list for this course/session (Node.js equivalent of fetchEnrolledStudentList)
        const studListQuery = `
          SELECT fs.FS_BRANCH_CODE
          FROM AC_STUDENT_ENROLMENT ase
          JOIN FEE_STUDENT fs ON fs.FS_REG_NO = ase.ASE_REGNO AND fs.FS_FEE_CODE = 10
          WHERE ase.ASE_MARKID = :markid
            AND ase.ASE_COURSE_CODE = :ccode
            AND ase.ASE_STAFFID = :staffid
            AND ase.ASE_SESSIONID = :sessid
          GROUP BY fs.FS_BRANCH_CODE
        `;
        const studListResult = await connection.execute(studListQuery, {
          markid: row.ASL_MARKID,
          ccode: row.ASL_COURSE_CODE,
          staffid: row.ASL_STAFFID,
          sessid: sessid
        }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const stud_list = studListResult.rows;

        if (stud_list.length > 0) {
          // Find most common branch code
          const branchCounts = stud_list.reduce((acc, curr) => {
            acc[curr.FS_BRANCH_CODE] = (acc[curr.FS_BRANCH_CODE] || 0) + 1;
            return acc;
          }, {});
          const branchCode = Object.keys(branchCounts).reduce((a, b) => branchCounts[a] > branchCounts[b] ? a : b);
          // Fetch branch/degree details
          let degree = '', branch = '';
          const branchDetailsResult = await connection.execute(
            `SELECT FDG_SHORT_NAME, FB_SHORT_NAME
             FROM FEE_BRANCH
             JOIN FEE_DEGREE ON FEE_DEGREE.FDG_DEGREE_CODE = FEE_BRANCH.FB_DEGREE_CODE
             WHERE FB_BRANCH_CODE = :branchCode`,
            { branchCode },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          if (branchDetailsResult.rows.length > 0) {
            degree = branchDetailsResult.rows[0].FDG_SHORT_NAME || '';
            branch = (stud_list.length > 1)
              ? 'Common.'
              : (branchDetailsResult.rows[0].FB_SHORT_NAME == null)
                ? '<i class="fa fa-minus" aria-hidden="true" style="padding-left: 25px;"></i>'
                : branchDetailsResult.rows[0].FB_SHORT_NAME;
          }
          // Fetch course title
          let ctitle = '';
          const courseTitleResult = await connection.execute(
            `SELECT AC_COURSE_TITLE FROM AC_COURSE WHERE AC_COURSE_CODE = :ccode`,
            { ccode: row.ASL_COURSE_CODE },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          if (courseTitleResult.rows.length > 0) {
            ctitle = courseTitleResult.rows[0].AC_COURSE_TITLE || '';
          }
          fbResult.push({
            degree,
            branch,
            ccode: row.ASL_COURSE_CODE,
            ctitle,
            status: 'Ongoing',
            score: 0,
            colorVal: '#2d3ae7',
            bcode: branchCode,
            acyr: row.AS_ACADEMIC_YR,
            sem: row.AS_SEMESTER
          });
        }
      }
    } else if (fbCourses.length > 0) {
      // Fetch enrolled courses for FB result (mimics PHP fetchEnrolledCoursesForFBResult)
      const enrolledCoursesQuery = `
        SELECT acs.ASFC_BRANCH_CODE, acs.ASFC_COURSE_CODE, acs.ASFC_COURSE_NAME, fb.FB_SHORT_NAME, fd.FDG_SHORT_NAME, fb.FB_DEGREE_CODE, acs.ASFC_ACYR, acs.ASFC_SEMESTER, acs.ASFC_END_DATE, acs.ASFC_BATCH
        FROM AC_STUDENT_FEEDBACK_COURSES acs
        JOIN FEE_BRANCH fb ON fb.FB_BRANCH_CODE = acs.ASFC_BRANCH_CODE
        JOIN FEE_DEGREE fd ON fd.FDG_DEGREE_CODE = acs.ASFC_DEGREE_CODE
        WHERE acs.ASFC_EMPID = :empId
          AND acs.ASFC_FLAG = 2
          AND acs.ASFC_ACYR = :acyr
          AND acs.ASFC_SEM_CODE = :semester
        ORDER BY acs.ASFC_DATE DESC
      `;
      const enrolledCoursesResult = await connection.execute(enrolledCoursesQuery, { empId, acyr, semester: sem }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      const courseData = enrolledCoursesResult.rows;
      // Get current date string in PHP format
      const currDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
      for (const row of courseData) {
        const ccode = row.ASFC_COURSE_CODE;
        const bcode = row.ASFC_BRANCH_CODE;
        const semVal = row.ASFC_SEMESTER;
        const acyrVal = row.ASFC_ACYR;
        let status = 'Completed';
        let avg_scoreval = 0;
        let statusClr = 'green';
        // Compare current date and end date
        let endDate = row.ASFC_END_DATE ? new Date(row.ASFC_END_DATE) : null;
        let currDateObj = new Date();
        if (endDate && currDateObj <= endDate) {
          status = 'Ongoing';
          avg_scoreval = 0;
          statusClr = '#2d3ae7';
        } else {
          // Fetch average score for this course
          const scoreResult = await connection.execute(
            `SELECT ASFS_AVERAGE FROM AC_STUDENT_FEEDBACK_SCORE
             WHERE ASFS_EMPID = :empId AND ASFS_CCODE = :ccode AND ASFC_BCODE = :bcode
               AND ASFS_SEM = :sem AND ASFS_ACYR = :acyr`,
            {
              empId,
              ccode,
              bcode,
              sem: semVal,
              acyr: acyrVal
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          if (scoreResult.rows.length > 0) {
            avg_scoreval = scoreResult.rows[0].ASFS_AVERAGE;
          }
        }
        let branch = '';
        if (acyrVal === '2023-2024') {
          branch = (row.FB_SHORT_NAME == null)
            ? '<i class="fa fa-minus" aria-hidden="true" style="padding-left: 25px;"></i>'
            : row.FB_SHORT_NAME;
        } else {
          // Query for student branch details (unique FS_BRANCH_CODE count)
          const studBranchResult = await connection.execute(
            `SELECT DISTINCT fs.FS_BRANCH_CODE
             FROM AC_STUDENT_COURSE_DETAIL scd
             JOIN FEE_STUDENT fs ON fs.FS_REG_NO = scd.SCD_REG_NO
             WHERE scd.SCD_STAFF_ID = :empId
               AND scd.SCD_COURSE_CODE = :ccode
               AND scd.SCD_BRANCH_CODE = :bcode
               AND scd.SCD_SEMESTER = :sem
               AND scd.SCD_ACADEMIC_YEAR = :acyr`,
            {
              empId,
              ccode,
              bcode,
              sem: semVal,
              acyr: acyrVal
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          if (studBranchResult.rows.length > 1) {
            branch = 'Common.';
          } else {
            branch = (row.FB_SHORT_NAME == null)
              ? '<i class="fa fa-minus" aria-hidden="true" style="padding-left: 25px;"></i>'
              : row.FB_SHORT_NAME;
          }
        }
        fbResult.push({
          degree: row.FDG_SHORT_NAME,
          branch: branch,
          ccode: ccode,
          ctitle: row.ASFC_COURSE_NAME,
          status: status,
          score: Number(avg_scoreval).toFixed(2),
          colorVal: statusClr,
          bcode: bcode,
          acyr: acyrVal,
          sem: semVal,
          batch: row.ASFC_BATCH
        });
      }
    }
    return fbResult;

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

module.exports = { getAcademicYearData, getFeedbackData };