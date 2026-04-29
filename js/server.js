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
    const { question, company } = req.body;

    const response = await client.responses.create({
      model: "gpt-5.5",
      input: `
Du bist ein einfacher Rechts-Lehrer für ein Schweizer Schulprojekt.
Antworte kurz, verständlich und schulisch.
Keine verbindliche Rechtsberatung.

Firma:
${JSON.stringify(company)}

Frage:
${question}
      `
    });

    res.json({ answer: response.output_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ answer: "Fehler bei der KI-Verbindung." });
  }
});

app.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
