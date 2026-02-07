// Email Service - Basic structure
// TODO: Integrate with nodemailer or similar

class EmailService {
  constructor() {
    this.smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
  }

  async sendEmail(to, subject, html, text) {
    // TODO: Implement email sending with nodemailer
    console.log(`Sending email to ${to}: ${subject}`);
    // Mock implementation
    return { success: true, messageId: 'mock-id' };
  }

  async sendReminder(to, reminderData) {
    const subject = `תזכורת: ${reminderData.title}`;
    const html = `
      <h2>${reminderData.title}</h2>
      <p>${reminderData.message}</p>
      <p>תאריך: ${reminderData.date}</p>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendPaymentReminder(to, paymentData) {
    const subject = 'תזכורת לתשלום';
    const html = `
      <h2>תזכורת לתשלום</h2>
      <p>סכום: ${paymentData.amount} ${paymentData.currency}</p>
      <p>תאריך יעד: ${paymentData.dueDate}</p>
    `;
    return this.sendEmail(to, subject, html);
  }
}

module.exports = new EmailService();
