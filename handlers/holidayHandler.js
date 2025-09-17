const { getHolidays } = require('../queries/holidayQueries');

module.exports = async function holidayHandler(req, res) {
  try {
    //console.log('holidayHandler called');
    const holidays = await getHolidays();
    //console.log("holidays: ", holidays);
    res.json({ success: true, data: holidays });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};