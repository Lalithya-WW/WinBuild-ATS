const express = require('express');
const router = express.Router();
const {
  sendEmail,
  sendInterviewInvitation,
  sendOfferLetter,
  sendApplicationConfirmation,
  sendRejectionEmail
} = require('../config/sendgrid');
const { getConnection } = require('../config/database');
const sql = require('mssql');

// Send interview invitation
router.post('/interview-invitation', async (req, res) => {
  try {
    const {
      candidateId,
      candidateName,
      candidateEmail,
      position,
      interviewDate,
      interviewType,
      meetingLink
    } = req.body;

    // Validate required fields
    if (!candidateName || !candidateEmail || !position || !interviewDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: candidateName, candidateEmail, position, interviewDate'
      });
    }

    // Send email
    const result = await sendInterviewInvitation({
      candidateName,
      candidateEmail,
      position,
      interviewDate,
      interviewType: interviewType || 'Technical Interview',
      meetingLink
    });

    // Log activity in database
    if (candidateId) {
      try {
        const pool = await getConnection();
        await pool.request()
          .input('type', sql.NVarChar, 'email_sent')
          .input('title', sql.NVarChar, 'Interview Invitation Sent')
          .input('description', sql.NVarChar, `Interview invitation sent to ${candidateName} (${candidateEmail}) for ${position}`)
          .input('icon', sql.NVarChar, '📧')
          .query(`
            INSERT INTO Activities (type, title, description, icon, createdAt)
            VALUES (@type, @title, @description, @icon, GETDATE())
          `);
      } catch (dbError) {
        console.error('Failed to log activity:', dbError.message);
      }
    }

    res.json({
      success: true,
      message: 'Interview invitation sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending interview invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send interview invitation',
      error: error.message
    });
  }
});

// Send offer letter
router.post('/offer-letter', async (req, res) => {
  try {
    const {
      candidateId,
      candidateName,
      candidateEmail,
      position,
      startDate,
      baseSalary,
      offerDetails
    } = req.body;

    // Validate required fields
    if (!candidateName || !candidateEmail || !position || !startDate || !baseSalary) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: candidateName, candidateEmail, position, startDate, baseSalary'
      });
    }

    // Send email
    const result = await sendOfferLetter({
      candidateName,
      candidateEmail,
      position,
      startDate,
      baseSalary,
      offerDetails
    });

    // Log activity in database
    if (candidateId) {
      try {
        const pool = await getConnection();
        await pool.request()
          .input('type', sql.NVarChar, 'email_sent')
          .input('title', sql.NVarChar, 'Offer Letter Sent')
          .input('description', sql.NVarChar, `Offer letter sent to ${candidateName} (${candidateEmail}) for ${position}`)
          .input('icon', sql.NVarChar, '🎊')
          .query(`
            INSERT INTO Activities (type, title, description, icon, createdAt)
            VALUES (@type, @title, @description, @icon, GETDATE())
          `);
      } catch (dbError) {
        console.error('Failed to log activity:', dbError.message);
      }
    }

    res.json({
      success: true,
      message: 'Offer letter sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending offer letter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send offer letter',
      error: error.message
    });
  }
});

// Send application confirmation
router.post('/application-confirmation', async (req, res) => {
  try {
    const {
      candidateId,
      candidateName,
      candidateEmail,
      position
    } = req.body;

    // Validate required fields
    if (!candidateName || !candidateEmail || !position) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: candidateName, candidateEmail, position'
      });
    }

    // Send email
    const result = await sendApplicationConfirmation({
      candidateName,
      candidateEmail,
      position
    });

    // Log activity in database
    if (candidateId) {
      try {
        const pool = await getConnection();
        await pool.request()
          .input('type', sql.NVarChar, 'email_sent')
          .input('title', sql.NVarChar, 'Application Confirmation Sent')
          .input('description', sql.NVarChar, `Application confirmation sent to ${candidateName} (${candidateEmail})`)
          .input('icon', sql.NVarChar, '✉️')
          .query(`
            INSERT INTO Activities (type, title, description, icon, createdAt)
            VALUES (@type, @title, @description, @icon, GETDATE())
          `);
      } catch (dbError) {
        console.error('Failed to log activity:', dbError.message);
      }
    }

    res.json({
      success: true,
      message: 'Application confirmation sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending application confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send application confirmation',
      error: error.message
    });
  }
});

// Send rejection email
router.post('/rejection', async (req, res) => {
  try {
    const {
      candidateId,
      candidateName,
      candidateEmail,
      position
    } = req.body;

    // Validate required fields
    if (!candidateName || !candidateEmail || !position) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: candidateName, candidateEmail, position'
      });
    }

    // Send email
    const result = await sendRejectionEmail({
      candidateName,
      candidateEmail,
      position
    });

    // Log activity in database
    if (candidateId) {
      try {
        const pool = await getConnection();
        await pool.request()
          .input('type', sql.NVarChar, 'email_sent')
          .input('title', sql.NVarChar, 'Rejection Email Sent')
          .input('description', sql.NVarChar, `Rejection email sent to ${candidateName} (${candidateEmail})`)
          .input('icon', sql.NVarChar, '📧')
          .query(`
            INSERT INTO Activities (type, title, description, icon, createdAt)
            VALUES (@type, @title, @description, @icon, GETDATE())
          `);
      } catch (dbError) {
        console.error('Failed to log activity:', dbError.message);
      }
    }

    res.json({
      success: true,
      message: 'Rejection email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending rejection email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send rejection email',
      error: error.message
    });
  }
});

// Send custom email
router.post('/custom', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, and either text or html'
      });
    }

    // Send email
    const result = await sendEmail({
      to,
      subject,
      text: text || '',
      html: html || text
    });

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending custom email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Test email endpoint
router.post('/test', async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: to'
      });
    }

    const result = await sendEmail({
      to,
      subject: 'Test Email from WinBuild ATS',
      text: 'This is a test email from WinBuild ATS. If you received this, your email configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">🎉 Test Email Success!</h2>
          <p>This is a test email from WinBuild ATS.</p>
          <p>If you received this, your email configuration is working correctly!</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Sent from WinBuild ATS</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router;
