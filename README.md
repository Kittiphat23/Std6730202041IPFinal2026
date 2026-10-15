# Final Exam: Internet Programming (2026)
## HR Manager & Salary Analytics System

**Student ID:** 6730202041  
**GitHub Repository Naming:** `Std6730202041IPFinal2026`  
**Database:** `ip_std6730202041` (Table: `final_employees`)  
**Variable Naming Watermark:** Custom variables, functions, and React states end with `THONGPHUM`.

---

## 📁 Project Structure

```text
Std6730202041IPFinal2026/
├── backend/
│   ├── .env                    # Environment variables (port & DB credentials)
│   ├── .env.example            # Example environment template
│   ├── db.js                   # MySQL connection pool & fallback helper
│   ├── kmeans.js               # 1D K-Means clustering algorithm (k=3)
│   ├── package.json            # Backend dependencies & scripts
│   ├── schema.sql              # SQL script to create final_employees table & mock data
│   ├── server.js               # Express.js REST API server
│   └── test_api.js             # Automated API test suite
├── frontend/
│   ├── App.js                  # React Native UI (Login, CRUD, & K-Means Summary Cards)
│   ├── app.json                # Expo configuration
│   ├── config.js               # API URL configuration
│   └── package.json            # Frontend dependencies & scripts
├── run-backend.bat             # 1-Click launcher for Backend
├── run-frontend.bat            # 1-Click launcher for Frontend (Expo Web)
├── run-test.bat                # 1-Click launcher for Automated API Tests
├── .gitignore                  # Git ignore rules
└── README.md                   # Complete documentation & execution guide
```

---

## 🛠️ Requirements & Implementation Details

### Phase 1: Authentication & Employee CRUD (60 Points)
1. **Authentication (`POST /api/login`)**:
   - Credentials: Username `admin`, Password `password123`
   - Success (200 OK): `{ "success": true, "token": "mock-jwt-token" }`
   - Unauthorized (401 Unauthorized): Error message with blocked access
2. **Employee Management CRUD**:
   - `GET /api/employees`: Returns all employee records (at least 5 mock records).
   - `POST /api/employees`: Validates `name`, `position`, and `salary`. Rejects empty submissions with `400 Bad Request`.
   - `PUT /api/employees/:id/status`: Toggles employee status between `Active` and `On Leave`.
   - `DELETE /api/employees/:id`: Deletes employee record from the system.
3. **Frontend React Native UI**:
   - Login form with validation and error alerts.
   - Dashboard displaying employee records (name, position, status, salary).
   - Add Employee form with client-side field validation.
   - Toggle Status button on each employee card.
   - Delete button with Confirmation Alert dialog (`"Are you sure?"`) before dispatching deletion.

### Phase 2: Salary Clustering Analytics (K-Means) (30 Points)
1. **API Endpoint (`GET /api/employees/salary-clusters`)**:
   - Extracts salary values from active employee records.
   - Implements 1D K-Means clustering algorithm ($k=3$).
   - Returns clusters sorted by average salary (centroid) ascending:
     ```json
     {
       "success": true,
       "clusters": [
         { "group": "Tier 1", "centroid": 23500, "count": 2 },
         { "group": "Tier 2", "centroid": 48333, "count": 3 },
         { "group": "Tier 3", "centroid": 84000, "count": 3 }
       ]
     }
     ```
   - Resilient against edge cases (empty data, identical salaries, fewer employees than $k$) without crashing.
2. **Frontend UI**:
   - Prominent **"Analyze Salary Structure"** button.
   - Displays a clean loading indicator while calculation is underway.
   - Renders results into 3 styled summary cards displaying **Tier Name**, **Employee Count**, and **Average Base Salary (Centroid)**.

### Architecture & Database (10 Points)
- **Primary Store:** In-memory Array (strictly compliant with the exam specification).
- **Database Store:** MySQL table `final_employees` in database `ip_std6730202041` (completely isolated from previous DormEase tables).
- **Graceful Fallback:** If MySQL is offline during examiner evaluation, the backend seamlessly falls back to pure In-Memory Array without crashing.

---

## 🚀 How to Run the Project

### 1. Backend Server (Express.js)
```bash
cd backend
npm install
npm start
```
*Backend runs on: `http://localhost:5000`*

### 2. Frontend App (React Native / Expo)
```bash
cd frontend
npm install
npx expo start --web
```
*Or run `npx expo start` to scan QR code on mobile device with Expo Go.*

### 3. Run Automated API Tests
With the backend server running:
```bash
cd backend
npm test
```

---

## 🏷️ Variable Naming Convention
Per the exam requirements, all custom variables, custom functions, and React states end with `THONGPHUM`:
- `employeesMemoryTHONGPHUM`
- `newEmployeeTHONGPHUM`
- `calculateKMeans1DTHONGPHUM`
- `handleLoginTHONGPHUM`
- `handleAddEmployeeTHONGPHUM`
- `handleToggleStatusTHONGPHUM`
- `confirmDeleteEmployeeTHONGPHUM`
- `handleAnalyzeSalaryTHONGPHUM`
- `clustersDataTHONGPHUM`
- etc.

---

## 📤 Git Repository Setup & Push

```bash
git init
git add .
git commit -m "feat: complete Final Exam HR Manager and Salary Analytics System"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Std6730202041IPFinal2026.git
git push -u origin main
```
