require('dotenv').config();
const mysql = require('mysql2/promise');

let dbPool = null;
let isDbConnected = false;

const initDbPool = () => {
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'std6730202041',
      password: process.env.DB_PASSWORD || 's8*RgL1Z',
      database: process.env.DB_NAME || 'ip_std6730202041',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

    dbPool = mysql.createPool(config);
    return dbPool;
  } catch (error) {
    console.warn('[MySQL Warning] Failed to initialize pool:', error.message);
    dbPool = null;
    return null;
  }
};

const testDbConnection = async () => {
  if (process.env.USE_MYSQL === 'false') {
    console.log('[MySQL] USE_MYSQL is disabled. Running pure In-memory mode.');
    isDbConnected = false;
    return false;
  }

  try {
    if (!dbPool) {
      initDbPool();
    }
    const connection = await dbPool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    isDbConnected = true;
    console.log('[MySQL] Connected successfully to database:', process.env.DB_NAME);
    return true;
  } catch (error) {
    console.warn('[MySQL Notice] Database not reachable. Operating with In-memory Array fallback:', error.message);
    isDbConnected = false;
    return false;
  }
};

const getEmployeesFromDb = async () => {
  if (!isDbConnected || !dbPool) return null;
  try {
    const [rows] = await dbPool.query(
      'SELECT id, name, position, status, salary FROM Kittiphat_THONGPHUM_EMPLOYEES ORDER BY CAST(id AS UNSIGNED) ASC'
    );
    return rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      position: row.position,
      status: row.status,
      salary: Number(row.salary),
    }));
  } catch (error) {
    console.warn('[MySQL] Error querying Kittiphat_THONGPHUM_EMPLOYEES:', error.message);
    return null;
  }
};

const insertEmployeeToDb = async (employee) => {
  if (!isDbConnected || !dbPool) return false;
  try {
    await dbPool.query(
      'INSERT INTO Kittiphat_THONGPHUM_EMPLOYEES (id, name, position, status, salary) VALUES (?, ?, ?, ?, ?)',
      [
        String(employee.id),
        employee.name,
        employee.position,
        employee.status,
        Number(employee.salary),
      ]
    );
    return true;
  } catch (error) {
    console.warn('[MySQL] Error inserting into Kittiphat_THONGPHUM_EMPLOYEES:', error.message);
    return false;
  }
};

const updateEmployeeStatusInDb = async (id, status) => {
  if (!isDbConnected || !dbPool) return false;
  try {
    await dbPool.query(
      'UPDATE Kittiphat_THONGPHUM_EMPLOYEES SET status = ? WHERE id = ?',
      [status, String(id)]
    );
    return true;
  } catch (error) {
    console.warn('[MySQL] Error updating Kittiphat_THONGPHUM_EMPLOYEES:', error.message);
    return false;
  }
};

const deleteEmployeeFromDb = async (id) => {
  if (!isDbConnected || !dbPool) return false;
  try {
    await dbPool.query(
      'DELETE FROM Kittiphat_THONGPHUM_EMPLOYEES WHERE id = ?',
      [String(id)]
    );
    return true;
  } catch (error) {
    console.warn('[MySQL] Error deleting from Kittiphat_THONGPHUM_EMPLOYEES:', error.message);
    return false;
  }
};

module.exports = {
  initDbPool,
  testDbConnection,
  getEmployeesFromDb,
  insertEmployeeToDb,
  updateEmployeeStatusInDb,
  deleteEmployeeFromDb,
};
