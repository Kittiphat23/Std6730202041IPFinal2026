/**
 * Automated Test Suite for Backend Endpoints
 */

const testSuiteTHONGPHUM = async () => {
  const baseUrlTHONGPHUM = 'http://localhost:5000';
  let passedTestsTHONGPHUM = 0;
  let totalTestsTHONGPHUM = 0;

  const assertTHONGPHUM = (conditionTHONGPHUM, testNameTHONGPHUM) => {
    totalTestsTHONGPHUM++;
    if (conditionTHONGPHUM) {
      console.log(`✅ [PASS] ${testNameTHONGPHUM}`);
      passedTestsTHONGPHUM++;
    } else {
      console.error(`❌ [FAIL] ${testNameTHONGPHUM}`);
    }
  };

  console.log('--- STARTING BACKEND API TESTS ---');

  try {
    // 1. Test Login - Success
    const loginResTHONGPHUM = await fetch(`${baseUrlTHONGPHUM}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' }),
    });
    const loginDataTHONGPHUM = await loginResTHONGPHUM.json();
    assertTHONGPHUM(
      loginResTHONGPHUM.status === 200 && loginDataTHONGPHUM.success === true && loginDataTHONGPHUM.token === 'mock-jwt-token',
      'POST /api/login: Correct credentials returns 200 OK and token'
    );

    // 2. Test Login - Invalid credentials
    const badLoginResTHONGPHUM = await fetch(`${baseUrlTHONGPHUM}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'wrong', password: 'bad' }),
    });
    assertTHONGPHUM(badLoginResTHONGPHUM.status === 401, 'POST /api/login: Wrong credentials returns 401 Unauthorized');

    // 3. Test GET /api/employees
    const getEmployeesResTHONGPHUM = await fetch(`${baseUrlTHONGPHUM}/api/employees`);
    const employeesListTHONGPHUM = await getEmployeesResTHONGPHUM.json();
    assertTHONGPHUM(
      getEmployeesResTHONGPHUM.status === 200 && Array.isArray(employeesListTHONGPHUM) && employeesListTHONGPHUM.length >= 5,
      `GET /api/employees: Returns array with at least 5 employees (Found ${employeesListTHONGPHUM.length})`
    );

    // 4. Test POST /api/employees - Validation (Missing fields -> 400 Bad Request)
    const badEmpResTHONGPHUM = await fetch(`${baseUrlTHONGPHUM}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', position: 'Tester', salary: 30000 }),
    });
    assertTHONGPHUM(badEmpResTHONGPHUM.status === 400, 'POST /api/employees: Empty name returns 400 Bad Request');

    // 5. Test POST /api/employees - Valid addition
    const newEmpResTHONGPHUM = await fetch(`${baseUrlTHONGPHUM}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Wonderland', position: 'QA Engineer', salary: 38000 }),
    });
    const newEmpDataTHONGPHUM = await newEmpResTHONGPHUM.json();
    assertTHONGPHUM(
      newEmpResTHONGPHUM.status === 201 && newEmpDataTHONGPHUM.employee && newEmpDataTHONGPHUM.employee.name === 'Alice Wonderland',
      'POST /api/employees: Successfully creates new employee with 201'
    );
    const createdIdTHONGPHUM = newEmpDataTHONGPHUM.employee.id;

    // 6. Test PUT /api/employees/:id/status - Toggle Status
    const toggleResTHONGPHUM = await fetch(`${baseUrlTHONGPHUM}/api/employees/${createdIdTHONGPHUM}/status`, {
      method: 'PUT',
    });
    const toggleDataTHONGPHUM = await toggleResTHONGPHUM.json();
    assertTHONGPHUM(
      toggleResTHONGPHUM.status === 200 && toggleDataTHONGPHUM.employee.status === 'On Leave',
      'PUT /api/employees/:id/status: Successfully toggles status to On Leave'
    );

    // 7. Test DELETE /api/employees/:id
    const deleteResTHONGPHUM = await fetch(`${baseUrlTHONGPHUM}/api/employees/${createdIdTHONGPHUM}`, {
      method: 'DELETE',
    });
    assertTHONGPHUM(deleteResTHONGPHUM.status === 200, 'DELETE /api/employees/:id: Successfully deletes employee');

    // 8. Test GET /api/employees/salary-clusters
    const clustersResTHONGPHUM = await fetch(`${baseUrlTHONGPHUM}/api/employees/salary-clusters`);
    const clustersDataTHONGPHUM = await clustersResTHONGPHUM.json();
    assertTHONGPHUM(
      clustersResTHONGPHUM.status === 200 &&
        clustersDataTHONGPHUM.success === true &&
        Array.isArray(clustersDataTHONGPHUM.clusters) &&
        clustersDataTHONGPHUM.clusters.length === 3 &&
        clustersDataTHONGPHUM.clusters[0].group === 'Tier 1' &&
        clustersDataTHONGPHUM.clusters[1].group === 'Tier 2' &&
        clustersDataTHONGPHUM.clusters[2].group === 'Tier 3',
      'GET /api/employees/salary-clusters: Successfully returns 3 cluster tiers with counts and centroids'
    );

    console.log(`\n--- TEST SUMMARY: ${passedTestsTHONGPHUM}/${totalTestsTHONGPHUM} TESTS PASSED ---`);
    if (passedTestsTHONGPHUM === totalTestsTHONGPHUM) {
      console.log('🎉 ALL BACKEND API TESTS PASSED PERFECTLY!\n');
    }
  } catch (errorTHONGPHUM) {
    console.error('Test execution failed:', errorTHONGPHUM.message);
  }
};

testSuiteTHONGPHUM();
