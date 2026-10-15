import React, { useState, useEffect } from 'react';
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

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Salary Analytics (K-Means) States
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [clustersData, setClustersData] = useState(null);

  // Cross-Platform Notification Helper
  const showNotification = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // ---------------------------------------------------------
  // Authentication Handlers
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

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken('');
    setEmployees([]);
    setClustersData(null);
  };

  // ---------------------------------------------------------
  // Employee CRUD Operations
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

  const handleAddEmployee = async () => {
    setFormError('');

    if (!nameInput.trim() || !positionInput.trim() || !salaryInput.trim()) {
      setFormError('กรุณากรอกข้อมูลให้ครบทุกช่อง (ชื่อ, ตำแหน่ง, เงินเดือน)');
      return;
    }

    const numericSalary = Number(salaryInput);
    if (Number.isNaN(numericSalary) || numericSalary <= 0) {
      setFormError('เงินเดือนต้องเป็นตัวเลขที่มากกว่า 0');
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
      } else {
        showNotification('Error', data.message || 'ไม่สามารถเปลี่ยนสถานะได้');
      }
    } catch (error) {
      showNotification('Error', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const executeDeleteEmployee = async (employeeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        setEmployees((prevList) =>
          prevList.filter((emp) => String(emp.id) !== String(employeeId))
        );
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
    const messagePrompt = `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล "${employee.name}" ออกจากระบบ?`;

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
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'ลบข้อมูล',
            style: 'destructive',
            onPress: () => executeDeleteEmployee(employee.id),
          },
        ],
        { cancelable: true }
      );
    }
  };

  // ---------------------------------------------------------
  // Phase 2: K-Means Salary Analytics
  // ---------------------------------------------------------
  const handleAnalyzeSalary = async () => {
    try {
      setClusteringLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employees/salary-clusters`);
      const data = await response.json();

      if (response.status === 200 && data.success) {
        setClustersData(data.clusters);
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
  // Computed Metrics
  // ---------------------------------------------------------
  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;
  const avgSalary =
    totalEmployees > 0
      ? Math.round(employees.reduce((acc, e) => acc + Number(e.salary), 0) / totalEmployees)
      : 0;

  // Filtered Employees List
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ? true : emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get Initials for Avatar
  const getInitials = (name) => {
    if (!name) return 'HR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Avatar Colors Palette
  const avatarColors = ['#6366F1', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];

  // =========================================================
  // VIEW 1: LUXURY LOGIN SCREEN
  // =========================================================
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginScreenWrapper}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.loginContentCenter}
        >
          {/* Ambient Decorative Background Glows */}
          <View style={styles.glowCircleOne} />
          <View style={styles.glowCircleTwo} />

          <View style={styles.loginGlassCard}>
            {/* Header / Brand */}
            <View style={styles.loginBrandHeader}>
              <View style={styles.brandBadgeIcon}>
                <Text style={styles.brandIconText}>✦</Text>
              </View>
              <Text style={styles.brandSuperTitle}>EXECUTIVE HR PORTAL</Text>
              <Text style={styles.brandMainTitle}>Salary Analytics & Management</Text>
              <Text style={styles.brandSubTitle}>
                Internet Programming Final Exam (2026)
              </Text>
            </View>

            {/* Input Form */}
            <View style={styles.loginFormBox}>
              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>USERNAME</Text>
                <TextInput
                  style={styles.styledInput}
                  placeholder="Enter username (admin)"
                  placeholderTextColor="#94A3B8"
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TextInput
                  style={styles.styledInput}
                  placeholder="Enter password (password123)"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                />
              </View>

              <TouchableOpacity
                style={[styles.loginGlowButton, loginLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loginLoading}
                activeOpacity={0.85}
              >
                {loginLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginGlowButtonText}>SIGN IN TO DASHBOARD →</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Demo Quick Fill Box */}
            <View style={styles.demoCardBox}>
              <View style={styles.demoHeaderRow}>
                <Text style={styles.demoTagPill}>TEST ACCOUNT</Text>
                <Text style={styles.demoHintClick}>(คลิกด้านล่างเพื่อเติมอัตโนมัติ)</Text>
              </View>
              <TouchableOpacity
                style={styles.demoCredentialsRow}
                onPress={() => {
                  setUsernameInput('admin');
                  setPasswordInput('password123');
                }}
              >
                <Text style={styles.demoCredText}>
                  👤 User: <Text style={styles.demoBold}>admin</Text>
                </Text>
                <Text style={styles.demoCredText}>
                  🔑 Pass: <Text style={styles.demoBold}>password123</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // =========================================================
  // VIEW 2: ULTRA LUXURY DASHBOARD
  // =========================================================
  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Floating Glass Navigation Header */}
        <View style={styles.topGlassNav}>
          <View style={styles.navBrandArea}>
            <View style={styles.navIconBox}>
              <Text style={styles.navIconText}>💎</Text>
            </View>
            <View>
              <Text style={styles.navMainHeading}>HR Analytics Suite</Text>
              <Text style={styles.navSubHeading}>
                Enterprise Salary Clustering & Workforce Operations
              </Text>
            </View>
          </View>

          <View style={styles.navRightProfile}>
            <View style={styles.livePill}>
              <View style={styles.pulseDot} />
              <Text style={styles.livePillText}>DB CONNECTED</Text>
            </View>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.signOutButtonText}>Sign Out ⎋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero KPI Stats Bar */}
        <View style={styles.kpiGridRow}>
          <View style={[styles.kpiCard, styles.kpiBorderIndigo]}>
            <Text style={styles.kpiMiniTitle}>TOTAL EMPLOYEES</Text>
            <Text style={[styles.kpiBigNumber, { color: '#6366F1' }]}>{totalEmployees}</Text>
            <Text style={styles.kpiFootnote}>👥 All registered staff</Text>
          </View>

          <View style={[styles.kpiCard, styles.kpiBorderEmerald]}>
            <Text style={styles.kpiMiniTitle}>ACTIVE WORKFORCE</Text>
            <Text style={[styles.kpiBigNumber, { color: '#10B981' }]}>{activeCount}</Text>
            <Text style={styles.kpiFootnote}>🟢 Working on-duty</Text>
          </View>

          <View style={[styles.kpiCard, styles.kpiBorderAmber]}>
            <Text style={styles.kpiMiniTitle}>ON LEAVE</Text>
            <Text style={[styles.kpiBigNumber, { color: '#F59E0B' }]}>{onLeaveCount}</Text>
            <Text style={styles.kpiFootnote}>🟠 Temporary away</Text>
          </View>

          <View style={[styles.kpiCard, styles.kpiBorderCyan]}>
            <Text style={styles.kpiMiniTitle}>COMPANY AVG SALARY</Text>
            <Text style={[styles.kpiBigNumber, { color: '#06B6D4' }]}>
              ฿{avgSalary.toLocaleString()}
            </Text>
            <Text style={styles.kpiFootnote}>💰 Base salary mean</Text>
          </View>
        </View>

        {/* =================================================== */}
        {/* Phase 2: K-Means Salary Clustering Analytics Card   */}
        {/* =================================================== */}
        <View style={styles.analyticsMasterCard}>
          <View style={styles.cardHeaderTop}>
            <View>
              <View style={styles.badgeLabelRow}>
                <View style={styles.sparkleBadge}>
                  <Text style={styles.sparkleBadgeText}>🧠 AI ANALYTICS ENGINE</Text>
                </View>
                <Text style={styles.phaseTag}>PHASE 2 REQUIRED</Text>
              </View>
              <Text style={styles.cardSectionTitle}>Automated Salary Clustering (1D K-Means)</Text>
              <Text style={styles.cardSectionSub}>
                จัดกลุ่มโครงสร้างเงินเดือนขององค์กรออกเป็น 3 ระดับ (Tier 1, Tier 2, Tier 3) ด้วย Machine Learning Centroids
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.runAnalyticsBtn, clusteringLoading && styles.buttonDisabled]}
              onPress={handleAnalyzeSalary}
              disabled={clusteringLoading}
              activeOpacity={0.85}
            >
              {clusteringLoading ? (
                <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : (
                <Text style={{ marginRight: 8, fontSize: 16 }}>⚡</Text>
              )}
              <Text style={styles.runAnalyticsBtnText}>
                {clusteringLoading ? 'Processing Clustering...' : 'Analyze Salary Structure'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {clusteringLoading && (
            <View style={styles.loadingPulseBox}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingPulseText}>
                Computing 1D K-Means iterations (k=3) on server...
              </Text>
            </View>
          )}

          {/* Cluster Summary Cards Grid */}
          {clustersData && !clusteringLoading && (
            <View style={styles.clustersResultBox}>
              <View style={styles.resultTitleRow}>
                <Text style={styles.clustersResultTitle}>📊 Executive Salary Tiers Overview</Text>
                <Text style={styles.clustersResultMeta}>Sorted by Centroid (Lowest to Highest)</Text>
              </View>

              <View style={styles.tierCardsGrid}>
                {clustersData.map((tierItem, index) => {
                  const tierThemes = [
                    {
                      name: 'Junior / Entry Level',
                      color: '#06B6D4',
                      bg: '#ECFEFF',
                      border: '#A5F3FC',
                      badgeBg: '#CFFAFE',
                      badgeText: '#0891B2',
                      icon: '🌱',
                    },
                    {
                      name: 'Mid-Level Professionals',
                      color: '#6366F1',
                      bg: '#EEF2FF',
                      border: '#C7D2FE',
                      badgeBg: '#E0E7FF',
                      badgeText: '#4338CA',
                      icon: '🚀',
                    },
                    {
                      name: 'Executive / Leadership',
                      color: '#F59E0B',
                      bg: '#FFFBEB',
                      border: '#FDE68A',
                      badgeBg: '#FEF3C7',
                      badgeText: '#D97706',
                      icon: '👑',
                    },
                  ];

                  const theme = tierThemes[index % 3];
                  const percentOfTotal =
                    totalEmployees > 0
                      ? Math.round((tierItem.count / totalEmployees) * 100)
                      : 0;

                  return (
                    <View
                      key={tierItem.group}
                      style={[
                        styles.tierModernCard,
                        { backgroundColor: theme.bg, borderColor: theme.border },
                      ]}
                    >
                      <View style={styles.tierTopRow}>
                        <View style={[styles.tierGroupBadge, { backgroundColor: theme.badgeBg }]}>
                          <Text style={[styles.tierGroupBadgeText, { color: theme.badgeText }]}>
                            {theme.icon} {tierItem.group}
                          </Text>
                        </View>
                        <Text style={styles.tierCategoryText}>{theme.name}</Text>
                      </View>

                      <Text style={styles.centroidLabelText}>Average Salary (Centroid)</Text>
                      <Text style={[styles.centroidAmountText, { color: theme.color }]}>
                        ฿{Number(tierItem.centroid).toLocaleString()}
                      </Text>

                      <View style={styles.tierFooterStats}>
                        <View style={styles.tierProgressTrack}>
                          <View
                            style={[
                              styles.tierProgressBar,
                              { width: `${percentOfTotal}%`, backgroundColor: theme.color },
                            ]}
                          />
                        </View>

                        <View style={styles.tierCountNumbersRow}>
                          <Text style={styles.tierHeadcountLabel}>
                            👥 {tierItem.count} Employees
                          </Text>
                          <Text style={[styles.tierPercentLabel, { color: theme.color }]}>
                            {percentOfTotal}% of total
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

        {/* =================================================== */}
        {/* Phase 1: Add Employee Form Card                     */}
        {/* =================================================== */}
        <View style={styles.contentSectionCard}>
          <View style={styles.sectionTitleArea}>
            <View style={styles.badgeLabelRow}>
              <View style={[styles.sparkleBadge, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.sparkleBadgeText, { color: '#15803D' }]}>
                  ✦ NEW ONBOARDING
                </Text>
              </View>
              <Text style={styles.phaseTag}>PHASE 1 REQUIRED</Text>
            </View>
            <Text style={styles.cardSectionTitle}>Add New Employee</Text>
            <Text style={styles.cardSectionSub}>
              กรอกข้อมูลเพื่อบันทึกพนักงานใหม่เข้าสู่ระบบ (มีระบบตรวจสอบความถูกต้องก่อนส่ง)
            </Text>
          </View>

          {formError ? (
            <View style={styles.errorBannerBox}>
              <Text style={styles.errorBannerText}>⚠️ {formError}</Text>
            </View>
          ) : null}

          <View style={styles.inputsGridRow}>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabelStyled}>Full Name (ชื่อ-นามสกุล) *</Text>
              <TextInput
                style={styles.textInputBox}
                placeholder="เช่น Somchai Prasert"
                placeholderTextColor="#94A3B8"
                value={nameInput}
                onChangeText={setNameInput}
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.inputLabelStyled}>Position / Role (ตำแหน่ง) *</Text>
              <TextInput
                style={styles.textInputBox}
                placeholder="เช่น Software Architect"
                placeholderTextColor="#94A3B8"
                value={positionInput}
                onChangeText={setPositionInput}
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.inputLabelStyled}>Monthly Salary (เงินเดือน THB) *</Text>
              <TextInput
                style={styles.textInputBox}
                placeholder="เช่น 65000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={salaryInput}
                onChangeText={setSalaryInput}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitEmployeeBtn, addingEmployee && styles.buttonDisabled]}
            onPress={handleAddEmployee}
            disabled={addingEmployee}
            activeOpacity={0.85}
          >
            {addingEmployee ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitEmployeeBtnText}>+ Save Employee Record</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* =================================================== */}
        {/* Phase 1: Employee Directory & Filter List           */}
        {/* =================================================== */}
        <View style={styles.contentSectionCard}>
          <View style={styles.directoryHeaderRow}>
            <View>
              <View style={styles.badgeLabelRow}>
                <View style={[styles.sparkleBadge, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[styles.sparkleBadgeText, { color: '#475569' }]}>
                    DIRECTORY
                  </Text>
                </View>
                <Text style={styles.phaseTag}>PHASE 1 REQUIRED</Text>
              </View>
              <Text style={styles.cardSectionTitle}>Employee Records Directory</Text>
              <Text style={styles.cardSectionSub}>
                แสดงรายชื่อพนักงานทั้งหมด ({filteredEmployees.length} คนที่ตรงกับเงื่อนไข)
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshRoundBtn}
              onPress={fetchEmployees}
              activeOpacity={0.7}
            >
              <Text style={styles.refreshRoundBtnText}>🔄 Refresh Data</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar & Filter Controls */}
          <View style={styles.filterControlsRow}>
            <View style={styles.searchBarBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInputField}
                placeholder="ค้นหาตามชื่อ หรือ ตำแหน่งงาน..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.searchClearBtn}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.filterTabsRow}>
              {['ALL', 'Active', 'On Leave'].map((tab) => {
                const isSelected = statusFilter === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.filterTabPill, isSelected && styles.filterTabPillActive]}
                    onPress={() => setStatusFilter(tab)}
                  >
                    <Text
                      style={[
                        styles.filterTabPillText,
                        isSelected && styles.filterTabPillTextActive,
                      ]}
                    >
                      {tab === 'ALL' ? 'ทั้งหมด' : tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Employee Cards List */}
          {loadingEmployees ? (
            <View style={styles.loadingPulseBox}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingPulseText}>กำลังโหลดข้อมูลพนักงาน...</Text>
            </View>
          ) : filteredEmployees.length === 0 ? (
            <View style={styles.emptyDirectoryBox}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyMainText}>ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไข</Text>
              <Text style={styles.emptySubText}>
                ลองเปลี่ยนคำค้นหา หรือกรอกข้อมูลเพิ่มพนักงานใหม่ด้านบน
              </Text>
            </View>
          ) : (
            <View style={styles.cardsStack}>
              {filteredEmployees.map((emp, index) => {
                const isActive = emp.status === 'Active';
                const avatarColor = avatarColors[index % avatarColors.length];

                return (
                  <View key={emp.id} style={styles.empModernCard}>
                    {/* Left: Avatar & Info */}
                    <View style={styles.empLeftSection}>
                      <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                        <Text style={styles.avatarLetter}>{getInitials(emp.name)}</Text>
                      </View>

                      <View style={styles.empInfoTextGroup}>
                        <View style={styles.empNameBadgeRow}>
                          <Text style={styles.empNameText}>{emp.name}</Text>
                          <View
                            style={[
                              styles.statusGlowPill,
                              isActive ? styles.statusActiveGlow : styles.statusLeaveGlow,
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: isActive ? '#16A34A' : '#D97706' },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusGlowText,
                                { color: isActive ? '#15803D' : '#B45309' },
                              ]}
                            >
                              {emp.status}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.empPositionText}>💼 {emp.position}</Text>
                        <Text style={styles.empSalaryTag}>
                          💰 ฿{Number(emp.salary).toLocaleString()}
                          <Text style={styles.salaryPerMonthText}> / month</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Right: Actions */}
                    <View style={styles.empRightActions}>
                      <TouchableOpacity
                        style={[
                          styles.toggleActionBtn,
                          isActive ? styles.toggleToLeave : styles.toggleToActive,
                        ]}
                        onPress={() => handleToggleStatus(emp.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.toggleActionBtnText}>
                          {isActive ? '⇄ Set On Leave' : '⇄ Set Active'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteActionBtn}
                        onPress={() => confirmDeleteEmployee(emp)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.deleteActionBtnText}>🗑 Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerBar}>
          <Text style={styles.footerText}>
            Final Exam: Internet Programming (2026) • Student ID: 6730202041
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================
// ULTRA LUXURY STYLESHEET
// =========================================================
const styles = StyleSheet.create({
  // Global View Wrapper
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep Midnight Executive Canvas
  },
  scrollContent: {
    padding: 24,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },

  // -------------------------------------------------------
  // LOGIN SCREEN STYLES
  // -------------------------------------------------------
  loginScreenWrapper: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContentCenter: {
    width: '100%',
    maxWidth: 480,
    padding: 20,
    alignItems: 'center',
  },
  glowCircleOne: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  glowCircleTwo: {
    position: 'absolute',
    bottom: -60,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  loginGlassCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 10,
  },
  loginBrandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandBadgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  brandIconText: {
    fontSize: 26,
    color: '#FFFFFF',
  },
  brandSuperTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#818CF8',
    letterSpacing: 2,
    marginBottom: 4,
  },
  brandMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  brandSubTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  loginFormBox: {
    width: '100%',
  },
  inputWrap: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  styledInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F8FAFC',
  },
  loginGlowButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  loginGlowButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  demoCardBox: {
    marginTop: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  demoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoTagPill: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  demoHintClick: {
    fontSize: 11,
    color: '#64748B',
  },
  demoCredentialsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  demoCredText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  demoBold: {
    fontWeight: '700',
    color: '#F1F5F9',
  },

  // -------------------------------------------------------
  // TOP NAVIGATION
  // -------------------------------------------------------
  topGlassNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
    flexWrap: 'wrap',
    gap: 12,
  },
  navBrandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  navIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#312E81',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  navIconText: {
    fontSize: 20,
  },
  navMainHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  navSubHeading: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  navRightProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  signOutButton: {
    backgroundColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  signOutButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F1F5F9',
  },

  // -------------------------------------------------------
  // HERO KPI BAR
  // -------------------------------------------------------
  kpiGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  kpiBorderIndigo: { borderColor: 'rgba(99, 102, 241, 0.4)' },
  kpiBorderEmerald: { borderColor: 'rgba(16, 185, 129, 0.4)' },
  kpiBorderAmber: { borderColor: 'rgba(245, 158, 11, 0.4)' },
  kpiBorderCyan: { borderColor: 'rgba(6, 182, 212, 0.4)' },
  kpiMiniTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  kpiBigNumber: {
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
  },
  kpiFootnote: {
    fontSize: 11,
    color: '#64748B',
  },

  // -------------------------------------------------------
  // SECTION CARDS (Glassmorphism Dark)
  // -------------------------------------------------------
  analyticsMasterCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  contentSectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  badgeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sparkleBadge: {
    backgroundColor: '#312E81',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sparkleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 1,
  },
  phaseTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cardSectionSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    maxWidth: 620,
  },
  runAnalyticsBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  runAnalyticsBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // -------------------------------------------------------
  // K-MEANS RESULT CARDS
  // -------------------------------------------------------
  clustersResultBox: {
    marginTop: 22,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  resultTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  clustersResultTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  clustersResultMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  tierCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tierModernCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
  },
  tierTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tierGroupBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierGroupBadgeText: {
    fontWeight: '800',
    fontSize: 12,
  },
  tierCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  centroidLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  centroidAmountText: {
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 4,
  },
  tierFooterStats: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  tierProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tierProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  tierCountNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierHeadcountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  tierPercentLabel: {
    fontSize: 12,
    fontWeight: '800',
  },

  // -------------------------------------------------------
  // FORM STYLES
  // -------------------------------------------------------
  sectionTitleArea: {
    marginBottom: 16,
  },
  inputsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 8,
  },
  inputCol: {
    flex: 1,
    minWidth: 220,
  },
  inputLabelStyled: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  textInputBox: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#F8FAFC',
  },
  submitEmployeeBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  submitEmployeeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  errorBannerBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#FCA5A5',
    fontWeight: '700',
    fontSize: 13,
  },

  // -------------------------------------------------------
  // DIRECTORY & SEARCH
  // -------------------------------------------------------
  directoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  refreshRoundBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  refreshRoundBtnText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  filterControlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
    alignItems: 'center',
  },
  searchBarBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInputField: {
    flex: 1,
    height: 42,
    color: '#F8FAFC',
    fontSize: 13,
  },
  searchClearBtn: {
    color: '#64748B',
    fontSize: 14,
    paddingHorizontal: 6,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterTabPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  filterTabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  filterTabPillTextActive: {
    color: '#FFFFFF',
  },

  // -------------------------------------------------------
  // EMPLOYEE CARD ITEM
  // -------------------------------------------------------
  cardsStack: {
    gap: 12,
  },
  empModernCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    flexWrap: 'wrap',
    gap: 14,
  },
  empLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 260,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  empInfoTextGroup: {
    flex: 1,
  },
  empNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  empNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  statusGlowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusActiveGlow: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  statusLeaveGlow: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusGlowText: {
    fontSize: 11,
    fontWeight: '800',
  },
  empPositionText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 3,
  },
  empSalaryTag: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
  },
  salaryPerMonthText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  empRightActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  toggleActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleToLeave: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  toggleToActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  toggleActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  deleteActionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F87171',
  },

  // Helpers
  loadingPulseBox: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  loadingPulseText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94A3B8',
  },
  emptyDirectoryBox: {
    padding: 36,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyMainText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footerBar: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#475569',
  },
});
