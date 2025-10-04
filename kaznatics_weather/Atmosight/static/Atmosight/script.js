// script.js
document.getElementById("load").addEventListener("click", showForecast);
const hour = new Date().getHours();
if (hour < 12) document.body.style.background = "linear-gradient(135deg, #a8edea, #fed6e3)";
else if (hour < 18) document.body.style.background = "linear-gradient(135deg, #4facfe, #00f2fe)";
else document.body.style.background = "linear-gradient(135deg, #000428, #004e92)";

const aiBox = document.getElementById("aiResponse");
aiBox.textContent = "🤖 AI is analyzing past 30 days...";
setTimeout(() => {
  aiBox.textContent = "✅ Forecast generated successfully!";
}, 1500);

function showForecast() {
  // 1️⃣ Создаём список из 30 дней начиная с сегодня
  const today = new Date();
  const days = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date.toISOString().split("T")[0]); // формат YYYY-MM-DD
  }
const loadBtn = document.getElementById('load');
loadBtn.classList.add('fade-out');
setTimeout(() => loadBtn.style.display = 'none', 350);


  // 2️⃣ Генерируем фейковые данные (можно будет заменить на реальные API)
  const forecast = days.map((day) => ({
    date: day,
    temp: (10 + Math.random() * 15).toFixed(1), // температура
    wind: (1 + Math.random() * 5).toFixed(1),   // скорость ветра
    condition: getRandomCondition(),             // описание погоды
  }));

  // 3️⃣ Обновляем график температуры
  const ctx = document.getElementById("chart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: forecast.map(f => f.date),
      datasets: [
        {
          label: "Temperature (°C)",
          data: forecast.map(f => f.temp),
          borderColor: "white",
          backgroundColor: "rgba(255,255,255,0.2)",
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      plugins: { legend: { labels: { color: "white" } } },
      scales: {
        x: { ticks: { color: "white", maxRotation: 90, minRotation: 45 } },
        y: { ticks: { color: "white" } }
      }
    }
  });
const daysSelect = document.getElementById('days');
const forecastDiv = document.getElementById('forecast');


  // 4️⃣ Показываем таблицу с данными
  renderTable(forecast);
}

// Функция для случайного описания погоды
function getRandomCondition() {
  const options = ["Sunny", "Cloudy", "Rainy", "Snowy", "Windy", "Foggy"];
  return options[Math.floor(Math.random() * options.length)];
}

// Отображаем таблицу с данными
function renderTable(forecast) {
  let html = `
    <table>
      <tr>
        <th>Date</th>
        <th>Temperature (°C)</th>
        <th>Wind (m/s)</th>
        <th>Condition</th>
      </tr>
  `;
  for (const f of forecast) {
    html += `
      <tr>
        <td>${f.date}</td>
        <td>${f.temp}</td>
        <td>${f.wind}</td>
        <td>${f.condition}</td>
      </tr>
    `;
  }
  html += "</table>";

  // Добавляем таблицу под график
  const container = document.querySelector(".container");
  const oldTable = container.querySelector("table");
  if (oldTable) oldTable.remove();
  container.insertAdjacentHTML("beforeend", html);
}

