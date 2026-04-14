/**
 * Payment notification helpers.
 *
 * Required env vars (all optional — channels are skipped when absent):
 *   GMAIL_USER              – Gmail address used to send emails (cp.platforms@gmail.com)
 *   GMAIL_APP_PASSWORD      – Gmail App Password (generated in Google Account → Security → App Passwords)
 *   TWILIO_ACCOUNT_SID      – Twilio account SID
 *   TWILIO_AUTH_TOKEN       – Twilio auth token
 *   TWILIO_WHATSAPP_FROM    – e.g. "whatsapp:+14155238886"
 */

import nodemailer from "nodemailer";
import { prisma } from "./prisma";

// ── Low-level senders ─────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const user     = process.env.GMAIL_USER     ?? "cp.platforms@gmail.com";
  const password = process.env.GMAIL_APP_PASSWORD;
  if (!password) { console.error("[notify] GMAIL_APP_PASSWORD env var is not set — email skipped"); return false; }
  if (!to) return false;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: password },
  });

  try {
    await transporter.sendMail({
      from:    `"CP Portal" <${user}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (e) {
    console.error("[notify] email error", e);
    return false;
  }
}

/** Normalises Kenyan phone numbers and sends via Twilio WhatsApp. */
async function sendWhatsApp(rawPhone: string, message: string): Promise<boolean> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from || !rawPhone) return false;

  // Normalise: strip spaces, ensure E.164, prefix whatsapp:
  let phone = rawPhone.replace(/\s+/g, "");
  if (!phone.startsWith("+")) {
    phone = "+254" + phone.replace(/^0/, ""); // Kenya default country code
  }
  const to = `whatsapp:${phone}`;

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method:  "POST",
        headers: {
          Authorization:  `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: message }).toString(),
      }
    );
    if (!res.ok) console.error("[notify] whatsapp failed", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[notify] whatsapp error", e);
    return false;
  }
}

// ── HTML email templates ──────────────────────────────────────────────────────

const BASE_STYLE = `
  font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;
  background:#ffffff;border-radius:12px;overflow:hidden;
  border:1px solid #e2e8f0;
`;
const HEADER_STYLE = `
  background:#367C00;padding:24px 32px;
`;
const BODY_STYLE  = `padding:28px 32px;`;
const LABEL_STYLE = `color:#64748b;font-size:14px;padding:7px 0;width:40%;vertical-align:top;`;
const VALUE_STYLE = `font-size:14px;padding:7px 0;font-weight:600;color:#1e293b;`;
const FOOTER_STYLE = `
  background:#f8fafc;border-top:1px solid #e2e8f0;
  padding:16px 32px;font-size:12px;color:#94a3b8;
`;

function row(label: string, value: string) {
  return `<tr><td style="${LABEL_STYLE}">${label}</td><td style="${VALUE_STYLE}">${value}</td></tr>`;
}

function emailPaymentCaptured(
  name: string, amount: string, account: string, datePaid: string, mpesaCode: string
): string {
  return `
<div style="${BASE_STYLE}">
  <div style="${HEADER_STYLE}">
    <h2 style="margin:0;color:#ffffff;font-size:20px;">Payment Received</h2>
    <p style="margin:4px 0 0;color:#bbf7d0;font-size:13px;">CP Portal – Confirmation</p>
  </div>
  <div style="${BODY_STYLE}">
    <p style="margin:0 0 16px;color:#334155;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 20px;color:#475569;">
      Your payment has been successfully captured on the CP Portal.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      ${row("Amount", `KES ${amount}`)}
      ${row("Account", account)}
      ${row("Date paid", datePaid)}
      ${row("M-Pesa code", `<span style="font-family:monospace;">${mpesaCode}</span>`)}
    </table>
    <p style="margin:0;color:#94a3b8;font-size:13px;">
      This is an automated confirmation — no action is required.
    </p>
  </div>
  <div style="${FOOTER_STYLE}">CP Portal &middot; Catholic Professional Management System</div>
</div>`;
}

function emailPaymentVerified(
  name: string, amount: string, account: string, datePaid: string,
  mpesaCode: string, verifiedBy: string
): string {
  return `
<div style="${BASE_STYLE}">
  <div style="${HEADER_STYLE}">
    <h2 style="margin:0;color:#ffffff;font-size:20px;">Payment Verified ✓</h2>
    <p style="margin:4px 0 0;color:#bbf7d0;font-size:13px;">CP Portal – Confirmation</p>
  </div>
  <div style="${BODY_STYLE}">
    <p style="margin:0 0 16px;color:#334155;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 20px;color:#475569;">
      Your payment has been verified and recorded on the CP Portal.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      ${row("Amount", `KES ${amount}`)}
      ${row("Account", account)}
      ${row("Date paid", datePaid)}
      ${row("M-Pesa code", `<span style="font-family:monospace;">${mpesaCode}</span>`)}
      ${row("Verified by", verifiedBy)}
    </table>
    <p style="margin:0;color:#94a3b8;font-size:13px;">
      This is an automated confirmation — no action is required.
    </p>
  </div>
  <div style="${FOOTER_STYLE}">CP Portal &middot; Catholic Professional Management System</div>
</div>`;
}

// ── WhatsApp message templates ────────────────────────────────────────────────

function waPaymentCaptured(name: string, amount: string, account: string, mpesaCode: string): string {
  return (
    `Hello ${name},\n\n` +
    `Your payment of *KES ${amount}* to *${account}* has been received and captured on the CP Portal.\n\n` +
    `M-Pesa code: ${mpesaCode}\n\n` +
    `Thank you. 🙏`
  );
}

function waPaymentVerified(name: string, amount: string, account: string, mpesaCode: string): string {
  return (
    `Hello ${name},\n\n` +
    `Your payment of *KES ${amount}* to *${account}* has been *verified* on the CP Portal. ✅\n\n` +
    `M-Pesa code: ${mpesaCode}\n\n` +
    `Thank you. 🙏`
  );
}

// ── Shared dispatch ───────────────────────────────────────────────────────────

async function dispatch(
  memberId: string,
  email: string | null,
  phone: string | null,
  templateId: string,
  subject: string,
  html: string,
  waMessage: string,
  paymentId: string,
): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (email) {
    tasks.push(
      sendEmail(email, subject, html).then((ok) => {
        if (ok) {
          return prisma.notificationLog.create({
            data: {
              memberId,
              channel:    "Email",
              templateId,
              payload:    JSON.stringify({ paymentId, to: email }),
            },
          }).then(() => undefined);
        }
      })
    );
  }

  if (phone) {
    tasks.push(
      sendWhatsApp(phone, waMessage).then((ok) => {
        if (ok) {
          return prisma.notificationLog.create({
            data: {
              memberId,
              channel:    "WhatsApp",
              templateId,
              payload:    JSON.stringify({ paymentId, to: phone }),
            },
          }).then(() => undefined);
        }
      })
    );
  }

  await Promise.allSettled(tasks);
}

// ── Welcome templates ─────────────────────────────────────────────────────────

function emailMemberWelcome(
  name: string,
  email: string,
  tempPassword: string,
  workgroupName: string,
  mentorName: string | null,
  mentorPhone: string | null,
): string {
  const mentorLine = mentorName
    ? `${mentorName}${mentorPhone ? ` &middot; ${mentorPhone}` : ""}`
    : "To be assigned";

  return `
<div style="${BASE_STYLE}">
  <div style="${HEADER_STYLE}">
    <h2 style="margin:0;color:#ffffff;font-size:20px;">Welcome to CP! 🎉</h2>
    <p style="margin:4px 0 0;color:#bbf7d0;font-size:13px;">Catholic Professionals of OLQP South B</p>
  </div>
  <div style="${BODY_STYLE}">
    <p style="margin:0 0 16px;color:#334155;">Dear <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;line-height:1.6;">
      Welcome to the <strong>Catholic Professionals (CP) of OLQP South B</strong>. We are glad to have you with us.
      You are registered as a member through the <strong>${workgroupName}</strong> workgroup.
    </p>

    <p style="margin:0 0 8px;color:#334155;font-weight:600;">Your responsibilities as a member</p>
    <p style="margin:0 0 6px;color:#475569;font-size:14px;line-height:1.6;">
      As a CP member, you are expected to actively participate in the group's activities and contribute financially
      to support our programmes. Our regular activities include:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
      <li><strong>Kachai</strong> &mdash; Monthly workgroup meetings</li>
      <li><strong>General Meeting (MGM)</strong> &mdash; First Sunday of every month</li>
      <li><strong>CP Events</strong> &mdash; Community and spiritual events throughout the year</li>
    </ul>

    <p style="margin:0 0 8px;color:#334155;font-weight:600;">Financial Contributions</p>
    <p style="margin:0 0 6px;color:#475569;font-size:14px;line-height:1.6;">
      As a member, you are expected to make the following regular financial contributions:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
      <li><strong>KES 1,000</strong> &mdash; Annual membership fee (once per year)</li>
      <li><strong>KES 300/month</strong> &mdash; CP Kitty (monthly contribution)</li>
      <li><strong>KES 300/month</strong> &mdash; Welfare Kitty (monthly contribution)</li>
    </ul>

    <p style="margin:0 0 8px;color:#334155;font-weight:600;">Your Mentor</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      ${row("Mentor", mentorLine)}
    </table>
    <p style="margin:0 0 20px;color:#475569;font-size:13px;line-height:1.6;">
      Feel free to reach out to your mentor or any CP official with questions about the group.
    </p>

    <p style="margin:0 0 8px;color:#334155;font-weight:600;">Your Portal Account</p>
    <p style="margin:0 0 12px;color:#475569;font-size:13px;">
      Sign in at the CP Portal using your email and the temporary password below.
      Please update it to a password you can remember after your first login.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      ${row("Email", email)}
      ${row("Temporary password", `<span style="font-family:monospace;letter-spacing:2px;font-size:15px;">${tempPassword}</span>`)}
    </table>

    <p style="margin:0 0 4px;color:#334155;font-style:italic;">Ora et Labora.</p>
    <p style="margin:0;color:#64748b;font-size:13px;">CP Moderator, on behalf of CP OLQP South B</p>
  </div>
  <div style="${FOOTER_STYLE}">CP Portal &middot; Catholic Professionals of OLQP South B</div>
</div>`;
}

function waMemberWelcome(
  name: string,
  email: string,
  tempPassword: string,
  workgroupName: string,
  mentorName: string | null,
  mentorPhone: string | null,
): string {
  const mentorLine = mentorName
    ? `*${mentorName}*${mentorPhone ? ` — ${mentorPhone}` : ""}`
    : "To be assigned";

  return (
    `Dear ${name},\n\n` +
    `Welcome to *Catholic Professionals (CP) of OLQP South B*! 🎉\n\n` +
    `You are registered as a member through the *${workgroupName}* workgroup.\n\n` +
    `*As a member you are expected to:*\n` +
    `• Attend Kachai — monthly workgroup meetings\n` +
    `• Attend the General Meeting (MGM) — first Sunday of every month\n` +
    `• Participate in CP Events throughout the year\n` +
    `*Financial Contributions:*\n` +
    `• KES 1,000/year — Annual membership fee\n` +
    `• KES 300/month — CP Kitty\n` +
    `• KES 300/month — Welfare Kitty\n\n` +
    `*Your Mentor:* ${mentorLine}\n` +
    `Feel free to reach out to your mentor or any CP official for any questions.\n\n` +
    `*Your CP Portal login:*\n` +
    `📧 Email: ${email}\n` +
    `🔑 Temp password: ${tempPassword}\n` +
    `Please update your password after your first login.\n\n` +
    `_Ora et Labora._ 🙏\n` +
    `CP Moderator, on behalf of CP OLQP South B`
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function notifyPaymentCaptured(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where:   { id: paymentId },
    include: {
      member:  { select: { id: true, name: true, email: true, phone: true } },
      account: { select: { code: true, name: true } },
    },
  });
  if (!payment) return;

  const { member, account } = payment;
  const name         = member.name ?? "Member";
  const amount       = Number(payment.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 });
  const accountLabel = `${account.code} (${account.name})`;
  const datePaid     = new Date(payment.datePaid).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  await dispatch(
    member.id,
    member.email,
    member.phone ?? null,
    "payment_captured",
    "Payment Received – CP Portal",
    emailPaymentCaptured(name, amount, accountLabel, datePaid, payment.mpesaCode),
    waPaymentCaptured(name, amount, accountLabel, payment.mpesaCode),
    paymentId,
  );
}

export async function notifyMemberWelcome(userId: string, tempPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: {
      id:    true,
      name:  true,
      email: true,
      phone: true,
      memberProfile: {
        select: {
          workgroup: { select: { name: true } },
          mentor:    { select: { name: true, phone: true } },
        },
      },
    },
  });
  if (!user) return;

  const name         = user.name ?? "Member";
  const email        = user.email;
  const workgroupName = user.memberProfile?.workgroup?.name ?? "CP";
  const mentorName   = user.memberProfile?.mentor?.name   ?? null;
  const mentorPhone  = user.memberProfile?.mentor?.phone  ?? null;

  await dispatch(
    user.id,
    email,
    user.phone ?? null,
    "member_welcome",
    "Welcome to Catholic Professionals of OLQP South B",
    emailMemberWelcome(name, email, tempPassword, workgroupName, mentorName, mentorPhone),
    waMemberWelcome(name, email, tempPassword, workgroupName, mentorName, mentorPhone),
    userId,
  );
}

export async function notifyPaymentVerified(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where:   { id: paymentId },
    include: {
      member:     { select: { id: true, name: true, email: true, phone: true } },
      account:    { select: { code: true, name: true } },
      verifiedBy: { select: { name: true } },
    },
  });
  if (!payment) return;

  const { member, account } = payment;
  const name         = member.name ?? "Member";
  const amount       = Number(payment.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 });
  const accountLabel = `${account.code} (${account.name})`;
  const datePaid     = new Date(payment.datePaid).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
  const verifiedBy   = payment.verifiedBy?.name ?? "Admin";

  await dispatch(
    member.id,
    member.email,
    member.phone ?? null,
    "payment_verified",
    "Payment Verified – CP Portal",
    emailPaymentVerified(name, amount, accountLabel, datePaid, payment.mpesaCode, verifiedBy),
    waPaymentVerified(name, amount, accountLabel, payment.mpesaCode),
    paymentId,
  );
}
