<script>

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyCehgDLT0amLHXWi1hBSSJzvBQ7R2Nhmg",
  databaseURL: "https://hexapod-monitoring-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hexapod-monitoring-system"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ===== CHART SETUP =====
const ctx = document.getElementById("historyChart").getContext("2d");

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
let maxRows = 50;

// ===== REALTIME LISTENER =====
database.ref("hexapod").on("value", (snapshot) => {

  const data = snapshot.val();

  if(data){

    const currentTime = new Date().toLocaleTimeString();

    // Update Chart
    if(historyChart.data.labels.length > maxRows){
      historyChart.data.labels.shift();
      historyChart.data.datasets[0].data.shift();
      historyChart.data.datasets[1].data.shift();
    }

    historyChart.data.labels.push(currentTime);
    historyChart.data.datasets[0].data.push(data.co);
    historyChart.data.datasets[1].data.push(data.air);
    historyChart.update();

    // Update Table
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${currentTime}</td>
      <td>${data.co}</td>
      <td>${data.air}</td>
    `;

    if(tableBody.rows.length >= maxRows){
      tableBody.deleteRow(0);
    }

    tableBody.appendChild(row);
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
  a.href = url;
  a.download = "hexapod_history.csv";
  a.click();

  window.URL.revokeObjectURL(url);
}


// ===== REPORT GENERATION FUNCTION =====
function generateReport() {

  const table = document.getElementById("historyTable");

  if (!table || table.rows.length === 0) {
    alert("No data available to generate report.");
    return;
  }

  let reportWindow = window.open("", "_blank");

  let htmlContent = `
    <html>
    <head>
      <title>Hexapod Monitoring Report</title>
      <style>
        body { font-family: Arial; padding:20px; }
        h2 { text-align:center; }
        table { width:100%; border-collapse: collapse; margin-top:20px; }
        th, td { border:1px solid #000; padding:8px; text-align:center; }
        th { background:#f2f2f2; }
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

  htmlContent += `
      </table>
    </body>
    </html>
  `;

  reportWindow.document.write(htmlContent);
  reportWindow.document.close();
}

</script>
