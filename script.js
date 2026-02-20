document.getElementById("lastUpdate").innerText =
  new Date().toLocaleTimeString();
let coHistory = [];
let startTime = Date.now();

database.ref("hexapod").on("value", (snapshot) => {

  const data = snapshot.val();
  if(data){

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
  }

});
