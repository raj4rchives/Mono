
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

const TEST_KEY = "370R_JEE_TEST_TRACKER_V1";
function testData(){
  try{
    const raw=localStorage.getItem(TEST_KEY);
    const x=raw?JSON.parse(raw):{tests:[]};
    return {version:1,tests:(Array.isArray(x.tests)?x.tests:[]).map(t=>({
      id:String(t.id||("test_"+Date.now()+Math.random().toString(36).slice(2))),
      name:String(t.name||"").trim(),
      syllabus:String(t.syllabus||"").trim(),
      total:Math.max(1,Math.min(2000,parseInt(t.total,10)||1)),
      done:Array.isArray(t.done)?t.done.map(Boolean):[],
      rev:Array.isArray(t.rev)?t.rev.map(Boolean):[]
    })).filter(t=>t.name)};
  }catch(e){return {version:1,tests:[]};}
}
function saveTestData(d){localStorage.setItem(TEST_KEY,JSON.stringify(d));}
function testBlocks(t){
  const count=Math.ceil(t.total/10);
  let html="";
  for(let i=0;i<count;i++){
    const start=i*10+1,end=Math.min((i+1)*10,t.total);
    html+=`<button type="button" class="pyq-block test-block ${t.done[i]?"checked":""}" data-test-block="${escapeFeatureText(t.id)}" data-block-index="${i}" aria-label="Questions ${start}-${end}">
      <span class="pyq-square"></span><span class="pyq-range">${start}-${end}</span>
    </button>`;
  }
  return html;
}
function testRevision(t){
  return `<button type="button" class="pyq-rev-box ${t.rev[0]?"checked":""}" data-test-rev="${escapeFeatureText(t.id)}" aria-label="Revision"></button>`;
}
function renderTests(){
  const list=document.getElementById("testsList");if(!list)return;
  const d=testData();
  if(!d.tests.length){list.innerHTML='<div class="sy-empty">No tests added yet. Add your first test above.</div>';return;}
  list.innerHTML=`<div class="tests-table-wrap"><table class="tests-table">
    <thead><tr><th class="test-index">INDEX</th><th class="test-name-col">TEST NAME</th><th class="test-syllabus-col">TEST SYLLABUS</th><th class="test-total">TOTAL PYQ</th><th>PYQ PROGRESS — 10 Q</th><th class="test-rev">REV</th><th class="test-action">ACTION</th></tr></thead>
    <tbody>${d.tests.map((t,i)=>`<tr>
      <td class="test-index">${String(i+1).padStart(2,"0")}</td>
      <td class="test-name-col">${escapeFeatureText(t.name)}</td>
      <td class="test-syllabus-col">${escapeFeatureText(t.syllabus||"—")}</td>
      <td class="test-total">${t.total}</td>
      <td class="pyq-progress"><div class="pyq-blocks">${testBlocks(t)}</div></td>
      <td class="test-rev"><div class="pyq-revisions">${testRevision(t)}</div></td>
      <td class="test-action"><button type="button" class="pyq-delete" data-test-delete="${escapeFeatureText(t.id)}">Delete</button></td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}
function addTest(){
  const name=document.getElementById("testName")?.value.trim();
  const syllabus=document.getElementById("testSyllabus")?.value.trim();
  const total=Number(document.getElementById("testTotalQuestions")?.value);
  if(!name||!Number.isInteger(total)||total<1||total>2000){alert("Test Name aur Total PYQs (1–2000) sahi se bharo.");return;}
  const d=testData();
  d.tests.push({id:"test_"+Date.now()+"_"+Math.random().toString(36).slice(2),name,syllabus,total,done:[],rev:[]});
  saveTestData(d);renderTests();
  document.getElementById("testName").value="";
  document.getElementById("testSyllabus").value="";
  document.getElementById("testTotalQuestions").value="";
  document.getElementById("testName").focus();
}
function downloadTestsPDF(){
  const JsPDF=window.jspdf?.jsPDF||window.jsPDF;
  if(!JsPDF){alert("PDF library load nahi hui. Internet on karke page reload karo.");return;}
  const d=testData();
  if(!d.tests.length){alert("Pehle test add karo.");return;}

  // Wide A4 layout to keep Test Name + Syllabus + PYQ progress readable,
  // matching the user's sample tracker-sheet style.
  const pdf=new JsPDF({orientation:"landscape",unit:"mm",format:"a4",compress:true});
  const M=9, pageW=297, pageH=210, tableW=pageW-M*2;

  pdf.setTextColor(0,0,0);
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(17);
  pdf.text("JEE TEST QUESTIONS TRACKER",M,12);
  pdf.setFont("helvetica","normal");
  pdf.setFontSize(8);
  pdf.text("1 small square = 10 PYQs  •  Last square shows the actual question number  •  REV = one revision tick",M,18);

  const headers=["INDEX","TEST NAME","TEST SYLLABUS","TOTAL PYQ","PYQ PROGRESS — 10 Q / SQUARE","REV","ACTION"];
  const body=d.tests.map((t,i)=>[
    String(i+1).padStart(2,"0"),
    t.name,
    t.syllabus||"—",
    String(t.total),
    "",
    "",
    ""
  ]);

  pdf.autoTable({
    startY:23,
    margin:{left:M,right:M,top:7,bottom:8},
    tableWidth:tableW,
    head:[headers],
    body,
    theme:"grid",
    rowPageBreak:"avoid",
    styles:{font:"helvetica",fontSize:7,cellPadding:1.6,valign:"middle",halign:"center",lineWidth:.35,lineColor:[0,0,0],textColor:[0,0,0]},
    headStyles:{fontStyle:"bold",fontSize:6.2,fillColor:[255,255,255],textColor:[0,0,0],cellPadding:1.6},
    columnStyles:{
      0:{cellWidth:14},
      1:{cellWidth:45,halign:"left",fontSize:8.5,fontStyle:"bold"},
      2:{cellWidth:78,halign:"left",fontSize:7.5},
      3:{cellWidth:20},
      4:{cellWidth:112},
      5:{cellWidth:13},
      6:{cellWidth:15}
    },
    didParseCell:data=>{
      if(data.section!=="body")return;
      const t=d.tests[data.row.index];
      const blockLines=Math.ceil(Math.ceil(t.total/10)/8);
      const syllabusLines=Math.max(1,Math.ceil((t.syllabus||"—").length/34));
      data.cell.styles.minCellHeight=Math.max(14,blockLines*7+3,syllabusLines*4.2+5);
    },
    didDrawCell:data=>{
      if(data.section!=="body")return;
      const t=d.tests[data.row.index];

      // 10 questions = 1 compact tick square.
      if(data.column.index===4){
        const count=Math.ceil(t.total/10), perLine=8;
        const box=4.0, gapX=13.2, gapY=7.0;
        for(let i=0;i<count;i++){
          const line=Math.floor(i/perLine),pos=i%perLine;
          const x=data.cell.x+2+pos*gapX;
          const y=data.cell.y+1.5+line*gapY;
          pdf.setDrawColor(0,0,0);pdf.setLineWidth(.35);pdf.rect(x,y,box,box);
          if(t.done[i]){
            pdf.setFillColor(0,0,0);
            pdf.rect(x+.55,y+.55,box-1.1,box-1.1,"F");
          }
          pdf.setFont("helvetica","normal");pdf.setFontSize(3.8);pdf.setTextColor(0,0,0);
          const end=Math.min((i+1)*10,t.total);
          pdf.text(`${i*10+1}-${end}`,x+4.8,y+2.7);
        }
      }

      // Exactly one REV square.
      if(data.column.index===5){
        const box=5;
        const x=data.cell.x+(data.cell.width-box)/2;
        const y=data.cell.y+(data.cell.height-box)/2;
        pdf.setDrawColor(0,0,0);pdf.setLineWidth(.4);pdf.rect(x,y,box,box);
        if(t.rev[0]){
          pdf.setFillColor(0,0,0);
          pdf.rect(x+.65,y+.65,box-1.3,box-1.3,"F");
        }
      }
    }
  });

  pdf.save("JEE-Test-Questions-Tracker-A4.pdf");
}
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("testAddBtn")?.addEventListener("click",addTest);
  document.getElementById("testName")?.addEventListener("keydown",e=>{if(e.key==="Enter")addTest();});
  document.getElementById("testsClearBtn")?.addEventListener("click",()=>{
    if(!testData().tests.length)return;
    if(confirm("Clear all tests?")){saveTestData({version:1,tests:[]});renderTests();}
  });
  document.getElementById("testsPdfBtn")?.addEventListener("click",downloadTestsPDF);
  document.getElementById("testsList")?.addEventListener("click",e=>{
    const block=e.target.closest("[data-test-block]");
    if(block){const d=testData(),t=d.tests.find(x=>x.id===block.dataset.testBlock),i=Number(block.dataset.blockIndex);if(t){t.done[i]=!t.done[i];saveTestData(d);renderTests();}return;}
    const rev=e.target.closest("[data-test-rev]");
    if(rev){const d=testData(),t=d.tests.find(x=>x.id===rev.dataset.testRev);if(t){t.rev[0]=!t.rev[0];saveTestData(d);renderTests();}return;}
    const del=e.target.closest("[data-test-delete]");
    if(del){const d=testData(),t=d.tests.find(x=>x.id===del.dataset.testDelete);if(t&&confirm(`Delete “${t.name}”?`)){d.tests=d.tests.filter(x=>x.id!==t.id);saveTestData(d);renderTests();}}
  });
  renderTests();
});