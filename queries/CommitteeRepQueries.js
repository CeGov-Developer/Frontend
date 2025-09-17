const oracledb = require('oracledb');

async function getListAcRepresentationBodies(empId) {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING
        });

        const result = await connection.execute(
            `SELECT * 
             FROM AC_REPRESENTATION_BODIES 
             WHERE ARB_EMPID = :empId 
             ORDER BY ARB_FROM DESC`,
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

module.exports = { getListAcRepresentationBodies };