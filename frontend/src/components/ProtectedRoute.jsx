
import { Navigate } from "react-router-dom";

function ProtectedRoute({ allowedRoles, children }) {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  if (!user || !user.role) {
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "ADMIN") {
      return <Navigate to="/admin-dashboard" replace />;
    }

    if (user.role === "STAFF") {
      return <Navigate to="/staff-dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;