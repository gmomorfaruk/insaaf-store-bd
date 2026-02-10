type SendAccessEmailParams = {
  to: string;
  name?: string;
  claimUrl: string;
  packageId?: string;
  expiresAt?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM;

export async function sendAccessEmail(params: SendAccessEmailParams) {
  if (!RESEND_API_KEY || !RESEND_FROM) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM");
  }

  const subject = "Your package access link";
  const greeting = params.name ? `Hi ${params.name},` : "Hello,";
  const expiresLine = params.expiresAt
    ? `This link expires at ${new Date(params.expiresAt).toLocaleString()}.`
    : "This link expires in 24 hours.";

  const text = [
    greeting,
    "",
    "Your access link is ready. Please open the link below to view your account details.",
    params.packageId ? `Package: ${params.packageId}` : "",
    "",
    params.claimUrl,
    "",
    expiresLine,
    "",
    "If you did not request this, please ignore this email.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <p>${greeting}</p>
      <p>Your access link is ready. Please open the link below to view your account details.</p>
      ${params.packageId ? `<p><strong>Package:</strong> ${params.packageId}</p>` : ""}
      <p><a href="${params.claimUrl}">${params.claimUrl}</a></p>
      <p>${expiresLine}</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: params.to,
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error: ${body}`);
  }
}
