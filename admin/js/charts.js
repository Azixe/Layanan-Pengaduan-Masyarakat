// Chart Variables
let categoryChart, statusChart, trendChart;
// API_BASE_URL is defined in admin.js

function getStatusKey(status) {
  if (typeof normalizeStatusKey === "function") {
    return normalizeStatusKey(status);
  }
  const normalized = (status || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if (
    ["sedang dikerjakan", "sedang diproses", "proses", "in progress"].includes(
      normalized
    )
  ) {
    return "inProgress";
  }
  if (
    ["selesai", "selesai dikerjakan", "resolved", "done"].includes(normalized)
  ) {
    return "completed";
  }
  return "pending";
}

// Initialize All Charts - will be populated with real data
function initCharts() {
  initCategoryChart();
  initStatusChart();
  initTrendChart();
}

// Category Chart (Doughnut)
function initCategoryChart() {
  const categoryCtx = document.getElementById("categoryChart");
  if (!categoryCtx) return;

  categoryChart = new Chart(categoryCtx, {
    type: "doughnut",
    data: {
      labels: [
        "Infrastruktur",
        "Sosial",
        "Pelayanan",
        "Keamanan",
        "Kesehatan",
        "Lingkungan",
        "Lainnya",
      ],
      datasets: [
        {
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: [
            "#ff6b6b",
            "#4dabf7",
            "#ffa500",
            "#51cf66",
            "#845ef7",
            "#20c997",
            "#868e96",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 15,
            font: { size: 12 },
          },
        },
      },
    },
  });
}

// Status Chart (Pie)
function initStatusChart() {
  const statusCtx = document.getElementById("statusChart");
  if (!statusCtx) return;

  statusChart = new Chart(statusCtx, {
    type: "pie",
    data: {
      labels: ["Belum dikerjakan", "Sedang dikerjakan", "Selesai"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: ["#ff6b6b", "#ffa500", "#51cf66"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 15,
            font: { size: 12 },
          },
        },
      },
    },
  });
}

// Trend Chart (Line)
function initTrendChart() {
  const trendCtx = document.getElementById("trendChart");
  if (!trendCtx) return;

  trendChart = new Chart(trendCtx, {
    type: "line",
    data: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Laporan",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderColor: "#0066CC",
          backgroundColor: "rgba(0, 102, 204, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "#f0f0f0",
          },
          ticks: {
            stepSize: 1,
            precision: 0,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

// Initialize Date Filters
function initDateFilters() {
  const endDate = document.getElementById("endDate");
  const startDate = document.getElementById("startDate");

  if (endDate && startDate) {
    const today = new Date().toISOString().split("T")[0];
    endDate.value = today;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    startDate.value = thirtyDaysAgo.toISOString().split("T")[0];
  }
}

// Update Charts Based on Date Range
async function updateCharts() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!startDate || !endDate) {
    alert("Silakan pilih tanggal mulai dan akhir");
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    alert("Tanggal mulai harus sebelum tanggal akhir");
    return;
  }

  // Fetch data from backend with date filter
  try {
    const response = await fetch(`${API_BASE_URL}/laporan/all?limit=1000`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load chart data");

    const result = await response.json();

    // Filter by date range
    const filteredData = result.data.filter((report) => {
      const reportDate = new Date(report.createdAt);
      return (
        reportDate >= new Date(startDate) && reportDate <= new Date(endDate)
      );
    });

    updateChartsWithData(filteredData);
    showNotification(
      `Charts updated for ${startDate} to ${endDate}`,
      "success"
    );
  } catch (error) {
    console.error("Error updating charts:", error);
    showNotification("Failed to update charts", "error");
  }
}

// Update charts with real backend data
async function updateChartsWithData(reports) {
  console.log("updateChartsWithData called with reports:", reports);

  if (!reports || reports.length === 0) {
    console.log("No reports data to display");
    return;
  }

  // Count by category
  const categoryCount = {
    Infrastruktur: 0,
    Sosial: 0,
    Pelayanan: 0,
    Keamanan: 0,
    Kesehatan: 0,
    Lingkungan: 0,
    Lainnya: 0,
  };

  const statusCount = {
    pending: 0,
    inProgress: 0,
    completed: 0,
  };

  // Count by month
  const monthlyCount = new Array(12).fill(0);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  reports.forEach((report) => {
    // Category count - Use kategori_ai which contains the actual report category
    let kategori = report.kategori_ai || "Lainnya";

    // Normalize category name (trim)
    kategori = kategori.toString().trim();

    // Check if category exists in our predefined categories
    const categoryKeys = Object.keys(categoryCount);
    const matchedCategory = categoryKeys.find(
      (key) => key.toLowerCase() === kategori.toLowerCase()
    );

    if (matchedCategory) {
      categoryCount[matchedCategory]++;
    } else {
      categoryCount["Lainnya"]++;
    }

    const statusKey = getStatusKey(report.status_laporan);
    statusCount[statusKey] = (statusCount[statusKey] || 0) + 1;

    // Monthly count
    const month = new Date(report.createdAt).getMonth();
    monthlyCount[month]++;
  });

  console.log("Final category count:", categoryCount);
  console.log("Final status count:", statusCount);

  // Update Category Chart
  updateCategoryChart(Object.values(categoryCount));

  updateStatusChart([
    statusCount.pending,
    statusCount.inProgress,
    statusCount.completed,
  ]);

  // Update Trend Chart
  updateTrendChart(monthlyCount, monthNames);
}

// Update Category Chart Data
function updateCategoryChart(data) {
  if (!categoryChart) return;
  categoryChart.data.datasets[0].data = data;
  categoryChart.update();
}

// Update Status Chart Data
function updateStatusChart(data) {
  if (!statusChart) return;
  statusChart.data.datasets[0].data = data;
  statusChart.update();
}

// Update Trend Chart Data
function updateTrendChart(data, labels) {
  if (!trendChart) return;
  trendChart.data.datasets[0].data = data;
  if (labels) {
    trendChart.data.labels = labels;
  }
  trendChart.update();
}

// Show Notification
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === "success" ? "#51cf66" : "#ff6b6b"};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
  notification.innerHTML = `<i class="fa-solid fa-${
    type === "success" ? "check" : "exclamation"
  }-circle"></i> ${message}`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
