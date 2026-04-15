import { sendEmail } from './email';

export async function sendBGCVerificationEmail(bgcId: string, pdfUrl: string, userName: string, userEmail: string): Promise<void> {
  await sendEmail({
    to: 'verification@oversize-escort-hub.com',
    subject: `BGC Verification - ${userName}`,
    html: `<h2>BGC Submission</h2><p>User: ${userName} (${userEmail})</p><p>ID: ${bgcId}</p><p>PDF: <a href="${pdfUrl}">${pdfUrl}</a></p>`,
  });
}

export async function sendApprovalNotification(userEmail: string, type: 'bgc' | 'dd214' | 'cert', status: 'approved' | 'denied'): Promise<void> {
  await sendEmail({
    to: userEmail,
    subject: `Your ${type.toUpperCase()} Verification - ${status.toUpperCase()}`,
    html: `<h2>Verification ${status.toUpperCase()}</h2><p>Your ${type} submission has been <strong>${status}</strong>.</p>`,
  });
}
