
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


const THEME_KEY="jee370rThemeV2";
const THEMES=["bento","brutalist","mono","blueprint","mono-red","mono-blue","mono-green","mono-purple","bento-coral","bento-mint","bento-lavender","bento-ocean","bento-sunset","brutalist-blue","brutalist-green","brutalist-purple","brutalist-orange","brutalist-pink","diamond"];
function selectTheme(theme){
  if(!THEMES.includes(theme))return;
  localStorage.setItem(THEME_KEY,theme);
  document.querySelectorAll("[data-theme]").forEach(b=>b.classList.toggle("active",b.dataset.theme===theme));
  const s=document.getElementById("themeStatus");if(s)s.textContent=`Saved: ${theme}`;
}
document.addEventListener("DOMContentLoaded",()=>{
  const current=localStorage.getItem(THEME_KEY)||"mono";
  document.querySelectorAll("[data-theme]").forEach(b=>b.addEventListener("click",()=>selectTheme(b.dataset.theme)));
  selectTheme(current);
});
