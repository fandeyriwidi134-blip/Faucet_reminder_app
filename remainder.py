import requests
import os
import json
from datetime import datetime, timedelta

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

# Path ke file data (simpan di Replit)
DATA_FILE = "faucets.json"

def baca_data():
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except:
        return []

def kirim_notif():
    faucets = baca_data()
    if not faucets:
        return

    sekarang = datetime.now()
    siap = []

    for f in faucets:
        if not f.get("terakhirClaim"):
            siap.append(f)
            continue
        last = datetime.fromisoformat(f["terakhirClaim"])
        next_claim = last + timedelta(minutes=f["menit"])
        if sekarang >= next_claim:
            siap.append(f)

    if siap:
        pesan = "🔔 <b>WAKTUNYA CLAIM FAUCET!</b>\n\n"
        for f in siap:
            pesan += f"🔹 <a href='{f['url']}'>{f['nama']}</a> (tiap {f['menit']} menit)\n"
        pesan += "\n✅ Buka & claim manual — jangan lupa!"
        
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        data = {"chat_id": CHAT_ID, "text": pesan, "parse_mode": "HTML"}
        requests.post(url, data=data)

if __name__ == "__main__":
    if TELEGRAM_TOKEN and CHAT_ID:
        kirim_notif()
    else:
        print("Set TELEGRAM_TOKEN dan CHAT_ID!")
