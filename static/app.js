
/* ================= DATA ================= */
let subjectFiles = JSON.parse(document.getElementById("subjects-data").textContent || "{}");

/* ================= STATE ================= */
let questions=[], original=[];
let selected=[], visited=[];
let current=0, score=0, attempted=0;

let reviewMode=false, filteredIndexes=[];

/* ================= SUBJECT ================= */
function updateScore(){
  let acc = attempted ? (score/attempted*100).toFixed(1) : 0;

  document.getElementById("score").innerText =
    `Score: ${score}/${attempted} | Accuracy: ${acc}%`;
}

function loadFiles(){
  let s=document.getElementById("subjectSelect").value;
  let f=document.getElementById("fileSelect");

  f.innerHTML='<option value="">Select Test</option>';

  if(!subjectFiles[s]) return;

  subjectFiles[s].forEach(x=>{
    let name=x.replace(".json","").replace(/_/g," ");
    name=name.charAt(0).toUpperCase()+name.slice(1);

    let o=document.createElement("option");
    o.value=x;
    o.innerText=name;
    f.appendChild(o);
  });
}

/* ================= DARK MODE FIX ================= */
window.onload = function(){

  // DARK MODE
  if(localStorage.getItem("theme")==="dark"){
    document.body.classList.add("dark");
  }

  // ✅ OPEN SIDEBAR BY DEFAULT ON MOBILE
  if (window.innerWidth <= 768) {
    document.getElementById("left").classList.add("active");
  }
};

function toggleDarkMode(){
  document.body.classList.toggle("dark");

  if(document.body.classList.contains("dark")){
    localStorage.setItem("theme","dark");
  } else {
    localStorage.setItem("theme","light");
  }
}

/* ================= START ================= */
function start(){
  let s=document.getElementById("subjectSelect").value;
  let f=document.getElementById("fileSelect").value;

  if(!s || !f){
    alert("Select subject and test");
    return;
  }

  fetch(`/get_questions?subject=${s}&file=${f}`)
  .then(r=>r.json())
  .then(data=>{
    questions=data;
    original=JSON.parse(JSON.stringify(data));

    selected=Array(data.length).fill(null);
    visited=Array(data.length).fill(false);

    current=0; score=0; attempted=0;
    reviewMode=false;

    document.getElementById("filterBox").style.display="none";
    document.getElementById("submitBtn").innerText="Submit Test";

    render();
  });
}

/* ================= RENDER ================= */
function render(){
  let idx = reviewMode ? filteredIndexes[current] : current;
  let q = questions[idx];

  visited[idx]=true;

  document.getElementById("questionBox").innerHTML =
    `<div class="question">Q${idx+1}. ${q.question}</div>`;

  let html="";
  q.options.forEach((opt,i)=>{
    let cls="option";

    if(selected[idx]!=null){
      if(i===q.correct) cls+=" correct";
      else if(i===selected[idx]) cls+=" wrong";
    }

    html+=`<div class="${cls}" onclick="answer(${i})">${opt}</div>`;
  });

  document.getElementById("optionsBox").innerHTML=html;

  document.getElementById("explanation").innerText =
    (reviewMode || selected[idx]!=null)
    ? "Explanation: "+q.explanation
    : "";

  updatePalette();
}

/* ================= ANSWER ================= */
function answer(i){

  if(reviewMode) return;

  if(selected[current] != null) return;

  selected[current] = i;
  attempted++;

  let correct = questions[current].correct;
  let opts = document.getElementsByClassName("option");

  for(let j = 0; j < opts.length; j++){
    if(j === correct){
      opts[j].classList.add("correct");
    }
    else if(j === i){
      opts[j].classList.add("wrong");
    }
  }

  if(i === correct) score++;

  document.getElementById("explanation").innerText =
    "Explanation: " + questions[current].explanation;

  // 🔥 IMPORTANT (you were missing this)
  updateScore();
  updatePalette();
}

/* ================= NAV ================= */
function next(){
  if(reviewMode){
    if(current<filteredIndexes.length-1) current++;
  } else {
    if(current<questions.length-1) current++;
  }
  render();
}

function prev(){
  if(current>0) current--;
  render();
}

/* ================= COPY FIX ================= */
function copyQ(){
  let idx = reviewMode ? filteredIndexes[current] : current;
  let q=questions[idx];

  let text=q.question+"\n\n";
  q.options.forEach((o,i)=>{
    text+=String.fromCharCode(65+i)+". "+o+"\n";
  });

  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text)
      .then(()=>alert("Copied!"))
      .catch(()=>fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text){
  let t=document.createElement("textarea");
  t.value=text;
  document.body.appendChild(t);
  t.select();
  document.execCommand("copy");
  document.body.removeChild(t);
}

function tryCopy(text){
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(()=>fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

/* ================= AI FIX ================= */
document.getElementById("aiSelect").addEventListener("change", function () {

  let mode = this.value;
  if (!mode) return;

  let idx = reviewMode ? filteredIndexes[current] : current;
  let q = questions[idx];

  let text = q.question + "\n\nOptions:\n";
  q.options.forEach((o, i) => {
    text += String.fromCharCode(65 + i) + ". " + o + "\n";
  });

  let encoded = encodeURIComponent(text);

  // 🔥 Safari-safe (NO async/await)
  if (mode === "google") {
    window.open("https://www.google.com/search?q=" + encoded, "_blank");
  }

  else if (mode === "chatgpt") {
    tryCopy(text);
    window.open("https://chat.openai.com/?q=" + encoded, "_blank");
  }

  else if (mode === "gemini") {
    tryCopy(text);
    window.open("https://gemini.google.com/app", "_blank");
  }

  this.value = "";
});

/* ================= SHUFFLE FIX ================= */
function shuffle(){

  let combined = questions.map((q,i)=>({
    q:q,
    sel:selected[i],
    vis:visited[i]
  }));

  combined.sort(()=>Math.random()-0.5);

  questions = combined.map(x=>x.q);
  selected = combined.map(x=>x.sel);
  visited = combined.map(x=>x.vis);

  current=0;
  render();
}

/* ================= RESET ================= */
function newTest(){
  questions=JSON.parse(JSON.stringify(original));
  selected.fill(null);
  visited.fill(false);
  current=0;
  render();
}

/* ================= FULLSCREEN ================= */
function toggleFullscreen(){

  let doc = document;
  let docEl = document.documentElement;

  if (
    !doc.fullscreenElement &&
    !doc.webkitFullscreenElement
  ) {
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen();
    } 
    else if (docEl.webkitRequestFullscreen) { // Safari
      docEl.webkitRequestFullscreen();
    }
  } 
  else {
    if (doc.exitFullscreen) {
      doc.exitFullscreen();
    } 
    else if (doc.webkitExitFullscreen) { // Safari
      doc.webkitExitFullscreen();
    }
  }
}

/* ================= SUBMIT ================= */
function submitQuiz(){

  reviewMode=true;

  document.getElementById("filterBox").style.display="block";

  document.getElementById("submitBtn").innerText="Exit Test";
  document.getElementById("submitBtn").onclick=()=>location.reload();

  updateScore();   // 🔥 IMPORTANT

  applyFilter("all");
}
/* ================= FILTER ================= */
function applyFilter(type){
  filteredIndexes=[];

  questions.forEach((q,i)=>{
    let status="skipped";

    if(selected[i]!=null){
      status=selected[i]==q.correct?"correct":"wrong";
    }

    if(type==="all" || type===status){
      filteredIndexes.push(i);
    }
  });

  current=0;
  render();
}

/* ================= PALETTE ================= */
function updatePalette(){
  let p=document.getElementById("palette");
  p.innerHTML="";

  let list = reviewMode ? filteredIndexes : [...questions.keys()];

  list.forEach((i,idx)=>{
    let b=document.createElement("button");
    b.innerText=i+1;
    b.className="pbtn";

    if(selected[i]!=null){
      if(selected[i]==questions[i].correct) b.classList.add("green");
      else b.classList.add("red");
    } else if(visited[i]) b.classList.add("blue");
    else b.classList.add("gray");

    b.onclick=()=>{ current=idx; render(); };
    p.appendChild(b);
  });
}

/* ================= MOBILE MENU ================= */
/* ================= MOBILE MENU ================= */
function toggleMenu() {
  let left = document.getElementById("left");
  left.classList.toggle("active");
}

/* CLOSE MENU ON OUTSIDE CLICK */
document.addEventListener("click", function(e) {
  let left = document.getElementById("left");
  let btn = document.getElementById("menuBtn");

  if (!left.contains(e.target) && !btn.contains(e.target)) {
    left.classList.remove("active");
  }
});