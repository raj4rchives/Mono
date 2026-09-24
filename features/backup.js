
function localISODate(d=new Date()){
  const x=new Date(d), offset=x.getTimezoneOffset();
  return new Date(x.getTime()-offset*60000).toISOString().slice(0,10);
}
function escapeFeatureText(value){
  return String(value ?? "").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
function safeJSON(key,fallback){
  try{const v=JSON.parse(localStorage.getItem(key)||"null");return v ?? fallback;}
  catch(e){return fallback;}
}
function put(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
function featureBack(){location.href="menu.html";}


const BACKUP_VERSION=1;
function collectAllBackupData(){
  const data={};
  for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key)continue;try{data[key]=JSON.parse(localStorage.getItem(key));}catch(e){data[key]=localStorage.getItem(key);}}
  return {app:"370R JEE Tracker",backupVersion:BACKUP_VERSION,exportedAt:new Date().toISOString(),localStorage:data};
}
function exportAllJson(){
  const backup=collectAllBackupData(),blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=`370R-JEE-Tracker-Backup-${new Date().toISOString().replace(/[:.]/g,"-")}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  const s=document.getElementById("backupStatus");if(s)s.textContent="✅ Full JSON backup downloaded successfully.";
}
function importAllJson(file){
  if(!file)return;
  const reader=new FileReader();reader.onload=()=>{
    try{
      const backup=JSON.parse(reader.result);
      if(!backup||typeof backup!=="object"||!backup.localStorage||typeof backup.localStorage!=="object")throw new Error("Invalid backup format");
      if(!confirm("Import this backup?\n\nThis will replace the current saved tracker data on this browser with the backup data."))return;
      Object.keys(backup.localStorage).forEach(key=>{const value=backup.localStorage[key];localStorage.setItem(key,typeof value==="string"?value:JSON.stringify(value));});
      const s=document.getElementById("backupStatus");if(s)s.textContent="✅ Backup imported. Reloading...";
      setTimeout(()=>location.reload(),500);
    }catch(e){const s=document.getElementById("backupStatus");if(s)s.textContent="❌ Invalid JSON backup. Nothing was changed.";console.error(e);}
  };reader.readAsText(file);
}
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("exportJsonBtn")?.addEventListener("click",exportAllJson);
  document.getElementById("importJsonInput")?.addEventListener("change",e=>{importAllJson(e.target.files?.[0]);e.target.value="";});
});
