
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

const PYQ_KEY = "370R_JEE_PYQ_TRACKER_V1";
const PYQ_SUBJECTS = ["Physics","Chemistry","Mathematics","TEST"];
function pyqData(){
  try{
    const raw=localStorage.getItem(PYQ_KEY);
    const x=raw?JSON.parse(raw):{chapters:[]};
    return {version:1,chapters:(Array.isArray(x.chapters)?x.chapters:[]).map(c=>({
      id:String(c.id||("pyq_"+Date.now()+Math.random().toString(36).slice(2))),
      subject:PYQ_SUBJECTS.includes(c.subject)?c.subject:"Physics",
      name:String(c.name||"").trim(),
      total:Math.max(1,Math.min(1000,parseInt(c.total,10)||1)),
      done:Array.isArray(c.done)?c.done.map(Boolean):[],
      rev:Array.isArray(c.rev)?c.rev.map(Boolean):[]
    })).filter(c=>c.name)};
  }catch(e){return {version:1,chapters:[]};}
}
function savePYQData(d){localStorage.setItem(PYQ_KEY,JSON.stringify(d));}
function pyqBlocks(c){
  const count=Math.ceil(c.total/10);
  let html="";
  for(let i=0;i<count;i++){
    const start=i*10+1, end=Math.min((i+1)*10,c.total);
    html+=`<button type="button" class="pyq-block ${c.done[i]?"checked":""}" data-pyq-block="${escapeFeatureText(c.id)}" data-block-index="${i}" aria-label="Questions ${start}-${end}">
      <span class="pyq-square"></span><span class="pyq-range">${start}-${end}</span>
    </button>`;
  }
  return html;
}
function pyqRevision(c){
  return `<button type="button" class="pyq-rev-box ${c.rev[0]?"checked":""}" data-pyq-rev="${escapeFeatureText(c.id)}" data-rev-index="0" aria-label="Revision"></button>`;
}
function renderPYQ(){
  const list=document.getElementById("pyqList"); if(!list)return;
  const d=pyqData();
  if(!d.chapters.length){
    list.innerHTML='<div class="sy-empty">No PYQ chapters yet. Add your first chapter above.</div>'; return;
  }
  list.innerHTML=PYQ_SUBJECTS.map(subject=>{
    const rows=d.chapters.filter(c=>c.subject===subject);
    if(!rows.length)return "";
    return `<section class="pyq-subject">
      <div class="pyq-subject-head"><h3>${escapeFeatureText(subject)}</h3><span>${rows.length} chapter${rows.length>1?"s":""}</span></div>
      <div class="pyq-table-wrap">
        <table class="pyq-table">
          <thead><tr><th class="pyq-idx">INDEX</th><th class="pyq-name">CHAPTER NAME</th><th class="pyq-total">TOTAL</th><th>PYQ BLOCKS — 10 Q</th><th class="pyq-rev">REV</th><th class="pyq-action">ACTION</th></tr></thead>
          <tbody>${rows.map((c,i)=>`<tr>
            <td class="pyq-idx">${String(i+1).padStart(2,"0")}</td>
            <td class="pyq-name">${escapeFeatureText(c.name)}</td>
            <td class="pyq-total">${c.total}</td>
            <td class="pyq-progress"><div class="pyq-blocks">${pyqBlocks(c)}</div></td>
            <td class="pyq-rev"><div class="pyq-revisions">${pyqRevision(c)}</div></td>
            <td class="pyq-action"><button type="button" class="pyq-delete" data-pyq-delete="${escapeFeatureText(c.id)}">Delete</button></td>
          </tr>`).join("")}</tbody>
        </table>
      </div>
    </section>`;
  }).join("");
}
function addPYQChapter(){
  const subject=document.getElementById("pyqSubject")?.value;
  const name=document.getElementById("pyqChapterName")?.value.trim();
  const total=Number(document.getElementById("pyqTotalQuestions")?.value);
  if(!PYQ_SUBJECTS.includes(subject)||!name||!Number.isInteger(total)||total<1||total>1000){
    alert("Subject, Chapter Name aur Total PYQs (1–1000) sahi se bharo.");return;
  }
  const d=pyqData();
  d.chapters.push({id:"pyq_"+Date.now()+"_"+Math.random().toString(36).slice(2),subject,name,total,done:[],rev:[]});
  savePYQData(d);renderPYQ();
  document.getElementById("pyqChapterName").value="";
  document.getElementById("pyqTotalQuestions").value="";
  document.getElementById("pyqChapterName").focus();
}
function downloadPYQPDF(){
  const JsPDF=window.jspdf?.jsPDF||window.jsPDF;
  if(!JsPDF){alert("PDF library load nahi hui. Internet on karke page reload karo.");return;}
  const d=pyqData();
  if(!d.chapters.length){alert("Pehle PYQ chapters add karo.");return;}
  const pdf=new JsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
  const M=8, pageW=210, tableW=pageW-M*2;
  let first=true;
  PYQ_SUBJECTS.forEach(subject=>{
    const rows=d.chapters.filter(c=>c.subject===subject);
    if(!rows.length)return;
    // Split long subjects across A4 portrait pages.
    let chunks=[], chunk=[], used=0;
    rows.forEach(c=>{
      const lines=Math.ceil(Math.ceil(c.total/10)/7);
      const h=Math.max(12,lines*7+3);
      if(chunk.length && used+h>235){chunks.push(chunk);chunk=[];used=0;}
      chunk.push(c);used+=h;
    });
    if(chunk.length)chunks.push(chunk);

    chunks.forEach((pageRows,chunkIndex)=>{
      if(!first)pdf.addPage(); first=false;
      pdf.setTextColor(0,0,0);pdf.setFont("helvetica","bold");pdf.setFontSize(14);
      pdf.text("JEE PYQ QUESTIONS TRACKER",M,10);
      pdf.setFontSize(9);pdf.text(subject.toUpperCase(),M,16);
      pdf.setFont("helvetica","normal");pdf.setFontSize(6.5);
      pdf.text("1 small square = 10 PYQs  •  Tick by hand  •  REV = one revision tick",M,20);

      const headers=["INDEX","CHAPTER NAME","TOTAL PYQ","PYQ PROGRESS — 10 Q / SQUARE","REV","ACTION"];
      const body=pageRows.map((c,i)=>[String(chunkIndex*pageRows.length+i+1).padStart(2,"0"),c.name,String(c.total),"","",""]);
      pdf.autoTable({
        startY:24,margin:{left:M,right:M,top:6,bottom:7},tableWidth:tableW,
        head:[headers],body,theme:"grid",rowPageBreak:"avoid",
        styles:{font:"helvetica",fontSize:6.5,cellPadding:1.2,valign:"middle",halign:"center",lineWidth:.35,lineColor:[0,0,0],textColor:[0,0,0]},
        headStyles:{fontStyle:"bold",fontSize:5.8,fillColor:[255,255,255],textColor:[0,0,0],cellPadding:1.2},
        columnStyles:{0:{cellWidth:12},1:{cellWidth:48,halign:"left",fontSize:8.2,fontStyle:"bold"},2:{cellWidth:18},3:{cellWidth:94},4:{cellWidth:10},5:{cellWidth:12}},
        didParseCell:data=>{
          if(data.section==="body"&&data.column.index===3){
            const c=pageRows[data.row.index],lines=Math.ceil(Math.ceil(c.total/10)/7);
            data.cell.styles.minCellHeight=Math.max(11,lines*7+2);
          }
        },
        didDrawCell:data=>{
          if(data.section!=="body")return;
          const c=pageRows[data.row.index];
          if(data.column.index===3){
            const count=Math.ceil(c.total/10),perLine=7,box=3.4,gapX=11.8,gapY=6.4;
            for(let i=0;i<count;i++){
              const line=Math.floor(i/perLine),pos=i%perLine;
              const x=data.cell.x+2+pos*gapX,y=data.cell.y+1.3+line*gapY;
              pdf.setDrawColor(0,0,0);pdf.setLineWidth(.35);pdf.rect(x,y,box,box);
              if(c.done[i]){pdf.setFillColor(0,0,0);pdf.rect(x+.55,y+.55,box-1.1,box-1.1,"F");}
              pdf.setFont("helvetica","normal");pdf.setFontSize(3.6);pdf.setTextColor(0,0,0);
              const end=Math.min((i+1)*10,c.total);
              pdf.text(`${i*10+1}-${end}`,x+4.2,y+2.6);
            }
          }
          if(data.column.index===4){
            // Exactly ONE compact revision square, centered inside the REV cell.
            const box=4.2;
            const x=data.cell.x+(data.cell.width-box)/2;
            const y=data.cell.y+(data.cell.height-box)/2;
            pdf.setDrawColor(0,0,0);pdf.setLineWidth(.4);pdf.rect(x,y,box,box);
            if(c.rev[0]){pdf.setFillColor(0,0,0);pdf.rect(x+.6,y+.6,box-1.2,box-1.2,"F");}
          }
        }
      });
    });
  });
  pdf.save("JEE-PYQ-Questions-Tracker-A4-Portrait.pdf");
}
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("pyqAddBtn")?.addEventListener("click",addPYQChapter);
  document.getElementById("pyqChapterName")?.addEventListener("keydown",e=>{if(e.key==="Enter")addPYQChapter();});
  document.getElementById("pyqClearBtn")?.addEventListener("click",()=>{
    if(!pyqData().chapters.length)return;
    if(confirm("Clear the complete PYQ tracker?")){savePYQData({version:1,chapters:[]});renderPYQ();}
  });
  document.getElementById("pyqList")?.addEventListener("click",e=>{
    const block=e.target.closest("[data-pyq-block]");
    if(block){const d=pyqData(),c=d.chapters.find(x=>x.id===block.dataset.pyqBlock),i=Number(block.dataset.blockIndex);if(c){c.done[i]=!c.done[i];savePYQData(d);renderPYQ();}return;}
    const rev=e.target.closest("[data-pyq-rev]");
    if(rev){const d=pyqData(),c=d.chapters.find(x=>x.id===rev.dataset.pyqRev),i=Number(rev.dataset.revIndex);if(c){c.rev[i]=!c.rev[i];savePYQData(d);renderPYQ();}return;}
    const del=e.target.closest("[data-pyq-delete]");
    if(del){const d=pyqData(),c=d.chapters.find(x=>x.id===del.dataset.pyqDelete);if(c&&confirm(`Delete “${c.name}”?`)){d.chapters=d.chapters.filter(x=>x.id!==c.id);savePYQData(d);renderPYQ();}}
  });
  document.getElementById("pyqPdfBtn")?.addEventListener("click",downloadPYQPDF);
  renderPYQ();
});