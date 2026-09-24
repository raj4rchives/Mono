
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

const FOCUS_KEY = "jee370rFocusLogsV1";
function getFocusLogs(){return safeJSON(FOCUS_KEY,[]);}
function saveFocusLogs(x){localStorage.setItem(FOCUS_KEY,JSON.stringify(x));}
function formatMinutes(min){min=Math.round(min);return min>=60?`${Math.floor(min/60)}h ${min%60}m`:`${min}m`;}
function saveManualFocusLog(e){
  if(e){e.preventDefault();e.stopPropagation();}
  const minutesEl=document.getElementById("focusManualMinutes");
  const dateEl=document.getElementById("focusManualDate");
  const minutes=parseInt(minutesEl?.value,10);
  if(!Number.isFinite(minutes) || minutes<1){
    alert("Study time me 1 ya usse zyada minutes enter karo.");
    minutesEl?.focus();
    return false;
  }
  const date=dateEl?.value || localISODate();
  const subject=document.getElementById("focusSubject")?.value || "Other";
  const activity=document.getElementById("focusActivity")?.value || "Other";
  const questions=parseInt(document.getElementById("focusQuestions")?.value,10)||0;
  const note=document.getElementById("focusNote")?.value.trim() || "Manual time";
  const logs=getFocusLogs();
  logs.push({id:Date.now()+Math.random(),date,minutes,subject,activity,questions,note,createdAt:Date.now(),manual:true});
  saveFocusLogs(logs);
  if(minutesEl) minutesEl.value="";
  if(document.getElementById("focusQuestions")) document.getElementById("focusQuestions").value="0";
  if(document.getElementById("focusNote")) document.getElementById("focusNote").value="";
  if(document.getElementById("focusFilterDate")) document.getElementById("focusFilterDate").value=date;
  renderFocus();
  refreshWeeklyIfOpen();
  alert(`✅ ${formatMinutes(minutes)} focus time saved for ${date}.`);
  return false;
}
function renderFocus(){
  const date=document.getElementById("focusFilterDate")?.value || localISODate();
  const logs=getFocusLogs(), daily=logs.filter(x=>x.date===date);
  const today=logs.filter(x=>x.date===localISODate());
  const mins=arr=>arr.reduce((a,x)=>a+(Number(x.minutes)||0),0);
  put("focusTodayMinutes",formatMinutes(mins(today)));
  put("focusTodayQuestions",today.reduce((a,x)=>a+(Number(x.questions)||0),0));
  put("focusTotalMinutes",formatMinutes(mins(logs)));
  put("focusLogCount",logs.length);
  const list=document.getElementById("focusList"); if(!list)return;
  if(!daily.length){list.innerHTML='<div class="todo-empty">No focus logs for this date.</div>';return;}
  list.innerHTML=daily.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(x=>`
    <div class="todo-item focus-item">
      <div class="todo-item-main">
        <div class="todo-item-title">${escapeFeatureText(x.subject)} · ${escapeFeatureText(x.activity)} · ${formatMinutes(x.minutes)}</div>
        <div class="todo-item-meta"><span class="todo-tag">${x.questions||0} questions</span><span>${escapeFeatureText(x.note||"")}</span></div>
      </div>
      <button class="todo-delete" data-focus-delete="${x.id}">✖</button>
    </div>`).join("");
  list.querySelectorAll("[data-focus-delete]").forEach(btn=>btn.addEventListener("click",()=>{
    saveFocusLogs(getFocusLogs().filter(x=>String(x.id)!==String(btn.dataset.focusDelete)));renderFocus();
  }));
}
function downloadFocusPDF(){
  const jsPDFLib=window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if(!jsPDFLib){alert("PDF library missing.");return;}
  const date=document.getElementById("focusFilterDate")?.value || localISODate();
  const logs=getFocusLogs().filter(x=>x.date===date);
  if(!logs.length){alert("Is date ke liye koi focus log nahi hai.");return;}
  const total=logs.reduce((a,x)=>a+x.minutes,0), qs=logs.reduce((a,x)=>a+x.questions,0);
  const pdf=new jsPDFLib({orientation:"portrait",unit:"mm",format:"a4"});
  pdf.setFont("helvetica","bold");pdf.setFontSize(18);pdf.text("370R JEE Tracker — Focus Report",14,16);
  pdf.setFontSize(11);pdf.text(`${date}  •  Focus: ${formatMinutes(total)}  •  Questions: ${qs}`,14,24);
  const body=logs.map((x,i)=>[i+1,x.subject,x.activity,formatMinutes(x.minutes),x.questions,x.note||""]);
  if(pdf.autoTable)pdf.autoTable({startY:32,head:[["#","SUBJECT","ACTIVITY","TIME","Q","NOTE"]],body,theme:"grid",styles:{fontSize:8}});
  pdf.save(`370R-Focus-${date}.pdf`);
}
document.addEventListener("DOMContentLoaded",()=>{
  const f=document.getElementById("focusFilterDate"); if(f)f.value=localISODate();
  const md=document.getElementById("focusManualDate"); if(md)md.value=localISODate();
  document.getElementById("focusManualSaveBtn")?.addEventListener("click",saveManualFocusLog);
  document.querySelectorAll("[data-focus-min]").forEach(btn=>btn.addEventListener("click",()=>{
    const minutes=document.getElementById("focusManualMinutes");if(minutes)minutes.value=btn.dataset.focusMin;minutes?.focus();
  }));
  document.getElementById("focusPdfBtn")?.addEventListener("click",downloadFocusPDF);
  f?.addEventListener("change",renderFocus);
  renderFocus();
});