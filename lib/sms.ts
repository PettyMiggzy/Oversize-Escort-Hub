const TEXTREQUEST_API_URL = "https://www.textrequest.com/api/v3";
const TEXTREQUEST_NUMBER = "(214) 949-4213";
const TEXTREQUEST_API_KEY = process.env.TEXTREQUEST_API_KEY;

export async function sendSMS(phoneNumber: string, message: string) {
  try {
    const response = await fetch(`${TEXTREQUEST_API_URL}/send/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TEXTREQUEST_API_KEY}`,
      },
      body: JSON.stringify({
        to_number: phoneNumber,
        message: message,
        from_number: TEXTREQUEST_NUMBER,
      }),
    });

    if (!response.ok) {
      throw new Error(`TextRequest failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("SMS send error:", error);
    throw error;
  }
}

export async function sendCertExpiryReminder(phoneNumber: string, certType: string, expiryDate: string) {
  const message = `REMINDER: Your ${certType} certificate expires on ${expiryDate}. Log in to renew at oversize-escort-hub.com`;
  return sendSMS(phoneNumber, message);
}

export async function sendLoadNotification(phoneNumber: string, loadId: string, carrierName: string) {
  const message = `New load posted by ${carrierName}! View it at oversize-escort-hub.com/loads/${loadId}`;
  return sendSMS(phoneNumber, message);
}

export async function sendMatchNotification(phoneNumber: string, carrierId: string, status: "accepted" | "declined") {
  const message = `Your load match has been ${status}! Check your dashboard for details.`;
  return sendSMS(phoneNumber, message);
}
