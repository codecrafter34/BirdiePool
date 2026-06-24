import { Resend } from 'resend';

export class EmailService {
  static get client() {
    if (!process.env.RESEND_API_KEY) return null;
    return new Resend(process.env.RESEND_API_KEY);
  }

  static async sendWelcomeEmail(email: string, name: string) {
    const resend = this.client;
    if (!resend) return;
    
    await resend.emails.send({
      from: 'BirdiePool <welcome@birdiepool.com>',
      to: email,
      subject: 'Welcome to BirdiePool!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #FFFFFF; padding: 40px; border-radius: 12px;">
          <h1 style="color: #10B981; margin-bottom: 20px;">Welcome to BirdiePool, ${name}!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #E5E7EB;">
            We're thrilled to have you join our community. With BirdiePool, every round of golf you play now has the potential to create real impact.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #E5E7EB;">
            Start by logging your first Stableford score in your dashboard, and pick a charity you'd like to support!
          </p>
          <a href="https://birdiepool.com/dashboard" style="display: inline-block; background-color: #10B981; color: #0A0A0A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">
            Go to Dashboard
          </a>
        </div>
      `
    });
  }

  static async sendWinnerAlert(email: string, prizeAmount: number) {
    const resend = this.client;
    if (!resend) return;

    await resend.emails.send({
      from: 'BirdiePool <prizes@birdiepool.com>',
      to: email,
      subject: 'You Won the BirdiePool Monthly Draw!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #FFFFFF; padding: 40px; border-radius: 12px;">
          <h1 style="color: #F59E0B; margin-bottom: 20px;">Congratulations! You're a Winner!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #E5E7EB;">
            Your recent scores have matched the monthly draw. You have won <strong>$${prizeAmount}</strong>!
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #E5E7EB;">
            Please log in to your dashboard to verify your identity and claim your prize.
          </p>
          <a href="https://birdiepool.com/dashboard" style="display: inline-block; background-color: #F59E0B; color: #0A0A0A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">
            Claim Prize
          </a>
        </div>
      `
    });
  }
}
