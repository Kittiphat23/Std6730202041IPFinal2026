require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { calculateKMeans1D } = require('./kmeans');
const {
  testDbConnection,
  getEmployeesFromDb,
  insertEmployeeToDb,
  updateEmployeeStatusInDb,
  deleteEmployeeFromDb,
} = require('./db');

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());

// Initial In-Memory Array (At least 5 mock employees as strictly required by exam)
const defaultEmployees = [
  {
    id: '1',
    name: 'John Doe',
    position: 'Software Engineer',
    status: 'Active',
    salary: 45000,
  },
  {
    id: '2',
    name: 'Jane Smith',
    position: 'Senior Developer',
    status: 'Active',
    salary: 75000,
  },
  {
    id: '3',
    name: 'Michael Scott',
    position: 'Regional Manager',
    status: 'On Leave',
    salary: 95000,
  },
  {
    id: '4',
    name: 'Pam Beesly',
    position: 'Office Administrator',
    status: 'Active',
    salary: 22000,
  },
  {
    id: '5',
    name: 'Jim Halpert',
    position: 'Sales Specialist',
    status: 'Active',
    salary: 48000,
  },
  {
    id: '6',
    name: 'Dwight Schrute',
    position: 'Assistant to Regional Manager',
    status: 'Active',
    salary: 52000,
  },
  {
    id: '7',
    name: 'Kevin Malone',
    position: 'Accountant',
    status: 'On Leave',
    salary: 25000,
  },
  {
    id: '8',
    name: 'Stanley Hudson',
    position: 'Senior Sales Executive',
    status: 'Active',
    salary: 82000,
  },
];

let employeesMemory = [...defaultEmployees];

// Initialize DB and sync if available
(async () => {
  const isDbReady = await testDbConnection();
  if (isDbReady) {
    const dbEmployees = await getEmployeesFromDb();
    if (dbEmployees && dbEmployees.length > 0) {
      employeesMemory = dbEmployees;
      console.log(`[Database Sync] Loaded ${employeesMemory.length} employees from MySQL table Kittiphat_THONGPHUM_EMPLOYEES.`);
    } else {
      console.log('[Database Sync] Seeding initial mock employees into MySQL Kittiphat_THONGPHUM_EMPLOYEES...');
      for (const emp of defaultEmployees) {
        await insertEmployeeToDb(emp);
      }
    }
  }
})();

// Helper to generate next unique ID
const getNextId = () => {
  if (employeesMemory.length === 0) return '1';
  const maxId = employeesMemory.reduce((max, emp) => {
    const numericId = parseInt(emp.id, 10);
    return !Number.isNaN(numericId) && numericId > max ? numericId : max;
  }, 0);
  return String(maxId + 1);
};

// =========================================================================
// 1. Authentication (Login): POST /api/login
// =========================================================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (username === 'admin' && password === 'password123') {
    return res.status(200).json({
      success: true,
      token: 'mock-jwt-token',
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid username or password',
  });
});

// =========================================================================
// 2. CRUD Endpoints
// =========================================================================

// [GET] /api/employees - Return all employee records
app.get('/api/employees', (req, res) => {
  return res.status(200).json(employeesMemory);
});

// [POST] /api/employees - Add a new employee
// Must receive name, position, and salary. If any field is empty, respond with Status 400 Bad Request.
app.post('/api/employees', async (req, res) => {
  const { name, position, salary } = req.body || {};

  // Validation: Check for presence and non-empty strings/valid number
  const isNameEmpty = name === undefined || name === null || String(name).trim() === '';
  const isPositionEmpty = position === undefined || position === null || String(position).trim() === '';
  const isSalaryEmpty = salary === undefined || salary === null || String(salary).trim() === '' || Number.isNaN(Number(salary));

  if (isNameEmpty || isPositionEmpty || isSalaryEmpty) {
    return res.status(400).json({
      success: false,
      message: 'Name, position, and salary are required and cannot be empty.',
    });
  }

  const numericSalary = Number(salary);
  if (numericSalary < 0) {
    return res.status(400).json({
      success: false,
      message: 'Salary must be a positive number.',
    });
  }

  const newEmployee = {
    id: getNextId(),
    name: String(name).trim(),
    position: String(position).trim(),
    status: 'Active',
    salary: numericSalary,
  };

  // Add to primary In-memory storage
  employeesMemory.push(newEmployee);

  // Sync to database if connected
  insertEmployeeToDb(newEmployee).catch((err) => {
    console.warn('[MySQL Sync Error]', err.message);
  });

  return res.status(201).json({
    success: true,
    message: 'Employee added successfully',
    employee: newEmployee,
  });
});

// [PUT] /api/employees/:id/status - Toggle employee status (Active <-> On Leave)
app.put('/api/employees/:id/status', async (req, res) => {
  const employeeId = String(req.params.id);
  const employeeIndex = employeesMemory.findIndex(
    (emp) => String(emp.id) === employeeId
  );

  if (employeeIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Employee with id ${employeeId} not found`,
    });
  }

  const currentStatus = employeesMemory[employeeIndex].status;
  const toggledStatus = currentStatus === 'Active' ? 'On Leave' : 'Active';

  employeesMemory[employeeIndex].status = toggledStatus;

  // Sync to database if connected
  updateEmployeeStatusInDb(employeeId, toggledStatus).catch((err) => {
    console.warn('[MySQL Sync Error]', err.message);
  });

  return res.status(200).json({
    success: true,
    message: `Status toggled to ${toggledStatus}`,
    employee: employeesMemory[employeeIndex],
  });
});

// [DELETE] /api/employees/:id - Remove employee from the system
app.delete('/api/employees/:id', async (req, res) => {
  const employeeId = String(req.params.id);
  const employeeIndex = employeesMemory.findIndex(
    (emp) => String(emp.id) === employeeId
  );

  if (employeeIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Employee with id ${employeeId} not found`,
    });
  }

  const removedEmployee = employeesMemory.splice(employeeIndex, 1)[0];

  // Sync to database if connected
  deleteEmployeeFromDb(employeeId).catch((err) => {
    console.warn('[MySQL Sync Error]', err.message);
  });

  return res.status(200).json({
    success: true,
    message: 'Employee removed successfully',
    deletedEmployee: removedEmployee,
  });
});

// =========================================================================
// 3. Phase 2: Automated Salary Clustering (K-Means Analytics)
// [GET] /api/employees/salary-clusters
// =========================================================================
app.get('/api/employees/salary-clusters', (req, res) => {
  try {
    // Extract only salary values from current employees
    const salaryList = employeesMemory.map((emp) => Number(emp.salary));

    // Run 1D K-Means clustering (k=3)
    const clusterResults = calculateKMeans1D(salaryList, 3);

    return res.status(200).json({
      success: true,
      clusters: clusterResults,
    });
  } catch (error) {
    console.error('K-Means Clustering Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process salary clustering',
      error: error.message,
    });
  }
});

// Root welcome / health check
app.get('/', (req, res) => {
  res.json({
    message: 'Final Exam: Internet Programming (2026) - HR Manager & Salary Analytics API',
    endpoints: [
      'POST /api/login',
      'GET /api/employees',
      'POST /api/employees',
      'PUT /api/employees/:id/status',
      'DELETE /api/employees/:id',
      'GET /api/employees/salary-clusters',
    ],
  });
});

// Start Express Server
const server = app.listen(port, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(`🚀 HR Manager & Salary Analytics API is running!`);
  console.log(`📡 Local: http://localhost:${port}`);
  console.log(`🌐 Network: http://0.0.0.0:${port}`);
  console.log('========================================================');
});

module.exports = { app, server };
