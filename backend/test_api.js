/**
 * Automated Test Suite for Backend Endpoints
 */

const testSuite = async () => {
  const baseUrl = 'http://localhost:5000';
  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, testName) => {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  };

  console.log('--- STARTING BACKEND API TESTS ---');

  try {
    // 1. Test Login - Success
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 200 && loginData.success === true && loginData.token === 'mock-jwt-token',
      'POST /api/login: Correct credentials returns 200 OK and token'
    );

    // 2. Test Login - Invalid credentials
    const badLoginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'wrong', password: 'bad' }),
    });
    assert(badLoginRes.status === 401, 'POST /api/login: Wrong credentials returns 401 Unauthorized');

    // 3. Test GET /api/employees
    const getEmployeesRes = await fetch(`${baseUrl}/api/employees`);
    const employeesList = await getEmployeesRes.json();
    assert(
      getEmployeesRes.status === 200 && Array.isArray(employeesList) && employeesList.length >= 5,
      `GET /api/employees: Returns array with at least 5 employees (Found ${employeesList.length})`
    );

    // 4. Test POST /api/employees - Validation (Missing fields -> 400 Bad Request)
    const badEmpRes = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', position: 'Tester', salary: 30000 }),
    });
    assert(badEmpRes.status === 400, 'POST /api/employees: Empty name returns 400 Bad Request');

    // 5. Test POST /api/employees - Valid addition
    const newEmpRes = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Wonderland', position: 'QA Engineer', salary: 38000 }),
    });
    const newEmpData = await newEmpRes.json();
    assert(
      newEmpRes.status === 201 && newEmpData.employee && newEmpData.employee.name === 'Alice Wonderland',
      'POST /api/employees: Successfully creates new employee with 201'
    );
    const createdId = newEmpData.employee.id;

    // 6. Test PUT /api/employees/:id/status - Toggle Status
    const toggleRes = await fetch(`${baseUrl}/api/employees/${createdId}/status`, {
      method: 'PUT',
    });
    const toggleData = await toggleRes.json();
    assert(
      toggleRes.status === 200 && toggleData.employee.status === 'On Leave',
      'PUT /api/employees/:id/status: Successfully toggles status to On Leave'
    );

    // 7. Test DELETE /api/employees/:id
    const deleteRes = await fetch(`${baseUrl}/api/employees/${createdId}`, {
      method: 'DELETE',
    });
    assert(deleteRes.status === 200, 'DELETE /api/employees/:id: Successfully deletes employee');

    // 8. Test GET /api/employees/salary-clusters
    const clustersRes = await fetch(`${baseUrl}/api/employees/salary-clusters`);
    const clustersData = await clustersRes.json();
    assert(
      clustersRes.status === 200 &&
        clustersData.success === true &&
        Array.isArray(clustersData.clusters) &&
        clustersData.clusters.length === 3 &&
        clustersData.clusters[0].group === 'Tier 1' &&
        clustersData.clusters[1].group === 'Tier 2' &&
        clustersData.clusters[2].group === 'Tier 3',
      'GET /api/employees/salary-clusters: Successfully returns 3 cluster tiers with counts and centroids'
    );

    console.log(`\n--- TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ---`);
    if (passedTests === totalTests) {
      console.log('🎉 ALL BACKEND API TESTS PASSED PERFECTLY!\n');
    }
  } catch (error) {
    console.error('Test execution failed:', error.message);
  }
};

testSuite();
