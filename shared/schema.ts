import { InferModel } from 'drizzle-orm';
import { pgTable, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['Admin', 'Manager', 'SalesStaff', 'TeamLeader', 'Agent']);

export const users = pgTable('users', {
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

export const attendanceTimeframes = pgTable('attendance_timeframes', {
  id: integer('id').primaryKey(),
  salesStaffId: integer('sales_staff_id').notNull().references(() => users.id),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

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

export const agentGroups = pgTable('agent_groups', {
  id: integer('id').primaryKey(),
  teamLeaderId: integer('team_leader_id').notNull().references(() => users.id),
  salesStaffId: integer('sales_staff_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const agentGroupMembers = pgTable('agent_group_members', {
  id: integer('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => agentGroups.id),
  agentId: integer('agent_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

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

export const reports = pgTable('reports', {
  id: integer('id').primaryKey(),
  submittedById: integer('submitted_by_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  reportType: text('report_type').notNull(), // daily, weekly, monthly
  content: text('content').notNull(),
  isAggregated: boolean('is_aggregated').notNull().default(false),
  parentReportId: integer('parent_report_id').references(() => reports.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const helpRequests = pgTable('help_requests', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  requestType: text('request_type').notNull(),
  issue: text('issue').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const messages = pgTable('messages', {
  id: integer('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id),
  receiverId: integer('receiver_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export type User = InferModel<typeof users>;
export type AttendanceTimeframe = InferModel<typeof attendanceTimeframes>;
export type Attendance = InferModel<typeof attendance>;
export type AgentGroup = InferModel<typeof agentGroups>;
export type AgentGroupMember = InferModel<typeof agentGroupMembers>;
export type Client = InferModel<typeof clients>;
export type Report = InferModel<typeof reports>;
export type HelpRequest = InferModel<typeof helpRequests>;
export type Message = InferModel<typeof messages>;