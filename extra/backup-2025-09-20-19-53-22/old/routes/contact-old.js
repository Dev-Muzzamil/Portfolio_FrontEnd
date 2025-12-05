const express = require('express');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

const router = express.Router();

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Additional options for better reliability
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 10
  });
};

// Enhanced email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Send contact message
router.post('/', [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject must be less than 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters')
], async (req, res) => {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
        process.env.EMAIL_USER === 'your-email@gmail.com' || 
        process.env.EMAIL_PASS === 'your-app-password') {
      console.log('Email configuration missing or using placeholder values. Environment variables needed:');
      console.log('- EMAIL_USER (currently:', process.env.EMAIL_USER, ')');
      console.log('- EMAIL_PASS (currently:', process.env.EMAIL_PASS, ')');
      console.log('- CONTACT_EMAIL (optional)');
      console.log('- SITE_NAME (optional)');
      
      return res.status(503).json({
        success: false,
        message: 'Contact form is temporarily unavailable. Please try the WhatsApp option or contact us directly.',
        error: 'Email service not configured',
        details: 'Please configure EMAIL_USER and EMAIL_PASS in your .env file'
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }

    const { name, email, subject, message } = req.body;

    // Additional email validation
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please check your email address and try again'
      });
    }

    const transporter = createTransporter();

    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'Email service configuration error. Please try again later.'
      });
    }

    const timestamp = new Date().toLocaleString();
    const contactEmail = process.env.CONTACT_EMAIL || process.env.EMAIL_USER;

    // Email to portfolio owner
    const ownerMailOptions = {
      from: process.env.EMAIL_USER,
      to: contactEmail,
      subject: `Portfolio Contact: ${subject || 'New Message from ' + name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0; text-align: center;">New Contact Form Submission</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="margin-bottom: 20px;">
                <h3 style="color: #333; margin: 0 0 10px 0;">Contact Details</h3>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #667eea;">${email}</a></p>
                <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject || 'No subject provided'}</p>
                <p style="margin: 5px 0;"><strong>Received:</strong> ${timestamp}</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #667eea;">
                <h4 style="color: #333; margin: 0 0 10px 0;">Message:</h4>
                <p style="margin: 0; line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e9ecef;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                  This message was sent from your portfolio contact form.
                </p>
              </div>
            </div>
          </div>
        </div>
      `
    };

    // Auto-reply email to user
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Thank you for contacting ${process.env.SITE_NAME || 'me'}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0; text-align: center;">Thank You for Your Message!</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>${name}</strong>,
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for reaching out to me through my portfolio website! I have received your message and truly appreciate you taking the time to contact me.
              </p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #667eea; margin: 20px 0;">
                <h4 style="color: #333; margin: 0 0 10px 0;">Your Message:</h4>
                <p style="margin: 0; line-height: 1.6; color: #555; font-style: italic;">
                  "${message}"
                </p>
              </div>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                I will review your message carefully and get back to you as soon as possible. I typically respond within 24-48 hours.
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                If you have any urgent inquiries, please don't hesitate to reach out to me directly.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  Best regards,<br>
                  <strong>${process.env.SITE_NAME || 'Portfolio Owner'}</strong>
                </p>
                <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                  This is an automated response. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        </div>
      `
    };

    // Send both emails
    try {
      await transporter.sendMail(ownerMailOptions);
      console.log('Owner notification email sent successfully');
      
      await transporter.sendMail(userMailOptions);
      console.log('Auto-reply email sent successfully');
      
      res.json({ 
        success: true,
        message: 'Your message has been received! Thank you for contacting me. I will get back to you soon.' 
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send email. Please check your email address and try again.'
      });
    }

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
});

module.exports = router;


