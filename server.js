const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Gmail transporter configuration - HARDCODED CREDENTIALS
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'crmchs.acosta.pascualsebatian@gmail.com', // ⚠️ REPLACE WITH YOUR GMAIL
    pass: 'bxmn pynv scix ddqj', // ⚠️ REPLACE WITH YOUR 16-CHAR APP PASSWORD (NO SPACES)
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Test SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP connection failed:', error);
  } else {
    console.log('✅ SMTP server is ready to send emails');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'NoteBuddy Email Service is running',
    timestamp: new Date().toISOString()
  });
});

// Send share notification endpoint
app.post('/api/send-share-notification', async (req, res) => {
  try {
    const {
      recipientEmail,
      senderEmail,
      noteTitle,
      noteContent,
      sharedNoteId,
      message,
      authToken,
    } = req.body;

    // Verify API secret - HARDCODED
    const API_SECRET = '97df55ca6de5d5273d6f10618e0e2f58'; // ⚠️ REPLACE WITH YOUR SECRET KEY
    if (authToken !== API_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    if (!recipientEmail || !senderEmail || !noteTitle || !sharedNoteId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['recipientEmail', 'senderEmail', 'noteTitle', 'sharedNoteId']
      });
    }

    // Truncate content for preview (max 200 chars)
    const contentPreview = noteContent.length > 200 
      ? noteContent.substring(0, 200) + '...' 
      : noteContent;

    // Create deep link for opening in NoteBuddy
    const deepLink = `notebuddy://shared/${sharedNoteId}`;
    
    // Create web fallback link (you can customize this)
    const webLink = `https://notebuddy.app/shared/${sharedNoteId}`;

    // Email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #7C4DFF;
      margin-bottom: 10px;
    }
    .note-card {
      background-color: #f9f9f9;
      border-left: 4px solid #7C4DFF;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .note-title {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }
    .note-content {
      color: #666;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .message-box {
      background-color: #E8F5E9;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-style: italic;
      color: #2E7D32;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #7C4DFF;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      margin: 10px;
    }
    .button:hover {
      background-color: #6A3DE8;
    }
    .button-secondary {
      background-color: #4CAF50;
    }
    .button-secondary:hover {
      background-color: #45a049;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 12px;
    }
    .info-box {
      background-color: #FFF3E0;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 14px;
      color: #E65100;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .container {
        padding: 20px;
      }
      .button {
        display: block;
        margin: 10px 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📝 NoteBuddy</div>
      <p style="color: #666; font-size: 16px;">Someone shared a note with you!</p>
    </div>

    <p><strong>${senderEmail}</strong> has shared a note with you on NoteBuddy.</p>

    ${message ? `<div class="message-box">
      <strong>Message from ${senderEmail}:</strong><br>
      "${message}"
    </div>` : ''}

    <div class="note-card">
      <div class="note-title">${noteTitle}</div>
      <div class="note-content">${contentPreview}</div>
    </div>

    <div class="button-container">
      <a href="${deepLink}" class="button">Open in NoteBuddy</a>
      <a href="${webLink}" class="button button-secondary">View in Browser</a>
    </div>

    <div class="info-box">
      <strong>📱 Don't have NoteBuddy?</strong><br>
      Download it from the App Store or Google Play to view and collaborate on shared notes!
    </div>

    <div class="footer">
      <p>This note was shared via NoteBuddy</p>
      <p>If you didn't expect this email, you can safely ignore it.</p>
      <p style="margin-top: 15px;">
        <a href="#" style="color: #7C4DFF; text-decoration: none;">Privacy Policy</a> | 
        <a href="#" style="color: #7C4DFF; text-decoration: none;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version (fallback)
    const emailText = `
${senderEmail} has shared a note with you on NoteBuddy

${message ? `Message: "${message}"\n\n` : ''}

Note: ${noteTitle}
${contentPreview}

Open in NoteBuddy: ${deepLink}
View in Browser: ${webLink}

Don't have NoteBuddy? Download it to view and collaborate on shared notes!

---
This note was shared via NoteBuddy
If you didn't expect this email, you can safely ignore it.
    `;

    // Send email
    const GMAIL_USER = 'your-email@gmail.com'; // ⚠️ SAME EMAIL AS ABOVE
    const mailOptions = {
      from: `"NoteBuddy" <${GMAIL_USER}>`,
      to: recipientEmail,
      subject: `📝 ${senderEmail} shared "${noteTitle}" with you`,
      text: emailText,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', info.messageId);
    console.log(`📧 From: ${senderEmail} → To: ${recipientEmail}`);
    console.log(`📝 Note: "${noteTitle}"`);

    res.json({
      success: true,
      messageId: info.messageId,
      recipient: recipientEmail,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NoteBuddy Email Service running on port ${PORT}`);
  console.log(`📧 Gmail: Hardcoded in server.js`);
  console.log(`🔐 API Secret: Hardcoded in server.js`);
});
