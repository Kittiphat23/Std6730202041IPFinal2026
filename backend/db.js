require('dotenv').config();
const mysql = require('mysql2/promise');

let dbPool = null;
let isDbConnected = false;

// PMA (nindam.sytes.net) Bridge Session Cache
let pmaSessionCookies = null;
let pmaToken = null;
let pmaLastAuthTime = 0;

const ensurePmaAuth = async () => {
  const now = Date.now();
  // Refresh PMA session if older than 15 minutes
  if (pmaSessionCookies && pmaToken && now - pmaLastAuthTime < 15 * 60 * 1000) {
    return true;
  }

  try {
    const res = await fetch('http://nindam.sytes.net/nindamdb/index.php', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });
    const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    const html = await res.text();
    const token = (html.match(/name="token"\s+value="([^"]+)"/) || [])[1];

    let cookieMap = {};
    for (const c of setCookie) {
      if (!c) continue;
      const [k, v] = c.split(';')[0].split('=');
      cookieMap[k.trim()] = v;
    }

    const params = new URLSearchParams({
      set_session: token,
      token: token,
      pma_username: process.env.DB_USER || 'std6730202041',
      pma_password: process.env.DB_PASSWORD || 's8*RgL1Z',
      server: '1',
    });

    const loginRes = await fetch('http://nindam.sytes.net/nindamdb/index.php?route=/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; '),
        'User-Agent': 'Mozilla/5.0',
      },
      body: params.toString(),
      redirect: 'manual',
      signal: AbortSignal.timeout(6000),
    });

    const postCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie')];
    for (const c of postCookies) {
      if (!c) continue;
      const [k, v] = c.split(';')[0].split('=');
      cookieMap[k.trim()] = v;
    }

    pmaSessionCookies = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');

    const dbRes = await fetch('http://nindam.sytes.net/nindamdb/index.php?route=/database/structure&db=ip_std6730202041', {
      headers: {
        'Cookie': pmaSessionCookies,
        'User-Agent': 'Mozilla/5.0',
      },
      signal: AbortSignal.timeout(5000),
    });

    const dbHtml = await dbRes.text();
    pmaToken = (dbHtml.match(/name="token"\s+value="([^"]+)"/) || dbHtml.match(/token=([a-f0-9]{32})/) || [])[1] || token;
    pmaLastAuthTime = now;
    return true;
  } catch (err) {
    console.warn('[PMA Bridge Notice] phpMyAdmin connection failed:', err.message);
    pmaSessionCookies = null;
    pmaToken = null;
    return false;
  }
};

const executePmaSql = async (sql) => {
  try {
    const authOk = await ensurePmaAuth();
    if (!authOk || !pmaSessionCookies || !pmaToken) return false;

    const sqlParams = new URLSearchParams({
      db: process.env.DB_NAME || 'ip_std6730202041',
      token: pmaToken,
      sql_query: sql,
      ajax_request: 'true',
    });

    const execRes = await fetch('http://nindam.sytes.net/nindamdb/index.php?route=/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': pmaSessionCookies,
        'User-Agent': 'Mozilla/5.0',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: sqlParams.toString(),
      signal: AbortSignal.timeout(6000),
    });

    const data = await execRes.json().catch(() => null);
    if (data && data.success) {
      console.log('[PMA Bridge] Successfully synced SQL to nindam.sytes.net phpMyAdmin!');
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[PMA Bridge Error] Sync failed:', err.message);
    return false;
  }
};

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
      connectTimeout: 4000,
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

  // Test local MySQL
  try {
    if (!dbPool) {
      initDbPool();
    }
    const connection = await dbPool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    isDbConnected = true;
    console.log('[MySQL] Connected successfully to local database:', process.env.DB_NAME);
  } catch (error) {
    console.warn('[MySQL Local] Local DB not available:', error.message);
    isDbConnected = false;
  }

  // Also test PMA Bridge to nindam.sytes.net
  const pmaOk = await ensurePmaAuth();
  if (pmaOk) {
    console.log('[PMA Bridge] Connected successfully to remote phpMyAdmin at nindam.sytes.net!');
  }

  return isDbConnected || pmaOk;
};

const getEmployeesFromDb = async () => {
  if (isDbConnected && dbPool) {
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
    }
  }
  return null;
};

const insertEmployeeToDb = async (employee) => {
  const safeName = String(employee.name).replace(/'/g, "\\'");
  const safePosition = String(employee.position).replace(/'/g, "\\'");
  const safeStatus = String(employee.status).replace(/'/g, "\\'");
  const safeSalary = Number(employee.salary);
  const safeId = String(employee.id).replace(/'/g, "\\'");

  const pmaSql = `INSERT INTO Kittiphat_THONGPHUM_EMPLOYEES (id, name, position, status, salary) VALUES ('${safeId}', '${safeName}', '${safePosition}', '${safeStatus}', ${safeSalary}) ON DUPLICATE KEY UPDATE name=VALUES(name);`;

  // Sync to both local MySQL and remote phpMyAdmin
  const localPromise = (async () => {
    if (isDbConnected && dbPool) {
      await dbPool.query(
        'INSERT INTO Kittiphat_THONGPHUM_EMPLOYEES (id, name, position, status, salary) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
        [safeId, employee.name, employee.position, employee.status, safeSalary]
      );
    }
  })();

  const pmaPromise = executePmaSql(pmaSql);

  await Promise.allSettled([localPromise, pmaPromise]);
  return true;
};

const updateEmployeeStatusInDb = async (id, status) => {
  const safeStatus = String(status).replace(/'/g, "\\'");
  const safeId = String(id).replace(/'/g, "\\'");
  const pmaSql = `UPDATE Kittiphat_THONGPHUM_EMPLOYEES SET status = '${safeStatus}' WHERE id = '${safeId}';`;

  const localPromise = (async () => {
    if (isDbConnected && dbPool) {
      await dbPool.query('UPDATE Kittiphat_THONGPHUM_EMPLOYEES SET status = ? WHERE id = ?', [status, safeId]);
    }
  })();

  const pmaPromise = executePmaSql(pmaSql);

  await Promise.allSettled([localPromise, pmaPromise]);
  return true;
};

const deleteEmployeeFromDb = async (id) => {
  const safeId = String(id).replace(/'/g, "\\'");
  const pmaSql = `DELETE FROM Kittiphat_THONGPHUM_EMPLOYEES WHERE id = '${safeId}';`;

  const localPromise = (async () => {
    if (isDbConnected && dbPool) {
      await dbPool.query('DELETE FROM Kittiphat_THONGPHUM_EMPLOYEES WHERE id = ?', [safeId]);
    }
  })();

  const pmaPromise = executePmaSql(pmaSql);

  await Promise.allSettled([localPromise, pmaPromise]);
  return true;
};

module.exports = {
  initDbPool,
  testDbConnection,
  getEmployeesFromDb,
  insertEmployeeToDb,
  updateEmployeeStatusInDb,
  deleteEmployeeFromDb,
};
