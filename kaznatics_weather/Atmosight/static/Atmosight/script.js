document.getElementById("load").addEventListener("click", showForecast);

async function showForecast() {
  const aiBox = document.getElementById("aiResponse");
  aiBox.textContent = "🤖 AI is analyzing past 10 days...";

  const res = await fetch("/api/forecast/");
  const data = await res.json();

  aiBox.textContent = "✅ Forecast generated successfully!";

  const forecast = data.dates.map((date, i) => ({
    date,
    temp: data.temp[i],
    humidity: data.humidity[i],
    condition: getCondition()
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

function getCondition() {
  const options = ["Sunny", "Cloudy", "Rainy", "Snowy", "Windy", "Foggy"];
  return options[Math.floor(Math.random() * options.length)];
}

function renderTable(forecast) {
  let html = `
    <table>
      <tr>
        <th>Date</th>
        <th>Temperature (°C)</th>
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
