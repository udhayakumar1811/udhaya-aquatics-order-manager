import { db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export async function sendWhatsAppCloudMessage(customerPhone, messageText) {
  try {
    // 1. Fetch API settings from Firestore
    const settingsDoc = await getDoc(doc(db, 'settings', 'whatsappApi'));
    if (!settingsDoc.exists()) {
      console.warn("WhatsApp Cloud API not configured.");
      return { success: false, error: 'API not configured' };
    }

    const { phoneNumberId, accessToken } = settingsDoc.data();
    if (!phoneNumberId || !accessToken) {
      return { success: false, error: 'Missing Phone Number ID or Token' };
    }

    // 2. Clean phone number (Must include country code, e.g. 919876543210)
    let cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    // 3. Call Meta Graph API
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: messageText }
      })
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      console.error("Meta WhatsApp API Error:", data);
      return { success: false, error: data.error?.message || 'Failed to send' };
    }
  } catch (err) {
    console.error("Network or execution error sending WhatsApp message:", err);
    return { success: false, error: err.message };
  }
}