import { 
  User, InsertUser, AttendanceTimeframe, InsertAttendanceTimeframe, 
  AttendanceRecord, InsertAttendanceRecord, Client, InsertClient,
  AgentGroup, InsertAgentGroup, AgentGroupMember, Report, InsertReport,
  HelpRequest, InsertHelpRequest, Message, PerformanceMetric, InsertPerformanceMetric,
  users, attendanceTimeframes, attendanceRecords, clients, 
  agentGroups, agentGroupMembers, reports, helpRequests, messages, performanceMetrics
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, desc, asc, sql } from "drizzle-orm";
import { Pool } from '@neondatabase/serverless';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);
const scryptAsync = promisify(scrypt);

// Password utilities
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByWorkId(workId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersBySalesStaff(salesStaffId: number): Promise<User[]>;
  getUsersByManager(managerId: number): Promise<User[]>;
  
  // Attendance management
  createAttendanceTimeframe(timeframe: InsertAttendanceTimeframe): Promise<AttendanceTimeframe>;
  getAttendanceTimeframeBySalesStaff(salesStaffId: number): Promise<AttendanceTimeframe | undefined>;
  updateAttendanceTimeframe(id: number, updates: Partial<AttendanceTimeframe>): Promise<AttendanceTimeframe | undefined>;
  
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  getAttendanceRecordsByAgent(agentId: number, date?: Date): Promise<AttendanceRecord[]>;
  getAttendanceRecordsBySalesStaff(salesStaffId: number, date?: Date): Promise<AttendanceRecord[]>;
  updateAttendanceRecord(id: number, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined>;
  
  // Client management
  createClient(client: InsertClient): Promise<Client>;
  getClientsByAgent(agentId: number): Promise<Client[]>;
  getClientsBySalesStaff(salesStaffId: number): Promise<Client[]>;
  getClientsByDateRange(agentId: number, startDate: Date, endDate: Date): Promise<Client[]>;
  
  // Agent Groups
  createAgentGroup(group: InsertAgentGroup): Promise<AgentGroup>;
  getAgentGroupsByTeamLeader(teamLeaderId: number): Promise<AgentGroup[]>;
  getAgentGroupBySalesStaff(salesStaffId: number): Promise<AgentGroup[]>;
  addAgentToGroup(groupId: number, agentId: number): Promise<AgentGroupMember>;
  removeAgentFromGroup(groupId: number, agentId: number): Promise<void>;
  getAgentGroupMembers(groupId: number): Promise<User[]>;
  
  // Reports
  createReport(report: InsertReport): Promise<Report>;
  getReportsByUser(userId: number): Promise<Report[]>;
  getReportsByType(userId: number, type: string): Promise<Report[]>;
  getReportsBySalesStaff(salesStaffId: number): Promise<Report[]>;
  
  // Help Requests
  createHelpRequest(request: InsertHelpRequest): Promise<HelpRequest>;
  getHelpRequests(): Promise<HelpRequest[]>;
  updateHelpRequest(id: number, updates: Partial<HelpRequest>): Promise<HelpRequest | undefined>;
  
  // Messages
  createMessage(senderId: number, receiverId: number, content: string): Promise<Message>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  markMessageAsRead(messageId: number): Promise<void>;
  
  // Performance metrics
  createPerformanceMetric(metricData: InsertPerformanceMetric): Promise<PerformanceMetric>;
  getPerformanceMetricByUser(userId: number, period: string): Promise<PerformanceMetric | undefined>;
  updatePerformanceMetric(id: number, updates: Partial<PerformanceMetric>): Promise<PerformanceMetric | undefined>;
  getPerformanceMetricsByManager(managerId: number): Promise<PerformanceMetric[]>;
  getPerformanceMetricsBySalesStaff(salesStaffId: number): Promise<PerformanceMetric[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
      createTableIfMissing: true
    });
    
    // Initialize default users
    this.initializeDefaultUsers();
  }
  
  async initializeDefaultUsers() {
    const adminExists = await this.getUserByWorkId("ADM001");
    if (!adminExists) {
      await this.createUser({
        workId: "ADM001",
        email: "admin@example.com",
        password: await hashPassword("admin123"),
        fullName: "Admin User",
        role: "Admin",
        isActive: true
      });
    }
    
    const managerExists = await this.getUserByWorkId("MGR001");
    if (!managerExists) {
      await this.createUser({
        workId: "MGR001",
        email: "manager@example.com",
        password: await hashPassword("manager123"),
        fullName: "Manager User",
        role: "Manager",
        isActive: true
      });
    }
    
    const salesStaffExists = await this.getUserByWorkId("SLF001");
    if (!salesStaffExists) {
      await this.createUser({
        workId: "SLF001",
        email: "sales@example.com",
        password: await hashPassword("sales123"),
        fullName: "Sales Staff User",
        role: "SalesStaff",
        isActive: true
      });
    }
    
    const agentExists = await this.getUserByWorkId("AGT001");
    if (!agentExists) {
      await this.createUser({
        workId: "AGT001",
        email: "agent@example.com",
        password: await hashPassword("agent123"),
        fullName: "Agent User",
        role: "Agent",
        isActive: true
      });
    }
    
    // Create a TeamLeader agent
    const teamLeaderExists = await this.getUserByWorkId("AGT002");
    if (!teamLeaderExists) {
      await this.createUser({
        workId: "AGT002",
        email: "teamleader@example.com",
        password: await hashPassword("agent123"),
        fullName: "Team Leader User",
        role: "TeamLeader",
        isActive: true
      });
    }
    
    // Set up default attendance timeframe for the sales staff
    const salesStaff = await this.getUserByWorkId("SLF001");
    if (salesStaff) {
      const timeframeExists = await this.getAttendanceTimeframeBySalesStaff(salesStaff.id);
      if (!timeframeExists) {
        await this.createAttendanceTimeframe({
          salesStaffId: salesStaff.id,
          startTime: "08:00",
          endTime: "09:30"
        });
      }
    }
  }
  
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByWorkId(workId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.workId, workId));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        sql`${users.role}::text = ${role}`,
        eq(users.isActive, true)
      ));
  }

  async getUsersBySalesStaff(salesStaffId: number): Promise<User[]> {
    // Get all groups managed by this sales staff
    const groups = await this.getAgentGroupBySalesStaff(salesStaffId);
    const groupIds = groups.map(group => group.id);
    
    if (groupIds.length === 0) {
      // If no groups, return empty array
      return [];
    }
    
    // Get all agents in these groups
    const groupMembers = await db
      .select()
      .from(agentGroupMembers)
      .where(sql`${agentGroupMembers.groupId} IN (${groupIds.join(',')})`);
    
    if (groupMembers.length === 0) {
      return [];
    }
    
    const agentIds = groupMembers.map(member => member.agentId);
    
    // Get all agents (either directly managed or part of a team leader's group)
    return await db
      .select()
      .from(users)
      .where(and(
        sql`${users.role}::text IN ('Agent', 'TeamLeader')`,
        eq(users.isActive, true),
        sql`${users.id} IN (${agentIds.join(',')})`
      ));
  }

  async getUsersByManager(managerId: number): Promise<User[]> {
    // For MVPs, just return all sales staff
    return await db
      .select()
      .from(users)
      .where(and(
        sql`${users.role}::text = 'SalesStaff'`,
        eq(users.isActive, true)
      ));
  }

  // Attendance Management
  async createAttendanceTimeframe(timeframeData: InsertAttendanceTimeframe): Promise<AttendanceTimeframe> {
    const [timeframe] = await db
      .insert(attendanceTimeframes)
      .values(timeframeData)
      .returning();
    return timeframe;
  }

  async getAttendanceTimeframeBySalesStaff(salesStaffId: number): Promise<AttendanceTimeframe | undefined> {
    const [timeframe] = await db
      .select()
      .from(attendanceTimeframes)
      .where(eq(attendanceTimeframes.salesStaffId, salesStaffId));
    return timeframe;
  }

  async updateAttendanceTimeframe(id: number, updates: Partial<AttendanceTimeframe>): Promise<AttendanceTimeframe | undefined> {
    const [updatedTimeframe] = await db
      .update(attendanceTimeframes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(attendanceTimeframes.id, id))
      .returning();
    return updatedTimeframe;
  }

  async createAttendanceRecord(recordData: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [record] = await db
      .insert(attendanceRecords)
      .values(recordData)
      .returning();
    return record;
  }

  async getAttendanceRecordsByAgent(agentId: number, date?: Date): Promise<AttendanceRecord[]> {
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await db
        .select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.agentId, agentId),
          gte(attendanceRecords.checkInTime, startOfDay),
          lte(attendanceRecords.checkInTime, endOfDay)
        ));
    }
    
    return await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.agentId, agentId))
      .orderBy(desc(attendanceRecords.checkInTime));
  }

  async getAttendanceRecordsBySalesStaff(salesStaffId: number, date?: Date): Promise<AttendanceRecord[]> {
    // Get all agents managed by this sales staff
    const agents = await this.getUsersBySalesStaff(salesStaffId);
    if (agents.length === 0) {
      return [];
    }
    
    const agentIds = agents.map(agent => agent.id);
    
    // Query attendance records
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await db
        .select()
        .from(attendanceRecords)
        .where(and(
          sql`${attendanceRecords.agentId} IN (${agentIds.join(',')})`,
          gte(attendanceRecords.checkInTime, startOfDay),
          lte(attendanceRecords.checkInTime, endOfDay)
        ))
        .orderBy(desc(attendanceRecords.checkInTime));
    }
    
    return await db
      .select()
      .from(attendanceRecords)
      .where(sql`${attendanceRecords.agentId} IN (${agentIds.join(',')})`)
      .orderBy(desc(attendanceRecords.checkInTime));
  }

  async updateAttendanceRecord(id: number, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const [updatedRecord] = await db
      .update(attendanceRecords)
      .set(updates)
      .where(eq(attendanceRecords.id, id))
      .returning();
    return updatedRecord;
  }

  // Client Management
  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(clientData)
      .returning();
    return client;
  }

  async getClientsByAgent(agentId: number): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.agentId, agentId))
      .orderBy(desc(clients.createdAt));
  }

  async getClientsBySalesStaff(salesStaffId: number): Promise<Client[]> {
    // Get all agents under this sales staff
    const agents = await this.getUsersBySalesStaff(salesStaffId);
    if (agents.length === 0) {
      return [];
    }
    
    const agentIds = agents.map(agent => agent.id);
    
    return await db
      .select()
      .from(clients)
      .where(sql`${clients.agentId} IN (${agentIds.join(',')})`)
      .orderBy(desc(clients.createdAt));
  }

  async getClientsByDateRange(agentId: number, startDate: Date, endDate: Date): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(and(
        eq(clients.agentId, agentId),
        gte(clients.interactionTime, startDate),
        lte(clients.interactionTime, endDate)
      ))
      .orderBy(desc(clients.createdAt));
  }

  // Agent Groups
  async createAgentGroup(groupData: InsertAgentGroup): Promise<AgentGroup> {
    const [group] = await db
      .insert(agentGroups)
      .values(groupData)
      .returning();
    return group;
  }

  async getAgentGroupsByTeamLeader(teamLeaderId: number): Promise<AgentGroup[]> {
    return await db
      .select()
      .from(agentGroups)
      .where(eq(agentGroups.teamLeaderId, teamLeaderId));
  }

  async getAgentGroupBySalesStaff(salesStaffId: number): Promise<AgentGroup[]> {
    return await db
      .select()
      .from(agentGroups)
      .where(eq(agentGroups.salesStaffId, salesStaffId));
  }

  async addAgentToGroup(groupId: number, agentId: number): Promise<AgentGroupMember> {
    const [member] = await db
      .insert(agentGroupMembers)
      .values({
        groupId,
        agentId
      })
      .returning();
    return member;
  }

  async removeAgentFromGroup(groupId: number, agentId: number): Promise<void> {
    await db
      .delete(agentGroupMembers)
      .where(and(
        eq(agentGroupMembers.groupId, groupId),
        eq(agentGroupMembers.agentId, agentId)
      ));
  }

  async getAgentGroupMembers(groupId: number): Promise<User[]> {
    const members = await db
      .select({
        agentId: agentGroupMembers.agentId
      })
      .from(agentGroupMembers)
      .where(eq(agentGroupMembers.groupId, groupId));
    
    if (members.length === 0) {
      return [];
    }
    
    const agentIds = members.map(member => member.agentId);
    
    return await db
      .select()
      .from(users)
      .where(sql`${users.id} IN (${agentIds.join(',')})`);
  }

  // Reports
  async createReport(reportData: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(reportData)
      .returning();
    return report;
  }

  async getReportsByUser(userId: number): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.submittedById, userId))
      .orderBy(desc(reports.createdAt));
  }

  async getReportsByType(userId: number, type: string): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.submittedById, userId),
        eq(reports.reportType, type)
      ))
      .orderBy(desc(reports.createdAt));
  }

  async getReportsBySalesStaff(salesStaffId: number): Promise<Report[]> {
    // Get all agents under this sales staff
    const agents = await this.getUsersBySalesStaff(salesStaffId);
    if (agents.length === 0) {
      return [];
    }
    
    const agentIds = agents.map(agent => agent.id);
    
    return await db
      .select()
      .from(reports)
      .where(sql`${reports.submittedById} IN (${agentIds.join(',')})`)
      .orderBy(desc(reports.createdAt));
  }

  // Help Requests
  async createHelpRequest(requestData: InsertHelpRequest): Promise<HelpRequest> {
    const [request] = await db
      .insert(helpRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async getHelpRequests(): Promise<HelpRequest[]> {
    return await db
      .select()
      .from(helpRequests)
      .orderBy(desc(helpRequests.createdAt));
  }

  async updateHelpRequest(id: number, updates: Partial<HelpRequest>): Promise<HelpRequest | undefined> {
    const [updatedRequest] = await db
      .update(helpRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(helpRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Messages
  async createMessage(senderId: number, receiverId: number, content: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        senderId,
        receiverId,
        content,
        isRead: false
      })
      .returning();
    return message;
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      ))
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  // Performance metrics methods
  async createPerformanceMetric(metricData: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const [metric] = await db
      .insert(performanceMetrics)
      .values(metricData)
      .returning();
    return metric;
  }

  async getPerformanceMetricByUser(userId: number, period: string): Promise<PerformanceMetric | undefined> {
    const [metric] = await db
      .select()
      .from(performanceMetrics)
      .where(and(
        eq(performanceMetrics.userId, userId),
        eq(performanceMetrics.period, period)
      ))
      .orderBy(desc(performanceMetrics.createdAt))
      .limit(1);
    return metric;
  }

  async updatePerformanceMetric(id: number, updates: Partial<PerformanceMetric>): Promise<PerformanceMetric | undefined> {
    const [updatedMetric] = await db
      .update(performanceMetrics)
      .set(updates)
      .where(eq(performanceMetrics.id, id))
      .returning();
    return updatedMetric;
  }

  async getPerformanceMetricsByManager(managerId: number): Promise<PerformanceMetric[]> {
    // Get all salesStaff under this manager
    const salesStaff = await this.getUsersByManager(managerId);
    if (salesStaff.length === 0) {
      return [];
    }
    
    const salesStaffIds = salesStaff.map(staff => staff.id);
    
    return await db
      .select()
      .from(performanceMetrics)
      .where(sql`${performanceMetrics.userId} IN (${salesStaffIds.join(',')})`)
      .orderBy(desc(performanceMetrics.createdAt));
  }

  async getPerformanceMetricsBySalesStaff(salesStaffId: number): Promise<PerformanceMetric[]> {
    // Get all agents under this sales staff
    const agents = await this.getUsersBySalesStaff(salesStaffId);
    if (agents.length === 0) {
      return [];
    }
    
    const agentIds = agents.map(agent => agent.id);
    
    return await db
      .select()
      .from(performanceMetrics)
      .where(sql`${performanceMetrics.userId} IN (${agentIds.join(',')})`)
      .orderBy(desc(performanceMetrics.createdAt));
  }
}

// Initialize storage
export const storage = new DatabaseStorage();