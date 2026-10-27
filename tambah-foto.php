<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f4f5ef">
  <meta name="description" content="Tambahkan foto dokumentasi desa di Kecamatan Ketahun, Bengkulu Utara.">
  <title>Tambah Gambar Desa — Jelajah Ketahun</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/styles.css?v=6">
  <script defer src="assets/upload.js?v=6"></script>
</head>
<body class="upload-page">
  <main class="upload-layout">
    <a href="index.php" class="back-link"><span aria-hidden="true">←</span> Kembali ke peta</a>
    <div class="upload-layout-grid">
      <section class="upload-intro" aria-labelledby="uploadHeading">
        <span class="eyebrow"><span class="eyebrow-star">✳</span> GALERI KETAHUN</span>
        <h1 id="uploadHeading">Satu foto,<br><em>sebuah cerita.</em></h1>
        <p>Bagikan dokumentasi desa agar siapa pun dapat mengenal tempat dan suasana di Kecamatan Ketahun.</p>
        <div class="upload-guidelines">
          <span class="guide-icon">01</span><span>Pilih salah satu dari 11 desa di Ketahun.</span>
          <span class="guide-icon">02</span><span>Tambahkan foto beserta keterangannya.</span>
          <span class="guide-icon">03</span><span>Foto akan tampil pada peta dan galeri desa.</span>
        </div>
        <p class="upload-side-note">Tidak perlu membuat akun. Jangan mengunggah foto pribadi tanpa izin atau gambar yang melanggar hak cipta.</p>
      </section>

      <section class="upload-card" aria-labelledby="formHeading">
        <div class="form-header"><span class="form-icon" aria-hidden="true">▧</span><div><span class="eyebrow small">FORM DOKUMENTASI</span><h2 id="formHeading">Tambah gambar desa</h2></div></div>
        <form id="uploadForm" enctype="multipart/form-data">
          <label class="form-label" for="uploadVillage">Pilih desa <span class="required">*</span></label>
          <select id="uploadVillage" name="village_id" required>
            <option value="">Memuat daftar desa...</option>
          </select>
          <div id="villageSummary" class="village-summary" aria-live="polite">Pilih desa terlebih dahulu untuk melihat jumlah foto yang tersedia.</div>

          <label class="form-label" for="uploadPhoto">Masukkan gambar <span class="required">*</span></label>
          <label class="photo-dropzone" id="photoDropzone" for="uploadPhoto">
            <input type="file" id="uploadPhoto" name="photo" accept="image/jpeg,image/png,image/webp" required>
            <span class="drop-illustration" id="dropIllustration" aria-hidden="true"><svg viewBox="0 0 48 48"><rect x="6" y="7" width="36" height="34" rx="7"/><circle cx="18" cy="18" r="4"/><path d="M10 34l9-9 8 7 5-5 6 7"/></svg></span>
            <img id="uploadPreview" class="upload-preview" alt="Pratinjau foto yang dipilih" hidden>
            <strong id="filePrompt">Klik untuk memilih gambar</strong>
            <span id="fileHelp">atau seret gambar ke area ini</span>
            <small>JPG, PNG, WEBP · Maksimal 4 MB</small>
          </label>

          <label class="form-label" for="uploadCaption">Keterangan foto <span class="optional">opsional</span></label>
          <textarea id="uploadCaption" name="caption" rows="3" maxlength="180" placeholder="Contoh: Pemandangan Desa Bukit Indah pada sore hari..."></textarea>
          <div class="caption-counter" id="captionCounter">0/180 karakter</div>

          <div class="upload-message" id="uploadMessage" role="status" aria-live="polite"></div>
          <button class="submit-photo" type="submit" id="submitUpload">Unggah gambar <span aria-hidden="true">→</span></button>
        </form>
        <div id="uploadSuccess" class="upload-success" hidden><span class="success-icon">✓</span><h3>Gambar berhasil ditambahkan!</h3><p>Foto sudah tersimpan di database dan dapat dilihat melalui titik desa pada peta.</p><a id="viewVillageLink" href="index.php">Lihat desa di peta →</a><button type="button" id="uploadAnother">Tambah gambar lainnya</button></div>
      </section>
    </div>
  </main>
</body>
</html>
