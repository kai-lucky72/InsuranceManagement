import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requiredRoles,
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredRoles: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if user has required role
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    let redirectTo = "/";
    
    switch (user.role) {
      case "Admin":
        redirectTo = "/admin/dashboard";
        break;
      case "Manager":
        redirectTo = "/manager/dashboard";
        break;
      case "SalesStaff":
        redirectTo = "/sales-staff/dashboard";
        break;
      case "TeamLeader":
      case "Agent":
        redirectTo = "/agent/dashboard";
        break;
      default:
        redirectTo = "/auth";
    }
    
    return (
      <Route path={path}>
        <Redirect to={redirectTo} />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
