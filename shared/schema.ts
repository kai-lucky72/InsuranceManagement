import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define role enum
export const userRoleEnum = pgEnum('user_role', ['Admin', 'Manager', 'SalesStaff', 'TeamLeader', 'Agent']);
export const agentTypeEnum = pgEnum('agent_type', ['Individual', 'TeamLeader']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  workId: text("work_id").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Attendance timeframes for SalesStaff
export const attendanceTimeframes = pgTable("attendance_timeframes", {
  id: serial("id").primaryKey(),
  salesStaffId: integer("sales_staff_id").notNull().references(() => users.id),
  startTime: text("start_time").notNull(), // Format: "HH:MM"
  endTime: text("end_time").notNull(),     // Format: "HH:MM"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Attendance records
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => users.id),
  checkInTime: timestamp("check_in_time").notNull(),
  isLate: boolean("is_late").default(false).notNull(),
  isExcused: boolean("is_excused").default(false).notNull(),
  excusedById: integer("excused_by_id").references(() => users.id),
  excuseReason: text("excuse_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Agent groups (for TeamLeaders)
export const agentGroups = pgTable("agent_groups", {
  id: serial("id").primaryKey(),
  teamLeaderId: integer("team_leader_id").notNull().references(() => users.id),
  salesStaffId: integer("sales_staff_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agent group members
export const agentGroupMembers = pgTable("agent_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => agentGroups.id),
  agentId: integer("agent_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client records
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  insuranceType: text("insurance_type").notNull(),
  policyDetails: text("policy_details"),
  interactionTime: timestamp("interaction_time").notNull(),
  requiresFollowUp: boolean("requires_follow_up").default(false).notNull(),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reports
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  submittedById: integer("submitted_by_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // "daily", "weekly", "monthly"
  content: text("content").notNull(),
  isAggregated: boolean("is_aggregated").default(false).notNull(),
  parentReportId: integer("parent_report_id").references(() => reports.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Help requests
export const helpRequests = pgTable("help_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  requestType: text("request_type").notNull(), // "Technical", "Account", "Feature", etc.
  issue: text("issue").notNull(),
  status: text("status").notNull().default("Pending"), // "Pending", "In Review", "Resolved"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export const loginUserSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const insertAttendanceTimeframeSchema = createInsertSchema(attendanceTimeframes).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({ 
  id: true, 
  createdAt: true 
});

export const insertClientSchema = createInsertSchema(clients).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export const insertAgentGroupSchema = createInsertSchema(agentGroups).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertReportSchema = createInsertSchema(reports).omit({ 
  id: true, 
  createdAt: true 
});

export const insertHelpRequestSchema = createInsertSchema(helpRequests).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type AttendanceTimeframe = typeof attendanceTimeframes.$inferSelect;
export type InsertAttendanceTimeframe = z.infer<typeof insertAttendanceTimeframeSchema>;

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type AgentGroup = typeof agentGroups.$inferSelect;
export type InsertAgentGroup = z.infer<typeof insertAgentGroupSchema>;

export type AgentGroupMember = typeof agentGroupMembers.$inferSelect;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type HelpRequest = typeof helpRequests.$inferSelect;
export type InsertHelpRequest = z.infer<typeof insertHelpRequestSchema>;

export type Message = typeof messages.$inferSelect;
