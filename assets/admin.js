'use strict';
const $ = selector => document.querySelector(selector);
const esc = text => String(text ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let villages = [], current = '', csrf = '', isBusy = false;
function activeVillage(){return villages.find(v=>v.id===current);}
function notify(message, bad = false){const el=$('#adminMessage');el.hidden=false;el.textContent=message;el.className='notice'+(bad?' error':' success');el.scrollIntoView({behavior:'smooth',block:'nearest'});}
function loginError(message){$('#loginError').hidden=false;$('#loginError').textContent=message;}
function loginView(){
    $('#loadingView').hidden=true;$('#dashboardView').hidden=true;$('#loginView').hidden=false;$('#logoutBtn').hidden=true;
}
function dashboardView(username){
    $('#loadingView').hidden=true;$('#loginView').hidden=true;$('#dashboardView').hidden=false;$('#logoutBtn').hidden=false;
    $('#whoAmI').textContent='Admin: '+(username || 'Pengelola');
}
async function getJSON(url,options={}){
    const r=await fetch(url,{cache:'no-store',credentials:'same-origin',...options});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||`Permintaan gagal (HTTP ${r.status})`);
    return j;
}
async function boot(){
    try{
        const auth=await getJSON('api/auth.php');csrf=auth.csrf;
        if(auth.setup_required){loginView();loginError('Belum ada akun admin. Buka setup.php terlebih dahulu untuk membuat akun.');return;}
        if(!auth.authenticated){loginView();return;}
        dashboardView(auth.username);await reload();
    }catch(e){$('#loadingView').textContent='Tidak dapat menghubungkan MySQL. '+e.message+' — Pastikan database.sql sudah diimpor dan config.php benar.';}
}
async function reload(){const data=await getJSON('api/admin.php');villages=data.villages;current=current&&villages.some(v=>v.id===current)?current:villages[0]?.id||'';render();}
function render(){
    $('#villageSelect').innerHTML=villages.map(v=>`<option value="${esc(v.id)}">${esc(v.name)}</option>`).join('');
    $('#villageSelect').value=current;
    $('#villageButtons').innerHTML=villages.map(v=>`<button type="button" data-village="${esc(v.id)}" class="${v.id===current?'active':''}">${esc(v.name)} <small>(${v.photos.length})</small></button>`).join('');
    const v=activeVillage();if(!v)return;
    $('#villageTitle').textContent=v.name;
    $('#description').value=v.description||'';
    $('#latitude').value=v.lat;
    $('#longitude').value=v.lng;
    $('#photoCounter').textContent=`${v.photos.length} / 8 foto`;
    $('#uploadPhotos').disabled=v.photos.length>=8;
    $('#photoList').innerHTML=v.photos.length?v.photos.map(p=>`<div class="admin-photo"><img loading="lazy" src="${esc(p.url)}" alt="${esc(p.caption||v.name)}"><div class="admin-photo-fields"><label>Keterangan foto<input id="caption-${p.id}" maxlength="180" value="${esc(p.caption)}" placeholder="Keterangan foto"></label><div class="bar"><button class="secondary" data-save-caption="${p.id}" type="button">Simpan</button><button class="danger" data-delete-photo="${p.id}" type="button">Hapus</button></div></div></div>`).join(''):'<p class="muted">Belum ada foto untuk desa ini.</p>';
}
async function mutation(fields){const body=new FormData();for(const [key,value] of Object.entries(fields))body.append(key,value);const result=await getJSON('api/admin.php',{method:'POST',headers:{'X-CSRF-Token':csrf},body});villages=result.villages;render();return result;}
async function upload(file, villageId, caption){const body=new FormData();body.append('village_id',villageId);body.append('photo',file);body.append('caption',caption);const result=await getJSON('api/upload.php',{method:'POST',headers:{'X-CSRF-Token':csrf},body});villages=result.villages;render();}
async function busy(action){if(isBusy)return;isBusy=true;document.querySelectorAll('.admin-content button').forEach(btn=>btn.disabled=true);try{await action();}catch(e){notify(e.message,true);}finally{isBusy=false;render();}}
document.addEventListener('DOMContentLoaded',()=>{
    boot();
    $('#loginForm').addEventListener('submit',async e=>{e.preventDefault();$('#loginError').hidden=true;try{const login=await getJSON('api/auth.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:$('#username').value.trim(),password:$('#password').value})});csrf=login.csrf;$('#password').value='';dashboardView($('#username').value.trim());await reload();}catch(err){loginError(err.message);}});
    $('#logoutBtn').addEventListener('click',async()=>{try{await getJSON('api/auth.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout',csrf})});loginView();}catch(err){notify(err.message,true);}});
    $('#villageSelect').addEventListener('change',e=>{current=e.target.value;render();});
    $('#villageButtons').addEventListener('click',e=>{const button=e.target.closest('[data-village]');if(button){current=button.dataset.village;render();}});
    $('#saveDescription').addEventListener('click',()=>busy(async()=>{const value=$('#description').value;await mutation({action:'description',village_id:current,description:value});notify('Deskripsi '+activeVillage().name+' berhasil disimpan.');}));
    $('#saveCoordinates').addEventListener('click',()=>busy(async()=>{const lat=$('#latitude').value,lng=$('#longitude').value;if(!lat||!lng)throw Error('Koordinat tidak boleh kosong.');if(!confirm('Simpan titik peta baru? Pastikan sudah diverifikasi dari GPS / sumber resmi.'))return;await mutation({action:'coordinates',village_id:current,lat,lng});notify('Koordinat berhasil diperbarui di database.');}));
    $('#uploadPhotos').addEventListener('click',()=>busy(async()=>{const files=Array.from($('#photoFile').files);const v=activeVillage();if(!files.length)throw Error('Pilih foto dahulu.');if(files.length+v.photos.length>8)throw Error('Maksimal 8 foto per desa. Tersisa '+(8-v.photos.length)+' slot.');let count=0;for(const file of files){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Jenis file '+file.name+' tidak didukung.');if(file.size>6*1024*1024)throw Error('Foto '+file.name+' melebihi 6 MB.');await upload(file,current,$('#newCaption').value.trim());count++;}$('#photoFile').value='';$('#newCaption').value='';notify(count+' foto berhasil diunggah ke server dan terlihat oleh pengunjung.');}));
    $('#photoList').addEventListener('click',e=>{const save=e.target.closest('[data-save-caption]');if(save){const id=Number(save.dataset.saveCaption),input=document.getElementById('caption-'+id);busy(async()=>{await mutation({action:'caption',photo_id:id,caption:input.value});notify('Keterangan foto tersimpan.');});return;}const del=e.target.closest('[data-delete-photo]');if(del){if(!confirm('Hapus foto ini secara permanen dari server?'))return;busy(async()=>{await mutation({action:'delete_photo',photo_id:Number(del.dataset.deletePhoto)});notify('Foto dihapus dari server.');});}});
});
