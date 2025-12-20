const sgMail = require('@sendgrid/mail');

// Configure SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send email using SendGrid
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} options.from - Sender email (optional)
 * @returns {Promise}
 */
async function sendEmail({ to, subject, text, html, from = process.env.SENDGRID_FROM_EMAIL || 'noreply@winbuildats.com' }) {
  try {
    const msg = {
      to,
      from,
      subject,
      text,
      html
    };

    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully to:', to);
    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      statusCode: response[0].statusCode
    };
  } catch (error) {
    console.error('❌ SendGrid Error:', error.response?.body || error.message);
    throw error;
  }
}

/**
 * Send interview invitation email
 */
async function sendInterviewInvitation({ candidateName, candidateEmail, position, interviewDate, interviewType, meetingLink }) {
  const subject = `Interview Invitation - ${position}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Interview Invitation</h1>
        </div>
        <div class="content">
          <p>Dear ${candidateName},</p>
          
          <p>We are pleased to invite you for an interview for the <strong>${position}</strong> position at WinBuild ATS.</p>
          
          <div class="details">
            <h3>Interview Details:</h3>
            <p><strong>📅 Date & Time:</strong> ${new Date(interviewDate).toLocaleString()}</p>
            <p><strong>💼 Interview Type:</strong> ${interviewType}</p>
            ${meetingLink ? `<p><strong>🔗 Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
          </div>
          
          ${meetingLink ? `<a href="${meetingLink}" class="button">Join Interview</a>` : ''}
          
          <p>Please confirm your availability by replying to this email.</p>
          
          <p>We look forward to speaking with you!</p>
          
          <p>Best regards,<br>
          WinBuild ATS Recruitment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message from WinBuild ATS</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Dear ${candidateName},

We are pleased to invite you for an interview for the ${position} position at WinBuild ATS.

Interview Details:
Date & Time: ${new Date(interviewDate).toLocaleString()}
Interview Type: ${interviewType}
${meetingLink ? `Meeting Link: ${meetingLink}` : ''}

Please confirm your availability by replying to this email.

We look forward to speaking with you!

Best regards,
WinBuild ATS Recruitment Team`;

  return sendEmail({
    to: candidateEmail,
    subject,
    text,
    html
  });
}

/**
 * Send offer letter email
 */
async function sendOfferLetter({ candidateName, candidateEmail, position, startDate, baseSalary, offerDetails }) {
  const subject = `Offer Letter - ${position}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎊 Congratulations!</h1>
        </div>
        <div class="content">
          <p>Dear ${candidateName},</p>
          
          <p>We are delighted to extend an offer for the position of <strong>${position}</strong> at WinBuild ATS.</p>
          
          <div class="details">
            <h3>Offer Details:</h3>
            <p><strong>💼 Position:</strong> ${position}</p>
            <p><strong>📅 Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
            <p><strong>💰 Base Salary:</strong> $${Number(baseSalary).toLocaleString()}/year</p>
            ${offerDetails ? `<p>${offerDetails}</p>` : ''}
          </div>
          
          <p>Please review the attached offer letter and let us know if you accept this offer.</p>
          
          <p>We are excited to have you join our team!</p>
          
          <p>Best regards,<br>
          WinBuild ATS HR Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message from WinBuild ATS</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Dear ${candidateName},

We are delighted to extend an offer for the position of ${position} at WinBuild ATS.

Offer Details:
Position: ${position}
Start Date: ${new Date(startDate).toLocaleDateString()}
Base Salary: $${Number(baseSalary).toLocaleString()}/year

Please review the offer letter and let us know if you accept this offer.

We are excited to have you join our team!

Best regards,
WinBuild ATS HR Team`;

  return sendEmail({
    to: candidateEmail,
    subject,
    text,
    html
  });
}

/**
 * Send application confirmation email
 */
async function sendApplicationConfirmation({ candidateName, candidateEmail, position }) {
  const subject = `Application Received - ${position}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Application Received</h1>
        </div>
        <div class="content">
          <p>Dear ${candidateName},</p>
          
          <p>Thank you for applying for the <strong>${position}</strong> position at WinBuild ATS.</p>
          
          <p>We have received your application and our recruitment team will review it shortly.</p>
          
          <p>You will hear from us within 5-7 business days regarding the next steps.</p>
          
          <p>Best regards,<br>
          WinBuild ATS Recruitment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message from WinBuild ATS</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Dear ${candidateName},

Thank you for applying for the ${position} position at WinBuild ATS.

We have received your application and our recruitment team will review it shortly.

You will hear from us within 5-7 business days regarding the next steps.

Best regards,
WinBuild ATS Recruitment Team`;

  return sendEmail({
    to: candidateEmail,
    subject,
    text,
    html
  });
}

/**
 * Send rejection email
 */
async function sendRejectionEmail({ candidateName, candidateEmail, position }) {
  const subject = `Application Update - ${position}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Update</h1>
        </div>
        <div class="content">
          <p>Dear ${candidateName},</p>
          
          <p>Thank you for your interest in the <strong>${position}</strong> position at WinBuild ATS and for taking the time to apply.</p>
          
          <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
          
          <p>We appreciate your interest in WinBuild ATS and encourage you to apply for future opportunities that align with your skills and experience.</p>
          
          <p>Best wishes for your job search.</p>
          
          <p>Best regards,<br>
          WinBuild ATS Recruitment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message from WinBuild ATS</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Dear ${candidateName},

Thank you for your interest in the ${position} position at WinBuild ATS and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We appreciate your interest in WinBuild ATS and encourage you to apply for future opportunities that align with your skills and experience.

Best wishes for your job search.

Best regards,
WinBuild ATS Recruitment Team`;

  return sendEmail({
    to: candidateEmail,
    subject,
    text,
    html
  });
}

/**
 * Send interview reminder email (24 hours before)
 */
async function sendInterviewReminder({ candidateName, candidateEmail, position, interviewDate, interviewType, meetingLink }) {
  const subject = `Reminder: Interview Tomorrow - ${position}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Interview Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${candidateName},</p>
          
          <p>This is a friendly reminder about your upcoming interview tomorrow for the <strong>${position}</strong> position.</p>
          
          <div class="details">
            <h3>Interview Details:</h3>
            <p><strong>📅 Date & Time:</strong> ${new Date(interviewDate).toLocaleString()}</p>
            <p><strong>💼 Interview Type:</strong> ${interviewType}</p>
            ${meetingLink ? `<p><strong>🔗 Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
          </div>
          
          ${meetingLink ? `<a href="${meetingLink}" class="button">Join Interview</a>` : ''}
          
          <p>Please ensure you're ready 5 minutes before the scheduled time. Good luck!</p>
          
          <p>Best regards,<br>
          WinBuild ATS Recruitment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated reminder from WinBuild ATS</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Dear ${candidateName},

This is a friendly reminder about your upcoming interview tomorrow for the ${position} position.

Interview Details:
Date & Time: ${new Date(interviewDate).toLocaleString()}
Interview Type: ${interviewType}
${meetingLink ? `Meeting Link: ${meetingLink}` : ''}

Please ensure you're ready 5 minutes before the scheduled time. Good luck!

Best regards,
WinBuild ATS Recruitment Team`;

  return sendEmail({
    to: candidateEmail,
    subject,
    text,
    html
  });
}

/**
 * Send status update notification to candidate
 */
async function sendStatusUpdateNotification({ candidateName, candidateEmail, position, status, message }) {
  const statusConfig = {
    'accepted': {
      color: '#10b981',
      icon: '🎉',
      title: 'Application Moving Forward'
    },
    'rejected': {
      color: '#ef4444',
      icon: '📧',
      title: 'Application Update'
    },
    'on-hold': {
      color: '#f59e0b',
      icon: '⏸️',
      title: 'Application On Hold'
    },
    'interview-scheduled': {
      color: '#667eea',
      icon: '📅',
      title: 'Interview Scheduled'
    }
  };

  const config = statusConfig[status] || { color: '#667eea', icon: '📧', title: 'Application Update' };
  const subject = `${config.title} - ${position}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${config.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${config.icon} ${config.title}</h1>
        </div>
        <div class="content">
          <p>Dear ${candidateName},</p>
          
          <p>We wanted to update you on the status of your application for the <strong>${position}</strong> position.</p>
          
          <p>${message}</p>
          
          <p>If you have any questions, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br>
          WinBuild ATS Recruitment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message from WinBuild ATS</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Dear ${candidateName},

We wanted to update you on the status of your application for the ${position} position.

${message}

If you have any questions, please don't hesitate to reach out.

Best regards,
WinBuild ATS Recruitment Team`;

  return sendEmail({
    to: candidateEmail,
    subject,
    text,
    html
  });
}

module.exports = {
  sendEmail,
  sendInterviewInvitation,
  sendOfferLetter,
  sendApplicationConfirmation,
  sendRejectionEmail,
  sendInterviewReminder,
  sendStatusUpdateNotification
};
