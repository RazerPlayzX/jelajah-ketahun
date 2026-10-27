'use strict';
/* Halaman terpisah unggah foto desa, tidak membutuhkan login. */
const $ = (selector)=>document.querySelector(selector);
const escapeHtml = (input)=>String(input??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let villages=[],token='',previewUrl='';
function message(text,error=false){const node=$('#uploadMessage');node.textContent=text;node.className='upload-message '+(error?'is-error':'is-success');}
function renderVillageSummary(){
 const id=$('#uploadVillage').value;
 const v=villages.find(item=>item.id===id),el=$('#villageSummary');
 if(!v){el.textContent='Pilih desa terlebih dahulu untuk melihat jumlah foto yang tersedia.';return;}
 el.innerHTML=`<span class="summary-dot"></span> <strong>${escapeHtml(v.name)}</strong><span>·</span><span>${v.photos.length}/8 foto telah tersimpan</span>`;
}
function releasePreview(){if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl='';$('#uploadPreview').hidden=true;$('#uploadPreview').removeAttribute('src');}
function setFile(file){
 releasePreview();
 const input=$('#uploadPhoto');
 if(!file){$('#filePrompt').textContent='Klik untuk memilih gambar';$('#fileHelp').textContent='atau seret gambar ke area ini';$('#dropIllustration').hidden=false;return;}
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){$('#dropIllustration').hidden=false;$('#filePrompt').textContent='Klik untuk memilih gambar';$('#fileHelp').textContent='atau seret gambar ke area ini';message('Hanya JPG, PNG, dan WEBP yang dapat diunggah.',true);input.value='';return;}
 if(file.size>4*1024*1024){$('#dropIllustration').hidden=false;$('#filePrompt').textContent='Klik untuk memilih gambar';$('#fileHelp').textContent='atau seret gambar ke area ini';message('Ukuran gambar maksimal 4 MB.',true);input.value='';return;}
 message('');
 previewUrl=URL.createObjectURL(file);
 $('#uploadPreview').src=previewUrl;$('#uploadPreview').hidden=false;$('#dropIllustration').hidden=true;
 $('#filePrompt').textContent=file.name;
 $('#fileHelp').textContent=(file.size/1024/1024).toFixed(2)+' MB · Klik untuk mengganti gambar';
}
async function upload(event){
 event.preventDefault();
 const village=$('#uploadVillage').value,file=$('#uploadPhoto').files?.[0];
 if(!village){message('Pilih desa terlebih dahulu.',true);$('#uploadVillage').focus();return;}
 if(!file){message('Pilih gambar yang ingin diunggah.',true);return;}
 if(file.size>4*1024*1024){message('Ukuran gambar maksimal 4 MB.',true);return;}
 const button=$('#submitUpload');button.disabled=true;button.textContent='Mengunggah gambar...';message('Mengirim gambar ke server...');
 try{
  const response=await fetch('api/upload.php',{method:'POST',headers:{'X-CSRF-Token':token},body:new FormData($('#uploadForm')),credentials:'same-origin'});
  const result=await response.json().catch(()=>({error:'Server tidak mengembalikan data JSON.'}));
  if(!response.ok||!result.ok)throw new Error(result.error||'Gagal mengunggah gambar.');
  $('#uploadForm').hidden=true;
  $('#uploadSuccess').hidden=false;
  $('#viewVillageLink').href='index.php?desa='+encodeURIComponent(village);
  message('');
 }catch(e){console.error(e);message(e.message,true);}
 finally{button.disabled=false;button.innerHTML='Unggah gambar <span aria-hidden="true">→</span>';}
}
function resetForm(){
 $('#uploadForm').reset();$('#uploadForm').hidden=false;$('#uploadSuccess').hidden=true;
 releasePreview();$('#dropIllustration').hidden=false;
 $('#filePrompt').textContent='Klik untuk memilih gambar';$('#fileHelp').textContent='atau seret gambar ke area ini';
 $('#captionCounter').textContent='0/180 karakter';message('');
 refreshVillages();
}
async function refreshVillages(){
 try{
  const res=await fetch('api/villages.php',{headers:{Accept:'application/json'},credentials:'same-origin',cache:'no-store'});
  const result=await res.json();if(!res.ok||!Array.isArray(result.villages))throw new Error(result.error||'Data desa tidak tersedia');
  villages=result.villages;token=result.csrf_token||'';
  const select=$('#uploadVillage');const previous=select.value;
  select.innerHTML='<option value="">— Pilih desa —</option>'+villages.map(v=>`<option value="${escapeHtml(v.id)}" ${v.photos.length>=8?'disabled':''}>${escapeHtml(v.name)}${v.photos.length>=8?' (foto penuh)':''}</option>`).join('');
  const requested=new URLSearchParams(location.search).get('desa');
  if(previous && villages.some(v=>v.id===previous&&v.photos.length<8))select.value=previous;
  else if(requested&&villages.some(v=>v.id===requested&&v.photos.length<8))select.value=requested;
  renderVillageSummary();
 }catch(e){console.error(e);message('Data desa tidak dapat dimuat. Aktifkan MySQL di Laragon, impor database.sql, dan periksa config.php. Detail: '+e.message,true);$('#uploadVillage').innerHTML='<option value="">Gagal memuat desa dari database</option>';}
}
function main(){
 $('#uploadVillage').addEventListener('change',renderVillageSummary);
 $('#uploadPhoto').addEventListener('change',()=>setFile($('#uploadPhoto').files?.[0]));
 $('#uploadCaption').addEventListener('input',()=>$('#captionCounter').textContent=$('#uploadCaption').value.length+'/180 karakter');
 $('#uploadForm').addEventListener('submit',upload);
 $('#uploadAnother').addEventListener('click',resetForm);
 const dropzone=$('#photoDropzone');
 for(const eventName of ['dragenter','dragover'])dropzone.addEventListener(eventName,e=>{e.preventDefault();dropzone.classList.add('dragging');});
 for(const eventName of ['dragleave','drop'])dropzone.addEventListener(eventName,e=>{e.preventDefault();dropzone.classList.remove('dragging');});
 dropzone.addEventListener('drop',e=>{const file=e.dataTransfer?.files?.[0];if(!file)return;const transfer=new DataTransfer();transfer.items.add(file);$('#uploadPhoto').files=transfer.files;setFile(file);});
 refreshVillages();
}
document.addEventListener('DOMContentLoaded',main);
