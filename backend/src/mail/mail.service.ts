import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async sendResetEmail(email: string, token: string) {
    const resetLink =
      `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;

    console.log("Sending email to:", email);
    console.log("Reset link:", resetLink);

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset Password",
        html: `
          <h2>Reset Password</h2>
          <a href="${resetLink}">Reset Password</a>
        `,
      });

      console.log("Email sent successfully");
      console.log(info);
    } catch (error) {
      console.error("MAIL ERROR:");
      console.error(error);
      throw error;
    }
  }
}