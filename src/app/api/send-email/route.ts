import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json();
    
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get credentials from server-side environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPassword) {
      console.error('Email credentials not configured in environment variables');
      return NextResponse.json(
        { error: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env.local' },
        { status: 500 }
      );
    }
    
    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword, // App password for Gmail
      },
    });
    
    // Send email
    const info = await transporter.sendMail({
      from: `Starbucks Support <${emailUser}>`,
      to,
      subject,
      html,
    });
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
