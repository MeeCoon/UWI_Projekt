import express from "express";
import cors from "cors";
import "dotenv/config";
import OpenAI from "openai";

const app = express();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

app.post("/api/recht-ki", async (req, res) => {
  try {
    const { question, company, balance, history = [] } = req.body;

    // Konvertiere history zu OpenAI-Format
    const messages = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Füge aktuelle Frage hinzu
    messages.push({
      role: "user",
      content: `
Firma: ${company?.name || "Unbekannt"}
Rechtsform: ${company?.legal || "Unbekannt"}
Branche: ${company?.industry || "Unbekannt"}

Aktuelle Bilanz:
${JSON.stringify(balance, null, 2)}

Frage:
${question}
      `
    });

    const response = await client.messages.create({
      model: "gpt-4",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: "Du bist ein Schweizer UWI-Lehrer für Recht und Bilanzwesen. Erkläre kurz, verständlich und schulisch. Nutze die Bilanzinformationen der Firma zur Erklärung. Gib keine verbindliche Rechtsberatung."
        },
        ...messages
      ]
    });

    const answer = response.choices[0]?.message?.content || "Keine Antwort erhalten.";

    res.json({ answer });
  } catch (err) {
    console.error("❌ KI-Fehler:", err.message);
    res.status(500).json({ 
      answer: `Fehler bei der KI-Verbindung: ${err.message}` 
    });
  }
});

app.listen(3000, () => {
  console.log("✅ Server läuft auf http://localhost:3000");
});
