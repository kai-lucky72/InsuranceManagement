import { 
  User, InsertUser, AttendanceTimeframe, InsertAttendanceTimeframe, 
  AttendanceRecord, InsertAttendanceRecord, Client, InsertClient,
  AgentGroup, InsertAgentGroup, AgentGroupMember, Report, InsertReport,
  HelpRequest, InsertHelpRequest, Message
} from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private attendanceTimeframes: Map<number, AttendanceTimeframe>;
  private attendanceRecords: Map<number, AttendanceRecord>;
  private clients: Map<number, Client>;
  private agentGroups: Map<number, AgentGroup>;
  private agentGroupMembers: Map<number, AgentGroupMember>;
  private reports: Map<number, Report>;
  private helpRequests: Map<number, HelpRequest>;
  private messages: Map<number, Message>;
  
  sessionStore: session.Store;
  
  private nextIds: {
    user: number;
    attendanceTimeframe: number;
    attendanceRecord: number;
    client: number;
    agentGroup: number;
    agentGroupMember: number;
    report: number;
    helpRequest: number;
    message: number;
  };

  constructor() {
    this.users = new Map();
    this.attendanceTimeframes = new Map();
    this.attendanceRecords = new Map();
    this.clients = new Map();
    this.agentGroups = new Map();
    this.agentGroupMembers = new Map();
    this.reports = new Map();
    this.helpRequests = new Map();
    this.messages = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
    this.nextIds = {
      user: 1,
      attendanceTimeframe: 1,
      attendanceRecord: 1,
      client: 1,
      agentGroup: 1,
      agentGroupMember: 1,
      report: 1,
      helpRequest: 1,
      message: 1
    };
    
    // Create default users on initialization
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers() {
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
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByWorkId(workId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.workId === workId);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.nextIds.user++;
    const now = new Date();
    const user: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === role && user.isActive);
  }

  async getUsersBySalesStaff(salesStaffId: number): Promise<User[]> {
    // Get all agents that belong to groups managed by this sales staff
    const salesStaffGroups = await this.getAgentGroupBySalesStaff(salesStaffId);
    const groupMemberIds = new Set<number>();
    
    for (const group of salesStaffGroups) {
      const members = await this.getAgentGroupMembers(group.id);
      members.forEach(member => groupMemberIds.add(member.id));
    }
    
    // Also include individual agents directly under this sales staff
    const allAgents = await this.getUsersByRole("Agent");
    const teamLeaders = await this.getUsersByRole("TeamLeader");
    
    // Combine all users who are either team leaders or regular agents managed by this sales staff
    return [...allAgents, ...teamLeaders].filter(user => {
      // Either the user is in a group managed by this sales staff
      // or is an individual agent not in any group
      return groupMemberIds.has(user.id) || !this.isAgentInAnyGroup(user.id);
    });
  }

  async getUsersByManager(managerId: number): Promise<User[]> {
    // For the manager, get all sales staff
    const salesStaff = await this.getUsersByRole("SalesStaff");
    return salesStaff;
  }

  private async isAgentInAnyGroup(agentId: number): Promise<boolean> {
    return Array.from(this.agentGroupMembers.values())
      .some(member => member.agentId === agentId);
  }

  // Attendance Management
  async createAttendanceTimeframe(timeframeData: InsertAttendanceTimeframe): Promise<AttendanceTimeframe> {
    const id = this.nextIds.attendanceTimeframe++;
    const now = new Date();
    const timeframe: AttendanceTimeframe = {
      ...timeframeData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.attendanceTimeframes.set(id, timeframe);
    return timeframe;
  }

  async getAttendanceTimeframeBySalesStaff(salesStaffId: number): Promise<AttendanceTimeframe | undefined> {
    return Array.from(this.attendanceTimeframes.values())
      .find(timeframe => timeframe.salesStaffId === salesStaffId);
  }

  async updateAttendanceTimeframe(id: number, updates: Partial<AttendanceTimeframe>): Promise<AttendanceTimeframe | undefined> {
    const timeframe = this.attendanceTimeframes.get(id);
    if (!timeframe) return undefined;
    
    const updatedTimeframe: AttendanceTimeframe = {
      ...timeframe,
      ...updates,
      updatedAt: new Date()
    };
    
    this.attendanceTimeframes.set(id, updatedTimeframe);
    return updatedTimeframe;
  }

  async createAttendanceRecord(recordData: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const id = this.nextIds.attendanceRecord++;
    const now = new Date();
    const record: AttendanceRecord = {
      ...recordData,
      id,
      createdAt: now
    };
    this.attendanceRecords.set(id, record);
    return record;
  }

  async getAttendanceRecordsByAgent(agentId: number, date?: Date): Promise<AttendanceRecord[]> {
    const records = Array.from(this.attendanceRecords.values())
      .filter(record => record.agentId === agentId);
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return records.filter(record => 
        record.checkInTime >= startOfDay && record.checkInTime <= endOfDay
      );
    }
    
    return records;
  }

  async getAttendanceRecordsBySalesStaff(salesStaffId: number, date?: Date): Promise<AttendanceRecord[]> {
    // Get all agents managed by this sales staff
    const agents = await this.getUsersBySalesStaff(salesStaffId);
    const agentIds = agents.map(agent => agent.id);
    
    // Get attendance records for these agents
    const records = Array.from(this.attendanceRecords.values())
      .filter(record => agentIds.includes(record.agentId));
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return records.filter(record => 
        record.checkInTime >= startOfDay && record.checkInTime <= endOfDay
      );
    }
    
    return records;
  }

  async updateAttendanceRecord(id: number, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const record = this.attendanceRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord: AttendanceRecord = {
      ...record,
      ...updates
    };
    
    this.attendanceRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  // Client Management
  async createClient(clientData: InsertClient): Promise<Client> {
    const id = this.nextIds.client++;
    const now = new Date();
    const client: Client = {
      ...clientData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.clients.set(id, client);
    return client;
  }

  async getClientsByAgent(agentId: number): Promise<Client[]> {
    return Array.from(this.clients.values())
      .filter(client => client.agentId === agentId);
  }

  async getClientsBySalesStaff(salesStaffId: number): Promise<Client[]> {
    // Get all agents under this sales staff
    const agents = await this.getUsersBySalesStaff(salesStaffId);
    const agentIds = agents.map(agent => agent.id);
    
    // Get all clients from these agents
    return Array.from(this.clients.values())
      .filter(client => agentIds.includes(client.agentId));
  }

  async getClientsByDateRange(agentId: number, startDate: Date, endDate: Date): Promise<Client[]> {
    return Array.from(this.clients.values())
      .filter(client => 
        client.agentId === agentId && 
        client.interactionTime >= startDate && 
        client.interactionTime <= endDate
      );
  }

  // Agent Groups
  async createAgentGroup(groupData: InsertAgentGroup): Promise<AgentGroup> {
    const id = this.nextIds.agentGroup++;
    const now = new Date();
    const group: AgentGroup = {
      ...groupData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.agentGroups.set(id, group);
    return group;
  }

  async getAgentGroupsByTeamLeader(teamLeaderId: number): Promise<AgentGroup[]> {
    return Array.from(this.agentGroups.values())
      .filter(group => group.teamLeaderId === teamLeaderId);
  }

  async getAgentGroupBySalesStaff(salesStaffId: number): Promise<AgentGroup[]> {
    return Array.from(this.agentGroups.values())
      .filter(group => group.salesStaffId === salesStaffId);
  }

  async addAgentToGroup(groupId: number, agentId: number): Promise<AgentGroupMember> {
    const id = this.nextIds.agentGroupMember++;
    const now = new Date();
    const member: AgentGroupMember = {
      id,
      groupId,
      agentId,
      createdAt: now
    };
    this.agentGroupMembers.set(id, member);
    return member;
  }

  async removeAgentFromGroup(groupId: number, agentId: number): Promise<void> {
    const memberToRemove = Array.from(this.agentGroupMembers.values())
      .find(member => member.groupId === groupId && member.agentId === agentId);
    
    if (memberToRemove) {
      this.agentGroupMembers.delete(memberToRemove.id);
    }
  }

  async getAgentGroupMembers(groupId: number): Promise<User[]> {
    const memberIds = Array.from(this.agentGroupMembers.values())
      .filter(member => member.groupId === groupId)
      .map(member => member.agentId);
    
    return Array.from(this.users.values())
      .filter(user => memberIds.includes(user.id));
  }

  // Reports
  async createReport(reportData: InsertReport): Promise<Report> {
    const id = this.nextIds.report++;
    const now = new Date();
    const report: Report = {
      ...reportData,
      id,
      createdAt: now
    };
    this.reports.set(id, report);
    return report;
  }

  async getReportsByUser(userId: number): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.submittedById === userId);
  }

  async getReportsByType(userId: number, type: string): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.submittedById === userId && report.reportType === type);
  }

  async getReportsBySalesStaff(salesStaffId: number): Promise<Report[]> {
    // Get all agents under this sales staff
    const agents = await this.getUsersBySalesStaff(salesStaffId);
    const agentIds = agents.map(agent => agent.id);
    
    // Get all reports from these agents
    return Array.from(this.reports.values())
      .filter(report => agentIds.includes(report.submittedById));
  }

  // Help Requests
  async createHelpRequest(requestData: InsertHelpRequest): Promise<HelpRequest> {
    const id = this.nextIds.helpRequest++;
    const now = new Date();
    const request: HelpRequest = {
      ...requestData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.helpRequests.set(id, request);
    return request;
  }

  async getHelpRequests(): Promise<HelpRequest[]> {
    return Array.from(this.helpRequests.values());
  }

  async updateHelpRequest(id: number, updates: Partial<HelpRequest>): Promise<HelpRequest | undefined> {
    const request = this.helpRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest: HelpRequest = {
      ...request,
      ...updates,
      updatedAt: new Date()
    };
    
    this.helpRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Messages
  async createMessage(senderId: number, receiverId: number, content: string): Promise<Message> {
    const id = this.nextIds.message++;
    const now = new Date();
    const message: Message = {
      id,
      senderId,
      receiverId,
      content,
      isRead: false,
      createdAt: now
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.senderId === userId || message.receiverId === userId);
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.isRead = true;
      this.messages.set(messageId, message);
    }
  }
}

export const storage = new MemStorage();
