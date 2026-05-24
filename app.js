const API_URL = "https://script.google.com/macros/s/AKfycbw10r-WWFirFZ69Gdmty9j3uARwdEAGMXhBgwAxbKerfn_bn1t2jbPP4F_z6Pj10kL9/exec";

let entries = [];
let chart;

document.getElementById("date").valueAsDate = new Date();

async function loadCloudData(){

try{

const response = await fetch(API_URL);

entries = await response.json();

entries.sort((a,b)=>
new Date(a.date)-new Date(b.date)
);

renderDashboard();
loadDateData();

}catch(err){

console.error(err);

alert("Unable to load cloud data.");

}
}
function getAdjustedZeppSteps(rawZepp){

  return Math.round(rawZepp * 1.2);

}
async function saveEntry(){

const date =
document.getElementById("date").value;

const samsung =
parseInt(document.getElementById("samsungSteps").value || 0);

const rawZepp =
parseInt(document.getElementById("zeppSteps").value || 0);

const zepp =
getAdjustedZeppSteps(rawZepp);

const goal =
parseInt(document.getElementById("goal").value || 10000);

const total = samsung + zepp;

const entry = {
date,
samsung,
zepp,
goal,
total
};

try{

await fetch(API_URL, {

  method:'POST',

  headers:{
    "Content-Type":"text/plain;charset=utf-8"
  },

  body: JSON.stringify(entry)

});

await loadCloudData();

alert("Saved to Google Sheets successfully!");

}catch(err){

console.error(err);

alert("Save failed.");

}
}

function updateLiveProgress(){

const samsung =
parseInt(document.getElementById("samsungSteps").value || 0);

const rawZepp =
parseInt(document.getElementById("zeppSteps").value || 0);

const zepp =
getAdjustedZeppSteps(rawZepp);

document.getElementById("adjustedZeppSteps").value =
zepp;

const goal =
parseInt(document.getElementById("goal").value || 10000);

const total = samsung + zepp;

document.getElementById("todayTotal").innerText =
total.toLocaleString();

const progress =
Math.min((total/goal)*100,100);

const progressBar =
document.getElementById("progressBar");

progressBar.style.width = progress + "%";

progressBar.innerText =
Math.round(progress)+"%";

}

function loadDateData(){

const selectedDate =
document.getElementById("date").value;

const existing =
entries.find(e => e.date === selectedDate);

if(existing){

document.getElementById("samsungSteps").value = existing.samsung;

document.getElementById("zeppSteps").value = existing.zepp;

document.getElementById("goal").value = existing.goal;

}else{

document.getElementById("samsungSteps").value = "";

document.getElementById("zeppSteps").value = "";

document.getElementById("goal").value = 10000;

}

updateLiveProgress();

}

function renderDashboard(){

renderChart();
renderHeatmap();
renderLeaderboard();
updateInsights();
updateStats();

}

function updateStats(){

if(entries.length===0) return;

const latest = entries[entries.length-1];

const month = latest.date.substring(0,7);

let monthly = 0;

entries.forEach(e=>{
if(e.date.startsWith(month)){
monthly += e.total;
}
});

document.getElementById("monthlyTotal").innerText =
monthly.toLocaleString();

const best = Math.max(...entries.map(e=>e.total));

document.getElementById("bestDay").innerText =
best.toLocaleString();

calculateStreak();

}

function calculateStreak(){

let streak = 0;

const sorted = [...entries].sort((a,b)=>
new Date(b.date)-new Date(a.date)
);

for(let i=0;i<sorted.length;i++){

if(sorted[i].total >= sorted[i].goal){
streak++;
}else{
break;
}

}

document.getElementById("streakValue").innerText = streak;

}

function updateInsights(){

if(entries.length===0) return;

const latest = entries[entries.length-1];

const avg =
Math.round(
entries.reduce((a,b)=>a+b.total,0)/entries.length
);

let insight = "";

if(latest.total > avg){

insight = `🔥 Excellent! You are above your average of ${avg.toLocaleString()} steps.`;

}else{

insight = `📈 You are below your average of ${avg.toLocaleString()} steps.`;

}

document.getElementById("aiInsights").innerText = insight;

}

function renderLeaderboard(){

const tbody =
document.querySelector("#leaderboardTable tbody");

tbody.innerHTML = "";

const sorted = [...entries]
.sort((a,b)=>b.total-a.total)
.slice(0,10);

sorted.forEach((e,index)=>{

tbody.innerHTML += `
<tr>
<td>#${index+1}</td>
<td>${formatDisplayDate(e.date)}</td>
<td>${e.total.toLocaleString()}</td>
</tr>
`;

});

}

function renderHeatmap(){

const heatmap =
document.getElementById("heatmap");

heatmap.innerHTML = "";

entries.forEach(e=>{

const intensity =
Math.min(e.total/15000,1);

const div = document.createElement("div");

div.className = "heat-day";

div.style.background =
`rgba(16,185,129,${intensity})`;

heatmap.appendChild(div);

});

}

function formatDisplayDate(dateStr){

  const d = new Date(dateStr);

  return d.toLocaleDateString(
    'en-GB',
    {
      day:'2-digit',
      month:'short',
      year:'2-digit'
    }
  );

}

function renderChart(){

const ctx =
document.getElementById("stepsChart");

if(chart) chart.destroy();

chart = new Chart(ctx,{

type:'line',

data:{

labels: entries.map(
  e=>formatDisplayDate(e.date)
),

datasets:[{

label:'Daily Steps',

data: entries.map(e=>e.total),

tension:0.3

}]

},

options:{
responsive:true,
maintainAspectRatio:true
}

});

}

document
.getElementById("samsungSteps")
.addEventListener("input", updateLiveProgress);

document
.getElementById("zeppSteps")
.addEventListener("input", updateLiveProgress);

document
.getElementById("goal")
.addEventListener("input", updateLiveProgress);

document
.getElementById("date")
.addEventListener("change", loadDateData);

loadCloudData();
