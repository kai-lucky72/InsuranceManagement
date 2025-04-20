import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";

// Define allowed roles for different routes
const roleRoutePermissions: Record<string, string[]> = {
  "/api/admin": ["Admin"],
  "/api/manager": ["Admin", "Manager"],
  "/api/sales-staff": ["Admin", "Manager", "SalesStaff"],
  "/api/agent": ["Admin", "Manager", "SalesStaff", "Agent"],
  "/api/team-leader": ["Admin", "Manager", "SalesStaff", "TeamLeader"],
};

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

export function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as User;
    
    if (!roles.includes(user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    
    next();
  };
}

export function checkRolePermission(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const user = req.user as User;
  const path = req.path;
  
  // Check which API route prefix the current path starts with
  for (const [route, allowedRoles] of Object.entries(roleRoutePermissions)) {
    if (path.startsWith(route) && !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
  }
  
  next();
}
