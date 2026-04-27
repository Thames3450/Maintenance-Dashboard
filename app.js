const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzHtghzQh5SVQcA3CmvCUHM6OPUSsOam95ex7s5N3HahS9jp1FPj_54ebTQ9jDuPAlGQA/exec";

const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const THAI_MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

const state = {
  allRecords: [],
  filteredRecords: [],
  currentPage: 1,
  pageSize: 15,
  charts: {},
  activeTab: "historyTab",
  initialized: false
};

let els = {};

window.addEventListener("error", (event) => {
  console.error("SmartFix JS Error:", event.error || event.message);
  setSystemStatus("JavaScript Error: เปิด Console ตรวจสอบ", "error");
});

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  cacheElements();
  bindEvents();
  refreshIcons();
  state.initialized = true;
  console.info("SmartFix app.js loaded successfully");
  await loadData();
}

function cacheElements() {
  els = {
    systemStatus: document.getElementById("systemStatus"),
    systemIndicatorDot: document.querySelector(".dot"),

    fromDate: document.getElementById("fromDate"),
    toDate: document.getElementById("toDate"),
    monthFilter: document.getElementById("monthFilter"),
    yearFilter: document.getElementById("yearFilter"),
    machineFilter: document.getElementById("machineFilter"),
    machineNoFilter: document.getElementById("machineNoFilter"),
    shiftFilter: document.getElementById("shiftFilter"),
    resultFilter: document.getElementById("resultFilter"),
    keywordFilter: document.getElementById("keywordFilter"),
    resetFilterBtn: document.getElementById("resetFilterBtn"),
    thisMonthBtn: document.getElementById("thisMonthBtn"),
    todayRangeBtn: document.getElementById("todayRangeBtn"),
    toggleFilterBtn: document.getElementById("toggleFilterBtn"),
    filterContent: document.getElementById("filterContent"),

    tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
    tabPanels: Array.from(document.querySelectorAll(".tab-panel")),

    kpiTotalJobs: document.getElementById("kpiTotalJobs"),
    kpiTotalDowntime: document.getElementById("kpiTotalDowntime"),
    kpiAvgDowntime: document.getElementById("kpiAvgDowntime"),
    kpiMachines: document.getElementById("kpiMachines"),
    kpiTopProblem: document.getElementById("kpiTopProblem"),
    kpiTopPoint: document.getElementById("kpiTopPoint"),

    topProblemTable: document.getElementById("topProblemTable"),
    topPointTable: document.getElementById("topPointTable"),
    topMachineDowntimeTable: document.getElementById("topMachineDowntimeTable"),

    aiRiskMachine: document.getElementById("aiRiskMachine"),
    aiRiskScore: document.getElementById("aiRiskScore"),
    aiRiskReason: document.getElementById("aiRiskReason"),
    aiRiskLevel: document.getElementById("aiRiskLevel"),
    aiRepeatCase: document.getElementById("aiRepeatCase"),
    aiRepeatCount: document.getElementById("aiRepeatCount"),
    aiRepeatReason: document.getElementById("aiRepeatReason"),
    aiRepeatLevel: document.getElementById("aiRepeatLevel"),
    aiTrendTitle: document.getElementById("aiTrendTitle"),
    aiTrendReason: document.getElementById("aiTrendReason"),
    aiTrendLevel: document.getElementById("aiTrendLevel"),
    aiSummaryList: document.getElementById("aiSummaryList"),
    aiRepeatTable: document.getElementById("aiRepeatTable"),

    tableCountText: document.getElementById("tableCountText"),
    historyTableBody: document.getElementById("historyTableBody"),
    prevPageBtn: document.getElementById("prevPageBtn"),
    nextPageBtn: document.getElementById("nextPageBtn"),
    pageInfo: document.getElementById("pageInfo"),

    detailModal: document.getElementById("detailModal"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    modalContent: document.getElementById("modalContent"),

    plannedHoursInput: document.getElementById("plannedHoursInput"),
    targetAvailabilityInput: document.getElementById("targetAvailabilityInput"),
    targetMtbfInput: document.getElementById("targetMtbfInput"),
    targetMttrInput: document.getElementById("targetMttrInput"),
    performancePeriodInfo: document.getElementById("performancePeriodInfo"),
    perfAvgAvailability: document.getElementById("perfAvgAvailability"),
    perfAvgMtbf: document.getElementById("perfAvgMtbf"),
    perfAvgMttr: document.getElementById("perfAvgMttr"),
    perfTotalFailures: document.getElementById("perfTotalFailures"),
    perfTotalDowntime: document.getElementById("perfTotalDowntime"),
    perfWorstMachine: document.getElementById("perfWorstMachine"),
    performanceInsightList: document.getElementById("performanceInsightList"),
    performanceTableBody: document.getElementById("performanceTableBody"),
    performanceRankingTable: document.getElementById("performanceRankingTable"),
    performanceRepeatTable: document.getElementById("performanceRepeatTable"),
    targetCheckList: document.getElementById("targetCheckList")
  };
}

function bindEvents() {
  const filterEvents = [
    els.fromDate,
    els.toDate,
    els.monthFilter,
    els.yearFilter,
    els.machineNoFilter,
    els.shiftFilter,
    els.resultFilter
  ];

  filterEvents.forEach(el => el?.addEventListener("change", applyFilters));
  els.keywordFilter?.addEventListener("input", debounce(applyFilters, 180));
  els.machineFilter?.addEventListener("change", handleMachineFilterChange);

  els.resetFilterBtn?.addEventListener("click", resetFilters);
  els.thisMonthBtn?.addEventListener("click", () => {
    clearDateRange();
    setThisMonth();
    applyFilters();
  });
  els.todayRangeBtn?.addEventListener("click", () => {
    setTodayRange();
    applyFilters();
  });
  els.toggleFilterBtn?.addEventListener("click", toggleFilterPanel);

  els.prevPageBtn?.addEventListener("click", goPrevPage);
  els.nextPageBtn?.addEventListener("click", goNextPage);

  els.closeModalBtn?.addEventListener("click", closeModal);
  els.detailModal?.addEventListener("click", (event) => {
    if (event.target === els.detailModal) closeModal();
  });

  els.tabButtons.forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  [els.plannedHoursInput, els.targetAvailabilityInput, els.targetMtbfInput, els.targetMttrInput].forEach(el => {
    el?.addEventListener("input", renderPerformance);
  });
}

async function loadData() {
  try {
    setSystemStatus("กำลังโหลดข้อมูล...", "warning");

    const url = `${WEB_APP_URL}?action=history&_=${Date.now()}`;
    const response = await fetch(url, { method: "GET", cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    const rows = Array.isArray(result.history)
      ? result.history
      : Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.records)
          ? result.records
          : [];

    if (result.success === false) {
      throw new Error(result.message || "Apps Script returned success=false");
    }

    state.allRecords = normalizeRecords(rows);
    sortRecordsLatestFirst(state.allRecords);

    populateYearFilter();
    populateMachineFilter();
    setThisMonth();
    applyFilters();

    setSystemStatus(`พร้อมใช้งาน • โหลด ${formatNumber(state.allRecords.length)} รายการ`, "success");
  } catch (error) {
    console.error("Load data failed:", error);
    state.allRecords = [];
    state.filteredRecords = [];
    populateYearFilter();
    populateMachineFilter();
    renderAll();
    setSystemStatus("เชื่อมต่อข้อมูลไม่ได้ แต่เมนูยังใช้งานได้", "error");
    renderTableEmpty("เชื่อมต่อ Google Sheets ไม่สำเร็จ กรุณาตรวจสอบ WEB_APP_URL / Permission / Deploy Apps Script");
  }
}

function setSystemStatus(text, type = "warning") {
  if (els.systemStatus) els.systemStatus.textContent = text;
  if (!els.systemIndicatorDot) return;

  const color = type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#f59e0b";
  els.systemIndicatorDot.style.background = color;
}

function refreshIcons() {
  try {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  } catch (error) {
    console.warn("lucide.createIcons failed", error);
  }
}

function toggleFilterPanel() {
  if (!els.filterContent || !els.toggleFilterBtn) return;
  const collapsed = els.filterContent.classList.toggle("collapsed");
  els.toggleFilterBtn.innerHTML = `
    <i data-lucide="${collapsed ? "chevron-down" : "chevron-up"}"></i>
    <span>${collapsed ? "แสดงตัวกรอง" : "ซ่อนตัวกรอง"}</span>
  `;
  refreshIcons();
}

function switchTab(tabId) {
  state.activeTab = tabId;

  els.tabButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  els.tabPanels.forEach(panel => {
    panel.classList.toggle("active", panel.id === tabId);
  });

  setTimeout(resizeCharts, 80);
}

function normalizeRecords(rows) {
  return rows.map(row => {
    if (!row || typeof row !== "object") return {};
    return { ...row };
  });
}

function sortRecordsLatestFirst(records) {
  records.sort((a, b) => {
    const da = getRecordDate(a);
    const db = getRecordDate(b);
    return (db?.getTime() || 0) - (da?.getTime() || 0);
  });
}

function populateYearFilter() {
  if (!els.yearFilter) return;
  const currentYear = new Date().getFullYear();
  const years = unique(state.allRecords.map(row => getRecordDate(row)?.getFullYear()).filter(Boolean));
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort((a, b) => b - a);
  els.yearFilter.innerHTML = '<option value="">-- ทั้งหมด --</option>';
  years.forEach(year => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    els.yearFilter.appendChild(option);
  });
}

function populateMachineFilter() {
  if (!els.machineFilter) return;
  const machines = unique(state.allRecords.map(row => getMachine(row)).filter(Boolean))
    .sort((a, b) => a.localeCompare(b, "th"));
  els.machineFilter.innerHTML = '<option value="">-- ทั้งหมด --</option>';
  machines.forEach(machine => {
    const option = document.createElement("option");
    option.value = machine;
    option.textContent = machine;
    els.machineFilter.appendChild(option);
  });
}

function populateMachineNoFilter(selectedMachine) {
  if (!els.machineNoFilter) return;
  els.machineNoFilter.innerHTML = '<option value="">-- ทั้งหมด --</option>';

  if (!selectedMachine) {
    els.machineNoFilter.disabled = true;
    return;
  }

  const machineNos = unique(
    state.allRecords
      .filter(row => getMachine(row) === selectedMachine)
      .map(row => getMachineNo(row))
      .filter(Boolean)
  ).sort((a, b) => a.localeCompare(b, "th"));

  machineNos.forEach(no => {
    const option = document.createElement("option");
    option.value = no;
    option.textContent = no;
    els.machineNoFilter.appendChild(option);
  });

  els.machineNoFilter.disabled = false;
}

function handleMachineFilterChange() {
  populateMachineNoFilter(els.machineFilter?.value || "");
  if (els.machineNoFilter) els.machineNoFilter.value = "";
  applyFilters();
}

function setThisMonth() {
  const now = new Date();
  if (els.monthFilter) els.monthFilter.value = String(now.getMonth() + 1);
  if (els.yearFilter) els.yearFilter.value = String(now.getFullYear());
}

function setTodayRange() {
  const today = formatDateInput(new Date());
  if (els.fromDate) els.fromDate.value = today;
  if (els.toDate) els.toDate.value = today;
  if (els.monthFilter) els.monthFilter.value = "";
  if (els.yearFilter) els.yearFilter.value = "";
}

function clearDateRange() {
  if (els.fromDate) els.fromDate.value = "";
  if (els.toDate) els.toDate.value = "";
}

function resetFilters() {
  if (els.fromDate) els.fromDate.value = "";
  if (els.toDate) els.toDate.value = "";
  if (els.monthFilter) els.monthFilter.value = "";
  if (els.yearFilter) els.yearFilter.value = "";
  if (els.machineFilter) els.machineFilter.value = "";
  if (els.machineNoFilter) {
    els.machineNoFilter.innerHTML = '<option value="">-- ทั้งหมด --</option>';
    els.machineNoFilter.disabled = true;
  }
  if (els.shiftFilter) els.shiftFilter.value = "";
  if (els.resultFilter) els.resultFilter.value = "";
  if (els.keywordFilter) els.keywordFilter.value = "";
  applyFilters();
}

function applyFilters() {
  const month = els.monthFilter?.value || "";
  const year = els.yearFilter?.value || "";
  const fromDate = els.fromDate?.value || "";
  const toDate = els.toDate?.value || "";
  const machine = els.machineFilter?.value || "";
  const machineNo = els.machineNoFilter?.value || "";
  const shift = els.shiftFilter?.value || "";
  const result = els.resultFilter?.value || "";
  const keyword = clean(els.keywordFilter?.value).toLowerCase();

  state.filteredRecords = state.allRecords.filter(row => {
    const rowDate = getRecordDate(row);
    const rowMonth = rowDate ? String(rowDate.getMonth() + 1) : "";
    const rowYear = rowDate ? String(rowDate.getFullYear()) : "";
    const rowDateText = rowDate ? formatDateInput(rowDate) : "";

    if (fromDate || toDate) {
      if (!rowDateText) return false;
      if (fromDate && rowDateText < fromDate) return false;
      if (toDate && rowDateText > toDate) return false;
    } else {
      if (month && rowMonth !== month) return false;
      if (year && rowYear !== year) return false;
    }

    if (machine && getMachine(row) !== machine) return false;
    if (machineNo && getMachineNo(row) !== machineNo) return false;
    if (shift && getShift(row) !== shift) return false;
    if (result && getResult(row) !== result) return false;

    if (keyword) {
      const base = [
        getMachine(row), getMachineNo(row), getLine(row), getPoint(row), getProblem(row),
        getCause(row), getAction(row), getTechnician(row), getRemark(row), getType(row), getSpare(row)
      ].join(" ").toLowerCase();
      if (!base.includes(keyword)) return false;
    }

    return true;
  });

  state.currentPage = 1;
  renderAll();
}

function renderAll() {
  renderHistory();
  renderDashboard();
  renderPerformance();
  refreshIcons();
}

function renderHistory() {
  renderTable();
  renderPagination();
}

function renderTable() {
  if (!els.historyTableBody || !els.tableCountText) return;

  if (!state.filteredRecords.length) {
    renderTableEmpty("ไม่พบข้อมูลตามเงื่อนไขที่เลือก");
    els.tableCountText.textContent = "พบ 0 รายการ";
    return;
  }

  const startIndex = (state.currentPage - 1) * state.pageSize;
  const rows = state.filteredRecords.slice(startIndex, startIndex + state.pageSize);

  els.historyTableBody.innerHTML = rows.map((row, index) => {
    const rowIndex = startIndex + index;
    return `
      <tr>
        <td>${escapeHtml(formatDisplayDate(getRecordDate(row)))}</td>
        <td>${escapeHtml(getMachine(row))}</td>
        <td>${escapeHtml(getMachineNo(row))}</td>
        <td>${escapeHtml(getLine(row))}</td>
        <td>${escapeHtml(getPoint(row))}</td>
        <td>${escapeHtml(getProblem(row))}</td>
        <td>${formatNumber(getDowntimeMin(row))} นาที</td>
        <td>${escapeHtml(getTechnician(row))}</td>
        <td>${renderResultBadge(getResult(row))}</td>
        <td><button class="btn-detail" type="button" onclick="openDetailByIndex(${rowIndex})">ดูรายละเอียด</button></td>
      </tr>
    `;
  }).join("");

  els.tableCountText.textContent = `พบ ${formatNumber(state.filteredRecords.length)} รายการ`;
}

function renderTableEmpty(message) {
  if (!els.historyTableBody) return;
  els.historyTableBody.innerHTML = `<tr><td colspan="10" class="empty-cell">${escapeHtml(message)}</td></tr>`;
}

function renderPagination() {
  if (!els.pageInfo || !els.prevPageBtn || !els.nextPageBtn) return;
  const totalPages = Math.max(1, Math.ceil(state.filteredRecords.length / state.pageSize));
  els.pageInfo.textContent = `หน้า ${state.currentPage} / ${totalPages}`;
  els.prevPageBtn.disabled = state.currentPage <= 1;
  els.nextPageBtn.disabled = state.currentPage >= totalPages;
}

function goPrevPage() {
  if (state.currentPage <= 1) return;
  state.currentPage -= 1;
  renderHistory();
}

function goNextPage() {
  const totalPages = Math.max(1, Math.ceil(state.filteredRecords.length / state.pageSize));
  if (state.currentPage >= totalPages) return;
  state.currentPage += 1;
  renderHistory();
}

function renderResultBadge(text) {
  const value = text || "-";
  if (value === "ใช้งานได้ปกติ") return `<span class="badge green">${escapeHtml(value)}</span>`;
  if (["ใช้งานได้ชั่วคราว", "ต้องติดตามต่อ", "รอซ่อมเพิ่มเติม"].includes(value)) return `<span class="badge orange">${escapeHtml(value)}</span>`;
  return `<span class="badge blue">${escapeHtml(value)}</span>`;
}

window.openDetailByIndex = function(index) {
  const row = state.filteredRecords[index];
  if (!row || !els.modalContent || !els.detailModal) return;

  els.modalContent.innerHTML = `
    <div class="detail-grid">
      ${detailItem("วันที่ซ่อม", formatDisplayDate(getRecordDate(row)))}
      ${detailItem("กะ", getShift(row))}
      ${detailItem("ชื่อเครื่องจักร", getMachine(row))}
      ${detailItem("หมายเลขเครื่อง", getMachineNo(row))}
      ${detailItem("ไลน์ผลิต", getLine(row))}
      ${detailItem("จุดที่เสีย", getPoint(row))}
      ${detailItem("อาการที่เสีย", getProblem(row))}
      ${detailItem("ประเภทงานเสีย", getType(row))}
      ${detailItem("สาเหตุ", getCause(row), true)}
      ${detailItem("การแก้ไข", getAction(row), true)}
      ${detailItem("Downtime (นาที)", formatNumber(getDowntimeMin(row)))}
      ${detailItem("ผลหลังซ่อม", getResult(row))}
      ${detailItem("ชื่อช่าง", getTechnician(row))}
      ${detailItem("รหัสพนักงาน", getEmployeeId(row))}
      ${detailItem("อะไหล่ที่ใช้", getSpare(row), true)}
      ${detailItem("เวลาเริ่มซ่อม", getStartTime(row))}
      ${detailItem("เวลาซ่อมเสร็จ", getEndTime(row))}
      ${detailItem("หมายเหตุ", getRemark(row), true)}
    </div>
  `;

  els.detailModal.classList.add("show");
  refreshIcons();
};

function closeModal() {
  els.detailModal?.classList.remove("show");
}

function detailItem(label, value, full = false) {
  return `
    <div class="detail-item ${full ? "full" : ""}">
      <div class="detail-label">${escapeHtml(label)}</div>
      <div class="detail-value">${escapeHtml(value || "-")}</div>
    </div>
  `;
}

function renderDashboard() {
  renderKpis();
  renderCharts();
  renderTopTables();
  renderAIInsights();
}

function renderKpis() {
  const records = state.filteredRecords;
  const totalJobs = records.length;
  const totalDowntime = records.reduce((sum, row) => sum + getDowntimeMin(row), 0);
  const avgDowntime = totalJobs ? totalDowntime / totalJobs : 0;
  const machineKeys = new Set(records.map(row => machineKey(row)).filter(Boolean));
  const topProblem = topGroupedLabelByFn(records, getProblem);
  const topPoint = topGroupedLabelByFn(records, getPoint);

  setText(els.kpiTotalJobs, formatNumber(totalJobs));
  setText(els.kpiTotalDowntime, formatNumber(totalDowntime));
  setText(els.kpiAvgDowntime, formatDecimal(avgDowntime, 1));
  setText(els.kpiMachines, formatNumber(machineKeys.size));
  setText(els.kpiTopProblem, topProblem || "-");
  setText(els.kpiTopPoint, topPoint || "-");
}

function renderCharts() {
  renderMachineDowntimeChart();
  renderPointChart();
  renderDailyTrendChart();
  renderTypeChart();
  renderProblemChart();
}

function renderMachineDowntimeChart() {
  const entries = groupedEntries(state.filteredRecords, machineLabel, getDowntimeMin)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  createChart("machineDowntimeChart", "bar", {
    labels: entries.map(item => item.label),
    datasets: [{ label: "Downtime (นาที)", data: entries.map(item => item.value), backgroundColor: "rgba(37, 99, 235, 0.75)", borderRadius: 8 }]
  }, basicBarOptions(false));
}

function renderPointChart() {
  const entries = groupedEntries(state.filteredRecords, getPoint, () => 1)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  createChart("pointChart", "bar", {
    labels: entries.map(item => item.label),
    datasets: [{ label: "จำนวนครั้ง", data: entries.map(item => item.value), backgroundColor: "rgba(239, 68, 68, 0.75)", borderRadius: 8 }]
  }, { ...basicBarOptions(false), indexAxis: "y", scales: { x: { beginAtZero: true } } });
}

function renderDailyTrendChart() {
  const grouped = {};
  state.filteredRecords.forEach(row => {
    const d = getRecordDate(row);
    if (!d) return;
    const key = formatDateInput(d);
    if (!grouped[key]) grouped[key] = 0;
    grouped[key] += getDowntimeMin(row);
  });

  const entries = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ label: formatShortDate(parseDate(key)), value }));

  createChart("dailyTrendChart", "line", {
    labels: entries.map(item => item.label),
    datasets: [{ label: "Downtime (นาที)", data: entries.map(item => item.value), borderColor: "rgba(16, 185, 129, 1)", backgroundColor: "rgba(16, 185, 129, 0.16)", fill: true, tension: 0.32, pointRadius: 3 }]
  }, lineOptions(true));
}

function renderTypeChart() {
  const entries = groupedEntries(state.filteredRecords, getType, () => 1)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  createChart("typeChart", "doughnut", {
    labels: entries.map(item => item.label),
    datasets: [{ data: entries.map(item => item.value), backgroundColor: ["#2563eb", "#ef4444", "#f59e0b", "#10b981", "#7c3aed", "#475569"] }]
  }, { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } });
}

function renderProblemChart() {
  const entries = groupedEntries(state.filteredRecords, getProblem, () => 1)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  createChart("problemChart", "bar", {
    labels: entries.map(item => item.label),
    datasets: [{ label: "จำนวนครั้ง", data: entries.map(item => item.value), backgroundColor: "rgba(124, 58, 237, 0.75)", borderRadius: 8 }]
  }, basicBarOptions(false));
}

function renderTopTables() {
  const topProblems = groupedEntries(state.filteredRecords, getProblem, () => 1).sort((a, b) => b.value - a.value).slice(0, 5);
  const topPoints = groupedEntries(state.filteredRecords, getPoint, () => 1).sort((a, b) => b.value - a.value).slice(0, 5);
  const topMachines = groupedEntries(state.filteredRecords, machineLabel, getDowntimeMin).sort((a, b) => b.value - a.value).slice(0, 5);

  renderMiniTable(els.topProblemTable, topProblems, "ครั้ง");
  renderMiniTable(els.topPointTable, topPoints, "ครั้ง");
  renderMiniTable(els.topMachineDowntimeTable, topMachines, "นาที");
}

function renderMiniTable(targetEl, entries, unit) {
  if (!targetEl) return;
  if (!entries.length) {
    targetEl.innerHTML = `<tr class="empty-row"><td colspan="2">ไม่พบข้อมูล</td></tr>`;
    return;
  }
  targetEl.innerHTML = entries.map(item => `
    <tr><td>${escapeHtml(item.label)}</td><td>${formatNumber(item.value)} ${unit}</td></tr>
  `).join("");
}

function renderAIInsights() {
  const records = [...state.filteredRecords].filter(getRecordDate).sort((a, b) => getRecordDate(b) - getRecordDate(a));
  if (!records.length) return renderAIEmpty();

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
  setText(els.aiRiskMachine, "-");
  setText(els.aiRiskScore, "Risk Score: -");
  setText(els.aiRiskReason, "ยังไม่มีข้อมูลเพียงพอ");
  setAIPill(els.aiRiskLevel, "รอวิเคราะห์", "neutral");

  setText(els.aiRepeatCase, "-");
  setText(els.aiRepeatCount, "จำนวนเสียซ้ำ: -");
  setText(els.aiRepeatReason, "ยังไม่มีข้อมูลเสียซ้ำ");
  setAIPill(els.aiRepeatLevel, "รอวิเคราะห์", "neutral");

  setText(els.aiTrendTitle, "-");
  setText(els.aiTrendReason, "ยังไม่มีข้อมูลแนวโน้มย้อนหลัง");
  setAIPill(els.aiTrendLevel, "รอวิเคราะห์", "neutral");

  if (els.aiSummaryList) els.aiSummaryList.innerHTML = `<div class="ai-summary-item">ยังไม่มีข้อมูลวิเคราะห์</div>`;
  if (els.aiRepeatTable) els.aiRepeatTable.innerHTML = `<tr class="empty-row"><td colspan="5">ไม่พบข้อมูล</td></tr>`;
}

function calculateMachineRisk(records) {
  const now = new Date();
  const day30 = 30 * 24 * 60 * 60 * 1000;
  const grouped = groupBy(records, machineLabel);

  return Object.entries(grouped).map(([label, rows]) => {
    const last30Rows = rows.filter(row => {
      const d = getRecordDate(row);
      return d && (now - d) <= day30;
    });
    const count30 = last30Rows.length;
    const downtime30 = last30Rows.reduce((sum, row) => sum + getDowntimeMin(row), 0);
    const followCount = last30Rows.filter(row => ["ใช้งานได้ชั่วคราว", "ต้องติดตามต่อ", "รอซ่อมเพิ่มเติม"].includes(getResult(row))).length;
    const repeatPointCount = countRepeatPointProblem(last30Rows);
    const score = Math.round((count30 * 8) + (downtime30 / 15) + (followCount * 10) + (repeatPointCount * 12));
    return { label, count30, downtime30, followCount, repeatPointCount, score };
  }).sort((a, b) => b.score - a.score)[0] || null;
}

function countRepeatPointProblem(rows) {
  const sorted = [...rows].sort((a, b) => getRecordDate(a) - getRecordDate(b));
  let count = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevKey = `${getPoint(prev)}|${getProblem(prev)}`;
    const currKey = `${getPoint(curr)}|${getProblem(curr)}`;
    const diffDays = (getRecordDate(curr) - getRecordDate(prev)) / 86400000;
    if (prevKey === currKey && diffDays <= 14) count++;
  }
  return count;
}

function calculateRepeatFailures(records) {
  const grouped = {};
  records.forEach(row => {
    const key = `${machineLabel(row)}||${getPoint(row)}||${getProblem(row)}`;
    const date = getRecordDate(row);
    if (!date || key.includes("ไม่ระบุ")) return;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ row, date });
  });

  return Object.entries(grouped).map(([key, items]) => {
    const sorted = items.sort((a, b) => a.date - b.date);
    let repeatHits = 0;
    for (let i = 1; i < sorted.length; i++) {
      const diffDays = (sorted[i].date - sorted[i - 1].date) / 86400000;
      if (diffDays <= 14) repeatHits++;
    }
    const [machine, point, problem] = key.split("||");
    return { machine, point, problem, total: sorted.length, repeatHits, lastDate: sorted[sorted.length - 1].date };
  }).filter(item => item.total >= 2).sort((a, b) => b.repeatHits - a.repeatHits || b.total - a.total);
}

function calculateTrendInsights(records) {
  const now = new Date();
  const day = 86400000;
  const current30 = records.filter(row => {
    const d = getRecordDate(row);
    return d && (now - d) <= 30 * day;
  });
  const previous30 = records.filter(row => {
    const d = getRecordDate(row);
    return d && (now - d) > 30 * day && (now - d) <= 60 * day;
  });
  const currentJobs = current30.length;
  const previousJobs = previous30.length;
  const currentDowntime = current30.reduce((sum, row) => sum + getDowntimeMin(row), 0);
  const previousDowntime = previous30.reduce((sum, row) => sum + getDowntimeMin(row), 0);
  return { currentJobs, previousJobs, currentDowntime, previousDowntime, diffJobs: currentJobs - previousJobs, diffDowntime: currentDowntime - previousDowntime };
}

function renderRiskCard(data) {
  if (!data) return renderAIEmpty();
  const level = data.score >= 80 ? { text: "วิกฤต", tone: "danger" } : data.score >= 45 ? { text: "เฝ้าระวัง", tone: "warn" } : { text: "ปกติ", tone: "good" };
  setText(els.aiRiskMachine, data.label);
  setText(els.aiRiskScore, `Risk Score: ${formatNumber(data.score)}`);
  setText(els.aiRiskReason, `30 วันล่าสุดเสีย ${data.count30} ครั้ง, Downtime ${formatNumber(data.downtime30)} นาที, งานที่ต้องติดตาม ${data.followCount} ครั้ง`);
  setAIPill(els.aiRiskLevel, level.text, level.tone);
}

function renderRepeatCard(list) {
  const top = list[0];
  if (!top) {
    setText(els.aiRepeatCase, "-");
    setText(els.aiRepeatCount, "จำนวนเสียซ้ำ: -");
    setText(els.aiRepeatReason, "ยังไม่พบข้อมูลเสียซ้ำ");
    setAIPill(els.aiRepeatLevel, "ปกติ", "good");
    return;
  }
  const level = top.repeatHits >= 2 || top.total >= 4 ? { text: "เสียซ้ำมาก", tone: "danger" } : { text: "ควรติดตาม", tone: "warn" };
  setText(els.aiRepeatCase, `${top.machine} • ${top.point}`);
  setText(els.aiRepeatCount, `จำนวนเสียซ้ำ: ${formatNumber(top.total)} ครั้ง`);
  setText(els.aiRepeatReason, `อาการหลัก: ${top.problem} / พบซ้ำใน 14 วัน ${top.repeatHits} ครั้ง`);
  setAIPill(els.aiRepeatLevel, level.text, level.tone);
}

function renderTrendCard(data) {
  const level = data.diffJobs > 0 || data.diffDowntime > 0 ? { text: "แย่ลง", tone: "danger" } : data.diffJobs === 0 && data.diffDowntime === 0 ? { text: "ทรงตัว", tone: "neutral" } : { text: "ดีขึ้น", tone: "good" };
  setText(els.aiTrendTitle, `30 วันล่าสุดเทียบ 30 วันก่อนหน้า`);
  setText(els.aiTrendReason, `จำนวนงานเปลี่ยน ${formatSigned(data.diffJobs)} ครั้ง, Downtime เปลี่ยน ${formatSigned(data.diffDowntime)} นาที`);
  setAIPill(els.aiTrendLevel, level.text, level.tone);
}

function renderAISummary(riskData, repeatData, trendData) {
  if (!els.aiSummaryList) return;
  const items = [];
  if (riskData) items.push(`ควรโฟกัสเครื่อง ${riskData.label} ก่อน เพราะมี Risk Score สูงสุด (${riskData.score})`);
  if (repeatData[0]) items.push(`พบปัญหาเสียซ้ำที่ ${repeatData[0].machine} จุด ${repeatData[0].point} อาการ ${repeatData[0].problem}`);
  items.push(`แนวโน้มล่าสุด: งานซ่อม ${formatSigned(trendData.diffJobs)} ครั้ง และ Downtime ${formatSigned(trendData.diffDowntime)} นาที`);
  els.aiSummaryList.innerHTML = items.map(text => `<div class="ai-summary-item">${escapeHtml(text)}</div>`).join("");
}

function renderRepeatTable(list) {
  if (!els.aiRepeatTable) return;
  if (!list.length) {
    els.aiRepeatTable.innerHTML = `<tr class="empty-row"><td colspan="5">ไม่พบข้อมูล</td></tr>`;
    return;
  }
  els.aiRepeatTable.innerHTML = list.slice(0, 8).map(item => `
    <tr>
      <td>${escapeHtml(item.machine)}</td>
      <td>${escapeHtml(item.point)}</td>
      <td>${escapeHtml(item.problem)}</td>
      <td>${formatNumber(item.total)} ครั้ง</td>
      <td>${escapeHtml(formatDisplayDate(item.lastDate))}</td>
    </tr>
  `).join("");
}

function setAIPill(el, text, tone) {
  if (!el) return;
  el.textContent = text;
  el.className = `ai-pill ${tone}`;
}

function renderPerformance() {
  const targets = getTargets();
  const plannedHours = getPlannedHoursForPerformance();
  const rows = calculatePerformanceRows(state.filteredRecords, plannedHours, targets);
  const monthlyRows = calculateMonthlyPerformanceRows(state.filteredRecords, targets);
  const repeatList = calculateRepeatFailures(state.filteredRecords);

  renderPerformanceKpis(rows);
  renderPerformanceInsights(rows, plannedHours, targets);
  renderPerformanceTable(rows);
  renderPerformanceCharts(rows, monthlyRows, targets);
  renderPerformanceRanking(rows);
  renderPerformanceRepeatTable(repeatList);
  renderTargetCheck(rows, targets);
}

function getTargets() {
  return {
    availability: toNumber(els.targetAvailabilityInput?.value) || 95,
    mtbf: toNumber(els.targetMtbfInput?.value) || 100,
    mttr: toNumber(els.targetMttrInput?.value) || 37
  };
}

function getPlannedHoursForPerformance() {
  const manualHours = toNumber(els.plannedHoursInput?.value);
  if (manualHours > 0) {
    setText(els.performancePeriodInfo, `ใช้ Planned Time จากที่กำหนดเอง = ${formatNumber(manualHours)} ชั่วโมง/เครื่อง`);
    return manualHours;
  }

  const fromDate = els.fromDate?.value || "";
  const toDate = els.toDate?.value || "";
  const month = els.monthFilter?.value || "";
  const year = els.yearFilter?.value || "";

  if (fromDate && toDate) {
    const start = parseDate(fromDate);
    const end = parseDate(toDate);
    if (start && end && end >= start) {
      const days = Math.floor((end - start) / 86400000) + 1;
      const hours = days * 24;
      setText(els.performancePeriodInfo, `ช่วงวันที่ที่เลือก ${days} วัน × 24 ชั่วโมง = ${formatNumber(hours)} ชั่วโมง/เครื่อง`);
      return hours;
    }
  }

  const now = new Date();
  const useMonth = Number(month || (now.getMonth() + 1));
  const useYear = Number(year || now.getFullYear());
  const days = new Date(useYear, useMonth, 0).getDate();
  const hours = days * 24;
  setText(els.performancePeriodInfo, `เดือนที่เลือกมี ${days} วัน × 24 ชั่วโมง = ${formatNumber(hours)} ชั่วโมง/เครื่อง`);
  return hours;
}

function calculatePerformanceRows(records, plannedHours, targets) {
  const grouped = groupBy(records, row => `${getMachine(row)}||${getMachineNo(row)}`);

  return Object.entries(grouped).filter(([key]) => key !== "||").map(([key, rows]) => {
    const [machineRaw, machineNoRaw] = key.split("||");
    const machine = machineRaw || "ไม่ระบุ";
    const machineNo = machineNoRaw || "ไม่ระบุ";
    const failureCount = rows.length;
    const downtimeMin = rows.reduce((sum, row) => sum + getDowntimeMin(row), 0);
    const downtimeHr = downtimeMin / 60;
    const uptimeHr = Math.max(plannedHours - downtimeHr, 0);
    const availability = plannedHours > 0 ? (uptimeHr / plannedHours) * 100 : 0;
    const mtbfHr = failureCount > 0 ? uptimeHr / failureCount : plannedHours;
    const mttrMin = failureCount > 0 ? downtimeMin / failureCount : 0;
    const topPoint = topGroupedLabelByFn(rows, getPoint) || "-";
    const topProblem = topGroupedLabelByFn(rows, getProblem) || "-";
    const status = getPerformanceStatus(availability, mtbfHr, mttrMin, failureCount, downtimeHr, targets);
    const priorityScore = getPriorityScore(availability, mtbfHr, mttrMin, failureCount, downtimeHr, targets);

    return { machine, machineNo, label: `${machine} | ${machineNo}`, plannedHours, failureCount, downtimeMin, downtimeHr, uptimeHr, availability, mtbfHr, mttrMin, topPoint, topProblem, status, priorityScore };
  }).sort((a, b) => b.priorityScore - a.priorityScore || a.availability - b.availability);
}

function calculateMonthlyPerformanceRows(records, targets) {
  const grouped = groupBy(records.filter(getRecordDate), row => {
    const d = getRecordDate(row);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  return Object.entries(grouped).map(([key, rows]) => {
    const [yearText, monthText] = key.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    const days = new Date(year, month, 0).getDate();
    const plannedHoursPerMachine = days * 24;
    const machineCount = Math.max(unique(rows.map(machineLabel)).length, 1);
    const plannedHours = plannedHoursPerMachine * machineCount;
    const failureCount = rows.length;
    const downtimeMin = rows.reduce((sum, row) => sum + getDowntimeMin(row), 0);
    const downtimeHr = downtimeMin / 60;
    const uptimeHr = Math.max(plannedHours - downtimeHr, 0);
    const availability = plannedHours > 0 ? (uptimeHr / plannedHours) * 100 : 0;
    const mtbfHr = failureCount > 0 ? uptimeHr / failureCount : plannedHours;
    const mttrMin = failureCount > 0 ? downtimeMin / failureCount : 0;

    return { key, year, month, label: `${THAI_MONTHS_SHORT[month - 1]} ${year}`, plannedHours, failureCount, downtimeMin, downtimeHr, uptimeHr, availability, mtbfHr, mttrMin, status: getPerformanceStatus(availability, mtbfHr, mttrMin, failureCount, downtimeHr, targets) };
  }).sort((a, b) => a.key.localeCompare(b.key));
}

function renderPerformanceKpis(rows) {
  if (!rows.length) {
    setText(els.perfAvgAvailability, "0%");
    setText(els.perfAvgMtbf, "0 ชม.");
    setText(els.perfAvgMttr, "0 นาที");
    setText(els.perfTotalFailures, "0");
    setText(els.perfTotalDowntime, "0 ชม.");
    setText(els.perfWorstMachine, "-");
    return;
  }

  const avgAvailability = average(rows.map(row => row.availability));
  const avgMtbf = average(rows.map(row => row.mtbfHr));
  const avgMttr = average(rows.map(row => row.mttrMin));
  const totalFailures = rows.reduce((sum, row) => sum + row.failureCount, 0);
  const totalDowntimeHr = rows.reduce((sum, row) => sum + row.downtimeHr, 0);
  const worst = [...rows].sort((a, b) => b.priorityScore - a.priorityScore)[0];

  setText(els.perfAvgAvailability, `${formatDecimal(avgAvailability, 1)}%`);
  setText(els.perfAvgMtbf, `${formatDecimal(avgMtbf, 1)} ชม.`);
  setText(els.perfAvgMttr, `${formatDecimal(avgMttr, 1)} นาที`);
  setText(els.perfTotalFailures, formatNumber(totalFailures));
  setText(els.perfTotalDowntime, `${formatDecimal(totalDowntimeHr, 1)} ชม.`);
  setText(els.perfWorstMachine, worst ? worst.label : "-");
}

function renderPerformanceInsights(rows, plannedHours, targets) {
  if (!els.performanceInsightList) return;
  if (!rows.length) {
    els.performanceInsightList.innerHTML = `<div class="ai-summary-item">ยังไม่มีข้อมูลสำหรับวิเคราะห์ประสิทธิภาพเครื่องจักร</div>`;
    return;
  }

  const worstAvailability = [...rows].sort((a, b) => a.availability - b.availability)[0];
  const worstDowntime = [...rows].sort((a, b) => b.downtimeHr - a.downtimeHr)[0];
  const worstMttr = [...rows].sort((a, b) => b.mttrMin - a.mttrMin)[0];
  const worstMtbf = [...rows].sort((a, b) => a.mtbfHr - b.mtbfHr)[0];
  const dangerCount = rows.filter(row => row.status.tone === "danger").length;
  const warnCount = rows.filter(row => row.status.tone === "warn").length;

  const items = [
    { tone: worstAvailability.availability < targets.availability ? "danger" : "good", title: "Availability Focus", desc: `${worstAvailability.label} ต่ำสุด ${formatDecimal(worstAvailability.availability, 1)}% เป้าหมาย ${formatDecimal(targets.availability, 1)}%` },
    { tone: worstDowntime.downtimeHr >= 8 ? "danger" : "warn", title: "Downtime Focus", desc: `${worstDowntime.label} Downtime สูงสุด ${formatDecimal(worstDowntime.downtimeHr, 1)} ชั่วโมง จาก ${worstDowntime.failureCount} ครั้ง` },
    { tone: worstMtbf.mtbfHr < targets.mtbf ? "danger" : "good", title: "MTBF Focus", desc: `${worstMtbf.label} MTBF ต่ำสุด ${formatDecimal(worstMtbf.mtbfHr, 1)} ชั่วโมง/ครั้ง เป้าหมาย ${formatDecimal(targets.mtbf, 0)} ชั่วโมง` },
    { tone: worstMttr.mttrMin > targets.mttr ? "warn" : "good", title: "MTTR Focus", desc: `${worstMttr.label} MTTR สูงสุด ${formatDecimal(worstMttr.mttrMin, 1)} นาที/ครั้ง เป้าหมาย ${formatDecimal(targets.mttr, 0)} นาที` },
    { tone: dangerCount ? "danger" : warnCount ? "warn" : "good", title: "Action Priority", desc: `สถานะรวม: วิกฤต ${dangerCount} เครื่อง, เฝ้าระวัง ${warnCount} เครื่อง, Planned Time ${formatNumber(plannedHours)} ชม./เครื่อง` }
  ];

  els.performanceInsightList.innerHTML = items.map(item => `
    <div class="recommendation-card ${item.tone}">
      <div class="recommendation-title">${escapeHtml(item.title)}</div>
      <div class="recommendation-desc">${escapeHtml(item.desc)}</div>
    </div>
  `).join("");
}

function renderPerformanceTable(rows) {
  if (!els.performanceTableBody) return;
  if (!rows.length) {
    els.performanceTableBody.innerHTML = `<tr><td colspan="12" class="empty-cell">ไม่พบข้อมูลประสิทธิภาพตามเงื่อนไขที่เลือก</td></tr>`;
    return;
  }

  els.performanceTableBody.innerHTML = rows.map(row => `
    <tr>
      <td>${escapeHtml(row.machine)}</td>
      <td>${escapeHtml(row.machineNo)}</td>
      <td>${formatDecimal(row.plannedHours, 0)} ชม.</td>
      <td>${formatNumber(row.failureCount)} ครั้ง</td>
      <td>${formatDecimal(row.downtimeHr, 1)} ชม.</td>
      <td>${formatDecimal(row.uptimeHr, 1)} ชม.</td>
      <td>${formatDecimal(row.mtbfHr, 1)} ชม.</td>
      <td>${formatDecimal(row.mttrMin, 1)} นาที</td>
      <td>${formatDecimal(row.availability, 1)}%</td>
      <td>${escapeHtml(row.topPoint)}</td>
      <td>${escapeHtml(row.topProblem)}</td>
      <td>${renderPerformanceStatusBadge(row.status)}</td>
    </tr>
  `).join("");
}

function renderPerformanceCharts(rows, monthlyRows, targets) {
  const topRows = [...rows].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 10);
  renderMonthlyAvailabilityChart(monthlyRows, targets);
  renderMonthlyMtbfMttrChart(monthlyRows, targets);
  renderMonthlyDowntimeFailureChart(monthlyRows);
  renderMachineAvailabilityChart(topRows, targets);
  renderMachineMtbfChart(topRows, targets);
  renderMachineMttrChart(topRows, targets);
  renderDowntimeFailureScatter(rows);
  renderParetoProblemChart();
}

function renderMonthlyAvailabilityChart(monthlyRows, targets) {
  createChart("monthlyAvailabilityChart", "line", {
    labels: monthlyRows.map(row => row.label),
    datasets: [
      { label: "Availability (%)", data: monthlyRows.map(row => round(row.availability, 1)), borderColor: "rgba(16, 185, 129, 1)", backgroundColor: "rgba(16, 185, 129, 0.12)", fill: true, tension: 0.32, pointRadius: 4 },
      { label: `Target ${targets.availability}%`, data: monthlyRows.map(() => targets.availability), borderColor: "rgba(239, 68, 68, 0.9)", borderDash: [6, 6], pointRadius: 0, fill: false }
    ]
  }, lineOptions(true, { yMax: 100 }));
}

function renderMonthlyMtbfMttrChart(monthlyRows, targets) {
  createChart("monthlyMtbfMttrChart", "line", {
    labels: monthlyRows.map(row => row.label),
    datasets: [
      { label: "MTBF (ชม.)", data: monthlyRows.map(row => round(row.mtbfHr, 1)), borderColor: "rgba(37, 99, 235, 1)", backgroundColor: "rgba(37, 99, 235, 0.12)", tension: 0.32, pointRadius: 4, yAxisID: "y" },
      { label: "MTTR (นาที)", data: monthlyRows.map(row => round(row.mttrMin, 1)), borderColor: "rgba(245, 158, 11, 1)", backgroundColor: "rgba(245, 158, 11, 0.12)", tension: 0.32, pointRadius: 4, yAxisID: "y1" },
      { label: `MTBF Target ${targets.mtbf} ชม.`, data: monthlyRows.map(() => targets.mtbf), borderColor: "rgba(37, 99, 235, 0.45)", borderDash: [6, 6], pointRadius: 0, yAxisID: "y" },
      { label: `MTTR Target ${targets.mttr} นาที`, data: monthlyRows.map(() => targets.mttr), borderColor: "rgba(239, 68, 68, 0.7)", borderDash: [6, 6], pointRadius: 0, yAxisID: "y1" }
    ]
  }, {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { position: "bottom" } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "MTBF (ชั่วโมง)" } },
      y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "MTTR (นาที)" } }
    }
  });
}

function renderMonthlyDowntimeFailureChart(monthlyRows) {
  createChart("monthlyDowntimeFailureChart", "bar", {
    labels: monthlyRows.map(row => row.label),
    datasets: [
      { type: "bar", label: "Downtime (ชม.)", data: monthlyRows.map(row => round(row.downtimeHr, 1)), backgroundColor: "rgba(239, 68, 68, 0.7)", borderRadius: 8, yAxisID: "y" },
      { type: "line", label: "Failure Count", data: monthlyRows.map(row => row.failureCount), borderColor: "rgba(15, 23, 42, 0.9)", backgroundColor: "rgba(15, 23, 42, 0.12)", tension: 0.25, pointRadius: 4, yAxisID: "y1" }
    ]
  }, {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { position: "bottom" } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Downtime (ชั่วโมง)" } },
      y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "จำนวนครั้ง" } }
    }
  });
}

function renderMachineAvailabilityChart(rows, targets) {
  createChart("perfAvailabilityChart", "line", {
    labels: rows.map(row => row.label),
    datasets: [
      { label: "Availability (%)", data: rows.map(row => round(row.availability, 1)), borderColor: "rgba(16, 185, 129, 1)", backgroundColor: "rgba(16, 185, 129, 0.14)", fill: false, tension: 0.25, pointRadius: 4 },
      { label: `Target ${targets.availability}%`, data: rows.map(() => targets.availability), borderColor: "rgba(239, 68, 68, 0.8)", borderDash: [6, 6], pointRadius: 0 }
    ]
  }, lineOptions(true, { yMax: 100 }));
}

function renderMachineMtbfChart(rows, targets) {
  createChart("perfMtbfChart", "line", {
    labels: rows.map(row => row.label),
    datasets: [
      { label: "MTBF (ชั่วโมง)", data: rows.map(row => round(row.mtbfHr, 1)), borderColor: "rgba(37, 99, 235, 1)", backgroundColor: "rgba(37, 99, 235, 0.16)", fill: false, tension: 0.25, pointRadius: 4 },
      { label: `Target ${targets.mtbf} ชม.`, data: rows.map(() => targets.mtbf), borderColor: "rgba(239, 68, 68, 0.8)", borderDash: [6, 6], pointRadius: 0 }
    ]
  }, lineOptions(true));
}

function renderMachineMttrChart(rows, targets) {
  createChart("perfMttrChart", "line", {
    labels: rows.map(row => row.label),
    datasets: [
      { label: "MTTR (นาที)", data: rows.map(row => round(row.mttrMin, 1)), borderColor: "rgba(245, 158, 11, 1)", backgroundColor: "rgba(245, 158, 11, 0.16)", fill: false, tension: 0.25, pointRadius: 4 },
      { label: `Target ${targets.mttr} นาที`, data: rows.map(() => targets.mttr), borderColor: "rgba(239, 68, 68, 0.8)", borderDash: [6, 6], pointRadius: 0 }
    ]
  }, lineOptions(true));
}

function renderDowntimeFailureScatter(rows) {
  createChart("perfDowntimeFailureChart", "scatter", {
    datasets: [{
      label: "เครื่องจักร",
      data: rows.map(row => ({ x: row.failureCount, y: round(row.downtimeHr, 1), machine: row.label })),
      backgroundColor: "rgba(239, 68, 68, 0.75)",
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  }, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `${ctx.raw.machine}: เสีย ${ctx.raw.x} ครั้ง, Downtime ${ctx.raw.y} ชม.` } }
    },
    scales: {
      x: { beginAtZero: true, title: { display: true, text: "จำนวนครั้งที่เสีย" } },
      y: { beginAtZero: true, title: { display: true, text: "Downtime (ชั่วโมง)" } }
    }
  });
}

function renderParetoProblemChart() {
  const entries = groupedEntries(state.filteredRecords, getProblem, getDowntimeMin)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  const total = entries.reduce((sum, item) => sum + item.value, 0);
  let cumulative = 0;
  const cumulativePercent = entries.map(item => {
    cumulative += item.value;
    return total ? round((cumulative / total) * 100, 1) : 0;
  });

  createChart("paretoProblemChart", "bar", {
    labels: entries.map(item => item.label),
    datasets: [
      { type: "bar", label: "Downtime (นาที)", data: entries.map(item => item.value), backgroundColor: "rgba(37, 99, 235, 0.72)", borderRadius: 8, yAxisID: "y" },
      { type: "line", label: "Cumulative %", data: cumulativePercent, borderColor: "rgba(239, 68, 68, 1)", backgroundColor: "rgba(239, 68, 68, 0.12)", tension: 0.25, pointRadius: 4, yAxisID: "y1" }
    ]
  }, {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { position: "bottom" } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Downtime (นาที)" } },
      y1: { beginAtZero: true, max: 100, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Cumulative %" } }
    }
  });
}

function renderPerformanceRanking(rows) {
  if (!els.performanceRankingTable) return;
  if (!rows.length) {
    els.performanceRankingTable.innerHTML = `<tr class="empty-row"><td colspan="3">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  els.performanceRankingTable.innerHTML = rows.slice(0, 8).map((row, index) => {
    const reason = `Avail ${formatDecimal(row.availability, 1)}%, MTBF ${formatDecimal(row.mtbfHr, 1)} ชม., MTTR ${formatDecimal(row.mttrMin, 1)} นาที`;
    return `
      <tr>
        <td>${index + 1}. ${escapeHtml(row.label)}</td>
        <td><span class="priority-badge ${row.status.tone}">${escapeHtml(row.status.text)}</span></td>
        <td>${escapeHtml(reason)}</td>
      </tr>
    `;
  }).join("");
}

function renderPerformanceRepeatTable(list) {
  if (!els.performanceRepeatTable) return;
  if (!list.length) {
    els.performanceRepeatTable.innerHTML = `<tr class="empty-row"><td colspan="3">ไม่พบข้อมูล</td></tr>`;
    return;
  }
  els.performanceRepeatTable.innerHTML = list.slice(0, 8).map(item => `
    <tr>
      <td>${escapeHtml(item.machine)}</td>
      <td>${escapeHtml(item.point)} / ${escapeHtml(item.problem)}</td>
      <td>${formatNumber(item.total)} ครั้ง</td>
    </tr>
  `).join("");
}

function renderTargetCheck(rows, targets) {
  if (!els.targetCheckList) return;
  if (!rows.length) {
    els.targetCheckList.innerHTML = `<div class="target-row">ยังไม่มีข้อมูล</div>`;
    return;
  }

  const avgAvailability = average(rows.map(row => row.availability));
  const avgMtbf = average(rows.map(row => row.mtbfHr));
  const avgMttr = average(rows.map(row => row.mttrMin));
  const dangerMachines = rows.filter(row => row.status.tone === "danger").length;

  const checks = [
    { label: "Availability", value: `${formatDecimal(avgAvailability, 1)}%`, pass: avgAvailability >= targets.availability, target: `≥ ${targets.availability}%` },
    { label: "MTBF", value: `${formatDecimal(avgMtbf, 1)} ชม.`, pass: avgMtbf >= targets.mtbf, target: `≥ ${targets.mtbf} ชม.` },
    { label: "MTTR", value: `${formatDecimal(avgMttr, 1)} นาที`, pass: avgMttr <= targets.mttr, target: `≤ ${targets.mttr} นาที` },
    { label: "Critical Machine", value: `${dangerMachines} เครื่อง`, pass: dangerMachines === 0, target: "0 เครื่อง" }
  ];

  els.targetCheckList.innerHTML = checks.map(item => `
    <div class="target-row ${item.pass ? "good" : "danger"}">
      <span><strong>${escapeHtml(item.label)}</strong> • Target ${escapeHtml(item.target)}</span>
      <span>${escapeHtml(item.value)}</span>
    </div>
  `).join("");
}

function getPerformanceStatus(availability, mtbfHr, mttrMin, failureCount, downtimeHr, targets) {
  if (availability < 90 || mtbfHr < targets.mtbf || mttrMin > Math.max(targets.mttr * 1.6, 60) || downtimeHr >= 8) {
    return { text: "วิกฤต", tone: "danger", rank: 3 };
  }
  if (availability < targets.availability || mtbfHr < targets.mtbf * 1.5 || mttrMin > targets.mttr || failureCount >= 3) {
    return { text: "เฝ้าระวัง", tone: "warn", rank: 2 };
  }
  return { text: "ปกติ", tone: "good", rank: 1 };
}

function getPriorityScore(availability, mtbfHr, mttrMin, failureCount, downtimeHr, targets) {
  const availabilityPenalty = Math.max(0, targets.availability - availability) * 4;
  const mtbfPenalty = Math.max(0, targets.mtbf - mtbfHr) * 0.6;
  const mttrPenalty = Math.max(0, mttrMin - targets.mttr) * 1.3;
  return availabilityPenalty + mtbfPenalty + mttrPenalty + failureCount * 4 + downtimeHr * 2;
}

function renderPerformanceStatusBadge(status) {
  return `<span class="perf-status ${status.tone}">${escapeHtml(status.text)}</span>`;
}

function createChart(canvasId, type, data, options) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (!window.Chart) {
    console.warn("Chart.js not loaded");
    return;
  }

  if (state.charts[canvasId]) {
    state.charts[canvasId].destroy();
  }

  const ctx = canvas.getContext("2d");
  state.charts[canvasId] = new Chart(ctx, { type, data, options });
}

function resizeCharts() {
  Object.values(state.charts).forEach(chart => chart?.resize());
}

function basicBarOptions(showLegend = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: showLegend } },
    scales: { y: { beginAtZero: true } }
  };
}

function lineOptions(showLegend = true, extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { display: showLegend, position: "bottom" } },
    scales: { y: { beginAtZero: true, max: extra.yMax || undefined } }
  };
}

function getField(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== "") return row[name];
  }
  return "";
}

function getRecordDate(row) { return parseDate(getField(row, ["วันที่ซ่อม", "Date", "วันที่", "Timestamp", "ประทับเวลา", "วันที่แจ้ง", "Repair Date"])); }
function getMachine(row) { return clean(getField(row, ["ชื่อเครื่องจักร", "Machine", "เครื่องจักร", "Machine Name"])); }
function getMachineNo(row) { return clean(getField(row, ["หมายเลขเครื่อง", "Machine No.", "Machine No", "เครื่อง No", "รหัสเครื่อง", "MachineNo"])); }
function getLine(row) { return clean(getField(row, ["ไลน์ผลิต", "Production Line", "Line", "ไลน์"])); }
function getPoint(row) { return clean(getField(row, ["จุดที่เสีย", "Point", "Area", "ตำแหน่ง", "จุดเสีย", "Machine Point"])); }
function getProblem(row) { return clean(getField(row, ["อาการที่เสีย", "Machine Trouble", "Problem", "ปัญหา", "อาการ", "Trouble"])); }
function getType(row) { return clean(getField(row, ["ประเภทงานเสีย", "Category", "Classification", "ประเภท", "Failure Type"])); }
function getCause(row) { return clean(getField(row, ["สาเหตุ", "Cause", "Root Cause"])); }
function getAction(row) { return clean(getField(row, ["การแก้ไข", "Action", "Corrective Action", "วิธีแก้ไข"])); }
function getTechnician(row) { return clean(getField(row, ["ชื่อช่าง", "Name", "Technician", "ผู้ซ่อม", "ชื่อ"])); }
function getEmployeeId(row) { return clean(getField(row, ["รหัสพนักงาน", "Employee ID", "Emp ID", "ID"])); }
function getShift(row) { return clean(getField(row, ["กะ", "Shift"])); }
function getResult(row) { return clean(getField(row, ["ผลหลังซ่อม", "Result", "Repair Result", "สถานะหลังซ่อม"])); }
function getRemark(row) { return clean(getField(row, ["หมายเหตุ", "Remark", "Remarks", "Note", "Notes"])); }
function getSpare(row) { return clean(getField(row, ["อะไหล่ที่ใช้", "Spare Parts", "Part Used", "Parts", "อะไหล่"])); }
function getStartTime(row) { return clean(getField(row, ["เวลาเริ่มซ่อม", "Start Repair", "Start Time", "เริ่มซ่อม"])); }
function getEndTime(row) { return clean(getField(row, ["เวลาซ่อมเสร็จ", "Repair End", "End Time", "ซ่อมเสร็จ"])); }

function getDowntimeMin(row) {
  return toNumber(getField(row, ["เวลาสูญเสีย(นาที)", "Loss Time", "Loss Time (min)", "Downtime", "Downtime (min)", "Downtime(min)", "เวลาสูญเสีย", "LossTime"]));
}

function machineKey(row) {
  const machine = getMachine(row);
  const no = getMachineNo(row);
  return machine || no ? `${machine}||${no}` : "";
}

function machineLabel(row) {
  const machine = getMachine(row) || "ไม่ระบุ";
  const no = getMachineNo(row) || "ไม่ระบุ";
  return `${machine} | ${no}`;
}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(num) ? num : 0;
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const text = String(value).trim();
  if (!text) return null;

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const slash = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (slash) {
    const d = Number(slash[1]);
    const m = Number(slash[2]);
    let y = Number(slash[3]);
    if (y < 100) y += 2000;
    if (y > 2400) y -= 543;
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateInput(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(date) {
  if (!date) return "-";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear() + 543;
  return `${d}/${m}/${y}`;
}

function formatShortDate(date) {
  if (!date) return "-";
  return `${date.getDate()} ${THAI_MONTHS_SHORT[date.getMonth()]}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

function formatDecimal(value, digits = 1) {
  return Number(value || 0).toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function formatSigned(value) {
  const num = Number(value || 0);
  return `${num > 0 ? "+" : ""}${formatNumber(num)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setText(el, value) {
  if (el) el.textContent = value;
}

function unique(values) {
  return [...new Set(values.filter(value => value !== undefined && value !== null && String(value).trim() !== ""))];
}

function groupBy(records, keyFn) {
  const grouped = {};
  records.forEach(row => {
    const key = clean(keyFn(row));
    if (!key || key === "ไม่ระบุ | ไม่ระบุ") return;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });
  return grouped;
}

function groupedEntries(records, labelFn, valueFn) {
  const grouped = {};
  records.forEach(row => {
    const label = clean(labelFn(row)) || "ไม่ระบุ";
    if (label === "-" || !label) return;
    if (!grouped[label]) grouped[label] = 0;
    grouped[label] += Number(valueFn(row) || 0);
  });
  return Object.entries(grouped).map(([label, value]) => ({ label, value }));
}

function topGroupedLabelByFn(records, labelFn) {
  return groupedEntries(records, labelFn, () => 1).sort((a, b) => b.value - a.value)[0]?.label || "";
}

function average(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return 0;
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
}

function debounce(fn, wait = 180) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
