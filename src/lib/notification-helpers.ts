import { db } from "@/lib/db"
import { sendSMS, formatSMSMessage } from "@/lib/sms"
import { NotificationType } from "@prisma/client"

interface CreateNotificationData {
  userId: string
  title: string
  message: string
  type: NotificationType
  relatedTaskId?: string
}

interface SMSData {
  title: string
  dueDate?: string
  userName?: string
  points?: number
  reason?: string
}

export async function createNotificationWithSMS(data: CreateNotificationData, smsData?: SMSData) {
  try {
    console.log("🔔 Creating notification:", {
      userId: data.userId,
      title: data.title,
      type: data.type,
      relatedTaskId: data.relatedTaskId
    })
    
    // Create in-app notification
    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        relatedTaskId: data.relatedTaskId,
      },
    })
    
    console.log("✅ Notification created successfully:", notification.id)

    // Check if user has SMS notifications enabled (backwards compatible)
    let user = null;
    try {
      user = await db.user.findUnique({
        where: { id: data.userId },
        select: {
          phoneNumber: true,
          smsNotificationsEnabled: true,
          name: true,
        },
      });
    } catch {
      // SMS columns don't exist yet, get basic user info
      user = await db.user.findUnique({
        where: { id: data.userId },
        select: {
          name: true,
        },
      });
      // Add default SMS values
      user = { ...user, phoneNumber: null, smsNotificationsEnabled: false };
    }

    // Send SMS if enabled and phone number exists
    if (user?.smsNotificationsEnabled && user.phoneNumber) {
      const smsMessage = formatSMSMessage(data.type, smsData || { title: data.title })
      
      const smsResult = await sendSMS(user.phoneNumber, smsMessage)
      
      if (!smsResult.success) {
        console.error(`SMS sending failed for user ${data.userId}:`, smsResult.error)
        // Note: We don't fail the entire operation if SMS fails
        // The in-app notification was still created successfully
      } else {
        console.log(`SMS sent successfully to ${user.phoneNumber} for notification ${notification.id}`)
      }
    }

    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Bulk notification helper for multiple users
export async function createBulkNotificationsWithSMS(
  notifications: (CreateNotificationData & { smsData?: SMSData })[]
) {
  const results = await Promise.allSettled(
    notifications.map(({ smsData, ...notificationData }) => 
      createNotificationWithSMS(notificationData, smsData)
    )
  )

  const successful = results.filter(result => result.status === 'fulfilled').length
  const failed = results.filter(result => result.status === 'rejected').length

  console.log(`Bulk notifications: ${successful} successful, ${failed} failed`)

  return {
    successful,
    failed,
    results
  }
}