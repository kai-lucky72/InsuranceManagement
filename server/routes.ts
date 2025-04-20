import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { isAuthenticated, hasRole } from "./middleware/auth.middleware";
import { insertAttendanceRecordSchema, insertAttendanceTimeframeSchema, insertClientSchema, insertHelpRequestSchema, insertReportSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // API Routes
  // Helper function to handle validation errors
  const validateBody = (schema: z.ZodType<any, any>) => {
    return (req: Request, res: Response, next: Function) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message
            }))
          });
        }
        next(error);
      }
    };
  };

  // Auth routes are already set up in auth.ts

  // Admin routes
  app.get("/api/admin/managers", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const managers = await storage.getUsersByRole("Manager");
      res.json(managers.map(manager => ({
        id: manager.id,
        workId: manager.workId,
        email: manager.email,
        fullName: manager.fullName,
        role: manager.role,
        isActive: manager.isActive
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch managers" });
    }
  });

  app.post("/api/admin/managers", isAuthenticated, hasRole(["Admin"]), validateBody(insertUserSchema), async (req, res) => {
    try {
      const userData = {
        ...req.body,
        role: "Manager"
      };
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const existingWorkId = await storage.getUserByWorkId(userData.workId);
      if (existingWorkId) {
        return res.status(400).json({ message: "User with this work ID already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json({
        id: user.id,
        workId: user.workId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create manager" });
    }
  });

  app.patch("/api/admin/managers/:id", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const managerId = parseInt(req.params.id);
      const manager = await storage.getUser(managerId);
      
      if (!manager || manager.role !== "Manager") {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      const updatedManager = await storage.updateUser(managerId, req.body);
      if (!updatedManager) {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      res.json({
        id: updatedManager.id,
        workId: updatedManager.workId,
        email: updatedManager.email,
        fullName: updatedManager.fullName,
        role: updatedManager.role,
        isActive: updatedManager.isActive
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update manager" });
    }
  });

  app.get("/api/admin/help-requests", isAuthenticated, hasRole(["Admin"]), async (req, res) => {
    try {
      const helpRequests = await storage.getHelpRequests();
      res.json(helpRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch help requests" });
    }
  });

  // Manager routes
  app.get("/api/manager/sales-staff", isAuthenticated, hasRole(["Admin", "Manager"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      
      // For Admin, get all sales staff
      if (user.role === "Admin") {
        const salesStaff = await storage.getUsersByRole("SalesStaff");
        return res.json(salesStaff.map(staff => ({
          id: staff.id,
          workId: staff.workId,
          email: staff.email,
          fullName: staff.fullName,
          role: staff.role,
          isActive: staff.isActive
        })));
      }
      
      // For Manager, get only sales staff they manage
      const salesStaff = await storage.getUsersByManager(user.id);
      res.json(salesStaff.map(staff => ({
        id: staff.id,
        workId: staff.workId,
        email: staff.email,
        fullName: staff.fullName,
        role: staff.role,
        isActive: staff.isActive
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales staff" });
    }
  });

  app.post("/api/manager/sales-staff", isAuthenticated, hasRole(["Admin", "Manager"]), validateBody(insertUserSchema), async (req, res) => {
    try {
      const userData = {
        ...req.body,
        role: "SalesStaff"
      };
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const existingWorkId = await storage.getUserByWorkId(userData.workId);
      if (existingWorkId) {
        return res.status(400).json({ message: "User with this work ID already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json({
        id: user.id,
        workId: user.workId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create sales staff" });
    }
  });

  app.patch("/api/manager/sales-staff/:id", isAuthenticated, hasRole(["Admin", "Manager"]), async (req, res) => {
    try {
      const staffId = parseInt(req.params.id);
      const staff = await storage.getUser(staffId);
      
      if (!staff || staff.role !== "SalesStaff") {
        return res.status(404).json({ message: "Sales staff not found" });
      }
      
      const updatedStaff = await storage.updateUser(staffId, req.body);
      if (!updatedStaff) {
        return res.status(404).json({ message: "Sales staff not found" });
      }
      
      res.json({
        id: updatedStaff.id,
        workId: updatedStaff.workId,
        email: updatedStaff.email,
        fullName: updatedStaff.fullName,
        role: updatedStaff.role,
        isActive: updatedStaff.isActive
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update sales staff" });
    }
  });

  // Sales Staff routes
  app.get("/api/sales-staff/attendance-timeframe", isAuthenticated, hasRole(["Admin", "Manager", "SalesStaff"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      let salesStaffId = user.id;
      
      // If admin or manager is requesting a specific sales staff's timeframe
      if ((user.role === "Admin" || user.role === "Manager") && req.query.salesStaffId) {
        salesStaffId = parseInt(req.query.salesStaffId as string);
      }
      
      const timeframe = await storage.getAttendanceTimeframeBySalesStaff(salesStaffId);
      if (!timeframe) {
        return res.status(404).json({ message: "Attendance timeframe not found" });
      }
      
      res.json(timeframe);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance timeframe" });
    }
  });

  app.post("/api/sales-staff/attendance-timeframe", isAuthenticated, hasRole(["SalesStaff"]), validateBody(insertAttendanceTimeframeSchema), async (req, res) => {
    try {
      const user = req.user as Express.User;
      
      // Check if timeframe already exists
      const existingTimeframe = await storage.getAttendanceTimeframeBySalesStaff(user.id);
      
      if (existingTimeframe) {
        // Update existing timeframe
        const updatedTimeframe = await storage.updateAttendanceTimeframe(existingTimeframe.id, req.body);
        return res.json(updatedTimeframe);
      }
      
      // Create new timeframe
      const timeframeData = {
        ...req.body,
        salesStaffId: user.id
      };
      
      const timeframe = await storage.createAttendanceTimeframe(timeframeData);
      res.status(201).json(timeframe);
    } catch (error) {
      res.status(500).json({ message: "Failed to set attendance timeframe" });
    }
  });

  app.get("/api/sales-staff/agents", isAuthenticated, hasRole(["Admin", "Manager", "SalesStaff"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      let salesStaffId = user.id;
      
      // If admin or manager is requesting a specific sales staff's agents
      if ((user.role === "Admin" || user.role === "Manager") && req.query.salesStaffId) {
        salesStaffId = parseInt(req.query.salesStaffId as string);
      }
      
      const agents = await storage.getUsersBySalesStaff(salesStaffId);
      res.json(agents.map(agent => ({
        id: agent.id,
        workId: agent.workId,
        email: agent.email,
        fullName: agent.fullName,
        role: agent.role,
        isActive: agent.isActive
      })));
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.post("/api/sales-staff/agents", isAuthenticated, hasRole(["SalesStaff"]), validateBody(insertUserSchema), async (req, res) => {
    try {
      const { type, ...userData } = req.body;
      
      // Determine if creating a regular agent or team leader
      const role = type === "TeamLeader" ? "TeamLeader" : "Agent";
      
      const newUserData = {
        ...userData,
        role
      };
      
      const existingUser = await storage.getUserByEmail(newUserData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const existingWorkId = await storage.getUserByWorkId(newUserData.workId);
      if (existingWorkId) {
        return res.status(400).json({ message: "User with this work ID already exists" });
      }
      
      const user = await storage.createUser(newUserData);
      
      // If this is a team leader, create an agent group for them
      if (role === "TeamLeader") {
        const salesStaff = req.user as Express.User;
        
        await storage.createAgentGroup({
          teamLeaderId: user.id,
          salesStaffId: salesStaff.id,
          name: `${user.fullName}'s Group`
        });
      }
      
      res.status(201).json({
        id: user.id,
        workId: user.workId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.get("/api/sales-staff/agent-groups", isAuthenticated, hasRole(["SalesStaff"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      const groups = await storage.getAgentGroupBySalesStaff(user.id);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent groups" });
    }
  });

  app.post("/api/sales-staff/agent-groups/:groupId/members", isAuthenticated, hasRole(["SalesStaff"]), async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const { agentId } = req.body;
      
      if (!agentId) {
        return res.status(400).json({ message: "Agent ID is required" });
      }
      
      const agent = await storage.getUser(agentId);
      if (!agent || (agent.role !== "Agent" && agent.role !== "TeamLeader")) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const member = await storage.addAgentToGroup(groupId, agentId);
      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to add agent to group" });
    }
  });

  app.delete("/api/sales-staff/agent-groups/:groupId/members/:agentId", isAuthenticated, hasRole(["SalesStaff"]), async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const agentId = parseInt(req.params.agentId);
      
      await storage.removeAgentFromGroup(groupId, agentId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove agent from group" });
    }
  });

  app.get("/api/sales-staff/attendance", isAuthenticated, hasRole(["Admin", "Manager", "SalesStaff"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      let salesStaffId = user.id;
      
      // If admin or manager is requesting a specific sales staff's attendance records
      if ((user.role === "Admin" || user.role === "Manager") && req.query.salesStaffId) {
        salesStaffId = parseInt(req.query.salesStaffId as string);
      }
      
      let date: Date | undefined;
      if (req.query.date) {
        date = new Date(req.query.date as string);
      }
      
      const records = await storage.getAttendanceRecordsBySalesStaff(salesStaffId, date);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  app.patch("/api/sales-staff/attendance/:id/excuse", isAuthenticated, hasRole(["SalesStaff"]), async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Excuse reason is required" });
      }
      
      const user = req.user as Express.User;
      
      const updatedRecord = await storage.updateAttendanceRecord(recordId, {
        isExcused: true,
        excusedById: user.id,
        excuseReason: reason
      });
      
      if (!updatedRecord) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ message: "Failed to excuse attendance" });
    }
  });

  app.get("/api/sales-staff/reports", isAuthenticated, hasRole(["Admin", "Manager", "SalesStaff"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      let salesStaffId = user.id;
      
      // If admin or manager is requesting a specific sales staff's reports
      if ((user.role === "Admin" || user.role === "Manager") && req.query.salesStaffId) {
        salesStaffId = parseInt(req.query.salesStaffId as string);
      }
      
      const reports = await storage.getReportsBySalesStaff(salesStaffId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Team Leader routes
  app.get("/api/team-leader/groups/:id/members", isAuthenticated, hasRole(["TeamLeader"]), async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const members = await storage.getAgentGroupMembers(groupId);
      res.json(members.map(member => ({
        id: member.id,
        workId: member.workId,
        email: member.email,
        fullName: member.fullName,
        role: member.role,
        isActive: member.isActive
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group members" });
    }
  });

  app.get("/api/team-leader/groups/:id/reports/:type", isAuthenticated, hasRole(["TeamLeader"]), async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const reportType = req.params.type; // daily, weekly, monthly
      
      const user = req.user as Express.User;
      
      const reports = await storage.getReportsByType(user.id, reportType);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/team-leader/groups/:id/reports/aggregate", isAuthenticated, hasRole(["TeamLeader"]), validateBody(insertReportSchema), async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const user = req.user as Express.User;
      
      const reportData = {
        ...req.body,
        submittedById: user.id,
        isAggregated: true
      };
      
      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to create aggregated report" });
    }
  });

  // Agent routes
  app.get("/api/agent/attendance-window", isAuthenticated, hasRole(["Agent", "TeamLeader"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      
      // Get the agent's sales staff through relationships
      // For this MVP, we'll find the sales staff by querying agent groups and attendance timeframes
      const salesStaff = await storage.getUsersByRole("SalesStaff");
      
      // For each sales staff, check if they have agents
      for (const staff of salesStaff) {
        const agents = await storage.getUsersBySalesStaff(staff.id);
        
        // If the current user is one of their agents
        if (agents.some(agent => agent.id === user.id)) {
          // Get the attendance timeframe set by this sales staff
          const timeframe = await storage.getAttendanceTimeframeBySalesStaff(staff.id);
          
          if (timeframe) {
            return res.json({
              startTime: timeframe.startTime,
              endTime: timeframe.endTime,
              salesStaffId: staff.id,
              salesStaffName: staff.fullName
            });
          }
        }
      }
      
      // If no timeframe found
      res.status(404).json({ message: "No attendance window found for this agent" });
    } catch (error) {
      console.error("Attendance window error:", error);
      res.status(500).json({ message: "Failed to fetch attendance window" });
    }
  });

  app.post("/api/agent/attendance", isAuthenticated, hasRole(["Agent", "TeamLeader"]), validateBody(insertAttendanceRecordSchema), async (req, res) => {
    try {
      const user = req.user as Express.User;
      const now = new Date();
      
      // Check if agent already checked in today
      const todayRecords = await storage.getAttendanceRecordsByAgent(user.id, now);
      
      if (todayRecords.length > 0) {
        return res.status(400).json({ message: "Already checked in today" });
      }
      
      // Determine if check-in is late based on timeframe
      // (In a real app, we would retrieve the timeframe and compare)
      const isLate = req.body.isLate || false;
      
      const recordData = {
        agentId: user.id,
        checkInTime: now,
        isLate,
        isExcused: false
      };
      
      const record = await storage.createAttendanceRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to record attendance" });
    }
  });

  app.get("/api/agent/attendance", isAuthenticated, hasRole(["Agent", "TeamLeader"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      
      let date: Date | undefined;
      if (req.query.date) {
        date = new Date(req.query.date as string);
      }
      
      const records = await storage.getAttendanceRecordsByAgent(user.id, date);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  app.get("/api/agent/clients", isAuthenticated, hasRole(["Agent", "TeamLeader"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      const clients = await storage.getClientsByAgent(user.id);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/agent/clients", isAuthenticated, hasRole(["Agent", "TeamLeader"]), validateBody(insertClientSchema), async (req, res) => {
    try {
      const user = req.user as Express.User;
      
      // Check if agent has checked in today or is excused
      const today = new Date();
      const attendanceRecords = await storage.getAttendanceRecordsByAgent(user.id, today);
      
      const hasCheckedIn = attendanceRecords.length > 0;
      const isExcused = hasCheckedIn && attendanceRecords[0].isExcused;
      
      if (!hasCheckedIn && !isExcused) {
        return res.status(403).json({ 
          message: "You must check in for attendance before adding clients" 
        });
      }
      
      const clientData = {
        ...req.body,
        agentId: user.id
      };
      
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to add client" });
    }
  });

  app.get("/api/agent/performance/:period", isAuthenticated, hasRole(["Agent", "TeamLeader"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      const period = req.params.period; // daily, weekly, monthly
      
      const now = new Date();
      let startDate = new Date();
      
      // Set start date based on period
      if (period === "daily") {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "weekly") {
        startDate.setDate(now.getDate() - 7);
      } else if (period === "monthly") {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        return res.status(400).json({ message: "Invalid period" });
      }
      
      const clients = await storage.getClientsByDateRange(user.id, startDate, now);
      
      // Get attendance records for the same period
      let attendanceRecords: any[] = [];
      
      // Calculate performance metrics
      const performance = {
        period,
        clientsAdded: clients.length,
        attendanceRate: attendanceRecords.length > 0 ? 
          (attendanceRecords.filter(r => r.isExcused || !r.isLate).length / attendanceRecords.length) * 100 : 0,
        clients
      };
      
      res.json(performance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance data" });
    }
  });

  app.post("/api/agent/reports", isAuthenticated, hasRole(["Agent", "TeamLeader"]), validateBody(insertReportSchema), async (req, res) => {
    try {
      const user = req.user as Express.User;
      
      const reportData = {
        ...req.body,
        submittedById: user.id,
        isAggregated: false
      };
      
      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Help requests
  app.post("/api/help-requests", isAuthenticated, validateBody(insertHelpRequestSchema), async (req, res) => {
    try {
      const user = req.user as Express.User;
      
      const requestData = {
        ...req.body,
        userId: user.id
      };
      
      const request = await storage.createHelpRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to create help request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
