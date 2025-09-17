import { getCampusList, getDepartmentList, getDepartmentBranches } from '../queries/departmentQueries.js';

export async function getCampusListHandler(req, res) {
  console.log('getCampusListHandler called');
  console.log('Request params:', req.params);
  console.log('Request query:', req.query);
  
  try {
    const category = req.params.category || req.query.category;
    console.log('Fetching campus list for category:', category);
    
    if (!category) {
      console.log('No category parameter found');
      return res.status(400).json({ error: 'Category parameter is required' });
    }

    const data = await getCampusList(category);
    console.log('Campus List Data:', data);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No campus data found for this category' });
    }
    
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching campus list:', err);
    res.status(500).json({ 
      error: 'Failed to fetch campus list', 
      details: err.message 
    });
  }
}

export async function getDepartmentListHandler(req, res) {
  console.log('getDepartmentListHandler called');
  console.log('Request params:', req.params);
  console.log('Request query:', req.query);
  
  try {
    const category = req.params.category || req.query.category;
    const campusCode = req.params.campusCode || req.query.campusCode;
    
    if (!category) {
      return res.status(400).json({ error: 'Category parameter is required' });
    }
    
    if (!campusCode) {
      return res.status(400).json({ error: 'Campus code parameter is required' });
    }

    const data = await getDepartmentList(category, campusCode);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No departments found for this campus' });
    }
    
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching department list:', err);
    res.status(500).json({ 
      error: 'Failed to fetch department list', 
      details: err.message 
    });
  }
}

export async function getDepartmentBranchesHandler(req, res) {
  console.log('getDepartmentBranchesHandler called');
  console.log('Request params:', req.params);
  console.log('Request query:', req.query);
  
  try {
    const deptCode = req.params.deptCode || req.query.deptCode;
    const campusCode = req.params.campusCode || req.query.campusCode;
    console.log('Fetching department branches for department code:', deptCode);
    
    if (!deptCode) {
      return res.status(400).json({ error: 'Department code parameter is required' });
    }

    const data = await getDepartmentBranches(deptCode,campusCode);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No branches found for this department' });
    }
    
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching department branches:', err);
    res.status(500).json({ 
      error: 'Failed to fetch department branches', 
      details: err.message 
    });
  }
}

// Export all handlers as named exports
export default {
  getCampusListHandler, 
  getDepartmentListHandler, 
  getDepartmentBranchesHandler 
};