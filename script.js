// Daftar kata kunci scam
const SCAM_KEYWORDS = [
  "deposit", "invest", "minimum", "withdraw fee", "pay to play",
  "buy token", "lock funds", "referral required", "airdrop fee",
  "private key", "seed phrase", "send crypto first"
];

// Cek apakah URL atau nama mengandung indikasi scam
function cekScam(nama, url) {
  const teks = (nama + " " + url).toLowerCase();
  const kataDitemukan = SCAM_KEYWORDS.filter(kata => teks.includes(kata));
  return kataDitemukan.length > 0 ? kataDitemukan : false;
}

// Tampilkan peringatan scam
function tampilkanScamWarning(kata) {
  const div = document.getElementById("scam-warning");
  const msg = document.getElementById("scam-message");
  msg.textContent = `Ditemukan: "${kata.join('", "')}" — ini sering digunakan scammer.`;
  div.classList.remove("hidden");
}

// Sembunyikan peringatan
function sembunyiScam() {
  document.getElementById("scam-warning").classList.add("hidden");
}

// Tambah Faucet
function tambahFaucet() {
  const nama = document.getElementById("nama").value.trim();
  const url = document.getElementById("url").value.trim();
  const menit = parseInt(document.getElementById("menit").value);

  if (!nama || !url || isNaN(menit) || menit < 1) {
    alert("Semua kolom wajib diisi dengan benar!");
    return;
  }

  // Cek scam
  const scam = cekScam(nama, url);
  if (scam) {
    tampilkanScamWarning(scam);
    const konfirm = confirm("Ini mengandung indikasi scam. Tetap tambahkan?");
    if (!konfirm) return;
  } else {
    sembunyiScam();
  }

  const data = JSON.parse(localStorage.getItem("faucets") || "[]");
  data.push({ nama, url, menit, terakhirClaim: null });
  localStorage.setItem("faucets", JSON.stringify(data));

  // Reset form
  document.getElementById("nama").value = "";
  document.getElementById("url").value = "";
  document.getElementById("menit").value = "";

  loadFaucets();
}

// Load Semua Faucet
function loadFaucets() {
  const list = document.getElementById("daftar-faucet");
  const data = JSON.parse(localStorage.getItem("faucets") || "[]");
  list.innerHTML = "";

  data.forEach((item, index) => {
    const li = document.createElement("li");

    // Status warna
    let status = "🟢";
    if (item.terakhirClaim) {
      const elapsed = (Date.now() - new Date(item.terakhirClaim)) / 1000 / 60;
      if (elapsed < item.menit) {
        status = "🔴";
        li.style.borderLeft = "4px solid red";
      }
    }

    li.innerHTML = `
      <div>
        <a href="${item.url}" target="_blank" title="Interval: tiap ${item.menit} menit">
          ${status} ${item.nama}
        </a>
      </div>
      <span class="hapus" onclick="hapus(${index})">🗑️</span>
    `;
    list.appendChild(li);
  });
}

// Hapus Faucet
function hapus(index) {
  const data = JSON.parse(localStorage.getItem("faucets") || "[]");
  const konfirm = confirm(`Hapus ${data[index].nama}?`);
  if (konfirm) {
    data.splice(index, 1);
    localStorage.setItem("faucets", JSON.stringify(data));
    loadFaucets();
  }
}

// Hapus Semua
function clearAll() {
  if (confirm("Hapus SEMUA faucet? Tindakan ini tidak bisa dibatalkan!")) {
    localStorage.removeItem("faucets");
    loadFaucets();
  }
}

// Export Data
function exportData() {
  const data = localStorage.getItem("faucets");
  if (!data || data === "[]") {
    alert("Tidak ada data untuk di-export!");
    return;
  }
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `faucet-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Import Data
document.getElementById("importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (Array.isArray(parsed)) {
        localStorage.setItem("faucets", JSON.stringify(parsed));
        loadFaucets();
        alert("✅ Data berhasil diimpor!");
      } else {
        throw new Error("Format salah");
      }
    } catch (err) {
      alert("❌ Gagal impor: File tidak valid!");
    }
  };
  reader.readAsText(file);
});

// Load saat halaman dibuka
window.onload = () => {
  loadFaucets();
  sembunyiScam();
};
