document.getElementById("generateBtn").onclick = () => {
  const raw = document.getElementById("inputData").value.trim();

  const lines = raw.split("\n").filter(l => l.trim());

  const root = document.getElementById("orgChart");

  if (!lines.length) {
    root.innerHTML = "Keine Daten";
    return;
  }

  // Erste Person = Chef
  const [first, ...rest] = lines;

  const [ceoName, ...ceoRole] = first.split(" ");

  let html = `
    <div class="org-box ceo">
      <strong>${ceoName}</strong><br>
      ${ceoRole.join(" ")}
    </div>
    <div class="org-line"></div>
    <div class="org-row">
  `;

  rest.forEach(line => {
    const parts = line.split(" ");
    const name = parts[0];
    const role = parts.slice(1).join(" ");

    html += `
      <div class="org-box">
        <strong>${name}</strong><br>
        ${role}
      </div>
    `;
  });

  html += `</div>`;

  root.innerHTML = html;
};
