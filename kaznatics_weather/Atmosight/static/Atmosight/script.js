document.getElementById("load").addEventListener("click", showForecast);

async function showForecast() {
  const aiBox = document.getElementById("aiResponse");
  aiBox.textContent = "🤖 AI is analyzing past 10 days...";

  const res = await fetch("/api/forecast/");
  const data = await res.json();

  aiBox.textContent = "✅ Forecast generated successfully!";

  const forecast = data.dates.map((date, i) => ({
    date,
    temp: (data.temp[i] - 273).toFixed(1),
    humidity: data.humidity[i].toFixed(1),
    condition: getCondition(data, i)
  }));

  const ctx = document.getElementById("chart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: forecast.map(f => f.date),
      datasets: [{
        label: "Temperature (°C)",
        data: forecast.map(f => f.temp),
        borderColor: "white",
        backgroundColor: "rgba(255,255,255,0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      plugins: { legend: { labels: { color: "white" } } },
      scales: {
        x: { ticks: { color: "white" } },
        y: { ticks: { color: "white" } }
      }
    }
  });

  renderTable(forecast);
}

function getCondition(data, i) {
  var condition;
  if(data.rain[i] > 2.5) condition = "Heavy rain/snow";
  else if(data.rain[i] > 0.3) condition = "Light rain/snow";
  else if(data.clouds[i] >= 1) condition = "Overcast skies";
  else if(data.clouds[i] >= 0.7) condition = "Cloudy";
  else if(data.clouds[i] >= 0.3) condition = "Partly cloudy";
  else condition = "Sunny";
  return condition;
}

function renderTable(forecast) {
  let html = `
    <table>
      <tr>
        <th>Date</th>
        <th>Temperature(°C)</th>
        <th>Humidity</th>
        <th>Condition</th>
      </tr>
  `;
  for (const f of forecast) {
    html += `
      <tr>
        <td>${f.date}</td>
        <td>${f.temp}</td>
        <td>${f.humidity}</td>
        <td>${f.condition}</td>
      </tr>
    `;
  }
  html += "</table>";

  const container = document.querySelector(".container");
  const oldTable = container.querySelector("table");
  if (oldTable) oldTable.remove();
  container.insertAdjacentHTML("beforeend", html);
}
