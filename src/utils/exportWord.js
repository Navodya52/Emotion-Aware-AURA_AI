import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export async function exportChatToWord(messages) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "AURA AI Chat",
                bold: true,
                size: 32,
              }),
            ],
          }),

          ...messages.map(
            (msg) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: msg.sender === "user" ? "You: " : "AURA: ",
                    bold: true,
                  }),
                  new TextRun(msg.text),
                ],
              })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "aura-chat.docx");
}