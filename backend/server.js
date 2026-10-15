require('dotenv').config();
const expressTHONGPHUM = require('express');
const corsTHONGPHUM = require('cors');
const { calculateKMeans1DTHONGPHUM } = require('./kmeans');
const {
  testDbConnectionTHONGPHUM,
  getEmployeesFromDbTHONGPHUM,
  insertEmployeeToDbTHONGPHUM,
  updateEmployeeStatusInDbTHONGPHUM,
  deleteEmployeeFromDbTHONGPHUM,
} = require('./db');

const appTHONGPHUM = expressTHONGPHUM();
const portTHONGPHUM = process.env.PORT || 5000;

// Enable CORS and JSON body parser
appTHONGPHUM.use(corsTHONGPHUM());
appTHONGPHUM.use(expressTHONGPHUM.json());

// Initial In-Memory Array (At least 5 mock employees as strictly required by exam)
const defaultEmployeesTHONGPHUM = [
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

let employeesMemoryTHONGPHUM = [...defaultEmployeesTHONGPHUM];

// Initialize DB and sync if available
(async () => {
  const isDbReadyTHONGPHUM = await testDbConnectionTHONGPHUM();
  if (isDbReadyTHONGPHUM) {
    const dbEmployeesTHONGPHUM = await getEmployeesFromDbTHONGPHUM();
    if (dbEmployeesTHONGPHUM && dbEmployeesTHONGPHUM.length > 0) {
      employeesMemoryTHONGPHUM = dbEmployeesTHONGPHUM;
      console.log(`[Database Sync] Loaded ${employeesMemoryTHONGPHUM.length} employees from MySQL table final_employees.`);
    } else {
      console.log('[Database Sync] Seeding initial mock employees into MySQL final_employees...');
      for (const empTHONGPHUM of defaultEmployeesTHONGPHUM) {
        await insertEmployeeToDbTHONGPHUM(empTHONGPHUM);
      }
    }
  }
})();

// Helper to generate next unique ID
const getNextIdTHONGPHUM = () => {
  if (employeesMemoryTHONGPHUM.length === 0) return '1';
  const maxIdTHONGPHUM = employeesMemoryTHONGPHUM.reduce((maxTHONGPHUM, empTHONGPHUM) => {
    const numericIdTHONGPHUM = parseInt(empTHONGPHUM.id, 10);
    return !Number.isNaN(numericIdTHONGPHUM) && numericIdTHONGPHUM > maxTHONGPHUM ? numericIdTHONGPHUM : maxTHONGPHUM;
  }, 0);
  return String(maxIdTHONGPHUM + 1);
};

// =========================================================================
// 1. Authentication (Login): POST /api/login
// =========================================================================
appTHONGPHUM.post('/api/login', (reqTHONGPHUM, resTHONGPHUM) => {
  const { username: usernameTHONGPHUM, password: passwordTHONGPHUM } = reqTHONGPHUM.body || {};

  if (usernameTHONGPHUM === 'admin' && passwordTHONGPHUM === 'password123') {
    return resTHONGPHUM.status(200).json({
      success: true,
      token: 'mock-jwt-token',
    });
  }

  return resTHONGPHUM.status(401).json({
    success: false,
    message: 'Invalid username or password',
  });
});

// =========================================================================
// 2. CRUD Endpoints
// =========================================================================

// [GET] /api/employees - Return all employee records
appTHONGPHUM.get('/api/employees', (reqTHONGPHUM, resTHONGPHUM) => {
  return resTHONGPHUM.status(200).json(employeesMemoryTHONGPHUM);
});

// [POST] /api/employees - Add a new employee
// Must receive name, position, and salary. If any field is empty, respond with Status 400 Bad Request.
appTHONGPHUM.post('/api/employees', async (reqTHONGPHUM, resTHONGPHUM) => {
  const { name: nameTHONGPHUM, position: positionTHONGPHUM, salary: salaryTHONGPHUM } = reqTHONGPHUM.body || {};

  // Validation: Check for presence and non-empty strings/valid number
  const isNameEmptyTHONGPHUM = nameTHONGPHUM === undefined || nameTHONGPHUM === null || String(nameTHONGPHUM).trim() === '';
  const isPositionEmptyTHONGPHUM = positionTHONGPHUM === undefined || positionTHONGPHUM === null || String(positionTHONGPHUM).trim() === '';
  const isSalaryEmptyTHONGPHUM = salaryTHONGPHUM === undefined || salaryTHONGPHUM === null || String(salaryTHONGPHUM).trim() === '' || Number.isNaN(Number(salaryTHONGPHUM));

  if (isNameEmptyTHONGPHUM || isPositionEmptyTHONGPHUM || isSalaryEmptyTHONGPHUM) {
    return resTHONGPHUM.status(400).json({
      success: false,
      message: 'Name, position, and salary are required and cannot be empty.',
    });
  }

  const numericSalaryTHONGPHUM = Number(salaryTHONGPHUM);
  if (numericSalaryTHONGPHUM < 0) {
    return resTHONGPHUM.status(400).json({
      success: false,
      message: 'Salary must be a positive number.',
    });
  }

  const newEmployeeTHONGPHUM = {
    id: getNextIdTHONGPHUM(),
    name: String(nameTHONGPHUM).trim(),
    position: String(positionTHONGPHUM).trim(),
    status: 'Active',
    salary: numericSalaryTHONGPHUM,
  };

  // Add to primary In-memory storage
  employeesMemoryTHONGPHUM.push(newEmployeeTHONGPHUM);

  // Sync to database if connected
  insertEmployeeToDbTHONGPHUM(newEmployeeTHONGPHUM).catch((errTHONGPHUM) => {
    console.warn('[MySQL Sync Error]', errTHONGPHUM.message);
  });

  return resTHONGPHUM.status(201).json({
    success: true,
    message: 'Employee added successfully',
    employee: newEmployeeTHONGPHUM,
  });
});

// [PUT] /api/employees/:id/status - Toggle employee status (Active <-> On Leave)
appTHONGPHUM.put('/api/employees/:id/status', async (reqTHONGPHUM, resTHONGPHUM) => {
  const employeeIdTHONGPHUM = String(reqTHONGPHUM.params.id);
  const employeeIndexTHONGPHUM = employeesMemoryTHONGPHUM.findIndex(
    (empTHONGPHUM) => String(empTHONGPHUM.id) === employeeIdTHONGPHUM
  );

  if (employeeIndexTHONGPHUM === -1) {
    return resTHONGPHUM.status(404).json({
      success: false,
      message: `Employee with id ${employeeIdTHONGPHUM} not found`,
    });
  }

  const currentStatusTHONGPHUM = employeesMemoryTHONGPHUM[employeeIndexTHONGPHUM].status;
  const toggledStatusTHONGPHUM = currentStatusTHONGPHUM === 'Active' ? 'On Leave' : 'Active';

  employeesMemoryTHONGPHUM[employeeIndexTHONGPHUM].status = toggledStatusTHONGPHUM;

  // Sync to database if connected
  updateEmployeeStatusInDbTHONGPHUM(employeeIdTHONGPHUM, toggledStatusTHONGPHUM).catch((errTHONGPHUM) => {
    console.warn('[MySQL Sync Error]', errTHONGPHUM.message);
  });

  return resTHONGPHUM.status(200).json({
    success: true,
    message: `Status toggled to ${toggledStatusTHONGPHUM}`,
    employee: employeesMemoryTHONGPHUM[employeeIndexTHONGPHUM],
  });
});

// [DELETE] /api/employees/:id - Remove employee from the system
appTHONGPHUM.delete('/api/employees/:id', async (reqTHONGPHUM, resTHONGPHUM) => {
  const employeeIdTHONGPHUM = String(reqTHONGPHUM.params.id);
  const employeeIndexTHONGPHUM = employeesMemoryTHONGPHUM.findIndex(
    (empTHONGPHUM) => String(empTHONGPHUM.id) === employeeIdTHONGPHUM
  );

  if (employeeIndexTHONGPHUM === -1) {
    return resTHONGPHUM.status(404).json({
      success: false,
      message: `Employee with id ${employeeIdTHONGPHUM} not found`,
    });
  }

  const removedEmployeeTHONGPHUM = employeesMemoryTHONGPHUM.splice(employeeIndexTHONGPHUM, 1)[0];

  // Sync to database if connected
  deleteEmployeeFromDbTHONGPHUM(employeeIdTHONGPHUM).catch((errTHONGPHUM) => {
    console.warn('[MySQL Sync Error]', errTHONGPHUM.message);
  });

  return resTHONGPHUM.status(200).json({
    success: true,
    message: 'Employee removed successfully',
    deletedEmployee: removedEmployeeTHONGPHUM,
  });
});

// =========================================================================
// 3. Phase 2: Automated Salary Clustering (K-Means Analytics)
// [GET] /api/employees/salary-clusters
// =========================================================================
appTHONGPHUM.get('/api/employees/salary-clusters', (reqTHONGPHUM, resTHONGPHUM) => {
  try {
    // Extract only salary values from current employees
    const salaryListTHONGPHUM = employeesMemoryTHONGPHUM.map((empTHONGPHUM) => Number(empTHONGPHUM.salary));

    // Run 1D K-Means clustering (k=3)
    const clusterResultsTHONGPHUM = calculateKMeans1DTHONGPHUM(salaryListTHONGPHUM, 3);

    return resTHONGPHUM.status(200).json({
      success: true,
      clusters: clusterResultsTHONGPHUM,
    });
  } catch (errorTHONGPHUM) {
    console.error('K-Means Clustering Error:', errorTHONGPHUM);
    return resTHONGPHUM.status(500).json({
      success: false,
      message: 'Failed to process salary clustering',
      error: errorTHONGPHUM.message,
    });
  }
});

// Root welcome / health check
appTHONGPHUM.get('/', (reqTHONGPHUM, resTHONGPHUM) => {
  resTHONGPHUM.json({
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
const serverTHONGPHUM = appTHONGPHUM.listen(portTHONGPHUM, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(`🚀 HR Manager & Salary Analytics API is running!`);
  console.log(`📡 Local: http://localhost:${portTHONGPHUM}`);
  console.log(`🌐 Network: http://0.0.0.0:${portTHONGPHUM}`);
  console.log('========================================================');
});

module.exports = { appTHONGPHUM, serverTHONGPHUM };
