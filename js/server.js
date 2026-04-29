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

    const response = await client.responses.create({
      model: "gpt-5.5",
      input: [
        {
          role: "system",
          content:
            "Du bist ein einfacher Schweizer UWI-Lehrer. Erkläre Recht und Bilanz kurz, verständlich und schulisch. Keine verbindliche Rechtsberatung."
        },
        ...history,
        {
          role: "user",
          content: `
Firma:
${JSON.stringify(company)}

Bilanz:
${JSON.stringify(balance)}

Frage:
${question}
          `
        }
      ]
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
