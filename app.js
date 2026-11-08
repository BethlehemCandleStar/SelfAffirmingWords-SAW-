const DEFAULT_AFFIRMATIONS = [
  "I choose the next healthy step. I can pause, breathe and act in line with the person I want to become.",
  "I can notice the urge without obeying it.",
  "My next choice can support the life I want.",
  "I am allowed to pause before I decide.",
  "One healthy choice is enough for this moment.",
  "I can speak to myself with strength, patience and respect."
];

const state = {
  affirmations: JSON.parse(localStorage.getItem("saw_affirmations") || "[]"),
  reasons: JSON.parse(localStorage.getItem("saw_reasons") || "[]"),
  settings: JSON.parse(localStorage.getItem("saw_settings") || '{"tone":"calm","focus":"self-control"}'),
  daily: JSON.parse(localStorage.getItem("saw_daily") || "{}")
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function saveState(){
  localStorage.setItem("saw_affirmations", JSON.stringify(state.affirmations));
  localStorage.setItem("saw_reasons", JSON.stringify(state.reasons));
  localStorage.setItem("saw_settings", JSON.stringify(state.settings));
  localStorage.setItem("saw_daily", JSON.stringify(state.daily));
}

function dateKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function generatedWords(){
  const focus = (state.settings.focus || "self-control").trim();
  const reason = state.reasons[0]?.text || "the life I want to build";
  const tone = state.settings.tone || "calm";
  const sets = {
    calm: [
      `I can move through this moment with ${focus}. I do not have to rush my decision.`,
      `I can pause, breathe and remember ${reason.toLowerCase()}.`,
      `I choose a steady next step that supports ${reason.toLowerCase()}.`
    ],
    strong: [
      `I am taking control of my next choice. ${focus} is stronger than this moment.`,
      `I decide what happens next. I choose the action that supports ${reason.toLowerCase()}.`,
      "I can face the urge and still choose myself."
    ],
    gentle: [
      `I can be kind to myself while choosing ${focus}.`,
      `This feeling can pass. I can return to ${reason.toLowerCase()} with care.`,
      "I do not need perfection today. I only need one supportive next step."
    ]
  };
  const pool = sets[tone] || sets.calm;
  return pool[Math.floor(Math.random()*pool.length)];
}

function ensureDaily(force=false){
  const key = dateKey();
  if(force || !state.daily[key]){
    state.daily[key] = generatedWords();
    saveState();
  }
  $("#dailyAffirmation").textContent = state.daily[key];
}

function showApp(){
  $("#marketing").classList.add("hidden");
  $("#appShell").classList.remove("hidden");
  setAuth();
}
function showSite(){
  $("#appShell").classList.add("hidden");
  $("#marketing").classList.remove("hidden");
}
$("#openAppTop").addEventListener("click",showApp);
$("#openAppHero").addEventListener("click",showApp);
$("#backToSite").addEventListener("click",showSite);

function setAuth(){
  const account = JSON.parse(localStorage.getItem("saw_account") || "null");
  const loggedIn = !!account?.email;
  $("#loginView").classList.toggle("hidden",loggedIn);
  $("#bottomNav").classList.toggle("hidden",!loggedIn);
  if(loggedIn){
    showView("todayView");
    $("#profileEmail").textContent = account.email;
    updateProfile();
    ensureDaily();
    renderAffirmations();
    renderReasons();
    updateFeatured();
  }else{
    ["todayView","wordsView","reasonsView","pauseView","profileView"].forEach(id=>$("#"+id).classList.add("hidden"));
  }
}

$("#loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const email=$("#emailInput").value.trim();
  if(!email) return;
  localStorage.setItem("saw_account",JSON.stringify({email}));
  setAuth();
});
$("#demoLogin").addEventListener("click",()=>{
  localStorage.setItem("saw_account",JSON.stringify({email:"demo@saw.app"}));
  setAuth();
});
$("#logoutBtn").addEventListener("click",()=>{
  localStorage.removeItem("saw_account");
  setAuth();
});

function showView(id){
  ["todayView","wordsView","reasonsView","pauseView","profileView"].forEach(v=>$("#"+v).classList.toggle("hidden",v!==id));
  $$("#bottomNav button").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
}
$$("#bottomNav button").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.view)));

$("#newWordsBtn").addEventListener("click",()=>ensureDaily(true));

$("#affirmationForm").addEventListener("submit",e=>{
  e.preventDefault();
  const v=$("#affirmationInput").value.trim();
  if(!v) return;
  state.affirmations.unshift(v);
  $("#affirmationInput").value="";
  saveState();
  renderAffirmations();
});

function renderAffirmations(){
  const list=$("#affirmationList");
  list.innerHTML="";
  const values=state.affirmations.length?state.affirmations:DEFAULT_AFFIRMATIONS.slice(1,4);
  const classes=["coral-card","teal-card","blue-card","violet-card"];
  values.forEach((q,i)=>{
    const el=document.createElement("article");
    el.className=`app-card ${classes[i%classes.length]}`;
    el.innerHTML=`<strong>${escapeHtml(q)}</strong><p class="muted">Tap or save as a daily favourite.</p>`;
    list.appendChild(el);
  });
}

$("#saveAgentSettings").addEventListener("click",()=>{
  state.settings.tone=$("#toneSelect").value;
  state.settings.focus=$("#focusInput").value.trim() || "self-control";
  saveState();
  updateProfile();
  ensureDaily(true);
});

$("#reasonForm").addEventListener("submit",e=>{
  e.preventDefault();
  const text=$("#reasonInput").value.trim();
  const file=$("#photoInput").files[0];
  if(!text) return;
  const add=(image=null)=>{
    state.reasons.unshift({text,image});
    saveState();
    $("#reasonInput").value="";
    $("#photoInput").value="";
    renderReasons();
    updateFeatured();
    ensureDaily(true);
  };
  if(file){
    const reader=new FileReader();
    reader.onload=()=>add(reader.result);
    reader.readAsDataURL(file);
  }else add();
});

function renderReasons(){
  const list=$("#reasonList");
  list.innerHTML="";
  const defaults=[
    {text:"For my health and energy",image:null,cls:"coral-card"},
    {text:"For the people I love",image:null,cls:"teal-card"},
    {text:"For the life I want next",image:null,cls:"blue-card"}
  ];
  const items=state.reasons.length?state.reasons:defaults;
  items.forEach((r,i)=>{
    const el=document.createElement("article");
    el.className=`reason-card ${r.cls || ["coral-card","teal-card","blue-card"][i%3]}`;
    const thumb=document.createElement("div");
    thumb.className="reason-thumb";
    if(r.image) thumb.style.backgroundImage=`url(${r.image})`;
    const copy=document.createElement("div");
    copy.className="reason-copy";
    copy.innerHTML=`<h3>${escapeHtml(r.text)}</h3><p>Photo + personal reminder</p>`;
    el.append(thumb,copy);
    list.appendChild(el);
  });
}

function updateFeatured(){
  const r=state.reasons[0];
  if(!r) return;
  $("#featuredReason").textContent=r.text;
  $("#pauseReason").textContent=r.text;
  if(r.image){
    $("#featuredPhoto").style.backgroundImage=`url(${r.image})`;
    $("#featuredPhoto").textContent="";
  }
}

function updateProfile(){
  $("#toneSelect").value=state.settings.tone || "calm";
  $("#focusInput").value=state.settings.focus || "self-control";
  $("#profileFocus").textContent=state.settings.focus || "self-control";
  $("#profileTone").textContent={
    calm:"Calm and encouraging",
    strong:"Strong and empowering",
    gentle:"Gentle and compassionate"
  }[state.settings.tone || "calm"];
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g,m=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[m]));
}

setAuth();
