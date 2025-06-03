import { db } from "./db"

export function calculateNextDueDate(pattern: string, currentDueDate: Date): Date {
  const nextDate = new Date(currentDueDate)
  
  switch (pattern) {
    case "DAILY":
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case "WEEKLY":
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case "MONTHLY":
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    default:
      throw new Error(`Unknown recurrence pattern: ${pattern}`)
  }
  
  return nextDate
}

export async function createNextRecurringTask(taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  })

  if (!task || !task.isRecurring || !task.recurrencePattern) {
    return null
  }

  // Check if there's already a pending/future instance of this recurring task
  const existingFutureTask = await db.task.findFirst({
    where: {
      title: task.title,
      assignedTo: task.assignedTo,
      familyId: task.familyId,
      isRecurring: true,
      recurrencePattern: task.recurrencePattern,
      status: "PENDING",
      dueDate: {
        gte: new Date()
      }
    }
  })

  // Don't create duplicate if one already exists
  if (existingFutureTask) {
    return existingFutureTask
  }

  const nextDueDate = calculateNextDueDate(task.recurrencePattern, task.dueDate)
  
  // Don't create tasks more than 3 months in advance
  const threeMonthsFromNow = new Date()
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
  
  if (nextDueDate > threeMonthsFromNow) {
    return null
  }

  const result = await db.$transaction(async (tx) => {
    const newTask = await tx.task.create({
      data: {
        title: task.title,
        description: task.description,
        points: task.points,
        dueDate: nextDueDate,
        createdBy: task.createdBy,
        assignedTo: task.assignedTo,
        familyId: task.familyId,
        isRecurring: true,
        recurrencePattern: task.recurrencePattern,
        dueDateOnly: task.dueDateOnly, // Preserve dueDateOnly constraint
        status: "PENDING"
      }
    })

    // Copy tags if any
    if (task.tags && task.tags.length > 0) {
      await tx.taskTagRelation.createMany({
        data: task.tags.map(t => ({
          taskId: newTask.id,
          tagId: t.tag.id
        }))
      })
    }

    return newTask
  })

  return result
}

export async function generateMissingRecurringTasks() {
  // Find all recurring tasks that are completed/verified and might need next instances
  const recurringTasks = await db.task.findMany({
    where: {
      isRecurring: true,
      recurrencePattern: {
        not: null
      },
      status: {
        in: ["COMPLETED", "VERIFIED"]
      }
    },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  })

  const results = []

  for (const task of recurringTasks) {
    try {
      const nextTask = await createNextRecurringTask(task.id)
      if (nextTask) {
        results.push(nextTask)
      }
    } catch (error) {
      console.error(`Error creating next instance for task ${task.id}:`, error)
    }
  }

  return results
}