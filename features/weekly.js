
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


const CORE_TRACKER_KEY="jee370rTrackerV3";
function num(v){const m=String(v||"").match(/\d+/);return m?Number(m[0]):0;}
function readTrackerRows(){
  try{
    const x=JSON.parse(localStorage.getItem(CORE_TRACKER_KEY)||"null");
    return Array.isArray(x?.rows)?x.rows:[];
  }catch(e){return [];}
}
function getTodos(){return safeJSON("jee370rDailyTodoV1",[]);}
function getFocusLogs(){return safeJSON("jee370rFocusLogsV1",[]);}
function formatMinutes(min){min=Math.round(min);return min>=60?`${Math.floor(min/60)}h ${min%60}m`:`${min}m`;}
function weekDates(end){
  const d=new Date(end+"T00:00:00");if(Number.isNaN(d.getTime()))return [];
  const out=[];for(let i=6;i>=0;i--){const x=new Date(d);x.setDate(d.getDate()-i);out.push(localISODate(x));}return out;
}
function drawWeeklyChart(id,labels,values,suffix=""){
  const box=document.getElementById(id);if(!box)return;
  const max=Math.max(1,...values.map(v=>Number(v)||0));
  box.innerHTML=values.map((value,i)=>{const v=Number(value)||0,pct=Math.max(0,Math.min(100,(v/max)*100));
    return `<div class="weekly-bar-col"><div class="weekly-bar-value">${escapeFeatureText(String(v)+suffix)}</div><div class="weekly-bar-track"><div class="weekly-bar-fill" style="height:${pct}%"></div></div><div class="weekly-bar-label">${escapeFeatureText(labels[i])}</div></div>`;
  }).join("");
}
function renderWeeklyReport(){
  const input=document.getElementById("weeklyEndDate");if(!input)return;
  const end=input.value||localISODate(),dates=weekDates(end),rows=readTrackerRows(),logs=getFocusLogs(),todos=getTodos();
  const questions=dates.map(date=>rows.filter(r=>r.date===date).reduce((sum,r)=>sum+num(r.phyWork)+num(r.chemWork)+num(r.mathWork)+num(r.phyDpp)+num(r.chemDpp)+num(r.mathDpp)+num(r.phyPyq)+num(r.chemPyq)+num(r.mathPyq),0));
  const lectures=dates.map(date=>rows.filter(r=>r.date===date).reduce((sum,r)=>sum+num(r.lec),0));
  const focus=dates.map(date=>logs.filter(x=>x.date===date).reduce((sum,x)=>sum+(Number(x.minutes)||0),0));
  const weekTodos=todos.filter(x=>dates.includes(x.date)),done=weekTodos.filter(x=>x.completed).length;
  put("weeklyQuestions",questions.reduce((a,b)=>a+b,0));put("weeklyLectures",lectures.reduce((a,b)=>a+b,0));put("weeklyFocus",formatMinutes(focus.reduce((a,b)=>a+b,0)));put("weeklyTasks",(weekTodos.length?Math.round(done/weekTodos.length*100):0)+"%");
  const labels=dates.map(d=>new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short"}));
  drawWeeklyChart("weeklyQuestionsChart",labels,questions);
  drawWeeklyChart("weeklyLecturesChart",labels,lectures);
  drawWeeklyChart("weeklyFocusChart",labels,focus,"m");
}
document.addEventListener("DOMContentLoaded",()=>{
  const d=document.getElementById("weeklyEndDate");if(d)d.value=localISODate();
  document.getElementById("weeklyThisWeekBtn")?.addEventListener("click",()=>{if(d)d.value=localISODate();renderWeeklyReport();});
  d?.addEventListener("change",renderWeeklyReport);renderWeeklyReport();
});
