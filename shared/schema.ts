
import { InferModel } from 'drizzle-orm';
import { pgTable, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Define enums
export const roleEnum = pgEnum('role', ['Admin', 'Manager', 'SalesStaff', 'TeamLeader', 'Agent']);
export const reportTypeEnum = pgEnum('report_type', ['daily', 'weekly', 'monthly']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'approved', 'rejected']);
export const messageTypeEnum = pgEnum('message_type', ['direct', 'announcement', 'report_feedback']);

// Tables
const users = pgTable('users', {
  id: integer('id').primaryKey(),
  workId: text('work_id').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  password: text('password').notNull(),
  role: roleEnum('role').notNull(),
  createdById: integer('created_by_id').references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

const attendanceTimeframes = pgTable('attendance_timeframes', {
  id: integer('id').primaryKey(),
  salesStaffId: integer('sales_staff_id').notNull().references(() => users.id),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

const attendance = pgTable('attendance', {
  id: integer('id').primaryKey(),
  agentId: integer('agent_id').notNull().references(() => users.id),
  checkInTime: timestamp('check_in_time').notNull(),
  isLate: boolean('is_late').notNull(),
  isExcused: boolean('is_excused').notNull().default(false),
  excusedById: integer('excused_by_id').references(() => users.id),
  excuseReason: text('excuse_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

const agentGroups = pgTable('agent_groups', {
  id: integer('id').primaryKey(),
  teamLeaderId: integer('team_leader_id').notNull().references(() => users.id),
  salesStaffId: integer('sales_staff_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

const agentGroupMembers = pgTable('agent_group_members', {
  id: integer('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => agentGroups.id),
  agentId: integer('agent_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

const clients = pgTable('clients', {
  id: integer('id').primaryKey(),
  agentId: integer('agent_id').notNull().references(() => users.id),
  fullName: text('full_name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  insuranceType: text('insurance_type').notNull(),
  policyDetails: text('policy_details'),
  interactionTime: timestamp('interaction_time').notNull(),
  requiresFollowUp: boolean('requires_follow_up').notNull().default(false),
  followUpDate: timestamp('follow_up_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

const reports = pgTable('reports', {
  id: integer('id').primaryKey(),
  submittedById: integer('submitted_by_id').notNull().references(() => users.id),
  reviewedById: integer('reviewed_by_id').references(() => users.id),
  title: text('title').notNull(),
  reportType: reportTypeEnum('report_type').notNull(),
  status: reportStatusEnum('report_status').notNull().default('pending'),
  content: text('content').notNull(),
  isAggregated: boolean('is_aggregated').notNull().default(false),
  parentReportId: integer('parent_report_id').references(() => reports.id),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

const helpRequests = pgTable('help_requests', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  requestType: text('request_type').notNull(),
  issue: text('issue').notNull(),
  status: text('status').notNull(),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

const messages = pgTable('messages', {
  id: integer('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id),
  receiverId: integer('receiver_id').notNull().references(() => users.id),
  messageType: messageTypeEnum('message_type').notNull().default('direct'),
  content: text('content').notNull(),
  relatedReportId: integer('related_report_id').references(() => reports.id),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

const performanceMetrics = pgTable('performance_metrics', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  period: text('period').notNull(),
  clientsAcquired: integer('clients_acquired').notNull().default(0),
  attendanceRate: integer('attendance_rate').notNull().default(0),
  performanceScore: integer('performance_score').notNull().default(0),
  performanceTrend: integer('performance_trend').notNull().default(0),
  reportsSubmitted: integer('reports_submitted').notNull().default(0),
  reportApprovalRate: integer('report_approval_rate').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Export types
export type User = InferModel<typeof users>;
export type InsertUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type AttendanceTimeframe = InferModel<typeof attendanceTimeframes>;
export type InsertAttendanceTimeframe = Omit<AttendanceTimeframe, 'id' | 'createdAt' | 'updatedAt'>;
export type Attendance = InferModel<typeof attendance>;
export type InsertAttendance = Omit<Attendance, 'id' | 'createdAt'>;
export type AgentGroup = InferModel<typeof agentGroups>;
export type InsertAgentGroup = Omit<AgentGroup, 'id' | 'createdAt' | 'updatedAt'>;
export type AgentGroupMember = InferModel<typeof agentGroupMembers>;
export type InsertAgentGroupMember = Omit<AgentGroupMember, 'id' | 'createdAt'>;
export type Client = InferModel<typeof clients>;
export type InsertClient = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type Report = InferModel<typeof reports>;
export type InsertReport = Omit<Report, 'id' | 'createdAt' | 'updatedAt'>;
export type HelpRequest = InferModel<typeof helpRequests>;
export type InsertHelpRequest = Omit<HelpRequest, 'id' | 'createdAt' | 'updatedAt'>;
export type Message = InferModel<typeof messages>;
export type InsertMessage = Omit<Message, 'id' | 'createdAt'>;
export type PerformanceMetric = InferModel<typeof performanceMetrics>;
export type InsertPerformanceMetric = Omit<PerformanceMetric, 'id' | 'createdAt' | 'updatedAt'>;

// Export tables
export {
  users,
  attendanceTimeframes,
  attendance,
  agentGroups,
  agentGroupMembers,
  clients,
  reports,
  helpRequests,
  messages,
  performanceMetrics
};

// Auth types
export type LoginUser = {
  email: string;
  password: string;
  workId: string;
};

// Login schema
import { z } from "zod";

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  workId: z.string().min(3)
});

// Export tables and enums
export {
  users,
  attendanceTimeframes,
  attendance,
  agentGroups,
  agentGroupMembers,
  clients,
  reports,
  helpRequests,
  messages,
  performanceMetrics,
  roleEnum,
  reportTypeEnum,
  reportStatusEnum,
  messageTypeEnum
};
