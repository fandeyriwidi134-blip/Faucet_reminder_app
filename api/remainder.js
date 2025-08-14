// api/reminder.js
require('dotenv').config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sheetRes = await fetch(GOOGLE_SCRIPT_URL);
    const sheetData = await sheetRes.json();
    const faucets = sheetData.rows || [];

    const now = new Date();
    const siap = faucets.filter(f => {
      if (!f.terakhir_claim) return true;
      const last = new Date(f.terakhir_claim);
      const interval = parseInt(f['interval_(menit)']) || 1;
      const next = new Date(last.getTime() + interval * 60000);
      return now >= next;
    });

    if (siap.length > 0) {
      const botUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
      let pesan = '🔔 <b>WAKTUNYA CLAIM FAUCET!</b>\n\n';
      siap.forEach(f => {
        pesan += `🔹 <a href="${f.url}">${f.nama}</a> (tiap ${f['interval_(menit)']} menit)\n`;
      });
      pesan += '\n✅ Buka & claim manual — jangan lupa!';

      await fetch(botUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: pesan,
          parse_mode: 'HTML'
        })
      });
    }

    res.status(200).json({ checked: true, ready: siap.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
