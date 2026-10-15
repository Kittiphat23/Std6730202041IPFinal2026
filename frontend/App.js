import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Modal,
} from 'react-native';
import { API_BASE_URL } from './config';

// =========================================================================
// DESIGNER THEME PRESETS
// =========================================================================
const THEMES = {
  midnight: {
    id: 'midnight',
    name: 'Midnight Cyber',
    icon: '🌙',
    bg: '#090D16',
    cardBg: '#131B2C',
    innerCardBg: '#0A0F1D',
    border: '#202D45',
    borderHighlight: '#6366F1',
    textMain: '#F8FAFC',
    textSub: '#94A3B8',
    textMuted: '#64748B',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4338CA',
    accent: '#38BDF8',
    glow: 'rgba(99, 102, 241, 0.25)',
    inputBg: 'rgba(10, 15, 29, 0.85)',
    inputBorder: '#2D3748',
    isDark: true,
  },
  nordicLight: {
    id: 'nordicLight',
    name: 'Nordic Clean Light',
    icon: '☀️',
    bg: '#F1F5F9',
    cardBg: '#FFFFFF',
    innerCardBg: '#F8FAFC',
    border: '#E2E8F0',
    borderHighlight: '#4F46E5',
    textMain: '#0F172A',
    textSub: '#475569',
    textMuted: '#94A3B8',
    primary: '#4F46E5',
    primaryLight: '#6366F1',
    primaryDark: '#3730A3',
    accent: '#0284C7',
    glow: 'rgba(79, 70, 229, 0.15)',
    inputBg: '#F8FAFC',
    inputBorder: '#CBD5E1',
    isDark: false,
  },
  oledNeon: {
    id: 'oledNeon',
    name: 'OLED Neon Matrix',
    icon: '🌌',
    bg: '#000000',
    cardBg: '#0A0A0A',
    innerCardBg: '#121212',
    border: '#222222',
    borderHighlight: '#EC4899',
    textMain: '#FFFFFF',
    textSub: '#A1A1AA',
    textMuted: '#71717A',
    primary: '#EC4899',
    primaryLight: '#F472B6',
    primaryDark: '#BE185D',
    accent: '#A855F7',
    glow: 'rgba(236, 72, 153, 0.3)',
    inputBg: '#121212',
    inputBorder: '#27272A',
    isDark: true,
  },
  emeraldLuxe: {
    id: 'emeraldLuxe',
    name: 'Emerald Botanical',
    icon: '🌿',
    bg: '#04130E',
    cardBg: '#0B221A',
    innerCardBg: '#071812',
    border: '#15382B',
    borderHighlight: '#10B981',
    textMain: '#F0FDF4',
    textSub: '#86EFAC',
    textMuted: '#4ADE80',
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#047857',
    accent: '#F59E0B',
    glow: 'rgba(16, 185, 129, 0.25)',
    inputBg: '#071812',
    inputBorder: '#1A4D3B',
    isDark: true,
  },
  sunsetLuxe: {
    id: 'sunsetLuxe',
    name: 'Sunset Velvet',
    icon: '🌅',
    bg: '#140915',
    cardBg: '#221025',
    innerCardBg: '#180B1A',
    border: '#3D1C42',
    borderHighlight: '#F97316',
    textMain: '#FFF1F2',
    textSub: '#FDA4AF',
    textMuted: '#FB7185',
    primary: '#F97316',
    primaryLight: '#FB923C',
    primaryDark: '#C2410C',
    accent: '#F43F5E',
    glow: 'rgba(249, 115, 22, 0.25)',
    inputBg: '#180B1A',
    inputBorder: '#4C2452',
    isDark: true,
  },
};

const POSITION_RECOMMENDATIONS = [
  { role: 'Software Engineer', dept: 'Engineering', avgSalary: 45000 },
  { role: 'Senior Developer', dept: 'Engineering', avgSalary: 75000 },
  { role: 'Regional Manager', dept: 'Management', avgSalary: 95000 },
  { role: 'Office Administrator', dept: 'Operations', avgSalary: 22000 },
  { role: 'Sales Specialist', dept: 'Sales', avgSalary: 48000 },
  { role: 'Accountant', dept: 'Finance', avgSalary: 25000 },
  { role: 'DevOps Architect', dept: 'Cloud Infra', avgSalary: 85000 },
  { role: 'Product Designer', dept: 'Design UX', avgSalary: 52000 },
];

// =========================================================================
// PROCEDURAL SYNTHESIZED SOUND EFFECTS (WEB AUDIO API)
// =========================================================================
const playSoundFX = (type = 'click') => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.25);
      });
    } else if (type === 'delete') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
};

export default function App() {
  // Theme State
  const [currentThemeKey, setCurrentThemeKey] = useState('midnight');
  const t = THEMES[currentThemeKey];

  // Sound FX State
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Navigation Tab ('overview' | 'directory' | 'analytics' | 'simulator' | 'onboard' | 'audit')
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

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('id-asc');

  // K-Means Salary Analytics (Phase 2)
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [clustersData, setClustersData] = useState(null);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState(null);

  // Gimmick 1: Live What-If Salary Tier Predictor Simulator
  const [simulatedSalary, setSimulatedSalary] = useState('50000');

  // Gimmick 2: Live Digital Clock
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Gimmick 3: Confetti Celebration Trigger
  const [showConfetti, setShowConfetti] = useState(false);

  // Employee Detail Modal
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'log-1',
      action: 'SYSTEM_BOOT',
      detail: 'HR Intelligence Suite initialized with Live Database',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system',
    },
  ]);

  // Clock Ticker Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerSound = (type = 'click') => {
    if (soundEnabled) playSoundFX(type);
  };

  const addAuditLog = (action, detail, type = 'info') => {
    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random()}`,
        action,
        detail,
        timestamp: new Date().toLocaleTimeString(),
        type,
      },
      ...prev.slice(0, 39),
    ]);
  };

  const showToast = (message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3600);
  };

  const triggerCelebration = () => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 2800);
  };

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
    triggerSound('click');
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
        triggerSound('success');
        triggerCelebration();
        addAuditLog('USER_LOGIN', `Admin access granted via /api/login`, 'success');
        showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับสู่ระบบบริหาร HR', 'success');
        fetchEmployees();
      } else {
        showNotification('Login Failed', data.message || 'Invalid username or password');
        addAuditLog('LOGIN_FAILED', `Unauthorized attempt: ${usernameInput}`, 'error');
      }
    } catch (error) {
      showNotification('Network Error', `Cannot connect to server at ${API_BASE_URL}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    triggerSound('click');
    addAuditLog('USER_LOGOUT', `Admin session terminated`, 'info');
    setIsLoggedIn(false);
    setAuthToken('');
    setEmployees([]);
    setClustersData(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
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
        addAuditLog('FETCH_RECORDS', `Synchronized ${data.length} records with server`, 'info');
      }
    } catch (error) {
      console.error('Fetch Employees Error:', error);
      showToast('ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleAddEmployee = async () => {
    triggerSound('click');
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
        triggerSound('success');
        triggerCelebration();
        addAuditLog('ADD_EMPLOYEE', `Created record for ${data.employee.name} (฿${numericSalary.toLocaleString()})`, 'success');
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

  const handleToggleStatus = async (employeeId) => {
    triggerSound('click');
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
        triggerSound('success');
        addAuditLog('TOGGLE_STATUS', `Toggled ${data.employee.name} to [${data.employee.status}]`, 'info');
        showToast(`เปลี่ยนสถานะของ ${data.employee.name} เป็น ${data.employee.status}`, 'info');
        if (selectedEmployee && String(selectedEmployee.id) === String(employeeId)) {
          setSelectedEmployee(data.employee);
        }
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
        triggerSound('delete');
        const deletedName = data.deletedEmployee?.name || `ID #${employeeId}`;
        setEmployees((prevList) =>
          prevList.filter((emp) => String(emp.id) !== String(employeeId))
        );
        addAuditLog('DELETE_EMPLOYEE', `Removed ${deletedName} from database`, 'error');
        showToast(`ลบข้อมูล ${deletedName} เรียบร้อยแล้ว`, 'error');
        setShowDetailModal(false);
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
    triggerSound('click');
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
  // K-Means Salary Analytics (Phase 2)
  // ---------------------------------------------------------
  const handleAnalyzeSalary = async () => {
    triggerSound('click');
    try {
      setClusteringLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employees/salary-clusters`);
      const data = await response.json();

      if (response.status === 200 && data.success) {
        setClustersData(data.clusters);
        setLastAnalyzedTime(new Date().toLocaleTimeString());
        triggerSound('success');
        triggerCelebration();
        addAuditLog('KMEANS_CLUSTER', `Calculated 3 Tiers Centroids successfully`, 'success');
        showToast('การประมวลผล K-Means Salary Clustering สำเร็จแล้ว!', 'success');
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
  // Gimmick: Predicted Tier for Simulator
  // ---------------------------------------------------------
  const predictedTier = useMemo(() => {
    if (!clustersData || clustersData.length < 3) return null;
    const salaryVal = Number(simulatedSalary);
    if (Number.isNaN(salaryVal) || salaryVal <= 0) return null;

    let closestTier = clustersData[0];
    let minDiff = Math.abs(salaryVal - clustersData[0].centroid);

    for (let i = 1; i < clustersData.length; i++) {
      const diff = Math.abs(salaryVal - clustersData[i].centroid);
      if (diff < minDiff) {
        minDiff = diff;
        closestTier = clustersData[i];
      }
    }

    return closestTier;
  }, [clustersData, simulatedSalary]);

  // ---------------------------------------------------------
  // Metrics & Calculations
  // ---------------------------------------------------------
  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;

  const stats = useMemo(() => {
    if (totalEmployees === 0) return { min: 0, max: 0, avg: 0, median: 0, payroll: 0 };
    const numbers = employees.map((e) => Number(e.salary)).sort((a, b) => a - b);
    const payroll = numbers.reduce((sum, v) => sum + v, 0);
    const avg = Math.round(payroll / numbers.length);
    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    const mid = Math.floor(numbers.length / 2);
    const median = numbers.length % 2 !== 0 ? numbers[mid] : Math.round((numbers[mid - 1] + numbers[mid]) / 2);
    return { min, max, avg, median, payroll };
  }, [employees]);

  // Filter & Sort
  const filteredEmployees = useMemo(() => {
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

  const handleExportCSV = () => {
    triggerSound('click');
    const csvContent = [
      'ID,Name,Position,Status,Salary',
      ...employees.map((e) => `"${e.id}","${e.name}","${e.position}","${e.status}",${e.salary}`),
    ].join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `employees_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerSound('success');
      showToast('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว!', 'success');
    } else {
      showToast('พร้อมส่งออกข้อมูล CSV ทั้งหมด', 'info');
    }
    addAuditLog('EXPORT_CSV', `Exported ${employees.length} records to CSV`, 'info');
  };

  // =========================================================
  // VIEW 1: DESIGNER LOGIN SCREEN
  // =========================================================
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.loginContainer, { backgroundColor: t.bg }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.loginCenterBox}
        >
          {/* Subtle Ambient Designer Lights */}
          <View style={[styles.ambientGlowTop, { backgroundColor: t.glow }]} />
          <View style={[styles.ambientGlowBottom, { backgroundColor: t.glow }]} />

          <View style={[styles.loginDesignerCard, { backgroundColor: t.cardBg, borderColor: t.border }]}>
            {/* Theme Quick Switcher on Login */}
            <View style={styles.loginThemeRow}>
              <Text style={[styles.loginThemeIntro, { color: t.textMuted }]}>STYLE THEME:</Text>
              <View style={styles.themeCapsuleBox}>
                {Object.keys(THEMES).map((key) => {
                  const th = THEMES[key];
                  const isCurrent = currentThemeKey === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.themeIconPill,
                        isCurrent && { backgroundColor: t.primary, borderColor: t.primaryLight },
                      ]}
                      onPress={() => {
                        triggerSound('click');
                        setCurrentThemeKey(key);
                      }}
                    >
                      <Text style={styles.themeIconEmoji}>{th.icon}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Header Badge & Title */}
            <View style={styles.loginBrandHeader}>
              <View style={[styles.brandEmblemBox, { backgroundColor: t.primaryDark, borderColor: t.primary }]}>
                <Text style={styles.brandEmblemIcon}>✦</Text>
              </View>
              <Text style={[styles.brandKicker, { color: t.primaryLight }]}>ENTERPRISE WORKFORCE</Text>
              <Text style={[styles.brandTitle, { color: t.textMain }]}>HR Manager & Salary Analytics</Text>
              <Text style={[styles.brandSub, { color: t.textSub }]}>
                Final Examination: Internet Programming 2026
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.loginFormArea}>
              <View style={styles.inputGroupWrap}>
                <Text style={[styles.inputMicroLabel, { color: t.textSub }]}>ADMINISTRATOR USERNAME</Text>
                <TextInput
                  style={[styles.inputBoxStyled, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.textMain }]}
                  placeholder="Enter username (admin)"
                  placeholderTextColor={t.textMuted}
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroupWrap}>
                <Text style={[styles.inputMicroLabel, { color: t.textSub }]}>ADMINISTRATOR PASSWORD</Text>
                <TextInput
                  style={[styles.inputBoxStyled, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.textMain }]}
                  placeholder="Enter password (password123)"
                  placeholderTextColor={t.textMuted}
                  secureTextEntry
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                />
              </View>

              <TouchableOpacity
                style={[styles.loginSubmitButton, { backgroundColor: t.primary, shadowColor: t.primary }, loginLoading && styles.disabledOpacity]}
                onPress={handleLogin}
                disabled={loginLoading}
                activeOpacity={0.88}
              >
                {loginLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginSubmitButtonText}>SIGN IN TO PORTAL →</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick-Fill Credentials Card */}
            <TouchableOpacity
              style={[styles.demoCredentialsBox, { backgroundColor: t.innerCardBg, borderColor: t.border }]}
              onPress={() => {
                triggerSound('click');
                setUsernameInput('admin');
                setPasswordInput('password123');
                showToast('กรอกรหัสทดสอบสำเร็จ (admin / password123)', 'info');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.demoBoxTopLine}>
                <View style={[styles.demoPillBadge, { backgroundColor: t.glow }]}>
                  <Text style={[styles.demoPillBadgeText, { color: t.primaryLight }]}>QUICK DEMO</Text>
                </View>
                <Text style={[styles.demoClickHint, { color: t.textMuted }]}>แตะเพื่อเติมรหัสผ่านทันที</Text>
              </View>
              <View style={styles.demoValuesRow}>
                <Text style={[styles.demoCredText, { color: t.textSub }]}>
                  User: <Text style={[styles.demoCredBold, { color: t.textMain }]}>admin</Text>
                </Text>
                <Text style={{ color: t.textMuted }}>•</Text>
                <Text style={[styles.demoCredText, { color: t.textSub }]}>
                  Pass: <Text style={[styles.demoCredBold, { color: t.textMain }]}>password123</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // =========================================================
  // VIEW 2: DESIGNER HR DASHBOARD WITH GIMMICKS
  // =========================================================
  return (
    <SafeAreaView style={[styles.appContainer, { backgroundColor: t.bg }]}>
      {/* Gimmick: Floating Particle Celebration Shower */}
      {showConfetti && (
        <View style={styles.confettiOverlay} pointerEvents="none">
          {['🎉', '✨', '💎', '🚀', '🌟', '💸', '⚡', '🎊'].map((emoji, i) => (
            <Text
              key={i}
              style={[
                styles.confettiEmoji,
                {
                  left: `${(i * 12) + 6}%`,
                  top: `${(i % 3) * 15 + 10}%`,
                },
              ]}
            >
              {emoji}
            </Text>
          ))}
        </View>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <View
          style={[
            styles.toastBubble,
            toastType === 'success' && styles.toastBubbleSuccess,
            toastType === 'error' && styles.toastBubbleError,
            toastType === 'info' && { backgroundColor: t.primaryDark, borderColor: t.primaryLight },
          ]}
        >
          <Text style={styles.toastBubbleText}>{toastMessage}</Text>
        </View>
      )}

      {/* Employee Detail Inspector Modal */}
      {selectedEmployee && (
        <Modal
          visible={showDetailModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContentCard, { backgroundColor: t.cardBg, borderColor: t.border }]}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalAvatarAndName}>
                  <View style={[styles.modalBigAvatar, { backgroundColor: t.primary }]}>
                    <Text style={styles.modalBigAvatarLetters}>{getInitials(selectedEmployee.name)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.modalEmployeeName, { color: t.textMain }]}>{selectedEmployee.name}</Text>
                    <Text style={[styles.modalEmployeeRole, { color: t.textSub }]}>💼 {selectedEmployee.position}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDetailModal(false)}>
                  <Text style={[styles.modalCloseBtnText, { color: t.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Detail Metrics */}
              <View style={[styles.modalMetricsBox, { backgroundColor: t.innerCardBg, borderColor: t.border }]}>
                <View style={styles.modalMetricCol}>
                  <Text style={[styles.modalMetricLabel, { color: t.textMuted }]}>SYSTEM ID</Text>
                  <Text style={[styles.modalMetricValue, { color: t.textMain }]}>#{selectedEmployee.id}</Text>
                </View>
                <View style={styles.modalMetricCol}>
                  <Text style={[styles.modalMetricLabel, { color: t.textMuted }]}>MONTHLY SALARY</Text>
                  <Text style={[styles.modalMetricValue, { color: t.accent }]}>฿{Number(selectedEmployee.salary).toLocaleString()}</Text>
                </View>
                <View style={styles.modalMetricCol}>
                  <Text style={[styles.modalMetricLabel, { color: t.textMuted }]}>WORK STATUS</Text>
                  <Text style={[styles.modalMetricValue, { color: selectedEmployee.status === 'Active' ? '#10B981' : '#F59E0B' }]}>
                    {selectedEmployee.status}
                  </Text>
                </View>
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[styles.modalToggleBtn, { backgroundColor: t.innerCardBg, borderColor: t.border }]}
                  onPress={() => handleToggleStatus(selectedEmployee.id)}
                >
                  <Text style={[styles.modalToggleBtnText, { color: t.textMain }]}>
                    ⇄ Toggle Status ({selectedEmployee.status === 'Active' ? 'To On Leave' : 'To Active'})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={() => confirmDeleteEmployee(selectedEmployee)}
                >
                  <Text style={styles.modalDeleteBtnText}>🗑 Delete Employee Record</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <ScrollView contentContainerStyle={styles.scrollCanvas}>
        {/* =================================================== */}
        {/* TOPBAR: Clock, Audio FX, Themes & Profile           */}
        {/* =================================================== */}
        <View style={[styles.executiveNavbar, { backgroundColor: t.cardBg, borderColor: t.border }]}>
          <View style={styles.brandTitleArea}>
            <View style={[styles.navLogoEmblem, { backgroundColor: t.primaryDark, borderColor: t.primary }]}>
              <Text style={styles.navLogoIcon}>💎</Text>
            </View>
            <View>
              <View style={styles.navTitleRow}>
                <Text style={[styles.navMainText, { color: t.textMain }]}>HR Intelligence Suite</Text>
                <View style={[styles.liveIndicatorPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveIndicatorText}>LIVE DB ACTIVE</Text>
                </View>
              </View>
              <Text style={[styles.navSubText, { color: t.textSub }]}>
                Workforce Compensation, Salary Clustering (1D K-Means) & Personnel Registry
              </Text>
            </View>
          </View>

          {/* Gimmick Bar: Clock, Audio, Themes, Sign Out */}
          <View style={styles.navRightCluster}>
            {/* Live Clock Gimmick */}
            <View style={[styles.clockBadgePill, { backgroundColor: t.innerCardBg, borderColor: t.border }]}>
              <Text style={styles.clockIcon}>⏱️</Text>
              <Text style={[styles.clockText, { color: t.accent }]}>{currentTime}</Text>
            </View>

            {/* Audio Feedback Toggle */}
            <TouchableOpacity
              style={[styles.audioToggleBtn, { backgroundColor: t.innerCardBg, borderColor: t.border }]}
              onPress={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                if (nextState) playSoundFX('success');
                showToast(`ระบบเสียง UI: ${nextState ? 'เปิด (ON) 🔊' : 'ปิด (OFF) 🔇'}`, 'info');
              }}
            >
              <Text style={styles.audioToggleEmoji}>{soundEnabled ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>

            {/* Theme Selector */}
            <View style={[styles.themeSelectorBar, { backgroundColor: t.innerCardBg, borderColor: t.border }]}>
              <Text style={[styles.themeLabelNotice, { color: t.textMuted }]}>THEME:</Text>
              {Object.keys(THEMES).map((key) => {
                const item = THEMES[key];
                const isSelected = currentThemeKey === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.themeTabPill,
                      isSelected && { backgroundColor: t.primary, borderColor: t.primaryLight },
                    ]}
                    onPress={() => {
                      triggerSound('click');
                      setCurrentThemeKey(key);
                      showToast(`เปลี่ยนธีมเป็น "${item.name}"`, 'info');
                    }}
                  >
                    <Text style={styles.themeTabIcon}>{item.icon}</Text>
                    <Text style={[styles.themeTabLabel, isSelected ? { color: '#FFFFFF', fontWeight: '800' } : { color: t.textSub }]}>
                      {item.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={[styles.signOutBtnStyled, { borderColor: t.border }]} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={[styles.signOutBtnText, { color: t.textMain }]}>Sign Out ⎋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================== */}
        {/* GIMMICK: INTERACTIVE SALARY SPECTRUM HISTOGRAM      */}
        {/* =================================================== */}
        {employees.length > 0 && (
          <View style={[styles.salarySpectrumCard, { backgroundColor: t.cardBg, borderColor: t.border }]}>
            <View style={styles.spectrumHeaderRow}>
              <View>
                <Text style={[styles.spectrumTitle, { color: t.textMain }]}>📈 Live Salary Distribution Spectrum</Text>
                <Text style={[styles.spectrumSub, { color: t.textSub }]}>
                  การกระจายตัวของเงินเดือนพนักงานเทียบกับเกณฑ์เฉลี่ย ฿{stats.avg.toLocaleString()} (แตะที่แท่งเพื่อดูรายละเอียด)
                </Text>
              </View>
              <View style={styles.spectrumLegendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#06B6D4' }]} />
                  <Text style={[styles.legendLabel, { color: t.textMuted }]}>Tier 1</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#818CF8' }]} />
                  <Text style={[styles.legendLabel, { color: t.textMuted }]}>Tier 2</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FBBF24' }]} />
                  <Text style={[styles.legendLabel, { color: t.textMuted }]}>Tier 3</Text>
                </View>
              </View>
            </View>

            {/* Bar Charts Spectrum */}
            <View style={styles.spectrumBarsContainer}>
              {employees.map((emp) => {
                const maxSalary = Math.max(stats.max, 100000);
                const barHeightPercent = Math.max(15, Math.round((Number(emp.salary) / maxSalary) * 100));

                let barColor = '#06B6D4';
                if (Number(emp.salary) > 60000) barColor = '#FBBF24';
                else if (Number(emp.salary) > 35000) barColor = '#818CF8';

                return (
                  <TouchableOpacity
                    key={emp.id}
                    style={styles.spectrumBarColumn}
                    onPress={() => {
                      triggerSound('click');
                      setSelectedEmployee(emp);
                      setShowDetailModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.spectrumBarTrack}>
                      <View
                        style={[
                          styles.spectrumBarFill,
                          { height: `${barHeightPercent}%`, backgroundColor: barColor },
                        ]}
                      />
                    </View>
                    <Text style={[styles.spectrumEmpName, { color: t.textMuted }]} numberOfLines={1}>
                      {emp.name.split(' ')[0]}
                    </Text>
                    <Text style={[styles.spectrumEmpSalary, { color: t.textSub }]}>
                      {(Number(emp.salary) / 1000).toFixed(0)}k
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* NAVIGATION TABS BAR                                 */}
        {/* =================================================== */}
        <View style={styles.tabNavRow}>
          {[
            { key: 'overview', label: '📊 Executive Overview', count: totalEmployees },
            { key: 'analytics', label: '🧠 Salary K-Means Lab', count: 'Phase 2' },
            { key: 'simulator', label: '🔮 Tier Predictor Lab', count: 'Interactive' },
            { key: 'directory', label: '👥 Employee Directory', count: filteredEmployees.length },
            { key: 'onboard', label: '➕ Onboard Staff', count: 'Phase 1' },
            { key: 'audit', label: '📜 Activity Audit Log', count: auditLogs.length },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabNavPill,
                  { backgroundColor: t.cardBg, borderColor: t.border },
                  isSelected && { backgroundColor: t.innerCardBg, borderColor: t.primary, borderWidth: 2 },
                ]}
                onPress={() => {
                  triggerSound('click');
                  setActiveTab(tab.key);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabNavLabel, { color: isSelected ? t.primaryLight : t.textSub }, isSelected && { fontWeight: '900' }]}>
                  {tab.label}
                </Text>
                <View style={[styles.tabBadgeBox, { backgroundColor: isSelected ? t.primaryDark : t.innerCardBg }]}>
                  <Text style={[styles.tabBadgeText, { color: isSelected ? '#FFFFFF' : t.textMuted }]}>{tab.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* =================================================== */}
        {/* GIMMICK: WHAT-IF SALARY TIER SIMULATOR TAB          */}
        {/* =================================================== */}
        {activeTab === 'simulator' && (
          <View style={styles.sectionWrap}>
            <View style={[styles.designerSectionCard, { backgroundColor: t.cardBg, borderColor: t.border }]}>
              <View style={styles.sectionCardHeader}>
                <View>
                  <View style={styles.headerTagRow}>
                    <View style={[styles.algoBadge, { backgroundColor: '#7C3AED' }]}>
                      <Text style={styles.algoBadgeText}>🔮 INTERACTIVE AI SIMULATOR</Text>
                    </View>
                    <Text style={[styles.examReqBadge, { color: t.textMuted }]}>K-MEANS PREDICTOR</Text>
                  </View>
                  <Text style={[styles.sectionTitleText, { color: t.textMain }]}>What-If Salary Tier Classifier</Text>
                  <Text style={[styles.sectionSubtitleText, { color: t.textSub }]}>
                    ทดลองกรอกเงินเดือนสมมติ เพื่อให้ AI จำแนกว่าจะถูกจัดเข้า Tier ใดตาม Centroids ปัจจุบัน
                  </Text>
                </View>
              </View>

              <View style={styles.simulatorContentRow}>
                <View style={styles.simulatorInputCol}>
                  <Text style={[styles.formInputLabel, { color: t.textSub }]}>ENTER PROPOSED SALARY (THB):</Text>
                  <TextInput
                    style={[styles.formInputBox, { backgroundColor: t.innerCardBg, borderColor: t.border, color: t.textMain, fontSize: 20, fontWeight: '900' }]}
                    placeholder="e.g. 55000"
                    placeholderTextColor={t.textMuted}
                    keyboardType="numeric"
                    value={simulatedSalary}
                    onChangeText={setSimulatedSalary}
                  />

                  {/* Quick Preset Buttons */}
                  <View style={styles.simPresetsRow}>
                    {[20000, 35000, 50000, 75000, 95000, 120000].map((val) => (
                      <TouchableOpacity
                        key={val}
                        style={[styles.simPresetPill, { backgroundColor: t.innerCardBg, borderColor: t.border }]}
                        onPress={() => {
                          triggerSound('click');
                          setSimulatedSalary(String(val));
                        }}
                      >
                        <Text style={[styles.simPresetPillText, { color: t.primaryLight }]}>฿{val.toLocaleString()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Prediction Result Display */}
                <View style={[styles.predictionBox, { backgroundColor: t.innerCardBg, borderColor: t.border }]}>
                  <Text style={[styles.predSubLabel, { color: t.textMuted }]}>PREDICTED SALARY TIER:</Text>
                  {predictedTier ? (
                    <View style={styles.predResultArea}>
                      <Text style={[styles.predHeroTier, { color: t.primaryLight }]}>{predictedTier.group}</Text>
                      <Text style={[styles.predCentroidRef, { color: t.textSub }]}>
                        Centroid Benchmark: ฿{Number(predictedTier.centroid).toLocaleString()}
                      </Text>
                      <Text style={[styles.predDiffNotice, { color: t.accent }]}>
                        Distance from center: ฿{Math.abs(Number(simulatedSalary) - predictedTier.centroid).toLocaleString()}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.predHint, { color: t.textMuted }]}>
                      กรุณากดวิเคราะห์ K-Means ก่อน หรือใส่ตัวเลขเงินเดือนที่ถูกต้อง
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* TAB: OVERVIEW & ANALYTICS                           */}
        {/* =================================================== */}
        {(activeTab === 'overview' || activeTab === 'analytics') && (
          <View style={styles.sectionWrap}>
            {/* KPI Metrics 4-Column Bar */}
            <View style={styles.kpiCardsGrid}>
              <View style={[styles.kpiCardItem, { backgroundColor: t.cardBg, borderColor: t.border }]}>
                <View style={styles.kpiCardTop}>
                  <Text style={[styles.kpiSmallTitle, { color: t.textSub }]}>TOTAL HEADCOUNT</Text>
                  <Text style={styles.kpiIcon}>👥</Text>
                </View>
                <Text style={[styles.kpiBigNumber, { color: t.primaryLight }]}>{totalEmployees}</Text>
                <View style={[styles.kpiTrack, { backgroundColor: t.innerCardBg }]}>
                  <View style={[styles.kpiBar, { width: '100%', backgroundColor: t.primary }]} />
                </View>
                <Text style={[styles.kpiSubText, { color: t.textMuted }]}>Registered workforce total</Text>
              </View>

              <View style={[styles.kpiCardItem, { backgroundColor: t.cardBg, borderColor: t.border }]}>
                <View style={styles.kpiCardTop}>
                  <Text style={[styles.kpiSmallTitle, { color: t.textSub }]}>ACTIVE ON-DUTY</Text>
                  <Text style={styles.kpiIcon}>🟢</Text>
                </View>
                <Text style={[styles.kpiBigNumber, { color: '#10B981' }]}>{activeCount}</Text>
                <View style={[styles.kpiTrack, { backgroundColor: t.innerCardBg }]}>
                  <View
                    style={[
                      styles.kpiBar,
                      { width: `${totalEmployees > 0 ? (activeCount / totalEmployees) * 100 : 0}%`, backgroundColor: '#10B981' },
                    ]}
                  />
                </View>
                <Text style={[styles.kpiSubText, { color: t.textMuted }]}>
                  {totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0}% team operational
                </Text>
              </View>

              <View style={[styles.kpiCardItem, { backgroundColor: t.cardBg, borderColor: t.border }]}>
                <View style={styles.kpiCardTop}>
                  <Text style={[styles.kpiSmallTitle, { color: t.textSub }]}>ON LEAVE / REST</Text>
                  <Text style={styles.kpiIcon}>🟠</Text>
                </View>
                <Text style={[styles.kpiBigNumber, { color: '#F59E0B' }]}>{onLeaveCount}</Text>
                <View style={[styles.kpiTrack, { backgroundColor: t.innerCardBg }]}>
                  <View
                    style={[
                      styles.kpiBar,
                      { width: `${totalEmployees > 0 ? (onLeaveCount / totalEmployees) * 100 : 0}%`, backgroundColor: '#F59E0B' },
                    ]}
                  />
                </View>
                <Text style={[styles.kpiSubText, { color: t.textMuted }]}>
                  {totalEmployees > 0 ? Math.round((onLeaveCount / totalEmployees) * 100) : 0}% planned absence
                </Text>
              </View>

              <View style={[styles.kpiCardItem, { backgroundColor: t.cardBg, borderColor: t.border }]}>
                <View style={styles.kpiCardTop}>
                  <Text style={[styles.kpiSmallTitle, { color: t.textSub }]}>AVG MONTHLY SALARY</Text>
                  <Text style={styles.kpiIcon}>💰</Text>
                </View>
                <Text style={[styles.kpiBigNumber, { color: t.accent }]}>฿{stats.avg.toLocaleString()}</Text>
                <View style={[styles.kpiTrack, { backgroundColor: t.innerCardBg }]}>
                  <View style={[styles.kpiBar, { width: '80%', backgroundColor: t.accent }]} />
                </View>
                <Text style={[styles.kpiSubText, { color: t.textMuted }]}>
                  Median: ฿{stats.median.toLocaleString()} / mo
                </Text>
              </View>
            </View>

            {/* Quick Strip: Total Payroll Budget */}
            <View style={[styles.payrollBanner, { backgroundColor: t.cardBg, borderColor: t.border }]}>
              <View style={styles.payrollStatCol}>
                <Text style={[styles.payrollStatLabel, { color: t.textMuted }]}>TOTAL MONTHLY PAYROLL</Text>
                <Text style={[styles.payrollStatVal, { color: t.textMain }]}>฿{stats.payroll.toLocaleString()}</Text>
              </View>
              <View style={[styles.payrollLineDivider, { backgroundColor: t.border }]} />
              <View style={styles.payrollStatCol}>
                <Text style={[styles.payrollStatLabel, { color: t.textMuted }]}>MINIMUM ENTRY COMPENSATION</Text>
                <Text style={[styles.payrollStatVal, { color: t.textMain }]}>฿{stats.min.toLocaleString()}</Text>
              </View>
              <View style={[styles.payrollLineDivider, { backgroundColor: t.border }]} />
              <View style={styles.payrollStatCol}>
                <Text style={[styles.payrollStatLabel, { color: t.textMuted }]}>PEAK EXECUTIVE COMPENSATION</Text>
                <Text style={[styles.payrollStatVal, { color: t.textMain }]}>฿{stats.max.toLocaleString()}</Text>
              </View>
            </View>

            {/* =================================================== */}
            {/* Phase 2: K-Means Salary Analytics Showcase Card     */}
            {/* =================================================== */}
            <View style={[styles.designerSectionCard, { backgroundColor: t.cardBg, borderColor: t.border, shadowColor: t.primary }]}>
              <View style={styles.sectionCardHeader}>
                <View>
                  <View style={styles.headerTagRow}>
                    <View style={[styles.algoBadge, { backgroundColor: t.primaryDark }]}>
                      <Text style={styles.algoBadgeText}>🧠 AI-POWERED ANALYTICS</Text>
                    </View>
                    <Text style={[styles.examReqBadge, { color: t.textMuted }]}>PHASE 2 MANDATORY</Text>
                  </View>
                  <Text style={[styles.sectionTitleText, { color: t.textMain }]}>
                    Automated Salary Clustering (1D K-Means, k=3)
                  </Text>
                  <Text style={[styles.sectionSubtitleText, { color: t.textSub }]}>
                    วิเคราะห์ข้อมูลเงินเดือนพนักงานทั้งหมด เพื่อจัดกลุ่มโครงสร้างค่าตอบแทนออกเป็น 3 Tiers (Centroids)
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: t.primary, shadowColor: t.primary }, clusteringLoading && styles.disabledOpacity]}
                  onPress={handleAnalyzeSalary}
                  disabled={clusteringLoading}
                  activeOpacity={0.88}
                >
                  {clusteringLoading ? (
                    <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
                  ) : (
                    <Text style={{ marginRight: 8, fontSize: 16 }}>⚡</Text>
                  )}
                  <Text style={styles.primaryActionBtnText}>
                    {clusteringLoading ? 'Processing Clustering...' : 'Analyze Salary Structure'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Loading State Spinner */}
              {clusteringLoading && (
                <View style={styles.loadingPulseArea}>
                  <ActivityIndicator size="large" color={t.primary} />
                  <Text style={[styles.loadingPulseMain, { color: t.textMain }]}>Computing K-Means (k=3) Centroids on Server...</Text>
                  <Text style={[styles.loadingPulseSub, { color: t.textMuted }]}>คำนวณการกระจายตัวของเงินเดือนจนกระทั่งได้จุดกึ่งกลางที่เสถียรที่สุด</Text>
                </View>
              )}

              {/* Cluster Summary Cards Grid */}
              {clustersData && !clusteringLoading && (
                <View style={[styles.clusterResultsArea, { borderTopColor: t.border }]}>
                  <View style={styles.clusterResultsHeaderRow}>
                    <Text style={[styles.clusterResultsMainHeading, { color: t.textMain }]}>
                      📊 Clustering Analysis Results (Tier 1 • Tier 2 • Tier 3)
                    </Text>
                    {lastAnalyzedTime && (
                      <Text style={[styles.analyzedTimeText, { color: t.textMuted }]}>
                        Last calculated at: {lastAnalyzedTime}
                      </Text>
                    )}
                  </View>

                  <View style={styles.clusterTrioCardsRow}>
                    {clustersData.map((tier, idx) => {
                      const tierThemes = [
                        {
                          name: 'Junior / Entry Level',
                          color: '#06B6D4',
                          bg: t.isDark ? '#082F49' : '#ECFEFF',
                          border: '#0284C7',
                          pillBg: 'rgba(6, 182, 212, 0.2)',
                          icon: '🌱',
                        },
                        {
                          name: 'Mid-Level Professionals',
                          color: '#818CF8',
                          bg: t.isDark ? '#1E1B4B' : '#EEF2FF',
                          border: '#4F46E5',
                          pillBg: 'rgba(99, 102, 241, 0.2)',
                          icon: '🚀',
                        },
                        {
                          name: 'Executive / Leadership',
                          color: '#FBBF24',
                          bg: t.isDark ? '#451A03' : '#FFFBEB',
                          border: '#D97706',
                          pillBg: 'rgba(245, 158, 11, 0.2)',
                          icon: '👑',
                        },
                      ];

                      const conf = tierThemes[idx % 3];
                      const ratio = totalEmployees > 0 ? Math.round((tier.count / totalEmployees) * 100) : 0;

                      return (
                        <View key={tier.group} style={[styles.tierCardBox, { backgroundColor: conf.bg, borderColor: conf.border }]}>
                          <View style={styles.tierCardTopRow}>
                            <View style={[styles.tierGroupBadgePill, { backgroundColor: conf.pillBg }]}>
                              <Text style={[styles.tierGroupBadgePillText, { color: conf.color }]}>
                                {conf.icon} {tier.group}
                              </Text>
                            </View>
                            <Text style={[styles.tierNameSmall, { color: t.textSub }]}>{conf.name}</Text>
                          </View>

                          <Text style={[styles.centroidTitleLabel, { color: t.textMuted }]}>Average Base Salary (Centroid)</Text>
                          <Text style={[styles.centroidHeroValue, { color: conf.color }]}>
                            ฿{Number(tier.centroid).toLocaleString()}
                          </Text>

                          <View style={styles.tierFooterStatsBox}>
                            <View style={styles.tierTrackBackdrop}>
                              <View style={[styles.tierTrackBar, { width: `${ratio}%`, backgroundColor: conf.color }]} />
                            </View>
                            <View style={styles.tierHeadcountRow}>
                              <Text style={[styles.tierHeadcountLabel, { color: t.textMain }]}>👥 {tier.count} Employees</Text>
                              <Text style={[styles.tierPercentLabel, { color: conf.color }]}>{ratio}% of total</Text>
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
        {/* TAB: DIRECTORY & SEARCH                             */}
        {/* =================================================== */}
        {(activeTab === 'overview' || activeTab === 'directory') && (
          <View style={styles.sectionWrap}>
            <View style={[styles.designerSectionCard, { backgroundColor: t.cardBg, borderColor: t.border }]}>
              <View style={styles.directoryHeaderControls}>
                <View>
                  <View style={styles.headerTagRow}>
                    <View style={[styles.algoBadge, { backgroundColor: t.innerCardBg }]}>
                      <Text style={[styles.algoBadgeText, { color: t.textMain }]}>PERSONNEL DIRECTORY</Text>
                    </View>
                    <Text style={[styles.examReqBadge, { color: t.textMuted }]}>PHASE 1 REQUIRED CRUD</Text>
                  </View>
                  <Text style={[styles.sectionTitleText, { color: t.textMain }]}>Employee Records Registry</Text>
                  <Text style={[styles.sectionSubtitleText, { color: t.textSub }]}>
                    แสดงรายชื่อพนักงานทั้งหมด ({filteredEmployees.length} คนที่ตรงกับเงื่อนไข)
                  </Text>
                </View>

                <View style={styles.directoryUtilityButtons}>
                  <TouchableOpacity style={[styles.utilBtn, { backgroundColor: t.innerCardBg, borderColor: t.border }]} onPress={handleExportCSV}>
                    <Text style={[styles.utilBtnText, { color: t.accent }]}>📥 Export CSV</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.utilBtn, { backgroundColor: t.innerCardBg, borderColor: t.border }]} onPress={fetchEmployees}>
                    <Text style={[styles.utilBtnText, { color: t.primaryLight }]}>🔄 Refresh</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter & Search Bar */}
              <View style={styles.searchAndFilterGrid}>
                <View style={[styles.searchFieldBox, { backgroundColor: t.innerCardBg, borderColor: t.border }]}>
                  <Text style={styles.searchIconSymbol}>🔍</Text>
                  <TextInput
                    style={[styles.searchTextInput, { color: t.textMain }]}
                    placeholder="Search by employee name or role..."
                    placeholderTextColor={t.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Text style={[styles.searchClearSymbol, { color: t.textMuted }]}>✕</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Status Tabs */}
                <View style={styles.statusChipsRow}>
                  {['ALL', 'Active', 'On Leave'].map((tab) => {
                    const isTabActive = statusFilter === tab;
                    return (
                      <TouchableOpacity
                        key={tab}
                        style={[
                          styles.statusChipBtn,
                          { backgroundColor: t.innerCardBg, borderColor: t.border },
                          isTabActive && { backgroundColor: t.primaryDark, borderColor: t.primary },
                        ]}
                        onPress={() => {
                          triggerSound('click');
                          setStatusFilter(tab);
                        }}
                      >
                        <Text style={[styles.statusChipBtnText, { color: isTabActive ? '#FFFFFF' : t.textSub }]}>
                          {tab === 'ALL' ? 'ทั้งหมด (All)' : tab}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Sort Order Selector */}
                <View style={styles.sortChipsRow}>
                  <Text style={[styles.sortPrefixText, { color: t.textMuted }]}>SORT:</Text>
                  {[
                    { id: 'id-asc', label: 'ID' },
                    { id: 'salary-desc', label: '฿ High' },
                    { id: 'salary-asc', label: '฿ Low' },
                    { id: 'name-asc', label: 'A-Z' },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.sortSmallBtn,
                        { backgroundColor: t.innerCardBg, borderColor: t.border },
                        sortBy === s.id && { backgroundColor: t.primary, borderColor: t.primaryLight },
                      ]}
                      onPress={() => {
                        triggerSound('click');
                        setSortBy(s.id);
                      }}
                    >
                      <Text style={[styles.sortSmallBtnText, { color: sortBy === s.id ? '#FFFFFF' : t.textSub }]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Employee Cards List */}
              {loadingEmployees ? (
                <View style={styles.loadingPulseArea}>
                  <ActivityIndicator size="large" color={t.primary} />
                  <Text style={[styles.loadingPulseMain, { color: t.textMain }]}>Loading employee records...</Text>
                </View>
              ) : filteredEmployees.length === 0 ? (
                <View style={styles.emptySlateContainer}>
                  <Text style={styles.emptySlateIcon}>📋</Text>
                  <Text style={[styles.emptySlateHeading, { color: t.textMain }]}>ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไข</Text>
                  <Text style={[styles.emptySlateBody, { color: t.textMuted }]}>
                    ลองปรับเปลี่ยนคำค้นหา หรือกรอกข้อมูลพนักงานใหม่ผ่านเมนู Onboard Staff
                  </Text>
                </View>
              ) : (
                <View style={styles.employeeListFlow}>
                  {filteredEmployees.map((emp) => {
                    const isActive = emp.status === 'Active';

                    return (
                      <View key={emp.id} style={[styles.employeeRowCard, { backgroundColor: t.innerCardBg, borderColor: t.border }]}>
                        {/* Left: Avatar & Info */}
                        <TouchableOpacity
                          style={styles.employeeInfoLeft}
                          onPress={() => {
                            triggerSound('click');
                            setSelectedEmployee(emp);
                            setShowDetailModal(true);
                          }}
                          activeOpacity={0.75}
                        >
                          <View style={[styles.employeeAvatarOrb, { backgroundColor: t.primaryDark }]}>
                            <Text style={styles.employeeAvatarLetters}>{getInitials(emp.name)}</Text>
                          </View>

                          <View style={styles.employeeDetailsCol}>
                            <View style={styles.nameStatusRow}>
                              <Text style={[styles.employeeNameTitle, { color: t.textMain }]}>{emp.name}</Text>
                              <View
                                style={[
                                  styles.statusBadgeHalo,
                                  { backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' },
                                ]}
                              >
                                <View style={[styles.statusMiniDot, { backgroundColor: isActive ? '#10B981' : '#F59E0B' }]} />
                                <Text style={[styles.statusHaloLabel, { color: isActive ? '#10B981' : '#F59E0B' }]}>
                                  {emp.status}
                                </Text>
                              </View>
                            </View>

                            <Text style={[styles.employeeRoleText, { color: t.textSub }]}>💼 {emp.position}</Text>
                            <Text style={[styles.employeeSalaryText, { color: t.accent }]}>
                              💰 ฿{Number(emp.salary).toLocaleString()}
                              <Text style={[styles.salaryPerMonth, { color: t.textMuted }]}> / month</Text>
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* Right: Actions */}
                        <View style={styles.employeeActionsRight}>
                          <TouchableOpacity
                            style={[
                              styles.btnToggleStatus,
                              {
                                backgroundColor: isActive ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                borderColor: isActive ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)',
                              },
                            ]}
                            onPress={() => handleToggleStatus(emp.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.btnToggleStatusText, { color: t.textMain }]}>
                              {isActive ? '⇄ Set On Leave' : '⇄ Set Active'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.btnDeleteAction}
                            onPress={() => confirmDeleteEmployee(emp)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.btnDeleteActionText}>🗑 Delete</Text>
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
        {/* TAB: ONBOARD STAFF FORM                             */}
        {/* =================================================== */}
        {(activeTab === 'overview' || activeTab === 'onboard') && (
          <View style={styles.sectionWrap}>
            <View style={[styles.designerSectionCard, { backgroundColor: t.cardBg, borderColor: t.border }]}>
              <View style={styles.sectionCardHeader}>
                <View>
                  <View style={styles.headerTagRow}>
                    <View style={[styles.algoBadge, { backgroundColor: '#065F46' }]}>
                      <Text style={[styles.algoBadgeText, { color: '#6EE7B7' }]}>✦ RECRUITMENT ONBOARDING</Text>
                    </View>
                    <Text style={[styles.examReqBadge, { color: t.textMuted }]}>PHASE 1 REQUIRED</Text>
                  </View>
                  <Text style={[styles.sectionTitleText, { color: t.textMain }]}>Add New Employee Record</Text>
                  <Text style={[styles.sectionSubtitleText, { color: t.textSub }]}>
                    บันทึกข้อมูลพนักงานใหม่เข้าสู่ระบบ (พร้อมระบบตรวจสอบความถูกต้องก่อนส่งข้อมูล)
                  </Text>
                </View>
              </View>

              {formError ? (
                <View style={styles.errorAlertBox}>
                  <Text style={styles.errorAlertText}>⚠️ {formError}</Text>
                </View>
              ) : null}

              <View style={styles.formRowInputs}>
                <View style={styles.formInputFlexCol}>
                  <Text style={[styles.formInputLabel, { color: t.textSub }]}>FULL NAME (ชื่อ-นามสกุล) *</Text>
                  <TextInput
                    style={[styles.formInputBox, { backgroundColor: t.innerCardBg, borderColor: t.border, color: t.textMain }]}
                    placeholder="เช่น สมชาย ใจดี"
                    placeholderTextColor={t.textMuted}
                    value={nameInput}
                    onChangeText={setNameInput}
                  />
                </View>

                <View style={styles.formInputFlexCol}>
                  <Text style={[styles.formInputLabel, { color: t.textSub }]}>POSITION / ROLE (ตำแหน่งงาน) *</Text>
                  <TextInput
                    style={[styles.formInputBox, { backgroundColor: t.innerCardBg, borderColor: t.border, color: t.textMain }]}
                    placeholder="เช่น Senior Cloud Architect"
                    placeholderTextColor={t.textMuted}
                    value={positionInput}
                    onChangeText={setPositionInput}
                  />
                </View>

                <View style={styles.formInputFlexCol}>
                  <Text style={[styles.formInputLabel, { color: t.textSub }]}>MONTHLY SALARY (เงินเดือน THB) *</Text>
                  <TextInput
                    style={[styles.formInputBox, { backgroundColor: t.innerCardBg, borderColor: t.border, color: t.textMain }]}
                    placeholder="เช่น 65000"
                    placeholderTextColor={t.textMuted}
                    keyboardType="numeric"
                    value={salaryInput}
                    onChangeText={setSalaryInput}
                  />
                </View>
              </View>

              {/* Quick Fill Preset Roles */}
              <View style={styles.quickPresetsBar}>
                <Text style={[styles.quickPresetsNotice, { color: t.textMuted }]}>ตำแหน่งยอดนิยม (แตะเพื่อเติม):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {POSITION_RECOMMENDATIONS.map((item) => (
                    <TouchableOpacity
                      key={item.role}
                      style={[styles.presetChipBtn, { backgroundColor: t.innerCardBg, borderColor: t.border }]}
                      onPress={() => {
                        triggerSound('click');
                        setPositionInput(item.role);
                        if (!salaryInput) setSalaryInput(String(item.avgSalary));
                        showToast(`เลือกตำแหน่ง ${item.role}`, 'info');
                      }}
                    >
                      <Text style={[styles.presetChipBtnText, { color: t.primaryLight }]}>+ {item.role}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.btnSubmitEmployee, { backgroundColor: '#059669', shadowColor: '#10B981' }, addingEmployee && styles.disabledOpacity]}
                onPress={handleAddEmployee}
                disabled={addingEmployee}
                activeOpacity={0.88}
              >
                {addingEmployee ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnSubmitEmployeeText}>+ SAVE & COMMIT EMPLOYEE RECORD</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* TAB: AUDIT LOG                                      */}
        {/* =================================================== */}
        {activeTab === 'audit' && (
          <View style={styles.sectionWrap}>
            <View style={[styles.designerSectionCard, { backgroundColor: t.cardBg, borderColor: t.border }]}>
              <View style={styles.sectionCardHeader}>
                <View>
                  <Text style={[styles.sectionTitleText, { color: t.textMain }]}>📜 Real-time System Audit Log</Text>
                  <Text style={[styles.sectionSubtitleText, { color: t.textSub }]}>
                    บันทึกประวัติการเรียกใช้งาน API และการทำ CRUD ย้อนหลังทั้งหมด
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.utilBtn, { backgroundColor: t.innerCardBg, borderColor: t.border }]}
                  onPress={() => {
                    triggerSound('click');
                    setAuditLogs([]);
                  }}
                >
                  <Text style={[styles.utilBtnText, { color: t.textMuted }]}>Clear Logs</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.auditLogList}>
                {auditLogs.map((log) => {
                  const colorMap = {
                    success: '#10B981',
                    error: '#EF4444',
                    info: t.accent,
                    system: t.primaryLight,
                  };
                  const color = colorMap[log.type] || t.textMuted;

                  return (
                    <View key={log.id} style={[styles.auditRowItem, { borderBottomColor: t.border }]}>
                      <View style={[styles.auditDotIndicator, { backgroundColor: color }]} />
                      <View style={styles.auditTextCol}>
                        <View style={styles.auditMetaRow}>
                          <Text style={[styles.auditActionTag, { color }]}>[{log.action}]</Text>
                          <Text style={[styles.auditTimestampText, { color: t.textMuted }]}>{log.timestamp}</Text>
                        </View>
                        <Text style={[styles.auditDetailText, { color: t.textMain }]}>{log.detail}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* FOOTER                                              */}
        {/* =================================================== */}
        <View style={[styles.footerBarContainer, { borderTopColor: t.border }]}>
          <Text style={[styles.footerMainNotice, { color: t.textSub }]}>
            Final Exam: Internet Programming (2026) • Student ID: 6730202041
          </Text>
          <Text style={[styles.footerTechNotice, { color: t.textMuted }]}>
            Node.js Express (Port 5000) • React Native Expo • MySQL Database ip_std6730202041
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================================
// AWARD-WINNING DESIGNER STYLESHEET WITH GIMMICKS
// =========================================================================
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  scrollCanvas: {
    padding: 24,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },

  // -------------------------------------------------------
  // CONFETTI CELEBRATION GIMMICK
  // -------------------------------------------------------
  confettiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  confettiEmoji: {
    position: 'absolute',
    fontSize: 32,
  },

  // -------------------------------------------------------
  // CLOCK & AUDIO TOGGLE GIMMICKS
  // -------------------------------------------------------
  clockBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  clockIcon: {
    fontSize: 12,
  },
  clockText: {
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  audioToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioToggleEmoji: {
    fontSize: 14,
  },

  // -------------------------------------------------------
  // SALARY SPECTRUM HISTOGRAM GIMMICK
  // -------------------------------------------------------
  salarySpectrumCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
  },
  spectrumHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  spectrumTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  spectrumSub: {
    fontSize: 12,
    marginTop: 2,
  },
  spectrumLegendRow: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  spectrumBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
    paddingTop: 10,
    overflow: 'hidden',
  },
  spectrumBarColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  spectrumBarTrack: {
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  spectrumBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  spectrumEmpName: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    maxWidth: 50,
    textAlign: 'center',
  },
  spectrumEmpSalary: {
    fontSize: 9,
    fontWeight: '800',
  },

  // -------------------------------------------------------
  // WHAT-IF PREDICTOR GIMMICK
  // -------------------------------------------------------
  simulatorContentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 16,
  },
  simulatorInputCol: {
    flex: 1,
    minWidth: 280,
  },
  simPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  simPresetPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  simPresetPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  predictionBox: {
    flex: 1,
    minWidth: 260,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  predSubLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  predResultArea: {
    alignItems: 'center',
    marginTop: 8,
  },
  predHeroTier: {
    fontSize: 32,
    fontWeight: '900',
  },
  predCentroidRef: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '700',
  },
  predDiffNotice: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  predHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },

  // -------------------------------------------------------
  // TOAST NOTIFICATION
  // -------------------------------------------------------
  toastBubble: {
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
    borderWidth: 1,
  },
  toastBubbleSuccess: { backgroundColor: '#059669', borderColor: '#34D399' },
  toastBubbleError: { backgroundColor: '#DC2626', borderColor: '#F87171' },
  toastBubbleText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  // -------------------------------------------------------
  // MODAL INSPECTOR
  // -------------------------------------------------------
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatarAndName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modalBigAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBigAvatarLetters: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalEmployeeName: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalEmployeeRole: {
    fontSize: 13,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseBtnText: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalMetricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  modalMetricCol: {
    alignItems: 'center',
  },
  modalMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalMetricValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  modalActionsRow: {
    gap: 10,
  },
  modalToggleBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalToggleBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDeleteBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },

  // -------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCenterBox: {
    width: '100%',
    maxWidth: 480,
    padding: 20,
    alignItems: 'center',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -80,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  loginDesignerCard: {
    width: '100%',
    borderRadius: 24,
    padding: 36,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 36,
    elevation: 12,
  },
  loginThemeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  loginThemeIntro: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  themeCapsuleBox: {
    flexDirection: 'row',
    gap: 6,
  },
  themeIconPill: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeIconEmoji: {
    fontSize: 14,
  },
  loginBrandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandEmblemBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 14,
  },
  brandEmblemIcon: {
    fontSize: 26,
    color: '#FFFFFF',
  },
  brandKicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  brandSub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  loginFormArea: {
    width: '100%',
  },
  inputGroupWrap: {
    marginBottom: 16,
  },
  inputMicroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputBoxStyled: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  loginSubmitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  loginSubmitButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  demoCredentialsBox: {
    marginTop: 20,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  demoBoxTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  demoPillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoClickHint: {
    fontSize: 11,
  },
  demoValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  demoCredText: {
    fontSize: 12,
  },
  demoCredBold: {
    fontWeight: '800',
  },

  // -------------------------------------------------------
  // NAVBAR
  // -------------------------------------------------------
  executiveNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 16,
    marginBottom: 18,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    flexWrap: 'wrap',
    gap: 14,
  },
  brandTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  navLogoEmblem: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  navLogoIcon: {
    fontSize: 20,
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navMainText: {
    fontSize: 19,
    fontWeight: '900',
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveIndicatorText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  navSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  navRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  themeSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeLabelNotice: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  themeTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeTabIcon: {
    fontSize: 12,
  },
  themeTabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  signOutBtnStyled: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  signOutBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // -------------------------------------------------------
  // TABS ROW
  // -------------------------------------------------------
  tabNavRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  tabNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  tabNavLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabBadgeBox: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // -------------------------------------------------------
  // KPI 4-COLUMN BAR
  // -------------------------------------------------------
  sectionWrap: {
    marginBottom: 10,
  },
  kpiCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 16,
  },
  kpiCardItem: {
    flex: 1,
    minWidth: 220,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
  },
  kpiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiSmallTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  kpiIcon: {
    fontSize: 16,
  },
  kpiBigNumber: {
    fontSize: 30,
    fontWeight: '900',
    marginVertical: 4,
  },
  kpiTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  kpiBar: {
    height: '100%',
    borderRadius: 3,
  },
  kpiSubText: {
    fontSize: 11,
  },
  payrollBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 12,
  },
  payrollStatCol: {
    alignItems: 'center',
  },
  payrollStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  payrollStatVal: {
    fontSize: 19,
    fontWeight: '900',
  },
  payrollLineDivider: {
    width: 1,
    height: 32,
  },

  // -------------------------------------------------------
  // DESIGNER SECTION CARDS
  // -------------------------------------------------------
  designerSectionCard: {
    borderRadius: 22,
    padding: 26,
    marginBottom: 24,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 14,
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  algoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
  },
  algoBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  examReqBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSubtitleText: {
    fontSize: 13,
    marginTop: 4,
    maxWidth: 680,
  },
  primaryActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  loadingPulseArea: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingPulseMain: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '800',
  },
  loadingPulseSub: {
    marginTop: 4,
    fontSize: 12,
  },

  // -------------------------------------------------------
  // CLUSTERING RESULTS
  // -------------------------------------------------------
  clusterResultsArea: {
    marginTop: 22,
    paddingTop: 20,
    borderTopWidth: 1.5,
  },
  clusterResultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  clusterResultsMainHeading: {
    fontSize: 16,
    fontWeight: '900',
  },
  analyzedTimeText: {
    fontSize: 12,
  },
  clusterTrioCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tierCardBox: {
    flex: 1,
    minWidth: 260,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
  },
  tierCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierGroupBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierGroupBadgePillText: {
    fontWeight: '900',
    fontSize: 12,
  },
  tierNameSmall: {
    fontSize: 11,
    fontWeight: '700',
  },
  centroidTitleLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  centroidHeroValue: {
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
  },
  tierFooterStatsBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  tierTrackBackdrop: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tierTrackBar: {
    height: '100%',
    borderRadius: 3,
  },
  tierHeadcountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierHeadcountLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  tierPercentLabel: {
    fontSize: 12,
    fontWeight: '900',
  },

  // -------------------------------------------------------
  // DIRECTORY & SEARCH
  // -------------------------------------------------------
  directoryHeaderControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 12,
  },
  directoryUtilityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  utilBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  utilBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  searchAndFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchFieldBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  searchIconSymbol: {
    fontSize: 14,
    marginRight: 8,
  },
  searchTextInput: {
    flex: 1,
    height: 42,
    fontSize: 13,
  },
  searchClearSymbol: {
    fontSize: 14,
    paddingHorizontal: 6,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusChipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusChipBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sortChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortPrefixText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sortSmallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortSmallBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  employeeListFlow: {
    gap: 12,
  },
  employeeRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    flexWrap: 'wrap',
    gap: 14,
  },
  employeeInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 260,
  },
  employeeAvatarOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeAvatarLetters: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  employeeDetailsCol: {
    flex: 1,
  },
  nameStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  employeeNameTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  statusBadgeHalo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusHaloLabel: {
    fontSize: 11,
    fontWeight: '900',
  },
  employeeRoleText: {
    fontSize: 13,
    marginBottom: 3,
  },
  employeeSalaryText: {
    fontSize: 14,
    fontWeight: '900',
  },
  salaryPerMonth: {
    fontSize: 11,
    fontWeight: '400',
  },
  employeeActionsRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  btnToggleStatus: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnToggleStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  btnDeleteAction: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  btnDeleteActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
  emptySlateContainer: {
    padding: 38,
    alignItems: 'center',
  },
  emptySlateIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptySlateHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySlateBody: {
    fontSize: 12,
    marginTop: 4,
  },

  // -------------------------------------------------------
  // ONBOARD FORM
  // -------------------------------------------------------
  errorAlertBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorAlertText: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 13,
  },
  formRowInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  formInputFlexCol: {
    flex: 1,
    minWidth: 240,
  },
  formInputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formInputBox: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  quickPresetsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 16,
  },
  quickPresetsNotice: {
    fontSize: 11,
    fontWeight: '700',
  },
  presetChipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
  },
  presetChipBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnSubmitEmployee: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  btnSubmitEmployeeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },

  // -------------------------------------------------------
  // AUDIT LOG
  // -------------------------------------------------------
  auditLogList: {
    gap: 12,
  },
  auditRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  auditDotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  auditTextCol: {
    flex: 1,
  },
  auditMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  auditActionTag: {
    fontSize: 11,
    fontWeight: '900',
  },
  auditTimestampText: {
    fontSize: 11,
  },
  auditDetailText: {
    fontSize: 13,
  },

  // -------------------------------------------------------
  // FOOTER
  // -------------------------------------------------------
  footerBarContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    marginTop: 10,
  },
  footerMainNotice: {
    fontSize: 12,
    fontWeight: '800',
  },
  footerTechNotice: {
    fontSize: 11,
    marginTop: 4,
  },
  disabledOpacity: {
    opacity: 0.6,
  },
});
