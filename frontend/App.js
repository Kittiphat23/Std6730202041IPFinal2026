import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { API_BASE_URL } from './config';

// =========================================================================
// ENTERPRISE CONSTANTS & PALETTES
// =========================================================================
const THEMES = {
  indigo: {
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4338CA',
    glow: 'rgba(99, 102, 241, 0.35)',
    accent: '#38BDF8',
  },
  emerald: {
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    glow: 'rgba(16, 185, 129, 0.35)',
    accent: '#FBBF24',
  },
  cyan: {
    primary: '#06B6D4',
    primaryLight: '#22D3EE',
    primaryDark: '#0891B2',
    glow: 'rgba(6, 182, 212, 0.35)',
    accent: '#A855F7',
  },
  rose: {
    primary: '#F43F5E',
    primaryLight: '#FB7185',
    primaryDark: '#E11D48',
    glow: 'rgba(244, 63, 94, 0.35)',
    accent: '#F59E0B',
  },
};

const AVATAR_GRADIENTS = [
  ['#6366F1', '#4F46E5'],
  ['#8B5CF6', '#7C3AED'],
  ['#EC4899', '#DB2777'],
  ['#06B6D4', '#0891B2'],
  ['#10B981', '#059669'],
  ['#F59E0B', '#D97706'],
  ['#3B82F6', '#2563EB'],
  ['#14B8A6', '#0D9488'],
];

const POSITION_SUGGESTIONS = [
  'Software Engineer',
  'Senior Developer',
  'Regional Manager',
  'Office Administrator',
  'Sales Specialist',
  'Assistant to Regional Manager',
  'Accountant',
  'Senior Sales Executive',
  'Product Designer',
  'DevOps Architect',
  'Data Scientist',
  'HR Specialist',
];

export default function App() {
  // Navigation & Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Main Dashboard Tab ('overview' | 'directory' | 'analytics' | 'onboard' | 'audit')
  const [activeTab, setActiveTab] = useState('overview');

  // Employee CRUD States
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Add Employee Form States
  const [nameInput, setNameInput] = useState('');
  const [positionInput, setPositionInput] = useState('');
  const [salaryInput, setSalaryInput] = useState('');
  const [formError, setFormError] = useState('');
  const [addingEmployee, setAddingEmployee] = useState(false);

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('id-asc'); // 'id-asc' | 'salary-desc' | 'salary-asc' | 'name-asc'
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'

  // Salary Analytics (K-Means) States
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [clustersData, setClustersData] = useState(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState(null);

  // Modal & Inspector States
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Toast Notification System
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info'); // 'success' | 'error' | 'info'

  // System Theme
  const [currentThemeKey, setCurrentThemeKey] = useState('indigo');
  const activeTheme = THEMES[currentThemeKey];

  // Audit Logs (History of user actions)
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'log-1',
      action: 'SYSTEM_BOOT',
      detail: 'HR Manager & Analytics System initialized successfully',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system',
    },
  ]);

  const addAuditLog = (action, detail, type = 'info') => {
    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random()}`,
        action,
        detail,
        timestamp: new Date().toLocaleTimeString(),
        type,
      },
      ...prev.slice(0, 49),
    ]);
  };

  const showToast = (message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Cross-Platform Notification Helper
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
        addAuditLog('USER_LOGIN', `Admin authenticated successfully via /api/login`, 'success');
        showToast('ยินดีต้อนรับสู่ระบบ HR Analytics Suite', 'success');
        fetchEmployees();
      } else {
        showNotification('Login Failed', data.message || 'Invalid username or password');
        addAuditLog('LOGIN_FAILED', `Failed attempt with user: ${usernameInput}`, 'error');
      }
    } catch (error) {
      showNotification('Network Error', `Cannot connect to server at ${API_BASE_URL}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    addAuditLog('USER_LOGOUT', `Admin session ended`, 'info');
    setIsLoggedIn(false);
    setAuthToken('');
    setEmployees([]);
    setClustersData(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
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
        addAuditLog('DATA_REFRESH', `Fetched ${data.length} records from database`, 'info');
      }
    } catch (error) {
      console.error('Fetch Employees Error:', error);
      showToast('ไม่สามารถดึงข้อมูลพนักงานได้', 'error');
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ---------------------------------------------------------
  // CRUD: Add New Employee with Client-Side Validation
  // ---------------------------------------------------------
  const handleAddEmployee = async () => {
    setFormError('');

    if (!nameInput.trim() || !positionInput.trim() || !salaryInput.trim()) {
      setFormError('กรุณากรอกข้อมูลให้ครบทุกช่อง (ชื่อ, ตำแหน่ง, เงินเดือน)');
      showToast('กรุณากรอกข้อมูลให้ครบทุกช่อง', 'error');
      return;
    }

    const numericSalary = Number(salaryInput);
    if (Number.isNaN(numericSalary) || numericSalary <= 0) {
      setFormError('เงินเดือนต้องเป็นตัวเลขที่มากกว่า 0');
      showToast('เงินเดือนต้องเป็นตัวเลขที่ถูกต้อง', 'error');
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
        addAuditLog('EMPLOYEE_CREATED', `Added new employee: ${data.employee.name} (฿${numericSalary.toLocaleString()})`, 'success');
        showToast(`บันทึกข้อมูล ${data.employee.name} สำเร็จ!`, 'success');
        fetchEmployees();
        if (clustersData) {
          handleAnalyzeSalary();
        }
      } else {
        setFormError(data.message || 'ไม่สามารถเพิ่มข้อมูลพนักงานได้');
      }
    } catch (error) {
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
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
        setEmployees((prevList) =>
          prevList.map((emp) =>
            String(emp.id) === String(employeeId) ? data.employee : emp
          )
        );
        addAuditLog('STATUS_TOGGLED', `Changed ${data.employee.name} status to [${data.employee.status}]`, 'info');
        showToast(`เปลี่ยนสถานะของ ${data.employee.name} เป็น ${data.employee.status}`, 'info');
      } else {
        showNotification('Error', data.message || 'ไม่สามารถเปลี่ยนสถานะได้');
      }
    } catch (error) {
      showNotification('Error', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
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
        const deletedName = data.deletedEmployee?.name || `ID #${employeeId}`;
        setEmployees((prevList) =>
          prevList.filter((emp) => String(emp.id) !== String(employeeId))
        );
        addAuditLog('EMPLOYEE_DELETED', `Removed record for ${deletedName}`, 'error');
        showToast(`ลบข้อมูล ${deletedName} ออกจากระบบเรียบร้อยแล้ว`, 'error');
        if (clustersData) {
          handleAnalyzeSalary();
        }
      } else {
        showNotification('Error', data.message || 'ไม่สามารถลบพนักงานได้');
      }
    } catch (error) {
      showNotification('Error', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const confirmDeleteEmployee = (employee) => {
    const messagePrompt = `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล "${employee.name}" ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้`;

    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm(`Are you sure?\n\n${messagePrompt}`);
      if (isConfirmed) {
        executeDeleteEmployee(employee.id);
      }
    } else {
      Alert.alert(
        'Are you sure?',
        messagePrompt,
        [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'ยืนยันการลบ',
            style: 'destructive',
            onPress: () => executeDeleteEmployee(employee.id),
          },
        ],
        { cancelable: true }
      );
    }
  };

  // ---------------------------------------------------------
  // Phase 2: K-Means Salary Clustering Analytics
  // ---------------------------------------------------------
  const handleAnalyzeSalary = async () => {
    try {
      setClusteringLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employees/salary-clusters`);
      const data = await response.json();

      if (response.status === 200 && data.success) {
        setClustersData(data.clusters);
        setLastAnalyzedAt(new Date().toLocaleTimeString());
        addAuditLog('KMEANS_COMPUTED', `Analyzed salaries into 3 tiers with K-Means`, 'success');
        showToast('การวิเคราะห์ K-Means Clustering สำเร็จแล้ว!', 'success');
      } else {
        showNotification('Analytics Error', data.message || 'ไม่สามารถวิเคราะห์ข้อมูลเงินเดือนได้');
      }
    } catch (error) {
      showNotification('Network Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อประมวลผล K-Means ได้');
    } finally {
      setClusteringLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Computed Advanced Metrics & Insights
  // ---------------------------------------------------------
  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;

  const salaryStats = useMemo(() => {
    if (totalEmployees === 0) return { min: 0, max: 0, avg: 0, median: 0, totalPayroll: 0 };
    const numbers = employees.map((e) => Number(e.salary)).sort((a, b) => a - b);
    const totalPayroll = numbers.reduce((sum, v) => sum + v, 0);
    const avg = Math.round(totalPayroll / numbers.length);
    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    const mid = Math.floor(numbers.length / 2);
    const median = numbers.length % 2 !== 0 ? numbers[mid] : Math.round((numbers[mid - 1] + numbers[mid]) / 2);
    return { min, max, avg, median, totalPayroll };
  }, [employees]);

  // Filtered & Sorted Employees
  const filteredAndSortedEmployees = useMemo(() => {
    let result = employees.filter((emp) => {
      const matchSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' ? true : emp.status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (sortBy === 'salary-desc') {
      result.sort((a, b) => Number(b.salary) - Number(a.salary));
    } else if (sortBy === 'salary-asc') {
      result.sort((a, b) => Number(a.salary) - Number(b.salary));
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => Number(a.id) - Number(b.id));
    }

    return result;
  }, [employees, searchQuery, statusFilter, sortBy]);

  const getInitials = (name) => {
    if (!name) return 'HR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // =========================================================
  // VIEW 1: ENTERPRISE CYBER LOGIN SCREEN
  // =========================================================
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginWrapper}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.loginCenterBox}
        >
          {/* Ambient Lighting Orbs */}
          <View style={styles.ambientLightOne} />
          <View style={styles.ambientLightTwo} />
          <View style={styles.ambientLightThree} />

          <View style={styles.loginGlassmorphismCard}>
            {/* Top Brand Seal */}
            <View style={styles.sealArea}>
              <View style={[styles.glowingEmblem, { backgroundColor: activeTheme.primary }]}>
                <Text style={styles.emblemIcon}>⚛</Text>
              </View>
              <Text style={styles.superKickerText}>EXECUTIVE CLOUD PLATFORM</Text>
              <Text style={styles.headlineLoginTitle}>HR Analytics & Payroll Intelligence</Text>
              <Text style={styles.subLoginDescription}>
                Final Examination: Internet Programming 2026 (Semester 2)
              </Text>
            </View>

            {/* Credential Inputs */}
            <View style={styles.loginInputFormStack}>
              <View style={styles.styledInputGroup}>
                <Text style={styles.fieldMicroLabel}>ADMINISTRATOR ID</Text>
                <TextInput
                  style={styles.styledDarkInput}
                  placeholder="Enter administrator username (admin)"
                  placeholderTextColor="#64748B"
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.styledInputGroup}>
                <Text style={styles.fieldMicroLabel}>AUTHORIZATION KEY</Text>
                <TextInput
                  style={styles.styledDarkInput}
                  placeholder="Enter security password (password123)"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.cyberSubmitButton,
                  { backgroundColor: activeTheme.primary, shadowColor: activeTheme.primary },
                  loginLoading && styles.btnLoadingState,
                ]}
                onPress={handleLogin}
                disabled={loginLoading}
                activeOpacity={0.88}
              >
                {loginLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.cyberSubmitButtonText}>AUTHENTICATE & ENTER PORTAL →</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Fill Credentials Bar */}
            <View style={styles.demoFillBanner}>
              <View style={styles.demoPillRow}>
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>DEMO CREDS</Text>
                </View>
                <Text style={styles.demoHintText}>แตะด้านล่างเพื่อกรอกรหัสผ่านทันที</Text>
              </View>

              <TouchableOpacity
                style={styles.demoTapCard}
                onPress={() => {
                  setUsernameInput('admin');
                  setPasswordInput('password123');
                  showToast('กรอกข้อมูลบัญชีทดสอบเรียบร้อยแล้ว', 'info');
                }}
              >
                <Text style={styles.demoCredLabel}>
                  User: <Text style={styles.demoCredValue}>admin</Text>
                </Text>
                <Text style={styles.demoCredSeparator}>•</Text>
                <Text style={styles.demoCredLabel}>
                  Pass: <Text style={styles.demoCredValue}>password123</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* System Status Footnote */}
            <View style={styles.loginFooterRow}>
              <View style={styles.greenBeacon} />
              <Text style={styles.loginFooterStatus}>
                Engine Status: Node.js Express & Metro Expo Core Online
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // =========================================================
  // VIEW 2: ULTRA LUXURY ENTERPRISE HR DASHBOARD
  // =========================================================
  return (
    <SafeAreaView style={styles.dashboardCanvas}>
      {/* Toast Notification Bar */}
      {toastMessage && (
        <View
          style={[
            styles.floatingToast,
            toastType === 'success' && styles.toastSuccess,
            toastType === 'error' && styles.toastError,
            toastType === 'info' && styles.toastInfo,
          ]}
        >
          <Text style={styles.floatingToastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.mainScrollableBody}>
        {/* =================================================== */}
        {/* HEADER SECTION: Executive Topbar                    */}
        {/* =================================================== */}
        <View style={styles.executiveHeaderCard}>
          <View style={styles.headerLeftBrand}>
            <View style={[styles.headerLogoIcon, { backgroundColor: activeTheme.primaryDark }]}>
              <Text style={styles.headerLogoEmoji}>⚡</Text>
            </View>
            <View>
              <View style={styles.headerStatusRow}>
                <Text style={styles.headerBrandTitle}>HR Intelligence Suite</Text>
                <View style={styles.activePillBadge}>
                  <View style={styles.pulseGreenOrb} />
                  <Text style={styles.activePillText}>LIVE DB ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitleText}>
                Enterprise Salary Clustering & Workforce Performance Dashboard
              </Text>
            </View>
          </View>

          <View style={styles.headerRightControls}>
            {/* Theme Picker Pills */}
            <View style={styles.themePalettePicker}>
              {Object.keys(THEMES).map((themeKey) => {
                const isSelected = currentThemeKey === themeKey;
                const tColor = THEMES[themeKey].primary;
                return (
                  <TouchableOpacity
                    key={themeKey}
                    style={[
                      styles.colorDotButton,
                      { backgroundColor: tColor },
                      isSelected && styles.colorDotSelected,
                    ]}
                    onPress={() => setCurrentThemeKey(themeKey)}
                  />
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.headerSignOutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.headerSignOutBtnText}>Sign Out ⎋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================== */}
        {/* NAVIGATION TABS BAR                                 */}
        {/* =================================================== */}
        <View style={styles.tabsStickyNav}>
          {[
            { key: 'overview', label: '📊 Overview & KPIs', badge: totalEmployees },
            { key: 'analytics', label: '🧠 Salary K-Means Lab', badge: 'k=3' },
            { key: 'directory', label: '👥 Employee Directory', badge: filteredAndSortedEmployees.length },
            { key: 'onboard', label: '➕ Onboard Staff', badge: 'New' },
            { key: 'audit', label: '📜 System Audit Log', badge: auditLogs.length },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabNavButton,
                  isSelected && [styles.tabNavButtonActive, { borderColor: activeTheme.primary }],
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabNavButtonText,
                    isSelected && [styles.tabNavButtonTextActive, { color: activeTheme.primaryLight }],
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.tabNavBadge,
                    isSelected && { backgroundColor: activeTheme.primaryDark },
                  ]}
                >
                  <Text style={styles.tabNavBadgeText}>{tab.badge}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* =================================================== */}
        {/* TAB 1: EXECUTIVE OVERVIEW & KPI DASHBOARD           */}
        {/* =================================================== */}
        {(activeTab === 'overview' || activeTab === 'analytics') && (
          <View style={styles.tabContentSection}>
            {/* KPI Metric Cards 4-Column Grid */}
            <View style={styles.kpiRowGrid}>
              <View style={[styles.kpiMetricCard, { borderTopColor: '#6366F1' }]}>
                <View style={styles.kpiCardTopRow}>
                  <Text style={styles.kpiCardLabel}>TOTAL HEADCOUNT</Text>
                  <Text style={styles.kpiCardIcon}>👥</Text>
                </View>
                <Text style={[styles.kpiMetricValue, { color: '#818CF8' }]}>
                  {totalEmployees}
                </Text>
                <View style={styles.kpiProgressWrapper}>
                  <View style={[styles.kpiProgressFill, { width: '100%', backgroundColor: '#6366F1' }]} />
                </View>
                <Text style={styles.kpiSubCaption}>Total registered workforce in system</Text>
              </View>

              <View style={[styles.kpiMetricCard, { borderTopColor: '#10B981' }]}>
                <View style={styles.kpiCardTopRow}>
                  <Text style={styles.kpiCardLabel}>ACTIVE ON-DUTY</Text>
                  <Text style={styles.kpiCardIcon}>🟢</Text>
                </View>
                <Text style={[styles.kpiMetricValue, { color: '#34D399' }]}>
                  {activeCount}
                </Text>
                <View style={styles.kpiProgressWrapper}>
                  <View
                    style={[
                      styles.kpiProgressFill,
                      {
                        width: `${totalEmployees > 0 ? (activeCount / totalEmployees) * 100 : 0}%`,
                        backgroundColor: '#10B981',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.kpiSubCaption}>
                  {totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0}% operational readiness
                </Text>
              </View>

              <View style={[styles.kpiMetricCard, { borderTopColor: '#F59E0B' }]}>
                <View style={styles.kpiCardTopRow}>
                  <Text style={styles.kpiCardLabel}>ON LEAVE / REST</Text>
                  <Text style={styles.kpiCardIcon}>🟠</Text>
                </View>
                <Text style={[styles.kpiMetricValue, { color: '#FBBF24' }]}>
                  {onLeaveCount}
                </Text>
                <View style={styles.kpiProgressWrapper}>
                  <View
                    style={[
                      styles.kpiProgressFill,
                      {
                        width: `${totalEmployees > 0 ? (onLeaveCount / totalEmployees) * 100 : 0}%`,
                        backgroundColor: '#F59E0B',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.kpiSubCaption}>
                  {totalEmployees > 0 ? Math.round((onLeaveCount / totalEmployees) * 100) : 0}% scheduled absence
                </Text>
              </View>

              <View style={[styles.kpiMetricCard, { borderTopColor: '#06B6D4' }]}>
                <View style={styles.kpiCardTopRow}>
                  <Text style={styles.kpiCardLabel}>AVERAGE MONTHLY SALARY</Text>
                  <Text style={styles.kpiCardIcon}>💰</Text>
                </View>
                <Text style={[styles.kpiMetricValue, { color: '#22D3EE' }]}>
                  ฿{salaryStats.avg.toLocaleString()}
                </Text>
                <View style={styles.kpiProgressWrapper}>
                  <View style={[styles.kpiProgressFill, { width: '85%', backgroundColor: '#06B6D4' }]} />
                </View>
                <Text style={styles.kpiSubCaption}>
                  Median: ฿{salaryStats.median.toLocaleString()} / mo
                </Text>
              </View>
            </View>

            {/* Quick Payroll Overview Banner */}
            <View style={styles.payrollSummaryStrip}>
              <View style={styles.payrollItemBlock}>
                <Text style={styles.payrollItemLabel}>TOTAL PAYROLL BUDGET</Text>
                <Text style={styles.payrollItemAmount}>
                  ฿{salaryStats.totalPayroll.toLocaleString()}
                </Text>
              </View>
              <View style={styles.payrollDivider} />
              <View style={styles.payrollItemBlock}>
                <Text style={styles.payrollItemLabel}>ENTRY LEVEL BENCHMARK</Text>
                <Text style={styles.payrollItemAmount}>
                  ฿{salaryStats.min.toLocaleString()}
                </Text>
              </View>
              <View style={styles.payrollDivider} />
              <View style={styles.payrollItemBlock}>
                <Text style={styles.payrollItemLabel}>EXECUTIVE PEAK COMPENSATION</Text>
                <Text style={styles.payrollItemAmount}>
                  ฿{salaryStats.max.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* =================================================== */}
            {/* Phase 2: K-Means Salary Analytics Deep Dive Card     */}
            {/* =================================================== */}
            <View style={styles.analyticsShowcaseCard}>
              <View style={styles.analyticsCardHeadingRow}>
                <View>
                  <View style={styles.phaseIndicatorTagRow}>
                    <View style={[styles.phaseIndicatorBadge, { backgroundColor: activeTheme.primaryDark }]}>
                      <Text style={styles.phaseIndicatorBadgeText}>🧠 AI ALGORITHM CLUSTERING</Text>
                    </View>
                    <Text style={styles.phaseMandatoryText}>PHASE 2 MANDATORY REQUIREMENT</Text>
                  </View>
                  <Text style={styles.analyticsMainHeadline}>
                    1-Dimensional K-Means Clustering Algorithm (k=3)
                  </Text>
                  <Text style={styles.analyticsSubHeadline}>
                    จำแนกและจัดกลุ่มโครงสร้างเงินเดือนของพนักงานในองค์กรออกเป็น 3 ระดับ (Tier 1, Tier 2, Tier 3) พร้อมคำนวณค่าเฉลี่ยกึ่งกลาง (Centroid) และจำนวนบุคลากรในแต่ละระดับ
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryActionTrigger,
                    { backgroundColor: activeTheme.primary, shadowColor: activeTheme.primary },
                    clusteringLoading && styles.btnLoadingState,
                  ]}
                  onPress={handleAnalyzeSalary}
                  disabled={clusteringLoading}
                  activeOpacity={0.85}
                >
                  {clusteringLoading ? (
                    <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
                  ) : (
                    <Text style={{ marginRight: 8, fontSize: 16 }}>⚡</Text>
                  )}
                  <Text style={styles.primaryActionTriggerText}>
                    {clusteringLoading ? 'Computing Iterations...' : 'Analyze Salary Structure'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Loading Indicator Spinner */}
              {clusteringLoading && (
                <View style={styles.loadingPulseContainer}>
                  <ActivityIndicator size="large" color={activeTheme.primary} />
                  <Text style={styles.loadingPulseHeadline}>Running 1D K-Means iterations...</Text>
                  <Text style={styles.loadingPulseSubline}>
                    กำลังจัดกลุ่มจุดข้อมูลเงินเดือนและคำนวณ Centroid ใหม่จนกระทั่งลู่เข้า (Convergence)
                  </Text>
                </View>
              )}

              {/* Cluster Summary Cards */}
              {clustersData && !clusteringLoading && (
                <View style={styles.clusterResultsWrapper}>
                  <View style={styles.clusterResultsTopMeta}>
                    <Text style={styles.resultsMainLabel}>
                      📊 Clustering Results Breakdown (k=3 Distinct Tiers)
                    </Text>
                    {lastAnalyzedAt && (
                      <Text style={styles.resultsTimestampText}>
                        Calculated at: {lastAnalyzedAt}
                      </Text>
                    )}
                  </View>

                  <View style={styles.clusterCardsTrioRow}>
                    {clustersData.map((cluster, index) => {
                      const tierConfigs = [
                        {
                          title: 'Tier 1 • Junior / Base',
                          subtitle: 'Operational & Entry Specialist',
                          color: '#06B6D4',
                          bg: '#082F49',
                          border: '#0284C7',
                          pillBg: 'rgba(6, 182, 212, 0.2)',
                          icon: '🌱',
                        },
                        {
                          title: 'Tier 2 • Mid-Level Pro',
                          subtitle: 'Experienced Specialists & Leads',
                          color: '#818CF8',
                          bg: '#1E1B4B',
                          border: '#4F46E5',
                          pillBg: 'rgba(99, 102, 241, 0.2)',
                          icon: '🚀',
                        },
                        {
                          title: 'Tier 3 • Executive Peak',
                          subtitle: 'Senior Leadership & Management',
                          color: '#FBBF24',
                          bg: '#451A03',
                          border: '#D97706',
                          pillBg: 'rgba(245, 158, 11, 0.2)',
                          icon: '👑',
                        },
                      ];

                      const config = tierConfigs[index % 3];
                      const tierRatio =
                        totalEmployees > 0
                          ? Math.round((cluster.count / totalEmployees) * 100)
                          : 0;

                      return (
                        <View
                          key={cluster.group}
                          style={[
                            styles.clusterTierCard,
                            { backgroundColor: config.bg, borderColor: config.border },
                          ]}
                        >
                          <View style={styles.tierCardHeader}>
                            <View style={[styles.tierGroupPill, { backgroundColor: config.pillBg }]}>
                              <Text style={[styles.tierGroupPillText, { color: config.color }]}>
                                {config.icon} {cluster.group}
                              </Text>
                            </View>
                            <Text style={styles.tierLevelCaption}>{config.subtitle}</Text>
                          </View>

                          <Text style={styles.centroidHeaderLabel}>Average Base Salary (Centroid)</Text>
                          <Text style={[styles.centroidHeroNumber, { color: config.color }]}>
                            ฿{Number(cluster.centroid).toLocaleString()}
                          </Text>

                          <View style={styles.tierDistributionFooter}>
                            <View style={styles.distributionBarTrack}>
                              <View
                                style={[
                                  styles.distributionBarFill,
                                  { width: `${tierRatio}%`, backgroundColor: config.color },
                                ]}
                              />
                            </View>

                            <View style={styles.distributionMetaRow}>
                              <Text style={styles.distributionCountText}>
                                👥 {cluster.count} Employees
                              </Text>
                              <Text style={[styles.distributionRatioText, { color: config.color }]}>
                                {tierRatio}% of workforce
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* TAB 2 & OVERVIEW: EMPLOYEE DIRECTORY & CRUD LIST    */}
        {/* =================================================== */}
        {(activeTab === 'overview' || activeTab === 'directory') && (
          <View style={styles.tabContentSection}>
            <View style={styles.directoryMasterCard}>
              <View style={styles.directoryTopBar}>
                <View>
                  <View style={styles.phaseIndicatorTagRow}>
                    <View style={[styles.phaseIndicatorBadge, { backgroundColor: '#334155' }]}>
                      <Text style={styles.phaseIndicatorBadgeText}>WORKFORCE DIRECTORY</Text>
                    </View>
                    <Text style={styles.phaseMandatoryText}>PHASE 1 MANDATORY CRUD</Text>
                  </View>
                  <Text style={styles.directoryMainHeading}>Employee Records Directory</Text>
                  <Text style={styles.directorySubHeading}>
                    รายชื่อบุคลากรทั้งหมดในระบบ ({filteredAndSortedEmployees.length} คนที่ตรงตามตัวกรอง)
                  </Text>
                </View>

                <View style={styles.directoryControlsCluster}>
                  <TouchableOpacity
                    style={styles.actionRoundPill}
                    onPress={fetchEmployees}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.actionRoundPillText}>🔄 Refresh Data</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search, Filter Tabs & Sort Controls */}
              <View style={styles.filterControlGridBar}>
                <View style={styles.searchTextInputBox}>
                  <Text style={styles.searchPrefixIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchActualInput}
                    placeholder="Search by full name or job role..."
                    placeholderTextColor="#64748B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Text style={styles.clearSearchIcon}>✕</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Status Filter Tabs */}
                <View style={styles.statusTabSelector}>
                  {['ALL', 'Active', 'On Leave'].map((tab) => {
                    const isTabActive = statusFilter === tab;
                    return (
                      <TouchableOpacity
                        key={tab}
                        style={[
                          styles.statusSelectorButton,
                          isTabActive && [styles.statusSelectorButtonActive, { backgroundColor: activeTheme.primaryDark }],
                        ]}
                        onPress={() => setStatusFilter(tab)}
                      >
                        <Text
                          style={[
                            styles.statusSelectorButtonText,
                            isTabActive && styles.statusSelectorButtonTextActive,
                          ]}
                        >
                          {tab === 'ALL' ? 'ทั้งหมด (All)' : tab}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Sort Order Dropdown simulation */}
                <View style={styles.sortToggleRow}>
                  <Text style={styles.sortMiniLabel}>SORT:</Text>
                  {[
                    { id: 'id-asc', label: 'ID' },
                    { id: 'salary-desc', label: '฿ High' },
                    { id: 'salary-asc', label: '฿ Low' },
                    { id: 'name-asc', label: 'A-Z' },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.sortPillBtn, sortBy === s.id && styles.sortPillBtnActive]}
                      onPress={() => setSortBy(s.id)}
                    >
                      <Text
                        style={[
                          styles.sortPillBtnText,
                          sortBy === s.id && styles.sortPillBtnTextActive,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Employee Cards Stream */}
              {loadingEmployees ? (
                <View style={styles.loadingPulseContainer}>
                  <ActivityIndicator size="large" color={activeTheme.primary} />
                  <Text style={styles.loadingPulseHeadline}>Loading employees from database...</Text>
                </View>
              ) : filteredAndSortedEmployees.length === 0 ? (
                <View style={styles.emptyResultsSlate}>
                  <Text style={styles.emptySlateEmoji}>📑</Text>
                  <Text style={styles.emptySlateTitle}>ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไข</Text>
                  <Text style={styles.emptySlateSubtitle}>
                    ลองปรับเปลี่ยนคำค้นหา หรือกรอกข้อมูลพนักงานใหม่ผ่านเมนู Onboarding
                  </Text>
                </View>
              ) : (
                <View style={styles.employeeCardListStack}>
                  {filteredAndSortedEmployees.map((emp, index) => {
                    const isActive = emp.status === 'Active';
                    const avatarGradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

                    return (
                      <View key={emp.id} style={styles.employeeMasterRowCard}>
                        {/* Avatar & Name Information */}
                        <View style={styles.employeeIdentityArea}>
                          <View
                            style={[
                              styles.avatarInitialsOrb,
                              { backgroundColor: avatarGradient[0] },
                            ]}
                          >
                            <Text style={styles.avatarInitialsLetters}>
                              {getInitials(emp.name)}
                            </Text>
                          </View>

                          <View style={styles.identityTextStack}>
                            <View style={styles.nameAndBadgeFlow}>
                              <Text style={styles.employeeNameHeading}>{emp.name}</Text>
                              <View
                                style={[
                                  styles.statusHaloPill,
                                  isActive ? styles.statusHaloActive : styles.statusHaloLeave,
                                ]}
                              >
                                <View
                                  style={[
                                    styles.statusGlowDot,
                                    { backgroundColor: isActive ? '#10B981' : '#F59E0B' },
                                  ]}
                                />
                                <Text
                                  style={[
                                    styles.statusHaloText,
                                    { color: isActive ? '#34D399' : '#FBBF24' },
                                  ]}
                                >
                                  {emp.status}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.employeeRoleDesignation}>💼 {emp.position}</Text>
                            <Text style={styles.employeeSalaryPill}>
                              💰 ฿{Number(emp.salary).toLocaleString()}
                              <Text style={styles.salaryPeriodSuffix}> / month</Text>
                            </Text>
                          </View>
                        </View>

                        {/* Interactive CRUD Operations Action Buttons */}
                        <View style={styles.employeeActionButtonsCluster}>
                          <TouchableOpacity
                            style={[
                              styles.actionPillButton,
                              isActive ? styles.actionPillToLeave : styles.actionPillToActive,
                            ]}
                            onPress={() => handleToggleStatus(emp.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.actionPillButtonText}>
                              {isActive ? '⇄ Toggle to On Leave' : '⇄ Toggle to Active'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionDeletePillButton}
                            onPress={() => confirmDeleteEmployee(emp)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.actionDeletePillButtonText}>🗑 Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* TAB 3 & OVERVIEW: HR ONBOARDING FORM SECTION        */}
        {/* =================================================== */}
        {(activeTab === 'overview' || activeTab === 'onboard') && (
          <View style={styles.tabContentSection}>
            <View style={styles.onboardingFormMasterCard}>
              <View style={styles.formSectionHeadingRow}>
                <View>
                  <View style={styles.phaseIndicatorTagRow}>
                    <View style={[styles.phaseIndicatorBadge, { backgroundColor: '#065F46' }]}>
                      <Text style={[styles.phaseIndicatorBadgeText, { color: '#6EE7B7' }]}>
                        ✦ TALENT ONBOARDING
                      </Text>
                    </View>
                    <Text style={styles.phaseMandatoryText}>PHASE 1 MANDATORY CRUD</Text>
                  </View>
                  <Text style={styles.formMainHeading}>Add New Employee Record</Text>
                  <Text style={styles.formSubHeading}>
                    กรอกข้อมูลบุคลากรใหม่เข้าสู่ระบบ (มีระบบ Client-side Form Validation ป้องกันข้อมูลว่าง)
                  </Text>
                </View>
              </View>

              {formError ? (
                <View style={styles.validationErrorBanner}>
                  <Text style={styles.validationErrorText}>⚠️ {formError}</Text>
                </View>
              ) : null}

              <View style={styles.formInputsTrioRow}>
                <View style={styles.singleInputColumn}>
                  <Text style={styles.formFieldLabel}>FULL NAME (ชื่อ-นามสกุล) *</Text>
                  <TextInput
                    style={styles.darkStyledFormField}
                    placeholder="e.g. Alex Johnson"
                    placeholderTextColor="#64748B"
                    value={nameInput}
                    onChangeText={setNameInput}
                  />
                </View>

                <View style={styles.singleInputColumn}>
                  <Text style={styles.formFieldLabel}>JOB POSITION / ROLE *</Text>
                  <TextInput
                    style={styles.darkStyledFormField}
                    placeholder="e.g. Cloud Security Architect"
                    placeholderTextColor="#64748B"
                    value={positionInput}
                    onChangeText={setPositionInput}
                  />
                </View>

                <View style={styles.singleInputColumn}>
                  <Text style={styles.formFieldLabel}>MONTHLY SALARY (THB) *</Text>
                  <TextInput
                    style={styles.darkStyledFormField}
                    placeholder="e.g. 55000"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={salaryInput}
                    onChangeText={setSalaryInput}
                  />
                </View>
              </View>

              {/* Quick Role Fill Pills */}
              <View style={styles.quickFillRoleStrip}>
                <Text style={styles.quickFillIntroLabel}>ตำแหน่งยอดนิยม:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {POSITION_SUGGESTIONS.slice(0, 7).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={styles.roleChipPill}
                      onPress={() => setPositionInput(role)}
                    >
                      <Text style={styles.roleChipPillText}>+ {role}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitEmployeeRecordButton,
                  addingEmployee && styles.btnLoadingState,
                ]}
                onPress={handleAddEmployee}
                disabled={addingEmployee}
                activeOpacity={0.88}
              >
                {addingEmployee ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitEmployeeRecordButtonText}>
                    + SAVE & COMMIT EMPLOYEE RECORD
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* TAB 4: SYSTEM AUDIT & ACTIVITY LOG                  */}
        {/* =================================================== */}
        {activeTab === 'audit' && (
          <View style={styles.tabContentSection}>
            <View style={styles.auditLogMasterCard}>
              <View style={styles.auditLogTopBar}>
                <View>
                  <Text style={styles.auditLogHeading}>📜 Real-time System Audit Log</Text>
                  <Text style={styles.auditLogSubHeading}>
                    บันทึกประวัติการเรียกใช้งาน API, การล็อกอิน, และการทำ CRUD ย้อนหลัง
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.clearLogsButton}
                  onPress={() => setAuditLogs([])}
                >
                  <Text style={styles.clearLogsButtonText}>Clear Logs</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.auditLogTimelineStack}>
                {auditLogs.map((log) => {
                  const badgeColors = {
                    success: '#10B981',
                    error: '#EF4444',
                    info: '#38BDF8',
                    system: '#818CF8',
                  };
                  const color = badgeColors[log.type] || '#94A3B8';

                  return (
                    <View key={log.id} style={styles.auditTimelineRow}>
                      <View style={[styles.auditDotIndicator, { backgroundColor: color }]} />
                      <View style={styles.auditLogContent}>
                        <View style={styles.auditLogRowMeta}>
                          <Text style={[styles.auditActionTag, { color }]}>[{log.action}]</Text>
                          <Text style={styles.auditTimestamp}>{log.timestamp}</Text>
                        </View>
                        <Text style={styles.auditDetailText}>{log.detail}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* FOOTER BAR                                          */}
        {/* =================================================== */}
        <View style={styles.masterFooter}>
          <Text style={styles.footerMainNotice}>
            Final Exam: Internet Programming (2026) • Student ID: 6730202041
          </Text>
          <Text style={styles.footerTechNotice}>
            Architecture: Express.js (Port 5000) • React Native Expo Web • MySQL Database ip_std6730202041
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================================
// ULTRA LUXURY ENTERPRISE STYLESHEET
// =========================================================================
const styles = StyleSheet.create({
  // Canvas
  dashboardCanvas: {
    flex: 1,
    backgroundColor: '#090D16', // Deep Obsidian Space
  },
  mainScrollableBody: {
    padding: 24,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },

  // Toast
  floatingToast: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    zIndex: 9999,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  toastSuccess: { backgroundColor: '#059669', borderWidth: 1, borderColor: '#34D399' },
  toastError: { backgroundColor: '#DC2626', borderWidth: 1, borderColor: '#F87171' },
  toastInfo: { backgroundColor: '#4338CA', borderWidth: 1, borderColor: '#818CF8' },
  floatingToastText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  // Login Screen
  loginWrapper: {
    flex: 1,
    backgroundColor: '#070B12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCenterBox: {
    width: '100%',
    maxWidth: 480,
    padding: 20,
    alignItems: 'center',
  },
  ambientLightOne: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(99, 102, 241, 0.22)',
  },
  ambientLightTwo: {
    position: 'absolute',
    bottom: -80,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  ambientLightThree: {
    position: 'absolute',
    top: '40%',
    right: '25%',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  loginGlassmorphismCard: {
    width: '100%',
    backgroundColor: 'rgba(19, 27, 44, 0.92)',
    borderRadius: 24,
    padding: 38,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 36,
    elevation: 12,
  },
  sealArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  glowingEmblem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  emblemIcon: {
    fontSize: 30,
    color: '#FFFFFF',
  },
  superKickerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#818CF8',
    letterSpacing: 2,
    marginBottom: 6,
  },
  headlineLoginTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  subLoginDescription: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  loginInputFormStack: {
    width: '100%',
  },
  styledInputGroup: {
    marginBottom: 18,
  },
  fieldMicroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  styledDarkInput: {
    backgroundColor: 'rgba(10, 15, 29, 0.85)',
    borderWidth: 1.5,
    borderColor: '#2D3748',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F8FAFC',
  },
  cyberSubmitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  cyberSubmitButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  demoFillBanner: {
    marginTop: 22,
    backgroundColor: 'rgba(10, 15, 29, 0.75)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  demoPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  demoHintText: {
    fontSize: 11,
    color: '#64748B',
  },
  demoTapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  demoCredLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  demoCredValue: {
    fontWeight: '800',
    color: '#F8FAFC',
  },
  demoCredSeparator: {
    color: '#475569',
  },
  loginFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
  },
  greenBeacon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  loginFooterStatus: {
    fontSize: 11,
    color: '#64748B',
  },

  // -------------------------------------------------------
  // EXECUTIVE TOPBAR
  // -------------------------------------------------------
  executiveHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#131B2C',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#202D45',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
    flexWrap: 'wrap',
    gap: 14,
  },
  headerLeftBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerLogoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  headerLogoEmoji: {
    fontSize: 22,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBrandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  activePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  pulseGreenOrb: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  headerSubtitleText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  themePalettePicker: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#0A0F1D',
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#202D45',
  },
  colorDotButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  colorDotSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  headerSignOutBtn: {
    backgroundColor: '#202D45',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerSignOutBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
  },

  // -------------------------------------------------------
  // NAVIGATION TABS
  // -------------------------------------------------------
  tabsStickyNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  tabNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#131B2C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#202D45',
  },
  tabNavButtonActive: {
    backgroundColor: '#1A2338',
  },
  tabNavButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabNavButtonTextActive: {
    fontWeight: '800',
  },
  tabNavBadge: {
    backgroundColor: '#202D45',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabNavBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
  },

  // -------------------------------------------------------
  // KPI 4-COLUMN ROW
  // -------------------------------------------------------
  tabContentSection: {
    marginBottom: 10,
  },
  kpiRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 16,
  },
  kpiMetricCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#131B2C',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#202D45',
    borderTopWidth: 4,
  },
  kpiCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  kpiCardIcon: {
    fontSize: 16,
  },
  kpiMetricValue: {
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 6,
  },
  kpiProgressWrapper: {
    height: 6,
    backgroundColor: '#0A0F1D',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  kpiProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  kpiSubCaption: {
    fontSize: 11,
    color: '#64748B',
  },

  // Payroll Strip
  payrollSummaryStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#131B2C',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#202D45',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 12,
  },
  payrollItemBlock: {
    alignItems: 'center',
  },
  payrollItemLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  payrollItemAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  payrollDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#202D45',
  },

  // -------------------------------------------------------
  // K-MEANS SALARY SHOWCASE CARD
  // -------------------------------------------------------
  analyticsShowcaseCard: {
    backgroundColor: '#131B2C',
    borderRadius: 22,
    padding: 26,
    marginBottom: 26,
    borderWidth: 1.5,
    borderColor: '#2D3748',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  analyticsCardHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  phaseIndicatorTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  phaseIndicatorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  phaseIndicatorBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  phaseMandatoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  analyticsMainHeadline: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  analyticsSubHeadline: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    maxWidth: 720,
    lineHeight: 18,
  },
  primaryActionTrigger: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  primaryActionTriggerText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  loadingPulseContainer: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  loadingPulseHeadline: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  loadingPulseSubline: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  clusterResultsWrapper: {
    marginTop: 24,
    paddingTop: 22,
    borderTopWidth: 1.5,
    borderTopColor: '#202D45',
  },
  clusterResultsTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  resultsMainLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  resultsTimestampText: {
    fontSize: 12,
    color: '#64748B',
  },
  clusterCardsTrioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  clusterTierCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 20,
  },
  tierCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tierGroupPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tierGroupPillText: {
    fontWeight: '900',
    fontSize: 12,
  },
  tierLevelCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  centroidHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  centroidHeroNumber: {
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
  },
  tierDistributionFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  distributionBarTrack: {
    height: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distributionCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  distributionRatioText: {
    fontSize: 12,
    fontWeight: '900',
  },

  // -------------------------------------------------------
  // DIRECTORY & CRUD SECTION
  // -------------------------------------------------------
  directoryMasterCard: {
    backgroundColor: '#131B2C',
    borderRadius: 22,
    padding: 26,
    marginBottom: 26,
    borderWidth: 1.5,
    borderColor: '#202D45',
  },
  directoryTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 14,
  },
  directoryMainHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  directorySubHeading: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  directoryControlsCluster: {
    flexDirection: 'row',
    gap: 10,
  },
  actionRoundPill: {
    backgroundColor: '#202D45',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionRoundPillText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '800',
  },
  filterControlGridBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchTextInputBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0F1D',
    borderWidth: 1.5,
    borderColor: '#202D45',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchPrefixIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchActualInput: {
    flex: 1,
    height: 44,
    color: '#F8FAFC',
    fontSize: 13,
  },
  clearSearchIcon: {
    color: '#64748B',
    fontSize: 14,
    paddingHorizontal: 6,
  },
  statusTabSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  statusSelectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#0A0F1D',
    borderWidth: 1.5,
    borderColor: '#202D45',
  },
  statusSelectorButtonActive: {
    borderColor: '#6366F1',
  },
  statusSelectorButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  statusSelectorButtonTextActive: {
    color: '#FFFFFF',
  },
  sortToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortMiniLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  sortPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0A0F1D',
    borderWidth: 1,
    borderColor: '#202D45',
  },
  sortPillBtnActive: {
    backgroundColor: '#334155',
    borderColor: '#64748B',
  },
  sortPillBtnText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  sortPillBtnTextActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  employeeCardListStack: {
    gap: 12,
  },
  employeeMasterRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A0F1D',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#202D45',
    flexWrap: 'wrap',
    gap: 14,
  },
  employeeIdentityArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 280,
  },
  avatarInitialsOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  avatarInitialsLetters: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  identityTextStack: {
    flex: 1,
  },
  nameAndBadgeFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  employeeNameHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  statusHaloPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusHaloActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusHaloLeave: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusGlowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusHaloText: {
    fontSize: 11,
    fontWeight: '900',
  },
  employeeRoleDesignation: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 4,
  },
  employeeSalaryPill: {
    fontSize: 14,
    fontWeight: '900',
    color: '#38BDF8',
  },
  salaryPeriodSuffix: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  employeeActionButtonsCluster: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  actionPillButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionPillToLeave: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  actionPillToActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  actionPillButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  actionDeletePillButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionDeletePillButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F87171',
  },
  emptyResultsSlate: {
    padding: 40,
    alignItems: 'center',
  },
  emptySlateEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },
  emptySlateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  emptySlateSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },

  // -------------------------------------------------------
  // ONBOARDING FORM
  // -------------------------------------------------------
  onboardingFormMasterCard: {
    backgroundColor: '#131B2C',
    borderRadius: 22,
    padding: 26,
    marginBottom: 26,
    borderWidth: 1.5,
    borderColor: '#202D45',
  },
  formSectionHeadingRow: {
    marginBottom: 18,
  },
  formMainHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  formSubHeading: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  validationErrorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  validationErrorText: {
    color: '#FCA5A5',
    fontWeight: '800',
    fontSize: 13,
  },
  formInputsTrioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  singleInputColumn: {
    flex: 1,
    minWidth: 240,
  },
  formFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  darkStyledFormField: {
    backgroundColor: '#0A0F1D',
    borderWidth: 1.5,
    borderColor: '#202D45',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F8FAFC',
  },
  quickFillRoleStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 16,
  },
  quickFillIntroLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  roleChipPill: {
    backgroundColor: '#202D45',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleChipPillText: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '700',
  },
  submitEmployeeRecordButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  submitEmployeeRecordButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },

  // -------------------------------------------------------
  // AUDIT LOG
  // -------------------------------------------------------
  auditLogMasterCard: {
    backgroundColor: '#131B2C',
    borderRadius: 22,
    padding: 26,
    marginBottom: 26,
    borderWidth: 1.5,
    borderColor: '#202D45',
  },
  auditLogTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  auditLogHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  auditLogSubHeading: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  clearLogsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#202D45',
    borderRadius: 8,
  },
  clearLogsButtonText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  auditLogTimelineStack: {
    gap: 12,
  },
  auditTimelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2338',
  },
  auditDotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  auditLogContent: {
    flex: 1,
  },
  auditLogRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  auditActionTag: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  auditTimestamp: {
    fontSize: 11,
    color: '#64748B',
  },
  auditDetailText: {
    fontSize: 13,
    color: '#E2E8F0',
  },

  // -------------------------------------------------------
  // MASTER FOOTER
  // -------------------------------------------------------
  masterFooter: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#1A2338',
    marginTop: 10,
  },
  footerMainNotice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  footerTechNotice: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  btnLoadingState: {
    opacity: 0.6,
  },
});
