// app.js
// Main logic: manage subjects, create plan, save to Firestore, export PDF, auth Google
const subjectForm = document.getElementById('subject-form');
const nameInput = document.getElementById('subject-name');
const dateInput = document.getElementById('subject-date');
const diffInput = document.getElementById('subject-difficulty');
const noteInput = document.getElementById('subject-note');

const subjectListEl = document.getElementById('subject-list');
const planListEl = document.getElementById('plan-list');
const generateBtn = document.getElementById('generate-plan');
const exportPdfBtn = document.getElementById('export-pdf');
const clearAllBtn = document.getElementById('clear-all');
const saveCloudBtn = document.getElementById('save-cloud');

const btnGoogle = document.getElementById('btn-google');
const btnLogout = document.getElementById('btn-logout');

let subjects = loadSubjects();
let currentPlan = [];

// --- Auth
const provider = new firebase.auth.GoogleAuthProvider();

auth.onAuthStateChanged(user=>{
  if(user){
    btnGoogle.classList.add('hidden');
    btnLogout.classList.remove('hidden');
  } else {
    btnGoogle.classList.remove('hidden');
    btnLogout.classList.add('hidden');
  }
});

btnGoogle.addEventListener('click', async ()=>{
  try{
    await auth.signInWithPopup(provider);
    alert('Đăng nhập thành công!');
  }catch(e){ console.error(e); alert('Lỗi đăng nhập'); }
});

btnLogout.addEventListener('click', async ()=>{
  await auth.signOut();
  alert('Đã đăng xuất');
});

// --- Subject CRUD
subjectForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = nameInput.value.trim();
  const date = dateInput.value;
  const diff = parseInt(diffInput.value);
  const note = noteInput.value.trim();

  if(!name || !date) return alert('Điền đủ tên môn và ngày thi');

  subjects.push({id:Date.now(), name, date, diff, note});
  saveSubjects();
  renderSubjects();
  subjectForm.reset();
});

function renderSubjects(){
  subjectListEl.innerHTML = '';
  if(subjects.length===0){
    subjectListEl.innerHTML = '<li class="muted">Chưa có môn nào</li>';
    return;
  }
  subjects.sort((a,b)=> new Date(a.date)-new Date(b.date));
  for(const s of subjects){
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${s.name}</strong><div class="small muted">${s.date} · độ khó: ${s.diff} ${s.note? '· '+s.note: ''}</div></div>
    <div><button data-id="${s.id}" class="btn-del">Xóa</button></div>`;
    subjectListEl.appendChild(li);
  }
  subjectListEl.querySelectorAll('.btn-del').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.id);
      subjects = subjects.filter(x=>x.id!==id);
      saveSubjects();
      renderSubjects();
    });
  });
}

function saveSubjects(){ localStorage.setItem('sp_subjects', JSON.stringify(subjects)); }
function loadSubjects(){ try{ return JSON.parse(localStorage.getItem('sp_subjects')) || []; }catch(e){return [];} }

// --- Generate plan
generateBtn.addEventListener('click', ()=>{
  if(subjects.length===0) return alert('Thêm ít nhất 1 môn đã nhé');
  currentPlan = generatePlan(subjects);
  renderPlan();
});

function generatePlan(subjectsArr){
  // weight: diff 1->1, 2->2, 3->3 (days needed)
  const items = subjectsArr.map(s=>{
    const daysNeeded = s.diff; // simple mapping, could be scaled
    return {...s, daysNeeded, due: new Date(s.date)};
  });

  // Build calendar from today until latest due date
  const today = new Date();
  const lastDate = new Date(Math.max(...items.map(i=>i.due.getTime())));
  const days = [];
  for(let d=new Date(today); d<=lastDate; d.setDate(d.getDate()+1)){
    days.push(new Date(d));
  }

  // Sort by due date asc
  items.sort((a,b)=> a.due - b.due);

  // Simple round-robin allocation: assign each day one subject, prioritizing nearest due & remaining daysNeeded
  const plan = [];
  const remaining = {};
  items.forEach(i=> remaining[i.id]=i.daysNeeded);

  for(const day of days){
    // choose subject with remaining >0 and shortest time to due
    const candidates = items.filter(i=> remaining[i.id] > 0 && i.due >= day);
    if(candidates.length === 0) continue;
    candidates.sort((a,b)=> (a.due - day) - (b.due - day));
    const chosen = candidates[0];
    plan.push({date: new Date(day), subject: chosen.name, note: chosen.note || ''});
    remaining[chosen.id] -= 1;
  }

  // If still remaining days (due in past), append them near the end
  for(const i of items){
    while(remaining[i.id] > 0){
      plan.push({date: new Date(), subject: i.name, note: i.note || ''});
      remaining[i.id]--;
    }
  }

  return plan;
}

function renderPlan(){
  planListEl.innerHTML = '';
  if(currentPlan.length===0){ planListEl.innerHTML = '<li>Chưa có kế hoạch</li>'; return; }
  for(const p of currentPlan){
    const li = document.createElement('li');
    const d = new Date(p.date);
    li.innerHTML = `<div><strong>${formatDate(d)}:</strong> ${p.subject} ${p.note? '· '+p.note: ''}</div>`;
    planListEl.appendChild(li);
  }
}

// --- Export PDF
exportPdfBtn.addEventListener('click', async ()=>{
  if(currentPlan.length===0) return alert('Tạo kế hoạch trước khi xuất PDF');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('StudyPlanner - Kế hoạch ôn tập', 14, 20);
  doc.setFontSize(11);
  let y=30;
  currentPlan.forEach((p, idx)=>{
    if(y>270){ doc.addPage(); y=20; }
    doc.text(`${idx+1}. ${formatDate(new Date(p.date))} — ${p.subject}${p.note? ' · '+p.note:''}`, 14, y);
    y+=8;
  });
  doc.save('studyplanner-plan.pdf');
});

// --- Save to Firestore
saveCloudBtn.addEventListener('click', async ()=>{
  if(!auth.currentUser) return alert('Hãy đăng nhập bằng Google để lưu lên cloud');
  if(currentPlan.length===0) return alert('Tạo kế hoạch trước khi lưu');
  const uid = auth.currentUser.uid;
  try{
    const ref = await db.collection('plans').add({
      uid,
      plan: currentPlan.map(p=>({date:p.date.toISOString(), subject:p.subject, note:p.note})),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('Lưu thành công! id: '+ref.id);
  }catch(e){ console.error(e); alert('Lưu lỗi'); }
});

// --- Utilities
function formatDate(d){
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${dd}/${mm}/${yyyy}`;
}

clearAllBtn.addEventListener('click', ()=>{
  if(confirm('Xóa tất cả môn?')){ subjects=[]; saveSubjects(); renderSubjects(); currentPlan=[]; renderPlan(); }
});

// init
renderSubjects();
renderPlan();
