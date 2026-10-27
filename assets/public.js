'use strict';
/* Situs publik tanpa login. Data desa/foto tersimpan di MySQL. */
const $ = selector => document.querySelector(selector);
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SOURCE_URL = 'https://bengkuluutarakab.bps.go.id/id/publication/2025/09/26/e84d08815b967e6fa71c6029/kecamatan-ketahun-dalam-angka-2025.html';
let VILLAGES = [], VILLAGE_BY_ID = new Map(), CSRF_TOKEN = '', previewUrl = null;
let state = {map:null, road:null, satellite:null, markers:new Map(), selectedId:null,detailId:null,detailPhotoIndex:0, loadedTile:false};
function defaultDescription(v){return `${v.name} merupakan salah satu desa di Kecamatan Ketahun, Kabupaten Bengkulu Utara, Bengkulu. Dokumentasi foto dan informasi desa dapat ditambahkan melalui peta.`;}
function description(v){return v.description?.trim() || defaultDescription(v);}
function photosFor(id){return VILLAGE_BY_ID.get(id)?.photos || [];}
function placeholder(label){return `<div class="image-placeholder" aria-label="${esc(label)}"><svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="9" width="38" height="30" rx="4"/><circle cx="32" cy="18" r="4"/><path d="m8 34 11-11 8 8 7-6 8 8"/></svg><span>${esc(label)}</span></div>`;}
function popupPhoto(v){const p=v.photos[0];return p?`<div class="map-popup-photo"><img loading="lazy" src="${esc(p.url)}" alt="${esc(p.caption||'Foto desa '+v.name)}"><span class="map-popup-photo-count">${v.photos.length} foto</span></div>`:`<div class="map-popup-photo"><div class="map-popup-placeholder"><span>Foto desa belum tersedia</span></div></div>`;}
function popupHtml(v){return `${popupPhoto(v)}<div class="map-popup-info"><small>DESA · KECAMATAN KETAHUN</small><h3>${esc(v.name)}</h3><p>${esc(description(v))}</p><button class="popup-open" type="button" data-view-village="${esc(v.id)}">Lihat foto & detail desa ↗</button><button class="popup-add" type="button" data-open-upload data-upload-village="${esc(v.id)}">＋ Tambah foto</button></div>`;}
function renderList(){const q=$('#searchVillage').value.trim().toLocaleLowerCase('id-ID');const matches=VILLAGES.filter(v=>[v.name, ...(v.id==='kuala-langi'?['Kualalangi','Kuala Lelangi']:[])].some(name=>name.toLocaleLowerCase('id-ID').includes(q)));$('#filteredCount').textContent=`${matches.length} desa`;$('#villageList').innerHTML=matches.length?matches.map(v=>`<button type="button" data-select-village="${esc(v.id)}" class="${v.id===state.selectedId?'active':''}"><span class="list-index">${String(VILLAGES.indexOf(v)+1).padStart(2,'0')}</span><span class="list-title">${esc(v.name)}</span>${v.photos.length?'<span class="has-photo">▧</span>':''}<span class="list-arrow">↗</span></button>`).join(''):'<p class="empty-search">Tidak ada desa yang cocok.</p>';}
function renderGrid(){$('#directoryGrid').innerHTML=VILLAGES.map(v=>{const p=v.photos[0];return `<button class="directory-card" type="button" data-view-village="${esc(v.id)}" aria-label="Lihat ${esc(v.name)}"><div class="card-photo">${p?`<img loading="lazy" src="${esc(p.url)}" alt="${esc(p.caption||'Foto '+v.name)}">`:placeholder('FOTO DESA BELUM ADA')}<span class="photo-badge">${v.photos.length?`${v.photos.length} FOTO`:'BELUM ADA FOTO'}</span></div><div class="card-content"><span class="card-kicker">KECAMATAN KETAHUN</span><h3>${esc(v.name)}</h3><div class="card-bottom"><span>Desa · Bengkulu Utara</span><strong>Lihat detail ↗</strong></div></div></button>`;}).join('');}
function pinIcon(active=false){return L.divIcon({html:`<div class="map-pin${active?' selected':''}"></div>`,className:'village-pin-icon',iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-15]});}
function mapError(message){$('#mapError').textContent=message;$('#mapError').hidden=false;}
function clearMapError(){$('#mapError').hidden=true;}
async function loadLeaflet(){
    if (window.L) return true;
    try {
        // Fallback if unpkg is blocked on this network.
        await Promise.all([new Promise((resolve,reject)=>{const el=document.createElement('script');el.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';el.onload=resolve;el.onerror=reject;document.head.appendChild(el);}),new Promise((resolve,reject)=>{const el=document.createElement('link');el.rel='stylesheet';el.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';el.onload=resolve;el.onerror=reject;document.head.appendChild(el);})]);
        return Boolean(window.L);
    } catch {return false;}
}
function cssReady(){const probe=document.createElement('div');probe.className='leaflet-pane';probe.style.visibility='hidden';document.body.appendChild(probe);const ok=getComputedStyle(probe).position==='absolute';probe.remove();return ok;}
async function ensureLeafletCss(){if(cssReady())return;const link=document.createElement('link');link.rel='stylesheet';link.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';document.head.appendChild(link);await new Promise(resolve=>{link.onload=resolve;link.onerror=resolve;setTimeout(resolve,2500)});}
async function initMap(){
    const loaded=await loadLeaflet();
    if(!loaded){mapError('Pustaka Leaflet tidak dapat dimuat. Periksa koneksi internet / pemblokir CDN. Daftar desa tetap bisa diklik untuk melihat informasinya.');return;}
    await ensureLeafletCss();
    if(!cssReady()){mapError('Stylesheet Leaflet gagal diunduh. Periksa tab Network dan pemblokiran CDN di browser.');return;}
    try{
        const map=L.map('map',{zoomControl:false,scrollWheelZoom:true,minZoom:8,maxZoom:18});state.map=map;
        state.road=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:19});
        state.satellite=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Imagery &copy; Esri, Maxar, Earthstar Geographics and contributors',maxZoom:18});
        state.road.addTo(map);L.control.zoom({position:'bottomright'}).addTo(map);
        const onTileLoaded=()=>{state.loadedTile=true;clearMapError();};
        state.road.on('tileload',onTileLoaded);state.satellite.on('tileload',onTileLoaded);
        let errors=0;
        state.road.on('tileerror',()=>{if(++errors>=3&&!state.loadedTile)mapError('Server peta OpenStreetMap tidak bisa dijangkau. Coba mode Satelit atau periksa koneksi, adblocker, VPN, atau tab Network di browser.');});
        state.satellite.on('tileerror',()=>{if(!state.loadedTile)mapError('Layer satelit belum dapat dimuat. Periksa koneksi ke ArcGIS/Esri.');});
        for(const v of VILLAGES){const marker=L.marker([v.lat,v.lng],{icon:pinIcon(),title:v.name,alt:`Lokasi ${v.name}`}).addTo(map);marker.bindPopup(popupHtml(v),{maxWidth:295,closeButton:true,autoPanPadding:[20,40]});marker.on('click',()=>selectVillage(v.id,false));marker.on('popupopen',()=>{const root=marker.getPopup().getElement();if(!root)return;root.onclick=event=>{const detail=event.target.closest('[data-view-village]');if(detail){openDetail(detail.dataset.viewVillage);return;}const add=event.target.closest('[data-open-upload]');if(add)openUpload(add.dataset.uploadVillage);};});state.markers.set(v.id,marker);}
        fitAll();setTimeout(()=>map.invalidateSize(true),240);
        window.addEventListener('resize',()=>map.invalidateSize());
        if('ResizeObserver' in window) new ResizeObserver(()=>map.invalidateSize(false)).observe($('#map'));
        $('#roadLayer').addEventListener('click',()=>setMapLayer('road'));
        $('#satelliteLayer').addEventListener('click',()=>setMapLayer('satellite'));
        $('#fitAll').addEventListener('click',()=>{fitAll();map.closePopup();state.selectedId=null;renderList();for(const marker of state.markers.values())marker.setIcon(pinIcon());});
        setTimeout(()=>{if(!state.loadedTile)mapError('Peta dasar belum muncul. Periksa koneksi internet ke tile.openstreetmap.org, coba klik Satelit, atau lihat Console / Network (F12).');},13000);
    }catch(e){console.error('Init peta:',e);mapError('Gagal menyiapkan peta: '+e.message);}
}
function setMapLayer(layer){if(!state.map)return;let sat=layer==='satellite';if(sat){state.map.removeLayer(state.road);state.satellite.addTo(state.map);}else{state.map.removeLayer(state.satellite);state.road.addTo(state.map);}state.loadedTile=false;clearMapError();$('#roadLayer').classList.toggle('active',!sat);$('#satelliteLayer').classList.toggle('active',sat);$('#roadLayer').setAttribute('aria-pressed',String(!sat));$('#satelliteLayer').setAttribute('aria-pressed',String(sat));}
function fitAll(){if(!state.map||!VILLAGES.length)return;state.map.fitBounds(L.latLngBounds(VILLAGES.map(v=>[v.lat,v.lng])).pad(.15),{padding:[35,35],maxZoom:12});}
function selectVillage(id,focusMap=true){const v=VILLAGE_BY_ID.get(id);if(!v)return;state.selectedId=id;renderList();for(const [key,marker] of state.markers)marker.setIcon(pinIcon(key===id));if(focusMap&&state.map){state.map.flyTo([v.lat,v.lng],Math.max(state.map.getZoom(),13),{animate:true,duration:.65});state.markers.get(id).openPopup();}else if(focusMap)openDetail(id);}
function openDetail(id){if(!VILLAGE_BY_ID.has(id))return;state.detailId=id;state.detailPhotoIndex=0;renderDetail();$('#detailOverlay').hidden=false;document.body.style.overflow='hidden';$('.detail-panel').focus();}
function closeDetail(){state.detailId=null;$('#detailOverlay').hidden=true;document.body.style.overflow='';}
function renderDetail(){const v=VILLAGE_BY_ID.get(state.detailId);if(!v)return;const arr=photosFor(v.id);state.detailPhotoIndex=Math.min(Math.max(0,state.detailPhotoIndex),Math.max(0,arr.length-1));const p=arr[state.detailPhotoIndex];$('#detailContent').innerHTML=`<div class="detail-cover">${p?`<img src="${esc(p.url)}" alt="${esc(p.caption||'Foto '+v.name)}">`:placeholder('BELUM ADA FOTO DESA')}${arr.length?`<span class="detail-photo-counter">${state.detailPhotoIndex+1} / ${arr.length} foto</span>`:''}</div><div class="detail-body"><span class="eyebrow eyebrow-dark">✳ &nbsp; DESA · KECAMATAN KETAHUN</span><h2 id="detailTitle">${esc(v.name)}</h2><p class="detail-description">${esc(description(v))}</p><div class="info-rows"><div class="info-row"><span>Kecamatan</span><strong>Ketahun</strong></div><div class="info-row"><span>Kabupaten</span><strong>Bengkulu Utara, Bengkulu</strong></div><div class="info-row"><span>Koordinat rujukan</span><strong>${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}</strong></div><div class="info-row"><span>Kode wilayah rujukan</span><strong>${esc(v.code||'-')}</strong></div></div><h3>Galeri foto <span style="color:#879d88;font-size:11px">(${arr.length})</span></h3>${arr.length?`<div class="detail-gallery">${arr.map((photo,i)=>`<button class="${i===state.detailPhotoIndex?'active':''}" type="button" data-gallery-index="${i}" aria-label="Lihat foto ${i+1}"><img loading="lazy" src="${esc(photo.url)}" alt="${esc(photo.caption||'Foto '+(i+1))}" /></button>`).join('')}</div>${p?.caption?`<p class="detail-description" style="margin-top:12px">${esc(p.caption)}</p>`:''}`:'<p class="detail-description">Belum ada foto untuk desa ini. Kamu bisa menjadi yang pertama menambahkan.</p>'}<div class="detail-actions"><button class="detail-link upload-detail-btn" type="button" data-open-upload data-upload-village="${esc(v.id)}">＋ Tambah foto desa</button><a class="detail-link" target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lng}#map=15/${v.lat}/${v.lng}">Lihat di OpenStreetMap ↗</a><a class="detail-link" target="_blank" rel="noopener noreferrer" href="${SOURCE_URL}">Referensi statistik BPS ↗</a></div><p class="data-note" style="margin-top:16px">Titik ini merupakan perkiraan lokasi desa, bukan kantor desa atau batas resmi. Pastikan dengan data GPS atau pemerintah desa.</p></div>`;}
function populateUploadVillages(){
    const select=$('#uploadVillage');
    select.innerHTML='<option value="">Pilih desa untuk foto ini...</option>'+VILLAGES.map(v=>`<option value="${esc(v.id)}">${esc(v.name)} (${v.photos.length}/8 foto)</option>`).join('');
}
function openUpload(id){
    if (!VILLAGES.length){window.alert('Data desa belum tersedia. Pastikan MySQL tersambung.');return;}
    populateUploadVillages();
    const targetId=id && VILLAGE_BY_ID.has(id)?id:(state.detailId||state.selectedId);
    if(targetId)$('#uploadVillage').value=targetId;
    $('#uploadMessage').textContent='';$('#uploadMessage').className='upload-message';
    $('#uploadOverlay').hidden=false;document.body.style.overflow='hidden';$('.upload-panel').focus();
}
function releasePreview(){if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;$('#uploadPreview').hidden=true;$('#uploadPreview').replaceChildren();}
function closeUpload(){
    $('#uploadOverlay').hidden=true;
    releasePreview();
    document.body.style.overflow=$('#detailOverlay').hidden?'':'hidden';
}
function setUploadMessage(message,error=false){
    const element=$('#uploadMessage');element.textContent=message;element.className='upload-message '+(error?'is-error':'is-success');
}
function replaceData(villages){
    VILLAGES=villages;VILLAGE_BY_ID=new Map(VILLAGES.map(v=>[v.id,v]));
    renderList();renderGrid();
    for(const v of VILLAGES){const marker=state.markers.get(v.id);if(marker)marker.setPopupContent(popupHtml(v));}
    if(state.detailId)renderDetail();
    populateUploadVillages();
}
async function submitPhoto(event){
    event.preventDefault();
    const form=$('#uploadForm'),file=$('#uploadPhoto').files?.[0], villageId=$('#uploadVillage').value;
    if(!villageId){setUploadMessage('Pilih nama desa terlebih dahulu.',true);return;}
    if(!file){setUploadMessage('Pilih foto yang akan ditambahkan.',true);return;}
    if(file.size>4*1024*1024){setUploadMessage('Foto maksimal 4 MB.',true);return;}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setUploadMessage('Gunakan gambar JPG, PNG, atau WEBP.',true);return;}
    const button=$('#submitUpload');button.disabled=true;button.textContent='Mengunggah foto...';
    setUploadMessage('Foto sedang dikirim ke server...');
    try{
        const response=await fetch('api/upload.php',{method:'POST',headers:{'X-CSRF-Token':CSRF_TOKEN},body:new FormData(form),credentials:'same-origin'});
        const result=await response.json().catch(()=>({error:'Server tidak mengembalikan data yang valid.'}));
        if(!response.ok||!result.ok)throw new Error(result.error||'Tidak dapat mengunggah foto.');
        replaceData(result.villages);
        $('#uploadVillage').value=villageId;form.querySelector('#uploadPhoto').value='';form.querySelector('#uploadCaption').value='';releasePreview();
        setUploadMessage('Foto berhasil ditambahkan! Sudah terlihat pada peta dan galeri.');
    }catch(e){console.error('Gagal unggah:',e);setUploadMessage(e.message,true);}
    finally{button.disabled=false;button.textContent='Unggah foto →';}
}
async function main(){
    document.addEventListener('click',event=>{
        const add=event.target.closest('[data-open-upload]');
        if(add){openUpload(add.dataset.uploadVillage);return;}
        const item=event.target.closest('[data-select-village]');
        if(item){selectVillage(item.dataset.selectVillage);return;}
        const detail=event.target.closest('[data-view-village]');
        if(detail){openDetail(detail.dataset.viewVillage);return;}
        const gallery=event.target.closest('[data-gallery-index]');
        if(gallery){state.detailPhotoIndex=Number(gallery.dataset.galleryIndex);renderDetail();return;}
        if(event.target.closest('[data-close-upload]')){closeUpload();return;}
        if(event.target.closest('[data-close-detail]'))closeDetail();
    });
    document.addEventListener('keydown',event=>{
        if(event.key!=='Escape')return;
        if(!$('#uploadOverlay').hidden){closeUpload();return;}
        if(!$('#detailOverlay').hidden)closeDetail();
    });
    $('#searchVillage').addEventListener('input',renderList);
    $('#uploadForm').addEventListener('submit',submitPhoto);
    $('#uploadPhoto').addEventListener('change',()=>{
        releasePreview();
        const file=$('#uploadPhoto').files?.[0];if(!file)return;
        if(!['image/jpeg','image/png','image/webp'].includes(file.type))return;
        previewUrl=URL.createObjectURL(file);
        const img=document.createElement('img');img.src=previewUrl;img.alt='Pratinjau foto yang dipilih';
        $('#uploadPreview').appendChild(img);$('#uploadPreview').hidden=false;
    });
    try {
        const response=await fetch('api/villages.php',{headers:{'Accept':'application/json'},cache:'no-store',credentials:'same-origin'});
        const data=await response.json();if(!response.ok)throw new Error(data.error||'Gagal membaca data desa.');
        if(!Array.isArray(data.villages)||!data.villages.length)throw new Error('Database belum memiliki daftar desa.');
        VILLAGES=data.villages;VILLAGE_BY_ID=new Map(VILLAGES.map(v=>[v.id,v]));CSRF_TOKEN=data.csrf_token||'';
        $('#filteredCount').textContent=`${VILLAGES.length} desa`;
        const counter=$('.section-counter');counter.innerHTML=`<strong>${VILLAGES.length}</strong> titik lokasi`;
        $('.number-pill').textContent=`${VILLAGES.length} desa`;
        $('#map').setAttribute('aria-label',`Peta interaktif ${VILLAGES.length} desa Kecamatan Ketahun`);
        renderList();renderGrid();populateUploadVillages();await initMap();
    } catch(e) {
        console.error('Gagal memuat informasi desa:',e);
        $('#villageList').innerHTML='<p class="empty-search">Data desa tidak dapat dimuat.</p>';
        $('#directoryGrid').innerHTML=`<p class="data-loading">${esc(e.message)}<br>Pastikan Laragon Apache + MySQL aktif dan database.sql sudah diimpor.</p>`;
        mapError(`Data desa dari MySQL belum tersedia. ${e.message}\nAktifkan Laragon, impor database.sql, dan periksa config.php.`);
    }
}
document.addEventListener('DOMContentLoaded',main);
