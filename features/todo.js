
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

const TODO_KEY = "jee370rDailyTodoV1";
function getTodos() { return safeJSON(TODO_KEY, []); }
function saveTodos(data) { localStorage.setItem(TODO_KEY, JSON.stringify(data)); }
function todoStats(date) {
  const all = getTodos();
  const daily = date ? all.filter(t => t.date === date) : all;
  const total = daily.length;
  const completed = daily.filter(t => t.completed).length;
  return {all,daily,total,completed,pending:total-completed,rate:total ? Math.round(completed/total*100) : 0};
}
function renderTodoList() {
  const filter = document.getElementById("todoFilterDate");
  const list = document.getElementById("todoList");
  if (!filter || !list) return;
  const date = filter.value || localISODate();
  const s = todoStats(date);
  put("todoTotal",s.total); put("todoCompleted",s.completed);
  put("todoPending",s.pending); put("todoRate",s.rate+"%");
  if (!s.daily.length) {
    list.innerHTML = '<div class="todo-empty">No tasks for this date. Add your first task ✨</div>';
    return;
  }
  list.innerHTML = s.daily.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)).map(t => `
    <div class="todo-item ${t.completed ? "done" : ""}">
      <input class="todo-check" type="checkbox" ${t.completed?"checked":""} data-todo-check="${t.id}">
      <div class="todo-item-main">
        <div class="todo-item-title">${escapeFeatureText(t.task)}</div>
        <div class="todo-item-meta"><span class="todo-tag">${escapeFeatureText(t.category)}</span><span>${t.date}</span></div>
      </div>
      <button class="todo-delete" data-todo-delete="${t.id}">🗑️</button>
    </div>`).join("");

  list.querySelectorAll("[data-todo-check]").forEach(box => box.addEventListener("change", () => {
    const todos=getTodos(), item=todos.find(t=>String(t.id)===String(box.dataset.todoCheck));
    if(item){item.completed=box.checked;saveTodos(todos);renderTodoList();}
  }));
  list.querySelectorAll("[data-todo-delete]").forEach(btn => btn.addEventListener("click", () => {
    saveTodos(getTodos().filter(t=>String(t.id)!==String(btn.dataset.todoDelete)));
    renderTodoList();
  }));
}
function addTodo() {
  const date=document.getElementById("todoDate")?.value || localISODate();
  const task=document.getElementById("todoTask")?.value.trim() || "";
  const category=document.getElementById("todoCategory")?.value || "Other";
  if(!task){alert("Task likho pehle.");return;}
  const todos=getTodos();
  todos.push({id:Date.now()+Math.random(),date,task,category,completed:false,createdAt:Date.now()});
  saveTodos(todos);
  document.getElementById("todoFilterDate").value=date;
  document.getElementById("todoTask").value="";
  renderTodoList();
}
function downloadTodoPDF() {
  const jsPDFLib=window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if(!jsPDFLib){alert("PDF library missing.");return;}
  const date=document.getElementById("todoFilterDate")?.value || localISODate();
  const s=todoStats(date);
  if(!s.daily.length){alert("Is date ke liye koi TODO task nahi hai.");return;}
  const pdf=new jsPDFLib({orientation:"portrait",unit:"mm",format:"a4"});
  pdf.setFont("helvetica","bold");pdf.setFontSize(18);
  pdf.text("370R JEE Tracker — Daily TODO",14,16);
  pdf.setFontSize(11);pdf.text(date,14,23);
  pdf.setFontSize(10);pdf.text(`Total: ${s.total}   Completed: ${s.completed}   Pending: ${s.pending}   Completion: ${s.rate}%`,14,31);
  let y=38;
  const body=s.daily.map((t,i)=>[i+1,t.completed?"DONE":"PENDING",t.category,t.task]);
  if(pdf.autoTable) pdf.autoTable({startY:y,head:[["#","STATUS","CATEGORY","TASK"]],body,theme:"grid",styles:{fontSize:8}});
  pdf.save(`370R-Daily-TODO-${date}.pdf`);
}
document.addEventListener("DOMContentLoaded",()=>{
  const today=localISODate(),d=document.getElementById("todoDate"),f=document.getElementById("todoFilterDate");
  if(d)d.value=today;if(f)f.value=today;
  document.getElementById("addTodoBtn")?.addEventListener("click",addTodo);
  document.getElementById("todoTask")?.addEventListener("keydown",e=>{if(e.key==="Enter")addTodo();});
  f?.addEventListener("change",renderTodoList);
  document.getElementById("todayTodoBtn")?.addEventListener("click",()=>{if(d)d.value=today;if(f)f.value=today;renderTodoList();});
  document.getElementById("todoPdfBtn")?.addEventListener("click",downloadTodoPDF);
  renderTodoList();
});