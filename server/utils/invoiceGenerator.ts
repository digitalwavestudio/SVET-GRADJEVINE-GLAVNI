import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  customerPIB?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  vat: number;
  total: number;
}

export async function generateProformaInvoice(
  data: InvoiceData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    // --- Header ---
    doc.fillColor("#444444").fontSize(20).text("SVET GRAĐEVINE", 50, 57);
    doc.fontSize(10).text("Informacioni portal za građevinarstvo", 50, 80);

    doc
      .fontSize(10)
      .text("Svet Građevine d.o.o.", 200, 50, { align: "right" })
      .text("Bulevar Oslobođenja 123", 200, 65, { align: "right" })
      .text("21000 Novi Sad, Srbija", 200, 80, { align: "right" })
      .text("PIB: 123456789", 200, 95, { align: "right" })
      .moveDown();

    // --- Invoice Info ---
    doc
      .fillColor("#000000")
      .fontSize(16)
      .text("PREDRAČUN (PRO-FORMA INVOICE)", 50, 160);
    doc.fontSize(10).text(`Broj: ${data.invoiceNumber}`, 50, 185);
    doc.text(`Datum: ${data.date}`, 50, 200);
    doc.text(`Rok za uplatu: ${data.dueDate}`, 50, 215);

    // --- Customer Info ---
    doc.fontSize(12).text("PRIMALAC:", 350, 160);
    doc.fontSize(10).text(data.customerName, 350, 185);
    doc.text(data.customerEmail, 350, 200);
    if (data.customerPIB) doc.text(`PIB: ${data.customerPIB}`, 350, 215);
    if (data.customerAddress) doc.text(data.customerAddress, 350, 230);

    // --- Table ---
    let y = 300;
    doc.fillColor("#F0F0F0").rect(50, y, 500, 20).fill();
    doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold");
    doc.text("Stavka", 60, y + 5);
    doc.text("Količina", 280, y + 5);
    doc.text("Cena", 350, y + 5);
    doc.text("Ukupno", 450, y + 5);

    doc.font("Helvetica");
    y += 30;

    data.items.forEach((item) => {
      doc.text(item.name, 60, y);
      doc.text(item.quantity.toString(), 280, y);
      doc.text(`${item.price.toFixed(2)} EUR`, 350, y);
      doc.text(`${item.total.toFixed(2)} EUR`, 450, y);
      y += 20;
    });

    // --- Totals ---
    y += 20;
    doc.text("Osnovica:", 350, y);
    doc.text(`${data.subtotal.toFixed(2)} EUR`, 450, y);
    y += 15;
    doc.text("PDV (20%):", 350, y);
    doc.text(`${data.vat.toFixed(2)} EUR`, 450, y);
    y += 15;
    doc.fontSize(12).font("Helvetica-Bold").text("UKUPNO ZA UPLATU:", 300, y);
    doc.text(`${data.total.toFixed(2)} EUR`, 450, y);

    // --- Payment Instructions ---
    y += 50;
    doc.fontSize(12).text("Uputstvo za plaćanje:", 50, y);
    doc.fontSize(10).font("Helvetica");
    y += 20;
    doc.text("Tekući račun: 160-0000000000000-00 (Banca Intesa)", 50, y);
    y += 15;
    doc.text(`Poziv na broj: ${data.invoiceNumber}`, 50, y);
    y += 15;
    doc.text("Svrha uplate: Uplata za oglasni paket po predračunu", 50, y);

    // --- Footer ---
    doc
      .fontSize(8)
      .fillColor("#888888")
      .text(
        "Ovaj dokument je validan bez matičnog pečata i potpisa. Predračun služi isključivo za uplatu na račun.",
        50,
        700,
        { align: "center" },
      );

    doc.end();
  });
}
