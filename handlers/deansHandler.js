



// const { getDeans, getDeansImage } = require('../queries/deansQueries');

// module.exports = async function deansHandler(req, res) {
//   try {
//     const deans = await getDeans();

//     // Extract employee IDs
//     const employeeIds = deans.map(dean => dean.EM_EMPLOYEE_ID);

//     // Fetch images for those employee IDs
//     const deansImages = await getDeansImage(employeeIds);

//     //console.log(deansImages)
//     // Merge each dean with their image
//     const deansWithImages = deans.map(dean => {
//       const imageObj = deansImages.find(img => img.EM_EMPLOYEE_ID === dean.EM_EMPLOYEE_ID);
//       return {
//         ...dean,
//         image: imageObj ? imageObj.image : null
//       };
//     });

//     // Send the final response
//     res.json({ success: true, data: deansWithImages });
//   } catch (error) {
//     console.error('Error fetching deans:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

const { getDeans, getDeansImage,getDeansContactDetails } = require('../queries/deansQueries');

// module.exports = async function deansHandler(req, res) {
//   try {
//     const deans = await getDeans();
//     const employeeIds = deans.map(dean => dean.EM_EMPLOYEE_ID);
//     const campCodes = deans.map(dean => dean.APD_CAMP_CODE);
//     const deansImages = await getDeansImage(employeeIds);

//     const deansContactDetails = await getDeansContactDetails(campCodes);
//     //console.log(deansContactDetails)

//     const deansWithImages = deans.map(dean => {
//       const imageObj = deansImages.find(img => img.EM_EMPLOYEE_ID === dean.EM_EMPLOYEE_ID);
//       return {
//         ...dean,
//         image: imageObj ? imageObj.image : null  // base64 string
//       };
//     });

//     res.json({ success: true, data: deansWithImages });
//   } catch (error) {
//     console.error('Error fetching deans:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };


module.exports = async function deansHandler(req, res) {
    try {
      const deans = await getDeans();
      const employeeIds = deans.map(dean => dean.EM_EMPLOYEE_ID);
      const campCodes = deans.map(dean => dean.APD_CAMP_CODE);
  
      const deansImages = await getDeansImage(employeeIds);
      const deansContactDetails = await getDeansContactDetails(campCodes);
  
      const deansWithAllDetails = deans.map(dean => {
        const imageObj = deansImages.find(img => img.EM_EMPLOYEE_ID === dean.EM_EMPLOYEE_ID);
        const contactObj = deansContactDetails.find(contact => contact.ADD_CAMP_CODE === dean.APD_CAMP_CODE);
  
        return {
          ...dean,
          image: imageObj ? imageObj.image : null, // base64 string
          email: contactObj?.ADD_MAIL_ID || '',
          landline: contactObj?.ADD_LAND_LINE || '',
          intercom: contactObj?.ADD_INTERCOM || '',
          address: contactObj?.ADD_WEB_ADDRESS || ''
        };
      });
  
      res.json({ success: true, data: deansWithAllDetails });
    } catch (error) {
      console.error('Error fetching deans:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  

