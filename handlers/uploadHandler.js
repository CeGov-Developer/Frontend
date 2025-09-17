const path = require("path");
const multer = require("multer");
const sharp = require("sharp");

// Storage config
const storage = multer.memoryStorage(); // Store file in memory for processing

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for original upload
  }
});

// Middleware + handler
async function uploadHandler(req, res) {
  console.log("Upload request received");
  
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    console.log("📁 Original file:", {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });

    let processedBuffer = file.buffer;
    // ✅ Always use the frontend-sent name
    let finalFilename = file.originalname;

    // Check if file is an image and larger than 1MB
    if (file.mimetype.startsWith('image/') && file.size > 1024 * 1024) {
      console.log("🖼️ Compressing image larger than 1MB...");
      
      try {
        // Compress and resize the image
        processedBuffer = await sharp(file.buffer)
          .resize({
            width: 1200, // Maximum width
            height: 1200, // Maximum height
            fit: 'inside', // Maintain aspect ratio
            withoutEnlargement: true // Don't enlarge smaller images
          })
          .jpeg({ 
            quality: 80, // Adjust quality (0-100)
            progressive: true // Progressive JPEG
          })
          .toBuffer();

        console.log("✅ Image compressed:", {
          originalSize: file.size,
          compressedSize: processedBuffer.length,
          reduction: `${Math.round((1 - processedBuffer.length / file.size) * 100)}%`
        });

      } catch (sharpError) {
        console.error("❌ Image processing error:", sharpError);
        processedBuffer = file.buffer; // fallback
      }
    }

    // Save the processed file
    const fs = require('fs').promises;
    const uploadDir = "uploads/";
    
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, finalFilename);
    await fs.writeFile(filePath, processedBuffer);

    console.log("✅ File saved:", {
      filename: finalFilename,
      size: processedBuffer.length,
      path: filePath
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${finalFilename}`;

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      filename: finalFilename,   // 👈 matches frontend
      originalName: file.originalname,
      size: processedBuffer.length,
      url: fileUrl,
      compressed: file.size !== processedBuffer.length
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error: " + error.message 
    });
  }
}

module.exports = { upload, uploadHandler };
