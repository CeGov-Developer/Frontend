const { getChairpersons, getChairpersonsImage,getChairpersonsContactDetails } = require('../queries/chairpersonQueries');

module.exports = async function(req, res) {
    try {
      const chairpersons = await getChairpersons();
      const employeeIds = chairpersons.map(chair => chair.EM_EMPLOYEE_ID);
      const campCodes = chairpersons.map(chair => chair.APD_CAMP_CODE);

      const chairpersonsImages = await getChairpersonsImage(employeeIds);
      const chairpersonsContactDetails = await getChairpersonsContactDetails(campCodes);

      const chairpersonsWithAllDetails = chairpersons.map(chair => {
        const imageObj = chairpersonsImages.find(img => img.EM_EMPLOYEE_ID === chair.EM_EMPLOYEE_ID);
        const contactObj = chairpersonsContactDetails.find(contact => contact.ADD_CAMP_CODE === chair.APD_CAMP_CODE);
        return {
          ...chair,
          image: imageObj ? imageObj.image : null, // base64 string
          email: contactObj?.ADD_MAIL_ID || '',
          landline: contactObj?.ADD_LAND_LINE || '',
          intercom: contactObj?.ADD_INTERCOM || '',
          address: contactObj?.ADD_WEB_ADDRESS || ''
        };
      });

      res.json({ success: true, data: chairpersonsWithAllDetails });
    } catch (error) {
      console.error('Error fetching deans:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };


