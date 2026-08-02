const API_URL = "https://script.google.com/macros/s/AKfycbw10r-WWFirFZ69Gdmty9j3uARwdEAGMXhBgwAxbKerfn_bn1t2jbPP4F_z6Pj10kL9/exec";

let entries = [];
let chart;

document.getElementById("date").valueAsDate = new Date();

async function loadCloudData(){
showLoading("Loading step history...");
try{

const response = await fetch(API_URL);

entries = await response.json();

entries.sort((a,b)=>
new Date(a.date)-new Date(b.date)
);

renderDashboard();
loadDateData();
hideLoading();
}catch(err){

console.error(err);

alert("Unable to load cloud data.");
hideLoading();
}
}
function getAdjustedZeppSteps(rawZepp){

  return Math.round(rawZepp * 1.2);

}

function getCyclingSteps(distance){

    return Math.round(distance * 400);

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

const distance =
parseFloat(
    document.getElementById("cyclingDistance").value || 0
);

const cyclingSteps =
getCyclingSteps(distance);

const goal =
parseInt(document.getElementById("goal").value || 10000);

const total =
    samsung +
    zepp +
    cyclingSteps;

const entry = {
    date,
    samsung,
    zepp,
    cyclingDistance: distance,
    cyclingSteps,
    goal,
    total
};
showLoading("Saving to Google Sheets...");
try{

await fetch(API_URL, {

  method:'POST',

  headers:{
    "Content-Type":"text/plain;charset=utf-8"
  },

  body: JSON.stringify(entry)

});

await loadCloudData();
hideLoading();
alert("Saved to Google Sheets successfully!");
renderDashboard();
}catch(err){

console.error(err);
hideLoading();
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

const distance =
parseFloat(
    document.getElementById("cyclingDistance").value || 0
);

const cyclingSteps =
getCyclingSteps(distance);

const cyclingStepsField =
    document.getElementById("cyclingSteps");

if(cyclingStepsField){

    cyclingStepsField.value = cyclingSteps;

}
  
const goal =
parseInt(document.getElementById("goal").value || 10000);

const total =
    samsung +
    zepp +
    cyclingSteps;

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

document.getElementById("zeppSteps").value =
  Math.round(existing.zepp / 1.2);
  
document.getElementById("cyclingDistance").value =
existing.cyclingDistance;

document.getElementById("cyclingSteps").value =
existing.cyclingSteps;
  
document.getElementById("goal").value = existing.goal;

}else{

document.getElementById("samsungSteps").value = "";
document.getElementById("zeppSteps").value = "";

document.getElementById("cyclingDistance").value = "";
document.getElementById("cyclingSteps").value = "";

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

const referenceDate = getReferenceDate();
referenceDate.setHours(23,59,59,999);

const month =
    referenceDate.toISOString().substring(0,7);

let monthly = 0;

entries.forEach(e=>{

    const d = new Date(e.date);

    if(
        e.date.startsWith(month) &&
        d <= referenceDate
    ){
        monthly += e.total;
    }

});

document.getElementById("monthlyTotal").innerText =
monthly.toLocaleString();

const best = Math.max(...entries.map(e=>e.total));

document.getElementById("bestDay").innerText =
best.toLocaleString();

calculateStreak();
calculateWeeklyAverages();
}
function calculateWeeklyAverages(){

    const today = getReferenceDate();
today.setHours(23,59,59,999);
    // Sunday = 0

    const day = today.getDay();

    // Beginning of current week (Sunday)

    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - day);
    currentSunday.setHours(0,0,0,0);

    // Beginning of previous week

    const previousSunday = new Date(currentSunday);
    previousSunday.setDate(previousSunday.getDate() - 7);

    const previousSaturday = new Date(previousSunday);
    previousSaturday.setDate(previousSunday.getDate() + 6);

    let currentTotal = 0;
    let previousTotal = 0;

    entries.forEach(e=>{

        const d = new Date(e.date);
        d.setHours(0,0,0,0);

        if(d >= currentSunday && d <= today){

            currentTotal += e.total;

        }

        if(d >= previousSunday && d <= previousSaturday){

            previousTotal += e.total;

        }

    });

    const currentAverage =
        Math.round(currentTotal / (day + 1));

    const previousAverage =
        Math.round(previousTotal / 7);

    document.getElementById("currentWeekAvg").innerText =
        currentAverage.toLocaleString();

    document.getElementById("previousWeekAvg").innerText =
        previousAverage.toLocaleString();

}
function getReferenceDate() {

    return new Date(
        document.getElementById("date").value
    );

}
function calculateStreak(){

let streak = 0;

const referenceDate = getReferenceDate();

const sorted = [...entries]
    .filter(e => new Date(e.date) <= referenceDate)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));

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

const selectedDate =
    document.getElementById("date").value;

const latest =
    entries.find(e => e.date === selectedDate);

if(!latest) return;

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
function showLoading(text){

  document.getElementById("loadingText").innerText =
    text;

  document
    .getElementById("loadingOverlay")
    .classList.remove("hidden");

}

function hideLoading(){

  document
    .getElementById("loadingOverlay")
    .classList.add("hidden");

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

  const referenceDate = getReferenceDate();

const month =
    referenceDate.toISOString().substring(0,7);

const monthEntries =
    entries.filter(e =>
        e.date.startsWith(month)
    );

if(chart) chart.destroy();

chart = new Chart(ctx,{

type:'line',

data:{

labels: monthEntries.map(e=>formatDisplayDate(e.date)),

datasets:[{

label:'Daily Steps',

data: monthEntries.map(e=>e.total),

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
.addEventListener("change", () => {

    loadDateData();

    renderDashboard();

});

document
.getElementById("cyclingDistance")
.addEventListener(
    "input",
    updateLiveProgress
);

loadCloudData();
