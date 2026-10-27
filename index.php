<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#163c31">
  <meta name="description" content="Peta interaktif 11 desa di Kecamatan Ketahun, Bengkulu Utara, dengan foto dan informasi desa.">
  <title>Peta Desa Ketahun — Jelajah Ketahun</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="anonymous">
  <link rel="stylesheet" href="assets/styles.css?v=6">
  <script defer src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="anonymous"></script>
  <script defer src="assets/map.js?v=6"></script>
</head>
<body class="map-page">
  <main class="map-shell" aria-label="Peta interaktif Kecamatan Ketahun">
    <div id="map" aria-label="Peta sebelas desa Kecamatan Ketahun" role="application"></div>

    <section class="map-identity float-card" aria-label="Identitas peta">
      <span class="eyebrow"><span class="eyebrow-star">✳</span> EKSPLORASI DESA</span>
      <h1>Jelajah <span>Ketahun.</span></h1>
      <p>Kenali 11 desa di Kecamatan Ketahun melalui titik lokasi dan foto yang dibagikan.</p>
    </section>

    <div class="floating-search" id="searchContainer">
      <label class="search-input-wrap" for="villageSearch">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 4.4 4.4"/></svg>
        <input id="villageSearch" type="search" autocomplete="off" placeholder="Cari desa di peta..." aria-label="Cari desa di peta" aria-controls="searchResults" aria-expanded="false">
        <span class="search-shortcut" aria-hidden="true">11 desa</span>
      </label>
      <div class="search-results" id="searchResults" hidden></div>
    </div>

    <div class="map-tools" aria-label="Pengaturan peta">
      <div class="layer-switch" role="group" aria-label="Lapisan peta">
        <button type="button" id="roadLayer" class="active" aria-pressed="true">Jalan</button>
        <button type="button" id="satelliteLayer" aria-pressed="false">Satelit</button>
      </div>
      <button type="button" id="fitAll" class="icon-action" aria-label="Tampilkan semua titik desa" title="Tampilkan semua desa">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
    </div>

    <div class="map-bottom">
      <div class="map-note"><span class="status-dot"></span><span>Ketahun, Bengkulu Utara</span><span class="map-note-divider">·</span><span id="villageCount">11 titik desa</span></div>
      <a class="add-photo-button" href="tambah-foto.php" aria-label="Buka halaman tambah gambar desa">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m4 17 5.5-5.5L14 16l2.5-2.5 3.5 3.5M17 6v6M14 9h6"/></svg>
        <span>Tambah Gambar</span>
      </a>
    </div>
    <div class="map-alert" id="mapError" role="alert" hidden></div>
    <div class="map-loading" id="mapLoading"><span class="loading-spinner"></span> Menyiapkan peta Ketahun...</div>

    <div class="detail-overlay" id="detailOverlay" hidden>
      <div class="detail-scrim" data-close-detail></div>
      <section class="detail-panel" role="dialog" aria-modal="true" aria-labelledby="detailTitle" tabindex="-1">
        <button class="close-detail" type="button" data-close-detail aria-label="Tutup informasi desa">×</button>
        <div id="detailContent"></div>
      </section>
    </div>
  </main>
</body>
</html>
