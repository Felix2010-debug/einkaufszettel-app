from flask import Flask, render_template, request, redirect, jsonify
import requests  # für Open Food Facts API

app = Flask(__name__)

# Unser Einkaufszettel (temporär im Speicher)
einkaufszettel = []

# Startseite
@app.route('/')
def index():
    return render_template("index.html", einkaufszettel=einkaufszettel)

# Manuelles Hinzufügen
@app.route('/hinzufuegen', methods=['POST'])
def hinzufuegen():
    name = request.form.get('name')
    anzahl = request.form.get('anzahl')

    if name and anzahl and anzahl.isdigit():
        einkaufszettel.append({
            "name": name,
            "anzahl": int(anzahl)
        })

    return redirect('/')

# Anzahl ändern
@app.route('/aendern/<int:index>', methods=['POST'])
def aendern(index):
    neue_anzahl = request.form.get('anzahl')

    if neue_anzahl and neue_anzahl.isdigit() and 0 <= index < len(einkaufszettel):
        einkaufszettel[index]['anzahl'] = int(neue_anzahl)

    return redirect('/')

# Artikel löschen
@app.route('/loeschen/<int:index>')
def loeschen(index):
    if 0 <= index < len(einkaufszettel):
        einkaufszettel.pop(index)
    return redirect('/')

# Barcode hinzufügen
# Diese Route wird per JavaScript / Fetch aufgerufen, wenn ein Barcode gescannt wird
@app.route('/add_barcode', methods=['POST'])
def add_barcode():
    data = request.get_json()
    if not data or "barcode" not in data:
        return jsonify({"status": "error"}), 400

    barcode = data["barcode"]

    # Open Food Facts API abfragen
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        response = requests.get(url, timeout=5)
        data_api = response.json()

        if data_api.get("status") == 1:
            produkt_info = data_api.get("product", {})
            produkt_name = produkt_info.get("product_name", "").strip()
            marke = produkt_info.get("brands", "").strip()

            # Name, Marke oder Fallback auf Barcode
            if produkt_name:
                anzeige_name = f"{produkt_name} ({marke})" if marke else produkt_name
            elif marke:
                anzeige_name = marke
            else:
                anzeige_name = f"Produkt {barcode}"
        else:
            anzeige_name = f"Produkt {barcode}"
    except Exception as e:
        print("Fehler bei API:", e)
        anzeige_name = f"Produkt {barcode}"

    # In die Einkaufsliste einfügen
    einkaufszettel.append({
        "name": anzeige_name,
        "anzahl": 1
    })

    return jsonify({"status": "ok", "name": anzeige_name})


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
