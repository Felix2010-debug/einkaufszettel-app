// Verhindert, dass derselbe Barcode mehrfach hintereinander hinzugefügt wird
let letzteBarcode = null;

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
        decoder: { readers: ["ean_reader"] },
    }, function(err) {
        if (err) {
            console.error("Quagga Fehler:", err);
            alert("Kamera konnte nicht gestartet werden.");
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(function(result) {
        if (!result || !result.codeResult) return;

        const barcode = result.codeResult.code;

        // Verhindert Doppel-Barcodes direkt hintereinander
        if (barcode === letzteBarcode) return;
        letzteBarcode = barcode;

        console.log("Barcode erkannt:", barcode);

        // Barcode an Backend senden
        fetch("/add_barcode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ barcode: barcode })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "ok" && data.name) {
                const ul = document.getElementById('artikel-liste');
                const li = document.createElement('li');
                const index = ul.children.length;

                li.innerHTML = `
                    1x ${data.name}
                    <form action="/aendern/${index}" method="post" style="display:inline">
                        <input type="number" name="anzahl" min="1" required>
                        <button type="submit">Ändern</button>
                    </form>
                    <a href="/loeschen/${index}" id="loeschen-link">Löschen</a>
                `;
                ul.appendChild(li);
            } else {
                alert("Produkt nicht gefunden");
            }
        })
        .catch(err => {
            console.error("Fetch Fehler:", err);
            alert("Fehler beim Hinzufügen des Produkts.");
        });
    });
}

// Optional: Wenn du willst, dass der Button das Scanner-Fenster öffnet
document.querySelector('.barcode-btn').addEventListener('click', startScanner);
