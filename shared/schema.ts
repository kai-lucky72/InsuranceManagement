import { InferModel } from 'drizzle-orm';
import { pgTable, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { z } from "zod";

// Define enums
export const roleEnum = pgEnum('role', ['Admin', 'Manager', 'SalesStaff', 'TeamLeader', 'Agent']);
export const reportTypeEnum = pgEnum('report_type', ['daily', 'weekly', 'monthly']);
export const reportStatusEnum = pgEnum('report_status', ['draft', 'pending_team_leader', 'pending_sales_staff', 'approved', 'rejected']);
export const messageTypeEnum = pgEnum('message_type', ['direct', 'announcement', 'report_feedback']);

// Users table with proper relationships
export const users = pgTable('users', {
  id: integer('id').primaryKey(),
  workId: text('work_id').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  password: text('password').notNull(),
  role: roleEnum('role').notNull(),
  managerId: integer('manager_id').references(() => users.id),
  salesStaffId: integer('sales_staff_id').references(() => users.id),
  teamLeaderId: integer('team_leader_id').references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Attendance timeframes set by sales staff
export const attendanceTimeframes = pgTable('attendance_timeframes', {
  id: integer('id').primaryKey(),
  salesStaffId: integer('sales_staff_id').notNull().references(() => users.id),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Daily attendance records
export const attendance = pgTable('attendance', {
  id: integer('id').primaryKey(),
  agentId: integer('agent_id').notNull().references(() => users.id),
  checkInTime: timestamp('check_in_time').notNull(),
  isLate: boolean('is_late').notNull(),
  isExcused: boolean('is_excused').notNull().default(false),
  excusedById: integer('excused_by_id').references(() => users.id),
  excuseReason: text('excuse_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Agent groups managed by team leaders
export const agentGroups = pgTable('agent_groups', {
  id: integer('id').primaryKey(),
  teamLeaderId: integer('team_leader_id').notNull().references(() => users.id),
  salesStaffId: integer('sales_staff_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Members of agent groups
export const agentGroupMembers = pgTable('agent_group_members', {
  id: integer('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => agentGroups.id),
  agentId: integer('agent_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Client records managed by agents
export const clients = pgTable('clients', {
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

// Reports from agents to team leaders and sales staff
export const reports = pgTable('reports', {
  id: integer('id').primaryKey(),
  agentId: integer('submitted_by_id').notNull().references(() => users.id),
  teamLeaderId: integer('team_leader_id').references(() => users.id),
  salesStaffId: integer('sales_staff_id').references(() => users.id),
  title: text('title').notNull(),
  reportType: reportTypeEnum('report_type').notNull(),
  status: reportStatusEnum('report_status').notNull().default('draft'),
  content: text('content').notNull(),
  clientCount: integer('client_count').notNull().default(0),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  teamLeaderFeedback: text('team_leader_feedback'),
  salesStaffFeedback: text('sales_staff_feedback'),
  isAggregated: boolean('is_aggregated').notNull().default(false),
  parentReportId: integer('parent_report_id').references(() => reports.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Help requests from agents
export const helpRequests = pgTable('help_requests', {
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

// Messages between users
export const messages = pgTable('messages', {
  id: integer('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id),
  receiverId: integer('receiver_id').notNull().references(() => users.id),
  messageType: messageTypeEnum('message_type').notNull().default('direct'),
  content: text('content').notNull(),
  relatedReportId: integer('related_report_id').references(() => reports.id),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Performance metrics
export const performanceMetrics = pgTable('performance_metrics', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  period: text('period').notNull(),
  clientsAcquired: integer('clients_acquired').notNull().default(0),
  attendanceRate: integer('attendance_rate').notNull().default(0),
  reportsSubmitted: integer('reports_submitted').notNull().default(0),
  reportApprovalRate: integer('report_approval_rate').notNull().default(0),
  performanceScore: integer('performance_score').notNull().default(0),
  performanceTrend: integer('performance_trend').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Export types
export type User = InferModel<typeof users>;
export type AttendanceTimeframe = InferModel<typeof attendanceTimeframes>;
export type Attendance = InferModel<typeof attendance>;
export type AgentGroup = InferModel<typeof agentGroups>;
export type AgentGroupMember = InferModel<typeof agentGroupMembers>;
export type Client = InferModel<typeof clients>;
export type Report = InferModel<typeof reports>;
export type HelpRequest = InferModel<typeof helpRequests>;
export type Message = InferModel<typeof messages>;
export type PerformanceMetric = InferModel<typeof performanceMetrics>;

// Validation schemas
export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  workId: z.string().min(3)
});

export const insertUserSchema = z.object({
  workId: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['Admin', 'Manager', 'SalesStaff', 'TeamLeader', 'Agent']),
  managerId: z.number().optional(),
  salesStaffId: z.number().optional(),
  teamLeaderId: z.number().optional(),
  isActive: z.boolean().optional()
});

// Export tables for use in queries
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