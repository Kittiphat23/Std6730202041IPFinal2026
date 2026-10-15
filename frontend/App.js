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
import { API_BASE_URL_THONGPHUM } from './config';

export default function App() {
  // Navigation & Auth States
  const [isLoggedInTHONGPHUM, setIsLoggedInTHONGPHUM] = useState(false);
  const [authTokenTHONGPHUM, setAuthTokenTHONGPHUM] = useState('');
  const [usernameInputTHONGPHUM, setUsernameInputTHONGPHUM] = useState('admin');
  const [passwordInputTHONGPHUM, setPasswordInputTHONGPHUM] = useState('password123');
  const [loginLoadingTHONGPHUM, setLoginLoadingTHONGPHUM] = useState(false);

  // Employee CRUD States
  const [employeesTHONGPHUM, setEmployeesTHONGPHUM] = useState([]);
  const [loadingEmployeesTHONGPHUM, setLoadingEmployeesTHONGPHUM] = useState(false);
  const [nameInputTHONGPHUM, setNameInputTHONGPHUM] = useState('');
  const [positionInputTHONGPHUM, setPositionInputTHONGPHUM] = useState('');
  const [salaryInputTHONGPHUM, setSalaryInputTHONGPHUM] = useState('');
  const [formErrorTHONGPHUM, setFormErrorTHONGPHUM] = useState('');
  const [addingEmployeeTHONGPHUM, setAddingEmployeeTHONGPHUM] = useState(false);

  // Salary Analytics (K-Means) States
  const [clusteringLoadingTHONGPHUM, setClusteringLoadingTHONGPHUM] = useState(false);
  const [clustersDataTHONGPHUM, setClustersDataTHONGPHUM] = useState(null);

  // Custom Alert helper for cross-platform (Native + Web)
  const showNotificationTHONGPHUM = (titleTHONGPHUM, messageTHONGPHUM) => {
    if (Platform.OS === 'web') {
      window.alert(`${titleTHONGPHUM}: ${messageTHONGPHUM}`);
    } else {
      Alert.alert(titleTHONGPHUM, messageTHONGPHUM);
    }
  };

  // ---------------------------------------------------------
  // Authentication: Login Handler
  // ---------------------------------------------------------
  const handleLoginTHONGPHUM = async () => {
    if (!usernameInputTHONGPHUM.trim() || !passwordInputTHONGPHUM.trim()) {
      showNotificationTHONGPHUM('Login Failed', 'Please enter both username and password.');
      return;
    }

    try {
      setLoginLoadingTHONGPHUM(true);
      const responseTHONGPHUM = await fetch(`${API_BASE_URL_THONGPHUM}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: usernameInputTHONGPHUM.trim(),
          password: passwordInputTHONGPHUM.trim(),
        }),
      });

      const dataTHONGPHUM = await responseTHONGPHUM.json();

      if (responseTHONGPHUM.status === 200 && dataTHONGPHUM.success) {
        setAuthTokenTHONGPHUM(dataTHONGPHUM.token);
        setIsLoggedInTHONGPHUM(true);
        fetchEmployeesTHONGPHUM();
      } else {
        showNotificationTHONGPHUM('Login Failed', dataTHONGPHUM.message || 'Invalid username or password');
      }
    } catch (errorTHONGPHUM) {
      showNotificationTHONGPHUM('Network Error', `Cannot connect to server at ${API_BASE_URL_THONGPHUM}`);
    } finally {
      setLoginLoadingTHONGPHUM(false);
    }
  };

  // ---------------------------------------------------------
  // Authentication: Logout Handler
  // ---------------------------------------------------------
  const handleLogoutTHONGPHUM = () => {
    setIsLoggedInTHONGPHUM(false);
    setAuthTokenTHONGPHUM('');
    setEmployeesTHONGPHUM([]);
    setClustersDataTHONGPHUM(null);
  };

  // ---------------------------------------------------------
  // CRUD: Fetch Employees
  // ---------------------------------------------------------
  const fetchEmployeesTHONGPHUM = async () => {
    try {
      setLoadingEmployeesTHONGPHUM(true);
      const responseTHONGPHUM = await fetch(`${API_BASE_URL_THONGPHUM}/api/employees`);
      const dataTHONGPHUM = await responseTHONGPHUM.json();
      if (responseTHONGPHUM.status === 200 && Array.isArray(dataTHONGPHUM)) {
        setEmployeesTHONGPHUM(dataTHONGPHUM);
      }
    } catch (errorTHONGPHUM) {
      console.error('Fetch Employees Error:', errorTHONGPHUM);
    } finally {
      setLoadingEmployeesTHONGPHUM(false);
    }
  };

  // ---------------------------------------------------------
  // CRUD: Add New Employee with Client-Side Validation
  // ---------------------------------------------------------
  const handleAddEmployeeTHONGPHUM = async () => {
    setFormErrorTHONGPHUM('');

    // Client-side validation: prevent submission if fields are empty
    if (!nameInputTHONGPHUM.trim() || !positionInputTHONGPHUM.trim() || !salaryInputTHONGPHUM.trim()) {
      setFormErrorTHONGPHUM('All fields (Name, Position, Salary) are required.');
      return;
    }

    const numericSalaryTHONGPHUM = Number(salaryInputTHONGPHUM);
    if (Number.isNaN(numericSalaryTHONGPHUM) || numericSalaryTHONGPHUM <= 0) {
      setFormErrorTHONGPHUM('Salary must be a valid positive number.');
      return;
    }

    try {
      setAddingEmployeeTHONGPHUM(true);
      const responseTHONGPHUM = await fetch(`${API_BASE_URL_THONGPHUM}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameInputTHONGPHUM.trim(),
          position: positionInputTHONGPHUM.trim(),
          salary: numericSalaryTHONGPHUM,
        }),
      });

      const dataTHONGPHUM = await responseTHONGPHUM.json();

      if (responseTHONGPHUM.status === 201) {
        setNameInputTHONGPHUM('');
        setPositionInputTHONGPHUM('');
        setSalaryInputTHONGPHUM('');
        setFormErrorTHONGPHUM('');
        // Refresh employees list
        fetchEmployeesTHONGPHUM();
        // If clusters are already shown, re-analyze to update calculations
        if (clustersDataTHONGPHUM) {
          handleAnalyzeSalaryTHONGPHUM();
        }
      } else {
        setFormErrorTHONGPHUM(dataTHONGPHUM.message || 'Failed to add employee');
      }
    } catch (errorTHONGPHUM) {
      setFormErrorTHONGPHUM('Network error while adding employee');
    } finally {
      setAddingEmployeeTHONGPHUM(false);
    }
  };

  // ---------------------------------------------------------
  // CRUD: Toggle Employee Status
  // ---------------------------------------------------------
  const handleToggleStatusTHONGPHUM = async (employeeIdTHONGPHUM) => {
    try {
      const responseTHONGPHUM = await fetch(`${API_BASE_URL_THONGPHUM}/api/employees/${employeeIdTHONGPHUM}/status`, {
        method: 'PUT',
      });
      const dataTHONGPHUM = await responseTHONGPHUM.json();
      if (responseTHONGPHUM.status === 200 && dataTHONGPHUM.success) {
        // Update local list immediately
        setEmployeesTHONGPHUM((prevListTHONGPHUM) =>
          prevListTHONGPHUM.map((empTHONGPHUM) =>
            String(empTHONGPHUM.id) === String(employeeIdTHONGPHUM) ? dataTHONGPHUM.employee : empTHONGPHUM
          )
        );
      } else {
        showNotificationTHONGPHUM('Error', dataTHONGPHUM.message || 'Could not toggle status');
      }
    } catch (errorTHONGPHUM) {
      showNotificationTHONGPHUM('Error', 'Network error while updating status');
    }
  };

  // ---------------------------------------------------------
  // CRUD: Delete Employee with Confirmation Alert Dialog
  // ---------------------------------------------------------
  const executeDeleteEmployeeTHONGPHUM = async (employeeIdTHONGPHUM) => {
    try {
      const responseTHONGPHUM = await fetch(`${API_BASE_URL_THONGPHUM}/api/employees/${employeeIdTHONGPHUM}`, {
        method: 'DELETE',
      });
      const dataTHONGPHUM = await responseTHONGPHUM.json();
      if (responseTHONGPHUM.status === 200 && dataTHONGPHUM.success) {
        // Remove from list
        setEmployeesTHONGPHUM((prevListTHONGPHUM) =>
          prevListTHONGPHUM.filter((empTHONGPHUM) => String(empTHONGPHUM.id) !== String(employeeIdTHONGPHUM))
        );
        // Refresh clustering if active
        if (clustersDataTHONGPHUM) {
          handleAnalyzeSalaryTHONGPHUM();
        }
      } else {
        showNotificationTHONGPHUM('Error', dataTHONGPHUM.message || 'Failed to delete employee');
      }
    } catch (errorTHONGPHUM) {
      showNotificationTHONGPHUM('Error', 'Network error while deleting employee');
    }
  };

  const confirmDeleteEmployeeTHONGPHUM = (employeeTHONGPHUM) => {
    const messagePromptTHONGPHUM = `Are you sure you want to remove ${employeeTHONGPHUM.name}?`;

    if (Platform.OS === 'web') {
      const isConfirmedTHONGPHUM = window.confirm(`Are you sure?\n${messagePromptTHONGPHUM}`);
      if (isConfirmedTHONGPHUM) {
        executeDeleteEmployeeTHONGPHUM(employeeTHONGPHUM.id);
      }
    } else {
      Alert.alert(
        'Are you sure?',
        messagePromptTHONGPHUM,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => executeDeleteEmployeeTHONGPHUM(employeeTHONGPHUM.id),
          },
        ],
        { cancelable: true }
      );
    }
  };

  // ---------------------------------------------------------
  // Phase 2: Analyze Salary Structure (K-Means Clustering)
  // ---------------------------------------------------------
  const handleAnalyzeSalaryTHONGPHUM = async () => {
    try {
      setClusteringLoadingTHONGPHUM(true);
      const responseTHONGPHUM = await fetch(`${API_BASE_URL_THONGPHUM}/api/employees/salary-clusters`);
      const dataTHONGPHUM = await responseTHONGPHUM.json();

      if (responseTHONGPHUM.status === 200 && dataTHONGPHUM.success) {
        setClustersDataTHONGPHUM(dataTHONGPHUM.clusters);
      } else {
        showNotificationTHONGPHUM('Analytics Error', dataTHONGPHUM.message || 'Failed to analyze salary structure');
      }
    } catch (errorTHONGPHUM) {
      showNotificationTHONGPHUM('Network Error', 'Could not reach server to run clustering algorithm.');
    } finally {
      setClusteringLoadingTHONGPHUM(false);
    }
  };

  // =========================================================
  // VIEW 1: LOGIN SCREEN
  // =========================================================
  if (!isLoggedInTHONGPHUM) {
    return (
      <SafeAreaView style={stylesTHONGPHUM.screenContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={stylesTHONGPHUM.loginCenterContainer}
        >
          <View style={stylesTHONGPHUM.loginCard}>
            <View style={stylesTHONGPHUM.loginHeaderArea}>
              <Text style={stylesTHONGPHUM.loginLogoText}>🏢 HR Portal</Text>
              <Text style={stylesTHONGPHUM.loginTitleText}>HR Manager & Salary Analytics</Text>
              <Text style={stylesTHONGPHUM.loginSubtitleText}>Final Exam: Internet Programming (2026)</Text>
            </View>

            <View style={stylesTHONGPHUM.inputGroup}>
              <Text style={stylesTHONGPHUM.inputLabel}>Username</Text>
              <TextInput
                style={stylesTHONGPHUM.textInput}
                placeholder="Enter username (admin)"
                value={usernameInputTHONGPHUM}
                onChangeText={setUsernameInputTHONGPHUM}
                autoCapitalize="none"
              />
            </View>

            <View style={stylesTHONGPHUM.inputGroup}>
              <Text style={stylesTHONGPHUM.inputLabel}>Password</Text>
              <TextInput
                style={stylesTHONGPHUM.textInput}
                placeholder="Enter password (password123)"
                secureTextEntry
                value={passwordInputTHONGPHUM}
                onChangeText={setPasswordInputTHONGPHUM}
              />
            </View>

            <TouchableOpacity
              style={[stylesTHONGPHUM.primaryButton, loginLoadingTHONGPHUM && stylesTHONGPHUM.disabledButton]}
              onPress={handleLoginTHONGPHUM}
              disabled={loginLoadingTHONGPHUM}
            >
              {loginLoadingTHONGPHUM ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={stylesTHONGPHUM.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={stylesTHONGPHUM.hintBox}>
              <Text style={stylesTHONGPHUM.hintTitle}>Demo Credentials:</Text>
              <Text style={stylesTHONGPHUM.hintText}>Username: <Text style={stylesTHONGPHUM.boldText}>admin</Text></Text>
              <Text style={stylesTHONGPHUM.hintText}>Password: <Text style={stylesTHONGPHUM.boldText}>password123</Text></Text>
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
    <SafeAreaView style={stylesTHONGPHUM.screenContainer}>
      <ScrollView contentContainerStyle={stylesTHONGPHUM.dashboardScrollContainer}>
        {/* Top Navigation Bar */}
        <View style={stylesTHONGPHUM.navbar}>
          <View>
            <Text style={stylesTHONGPHUM.navTitle}>HR Manager Dashboard</Text>
            <Text style={stylesTHONGPHUM.navSubtitle}>Internet Programming Final 2026</Text>
          </View>
          <TouchableOpacity style={stylesTHONGPHUM.logoutButton} onPress={handleLogoutTHONGPHUM}>
            <Text style={stylesTHONGPHUM.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Phase 2: Salary Clustering Analytics Section */}
        <View style={stylesTHONGPHUM.sectionCard}>
          <View style={stylesTHONGPHUM.sectionHeaderRow}>
            <View>
              <Text style={stylesTHONGPHUM.sectionTitle}>🧠 Phase 2: Salary Clustering Analytics</Text>
              <Text style={stylesTHONGPHUM.sectionDescription}>
                1D K-Means algorithm (k=3) groups employee salaries into 3 tiers.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[stylesTHONGPHUM.analyticsButton, clusteringLoadingTHONGPHUM && stylesTHONGPHUM.disabledButton]}
            onPress={handleAnalyzeSalaryTHONGPHUM}
            disabled={clusteringLoadingTHONGPHUM}
          >
            {clusteringLoadingTHONGPHUM ? (
              <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : null}
            <Text style={stylesTHONGPHUM.analyticsButtonText}>
              {clusteringLoadingTHONGPHUM ? 'Analyzing Salaries...' : '📊 Analyze Salary Structure'}
            </Text>
          </TouchableOpacity>

          {/* Loading Indicator while waiting for server's response */}
          {clusteringLoadingTHONGPHUM && (
            <View style={stylesTHONGPHUM.loadingBox}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={stylesTHONGPHUM.loadingText}>Running 1D K-Means clustering algorithm...</Text>
            </View>
          )}

          {/* Cluster Summary Cards */}
          {clustersDataTHONGPHUM && !clusteringLoadingTHONGPHUM && (
            <View style={stylesTHONGPHUM.clustersContainer}>
              <Text style={stylesTHONGPHUM.clustersTitle}>Clustering Results (k=3 Tiers):</Text>
              <View style={stylesTHONGPHUM.cardsGrid}>
                {clustersDataTHONGPHUM.map((clusterItemTHONGPHUM, idxTHONGPHUM) => {
                  const tierColorsTHONGPHUM = [
                    { bg: '#EFF6FF', border: '#3B82F6', badge: '#DBEAFE', text: '#1D4ED8' },
                    { bg: '#F5F3FF', border: '#8B5CF6', badge: '#EDE9FE', text: '#6D28D9' },
                    { bg: '#FFFBEB', border: '#F59E0B', badge: '#FEF3C7', text: '#B45309' },
                  ];
                  const colorSchemeTHONGPHUM = tierColorsTHONGPHUM[idxTHONGPHUM % 3];

                  return (
                    <View
                      key={clusterItemTHONGPHUM.group}
                      style={[
                        stylesTHONGPHUM.summaryCard,
                        { backgroundColor: colorSchemeTHONGPHUM.bg, borderColor: colorSchemeTHONGPHUM.border },
                      ]}
                    >
                      <View style={[stylesTHONGPHUM.tierBadge, { backgroundColor: colorSchemeTHONGPHUM.badge }]}>
                        <Text style={[stylesTHONGPHUM.tierBadgeText, { color: colorSchemeTHONGPHUM.text }]}>
                          {clusterItemTHONGPHUM.group}
                        </Text>
                      </View>
                      <Text style={stylesTHONGPHUM.cardCentroidLabel}>Average Base Salary</Text>
                      <Text style={[stylesTHONGPHUM.cardCentroidValue, { color: colorSchemeTHONGPHUM.text }]}>
                        ฿{Number(clusterItemTHONGPHUM.centroid).toLocaleString()}
                      </Text>
                      <View style={stylesTHONGPHUM.cardCountRow}>
                        <Text style={stylesTHONGPHUM.cardCountLabel}>Employees:</Text>
                        <Text style={stylesTHONGPHUM.cardCountValue}>{clusterItemTHONGPHUM.count} people</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Phase 1: Add Employee Form */}
        <View style={stylesTHONGPHUM.sectionCard}>
          <Text style={stylesTHONGPHUM.sectionTitle}>➕ Add New Employee</Text>
          <Text style={stylesTHONGPHUM.sectionDescription}>
            Enter employee details. All fields are required before submission.
          </Text>

          {formErrorTHONGPHUM ? (
            <View style={stylesTHONGPHUM.errorAlert}>
              <Text style={stylesTHONGPHUM.errorAlertText}>⚠️ {formErrorTHONGPHUM}</Text>
            </View>
          ) : null}

          <View style={stylesTHONGPHUM.formRow}>
            <View style={stylesTHONGPHUM.formInputFlex}>
              <Text style={stylesTHONGPHUM.inputLabel}>Employee Name *</Text>
              <TextInput
                style={stylesTHONGPHUM.textInput}
                placeholder="e.g. Alex Johnson"
                value={nameInputTHONGPHUM}
                onChangeText={setNameInputTHONGPHUM}
              />
            </View>
            <View style={stylesTHONGPHUM.formInputFlex}>
              <Text style={stylesTHONGPHUM.inputLabel}>Position / Role *</Text>
              <TextInput
                style={stylesTHONGPHUM.textInput}
                placeholder="e.g. Frontend Engineer"
                value={positionInputTHONGPHUM}
                onChangeText={setPositionInputTHONGPHUM}
              />
            </View>
            <View style={stylesTHONGPHUM.formInputFlex}>
              <Text style={stylesTHONGPHUM.inputLabel}>Salary (THB) *</Text>
              <TextInput
                style={stylesTHONGPHUM.textInput}
                placeholder="e.g. 50000"
                keyboardType="numeric"
                value={salaryInputTHONGPHUM}
                onChangeText={setSalaryInputTHONGPHUM}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[stylesTHONGPHUM.addEmployeeButton, addingEmployeeTHONGPHUM && stylesTHONGPHUM.disabledButton]}
            onPress={handleAddEmployeeTHONGPHUM}
            disabled={addingEmployeeTHONGPHUM}
          >
            {addingEmployeeTHONGPHUM ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={stylesTHONGPHUM.addEmployeeButtonText}>Add Employee Record</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Phase 1: Employee Records List */}
        <View style={stylesTHONGPHUM.sectionCard}>
          <View style={stylesTHONGPHUM.sectionHeaderRow}>
            <View>
              <Text style={stylesTHONGPHUM.sectionTitle}>👥 Employee Records List</Text>
              <Text style={stylesTHONGPHUM.sectionDescription}>
                Total: {employeesTHONGPHUM.length} employees currently recorded.
              </Text>
            </View>
            <TouchableOpacity style={stylesTHONGPHUM.refreshButton} onPress={fetchEmployeesTHONGPHUM}>
              <Text style={stylesTHONGPHUM.refreshButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>

          {loadingEmployeesTHONGPHUM ? (
            <View style={stylesTHONGPHUM.loadingBox}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={stylesTHONGPHUM.loadingText}>Loading employee records...</Text>
            </View>
          ) : employeesTHONGPHUM.length === 0 ? (
            <View style={stylesTHONGPHUM.emptyBox}>
              <Text style={stylesTHONGPHUM.emptyText}>No employees found. Add one above!</Text>
            </View>
          ) : (
            employeesTHONGPHUM.map((empTHONGPHUM) => {
              const isActiveTHONGPHUM = empTHONGPHUM.status === 'Active';
              return (
                <View key={empTHONGPHUM.id} style={stylesTHONGPHUM.employeeCard}>
                  <View style={stylesTHONGPHUM.employeeInfoCol}>
                    <View style={stylesTHONGPHUM.employeeNameRow}>
                      <Text style={stylesTHONGPHUM.employeeNameText}>{empTHONGPHUM.name}</Text>
                      <View
                        style={[
                          stylesTHONGPHUM.statusBadge,
                          isActiveTHONGPHUM ? stylesTHONGPHUM.statusActive : stylesTHONGPHUM.statusOnLeave,
                        ]}
                      >
                        <Text
                          style={[
                            stylesTHONGPHUM.statusBadgeText,
                            isActiveTHONGPHUM ? stylesTHONGPHUM.statusActiveText : stylesTHONGPHUM.statusOnLeaveText,
                          ]}
                        >
                          {empTHONGPHUM.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={stylesTHONGPHUM.employeePositionText}>💼 {empTHONGPHUM.position}</Text>
                    <Text style={stylesTHONGPHUM.employeeSalaryText}>
                      💰 ฿{Number(empTHONGPHUM.salary).toLocaleString()} / month
                    </Text>
                  </View>

                  <View style={stylesTHONGPHUM.employeeActionCol}>
                    <TouchableOpacity
                      style={stylesTHONGPHUM.toggleStatusButton}
                      onPress={() => handleToggleStatusTHONGPHUM(empTHONGPHUM.id)}
                    >
                      <Text style={stylesTHONGPHUM.toggleStatusButtonText}>
                        Toggle Status ({isActiveTHONGPHUM ? 'To Leave' : 'To Active'})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={stylesTHONGPHUM.deleteButton}
                      onPress={() => confirmDeleteEmployeeTHONGPHUM(empTHONGPHUM)}
                    >
                      <Text style={stylesTHONGPHUM.deleteButtonText}>🗑️ Delete</Text>
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
const stylesTHONGPHUM = StyleSheet.create({
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
