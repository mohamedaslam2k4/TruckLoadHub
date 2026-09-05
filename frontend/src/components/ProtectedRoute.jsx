import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ userRole, allowedRoles = [] }) => {
  let storedRole = userRole;

  if (!storedRole) {
    const rawUser = sessionStorage.getItem("user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        storedRole = parsed.role;
      } catch (e) {
        storedRole = null;
      }
    }
  }

  if (!storedRole) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = storedRole.toUpperCase();
  const allowed = allowedRoles.map((role) => role.toUpperCase());

  if (!allowed.includes(currentRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;