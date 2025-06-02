
          -- Add SMS notification fields to users table
          ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false;
          
          -- Update existing records to have default false for sms_notifications_enabled
          UPDATE users SET sms_notifications_enabled = false WHERE sms_notifications_enabled IS NULL;
          
          -- Make sms_notifications_enabled NOT NULL after setting defaults
          ALTER TABLE users ALTER COLUMN sms_notifications_enabled SET NOT NULL;
        