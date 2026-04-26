const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzHtghzQh5SVQcA3CmvCUHM6OPUSsOam95ex7s5N3HahS9jp1FPj_54ebTQ9jDuPAlGQA/exec";

/* -------------------- base elements -------------------- */
const systemStatusEl = document.getElementById("systemStatus");
const systemIndicatorDot = document.querySelector(".dot");

const fromDateEl = document.getElementById("fromDate");
const toDateEl = document.getElementById("toDate");
const monthFilterEl = document.getElementById("monthFilter");
const yearFilterEl = document.getElementById("yearFilter");
const machineFilterEl = document.getElementById("machineFilter");
const machineNoFilterEl = document.getElementById("machineNoFilter");
const shiftFilterEl = document.getElementById("shiftFilter");
const resultFilterEl = document.getElementById("resultFilter");
const keywordFilterEl = document.getElementById("keywordFilter");
const resetFilterBtn = document.getElementById("resetFilterBtn");
const thisMonthBtn = document.getElementById("thisMonthBtn");
const todayRangeBtn = document.getElementById("todayRangeBtn");

const toggleFilterBtn = document.getElementById("toggleFilterBtn");
const filterContentEl = document.getElementById("filterContent");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

/* -------------------- KPI -------------------- */
const kpiTotalJobsEl = document.getElementById("kpiTotalJobs");
const kpiTotalDowntimeEl = document.getElementById("kpiTotalDowntime");
const kpiAvgDowntimeEl = document.getElementById("kpiAvgDowntime");
const kpiMachinesEl = document.getElementById("kpiMachines");
const kpiTopProblemEl = document.getElementById("kpiTopProblem");
const kpiTopPointEl = document.getElementById("kpiTopPoint");

/* -------------------- summary tables -------------------- */
const topProblemTableEl = document.getElementById("topProblemTable");
const topPointTableEl = document.getElementById("topPointTable");
const topMachineDowntimeTableEl = document.getElementById("topMachineDowntimeTable");

/* -------------------- AI -------------------- */
const aiRiskMachineEl = document.getElementById("aiRiskMachine");
const aiRiskScoreEl = document.getElementById("aiRiskScore");
const aiRiskReasonEl = document.getElementById("aiRiskReason");
const aiRiskLevelEl = document.getElementById("aiRiskLevel");

const aiRepeatCaseEl = document.getElementById("aiRepeatCase");
const aiRepeatCountEl = document.getElementById("aiRepeatCount");
const aiRepeatReasonEl = document.getElementById("aiRepeatReason");
const aiRepeatLevelEl = document.getElementById("aiRepeatLevel");

const aiTrendTitleEl = document.getElementById("aiTrendTitle");
const aiTrendReasonEl = document.getElementById("aiTrendReason");
const aiTrendLevelEl = document.getElementById("aiTrendLevel");

const aiSummaryListEl = document.getElementById("aiSummaryList");
const aiRepeatTableEl = document.getElementById("aiRepeatTable");

/* -------------------- history table -------------------- */
const tableCountTextEl = document.getElementById("tableCountText");
const historyTableBodyEl = document.getElementById("historyTableBody");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfoEl = document.getElementById("pageInfo");

/* -------------------- modal -------------------- */
const detailModalEl = document.getElementById("detailModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalContentEl = document.getElementById("modalContent");

/* -------------------- state -------------------- */
const state = {
  allRecords: [],
  filteredRecords: [],
  currentPage: 1,
  pageSize: 15,
  charts: {}
};

document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();
  bindEvents();
  await loadData();
});

/* =========================================================
   EVENTS
========================================================= */
function bindEvents() {
  fromDateEl?.addEventListener("change", applyFilters);
  toDateEl?.addEventListener("change", applyFilters);
  monthFilterEl?.addEventListener("change", applyFilters);
  yearFilterEl?.addEventListener("change", applyFilters);

  machineFilterEl?.addEventListener("change", handleMachineFilterChange);
  machineNoFilterEl?.addEventListener("change", applyFilters);
  shiftFilterEl?.addEventListener("change", applyFilters);
  resultFilterEl?.addEventListener("change", applyFilters);
  keywordFilterEl?.addEventListener("input", applyFilters);

  resetFilterBtn?.addEventListener("click", resetFilters);

  thisMonthBtn?.addEventListener("click", () => {
    clearDateRange();
    setThisMonth();
    applyFilters();
  });

  todayRangeBtn?.addEventListener("click", () => {
    setTodayRange();
    applyFilters();
  });

  toggleFilterBtn?.addEventListener("click", toggleFilterPanel);

  prevPageBtn?.addEventListener("click", goPrevPage);
  nextPageBtn?.addEventListener("click", goNextPage);

  closeModalBtn?.addEventListener("click", closeModal);
  detailModalEl?.addEventListener("click", (event) => {
    if (event.target === detailModalEl) closeModal();
  });

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

/* =========================================================
   LOAD DATA
========================================================= */
async function loadData() {
  try {
    setSystemStatus("กำลังโหลดข้อมูล...", "warning");

    const response = await fetch(`${WEB_APP_URL}?action=history`);
    const result = await response.json();

    if (!result.success) {
      setSystemStatus("โหลดข้อมูลล้มเหลว", "error");
      renderEmpty("โหลดข้อมูลไม่สำเร็จ");
      return;
    }

    state.allRecords = Array.isArray(result.history) ? result.history : [];

    populateYearFilter();
    populateMachineFilter();
    setThisMonth();
    applyFilters();

    setSystemStatus("พร้อมใช้งาน", "success");
  } catch (error) {
    console.error(error);
    setSystemStatus("เชื่อมต่อไม่ได้", "error");
    renderEmpty("เชื่อมต่อข้อมูลไม่สำเร็จ");
  }
}

function setSystemStatus(text, stateType) {
  if (systemStatusEl) {
    systemStatusEl.textContent = text;
  }

  if (!systemIndicatorDot) return;

  if (stateType === "warning") {
    systemIndicatorDot.style.background = "#f59e0b";
  } else if (stateType === "error") {
    systemIndicatorDot.style.background = "#ef4444";
  } else {
    systemIndicatorDot.style.background = "#10b981";
  }
}

/* =========================================================
   FILTER BAR / TABS
========================================================= */
function toggleFilterPanel() {
  if (!filterContentEl || !toggleFilterBtn) return;

  const isCollapsed = filterContentEl.classList.toggle("collapsed");

  toggleFilterBtn.innerHTML = `
    <i data-lucide="${isCollapsed ? "chevron-down" : "chevron-up"}"></i>
    <span>${isCollapsed ? "แสดงตัวกรอง" : "ซ่อนตัวกรอง"}</span>
  `;

  lucide.createIcons();
}

function switchTab(tabId) {
  tabButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  tabPanels.forEach(panel => {
    panel.classList.toggle("active", panel.id === tabId);
  });

  if (tabId === "dashboardTab") {
    setTimeout(() => {
      resizeCharts();
    }, 80);
  }
}

function populateYearFilter() {
  if (!yearFilterEl) return;

  const currentYear = new Date().getFullYear();
  const years = [...new Set(
    state.allRecords
      .map(row => extractYear(row["วันที่ซ่อม"] || row["Timestamp"]))
      .filter(Boolean)
  )];

  if (!years.includes(currentYear)) {
    years.push(currentYear);
  }

  years.sort((a, b) => b - a);

  yearFilterEl.innerHTML = '<option value="">-- ทั้งหมด --</option>';
  years.forEach(year => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearFilterEl.appendChild(option);
  });
}

function populateMachineFilter() {
  if (!machineFilterEl) return;

  const machines = [...new Set(
    state.allRecords
      .map(row => clean(row["ชื่อเครื่องจักร"]))
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "th"));

  machineFilterEl.innerHTML = '<option value="">-- ทั้งหมด --</option>';
  machines.forEach(machine => {
    const option = document.createElement("option");
    option.value = machine;
    option.textContent = machine;
    machineFilterEl.appendChild(option);
  });
}

function populateMachineNoFilter(selectedMachine) {
  if (!machineNoFilterEl) return;

  machineNoFilterEl.innerHTML = '<option value="">-- ทั้งหมด --</option>';

  if (!selectedMachine) {
    machineNoFilterEl.disabled = true;
    return;
  }

  const machineNos = [...new Set(
    state.allRecords
      .filter(row => clean(row["ชื่อเครื่องจักร"]) === selectedMachine)
      .map(row => clean(row["หมายเลขเครื่อง"]))
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "th"));

  machineNos.forEach(no => {
    const option = document.createElement("option");
    option.value = no;
    option.textContent = no;
    machineNoFilterEl.appendChild(option);
  });

  machineNoFilterEl.disabled = false;
}

function handleMachineFilterChange() {
  populateMachineNoFilter(machineFilterEl?.value || "");
  if (machineNoFilterEl) machineNoFilterEl.value = "";
  applyFilters();
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setThisMonth() {
  const now = new Date();
  if (monthFilterEl) monthFilterEl.value = String(now.getMonth() + 1);
  if (yearFilterEl) yearFilterEl.value = String(now.getFullYear());
}

function setTodayRange() {
  const today = formatDateInput(new Date());

  if (fromDateEl) fromDateEl.value = today;
  if (toDateEl) toDateEl.value = today;
  if (monthFilterEl) monthFilterEl.value = "";
  if (yearFilterEl) yearFilterEl.value = "";
}

function clearDateRange() {
  if (fromDateEl) fromDateEl.value = "";
  if (toDateEl) toDateEl.value = "";
}

function resetFilters() {
  if (fromDateEl) fromDateEl.value = "";
  if (toDateEl) toDateEl.value = "";
  if (monthFilterEl) monthFilterEl.value = "";
  if (yearFilterEl) yearFilterEl.value = "";
  if (machineFilterEl) machineFilterEl.value = "";
  if (machineNoFilterEl) {
    machineNoFilterEl.innerHTML = '<option value="">-- ทั้งหมด --</option>';
    machineNoFilterEl.disabled = true;
  }
  if (shiftFilterEl) shiftFilterEl.value = "";
  if (resultFilterEl) resultFilterEl.value = "";
  if (keywordFilterEl) keywordFilterEl.value = "";

  applyFilters();
}

function applyFilters() {
  const month = monthFilterEl?.value || "";
  const year = yearFilterEl?.value || "";
  const fromDate = fromDateEl?.value || "";
  const toDate = toDateEl?.value || "";
  const machine = machineFilterEl?.value || "";
  const machineNo = machineNoFilterEl?.value || "";
  const shift = shiftFilterEl?.value || "";
  const result = resultFilterEl?.value || "";
  const keyword = (keywordFilterEl?.value || "").trim().toLowerCase();

  state.filteredRecords = state.allRecords.filter(row => {
    const rowDateObj = parseDate(row["วันที่ซ่อม"] || row["Timestamp"]);
    const rowMonth = rowDateObj ? String(rowDateObj.getMonth() + 1) : "";
    const rowYear = rowDateObj ? String(rowDateObj.getFullYear()) : "";
    const rowDateText = rowDateObj ? formatDateInput(rowDateObj) : "";

    const rowMachine = clean(row["ชื่อเครื่องจักร"]);
    const rowMachineNo = clean(row["หมายเลขเครื่อง"]);
    const rowShift = clean(row["กะ"]);
    const rowResult = clean(row["ผลหลังซ่อม"]);

    const keywordBase = [
      row["จุดที่เสีย"],
      getProblemText(row),
      row["สาเหตุ"],
      row["การแก้ไข"],
      row["ชื่อช่าง"],
      row["หมายเหตุ"]
    ].map(clean).join(" ").toLowerCase();

    if (fromDate || toDate) {
      if (fromDate && rowDateText < fromDate) return false;
      if (toDate && rowDateText > toDate) return false;
    } else {
      if (month && rowMonth !== month) return false;
      if (year && rowYear !== year) return false;
    }

    if (machine && rowMachine !== machine) return false;
    if (machineNo && rowMachineNo !== machineNo) return false;
    if (shift && rowShift !== shift) return false;
    if (result && rowResult !== result) return false;
    if (keyword && !keywordBase.includes(keyword)) return false;

    return true;
  });

  state.currentPage = 1;
  renderAll();
}

/* =========================================================
   RENDER ROOT
========================================================= */
function renderAll() {
  renderHistory();
  renderDashboard();
}

function renderHistory() {
  renderTable();
  renderPagination();
}

function renderDashboard() {
  renderKpis();
  renderCharts();
  renderTopTables();
  renderAIInsights();
}

/* =========================================================
   KPI
========================================================= */
function renderKpis() {
  const totalJobs = state.filteredRecords.length;
  const totalDowntime = sumBy(state.filteredRecords, "เวลาสูญเสีย(นาที)");
  const avgDowntime = totalJobs > 0 ? (totalDowntime / totalJobs).toFixed(1) : 0;

  const machineKeys = new Set(
    state.filteredRecords
      .map(row => `${clean(row["ชื่อเครื่องจักร"])} | ${clean(row["หมายเลขเครื่อง"])}`)
      .filter(key => key !== "|" && key.trim())
  );

  const topProblem = getTopGroupedLabelByFn(state.filteredRecords, row => getProblemText(row));
  const topPoint = getTopGroupedLabel(state.filteredRecords, "จุดที่เสีย");

  if (kpiTotalJobsEl) kpiTotalJobsEl.textContent = formatNumber(totalJobs);
  if (kpiTotalDowntimeEl) kpiTotalDowntimeEl.textContent = formatNumber(totalDowntime);
  if (kpiAvgDowntimeEl) kpiAvgDowntimeEl.textContent = formatNumber(avgDowntime);
  if (kpiMachinesEl) kpiMachinesEl.textContent = formatNumber(machineKeys.size);
  if (kpiTopProblemEl) kpiTopProblemEl.textContent = topProblem || "-";
  if (kpiTopPointEl) kpiTopPointEl.textContent = topPoint || "-";
}

/* =========================================================
   HISTORY TABLE
========================================================= */
function renderTable() {
  if (!historyTableBodyEl || !tableCountTextEl) return;

  if (state.filteredRecords.length === 0) {
    renderEmpty("ไม่พบข้อมูลตามเงื่อนไขที่เลือก");
    tableCountTextEl.textContent = "พบ 0 รายการ";
    return;
  }

  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = startIndex + state.pageSize;
  const rows = state.filteredRecords.slice(startIndex, endIndex);

  historyTableBodyEl.innerHTML = rows.map((row, index) => {
    const rowIndex = startIndex + index;

    return `
      <tr>
        <td>${escapeHtml(formatDisplayDate(row["วันที่ซ่อม"] || row["Timestamp"]))}</td>
        <td>${escapeHtml(clean(row["ชื่อเครื่องจักร"]))}</td>
        <td>${escapeHtml(clean(row["หมายเลขเครื่อง"]))}</td>
        <td>${escapeHtml(clean(row["จุดที่เสีย"]))}</td>
        <td>${escapeHtml(getProblemText(row))}</td>
        <td>${escapeHtml(formatNumber(toNumber(row["เวลาสูญเสีย(นาที)"])))} นาที</td>
        <td>${escapeHtml(clean(row["ชื่อช่าง"]))}</td>
        <td>${renderResultBadge(clean(row["ผลหลังซ่อม"]))}</td>
        <td>
          <button class="btn-detail" type="button" onclick="openDetailByIndex(${rowIndex})">
            ดูรายละเอียด
          </button>
        </td>
      </tr>
    `;
  }).join("");

  tableCountTextEl.textContent = `พบ ${formatNumber(state.filteredRecords.length)} รายการ`;
}

function renderPagination() {
  if (!pageInfoEl || !prevPageBtn || !nextPageBtn) return;

  const totalPages = Math.max(1, Math.ceil(state.filteredRecords.length / state.pageSize));
  pageInfoEl.textContent = `หน้า ${state.currentPage} / ${totalPages}`;

  prevPageBtn.disabled = state.currentPage <= 1;
  nextPageBtn.disabled = state.currentPage >= totalPages;
}

function renderEmpty(message) {
  if (!historyTableBodyEl) return;

  historyTableBodyEl.innerHTML = `
    <tr>
      <td colspan="9" class="empty-cell">${escapeHtml(message)}</td>
    </tr>
  `;
}

function goPrevPage() {
  if (state.currentPage <= 1) return;
  state.currentPage -= 1;
  renderTable();
  renderPagination();
}

function goNextPage() {
  const totalPages = Math.max(1, Math.ceil(state.filteredRecords.length / state.pageSize));
  if (state.currentPage >= totalPages) return;
  state.currentPage += 1;
  renderTable();
  renderPagination();
}

function renderResultBadge(text) {
  const safe = escapeHtml(text || "-");

  if (text === "ใช้งานได้ปกติ") {
    return `<span class="badge green">${safe}</span>`;
  }
  if (text === "ใช้งานได้ชั่วคราว" || text === "ต้องติดตามต่อ") {
    return `<span class="badge orange">${safe}</span>`;
  }
  return `<span class="badge blue">${safe}</span>`;
}

/* =========================================================
   CHARTS
========================================================= */
function renderCharts() {
  renderMachineDowntimeChart();
  renderPointChart();
  renderDailyTrendChart();
  renderTypeChart();
  renderProblemChart();
}

function renderMachineDowntimeChart() {
  const grouped = groupRecords(
    state.filteredRecords,
    row => `${clean(row["ชื่อเครื่องจักร"])} | ${clean(row["หมายเลขเครื่อง"])}`,
    row => toNumber(row["เวลาสูญเสีย(นาที)"])
  );

  const entries = Object.entries(grouped)
    .filter(([label]) => label && label !== "|" && label !== "-")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  createChart("machineDowntimeChart", "bar", {
    labels: entries.map(([label]) => label),
    datasets: [{
      label: "Downtime (นาที)",
      data: entries.map(([, value]) => value),
      backgroundColor: "rgba(37, 99, 235, 0.75)",
      borderRadius: 8
    }]
  }, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  });
}

function renderPointChart() {
  const grouped = groupRecords(state.filteredRecords, row => clean(row["จุดที่เสีย"]), () => 1);

  const entries = Object.entries(grouped)
    .filter(([label]) => label && label !== "-")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  createChart("pointChart", "bar", {
    labels: entries.map(([label]) => label),
    datasets: [{
      label: "จำนวนครั้ง",
      data: entries.map(([, value]) => value),
      backgroundColor: "rgba(239, 68, 68, 0.75)",
      borderRadius: 8
    }]
  }, {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } }
  });
}

function renderDailyTrendChart() {
  const grouped = groupRecords(
    state.filteredRecords,
    row => {
      const d = parseDate(row["วันที่ซ่อม"] || row["Timestamp"]);
      return d ? formatShortDate(d) : "-";
    },
    row => toNumber(row["เวลาสูญเสีย(นาที)"])
  );

  const entries = Object.entries(grouped)
    .filter(([label]) => label !== "-")
    .sort((a, b) => parseThaiDateKey(a[0]) - parseThaiDateKey(b[0]));

  createChart("dailyTrendChart", "line", {
    labels: entries.map(([label]) => label),
    datasets: [{
      label: "Downtime (นาที)",
      data: entries.map(([, value]) => value),
      borderColor: "rgba(16, 185, 129, 1)",
      backgroundColor: "rgba(16, 185, 129, 0.18)",
      fill: true,
      tension: 0.3,
      pointRadius: 3
    }]
  }, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: true } }
  });
}

function renderTypeChart() {
  const grouped = groupRecords(state.filteredRecords, row => clean(row["ประเภทงานเสีย"]), () => 1);

  const entries = Object.entries(grouped)
    .filter(([label]) => label && label !== "-")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  createChart("typeChart", "doughnut", {
    labels: entries.map(([label]) => label),
    datasets: [{
      data: entries.map(([, value]) => value),
      backgroundColor: ["#2563eb", "#ef4444", "#f59e0b", "#10b981", "#7c3aed", "#475569"]
    }]
  }, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } }
  });
}

function renderProblemChart() {
  const grouped = groupRecords(state.filteredRecords, row => getProblemText(row), () => 1);

  const entries = Object.entries(grouped)
    .filter(([label]) => label && label !== "-")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  createChart("problemChart", "bar", {
    labels: entries.map(([label]) => label),
    datasets: [{
      label: "จำนวนครั้ง",
      data: entries.map(([, value]) => value),
      backgroundColor: "rgba(124, 58, 237, 0.75)",
      borderRadius: 8
    }]
  }, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  });
}

function createChart(canvasId, type, data, options) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (state.charts[canvasId]) {
    state.charts[canvasId].destroy();
  }

  const ctx = canvas.getContext("2d");
  state.charts[canvasId] = new Chart(ctx, {
    type,
    data,
    options
  });
}

function resizeCharts() {
  Object.values(state.charts).forEach(chart => {
    if (chart) chart.resize();
  });
}

/* =========================================================
   TOP TABLES
========================================================= */
function renderTopTables() {
  const topProblems = Object.entries(
    groupRecords(state.filteredRecords, row => getProblemText(row), () => 1)
  )
    .filter(([label]) => label && label !== "-")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topPoints = Object.entries(
    groupRecords(state.filteredRecords, row => clean(row["จุดที่เสีย"]), () => 1)
  )
    .filter(([label]) => label && label !== "-")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topMachines = Object.entries(
    groupRecords(
      state.filteredRecords,
      row => `${clean(row["ชื่อเครื่องจักร"])} | ${clean(row["หมายเลขเครื่อง"])}`,
      row => toNumber(row["เวลาสูญเสีย(นาที)"])
    )
  )
    .filter(([label]) => label && label !== "|" && label !== "-")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  renderMiniTable(topProblemTableEl, topProblems, "ครั้ง");
  renderMiniTable(topPointTableEl, topPoints, "ครั้ง");
  renderMiniTable(topMachineDowntimeTableEl, topMachines, "นาที");
}

function renderMiniTable(targetEl, entries, unit) {
  if (!targetEl) return;

  if (!entries.length) {
    targetEl.innerHTML = `<tr class="empty-row"><td colspan="2">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  targetEl.innerHTML = entries.map(([label, value]) => `
    <tr>
      <td>${escapeHtml(label || "-")}</td>
      <td>${formatNumber(value)} ${unit}</td>
    </tr>
  `).join("");
}

/* =========================================================
   MODAL
========================================================= */
window.openDetailByIndex = function(index) {
  const row = state.filteredRecords[index];
  if (!row || !modalContentEl || !detailModalEl) return;

  modalContentEl.innerHTML = `
    <div class="detail-grid">
      ${detailItem("วันที่ซ่อม", formatDisplayDate(row["วันที่ซ่อม"] || row["Timestamp"]))}
      ${detailItem("กะ", clean(row["กะ"]))}
      ${detailItem("ชื่อเครื่องจักร", clean(row["ชื่อเครื่องจักร"]))}
      ${detailItem("หมายเลขเครื่อง", clean(row["หมายเลขเครื่อง"]))}
      ${detailItem("ไลน์ผลิต", clean(row["ไลน์ผลิต"]))}
      ${detailItem("จุดที่เสีย", clean(row["จุดที่เสีย"]))}
      ${detailItem("อาการที่เสีย", getProblemText(row))}
      ${detailItem("ประเภทงานเสีย", clean(row["ประเภทงานเสีย"]))}
      ${detailItem("สาเหตุ", clean(row["สาเหตุ"]), true)}
      ${detailItem("การแก้ไข", clean(row["การแก้ไข"]), true)}
      ${detailItem("Downtime (นาที)", formatNumber(toNumber(row["เวลาสูญเสีย(นาที)"])))}
      ${detailItem("ผลหลังซ่อม", clean(row["ผลหลังซ่อม"]))}
      ${detailItem("ชื่อช่าง", clean(row["ชื่อช่าง"]))}
      ${detailItem("รหัสพนักงาน", clean(row["รหัสพนักงาน"]))}
      ${detailItem("อะไหล่ที่ใช้", clean(row["อะไหล่ที่ใช้"]), true)}
      ${detailItem("เวลาเริ่มซ่อม", clean(row["เวลาเริ่มซ่อม"]))}
      ${detailItem("เวลาซ่อมเสร็จ", clean(row["เวลาซ่อมเสร็จ"]))}
      ${detailItem("หมายเหตุ", clean(row["หมายเหตุ"]), true)}
    </div>
  `;

  detailModalEl.classList.add("show");
  lucide.createIcons();
};

function closeModal() {
  detailModalEl?.classList.remove("show");
}

function detailItem(label, value, full = false) {
  return `
    <div class="detail-item ${full ? "full" : ""}">
      <div class="detail-label">${escapeHtml(label)}</div>
      <div class="detail-value">${escapeHtml(value || "-")}</div>
    </div>
  `;
}

/* =========================================================
   AI HELPERS
========================================================= */
function setAIPill(el, text, tone) {
  if (!el) return;
  el.textContent = text;
  el.className = `ai-pill ${tone}`;
}

function getRiskLevel(score) {
  if (score >= 80) return { text: "วิกฤต", tone: "danger" };
  if (score >= 45) return { text: "เฝ้าระวัง", tone: "warn" };
  return { text: "ปกติ", tone: "good" };
}

function getRepeatLevel(repeatHits, total) {
  if (repeatHits >= 2 || total >= 4) return { text: "เสียซ้ำมาก", tone: "danger" };
  if (repeatHits >= 1 || total >= 2) return { text: "ควรติดตาม", tone: "warn" };
  return { text: "ปกติ", tone: "good" };
}

function getTrendLevel(diffJobs, diffDowntime) {
  if (diffJobs > 0 || diffDowntime > 0) return { text: "แย่ลง", tone: "danger" };
  if (diffJobs === 0 && diffDowntime === 0) return { text: "ทรงตัว", tone: "neutral" };
  return { text: "ดีขึ้น", tone: "good" };
}

/* =========================================================
   AI INSIGHTS
========================================================= */
function renderAIInsights() {
  const records = [...state.filteredRecords]
    .filter(row => parseDate(row["วันที่ซ่อม"] || row["Timestamp"]))
    .sort((a, b) => {
      const da = parseDate(a["วันที่ซ่อม"] || a["Timestamp"]);
      const db = parseDate(b["วันที่ซ่อม"] || b["Timestamp"]);
      return db - da;
    });

  if (!records.length) {
    renderAIEmpty();
    return;
  }

  const riskData = calculateMachineRisk(records);
  const repeatData = calculateRepeatFailures(records);
  const trendData = calculateTrendInsights(records);

  renderRiskCard(riskData);
  renderRepeatCard(repeatData);
  renderTrendCard(trendData);
  renderAISummary(riskData, repeatData, trendData);
  renderRepeatTable(repeatData);
}

function renderAIEmpty() {
  if (aiRiskMachineEl) aiRiskMachineEl.textContent = "-";
  if (aiRiskScoreEl) aiRiskScoreEl.textContent = "Risk Score: -";
  if (aiRiskReasonEl) aiRiskReasonEl.textContent = "ยังไม่มีข้อมูลเพียงพอ";
  setAIPill(aiRiskLevelEl, "รอวิเคราะห์", "neutral");

  if (aiRepeatCaseEl) aiRepeatCaseEl.textContent = "-";
  if (aiRepeatCountEl) aiRepeatCountEl.textContent = "จำนวนเสียซ้ำ: -";
  if (aiRepeatReasonEl) aiRepeatReasonEl.textContent = "ยังไม่มีข้อมูลเสียซ้ำ";
  setAIPill(aiRepeatLevelEl, "รอวิเคราะห์", "neutral");

  if (aiTrendTitleEl) aiTrendTitleEl.textContent = "-";
  if (aiTrendReasonEl) aiTrendReasonEl.textContent = "ยังไม่มีข้อมูลแนวโน้มย้อนหลัง";
  setAIPill(aiTrendLevelEl, "รอวิเคราะห์", "neutral");

  if (aiSummaryListEl) {
    aiSummaryListEl.innerHTML = `<div class="ai-summary-item">ยังไม่มีข้อมูลวิเคราะห์</div>`;
  }

  if (aiRepeatTableEl) {
    aiRepeatTableEl.innerHTML = `<tr class="empty-row"><td colspan="5">ไม่พบข้อมูล</td></tr>`;
  }
}

function calculateMachineRisk(records) {
  const now = new Date();
  const day30 = 30 * 24 * 60 * 60 * 1000;
  const grouped = {};

  records.forEach(row => {
    const date = parseDate(row["วันที่ซ่อม"] || row["Timestamp"]);
    if (!date) return;

    const machineKey = `${clean(row["ชื่อเครื่องจักร"])} | ${clean(row["หมายเลขเครื่อง"])}`;
    if (!machineKey.trim() || machineKey === "|") return;

    if (!grouped[machineKey]) grouped[machineKey] = [];
    grouped[machineKey].push(row);
  });

  const machineScores = Object.entries(grouped)
    .map(([machineKey, rows]) => {
      const last30Rows = rows.filter(row => {
        const d = parseDate(row["วันที่ซ่อม"] || row["Timestamp"]);
        return d && (now - d) <= day30;
      });

      const count30 = last30Rows.length;
      const downtime30 = last30Rows.reduce(
        (sum, row) => sum + toNumber(row["เวลาสูญเสีย(นาที)"]),
        0
      );

      const tempResultCount = last30Rows.filter(row => {
        const result = clean(row["ผลหลังซ่อม"]);
        return (
          result === "ใช้งานได้ชั่วคราว" ||
          result === "ต้องติดตามต่อ" ||
          result === "รอซ่อมเพิ่มเติม"
        );
      }).length;

      const repeatPointCount = countRepeatPointProblem(last30Rows);

      const score =
        (count30 * 8) +
        (downtime30 / 15) +
        (tempResultCount * 10) +
        (repeatPointCount * 12);

      return {
        machineKey,
        count30,
        downtime30,
        tempResultCount,
        repeatPointCount,
        score: Math.round(score)
      };
    })
    .sort((a, b) => b.score - a.score);

  return machineScores[0] || null;
}

function countRepeatPointProblem(rows) {
  if (rows.length < 2) return 0;

  const sorted = [...rows].sort((a, b) => {
    const da = parseDate(a["วันที่ซ่อม"] || a["Timestamp"]);
    const db = parseDate(b["วันที่ซ่อม"] || b["Timestamp"]);
    return da - db;
  });

  let repeatCount = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    const prevKey = `${clean(prev["จุดที่เสีย"])}|${getProblemText(prev)}`;
    const currKey = `${clean(curr["จุดที่เสีย"])}|${getProblemText(curr)}`;

    const prevDate = parseDate(prev["วันที่ซ่อม"] || prev["Timestamp"]);
    const currDate = parseDate(curr["วันที่ซ่อม"] || curr["Timestamp"]);
    const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

    if (prevKey && currKey && prevKey === currKey && diffDays <= 14) {
      repeatCount++;
    }
  }

  return repeatCount;
}

function calculateRepeatFailures(records) {
  const grouped = {};

  records.forEach(row => {
    const machine = `${clean(row["ชื่อเครื่องจักร"])} | ${clean(row["หมายเลขเครื่อง"])}`;
    const point = clean(row["จุดที่เสีย"]);
    const problem = getProblemText(row);
    const date = parseDate(row["วันที่ซ่อม"] || row["Timestamp"]);

    if (!machine || machine === "|" || !point || !problem || !date) return;

    const key = `${machine}||${point}||${problem}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ row, date });
  });

  const repeatList = Object.entries(grouped)
    .map(([key, items]) => {
      const sorted = items.sort((a, b) => a.date - b.date);

      let repeatHits = 0;
      for (let i = 1; i < sorted.length; i++) {
        const diffDays = (sorted[i].date - sorted[i - 1].date) / (1000 * 60 * 60 * 24);
        if (diffDays <= 14) repeatHits++;
      }

      const [machine, point, problem] = key.split("||");
      const lastDate = sorted[sorted.length - 1].date;

      return {
        machine,
        point,
        problem,
        total: sorted.length,
        repeatHits,
        lastDate
      };
    })
    .filter(item => item.total >= 2)
    .sort((a, b) => {
      if (b.repeatHits !== a.repeatHits) return b.repeatHits - a.repeatHits;
      return b.total - a.total;
    });

  return repeatList;
}

function calculateTrendInsights(records) {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const current30 = records.filter(row => {
    const d = parseDate(row["วันที่ซ่อม"] || row["Timestamp"]);
    return d && (now - d) <= 30 * day;
  });

  const previous30 = records.filter(row => {
    const d = parseDate(row["วันที่ซ่อม"] || row["Timestamp"]);
    const diff = now - d;
    return d && diff > 30 * day && diff <= 60 * day;
  });

  const currentCount = current30.length;
  const previousCount = previous30.length;
  const currentDowntime = current30.reduce(
    (sum, row) => sum + toNumber(row["เวลาสูญเสีย(นาที)"]),
    0
  );
  const previousDowntime = previous30.reduce(
    (sum, row) => sum + toNumber(row["เวลาสูญเสีย(นาที)"]),
    0
  );

  const machineRise = compareGroupedTrend(
    current30,
    previous30,
    row => `${clean(row["ชื่อเครื่องจักร"])} | ${clean(row["หมายเลขเครื่อง"])}`
  );

  const problemRise = compareGroupedTrend(
    current30,
    previous30,
    row => getProblemText(row)
  );

  return {
    currentCount,
    previousCount,
    currentDowntime,
    previousDowntime,
    machineRise,
    problemRise
  };
}

function compareGroupedTrend(currentRows, previousRows, keyGetter) {
  const currentMap = groupRecords(currentRows, keyGetter, () => 1);
  const previousMap = groupRecords(previousRows, keyGetter, () => 1);

  const keys = new Set([
    ...Object.keys(currentMap),
    ...Object.keys(previousMap)
  ]);

  const trendList = [...keys]
    .map(key => ({
      key,
      current: currentMap[key] || 0,
      previous: previousMap[key] || 0,
      diff: (currentMap[key] || 0) - (previousMap[key] || 0)
    }))
    .filter(item => item.key && item.key !== "-" && item.key !== "|")
    .sort((a, b) => b.diff - a.diff);

  return trendList[0] || null;
}

function renderRiskCard(riskData) {
  if (!riskData) {
    if (aiRiskMachineEl) aiRiskMachineEl.textContent = "-";
    if (aiRiskScoreEl) aiRiskScoreEl.textContent = "Risk Score: -";
    if (aiRiskReasonEl) aiRiskReasonEl.textContent = "ยังไม่มีข้อมูลเพียงพอ";
    setAIPill(aiRiskLevelEl, "รอวิเคราะห์", "neutral");
    return;
  }

  const level = getRiskLevel(riskData.score);

  if (aiRiskMachineEl) aiRiskMachineEl.textContent = riskData.machineKey;
  if (aiRiskScoreEl) aiRiskScoreEl.textContent = `Risk Score: ${formatNumber(riskData.score)}`;
  if (aiRiskReasonEl) {
    aiRiskReasonEl.textContent =
      `30 วันล่าสุดเสีย ${riskData.count30} ครั้ง, Downtime ${formatNumber(riskData.downtime30)} นาที, ` +
      `ผลหลังซ่อมที่ยังน่าห่วง ${riskData.tempResultCount} ครั้ง, เสียซ้ำจุดเดิม ${riskData.repeatPointCount} ครั้ง`;
  }

  setAIPill(aiRiskLevelEl, level.text, level.tone);
}

function renderRepeatCard(repeatData) {
  if (!repeatData.length) {
    if (aiRepeatCaseEl) aiRepeatCaseEl.textContent = "-";
    if (aiRepeatCountEl) aiRepeatCountEl.textContent = "จำนวนเสียซ้ำ: -";
    if (aiRepeatReasonEl) aiRepeatReasonEl.textContent = "ยังไม่มีข้อมูลเสียซ้ำ";
    setAIPill(aiRepeatLevelEl, "รอวิเคราะห์", "neutral");
    return;
  }

  const top = repeatData[0];
  const level = getRepeatLevel(top.repeatHits, top.total);

  if (aiRepeatCaseEl) aiRepeatCaseEl.textContent = top.machine;
  if (aiRepeatCountEl) aiRepeatCountEl.textContent = `จำนวนเสียซ้ำ: ${top.repeatHits} ครั้ง`;
  if (aiRepeatReasonEl) aiRepeatReasonEl.textContent = `${top.point} | ${top.problem}`;

  setAIPill(aiRepeatLevelEl, level.text, level.tone);
}

function renderTrendCard(trendData) {
  const diffJobs = trendData.currentCount - trendData.previousCount;
  const diffDowntime = trendData.currentDowntime - trendData.previousDowntime;
  const level = getTrendLevel(diffJobs, diffDowntime);

  if (!trendData.machineRise && !trendData.problemRise) {
    if (aiTrendTitleEl) aiTrendTitleEl.textContent = "ยังไม่มีแนวโน้มเด่น";
    if (aiTrendReasonEl) {
      aiTrendReasonEl.textContent = "ข้อมูลย้อนหลังยังไม่พอสำหรับการเปรียบเทียบ";
    }
    setAIPill(aiTrendLevelEl, "รอวิเคราะห์", "neutral");
    return;
  }

  let trendText = `30 วันล่าสุด ${diffJobs >= 0 ? "งานซ่อมเพิ่มขึ้น" : "งานซ่อมลดลง"} ${Math.abs(diffJobs)} ครั้ง`;
  trendText += ` และ Downtime ${diffDowntime >= 0 ? "เพิ่มขึ้น" : "ลดลง"} ${formatNumber(Math.abs(diffDowntime))} นาที`;

  if (aiTrendTitleEl) aiTrendTitleEl.textContent = trendText;

  const machineText = trendData.machineRise && trendData.machineRise.diff > 0
    ? `เครื่องที่เพิ่มขึ้นชัดสุด: ${trendData.machineRise.key}`
    : `ยังไม่มีเครื่องที่เพิ่มขึ้นเด่นชัด`;

  const problemText = trendData.problemRise && trendData.problemRise.diff > 0
    ? `อาการที่เพิ่มขึ้นชัดสุด: ${trendData.problemRise.key}`
    : `ยังไม่มีอาการที่เพิ่มขึ้นเด่นชัด`;

  if (aiTrendReasonEl) {
    aiTrendReasonEl.textContent = `${machineText} | ${problemText}`;
  }

  setAIPill(aiTrendLevelEl, level.text, level.tone);
}

function renderAISummary(riskData, repeatData, trendData) {
  if (!aiSummaryListEl) return;

  const items = [];

  if (riskData) {
    items.push(
      `เครื่องน่าห่วงที่สุดตอนนี้คือ ${riskData.machineKey} เพราะ 30 วันล่าสุดมีงานซ่อม ${riskData.count30} ครั้ง และ Downtime สะสม ${formatNumber(riskData.downtime30)} นาที`
    );
  }

  if (repeatData.length) {
    const top = repeatData[0];
    items.push(
      `เคสเสียซ้ำที่เด่นที่สุดคือ ${top.machine} ที่จุด ${top.point} จากอาการ ${top.problem} พบทั้งหมด ${top.total} ครั้ง`
    );
  }

  const diffJobs = trendData.currentCount - trendData.previousCount;
  const diffDowntime = trendData.currentDowntime - trendData.previousDowntime;

  items.push(
    `เทียบ 30 วันล่าสุดกับ 30 วันก่อนหน้า: งานซ่อม${diffJobs >= 0 ? "เพิ่ม" : "ลด"} ${Math.abs(diffJobs)} ครั้ง และ Downtime${diffDowntime >= 0 ? "เพิ่ม" : "ลด"} ${formatNumber(Math.abs(diffDowntime))} นาที`
  );

  if (trendData.machineRise && trendData.machineRise.diff > 0) {
    items.push(
      `เครื่องที่แนวโน้มแย่ลงชัดที่สุดคือ ${trendData.machineRise.key} เพิ่มขึ้น ${trendData.machineRise.diff} ครั้ง`
    );
  }

  aiSummaryListEl.innerHTML = items
    .map(text => `<div class="ai-summary-item">${escapeHtml(text)}</div>`)
    .join("");
}

function renderRepeatTable(repeatData) {
  if (!aiRepeatTableEl) return;

  if (!repeatData.length) {
    aiRepeatTableEl.innerHTML = `<tr class="empty-row"><td colspan="5">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  aiRepeatTableEl.innerHTML = repeatData.slice(0, 10).map(item => `
    <tr>
      <td>${escapeHtml(item.machine)}</td>
      <td>${escapeHtml(item.point)}</td>
      <td>${escapeHtml(item.problem)}</td>
      <td>${formatNumber(item.total)} ครั้ง</td>
      <td>${escapeHtml(formatDisplayDate(item.lastDate))}</td>
    </tr>
  `).join("");
}

/* =========================================================
   HELPERS
========================================================= */
function getProblemText(row) {
  return clean(
    row["อาการที่เสีย"] ||
    row["อาการเสีย"] ||
    row["อาการที่พบ"] ||
    row["problem"] ||
    ""
  );
}

function groupRecords(records, keyGetter, valueGetter) {
  return records.reduce((acc, row) => {
    const key = clean(keyGetter(row) || "-");
    const value = valueGetter(row);

    if (!key || key === "-") return acc;

    acc[key] = (acc[key] || 0) + value;
    return acc;
  }, {});
}

function sumBy(records, field) {
  return records.reduce((sum, row) => sum + toNumber(row[field]), 0);
}

function getTopGroupedLabel(records, field) {
  const grouped = groupRecords(records, row => clean(row[field]), () => 1);
  const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : "";
}

function getTopGroupedLabelByFn(records, getter) {
  const grouped = groupRecords(records, row => getter(row), () => 1);
  const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : "";
}

function extractYear(value) {
  const d = parseDate(value);
  return d ? d.getFullYear() : "";
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  const text = String(value).trim();
  if (!text) return null;

  // ISO / native parse
  const nativeDate = new Date(text);
  if (!isNaN(nativeDate.getTime())) return nativeDate;

  // dd/mm/yyyy or dd/mm/yyyy hh:mm or dd/mm/2569
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*|\s+)?(\d{1,2})?:?(\d{2})?/);
  if (match) {
    let day = Number(match[1]);
    let month = Number(match[2]) - 1;
    let year = Number(match[3]);
    const hour = match[4] ? Number(match[4]) : 0;
    const minute = match[5] ? Number(match[5]) : 0;

    if (year > 2400) year -= 543; // Buddhist Era
    const d = new Date(year, month, day, hour, minute);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function formatShortDate(dateObj) {
  return dateObj.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit"
  });
}

function parseThaiDateKey(text) {
  const parts = String(text).split("/");
  if (parts.length !== 2) return 0;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  if (!day || !month) return 0;

  const year = new Date().getFullYear();
  return new Date(year, month - 1, day).getTime();
}

function formatDisplayDate(value) {
  const d = parseDate(value);
  return d ? d.toLocaleDateString("th-TH") : clean(value) || "-";
}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("th-TH").format(Number(value || 0));
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}