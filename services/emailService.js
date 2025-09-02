import transporter from "../config/smtp.js";

export async function sendMail({ email, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"My App" <${process.env.MAILER_FROM_NAME}>`,
      to: email,
      subject: subject,
      html: html,
    });
    return { success: true, info };
  } catch (error) {
    return { success: false, error };
  }
}
