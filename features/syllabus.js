
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

const SYLLABUS_KEY = "370R_JEE_SYLLABUS_V3";
const SYLLABUS_SUBJECTS = ["Physics","Chemistry","Mathematics"];
const SYLLABUS_TASKS = ["jm","adv","mbbs","opp","hw","module","pyq","advProb","r1","r2","r3"];
const SYLLABUS_TASK_LABELS = {jm:"MAINS LEVEL",adv:"ADV LEVEL",mbbs:"SHORT NOTES",opp:"DPP",hw:"HW",module:"MODULE",pyq:"PYQ",advProb:"TEST",r1:"R1",r2:"R2",r3:"R3"};
function syllabusData(){
  try{
    const raw = localStorage.getItem(SYLLABUS_KEY) || localStorage.getItem("370R_JEE_SYLLABUS_V2") || localStorage.getItem("370R_JEE_SYLLABUS_V1");
    const x = raw ? JSON.parse(raw) : {chapters:[]};
    const chapters = Array.isArray(x.chapters) ? x.chapters : [];
    return {version:3, chapters:chapters.map(c=>({
      id:String(c.id || ("ch_"+Date.now()+Math.random().toString(36).slice(2))),
      subject:SYLLABUS_SUBJECTS.includes(c.subject) ? c.subject : "Physics",
      name:String(c.name||"").trim(),
      total:Math.max(1,Math.min(100,parseInt(c.total,10)||1))
    })).filter(c=>c.name)};
  }catch(e){ return {version:3,chapters:[]}; }
}
function saveSyllabusData(d){ localStorage.setItem(SYLLABUS_KEY, JSON.stringify(d)); }
function renderSyllabus(){
  const list=document.getElementById("syllabusList"); if(!list)return;
  const d=syllabusData();
  if(!d.chapters.length){ list.innerHTML='<div class="sy-empty">No chapters yet. Add your first chapter above.</div>'; return; }
  const esc=s=>escapeFeatureText(s);
  list.innerHTML=SYLLABUS_SUBJECTS.map(subject=>{
    const rows=d.chapters.filter(c=>c.subject===subject); if(!rows.length)return "";
    return `<section class="sy-subject"><div class="sy-subject-head"><h3>${esc(subject)}</h3><span>${rows.length} chapter${rows.length>1?'s':''}</span></div><div class="sy-simple-table-wrap"><table class="sy-simple-table"><thead><tr><th>#</th><th>Chapter Name</th><th>Total Lectures</th><th>Action</th></tr></thead><tbody>${rows.map((c,i)=>`<tr><td>${i+1}</td><td>${esc(c.name)}</td><td>${c.total}</td><td><button class="sy-delete" data-sy-delete="${esc(c.id)}" type="button">Delete</button></td></tr>`).join("")}</tbody></table></div></section>`;
  }).join("");
}
function addSyllabusChapter(){
  const subject=document.getElementById("syllabusSubject")?.value;
  const name=document.getElementById("syllabusChapterName")?.value.trim();
  const total=Number(document.getElementById("syllabusTotalLectures")?.value);
  if(!SYLLABUS_SUBJECTS.includes(subject) || !name || !Number.isInteger(total) || total<1 || total>100){
    alert("Subject, Chapter Name aur Total Lectures (1–100) sahi se bharo."); return;
  }
  const d=syllabusData();
  d.chapters.push({id:"ch_"+Date.now()+"_"+Math.random().toString(36).slice(2),subject,name,total});
  saveSyllabusData(d); renderSyllabus();
  document.getElementById("syllabusChapterName").value="";
  document.getElementById("syllabusTotalLectures").value="";
  document.getElementById("syllabusChapterName").focus();
}
function pdfBox(pdf,x,y,size=3.4){ pdf.setDrawColor(0,0,0); pdf.setLineWidth(0.45); pdf.rect(x,y,size,size); }
function downloadSyllabusPDF(){
  const JsPDF=window.jspdf?.jsPDF || window.jsPDF;
  if(!JsPDF){alert("PDF library load nahi hui. Internet on karke page reload karo.");return;}
  const d=syllabusData();
  if(!d.chapters.length){alert("Pehle chapters add karo.");return;}

  // Large syllabuses used to make one very heavy autoTable call. On phones
  // that could stall jsPDF before the browser got a chance to download it.
  // Build the PDF in small page-sized chunks instead.
  const pdf=new JsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
  const M=7, pageW=210, pageH=297, usable=pageW-M*2;
  const headers=["#","Chapter Name","Lecture Tracker","Total Lec","Lec Comp",...SYLLABUS_TASKS.map(k=>SYLLABUS_TASK_LABELS[k])];
  // Portrait A4 has only 196 mm of usable width. Keep every column inside
  // that boundary so the final columns (especially HW) never run off the page.
  const widths=[5,38,45,9,7,...SYLLABUS_TASKS.map(()=>8)];

  let firstPage=true;

  function drawPage(subject, chapters, startIndex){
    if(!firstPage) pdf.addPage();
    firstPage=false;

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(15);
    pdf.setTextColor(0,0,0);
    pdf.text("JEE SYLLABUS TRACKER",M,9);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(6.5);
    pdf.text("Offline Printable • Tick everything by hand",M,13);

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(10.5);
    pdf.text(subject.toUpperCase(),M,19);

    const rows=chapters.map((c,i)=>[
      String(startIndex+i+1), c.name, "", String(c.total), "",
      ...SYLLABUS_TASKS.map(()=> "")
    ]);

    pdf.autoTable({
      startY:22,
      margin:{left:M,right:M,top:6,bottom:7},
      tableWidth:usable,
      head:[headers],
      body:rows,
      theme:"grid",
      rowPageBreak:"avoid",
      styles:{
        font:"helvetica",fontSize:6.4,cellPadding:1.2,overflow:"linebreak",
        valign:"middle",halign:"center",lineWidth:0.45,
        lineColor:[0,0,0],textColor:[0,0,0]
      },
      headStyles:{
        fontStyle:"bold",fontSize:6.2,halign:"center",valign:"middle",
        fillColor:[255,255,255],textColor:[0,0,0],cellPadding:1.2
      },
      columnStyles:Object.fromEntries(
        widths.map((w,i)=>[
          i,{cellWidth:w,halign:i===1?"left":"center",
          fontSize:i===1?7.8:(i===3?6.8:5.1),fontStyle:i===1||i===3?"bold":"normal"}
        ])
      ),
      didParseCell:data=>{
        if(data.section==="body" && data.column.index===2){
          const total=chapters[data.row.index].total;
          const lines=Math.ceil(total/4);
          data.cell.styles.minCellHeight=Math.max(8,lines*6.0+1.5);
        }
      },
      didDrawCell:data=>{
        if(data.section!=="body")return;

        if(data.column.index===2){
          const total=chapters[data.row.index].total;
          const perLine=4, box=3.2, step=12.5, lineH=6.0;

          for(let n=0;n<total;n++){
            const line=Math.floor(n/perLine), pos=n%perLine;
            const x=data.cell.x+1.2+pos*step;
            const y=data.cell.y+1.0+line*lineH;
            if(y+box>data.cell.y+data.cell.height-0.3)continue;

            pdfBox(pdf,x,y,box);
            pdf.setFont("helvetica","normal");
            pdf.setFontSize(4.0);
            pdf.setTextColor(0,0,0);
            pdf.text(String(n+1),x+4.0,y+2.4);
          }
        }

        if(data.column.index>=5){
          const box=3.0;
          pdfBox(
            pdf,
            data.cell.x+(data.cell.width-box)/2,
            data.cell.y+(data.cell.height-box)/2,
            box
          );
        }
      }
    });
  }

  try{
    // Keep each autoTable call comfortably within one A4 page's worth of rows.
    // A chapter with up to 100 lectures still fits as a single row.
    const MAX_BODY_HEIGHT=255;

    for(const subject of SYLLABUS_SUBJECTS){
      const chapters=d.chapters.filter(c=>c.subject===subject);
      if(!chapters.length) continue;

      let chunk=[];
      let used=0;
      let startIndex=0;

      chapters.forEach((chapter,index)=>{
        const h=Math.max(8,Math.ceil(chapter.total/4)*6.0+1.5);

        // Flush before adding another large row.
        if(chunk.length && used+h>MAX_BODY_HEIGHT){
          drawPage(subject,chunk,startIndex);
          startIndex=index;
          chunk=[];
          used=0;
        }

        chunk.push(chapter);
        used+=h;

        if(index===chapters.length-1 && chunk.length){
          drawPage(subject,chunk,startIndex);
        }
      });
    }

    pdf.save("JEE-Syllabus-Tracker-A4-Portrait.pdf");
  }catch(e){
    console.error("Syllabus PDF generation failed:",e);
    alert("PDF generate nahi ho paaya. Data safe hai — chapters/lectures delete nahi hue. Page reload karke dobara try karo.");
  }
}
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("syllabusAddBtn")?.addEventListener("click",addSyllabusChapter);
  document.getElementById("syllabusChapterName")?.addEventListener("keydown",e=>{if(e.key==="Enter")addSyllabusChapter();});
  document.getElementById("syllabusList")?.addEventListener("click",e=>{
    const b=e.target.closest("[data-sy-delete]"); if(!b)return;
    const id=b.dataset.syDelete,d=syllabusData(),c=d.chapters.find(x=>x.id===id);if(!c)return;
    if(confirm(`Delete “${c.name}”?`)){d.chapters=d.chapters.filter(x=>x.id!==id);saveSyllabusData(d);renderSyllabus();}
  });
  document.getElementById("syllabusClearBtn")?.addEventListener("click",()=>{
    if(!syllabusData().chapters.length)return;
    if(confirm("Clear the complete syllabus?")){saveSyllabusData({version:3,chapters:[]});renderSyllabus();}
  });
  document.getElementById("syllabusPdfBtn")?.addEventListener("click",downloadSyllabusPDF);
  renderSyllabus();
});