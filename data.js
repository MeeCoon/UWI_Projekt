async function sendeAnfrage() {
    const userInput = document.getElementById('userInput').value;
    const resultDiv = document.getElementById('result');
    
    if (!userInput) {
        alert("Bitte gib einen Geschäftsvorfall ein!");
        return;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerText = 'KI berechnet Buchungssatz...';

    try {
        // 1. Beispiele aus deiner data.json laden
        const responseJson = await fetch('data.json');
        const examples = await responseJson.json();
        
        // Kontext aus JSON für die KI aufbereiten
        const context = examples.map(ex => `Vorfall: ${ex.vorfall} -> Lösung: ${ex.loesung}`).join('\n');

        // 2. Anfrage an OpenAI senden
        const apiResponse = await fetch('https://api.openai.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer DEIN_API_KEY_HIER',
                'Connection': 'close' // Hilft gegen den 421-Fehler
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { 
                        role: "system", 
                        content: `Du bist ein Experte für Buchhaltung. Antworte immer im Format 'Soll / Haben Betrag'. Nutze diese Beispiele als Basis:\n${context}` 
                    },
                    { 
                        role: "user", 
                        content: `Erstelle den Buchungssatz für: ${userInput}` 
                    }
                ],
                temperature: 0.3 // Sorgt für präzisere, weniger kreative Antworten
            })
        });

        // 3. Antwort verarbeiten
        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error("Detail-Fehler:", errorData);
            resultDiv.innerText = "Fehler: " + (errorData.error.message || "Unbekannter Fehler");
            return;
        }

        const data = await apiResponse.json();
        resultDiv.innerText = data.choices[0].message.content;

    } catch (error) {
        console.error("Netzwerkfehler:", error);
        resultDiv.innerText = "Netzwerkfehler: Verbindung zur KI fehlgeschlagen.";
    }
}
