
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import ProtectedRoute from "@/lib/protected-route";

// Admin routes
import AdminDashboard from "@/pages/admin/dashboard";
import AdminManagers from "@/pages/admin/managers";
import AdminHelpRequests from "@/pages/admin/help-requests";

// Manager routes  
import ManagerDashboard from "@/pages/manager/dashboard";
import ManagerAgents from "@/pages/manager/agents";
import ManagerSalesStaff from "@/pages/manager/sales-staff";
import ManagerAttendance from "@/pages/manager/attendance";
import ManagerReports from "@/pages/manager/reports";
import ManagerPerformance from "@/pages/manager/performance";
import AgentProfile from "@/pages/manager/agent-profile";

// Sales Staff routes
import SalesStaffDashboard from "@/pages/sales-staff/dashboard";
import SalesStaffAgents from "@/pages/sales-staff/agents";
import SalesStaffTeamLeaders from "@/pages/sales-staff/team-leaders";
import SalesStaffAttendance from "@/pages/sales-staff/attendance";
import SalesStaffClients from "@/pages/sales-staff/clients";
import SalesStaffReports from "@/pages/sales-staff/reports";
import SalesStaffMessages from "@/pages/sales-staff/messages";

// Agent routes
import AgentDashboard from "@/pages/agent/dashboard";
import AgentClients from "@/pages/agent/clients";
import AgentAttendance from "@/pages/agent/attendance";

import "./index.css";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard">
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/managers">
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminManagers />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/help-requests">
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminHelpRequests />
            </ProtectedRoute>
          </Route>

          {/* Manager Routes */}
          <Route path="/manager/dashboard">
            <ProtectedRoute allowedRoles={["Manager"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/manager/agents">
            <ProtectedRoute allowedRoles={["Manager"]}>
              <ManagerAgents />
            </ProtectedRoute>
          </Route>
          <Route path="/manager/sales-staff">
            <ProtectedRoute allowedRoles={["Manager"]}>
              <ManagerSalesStaff />
            </ProtectedRoute>
          </Route>
          <Route path="/manager/attendance">
            <ProtectedRoute allowedRoles={["Manager"]}>
              <ManagerAttendance />
            </ProtectedRoute>
          </Route>
          <Route path="/manager/reports">
            <ProtectedRoute allowedRoles={["Manager"]}>
              <ManagerReports />
            </ProtectedRoute>
          </Route>
          <Route path="/manager/performance">
            <ProtectedRoute allowedRoles={["Manager"]}>
              <ManagerPerformance />
            </ProtectedRoute>
          </Route>
          <Route path="/manager/agent/:id">
            <ProtectedRoute allowedRoles={["Manager"]}>
              <AgentProfile />
            </ProtectedRoute>
          </Route>

          {/* Sales Staff Routes */}
          <Route path="/sales-staff/dashboard">
            <ProtectedRoute allowedRoles={["SalesStaff"]}>
              <SalesStaffDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/sales-staff/agents">
            <ProtectedRoute allowedRoles={["SalesStaff"]}>
              <SalesStaffAgents />
            </ProtectedRoute>
          </Route>
          <Route path="/sales-staff/team-leaders">
            <ProtectedRoute allowedRoles={["SalesStaff"]}>
              <SalesStaffTeamLeaders />
            </ProtectedRoute>
          </Route>
          <Route path="/sales-staff/attendance">
            <ProtectedRoute allowedRoles={["SalesStaff"]}>
              <SalesStaffAttendance />
            </ProtectedRoute>
          </Route>
          <Route path="/sales-staff/clients">
            <ProtectedRoute allowedRoles={["SalesStaff"]}>
              <SalesStaffClients />
            </ProtectedRoute>
          </Route>
          <Route path="/sales-staff/reports">
            <ProtectedRoute allowedRoles={["SalesStaff"]}>
              <SalesStaffReports />
            </ProtectedRoute>
          </Route>
          <Route path="/sales-staff/messages">
            <ProtectedRoute allowedRoles={["SalesStaff"]}>
              <SalesStaffMessages />
            </ProtectedRoute>
          </Route>

          {/* Agent Routes */}
          <Route path="/agent/dashboard">
            <ProtectedRoute allowedRoles={["Agent", "TeamLeader"]}>
              <AgentDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/agent/clients">
            <ProtectedRoute allowedRoles={["Agent", "TeamLeader"]}>
              <AgentClients />
            </ProtectedRoute>
          </Route>
          <Route path="/agent/attendance">
            <ProtectedRoute allowedRoles={["Agent", "TeamLeader"]}>
              <AgentAttendance />
            </ProtectedRoute>
          </Route>

          {/* Default route */}
          <Route path="/">
            <AuthPage />
          </Route>

          {/* 404 */}
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
