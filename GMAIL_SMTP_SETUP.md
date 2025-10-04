# Gmail SMTP Setup Guide

## Problem
Emails sent from the application to Gmail addresses are not working because:
- Apache James (localhost) cannot relay to external domains by default
- Gmail requires proper SMTP authentication and rejects emails from unknown sources
- ISPs typically block outbound port 25 (SMTP server-to-server)

## Solution: Use Gmail SMTP for Outbound Emails

### Step 1: Generate Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left navigation
3. Under "How you sign in to Google", enable **2-Step Verification** (required for App Passwords)
4. After enabling 2-Step Verification, go to: https://myaccount.google.com/apppasswords
5. Select "Mail" and "Other (Custom name)"
6. Name it "MEMail Application"
7. Click **Generate**
8. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### Step 2: Configure Application Properties

Edit `backend/src/main/resources/application.properties`:

```properties
# Comment out the localhost configuration:
# spring.mail.host=localhost
# spring.mail.port=587
# spring.mail.username=admin@ashulabs.com
# spring.mail.password=admin123

# Uncomment and configure Gmail SMTP:
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your.email@gmail.com
spring.mail.password=xxxx xxxx xxxx xxxx
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.ssl.trust=smtp.gmail.com
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=3000
spring.mail.properties.mail.smtp.writetimeout=5000
```

### Step 3: Important Notes

#### Email "From" Address
- The application uses the **authenticated user's email** as the "From" address
- For Gmail SMTP, this means emails will appear to come from the Gmail account configured above
- This is a limitation of using a centralized SMTP approach

#### Alternative: Per-User SMTP
If you want emails to come from each user's actual address, you would need:
1. Each user to provide their own SMTP credentials
2. Modify the `sendEmail` method to use per-user credentials
3. Store encrypted SMTP credentials per user in the database

### Step 4: Restart Application

```bash
# Stop the backend if running
# Restart with new configuration
cd backend
mvn spring-boot:run
```

## Testing

1. Login to your application
2. Compose a new email
3. Send to a Gmail address
4. Check:
   - Backend logs for "EMAIL SENT SUCCESSFULLY"
   - Recipient's Gmail inbox
   - Your Gmail "Sent" folder (if saved)

## Troubleshooting

### Error: "535-5.7.8 Username and Password not accepted"
- You're using your regular Gmail password instead of an App Password
- Generate an App Password (see Step 1)

### Error: "Must enable 2-Step Verification"
- App Passwords require 2-Step Verification
- Enable it in Google Account Security settings

### Error: "Connection timed out"
- Check your firewall/antivirus
- Ensure port 587 is not blocked
- Try port 465 (SSL) instead:
  ```properties
  spring.mail.port=465
  spring.mail.properties.mail.smtp.ssl.enable=true
  ```

### Emails Go to Spam
This is expected when using a shared Gmail SMTP. To improve:
1. Use a business email service (G Suite, Office 365)
2. Set up proper SPF/DKIM/DMARC records
3. Use a dedicated SMTP service (SendGrid, AWS SES, Mailgun)

## Alternative: Production Setup

For production, consider:

### Option 1: SendGrid (Recommended)
```properties
spring.mail.host=smtp.sendgrid.net
spring.mail.port=587
spring.mail.username=apikey
spring.mail.password=YOUR_SENDGRID_API_KEY
```

### Option 2: AWS SES
```properties
spring.mail.host=email-smtp.us-east-1.amazonaws.com
spring.mail.port=587
spring.mail.username=YOUR_AWS_SMTP_USERNAME
spring.mail.password=YOUR_AWS_SMTP_PASSWORD
```

### Option 3: Configure James for External Relay
This is more complex but allows you to keep using James:
1. Configure James `smtpserver.xml` with relay permissions
2. Add DNS MX records for your domain
3. Configure SPF/DKIM records
4. May still be blocked by many providers without a business IP

## Current Behavior

**With localhost (current configuration):**
- ✅ Emails between users on the same James server work
- ❌ Emails to external domains (Gmail, Outlook, etc.) fail silently or timeout

**With Gmail SMTP (recommended for development):**
- ✅ Emails to any external address work
- ✅ Proper delivery confirmation
- ⚠️ All emails appear to come from your configured Gmail address
- ⚠️ Rate limits apply (Gmail allows ~100-500 emails/day for regular accounts)
