
const { getRoomDetails,getBuildingResourceReasonDetails,getNextSequenceNo,InsertData } = require('../queries/QrQueries');
const { getEmpIdByDevice } = require('../queries/BiometricQueries');

const bodyParser = require('body-parser');
const crypto = require('crypto');

async function SubmitQrHandler(req, res) {
  try {
    // Get the entire request body, not just data property
    const reportData = req.body;
    const empId = await getEmpIdByDevice(reportData.deviceId, reportData.notificationId);
console.log('Report Data:', reportData);
console.log('Report Datsssa:', empId);
    const decryptedData = decryptAESCTR(reportData.roomCode);
    const parsed = parseQrData(decryptedData);
   
    const seqNo=await getNextSequenceNo();
    const values = reportData.reasons.map(reasonId => [reasonId]);
  
    // Use Promise.all to wait for all insertions to complete
    const insertPromises = reportData.reasons.map(async (reasonId) => {
      return await InsertData(decryptedData, reasonId, seqNo, reportData.imageUrl, empId);
    });

    // Wait for all insertions to complete
    const insertResults = await Promise.all(insertPromises);

    res.json({
      success: true,
      type: "submitQr",
      message: "Report submitted successfully",
      seqno: seqNo
      // data: { insertData } // Uncomment when you have actual insertion
    });
  } catch (error) {
    console.error('❌ Error in SubmitQrHandler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
}

async function Qrhandler(req, res) {
    try {
        const { data } = req.body;
        const decryptedData = decryptAESCTR(data);
        const parsed = parseQrData(decryptedData);
        const roomDetails = await getRoomDetails(parsed.campus, parsed.buildingId, parsed.floor, parsed.resource, parsed.roomId);
        const reasonDetails = await getBuildingResourceReasonDetails(parsed.resource);


        res.json({
            success: true,
            data: { roomDetails, reasonDetails, decryptedData }
        });

    } catch (error) {
        console.error('Error fetching QR data:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


function decryptAESCTR(encryptedBase64) {
    const algorithm = "aes-128-ctr";

    // Match PHP padded key (16 bytes)
    const key = Buffer.alloc(16);
    key.write("20CeGov24#");

    // Same IV as PHP
    const iv = Buffer.from("1234567891011124", "utf8");

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedBase64, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

function parseQrData(qrString) {
    if (!qrString) return null;

    // Split on "^"
    const codeParts = qrString.split("^");

    // First part split on "~"
    const mainParts = codeParts[0].split("~");

    return {
        campus: mainParts[0] || null,     // AEBM_CAMPUS
        buildingId: mainParts[1] || null, // AEBM_ID
        floor: mainParts[2] || null,      // ABRD_FLOOR
        resource: mainParts[3] || null,   // ABRD_RESOURCE
        roomId: codeParts[1] || null,     // ABRD_ROOM_ID
    };
}

module.exports = { Qrhandler, SubmitQrHandler };
