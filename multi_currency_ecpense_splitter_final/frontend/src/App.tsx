import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import GroupPage from "./pages/GroupPage";
import AddExpensePage from "./pages/AddExpensePage";
import BalancePage from "./pages/BalancePage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

const App = () => (
  <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/groups"
      element={
        <ProtectedRoute>
          <Layout>
            <GroupPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/expense"
      element={
        <ProtectedRoute>
          <Layout>
            <AddExpensePage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/balances"
      element={
        <ProtectedRoute>
          <Layout>
            <BalancePage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <Layout>
            <ProfilePage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/notifications"
      element={
        <ProtectedRoute>
          <Layout>
            <NotificationsPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;