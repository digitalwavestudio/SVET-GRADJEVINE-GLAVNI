import emailjs from '@emailjs/browser';

/**
 * Šalje email obaveštenje poslodavcu o novoj prijavi na posao.
 * 
 * VAŽNO: EmailJS Template u dashboard-u MORA da sadrži sledeće varijable:
 * - {{employer_email}} - Email adresa primaoca (poslodavca)
 * - {{employer_name}} - Ime/Naziv poslodavca
 * - {{candidate_name}} - Ime i prezime kandidata koji se prijavljuje
 * - {{job_title}} - Naslov oglasa za posao
 * - {{message}} - Poruka ili propratno pismo kandidata
 * - {{reply_to}} - Email adresa kandidata (opciono, za direktan odgovor)
 */
const getEnvVar = (viteKey: string | undefined, keyName: string): string => {
  const runtimeVal = (window as any).__APP_ENV__?.[keyName];
  if (runtimeVal && !runtimeVal.startsWith('%')) {
    return runtimeVal;
  }
  return viteKey || '';
};

export const sendJobApplicationEmail = async (
  employerEmail: string,
  employerName: string,
  candidateName: string,
  jobTitle: string,
  message: string,
  candidateEmail?: string
) => {
  const serviceId = getEnvVar(import.meta.env.VITE_EMAILJS_SERVICE_ID, 'VITE_EMAILJS_SERVICE_ID');
  const templateId = getEnvVar(import.meta.env.VITE_EMAILJS_TEMPLATE_ID, 'VITE_EMAILJS_TEMPLATE_ID');
  const publicKey = getEnvVar(import.meta.env.VITE_EMAILJS_PUBLIC_KEY, 'VITE_EMAILJS_PUBLIC_KEY');

  // Tihi izlaz ako ključevi nisu konfigurisani
  if (!serviceId || !templateId || !publicKey) {
    return;
  }

  try {
    const templateParams = {
      employer_email: employerEmail,
      employer_name: employerName,
      candidate_name: candidateName,
      job_title: jobTitle,
      message: message,
      reply_to: candidateEmail || '',
    };

    await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.info('EmailJS: Obaveštenje uspešno poslato.');
  } catch (error) {
    console.error('EmailJS Error:', error);
  }
};

/**
 * Šalje email obaveštenje korisniku o novoj poruci na chatu.
 */
export const sendChatMessageEmail = async (
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messageText: string
) => {
  const serviceId = getEnvVar(import.meta.env.VITE_EMAILJS_SERVICE_ID, 'VITE_EMAILJS_SERVICE_ID');
  const templateId = getEnvVar(import.meta.env.VITE_EMAILJS_CHAT_TEMPLATE_ID, 'VITE_EMAILJS_CHAT_TEMPLATE_ID');
  const publicKey = getEnvVar(import.meta.env.VITE_EMAILJS_PUBLIC_KEY, 'VITE_EMAILJS_PUBLIC_KEY');

  if (!serviceId || !templateId || !publicKey) {
    return;
  }

  try {
    const templateParams = {
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      sender_name: senderName,
      message_text: messageText,
    };

    await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.info('EmailJS: Chat obaveštenje uspešno poslato.');
  } catch (error) {
    console.error('EmailJS Chat Error:', error);
  }
};
