// ===== VARIABLES =====
let coHistory = [];
let startTime = Date.now();
let maxRows = 30;

// ===== REALTIME FIREBASE LISTENER =====
database.ref("hexapod").on("value", (snapshot) => {

  const data = snapshot.val();

  if(data){

    // ===== UPDATE SENSOR VALUES =====
    document.getElementById("coValue").innerText = data.co;
    document.getElementById("airValue").innerText = data.air;

    // ===== LAST UPDATE TIME =====
    document.getElementById("lastUpdate").innerText =
      new Date().toLocaleTimeString();

    // ===== SMART ALERT SYSTEM =====
    if(data.co > 3000){
      document.body.style.background = "#ffe5e5";
      document.getElementById("coStatus").innerText = "🚨 CRITICAL";
      document.getElementById("coStatus").className = "danger";
    }
    else if(data.co > 2000){
      document.body.style.background = "#fff7e6";
      document.getElementById("coStatus").innerText = "⚠️ Warning";
      document.getElementById("coStatus").className = "warning";
    }
    else{
      document.body.style.background = "#eef2f7";
      document.getElementById("coStatus").innerText = "✅ Safe";
      document.getElementById("coStatus").className = "safe";
    }

    // Air Status
    if(data.air > 2000){
      document.getElementById("airStatus").innerText = "⚠️ Poor Air";
      document.getElementById("airStatus").className = "warning";
    }
    else{
      document.getElementById("airStatus").innerText = "✅ Good";
      document.getElementById("airStatus").className = "safe";
    }

    // ===== ANALYTICS =====
    coHistory.push(data.co);

    if(coHistory.length > 100){
      coHistory.shift();
    }

    const max = Math.max(...coHistory);
    const avg = (coHistory.reduce((a,b)=>a+b,0) / coHistory.length).toFixed(0);

    document.getElementById("maxCo").innerText = max;
    document.getElementById("avgCo").innerText = avg;

    const seconds = Math.floor((Date.now() - startTime)/1000);
    document.getElementById("uptime").innerText = seconds + " sec";

    // ===== GRAPH UPDATE =====
    if(myChart.data.labels.length > maxRows){
      myChart.data.labels.shift();
      myChart.data.datasets[0].data.shift();
      myChart.data.datasets[1].data.shift();
    }

    myChart.data.labels.push("");
    myChart.data.datasets[0].data.push(data.co);
    myChart.data.datasets[1].data.push(data.air);
    myChart.update();
  }
});


// ===== CSV EXPORT FUNCTION =====
function exportCSV() {

  let csv = "Time,CO Level,Air Quality\n";
  const rows = document.querySelectorAll("#historyTable tr");

  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    const rowData = [];
    cols.forEach(col => rowData.push(col.innerText));
    csv += rowData.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", "hexapod_history.csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


// ===== REPORT GENERATION FUNCTION =====
function generateReport() {

  const rows = document.querySelectorAll("#historyTable tr");

  let reportWindow = window.open("", "", "width=900,height=700");

  reportWindow.document.write("<h2>Hexapod Monitoring Report</h2>");
  reportWindow.document.write("<p>Generated: " + new Date().toLocaleString() + "</p>");
  reportWindow.document.write("<table border='1' cellpadding='8' cellspacing='0'>");
  reportWindow.document.write("<tr><th>Time</th><th>CO Level</th><th>Air Quality</th></tr>");

  rows.forEach(row => {
    reportWindow.document.write("<tr>" + row.innerHTML + "</tr>");
  });

  reportWindow.document.write("</table>");

  reportWindow.document.close();
}
