import { sendMail } from "./services/emailService.js"; // path adjust करो
import dotenv from "dotenv";
dotenv.config();

// CLI arguments: node testSendMail.js user@example.com "Subject" "Text message" "<h1>HTML</h1>"
const [,, email, subject, text, html] = process.argv;

if (!email || !subject || !text) {
  console.error("❌ Usage: node testSendMail.js <email> <subject> <text> [html]");
  process.exit(1);
}

async function testEmail() {
  const result = await sendMail({
    email: email,
    subject: subject,
    html: html || `<p>${text}</p>`,
  });

  if (result.success) {
    console.log("✅ Mail sent successfully:", result.info.messageId);
  } else {
    console.error("❌ Mail failed:", result.error);
  }
}

testEmail();
