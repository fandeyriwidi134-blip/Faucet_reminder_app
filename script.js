const SCAM_KEYWORDS = ["deposit", "invest", "minimum", "withdraw fee", "pay to play", "buy token", "lock funds", "referral required", "airdrop fee", "private key", "seed phrase", "send crypto first"];

function cekScam(nama, url) {
  const teks = (nama + " " + url).toLowerCase();
  return SCAM_KEYWORDS.filter(kata => teks.includes(kata));
}

function tampilkanScamWarning(kata) {
  const div = document.getElementById("scam-warning");
  const msg = document.getElementById("scam-message");
  msg.textContent = `Ditemukan: "${kata.join('", "')}" — ini sering digunakan scammer.`;
  div.classList.remove("hidden");
}

function sembunyiScam() {
  document.getElementById("scam-warning").classList.add("hidden");
}

async function tambahFaucet() {
  const nama = document.getElementById("nama").value.trim();
  const url = document.getElementById("url").value.trim();
  const menit = parseInt(document.getElementById("menit").value);

  if (!nama || !url || isNaN(menit) || menit < 1) {
    alert("Semua kolom wajib diisi!");
    return;
  }

  const scam = cekScam(nama, url);
  if (scam.length > 0) {
    tampilkanScamWarning(scam);
    const konfirm = confirm("Ini mengandung indikasi scam. Tetap tambahkan?");
    if (!konfirm) return;
  } else {
    sembunyiScam();
  }

  const a = document.createElement('a');
  a.href = url;
  const hostname = a.hostname.replace('www.', '');

  const response = await fetch("/api/update-sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nama, url, menit, hostname })
  });

  if (response.ok) {
    document.getElementById("nama").value = "";
    document.getElementById("url").value = "";
    document.getElementById("menit").value = "";
    loadFaucets();
  } else {
    alert("Gagal tambah ke Google Sheets");
  }
}

async function loadFaucets() {
  const list = document.getElementById("daftar-faucet");
  try {
    const res = await fetch("/api/get-sheets");
    const data = await res.json();

    list.innerHTML = "";
    data.rows.forEach((item, index) => {
      const li = document.createElement("li");
      const status = item.terakhir_claim ? "🟢" : "🔴";
      li.innerHTML = `
        <div>
          <a href="${item.url}" target="_blank">${status} ${item.nama}</a>
        </div>
        <span class="hapus" onclick="hapus('${item.url}')">🗑️</span>
      `;
      list.appendChild(li);
    });
  } catch (e) {
    list.innerHTML = "<li>❌ Gagal muat data</li>";
  }
}

async function hapus(url) {
  const a = document.createElement('a');
  a.href = url;
  const hostname = a.hostname.replace('www.', '');

  const res = await fetch("/api/update-sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "hapus", hostname })
  });

  if (res.ok) loadFaucets();
}

function exportData() {
  const data = JSON.stringify([...document.querySelectorAll("#daftar-faucet li")].map(li => li.textContent));
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "faucet-backup.json";
  a.click();
}

document.getElementById("importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      JSON.parse(ev.target.result);
      alert("Import tidak didukung di versi ini. Gunakan Google Sheets.");
    } catch {
      alert("File tidak valid!");
    }
  };
  reader.readAsText(file);
});

window.onload = loadFaucets;
