require('dotenv').config();
const mysqlTHONGPHUM = require('mysql2/promise');

let dbPoolTHONGPHUM = null;
let isDbConnectedTHONGPHUM = false;

const initDbPoolTHONGPHUM = () => {
  try {
    const configTHONGPHUM = {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'std6730202041',
      password: process.env.DB_PASSWORD || 's8*RgL1Z',
      database: process.env.DB_NAME || 'ip_std6730202041',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

    dbPoolTHONGPHUM = mysqlTHONGPHUM.createPool(configTHONGPHUM);
    return dbPoolTHONGPHUM;
  } catch (errorTHONGPHUM) {
    console.warn('[MySQL Warning] Failed to initialize pool:', errorTHONGPHUM.message);
    dbPoolTHONGPHUM = null;
    return null;
  }
};

const testDbConnectionTHONGPHUM = async () => {
  if (process.env.USE_MYSQL === 'false') {
    console.log('[MySQL] USE_MYSQL is disabled. Running pure In-memory mode.');
    isDbConnectedTHONGPHUM = false;
    return false;
  }

  try {
    if (!dbPoolTHONGPHUM) {
      initDbPoolTHONGPHUM();
    }
    const connectionTHONGPHUM = await dbPoolTHONGPHUM.getConnection();
    await connectionTHONGPHUM.query('SELECT 1');
    connectionTHONGPHUM.release();
    isDbConnectedTHONGPHUM = true;
    console.log('[MySQL] Connected successfully to database:', process.env.DB_NAME);
    return true;
  } catch (errorTHONGPHUM) {
    console.warn('[MySQL Notice] Database not reachable. Operating with In-memory Array fallback:', errorTHONGPHUM.message);
    isDbConnectedTHONGPHUM = false;
    return false;
  }
};

const getEmployeesFromDbTHONGPHUM = async () => {
  if (!isDbConnectedTHONGPHUM || !dbPoolTHONGPHUM) return null;
  try {
    const [rowsTHONGPHUM] = await dbPoolTHONGPHUM.query(
      'SELECT id, name, position, status, salary FROM final_employees ORDER BY CAST(id AS UNSIGNED) ASC'
    );
    return rowsTHONGPHUM.map((rowTHONGPHUM) => ({
      id: String(rowTHONGPHUM.id),
      name: rowTHONGPHUM.name,
      position: rowTHONGPHUM.position,
      status: rowTHONGPHUM.status,
      salary: Number(rowTHONGPHUM.salary),
    }));
  } catch (errorTHONGPHUM) {
    console.warn('[MySQL] Error querying final_employees:', errorTHONGPHUM.message);
    return null;
  }
};

const insertEmployeeToDbTHONGPHUM = async (employeeTHONGPHUM) => {
  if (!isDbConnectedTHONGPHUM || !dbPoolTHONGPHUM) return false;
  try {
    await dbPoolTHONGPHUM.query(
      'INSERT INTO final_employees (id, name, position, status, salary) VALUES (?, ?, ?, ?, ?)',
      [
        String(employeeTHONGPHUM.id),
        employeeTHONGPHUM.name,
        employeeTHONGPHUM.position,
        employeeTHONGPHUM.status,
        Number(employeeTHONGPHUM.salary),
      ]
    );
    return true;
  } catch (errorTHONGPHUM) {
    console.warn('[MySQL] Error inserting into final_employees:', errorTHONGPHUM.message);
    return false;
  }
};

const updateEmployeeStatusInDbTHONGPHUM = async (idTHONGPHUM, statusTHONGPHUM) => {
  if (!isDbConnectedTHONGPHUM || !dbPoolTHONGPHUM) return false;
  try {
    await dbPoolTHONGPHUM.query(
      'UPDATE final_employees SET status = ? WHERE id = ?',
      [statusTHONGPHUM, String(idTHONGPHUM)]
    );
    return true;
  } catch (errorTHONGPHUM) {
    console.warn('[MySQL] Error updating final_employees:', errorTHONGPHUM.message);
    return false;
  }
};

const deleteEmployeeFromDbTHONGPHUM = async (idTHONGPHUM) => {
  if (!isDbConnectedTHONGPHUM || !dbPoolTHONGPHUM) return false;
  try {
    await dbPoolTHONGPHUM.query(
      'DELETE FROM final_employees WHERE id = ?',
      [String(idTHONGPHUM)]
    );
    return true;
  } catch (errorTHONGPHUM) {
    console.warn('[MySQL] Error deleting from final_employees:', errorTHONGPHUM.message);
    return false;
  }
};

module.exports = {
  initDbPoolTHONGPHUM,
  testDbConnectionTHONGPHUM,
  getEmployeesFromDbTHONGPHUM,
  insertEmployeeToDbTHONGPHUM,
  updateEmployeeStatusInDbTHONGPHUM,
  deleteEmployeeFromDbTHONGPHUM,
};
