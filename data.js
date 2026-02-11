async function sendeAnfrage() {
    const input = document.getElementById('userInput').value;
    const resultDiv = document.getElementById('result');
    
    // Beispiele laden
    const responseJson = await fetch('data.json');
    const examples = await responseJson.json();
    
    // Kontext für die KI bauen
    const context = examples.map(ex => `Vorfall: ${ex.vorfall} -> Lösung: ${ex.loesung}`).join('\n');

    resultDiv.style.display = 'block';
    resultDiv.innerText = 'KI denkt nach...';

    const apiResponse = await fetch('https://api.openai.com', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer DEIN_API_KEY'
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: `Du bist ein Buchhaltungs-Assistent. Nutze folgendes Format: $Soll / Haben Betrag$. Hier sind Beispiele:\n${context}` },
                { role: "user", content: `Was ist der Buchungssatz für: ${input}` }
            ]
        })
    });

    const data = await apiResponse.json();
    resultDiv.innerText = data.choices[0].message.content;
}
