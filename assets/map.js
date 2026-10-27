'use strict';
/* Peta publik Ketahun. Foto dan informasi desa berasal dari MySQL melalui api/villages.php. */
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (input) => String(input ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FALLBACK = [
  ['bukit-indah','Bukit Indah',-3.356,101.8179],
  ['bukit-tinggi','Bukit Tinggi',-3.3281,101.8339],
  ['dusun-raja','Dusun Raja',-3.2966,101.83],
  ['fajar-baru','Fajar Baru',-3.2947,101.8055],
  ['giri-kencana','Giri Kencana',-3.3569,101.8398],
  ['kuala-langi','Kuala Langi',-3.3567,101.7902],
  ['lubuk-mindai','Lubuk Mindai',-3.3003,101.7674],
  ['melati-harjo','Melati Harjo',-3.2574,101.7981],
  ['pasar-ketahun','Pasar Ketahun',-3.3746,101.8099],
  ['talang-baru','Talang Baru',-3.3157,101.8201],
  ['urai','Urai',-3.4039,101.8564]
].map(([id,name,lat,lng])=>({id,name,lat,lng,description:'',code:'',photos:[]}));
let villages = [];
let byId = new Map();
const mapState = {instance:null,street:null,satellite:null,markers:new Map(),detailId:null,photoIndex:0,selected:null,tilesLoaded:false,activeLayer:'road',dbReady:true};
function describe(v) {return (v.description || '').trim() || `${v.name} merupakan salah satu desa di Kecamatan Ketahun, Kabupaten Bengkulu Utara, Provinsi Bengkulu.`;}
function showError(message){const el=$('#mapError');el.textContent=message;el.hidden=false;}
function hideError(){if(mapState.dbReady)$('#mapError').hidden=true;}
function stopLoading(){$('#mapLoading').hidden=true;}
function preview(v){
 const photo=v.photos[0];
 return photo?`<div class="popup-photo"><img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.caption||'Foto '+v.name)}"><span>${v.photos.length} foto</span></div>`:
 `<div class="popup-photo popup-no-photo"><span class="no-photo-icon">▧</span><span>Belum ada foto desa</span></div>`;
}
function popup(v){return `${preview(v)}<div class="popup-body"><small>DESA · KECAMATAN KETAHUN</small><h3>${escapeHtml(v.name)}</h3><p>${escapeHtml(describe(v))}</p><button type="button" data-detail="${escapeHtml(v.id)}" class="popup-detail">Lihat informasi & galeri <span aria-hidden="true">↗</span></button></div>`;}
function pin(active=false){return L.divIcon({className:'village-pin-wrapper',html:`<span class="village-pin ${active?'active':''}"><span class="pin-center"></span></span>`,iconSize:[30,36],iconAnchor:[15,34],popupAnchor:[0,-31]});}
function setActive(id){mapState.selected=id;for(const [key,marker] of mapState.markers)marker.setIcon(pin(key===id));}
function navigateToVillage(id,animate=true){
 const v=byId.get(id),marker=mapState.markers.get(id);
 if(!v||!marker||!mapState.instance)return;
 setActive(id);
 const currentZoom=mapState.instance.getZoom();
 if(animate)mapState.instance.flyTo([v.lat,v.lng],Math.max(13,currentZoom),{duration:.65});
 else mapState.instance.setView([v.lat,v.lng],Math.max(13,currentZoom));
 window.setTimeout(()=>marker.openPopup(),animate?680:80);
}
function fitAll(){
 if(!mapState.instance||!villages.length)return;
 mapState.instance.fitBounds(L.latLngBounds(villages.map(v=>[v.lat,v.lng])),{padding:[54,54],maxZoom:12});
 setActive(null);mapState.instance.closePopup();
}
function setLayer(layer){
 if(!mapState.instance)return;
 const isSatellite=layer==='satellite';
 mapState.instance.removeLayer(mapState.street);
 mapState.instance.removeLayer(mapState.satellite);
 (isSatellite?mapState.satellite:mapState.street).addTo(mapState.instance);
 mapState.activeLayer=layer;mapState.tilesLoaded=false;
 $('#roadLayer').classList.toggle('active',!isSatellite);
 $('#satelliteLayer').classList.toggle('active',isSatellite);
 $('#roadLayer').setAttribute('aria-pressed',String(!isSatellite));
 $('#satelliteLayer').setAttribute('aria-pressed',String(isSatellite));
 if(mapState.dbReady)hideError();
}
async function ensureLeaflet(){
 if(window.L){return await ensureCss();}
 const sources=[
  ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js','https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'],
  ['https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js','https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css']
 ];
 for(const [scriptUrl,cssUrl] of sources){
  try{
   await Promise.all([loadAsset('script',scriptUrl),loadAsset('link',cssUrl)]);
   if(window.L && await ensureCss())return true;
  }catch(e){console.warn('Alternatif Leaflet gagal:',e);}
 }
 return false;
}
function hasLeafletCss(){const test=document.createElement('div');test.className='leaflet-pane';test.style.visibility='hidden';document.body.appendChild(test);const available=getComputedStyle(test).position==='absolute';test.remove();return available;}
function loadAsset(tag,src){return new Promise((resolve,reject)=>{const el=document.createElement(tag);if(tag==='script')el.src=src;else{el.rel='stylesheet';el.href=src;}el.onload=resolve;el.onerror=()=>reject(new Error('Gagal memuat '+src));document.head.appendChild(el);});}
async function ensureCss(){
 if(hasLeafletCss())return true;
 try{await loadAsset('link','https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css');return hasLeafletCss();}catch{return false;}
}
async function initializeMap(){
 if(!(await ensureLeaflet())){
  stopLoading();showError('Peta belum bisa dimuat karena Leaflet tidak terunduh. Periksa koneksi internet, CDN, adblocker atau tab Network (F12).');return;
 }
 try{
  const map=L.map('map',{minZoom:8,maxZoom:18,zoomControl:false,scrollWheelZoom:true});
  mapState.instance=map;
  mapState.street=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19});
  mapState.satellite=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Imagery &copy; Esri, Maxar, Earthstar Geographics and contributors',maxZoom:18});
  mapState.street.addTo(map);
  L.control.zoom({position:'bottomleft'}).addTo(map);
  const onTile=()=>{mapState.tilesLoaded=true;if(mapState.dbReady)hideError();stopLoading();};
  let errorTiles=0;
  mapState.street.on('tileload',onTile);mapState.satellite.on('tileload',onTile);
  for(const layer of [mapState.street,mapState.satellite])layer.on('tileerror',()=>{
    if(!mapState.tilesLoaded && ++errorTiles>=4 && mapState.dbReady){stopLoading();showError('Gambar dasar peta gagal diunduh. Coba tombol Satelit/Jalan, lalu periksa koneksi ke layanan peta. Titik desa tetap dapat diklik.');}
  });
  for(const v of villages){
   const marker=L.marker([v.lat,v.lng],{icon:pin(),title:v.name,alt:'Lokasi '+v.name}).addTo(map);
   marker.bindPopup(popup(v),{maxWidth:310,autoPanPaddingTopLeft:[16,150],autoPanPaddingBottomRight:[16,100]});
   marker.on('click',()=>setActive(v.id));
   mapState.markers.set(v.id,marker);
  }
  fitAll();
  window.setTimeout(()=>{map.invalidateSize(true);stopLoading();},250);
  window.addEventListener('resize',()=>map.invalidateSize());
  if('ResizeObserver' in window)new ResizeObserver(()=>map.invalidateSize(false)).observe($('#map'));
  const fromLink=new URLSearchParams(location.search).get('desa');
  if(fromLink&&byId.has(fromLink))window.setTimeout(()=>navigateToVillage(fromLink,false),650);
  window.setTimeout(()=>{if(!mapState.tilesLoaded&&mapState.dbReady)showError('Layer peta belum tampil. Periksa internet atau coba mode Satelit. Penanda desa tetap tersedia meskipun gambar dasar tidak termuat.');},12000);
 }catch(e){console.error(e);stopLoading();showError('Terjadi kesalahan saat menampilkan peta: '+e.message);}
}
function showSearchResults(){
 const input=$('#villageSearch'),result=$('#searchResults');
 const query=input.value.trim().toLocaleLowerCase('id-ID');
 if(!query){result.hidden=true;input.setAttribute('aria-expanded','false');return;}
 const matches=villages.filter(v=>v.name.toLocaleLowerCase('id-ID').includes(query)||(v.id==='kuala-langi'&&'kualalangi'.includes(query)));
 result.innerHTML=matches.length?matches.map(v=>`<button type="button" data-search-id="${escapeHtml(v.id)}"><span class="search-result-pin">⌖</span><span>${escapeHtml(v.name)}<small>${v.photos.length} foto tersedia</small></span><span aria-hidden="true">↗</span></button>`).join(''):'<p>Tidak ada desa yang cocok.</p>';
 result.hidden=false;input.setAttribute('aria-expanded','true');
}
function hideSearch(){const el=$('#searchResults');el.hidden=true;$('#villageSearch').setAttribute('aria-expanded','false');}
function openDetail(id){
 if(!byId.has(id))return;
 mapState.detailId=id;mapState.photoIndex=0;renderDetail();$('#detailOverlay').hidden=false;$('.detail-panel').focus();
}
function closeDetail(){mapState.detailId=null;$('#detailOverlay').hidden=true;}
function renderDetail(){
 const v=byId.get(mapState.detailId);if(!v)return;
 const photos=v.photos||[];
 mapState.photoIndex=Math.max(0,Math.min(mapState.photoIndex,photos.length-1));
 const item=photos[mapState.photoIndex];
 const mainImage=item?`<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.caption||'Foto '+v.name)}">`:`<div class="detail-empty"><span>▧</span><p>Belum ada foto desa</p></div>`;
 const gallery=photos.length?`<div class="detail-gallery">${photos.map((p,i)=>`<button type="button" data-gallery-index="${i}" class="${i===mapState.photoIndex?'active':''}" aria-label="Tampilkan foto ke-${i+1}"><img loading="lazy" src="${escapeHtml(p.url)}" alt="${escapeHtml(p.caption||'Foto '+v.name)}"></button>`).join('')}</div>`:'<p class="detail-muted">Dokumentasi desa ini belum tersedia.</p>';
 $('#detailContent').innerHTML=`<div class="detail-cover">${mainImage}${photos.length?`<div class="photo-number">${mapState.photoIndex+1} / ${photos.length} foto</div>`:''}</div><div class="detail-body"><span class="eyebrow">DESA DI KECAMATAN KETAHUN</span><h2 id="detailTitle">${escapeHtml(v.name)}</h2><p class="detail-description">${escapeHtml(describe(v))}</p><div class="detail-meta"><div><span>Kecamatan</span><strong>Ketahun</strong></div><div><span>Kabupaten</span><strong>Bengkulu Utara</strong></div><div><span>Koordinat rujukan</span><strong>${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}</strong></div></div><h3>Galeri foto <small>(${photos.length})</small></h3>${gallery}${item?.caption?`<p class="photo-caption">${escapeHtml(item.caption)}</p>`:''}<a class="detail-map-link" target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lng}#map=15/${v.lat}/${v.lng}">Lihat koordinat di OpenStreetMap ↗</a><p class="detail-disclaimer">Titik adalah koordinat rujukan/perkiraan desa, bukan batas wilayah atau lokasi kantor desa yang telah diverifikasi.</p></div>`;
}
async function main(){
 $('#roadLayer').addEventListener('click',()=>setLayer('road'));
 $('#satelliteLayer').addEventListener('click',()=>setLayer('satellite'));
 $('#fitAll').addEventListener('click',()=>{fitAll();$('#villageSearch').value='';hideSearch();});
 $('#villageSearch').addEventListener('input',showSearchResults);
 $('#villageSearch').addEventListener('keydown',e=>{if(e.key==='Escape'){hideSearch();e.target.blur();}if(e.key==='Enter'){const item=$('#searchResults [data-search-id]');if(item){e.preventDefault();navigateToVillage(item.dataset.searchId);hideSearch();e.target.blur();}}});
 document.addEventListener('click',e=>{
  const search=e.target.closest('[data-search-id]');if(search){navigateToVillage(search.dataset.searchId);$('#villageSearch').value=byId.get(search.dataset.searchId)?.name||'';hideSearch();return;}
  if(!e.target.closest('#searchContainer'))hideSearch();
  const detail=e.target.closest('[data-detail]');if(detail){openDetail(detail.dataset.detail);return;}
  const gallery=e.target.closest('[data-gallery-index]');if(gallery){mapState.photoIndex=Number(gallery.dataset.galleryIndex);renderDetail();return;}
  if(e.target.closest('[data-close-detail]'))closeDetail();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#detailOverlay').hidden)closeDetail();});
 try{
  const res=await fetch('api/villages.php',{headers:{Accept:'application/json'},credentials:'same-origin',cache:'no-store'});
  const data=await res.json();
  if(!res.ok||!Array.isArray(data.villages)||data.villages.length===0)throw new Error(data.error||'Data desa tidak tersedia');
  villages=data.villages;
 }catch(e){
  console.warn('Gagal memuat MySQL:',e);
  mapState.dbReady=false;
  villages=FALLBACK;
  showError('Database MySQL belum terhubung. Peta menampilkan titik rujukan sementara; foto akan tersedia setelah Laragon/MySQL dan database.sql aktif.');
 }
 byId=new Map(villages.map(v=>[v.id,v]));
 $('#villageCount').textContent=`${villages.length} titik desa`;
 await initializeMap();
}
document.addEventListener('DOMContentLoaded',main);
