"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"

interface Props {
  initialPhoneNumber?: string
  initialSmsEnabled: boolean
}

export function SMSSettingsSection({ initialPhoneNumber, initialSmsEnabled }: Props) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || '')
  const [smsEnabled, setSmsEnabled] = useState(initialSmsEnabled)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [testLoading, setTestLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/sms-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim() || null,
          smsNotificationsEnabled: smsEnabled
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'SMS settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleTestSMS = async () => {
    if (!phoneNumber.trim()) {
      setMessage({ type: 'error', text: 'Please enter a phone number first' })
      return
    }

    setTestLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Test SMS sent successfully!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send test SMS' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test SMS' })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icons.phone className="h-5 w-5" />
          <span>SMS Notifications</span>
        </CardTitle>
        <CardDescription>
          Get task notifications via SMS text messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phone Number Input */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+972525797093"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter your phone number in international format (e.g., +972525797093)
          </p>
        </div>

        {/* SMS Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable SMS Notifications
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Receive task updates via SMS
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSmsEnabled(!smsEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              smsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                smsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Icons.spinner className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.check className="h-4 w-4" />
            )}
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>

          {phoneNumber.trim() && (
            <button
              onClick={handleTestSMS}
              disabled={testLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testLoading ? (
                <Icons.spinner className="h-4 w-4 animate-spin" />
              ) : (
                <Icons.send className="h-4 w-4" />
              )}
              <span>{testLoading ? 'Sending...' : 'Send Test SMS'}</span>
            </button>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <Icons.check className="h-4 w-4" />
              ) : (
                <Icons.warning className="h-4 w-4" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}