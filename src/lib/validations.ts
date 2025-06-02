import { z } from "zod"

// User schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["PARENT", "CHILD"]),
  familyCode: z.string().optional(),
  familyName: z.string().optional(),
}).refine((data) => {
  // If joining existing family (has familyCode), familyName not required
  if (data.familyCode && data.familyCode.length > 0) {
    return true;
  }
  // If parent without familyCode (creating family), familyName is required
  if (data.role === "PARENT" && (!data.familyCode || data.familyCode.length === 0)) {
    return data.familyName && data.familyName.length >= 2;
  }
  // Child must have familyCode
  if (data.role === "CHILD") {
    return data.familyCode && data.familyCode.length > 0;
  }
  return true;
}, {
  message: "Family code or family name is required",
  path: ["familyCode"]
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  points: z.number().int().min(0, "Points must be at least 0").max(100, "Points cannot exceed 100"),
  dueDate: z.string().min(1, "Due date is required"),
  assignedTo: z.string().cuid("Invalid user ID").optional(),
  tagIds: z.array(z.string().cuid()).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  isBonusTask: z.boolean().optional(),
}).refine((data) => {
  // For bonus tasks, assignedTo should be null
  if (data.isBonusTask) {
    return !data.assignedTo;
  }
  // For regular tasks, assignedTo is required
  return !!data.assignedTo;
}, {
  message: "Regular tasks require assignment, bonus tasks cannot be assigned",
  path: ["assignedTo"]
})

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
  points: z.number().int().min(0, "Points must be at least 0").max(100, "Points cannot exceed 100").optional(),
  dueDate: z.string().min(1, "Due date is required").optional(),
  tagIds: z.array(z.string().cuid()).optional(),
})

export const declineTaskSchema = z.object({
  reason: z.string().min(1, "Decline reason is required").max(500, "Reason must be under 500 characters")
})

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name too long"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
})

// Points schemas
export const deductPointsSchema = z.object({
  userId: z.string().cuid("Invalid user ID"),
  points: z.number().int().min(1, "Points must be at least 1"),
  reason: z.string().min(1, "Reason is required").max(200, "Reason too long"),
})

// Family schemas
export const createFamilySchema = z.object({
  name: z.string().min(2, "Family name must be at least 2 characters").max(50, "Family name too long"),
})

export const joinFamilySchema = z.object({
  familyCode: z.string().length(8, "Family code must be 8 characters"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type DeclineTaskInput = z.infer<typeof declineTaskSchema>
export type CreateTagInput = z.infer<typeof createTagSchema>
export type DeductPointsInput = z.infer<typeof deductPointsSchema>
export type CreateFamilyInput = z.infer<typeof createFamilySchema>
export type JoinFamilyInput = z.infer<typeof joinFamilySchema>