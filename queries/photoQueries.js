const oracledb = require('oracledb');

async function getStaffPhoto(empId) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.PHOTO_USER,
      password: process.env.PHOTO_PASSWORD,
      connectString: process.env.PHOTO_CONNECT_STRING,
    });

    let result = await connection.execute(
      `SELECT ASP_PHOTO FROM AC_STAFF_PHOTO WHERE ASP_EMPID = :empId`,
      { empId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let lob = result.rows[0]?.ASP_PHOTO;

    // If no photo, fetch fallback photo (e.g., ID = 1)
    if (!lob) {
      const fallback = await connection.execute(
        `SELECT ASP_PHOTO FROM AC_STAFF_PHOTO WHERE ASP_EMPID = 1`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      lob = fallback.rows[0]?.ASP_PHOTO;
    }

    if (!lob) {
      throw new Error('No photo found.');
    }

    const buffer = await lobToBuffer(lob); // Convert LOB to Buffer
    return {
      image: buffer.toString('base64'),
    };

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

// Helper function to convert LOB stream to buffer
function lobToBuffer(lob) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    lob.on('data', chunk => chunks.push(chunk));
    lob.on('end', () => resolve(Buffer.concat(chunks)));
    lob.on('error', reject);
  });
}

module.exports = { getStaffPhoto };
