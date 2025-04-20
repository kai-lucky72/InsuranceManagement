import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminManagers from "@/pages/admin/managers";
import AdminHelpRequests from "@/pages/admin/help-requests";

// Manager pages
import ManagerDashboard from "@/pages/manager/dashboard";
import ManagerSalesStaff from "@/pages/manager/sales-staff";
import ManagerAgents from "@/pages/manager/agents";
import ManagerAttendance from "@/pages/manager/attendance";
import ManagerReports from "@/pages/manager/reports";
import ManagerAgentProfile from "@/pages/manager/agent-profile";

// Sales Staff pages
import SalesStaffDashboard from "@/pages/sales-staff/dashboard";
import SalesStaffAgents from "@/pages/sales-staff/agents";
import SalesStaffAttendance from "@/pages/sales-staff/attendance";
import SalesStaffClients from "@/pages/sales-staff/clients";
import SalesStaffReports from "@/pages/sales-staff/reports";
import SalesStaffTeamLeaders from "@/pages/sales-staff/team-leaders";
import SalesStaffMessages from "@/pages/sales-staff/messages";

// Agent pages
import AgentDashboard from "@/pages/agent/dashboard";
import AgentAttendance from "@/pages/agent/attendance";
import AgentClients from "@/pages/agent/clients";

function Router() {
  return (
    <Switch>
      {/* Auth route - public */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/" requiredRoles={["Admin"]} component={AdminDashboard} />
      <ProtectedRoute path="/admin/dashboard" requiredRoles={["Admin"]} component={AdminDashboard} />
      <ProtectedRoute path="/admin/managers" requiredRoles={["Admin"]} component={AdminManagers} />
      <ProtectedRoute path="/admin/help-requests" requiredRoles={["Admin"]} component={AdminHelpRequests} />
      
      {/* Manager routes */}
      <ProtectedRoute path="/manager/dashboard" requiredRoles={["Manager"]} component={ManagerDashboard} />
      <ProtectedRoute path="/manager/sales-staff" requiredRoles={["Manager"]} component={ManagerSalesStaff} />
      <ProtectedRoute path="/manager/agents" requiredRoles={["Manager"]} component={ManagerAgents} />
      <ProtectedRoute path="/manager/attendance" requiredRoles={["Manager"]} component={ManagerAttendance} />
      <ProtectedRoute path="/manager/reports" requiredRoles={["Manager"]} component={ManagerReports} />
      <ProtectedRoute path="/manager/agents/:id" requiredRoles={["Manager"]} component={ManagerAgentProfile} />
      
      {/* Sales Staff routes */}
      <ProtectedRoute path="/sales-staff/dashboard" requiredRoles={["SalesStaff"]} component={SalesStaffDashboard} />
      <ProtectedRoute path="/sales-staff/agents" requiredRoles={["SalesStaff"]} component={SalesStaffAgents} />
      <ProtectedRoute path="/sales-staff/attendance" requiredRoles={["SalesStaff"]} component={SalesStaffAttendance} />
      <ProtectedRoute path="/sales-staff/clients" requiredRoles={["SalesStaff"]} component={SalesStaffClients} />
      <ProtectedRoute path="/sales-staff/team-leaders" requiredRoles={["SalesStaff"]} component={SalesStaffTeamLeaders} />
      <ProtectedRoute path="/sales-staff/reports" requiredRoles={["SalesStaff"]} component={SalesStaffReports} />
      <ProtectedRoute path="/sales-staff/messages" requiredRoles={["SalesStaff"]} component={SalesStaffMessages} />
      
      {/* Agent routes */}
      <ProtectedRoute path="/agent/dashboard" requiredRoles={["Agent", "TeamLeader"]} component={AgentDashboard} />
      <ProtectedRoute path="/agent/attendance" requiredRoles={["Agent", "TeamLeader"]} component={AgentAttendance} />
      <ProtectedRoute path="/agent/clients" requiredRoles={["Agent", "TeamLeader"]} component={AgentClients} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
