
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ReportIssue from "./pages/ReportIssue";
import MyIssues from "./pages/MyIssues";
import EditIssue from "./pages/EditIssue";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import Notifications from "./pages/Notifications";
import TrackIssue from "./pages/TrackIssue";
import AdminAnalytics from "./pages/AdminAnalytics";

import ProtectedRoute from "./components/ProtectedRoute";

function getDashboardPath() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return "/login";

  try {
    const user = JSON.parse(storedUser);

    if (user.role === "ADMIN") return "/admin-dashboard";
    if (user.role === "STAFF") return "/staff-dashboard";

    return "/dashboard";
  } catch {
    localStorage.removeItem("user");
    return "/login";
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to={getDashboardPath()} replace />}
        />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/report-issue"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <ReportIssue />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-issues"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <MyIssues />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-issue/:id"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <EditIssue />
            </ProtectedRoute>
          }
        />

        {/* Staff route */}
        <Route
          path="/staff-dashboard"
          element={
            <ProtectedRoute allowedRoles={["STAFF"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-analytics"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Shared routes */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute
              allowedRoles={["STUDENT", "STAFF", "ADMIN"]}
            >
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/track-issue/:id"
          element={
            <ProtectedRoute
              allowedRoles={["STUDENT", "STAFF", "ADMIN"]}
            >
              <TrackIssue />
            </ProtectedRoute>
          }
        />

        {/* Unknown route */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;