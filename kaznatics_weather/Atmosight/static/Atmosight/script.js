const hour = new Date().getHours();
if(hour < 18 && hour > 8) document.body.style.background = " linear-gradient(135deg, #005095, #00f2fe)";
else document.body.style.background = "linear-gradient(135deg, #000428, #004e92)";

document.getElementById("load").addEventListener("click", showForecast);

function getCondition(data, i) {
  var condition;
  if(data.rain[i] > 2.5) condition = "Heavy rain/snow";
  else if(data.rain[i] > 0.5) condition = "Light rain/snow";
  else if(data.clouds[i] >= 1) condition = "Overcast skies";
  else if(data.clouds[i] >= 0.7) condition = "Cloudy";
  else if(data.clouds[i] >= 0.35) condition = "Partly cloudy";
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

let globalForecast = [];

async function showForecast() {
  document.getElementById("chart").style.display = "block";
  const aiBox = document.getElementById("aiResponse");
  aiBox.textContent = "🤖 AI is analyzing past days...";
  document.getElementById("load").style.display = "none";


  const res = await fetch("/api/forecast/");
  const data = await res.json();

  aiBox.textContent = "✅ Forecast generated successfully!";

  const forecast = data.dates.map((date, i) => ({
    date,
    temp: (data.temp[i] - 273).toFixed(1),
    humidity: data.humidity[i].toFixed(1),
    condition: getCondition(data, i)
  }));

globalForecast = forecast;
window.latestForecast = forecast;
document.getElementById("download").style.display = "inline-block";

  const ctx = document.getElementById("chart").getContext("2d");
  if (window.currentChart) {
  window.currentChart.destroy();
}
  window.currentChart = new Chart(ctx, {
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
  updateDaySelect(forecast);
}

const downloadBtn = document.getElementById("download");

downloadBtn.addEventListener("click", () => {
  if (!globalForecast || globalForecast.length === 0) {
    alert("No forecast data to download yet!");
    return;
  }

  let text = "Atmosight AI Forecast (next 10 days)\n\n";
  globalForecast.forEach(day => {
    text += `${day.date}: ${day.temp}°C, ${day.condition}, humidity ${day.humidity}%\n`;
  });

  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "forecast.txt";
  link.click();
  URL.revokeObjectURL(link.href);
});

function updateDaySelect(forecast) {
  const select = document.getElementById("daySelect");
  const btn = document.getElementById("showDay");

  select.innerHTML = '<option value="">Select a day...</option>';
  forecast.forEach((f, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = f.date;
    select.appendChild(option);
  });

  select.disabled = false;
  btn.disabled = false;
}

document.getElementById("showDay").addEventListener("click", () => {
  const select = document.getElementById("daySelect");
  const aiBox = document.getElementById("aiResponse");
  const container = document.querySelector(".container");
  const chartCanvas = document.getElementById("chart");

  const i = select.value;
  if (i === "") {
    aiBox.textContent = "⚠️ Please select a day first.";
    return;
  }

  const f = globalForecast[i];
  aiBox.textContent = `📅 Forecast for ${f.date}: ${f.condition}, ${f.temp}°C, humidity ${f.humidity}%`;

  chartCanvas.style.display = "none";

  const old = container.querySelector(".day-card, table");
  if (old) old.remove();

  const icons = {
    "Sunny": "☀️",
    "Partly cloudy": "⛅",
    "Cloudy": "☁️",
    "Overcast skies": "🌥️",
    "Light rain/snow": "🌧️",
    "Heavy rain/snow": "⛈️"
  };
  const icon = icons[f.condition] || "🌈";

  const cardHTML = `
    <div class="day-card">
      <div class="weather-icon">${icon}</div>
      <h2>${f.date}</h2>
      <p class="temp">${f.temp}°C</p>
      <p>💧 Humidity: ${f.humidity}%</p>
      <p>Condition: <strong>${f.condition}</strong></p>
      <button id="backToAll">🔙 Show 10-Day Forecast</button>
    </div>
  `;
  container.insertAdjacentHTML("beforeend", cardHTML);

  document.getElementById("backToAll").addEventListener("click", () => {
    chartCanvas.style.display = "block";
    const card = container.querySelector(".day-card");
    if (card) card.remove();
    renderTable(globalForecast);
  });
});
