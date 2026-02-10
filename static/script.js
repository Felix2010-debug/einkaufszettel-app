let letzteBarcode = null;

document.addEventListener('DOMContentLoaded', () => {
    const scanBtn = document.querySelector('.barcode-btn');
    scanBtn.addEventListener('click', startScanner);

    const container = document.querySelector('#artikel-container');
    
    // Event Delegation für "Ändern"-Buttons
    container.addEventListener('click', (e) => {
        if (!e.target.classList.contains('aendern-btn')) return;

        const balken = e.target.closest('.artikel-balken');
        const index = balken.dataset.index;
        const anzahlDiv = balken.querySelector('.anzahl');

        if (balken.querySelector('input')) return; // bereits Eingabefeld vorhanden

        const aktuelleAnzahl = anzahlDiv.textContent;
        anzahlDiv.innerHTML = `
            <form action="/aendern/${index}" method="post" style="display:inline">
                <input type="number" name="anzahl" min="1" value="${aktuelleAnzahl}" required>
                <button type="submit">Speichern</button>
            </form>
        `;
    });
});

function startScanner() {
    const scannerElement = document.getElementById('scanner');
    scannerElement.style.display = 'block';

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerElement,
            constraints: { facingMode: "environment" }
        },
        decoder: { readers: ["ean_reader"] }
    }, (err) => {
        if (err) { console.error(err); alert("Kamera konnte nicht gestartet werden."); return; }
        Quagga.start();
    });

    Quagga.onDetected((result) => {
        if (!result || !result.codeResult) return;

        const barcode = result.codeResult.code;
        if (barcode === letzteBarcode) return;
        letzteBarcode = barcode;

        Quagga.stop();
        scannerElement.style.display = 'none';

        fetch("/add_barcode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ barcode: barcode })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "ok" && data.name) {
                const container = document.querySelector('#artikel-container');
                const index = container.children.length;

                const div = document.createElement('div');
                div.className = 'artikel-balken';
                div.dataset.index = index;
                div.innerHTML = `
                    <div class="anzahl">1</div>
                    <div class="name">${data.name}</div>
                    <div class="aktionen">
                        <button class="aendern-btn">Ändern</button>
                        <a href="/loeschen/${index}" class="loeschen-link">Löschen</a>
                    </div>
                `;
                container.appendChild(div);
            } else {
                alert("Produkt nicht gefunden");
            }
        })
        .catch(err => { console.error(err); alert("Fehler beim Hinzufügen"); });
    });
}
