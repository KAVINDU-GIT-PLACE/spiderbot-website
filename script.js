// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyCehgDLT0amLHXWi1hBSSJzvBQ7R2Nhmg",
  databaseURL: "https://hexapod-monitoring-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hexapod-monitoring-system"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ================= COMMON VARIABLES =================
let coHistory = [];
let startTime = Date.now();
let maxRows = 50;


// ====================================================
// ================= DASHBOARD PAGE ===================
// ====================================================

const dashboardChartCanvas = document.getElementById("chart");

if (dashboardChartCanvas) {

  const ctx = dashboardChartCanvas.getContext("2d");

  const myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "CO Level",
          data: [],
          borderColor: "#0ea5e9",
          borderWidth: 2
        },
        {
          label: "Air Quality",
          data: [],
          borderColor: "#ef4444",
          borderWidth: 2
        }
      ]
    }
  });

  database.ref("hexapod").on("value", (snapshot) => {

    const data = snapshot.val();
    if (!data) return;

    // Update values
    if(document.getElementById("coValue"))
      document.getElementById("coValue").innerText = data.co;

    if(document.getElementById("airValue"))
      document.getElementById("airValue").innerText = data.air;

    if(document.getElementById("lastUpdate"))
      document.getElementById("lastUpdate").innerText =
        new Date().toLocaleTimeString();

    // Smart Alert
    if(data.co > 3000){
      document.body.style.background = "#ffe5e5";
      if(document.getElementById("coStatus")){
        document.getElementById("coStatus").innerText = "🚨 CRITICAL";
        document.getElementById("coStatus").className = "danger";
      }
    }
    else if(data.co > 2000){
      document.body.style.background = "#fff7e6";
      if(document.getElementById("coStatus")){
        document.getElementById("coStatus").innerText = "⚠️ Warning";
        document.getElementById("coStatus").className = "warning";
      }
    }
    else{
      document.body.style.background = "#eef2f7";
      if(document.getElementById("coStatus")){
        document.getElementById("coStatus").innerText = "✅ Safe";
        document.getElementById("coStatus").className = "safe";
      }
    }

    // Analytics
    coHistory.push(data.co);
    if(coHistory.length > 100) coHistory.shift();

    if(document.getElementById("maxCo"))
      document.getElementById("maxCo").innerText =
        Math.max(...coHistory);

    if(document.getElementById("avgCo"))
      document.getElementById("avgCo").innerText =
        (coHistory.reduce((a,b)=>a+b,0) / coHistory.length).toFixed(0);

    if(document.getElementById("uptime")){
      const seconds = Math.floor((Date.now() - startTime)/1000);
      document.getElementById("uptime").innerText = seconds + " sec";
    }

    // Graph update
    if(myChart.data.labels.length > 30){
      myChart.data.labels.shift();
      myChart.data.datasets[0].data.shift();
      myChart.data.datasets[1].data.shift();
    }

    myChart.data.labels.push("");
    myChart.data.datasets[0].data.push(data.co);
    myChart.data.datasets[1].data.push(data.air);
    myChart.update();
  });
}


// ====================================================
// ================= HISTORY PAGE =====================
// ====================================================

const historyChartCanvas = document.getElementById("historyChart");

if (historyChartCanvas) {

  const ctx = historyChartCanvas.getContext("2d");

  const historyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "CO Level",
          data: [],
          borderColor: "#0ea5e9",
          borderWidth: 2
        },
        {
          label: "Air Quality",
          data: [],
          borderColor: "#ef4444",
          borderWidth: 2
        }
      ]
    }
  });

  const tableBody = document.getElementById("historyTable");

  database.ref("hexapod").on("value", (snapshot) => {

    const data = snapshot.val();
    if (!data) return;

    const currentTime = new Date().toLocaleTimeString();

    if(historyChart.data.labels.length > maxRows){
      historyChart.data.labels.shift();
      historyChart.data.datasets[0].data.shift();
      historyChart.data.datasets[1].data.shift();
    }

    historyChart.data.labels.push(currentTime);
    historyChart.data.datasets[0].data.push(data.co);
    historyChart.data.datasets[1].data.push(data.air);
    historyChart.update();

    if(tableBody){
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${currentTime}</td>
        <td>${data.co}</td>
        <td>${data.air}</td>
      `;

      if(tableBody.rows.length >= maxRows)
        tableBody.deleteRow(0);

      tableBody.appendChild(row);
    }
  });
}


// ================= CSV EXPORT =================
function exportCSV() {
  const rows = document.querySelectorAll("#historyTable tr");
  let csv = "Time,CO Level,Air Quality\n";

  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    const rowData = [];
    cols.forEach(col => rowData.push(col.innerText));
    csv += rowData.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "hexapod_history.csv";
  a.click();

  URL.revokeObjectURL(url);
}


// ================= REPORT DOWNLOAD =================
function generateReport() {

  const table = document.getElementById("historyTable");

  if (!table || table.rows.length === 0) {
    alert("No data available.");
    return;
  }

  let htmlContent = `
  <html>
  <head>
    <title>Hexapod Monitoring Report</title>
    <style>
      body { font-family: Arial; padding:20px; }
      table { width:100%; border-collapse: collapse; margin-top:20px; }
      th, td { border:1px solid #000; padding:8px; text-align:center; }
    </style>
  </head>
  <body>
    <h2>Hexapod Monitoring Report</h2>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <table>
      <tr>
        <th>Time</th>
        <th>CO Level</th>
        <th>Air Quality</th>
      </tr>
  `;

  for (let i = 0; i < table.rows.length; i++) {
    htmlContent += "<tr>" + table.rows[i].innerHTML + "</tr>";
  }

  htmlContent += "</table></body></html>";

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "hexapod_report.html";
  a.click();

  URL.revokeObjectURL(url);
}
