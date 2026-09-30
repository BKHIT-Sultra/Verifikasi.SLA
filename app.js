// ============================================================
// KONFIGURASI
// ============================================================
var GAS_URL = "https://script.google.com/macros/s/AKfycbzIPvwV_ifYjH8ErkYX8IMp5LiJxVHqukODOXWumhTrHAueUcI7fzi_6q5i0lAa8VVm/exec";
var SECRET_TOKEN = "bkhit-sultra-sla-2024-v3r1f1k4s1";
var PASSWORD_SISTEM = "adminbkhit";

// ============================================================
// THEME
// ============================================================
function initTheme() {
  var saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme');
  var next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  var icon = document.getElementById('themeIcon');
  if (!icon) return;
  if (theme === 'dark') {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  } else {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }
}

initTheme();

// ============================================================
// JSONP
// ============================================================
function callGAS(action, params, timeoutMs) {
  timeoutMs = timeoutMs || 90000;
  return new Promise(function(resolve, reject) {
    var callbackName = 'jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    var timeoutId = setTimeout(function() {
      delete window[callbackName];
      var s = document.getElementById(callbackName);
      if (s) s.remove();
      reject(new Error('Request timeout. Coba lagi atau kurangi jumlah data.'));
    }, timeoutMs);

    window[callbackName] = function(data) {
      clearTimeout(timeoutId);
      resolve(data);
      delete window[callbackName];
      var s = document.getElementById(callbackName);
      if (s) s.remove();
    };

    var queryParams = { action: action, token: SECRET_TOKEN, callback: callbackName };
    for (var k in params) {
      if (params.hasOwnProperty(k)) queryParams[k] = params[k];
    }

    var query = new URLSearchParams(queryParams).toString();
    var script = document.createElement('script');
    script.id = callbackName;
    script.src = GAS_URL + '?' + query;
    script.onerror = function() {
      clearTimeout(timeoutId);
      delete window[callbackName];
      reject(new Error('Gagal koneksi ke server GAS.'));
    };
    document.body.appendChild(script);
  });
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type) {
  type = type || 'success';
  var container = document.getElementById('toastContainer');
  var toast = document.createElement('div');
  toast.className = 'custom-toast toast-' + type;
  
  var icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
  };
  
  toast.innerHTML = '<div class="toast-icon-wrapper">' + (icons[type] || icons.success) + '</div><div class="toast-message">' + message + '</div>';
  container.appendChild(toast);
  
  setTimeout(function() { toast.classList.add('show'); }, 10);
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 500);
  }, 3500);
}

// ============================================================
// MODAL & MASTER RISIKO
// ============================================================
var modalRisikoUI;
document.addEventListener("DOMContentLoaded", function() {
  modalRisikoUI = new bootstrap.Modal(document.getElementById('modalInputRisiko'));
});

function bukaModalInput() {
  document.getElementById('inputKomoditasBaru').value = '';
  modalRisikoUI.show();
}

function simpanKeMaster() {
  var komoditas = document.getElementById('inputKomoditasBaru').value;
  var risiko = document.getElementById('inputRisikoBaru').value;
  
  if (komoditas.trim() === "") {
    showToast("Nama komoditas tidak boleh kosong!", "warning");
    return;
  }
  
  var btn = document.getElementById('btnSimpanMaster');
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Menyimpan...';
  btn.disabled = true;
  
  callGAS('simpanMaster', { komoditas: komoditas, risiko: risiko })
    .then(function(res) {
      if (res && res.error) throw new Error(res.error);
      showToast("Data Master Risiko berhasil ditambahkan!", "success");
      btn.innerHTML = 'Simpan Data';
      btn.disabled = false;
      modalRisikoUI.hide();
    })
    .catch(function(err) {
      showToast("Gagal menyimpan: " + err.message, "error");
      btn.innerHTML = 'Simpan Data';
      btn.disabled = false;
    });
}

// ============================================================
// LOGIN
// ============================================================
function mainkanTransisi(pesanTeks, callbackEksekusi) {
  var overlay = document.getElementById('transitionOverlay');
  var teks = document.getElementById('transitionText');
  
  teks.innerText = pesanTeks;
  overlay.style.display = 'flex';
  setTimeout(function() { overlay.style.opacity = '1'; }, 10);
  
  setTimeout(function() {
    callbackEksekusi();
    overlay.style.opacity = '0';
    setTimeout(function() { overlay.style.display = 'none'; }, 400);
  }, 1200);
}

function handleEnter(e) {
  if (e.key === 'Enter') cekLogin();
}

function cekLogin() {
  var input = document.getElementById('inputPassword').value;
  if (input === PASSWORD_SISTEM) {
    localStorage.setItem('isLoggedIn', 'true');
    showToast("Login Berhasil! Selamat bekerja.", "success");
    mainkanTransisi("Mengautentikasi ke Dalam Sistem...", function() {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('mainApp').style.display = 'block';
      document.getElementById('inputPassword').value = '';
    });
  } else {
    showToast("Password salah! Silakan coba lagi.", "error");
  }
}

function logout() {
  mainkanTransisi("Keluar dengan Aman...", function() {
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('inputPassword').value = '';
    lastHasil = null;
    localStorage.removeItem('isLoggedIn');
  });
}

window.addEventListener('load', function() {
  var isLoggedIn = localStorage.getItem('isLoggedIn');
  if (isLoggedIn === 'true') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
  } else {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
  }
});

// ============================================================
// APLIKASI - PROSES UTAMA
// ============================================================
var intervalLoading;
var lastHasil = null;

function updateFileName(input) {
  var nameEl = document.getElementById('fileName');
  if (input.files && input.files[0]) {
    nameEl.textContent = input.files[0].name;
    nameEl.classList.add('has-file');
  } else {
    nameEl.textContent = 'Belum ada file';
    nameEl.classList.remove('has-file');
  }
}

function mulaiLoading() {
  document.getElementById('cardPeringatan').style.display = 'none';
  document.getElementById('cardSatpel').style.display = 'none';
  document.getElementById('loadingStatus').style.display = 'block';
  
  var textEl = document.getElementById('loadingText');
  var pesan = [
    "Membaca baris dan kolom Excel...",
    "Mengurai data Komoditas & Satpel...",
    "Mencocokkan parameter Master Risiko...",
    "Menghitung durasi pelayanan...",
    "Menyusun laporan visualisasi..."
  ];
  var i = 0;
  textEl.innerText = pesan[0];
  
  intervalLoading = setInterval(function() {
    i++;
    if (i < pesan.length) textEl.innerText = pesan[i];
    else textEl.innerText = "Sedikit lagi selesai...";
  }, 1500);
}

function hentikanLoading() {
  clearInterval(intervalLoading);
  document.getElementById('loadingStatus').style.display = 'none';
}

function prosesFile() {
  var fileInput = document.getElementById('fileUpload');
  var jenisVal = document.getElementById('jenisPermohonanUI').value;
  
  if (fileInput.files.length === 0) {
    showToast("Pilih file Excel terlebih dahulu!", "warning");
    return;
  }
  
  var file = fileInput.files[0];
  var allowedExtensions = /(\.xls|\.xlsx)$/i;
  if (!allowedExtensions.test(file.name)) {
    showToast("File harus berformat .xls atau .xlsx!", "error");
    return;
  }
  
  mulaiLoading();
  
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = new Uint8Array(e.target.result);
      var workbook = XLSX.read(data, {type: 'array'});
      var firstSheet = workbook.SheetNames[0];
      var excelData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {raw: false});
      
      if (excelData.length === 0) {
        hentikanLoading();
        showToast("File kosong atau tidak ada data!", "error");
        return;
      }
      
      var jsonStr = JSON.stringify(excelData);
      console.log("Ukuran data: " + jsonStr.length + " karakter, " + excelData.length + " baris");
      
      // Jika data kecil, pakai JSONP seperti biasa
      if (jsonStr.length < 6000) {
        callGAS('prosesVerifikasi', {
          data: jsonStr,
          jenis: jenisVal
        })
        .then(function(hasil) {
          if (hasil && hasil.error) {
            tampilkanErrorServer({ message: hasil.error });
            return;
          }
          tampilkanHasil(hasil);
        })
        .catch(tampilkanErrorServer);
        
      } else {
        // Data besar: pakai POST + polling
        kirimDataBesar(jsonStr, jenisVal);
      }
      
    } catch (err) {
      hentikanLoading();
      showToast("Gagal membaca file: " + err.message, "error");
    }
  };
  
  reader.readAsArrayBuffer(file);
}

// ============================================================
// KIRIM DATA BESAR via POST + POLLING
// ============================================================
function kirimDataBesar(jsonStr, jenis) {
  var requestId = 'req_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
  document.getElementById('loadingText').innerText = "Mengunggah data (" + jsonStr.length.toLocaleString() + " karakter)...";
  
  var payload = {
    action: 'uploadData',
    token: SECRET_TOKEN,
    requestId: requestId,
    data: jsonStr,
    jenis: jenis
  };
  
  console.log("Mengirim POST dengan requestId:", requestId);
  console.log("Payload size:", JSON.stringify(payload).length);
  
  // Pakai application/x-www-form-urlencoded agar Apps Script bisa parse
  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(payload)
  })
  .then(function() {
    console.log("POST terkirim (no-cors, tidak bisa lihat response)");
    document.getElementById('loadingText').innerText = "Menunggu server memproses...";
    
    var coba = 0;
    var maxCoba = 45; // 45 × 2 detik = 90 detik
    var interval = setInterval(function() {
      coba++;
      console.log("Polling #" + coba + " dengan requestId:", requestId);
      
      if (coba > maxCoba) {
        clearInterval(interval);
        hentikanLoading();
        showToast("Server timeout setelah 90 detik. Coba lagi.", "error");
        return;
      }
      
      callGAS('ambilHasil', { requestId: requestId }, 25000)
        .then(function(hasil) {
          console.log("Polling response:", hasil);
          
          if (hasil && hasil.error && hasil.error.indexOf("belum siap") !== -1) {
            // masih proses, lanjut polling
            document.getElementById('loadingText').innerText = "Memproses data... (" + coba + "/" + maxCoba + ")";
            return;
          }
          clearInterval(interval);
          if (hasil && hasil.error) {
            tampilkanErrorServer({ message: hasil.error });
            return;
          }
          tampilkanHasil(hasil);
        })
        .catch(function(err) {
          console.log("Polling error (retry):", err.message);
        });
      
    }, 2000);
  })
  .catch(function(err) {
    hentikanLoading();
    showToast("Gagal kirim data: " + err.message, "error");
  });
}

function tampilkanErrorServer(error) {
  hentikanLoading();
  var msg = (error && error.message) ? error.message : String(error);
  showToast("Error Server: " + msg, "error");
  console.error(error);
}

// ============================================================
// ANIMASI
// ============================================================
function animateNumber(el, target, suffix) {
  var start = 0;
  var duration = 900;
  var startTime = null;
  suffix = suffix || '';
  
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    var value = Math.floor(eased * target);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(step);
}

function updateRing(persen) {
  var ring = document.getElementById('ringFill');
  if (!ring) return;
  var circumference = 377;
  var offset = circumference - (persen / 100) * circumference;
  setTimeout(function() {
    ring.style.strokeDashoffset = offset;
  }, 100);
}

// ============================================================
// TAMPILKAN HASIL
// ============================================================
function tampilkanHasil(hasil) {
  hentikanLoading();
  
  // ====== HANDLE FORMAT ERROR ======
  if (hasil.status === "format_error") {
    showToast(hasil.pesan, "error");
    
    var banner = document.getElementById('bannerStatus');
    banner.className = 'status-banner banner-error no-print';
    document.getElementById('bannerIcon').className = 'status-icon icon-error';
    document.getElementById('bannerIcon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    document.getElementById('bannerTitle').innerText = "Format File Tidak Sesuai";
    document.getElementById('bannerDesc').innerText = hasil.pesan;
    
    document.getElementById('totData').innerText = '0';
    document.getElementById('totMemenuhi').innerText = '0';
    document.getElementById('totTidak').innerText = '0';
    document.getElementById('persentaseSLA').innerText = '0%';
    document.getElementById('waktuVerifikasi').innerText = '-';
    updateRing(0);
    
    document.getElementById('tableDetail').innerHTML = '<tr><td colspan="6"><div class="empty-state"><div>Tidak ada data untuk ditampilkan</div></div></td></tr>';
    document.getElementById('cardSatpel').style.display = 'none';
    document.getElementById('cardPeringatan').style.display = 'none';
    return;
  }
  
  lastHasil = hasil;
  showToast("Verifikasi Selesai!", "success");
  
  var now = new Date();
  document.getElementById('waktuVerifikasi').innerText = 
    now.getHours().toString().padStart(2, '0') + ":" + 
    now.getMinutes().toString().padStart(2, '0');

  // Animated counters
  animateNumber(document.getElementById('totData'), hasil.ringkasan.total);
  animateNumber(document.getElementById('totMemenuhi'), hasil.ringkasan.memenuhi);
  animateNumber(document.getElementById('totTidak'), hasil.ringkasan.tidakMemenuhi);
  
  var persen = 0;
  if (hasil.ringkasan.total > 0) {
    persen = (hasil.ringkasan.memenuhi / hasil.ringkasan.total) * 100;
  }
  
  // Animate percentage text
  var pctEl = document.getElementById('persentaseSLA');
  var targetVal = persen;
  var duration = 1200;
  var startTime = null;
  function stepPct(ts) {
    if (!startTime) startTime = ts;
    var p = Math.min((ts - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    pctEl.textContent = (eased * targetVal).toFixed(1) + '%';
    if (p < 1) requestAnimationFrame(stepPct);
    else pctEl.textContent = targetVal.toFixed(1) + '%';
  }
  requestAnimationFrame(stepPct);
  
  updateRing(persen);
  
  // Banner
  var banner = document.getElementById('bannerStatus');
  banner.className = 'status-banner banner-success no-print';
  document.getElementById('bannerIcon').className = 'status-icon icon-success';
  document.getElementById('bannerIcon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  document.getElementById('bannerTitle').innerText = "Verifikasi Selesai";
  
  var infoDomas = hasil.isDomas ? " (Mode Domas aktif)." : ".";
  document.getElementById('bannerDesc').innerText = "Sistem telah mencocokkan " + hasil.ringkasan.total + " dokumen unik" + infoDomas;

  // Satpel
  var containerSatpel = document.getElementById('containerSatpel');
  containerSatpel.innerHTML = "";
  var adaSatpel = false;

  for (var namaSatpel in hasil.berdasarkanSatpel) {
    adaSatpel = true;
    var d = hasil.berdasarkanSatpel[namaSatpel];
    var pS = d.total > 0 ? (d.memenuhi / d.total) * 100 : 0;
    
    var warnaClass = "bg-success-gradient";
    if (pS < 50) warnaClass = "bg-danger-gradient";
    else if (pS < 80) warnaClass = "bg-warning-gradient";
    
    containerSatpel.innerHTML += 
      '<div class="satpel-item">' +
        '<div class="satpel-header">' +
          '<span class="satpel-name">' + namaSatpel + '</span>' +
          '<span class="satpel-stats">' + pS.toFixed(1) + '% <small>(' + d.memenuhi + '/' + d.total + ')</small></span>' +
        '</div>' +
        '<div class="progress-custom">' +
          '<div class="progress-bar-custom ' + warnaClass + '" style="width: 0%" data-width="' + pS + '%"></div>' +
        '</div>' +
      '</div>';
  }
  
  // Trigger animation after DOM paint
  setTimeout(function() {
    var bars = containerSatpel.querySelectorAll('.progress-bar-custom');
    for (var i = 0; i < bars.length; i++) {
      bars[i].style.width = bars[i].getAttribute('data-width');
    }
  }, 100);

  if (adaSatpel) document.getElementById('cardSatpel').style.display = 'block';

  // Anomali
  var cardAnomali = document.getElementById('cardAnomali');
  var tBodyAnomali = document.getElementById('tableAnomali');
  tBodyAnomali.innerHTML = "";

  if (hasil.detailAnomali && hasil.detailAnomali.length > 0) {
    cardAnomali.style.display = 'block';
    hasil.detailAnomali.forEach(function(item) {
      tBodyAnomali.innerHTML += '<tr>' +
        '<td class="mono">' + item.noAju + '</td>' +
        '<td>' + item.komoditas + '</td>' +
        '<td>' + item.risiko + '</td>' +
        '<td class="mono">' + item.durasi + '</td>' +
        '<td><span style="color: var(--warning); font-weight:700;">' + item.keterangan + '</span></td>' +
      '</tr>';
    });
  } else {
    cardAnomali.style.display = 'none';
  }

  // Rata-rata
  var cardRata = document.getElementById('cardRataRata');
  var tbodyRata = document.getElementById('tbodyRataRata');
  tbodyRata.innerHTML = "";

  if (hasil.rataRataSLA) {
    cardRata.style.display = 'block';
    var urutan = ["Rendah", "Sedang", "Tinggi"];
    urutan.forEach(function(risiko) {
      var data = hasil.rataRataSLA[risiko];
      var statusColor = "var(--text-muted)";
      if (data.status === "Sesuai") statusColor = "var(--success)";
      else if (data.status !== "Tidak ada data") statusColor = "var(--danger)";
      
      var badgeClass = 'rendah';
      if (risiko === 'Sedang') badgeClass = 'sedang';
      if (risiko === 'Tinggi') badgeClass = 'tinggi';
      
      tbodyRata.innerHTML += '<tr>' +
        '<td><span class="badge-risiko ' + badgeClass + '">' + risiko + '</span></td>' +
        '<td class="mono">' + data.standar + '</td>' +
        '<td class="mono">' + data.rataRata + '</td>' +
        '<td style="color: ' + statusColor + '; font-weight:700;">' + data.status + '</td>' +
      '</tr>';
    });
  } else {
    cardRata.style.display = 'none';
  }

  // Komoditas belum ada
  var ulBelumAda = document.getElementById('listBelumAda');
  ulBelumAda.innerHTML = "";
  var adaKosong = false;
  for (var key in hasil.komoditasBelumAda) {
    ulBelumAda.innerHTML += '<li><b>' + key + '</b> (' + hasil.komoditasBelumAda[key] + ' data)</li>';
    adaKosong = true;
  }
  
  if (adaKosong && !hasil.isDomas) {
    document.getElementById('cardPeringatan').style.display = 'block';
    showToast("Ada komoditas yang belum terdaftar!", "warning");
  }

  // Detail tabel
  var tBody = document.getElementById('tableDetail');
  tBody.innerHTML = "";
  if (hasil.detailTidakMemenuhi.length === 0) {
    tBody.innerHTML = '<tr><td colspan="6"><div class="empty-state" style="color: var(--success);"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><div style="font-weight:700;">Luar Biasa! Semua data memenuhi SLA.</div></div></td></tr>';
  } else {
    hasil.detailTidakMemenuhi.forEach(function(item) {
      var badgeClass = 'rendah';
      var r = (item.risiko || '').toLowerCase();
      if (r === 'sedang') badgeClass = 'sedang';
      if (r === 'tinggi') badgeClass = 'tinggi';
      
      tBody.innerHTML += '<tr>' +
        '<td class="mono">' + item.noAju + '</td>' +
        '<td>' + item.komoditas + '</td>' +
        '<td><span class="badge-risiko ' + badgeClass + '">' + item.risiko + '</span></td>' +
        '<td class="mono">' + item.durasi + '</td>' +
        '<td class="mono">' + item.slaMax + '</td>' +
        '<td style="color: var(--danger); font-weight:700;">' + item.keterangan + '</td>' +
      '</tr>';
    });
  }
}

// ============================================================
// DOWNLOAD EXCEL
// ============================================================
function downloadTableToExcel(type, filename) {
  if (!lastHasil) {
    showToast("Belum ada data hasil verifikasi.", "warning");
    return;
  }

  var data = [];
  var headers = [];

  if (type === 'detail') {
    headers = ["No K.1.1 / Aju", "Komoditas", "Risiko", "Durasi", "SLA Max", "Keterangan"];
    data = lastHasil.detailTidakMemenuhi.map(function(item) {
      return [item.noAju, item.komoditas, item.risiko, item.durasi, item.slaMax, item.keterangan];
    });
  } else if (type === 'anomali') {
    headers = ["No K.1.1 / Aju", "Komoditas", "Risiko", "Durasi", "Keterangan"];
    data = (lastHasil.detailAnomali || []).map(function(item) {
      return [item.noAju, item.komoditas, item.risiko, item.durasi, item.keterangan];
    });
  }

  if (data.length === 0) {
    showToast("Tidak ada data untuk diunduh.", "warning");
    return;
  }

  var rows = [headers].concat(data);
  var ws = XLSX.utils.aoa_to_sheet(rows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");

  XLSX.writeFile(wb, filename + ".xlsx");
  showToast("File berhasil diunduh!", "success");
}
