import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !fromNumber) {
  console.warn('Twilio credentials not configured. SMS notifications will be disabled.')
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null

export interface SMSResult {
  success: boolean
  error?: string
  messageId?: string
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  if (!client || !fromNumber) {
    return {
      success: false,
      error: 'Twilio not configured'
    }
  }

  // Debug log for credentials check
  console.log('Twilio config check:', {
    accountSid: accountSid ? `${accountSid.substring(0, 10)}...` : 'missing',
    authToken: authToken ? `${authToken.substring(0, 8)}...` : 'missing',
    fromNumber: fromNumber || 'missing',
    toNumber: to
  })

  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    })

    console.log('SMS sent successfully:', result.sid)
    return {
      success: true,
      messageId: result.sid
    }
  } catch (error: any) {
    console.error('SMS sending failed:', {
      message: error.message,
      status: error.status,
      code: error.code,
      moreInfo: error.moreInfo,
      details: error.details
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export function formatSMSMessage(type: string, data: any): string {
  switch (type) {
    case 'TASK_ASSIGNED':
      if (data.isBonus) {
        return `🚨🔥 Urgent! New Bonus task available - ${data.title} - ${data.points} Points. Open app: https://family-tasks-beta.vercel.app/dashboard`
      }
      return `New task: ${data.title} - Due: ${formatDate(data.dueDate)}`
    
    case 'TASK_COMPLETED':
      return `${data.userName} completed: ${data.title}`
    
    case 'TASK_VERIFIED':
      return `Task verified: ${data.title} - ${data.points} points earned`
    
    case 'TASK_DECLINED':
      return `Task declined: ${data.title} - Try again`
    
    case 'TASK_DELETED':
      return `Task deleted: ${data.title}`
    
    case 'POINTS_EARNED':
      return `${data.points} points earned: ${data.title}`
    
    case 'POINTS_DEDUCTED':
      return `${data.points} points deducted: ${data.reason}`
    
    default:
      return `Notification: ${data.title || 'Update from FamilyTasks'}`
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
}