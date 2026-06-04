import nodemailer from "nodemailer";

// Konfiguracija transportera
// U produkciji bi ovo išlo preko SMTP parametara iz .env fajla
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true za 465, false za ostale portove
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailService = {
  /**
   * Slanje generičkog sistemskog mejla
   */
  async sendEmail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) {
    try {
      // Ako nema kredencijala, samo logujemo (za dev/preview mod)
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[EMAIL SIMULACIJA]
        Prima: ${to}
        Naslov: ${subject}
        Sadržaj: (HTML sadržaj generisan)`);
        return { success: true, simulated: true };
      }

      await transporter.sendMail({
        from: '"Svet Građevine" <noreply@svetgradjevine.rs>',
        to,
        subject,
        html,
      });

      return { success: true };
    } catch (error) {
      console.error("Email Error:", error);
      throw error;
    }
  },

  /**
   * Šablon: Nova prijava za posao
   */
  async sendJobApplicationNotification(
    employerEmail: string,
    jobTitle: string,
    applicantName: string,
  ) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #FEBF0D;">Nova prijava za posao!</h2>
        <p>Poštovani,</p>
        <p>Imate novu prijavu za poziciju: <strong>${jobTitle}</strong>.</p>
        <p>Kandidat: <strong>${applicantName}</strong></p>
        <div style="margin-top: 30px;">
          <a href="${process.env.APP_URL}/dashboard/jobs" style="background-color: #FEBF0D; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">Pregledaj aplikaciju</a>
        </div>
        <p style="font-size: 12px; color: #888; margin-top: 40px;">Ovo je automatska poruka sa portala Svet Građevine.</p>
      </div>
    `;
    return this.sendEmail({
      to: employerEmail,
      subject: `Nova prijava: ${jobTitle}`,
      html,
    });
  },

  /**
   * Šablon: Potvrda verifikacije (Plava kvačica)
   */
  async sendVerificationApprovedNotification(
    userEmail: string,
    userName: string,
  ) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; background-color: #0f172a; color: #ffffff;">
        <h2 style="color: #FEBF0D; text-transform: uppercase;">Čestitamo! Vaš profil je verifikovan</h2>
        <p>Poštovani <strong>${userName}</strong>,</p>
        <p>Naš tim je pregledao Vašu dokumentaciju i sa zadovoljstvom Vas obaveštavamo da je Vaš profil dobio status <strong>Proveren Profesionalac</strong> (Plava Kvačica).</p>
        <p>Verifikovan status Vam omogućava veće poverenje klijenata i bolju poziciju u pretrazi.</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.APP_URL}/dashboard" style="background-color: #FEBF0D; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Poseti Profil</a>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 40px;">Tim Svet Građevine</p>
      </div>
    `;
    return this.sendEmail({
      to: userEmail,
      subject: `Profil Verifikovan - Svet Građevine`,
      html,
    });
  },

  /**
   * Šablon: Oglas odobren
   */
  async sendAdApprovedNotification(userEmail: string, adTitle: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #22c55e;">Vaš oglas je odobren!</h2>
        <p>Poštovani,</p>
        <p>Vaš oglas "<strong>${adTitle}</strong>" je prošao moderatorsku proveru i sada je vidljiv svim korisnicima na portalu.</p>
        <div style="margin-top: 30px;">
          <a href="${process.env.APP_URL}/marketplace" style="background-color: #FEBF0D; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">Pogledaj na sajtu</a>
        </div>
      </div>
    `;
    return this.sendEmail({
      to: userEmail,
      subject: `Oglas odobren: ${adTitle}`,
      html,
    });
  },

  /**
   * Šablon: Oglas odbijen
   */
  async sendAdRejectedNotification(
    userEmail: string,
    adTitle: string,
    reason: string,
  ) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #ef4444;">Vaš oglas nije odobren</h2>
        <p>Nažalost, Vaš oglas "<strong>${adTitle}</strong>" nije odobren jer ne ispunjava uslove korišćenja portala.</p>
        <p><strong>Razlog:</strong> ${reason}</p>
        <p>Možete izmeniti oglas i poslati ga ponovo na proveru.</p>
        <div style="margin-top: 30px;">
          <a href="${process.env.APP_URL}/dashboard/my-ads" style="background-color: #FEBF0D; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">Izmeni oglas</a>
        </div>
      </div>
    `;
    return this.sendEmail({
      to: userEmail,
      subject: `Obaveštenje o oglasu: ${adTitle}`,
      html,
    });
  },

  /**
   * Šablon: Novi RFQ (Tender za nabavku)
   */
  async sendRfqNotification({
    to,
    category,
    region,
    phone,
    specification,
  }: {
    to: string;
    category: string;
    region: string;
    phone: string;
    specification: Array<{ name: string; amount: number | string; unit: string; desc?: string }>;
  }) {
    const specRows = specification.map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 500;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace; font-weight: bold; color: #1e293b;">${item.amount}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; color: #64748b;">${item.unit}</td>
      </tr>
    `
    ).join("");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
        <div style="background-color: #0f172a; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
          <h2 style="color: #FEBF0D; margin: 0; text-transform: uppercase; font-size: 20px; letter-spacing: 1px;">Svet Građevine B2B</h2>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Novi zahtev za ponudu (RFQ) - Tender za nabavku</p>
        </div>
        
        <div style="padding: 20px 0;">
          <p>Poštovani,</p>
          <p>Prosleđujemo Vam novi zahtev za ponudu materijala na Vašoj lokaciji <strong>${region}</strong> u kategoriji <strong>${category}</strong>:</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Detalji klijenta:</strong></p>
            <p style="margin: 0 0 4px 0; font-size: 14px;">📍 Lokacija tendera: <strong>${region}</strong></p>
            <p style="margin: 0; font-size: 14px;">📞 Kontakt telefon klijenta: <a href="tel:${phone}" style="color: #10b981; font-weight: bold; text-decoration: none;">${phone}</a></p>
          </div>

          <h3 style="color: #0f172a; border-bottom: 2px solid #FEBF0D; padding-bottom: 6px; margin-top: 25px;">Specifikacija materijala</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="padding: 10px; text-align: left; font-size: 13px; color: #475569;">Stavka/Materijal</th>
                <th style="padding: 10px; text-align: right; font-size: 13px; color: #475569;">Količina</th>
                <th style="padding: 10px; text-align: left; font-size: 13px; color: #475569;">Jedinica</th>
              </tr>
            </thead>
            <tbody>
              ${specRows}
            </tbody>
          </table>

          <div style="margin-top: 30px; text-align: center; background-color: #fef08a; padding: 15px; border-radius: 6px; border: 1px dashed #ca8a04;">
            <p style="margin: 0; font-weight: bold; color: #854d0e; font-size: 15px;">Pozovite direktno klijenta na <a href="tel:${phone}" style="color: #1e3a8a; text-decoration: underline;">${phone}</a> i ponudite svoje cene.</p>
          </div>
        </div>
        
        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">Ovo je automatsko obaveštenje sa portala Svet Građevine.</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `[B2B RFQ Tender] Potražnja za materijalom - ${category} (${region})`,
      html,
    });
  },
};
