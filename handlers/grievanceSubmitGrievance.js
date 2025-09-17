// Using CommonJS (recommended for Node.js backend)
const { getEmpIdByDevice } = require('../queries/BiometricQueries');
const { submitGrievance, getLatestTicket,getSubmittedGrievance } = require('../queries/grievanceQueries');


async function grievanceSubmitGrievance(req, res) {
    try {
       

        const empId = await getEmpIdByDevice(req.body.deviceId, req.body.notificationId);
        
        // Get latest ticket ID
        const ticketInfo = await getLatestTicket();
        console.log("aaaaa:", ticketInfo.id!="");
    
        let newTicketNumber;
        if (ticketInfo.id!="") {
          // Extract numeric part and increment
          const latestNum = parseInt(ticketInfo.id.replace('TKT', ''));
          const nextNum = latestNum + 1;
          newTicketNumber = 'TKT' + String(nextNum).padStart(4, '0');
        } else {
          // No previous ticket
          newTicketNumber = 'TKT1001';
        }

    
        const ticketId = newTicketNumber;
        
        
        if (newTicketNumber) {
            // Submit the grievance
            await submitGrievance(empId, req.body.department, req.body.message, ticketId,req.body.type);
            
            res.json({
                success: true,
                empId,
                ticketId,
                department: req.body.department,
                message: req.body.message,
                type: req.body.type

            });
        } else {
            throw new Error('Failed to generate ticket ID');
        }
    } catch (error) {
        console.error('Error submitting grievance:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to submit grievance',
            details: error.message
        });
    }
}


async function GetSubmittedGrievance(req, res) {
    try {
        

        const empId = await getEmpIdByDevice(req.body.deviceId, req.body.notificationId);
        
        // Get latest ticket ID
       
            // Submit the grievance
            const grievance = await getSubmittedGrievance(empId);
            
            res.json({
                success: true,
                empId,
                grievance
            });
     
    } catch (error) {
        console.error('Error submitting grievance:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to submit grievance',
            details: error.message
        });
    }
}
module.exports = { grievanceSubmitGrievance, GetSubmittedGrievance };