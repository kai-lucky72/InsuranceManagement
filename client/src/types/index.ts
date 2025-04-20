export interface User {
  id: number;
  workId: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Manager' | 'SalesStaff' | 'TeamLeader' | 'Agent';
  isActive: boolean;
}

export interface AttendanceTimeframe {
  id: number;
  salesStaffId: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: number;
  agentId: number;
  checkInTime: string;
  isLate: boolean;
  isExcused: boolean;
  excusedById?: number;
  excuseReason?: string;
  createdAt: string;
}

export interface AgentGroup {
  id: number;
  teamLeaderId: number;
  salesStaffId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentGroupMember {
  id: number;
  groupId: number;
  agentId: number;
  createdAt: string;
}

export interface Client {
  id: number;
  agentId: number;
  fullName: string;
  email?: string;
  phone: string;
  insuranceType: string;
  policyDetails?: string;
  interactionTime: string;
  requiresFollowUp: boolean;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: number;
  submittedById: number;
  title: string;
  reportType: string; // "daily", "weekly", "monthly"
  content: string;
  isAggregated: boolean;
  parentReportId?: number;
  createdAt: string;
}

export interface HelpRequest {
  id: number;
  userId: number;
  requestType: string;
  issue: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Performance {
  period: string;
  clientsAdded: number;
  attendanceRate: number;
  clients: Client[];
}
