import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { API_BASE_URL } from './config';

export default function App() {
  // Navigation & Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [loginLoading, setLoginLoading] = useState(false);

  // Employee CRUD States
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [positionInput, setPositionInput] = useState('');
  const [salaryInput, setSalaryInput] = useState('');
  const [formError, setFormError] = useState('');
  const [addingEmployee, setAddingEmployee] = useState(false);

  // Salary Analytics (K-Means) States
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [clustersData, setClustersData] = useState(null);

  // Custom Alert helper for cross-platform (Native + Web)
  const showNotification = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // ---------------------------------------------------------
  // Authentication: Login Handler
  // ---------------------------------------------------------
  const handleLogin = async () => {
    if (!usernameInput.trim() || !passwordInput.trim()) {
      showNotification('Login Failed', 'Please enter both username and password.');
      return;
    }

    try {
      setLoginLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput.trim(),
        }),
      });

      const data = await response.json();

      if (response.status === 200 && data.success) {
        setAuthToken(data.token);
        setIsLoggedIn(true);
        fetchEmployees();
      } else {
        showNotification('Login Failed', data.message || 'Invalid username or password');
      }
    } catch (error) {
      showNotification('Network Error', `Cannot connect to server at ${API_BASE_URL}`);
    } finally {
      setLoginLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Authentication: Logout Handler
  // ---------------------------------------------------------
  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken('');
    setEmployees([]);
    setClustersData(null);
  };

  // ---------------------------------------------------------
  // CRUD: Fetch Employees
  // ---------------------------------------------------------
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await fetch(`${API_BASE_URL}/api/employees`);
      const data = await response.json();
      if (response.status === 200 && Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (error) {
      console.error('Fetch Employees Error:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ---------------------------------------------------------
  // CRUD: Add New Employee with Client-Side Validation
  // ---------------------------------------------------------
  const handleAddEmployee = async () => {
    setFormError('');

    // Client-side validation: prevent submission if fields are empty
    if (!nameInput.trim() || !positionInput.trim() || !salaryInput.trim()) {
      setFormError('All fields (Name, Position, Salary) are required.');
      return;
    }

    const numericSalary = Number(salaryInput);
    if (Number.isNaN(numericSalary) || numericSalary <= 0) {
      setFormError('Salary must be a valid positive number.');
      return;
    }

    try {
      setAddingEmployee(true);
      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameInput.trim(),
          position: positionInput.trim(),
          salary: numericSalary,
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        setNameInput('');
        setPositionInput('');
        setSalaryInput('');
        setFormError('');
        // Refresh employees list
        fetchEmployees();
        // If clusters are already shown, re-analyze to update calculations
        if (clustersData) {
          handleAnalyzeSalary();
        }
      } else {
        setFormError(data.message || 'Failed to add employee');
      }
    } catch (error) {
      setFormError('Network error while adding employee');
    } finally {
      setAddingEmployee(false);
    }
  };

  // ---------------------------------------------------------
  // CRUD: Toggle Employee Status
  // ---------------------------------------------------------
  const handleToggleStatus = async (employeeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/status`, {
        method: 'PUT',
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        // Update local list immediately
        setEmployees((prevList) =>
          prevList.map((emp) =>
            String(emp.id) === String(employeeId) ? data.employee : emp
          )
        );
      } else {
        showNotification('Error', data.message || 'Could not toggle status');
      }
    } catch (error) {
      showNotification('Error', 'Network error while updating status');
    }
  };

  // ---------------------------------------------------------
  // CRUD: Delete Employee with Confirmation Alert Dialog
  // ---------------------------------------------------------
  const executeDeleteEmployee = async (employeeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        // Remove from list
        setEmployees((prevList) =>
          prevList.filter((emp) => String(emp.id) !== String(employeeId))
        );
        // Refresh clustering if active
        if (clustersData) {
          handleAnalyzeSalary();
        }
      } else {
        showNotification('Error', data.message || 'Failed to delete employee');
      }
    } catch (error) {
      showNotification('Error', 'Network error while deleting employee');
    }
  };

  const confirmDeleteEmployee = (employee) => {
    const messagePrompt = `Are you sure you want to remove ${employee.name}?`;

    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm(`Are you sure?\n${messagePrompt}`);
      if (isConfirmed) {
        executeDeleteEmployee(employee.id);
      }
    } else {
      Alert.alert(
        'Are you sure?',
        messagePrompt,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => executeDeleteEmployee(employee.id),
          },
        ],
        { cancelable: true }
      );
    }
  };

  // ---------------------------------------------------------
  // Phase 2: Analyze Salary Structure (K-Means Clustering)
  // ---------------------------------------------------------
  const handleAnalyzeSalary = async () => {
    try {
      setClusteringLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employees/salary-clusters`);
      const data = await response.json();

      if (response.status === 200 && data.success) {
        setClustersData(data.clusters);
      } else {
        showNotification('Analytics Error', data.message || 'Failed to analyze salary structure');
      }
    } catch (error) {
      showNotification('Network Error', 'Could not reach server to run clustering algorithm.');
    } finally {
      setClusteringLoading(false);
    }
  };

  // =========================================================
  // VIEW 1: LOGIN SCREEN
  // =========================================================
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.loginCenterContainer}
        >
          <View style={styles.loginCard}>
            <View style={styles.loginHeaderArea}>
              <Text style={styles.loginLogoText}>🏢 HR Portal</Text>
              <Text style={styles.loginTitleText}>HR Manager & Salary Analytics</Text>
              <Text style={styles.loginSubtitleText}>Final Exam: Internet Programming (2026)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter username (admin)"
                value={usernameInput}
                onChangeText={setUsernameInput}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter password (password123)"
                secureTextEntry
                value={passwordInput}
                onChangeText={setPasswordInput}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loginLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Demo Credentials:</Text>
              <Text style={styles.hintText}>Username: <Text style={styles.boldText}>admin</Text></Text>
              <Text style={styles.hintText}>Password: <Text style={styles.boldText}>password123</Text></Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // =========================================================
  // VIEW 2: DASHBOARD SCREEN (CRUD + K-MEANS ANALYTICS)
  // =========================================================
  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.dashboardScrollContainer}>
        {/* Top Navigation Bar */}
        <View style={styles.navbar}>
          <View>
            <Text style={styles.navTitle}>HR Manager Dashboard</Text>
            <Text style={styles.navSubtitle}>Internet Programming Final 2026</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Phase 2: Salary Clustering Analytics Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>🧠 Phase 2: Salary Clustering Analytics</Text>
              <Text style={styles.sectionDescription}>
                1D K-Means algorithm (k=3) groups employee salaries into 3 tiers.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.analyticsButton, clusteringLoading && styles.disabledButton]}
            onPress={handleAnalyzeSalary}
            disabled={clusteringLoading}
          >
            {clusteringLoading ? (
              <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : null}
            <Text style={styles.analyticsButtonText}>
              {clusteringLoading ? 'Analyzing Salaries...' : '📊 Analyze Salary Structure'}
            </Text>
          </TouchableOpacity>

          {/* Loading Indicator while waiting for server's response */}
          {clusteringLoading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Running 1D K-Means clustering algorithm...</Text>
            </View>
          )}

          {/* Cluster Summary Cards */}
          {clustersData && !clusteringLoading && (
            <View style={styles.clustersContainer}>
              <Text style={styles.clustersTitle}>Clustering Results (k=3 Tiers):</Text>
              <View style={styles.cardsGrid}>
                {clustersData.map((clusterItem, idx) => {
                  const tierColors = [
                    { bg: '#EFF6FF', border: '#3B82F6', badge: '#DBEAFE', text: '#1D4ED8' },
                    { bg: '#F5F3FF', border: '#8B5CF6', badge: '#EDE9FE', text: '#6D28D9' },
                    { bg: '#FFFBEB', border: '#F59E0B', badge: '#FEF3C7', text: '#B45309' },
                  ];
                  const colorScheme = tierColors[idx % 3];

                  return (
                    <View
                      key={clusterItem.group}
                      style={[
                        styles.summaryCard,
                        { backgroundColor: colorScheme.bg, borderColor: colorScheme.border },
                      ]}
                    >
                      <View style={[styles.tierBadge, { backgroundColor: colorScheme.badge }]}>
                        <Text style={[styles.tierBadgeText, { color: colorScheme.text }]}>
                          {clusterItem.group}
                        </Text>
                      </View>
                      <Text style={styles.cardCentroidLabel}>Average Base Salary</Text>
                      <Text style={[styles.cardCentroidValue, { color: colorScheme.text }]}>
                        ฿{Number(clusterItem.centroid).toLocaleString()}
                      </Text>
                      <View style={styles.cardCountRow}>
                        <Text style={styles.cardCountLabel}>Employees:</Text>
                        <Text style={styles.cardCountValue}>{clusterItem.count} people</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Phase 1: Add Employee Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>➕ Add New Employee</Text>
          <Text style={styles.sectionDescription}>
            Enter employee details. All fields are required before submission.
          </Text>

          {formError ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>⚠️ {formError}</Text>
            </View>
          ) : null}

          <View style={styles.formRow}>
            <View style={styles.formInputFlex}>
              <Text style={styles.inputLabel}>Employee Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Alex Johnson"
                value={nameInput}
                onChangeText={setNameInput}
              />
            </View>
            <View style={styles.formInputFlex}>
              <Text style={styles.inputLabel}>Position / Role *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Frontend Engineer"
                value={positionInput}
                onChangeText={setPositionInput}
              />
            </View>
            <View style={styles.formInputFlex}>
              <Text style={styles.inputLabel}>Salary (THB) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 50000"
                keyboardType="numeric"
                value={salaryInput}
                onChangeText={setSalaryInput}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addEmployeeButton, addingEmployee && styles.disabledButton]}
            onPress={handleAddEmployee}
            disabled={addingEmployee}
          >
            {addingEmployee ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.addEmployeeButtonText}>Add Employee Record</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Phase 1: Employee Records List */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>👥 Employee Records List</Text>
              <Text style={styles.sectionDescription}>
                Total: {employees.length} employees currently recorded.
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchEmployees}>
              <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>

          {loadingEmployees ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading employee records...</Text>
            </View>
          ) : employees.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No employees found. Add one above!</Text>
            </View>
          ) : (
            employees.map((emp) => {
              const isActive = emp.status === 'Active';
              return (
                <View key={emp.id} style={styles.employeeCard}>
                  <View style={styles.employeeInfoCol}>
                    <View style={styles.employeeNameRow}>
                      <Text style={styles.employeeNameText}>{emp.name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isActive ? styles.statusActive : styles.statusOnLeave,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isActive ? styles.statusActiveText : styles.statusOnLeaveText,
                          ]}
                        >
                          {emp.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.employeePositionText}>💼 {emp.position}</Text>
                    <Text style={styles.employeeSalaryText}>
                      💰 ฿{Number(emp.salary).toLocaleString()} / month
                    </Text>
                  </View>

                  <View style={styles.employeeActionCol}>
                    <TouchableOpacity
                      style={styles.toggleStatusButton}
                      onPress={() => handleToggleStatus(emp.id)}
                    >
                      <Text style={styles.toggleStatusButtonText}>
                        Toggle Status ({isActive ? 'To Leave' : 'To Active'})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => confirmDeleteEmployee(emp)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------
// STYLESHEET
// ---------------------------------------------------------
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // Login Styles
  loginCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loginHeaderArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loginLogoText: {
    fontSize: 32,
    marginBottom: 8,
  },
  loginTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  loginSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  hintBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
  },
  boldText: {
    fontWeight: '700',
    color: '#1E293B',
  },

  // Dashboard Styles
  dashboardScrollContainer: {
    padding: 20,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  navSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  refreshButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 13,
  },

  // Analytics Styles
  analyticsButton: {
    backgroundColor: '#4338CA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 12,
  },
  analyticsButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  clustersContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  clustersTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: 200,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  tierBadgeText: {
    fontWeight: '700',
    fontSize: 13,
  },
  cardCentroidLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  cardCentroidValue: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 4,
  },
  cardCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  cardCountLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  cardCountValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Form Styles
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  formInputFlex: {
    flex: 1,
    minWidth: 180,
  },
  addEmployeeButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  addEmployeeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  errorAlertText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },

  // Employee Card Styles
  employeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 10,
  },
  employeeInfoCol: {
    flex: 1,
    minWidth: 220,
  },
  employeeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  employeeNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusActiveText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  statusOnLeave: {
    backgroundColor: '#FEF3C7',
  },
  statusOnLeaveText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  employeePositionText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 2,
  },
  employeeSalaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  employeeActionCol: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  toggleStatusButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  toggleStatusButtonText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
