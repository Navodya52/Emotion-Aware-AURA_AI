import jsPDF from "jspdf";

export function exportChatToPdf(messages) {
  const pdf = new jsPDF();
  let y = 15;

  pdf.setFontSize(18);
  pdf.text("AURA AI Chat", 10, y);
  y += 12;

  pdf.setFontSize(11);

  messages.forEach((msg) => {
    const label = msg.sender === "user" ? "You: " : "AURA: ";
    const lines = pdf.splitTextToSize(label + msg.text, 180);

    if (y > 270) {
      pdf.addPage();
      y = 15;
    }

    pdf.text(lines, 10, y);
    y += lines.length * 7 + 5;
  });

  pdf.save("aura-chat.pdf");
}