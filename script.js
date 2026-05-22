const SUPABASE_URL = "https://crigkewtzvslkpmsufxk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaWdrZXd0enZzbGtwbXN1ZnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDc5OTQsImV4cCI6MjA5Mzk4Mzk5NH0.G13M84Qz7mjLXuCtdCHe07BpP7feeBwVD4c2K4czot4";


const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  rows: [],
  filteredRows: [],
  allFilteredRows: [],
  breakdownRows: [],
  pmTpmRows: [],
  charts: {}
};

const els = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheElements();
  bindEvents();
  setDefaultDates();
  refreshIcons();
  await loadDashboard();
}

function cacheElements() {
  Object.assign(els, {
    statusDot: document.getElementById("statusDot"),
    systemStatus: document.getElementById("systemStatus"),

    fromDate: document.getElementById("fromDate"),
    toDate: document.getElementById("toDate"),
    shiftFilter: document.getElementById("shiftFilter"),
    machineFilter: document.getElementById("machineFilter"),
    loadBtn: document.getElementById("loadBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    printReportBtn: document.getElementById("printReportBtn"),
    printReportType: document.getElementById("printReportType"),
    printReportPeriod: document.getElementById("printReportPeriod"),
    printReportFilters: document.getElementById("printReportFilters"),
    printReportDate: document.getElementById("printReportDate"),
    todayBtn: document.getElementById("todayBtn"),
    thisMonthBtn: document.getElementById("thisMonthBtn"),
    resetFilterBtn: document.getElementById("resetFilterBtn"),

    tabBtns: document.querySelectorAll(".tab-btn"),
    tabPanels: document.querySelectorAll(".tab-panel"),

    totalJobs: document.getElementById("totalJobs"),
    totalDowntime: document.getElementById("totalDowntime"),
    avgDowntime: document.getElementById("avgDowntime"),
    activeMachines: document.getElementById("activeMachines"),
    topProblemName: document.getElementById("topProblemName"),
    topAreaName: document.getElementById("topAreaName"),

    pmTpmSummarySection: document.getElementById("pmTpmSummarySection"),
    pmTpmJobs: document.getElementById("pmTpmJobs"),
    pmTpmTime: document.getElementById("pmTpmTime"),
    pmTpmTopMachine: document.getElementById("pmTpmTopMachine"),
    pmTpmTopMachineDetail: document.getElementById("pmTpmTopMachineDetail"),
    pmTpmTopWork: document.getElementById("pmTpmTopWork"),
    pmTpmTopWorkDetail: document.getElementById("pmTpmTopWorkDetail"),

    focusMachine: document.getElementById("focusMachine"),
    focusMachineDetail: document.getElementById("focusMachineDetail"),
    focusProblem: document.getElementById("focusProblem"),
    focusProblemDetail: document.getElementById("focusProblemDetail"),
    focusArea: document.getElementById("focusArea"),
    focusAreaDetail: document.getElementById("focusAreaDetail"),
    focusShift: document.getElementById("focusShift"),
    focusShiftDetail: document.getElementById("focusShiftDetail"),

    topProblemTable: document.getElementById("topProblemTable"),
    topAreaTable: document.getElementById("topAreaTable"),
    topDowntimeTable: document.getElementById("topDowntimeTable"),

    plannedTimeInput: document.getElementById("plannedTimeInput"),
    targetAvailabilityInput: document.getElementById("targetAvailabilityInput"),
    targetMtbfInput: document.getElementById("targetMtbfInput"),
    targetMttrInput: document.getElementById("targetMttrInput"),
    plannedTimeText: document.getElementById("plannedTimeText"),

    avgAvailability: document.getElementById("avgAvailability"),
    avgMtbf: document.getElementById("avgMtbf"),
    avgMttr: document.getElementById("avgMttr"),
    totalFailures: document.getElementById("totalFailures"),
    downtimeHours: document.getElementById("downtimeHours"),
    focusMachinePerf: document.getElementById("focusMachinePerf"),

    availabilityTargetBadge: document.getElementById("availabilityTargetBadge"),
    mtbfTargetBadge: document.getElementById("mtbfTargetBadge"),
    mttrTargetBadge: document.getElementById("mttrTargetBadge"),
    availabilityBar: document.getElementById("availabilityBar"),
    mtbfBar: document.getElementById("mtbfBar"),
    mttrBar: document.getElementById("mttrBar"),
    availabilityActualText: document.getElementById("availabilityActualText"),
    mtbfActualText: document.getElementById("mtbfActualText"),
    mttrActualText: document.getElementById("mttrActualText"),
    availabilityTargetText: document.getElementById("availabilityTargetText"),
    mtbfTargetText: document.getElementById("mtbfTargetText"),
    mttrTargetText: document.getElementById("mttrTargetText"),

    actionRecommendation: document.getElementById("actionRecommendation"),
    machinePerformanceBody: document.getElementById("machinePerformanceBody"),

    toast: document.getElementById("toast")
  });
}

function bindEvents() {
  els.loadBtn?.addEventListener("click", loadDashboard);
  els.refreshBtn?.addEventListener("click", loadDashboard);
  els.printReportBtn?.addEventListener("click", printDashboardReport);

  els.shiftFilter?.addEventListener("change", applyFiltersAndRender);
  els.machineFilter?.addEventListener("change", applyFiltersAndRender);

  els.todayBtn?.addEventListener("click", () => {
    const today = formatDateInput(new Date());
    els.fromDate.value = today;
    els.toDate.value = today;
    loadDashboard();
  });

  els.thisMonthBtn?.addEventListener("click", () => {
    setDefaultDates();
    loadDashboard();
  });

  els.resetFilterBtn?.addEventListener("click", () => {
    els.shiftFilter.value = "";
    els.machineFilter.value = "";
    setDefaultDates();
    loadDashboard();
  });

  [
    els.plannedTimeInput,
    els.targetAvailabilityInput,
    els.targetMtbfInput,
    els.targetMttrInput
  ].forEach(input => {
    input?.addEventListener("input", applyFiltersAndRender);
  });

  els.tabBtns?.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;

      els.tabBtns.forEach(item => item.classList.toggle("active", item.dataset.tab === tabId));
      els.tabPanels.forEach(panel => panel.classList.toggle("active", panel.id === tabId));

      setTimeout(() => {
        Object.values(state.charts).forEach(chart => chart?.resize?.());
      }, 80);
    });
  });
}

function setDefaultDates() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  els.fromDate.value = formatDateInput(firstDay);
  els.toDate.value = formatDateInput(today);
}

/* ================= Data ================= */

async function loadDashboard() {
  try {
    setStatus("กำลังโหลดข้อมูล...", "warning");

    const fromDate = els.fromDate.value;
    const toDate = els.toDate.value;

    const { data, error } = await sb
      .from("repair_logs")
      .select("*")
      .gte("repair_date", fromDate)
      .lte("repair_date", toDate)
      .order("repair_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    state.rows = data || [];
    populateMachineFilter(state.rows);
    applyFiltersAndRender();

    setStatus("พร้อมใช้งาน", "success");
    toast("โหลดข้อมูล Dashboard สำเร็จ", "success");
  } catch (err) {
    console.error(err);
    state.rows = [];
    applyFiltersAndRender();
    setStatus("โหลดข้อมูลไม่สำเร็จ", "error");
    toast("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Supabase URL / Key / Policy", "error");
  }
}

function populateMachineFilter(rows) {
  if (!els.machineFilter) return;

  const currentValue = els.machineFilter.value;

  const machineNames = [...new Set(
    rows.map(row => clean(row.machine_name)).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "th"));

  els.machineFilter.innerHTML = `<option value="">ทั้งหมด</option>` +
    machineNames.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");

  if (machineNames.includes(currentValue)) {
    els.machineFilter.value = currentValue;
  }
}

function applyFiltersAndRender() {
  const shift = els.shiftFilter?.value || "";
  const machine = els.machineFilter?.value || "";

  state.allFilteredRows = state.rows.filter(row => {
    if (shift && row.shift !== shift) return false;
    if (machine && row.machine_name !== machine) return false;
    return true;
  });

  state.breakdownRows = state.allFilteredRows.filter(row => !isPmOrTpmWork(row));
  state.pmTpmRows = state.allFilteredRows.filter(row => isPmOrTpmWork(row));

  // ค่าเดิมของเว็บให้หมายถึง Breakdown เท่านั้น เพื่อให้ KPI / MTTR / MTBF / Pareto ไม่เพี้ยน
  state.filteredRows = state.breakdownRows;

  renderAll();
}

/* ================= Render All ================= */

function renderAll() {
  const rows = state.breakdownRows || state.filteredRows || [];
  const pmRows = state.pmTpmRows || [];

  updatePlannedTimeText();

  renderDashboardCards(rows);
  renderPmTpmSummary(pmRows);
  renderFocusSummary(rows);
  renderDashboardCharts(rows);
  renderRankingTables(rows);

  renderPerformanceCards(rows);
  renderTargetCompare(rows);
  renderActionRecommendation(rows);
  renderPerformanceCharts(rows);
  renderMachinePerformance(rows);

  refreshIcons();
}


/* ================= Work Type Split: Breakdown vs TPM/PM ================= */

function isPmOrTpmWork(row) {
  const fields = [
    row.problem_name,
    row.problem,
    row.machine_trouble,
    row.cause_name,
    row.action_name,
    row.breakdown_type,
    row.classification,
    row.repair_type,
    row.work_type,
    row.job_type,
    row.pm_type,
    row.remark,
    row.result_after_repair,
    row.repair_result
  ];

  const text = fields
    .map(value => String(value || "").toLowerCase())
    .join(" ")
    .replace(/\s+/g, " ");

  const thaiPmKeywords = [
    "งานtpm",
    "งาน tpm",
    "งานpm",
    "งาน pm",
    "tpm/pm",
    "pm/tpm",
    "บำรุงรักษา",
    "บํารุงรักษา",
    "ตรวจเช็ค",
    "ตรวจเช็ก",
    "เช็คสภาพ",
    "เช็กสภาพ",
    "ทำความสะอาดเครื่อง",
    "ล้างเครื่อง",
    "หล่อลื่น",
    "อัดจารบี",
    "ตามแผน",
    "แผนpm",
    "แผน pm"
  ];

  if (thaiPmKeywords.some(keyword => text.includes(keyword))) return true;

  // จับคำ PM / TPM แบบเป็นคำ ไม่ให้ไปโดนคำอื่นโดยไม่ตั้งใจ
  if (/(^|[^a-z0-9])(tpm|pm|p\.m\.)([^a-z0-9]|$)/i.test(text)) return true;
  if (/(^|[^a-z0-9])(preventive|planned maintenance|maintenance plan|periodic inspection)([^a-z0-9]|$)/i.test(text)) return true;

  return false;
}

function getBreakdownRows(rows) {
  return (rows || []).filter(row => !isPmOrTpmWork(row));
}

function getPmTpmRows(rows) {
  return (rows || []).filter(row => isPmOrTpmWork(row));
}

function renderPmTpmSummary(rows) {
  if (!els.pmTpmSummarySection) return;

  const totalJobs = rows.length;
  const totalTime = sumBy(rows, row => toNumber(row.loss_time_min));

  const topMachine = topEntry(groupSum(
    rows,
    row => `${row.machine_name || "-"} | ${row.machine_no || "-"}`,
    row => toNumber(row.loss_time_min)
  ));

  const topWork = topEntry(groupCount(rows, row => getPmTpmWorkName(row)));

  els.pmTpmJobs.textContent = formatNumber(totalJobs);
  els.pmTpmTime.textContent = formatNumber(totalTime);
  els.pmTpmTopMachine.textContent = topMachine ? topMachine[0] : "-";
  els.pmTpmTopMachineDetail.textContent = topMachine ? `${formatNumber(topMachine[1])} นาที` : "ไม่มีงาน TPM/PM ในช่วงที่เลือก";
  els.pmTpmTopWork.textContent = topWork ? topWork[0] : "-";
  els.pmTpmTopWorkDetail.textContent = topWork ? `${formatNumber(topWork[1])} ครั้ง` : "ไม่มีงาน TPM/PM ในช่วงที่เลือก";

  els.pmTpmSummarySection.classList.toggle("is-empty", totalJobs === 0);
}

function getPmTpmWorkName(row) {
  return clean(row.problem_name) ||
    clean(row.action_name) ||
    clean(row.breakdown_type) ||
    clean(row.classification) ||
    clean(row.remark) ||
    "TPM/PM";
}

/* ================= Dashboard ================= */

function renderDashboardCards(rows) {
  const totalJobs = rows.length;
  const totalDowntime = sumBy(rows, row => toNumber(row.loss_time_min));
  const avgDowntime = totalJobs ? totalDowntime / totalJobs : 0;
  const activeMachines = new Set(rows.map(machineKey)).size;

  const topProblem = topEntry(groupCount(rows, row => row.problem_name || "-"));
  const topArea = topEntry(groupCount(rows, row => row.area_point_name || "-"));

  els.totalJobs.textContent = formatNumber(totalJobs);
  els.totalDowntime.textContent = formatNumber(totalDowntime);
  els.avgDowntime.textContent = formatNumber(avgDowntime, 1);
  els.activeMachines.textContent = formatNumber(activeMachines);

  els.topProblemName.textContent = topProblem ? topProblem[0] : "-";
  els.topAreaName.textContent = topArea ? topArea[0] : "-";
}

function renderFocusSummary(rows) {
  const machineDowntime = groupSum(
    rows,
    row => `${row.machine_name || "-"} | ${row.machine_no || "-"}`,
    row => toNumber(row.loss_time_min)
  );

  const problemCount = groupCount(rows, row => row.problem_name || "-");
  const areaCount = groupCount(rows, row => row.area_point_name || "-");
  const shiftDowntime = groupSum(rows, row => row.shift || "ไม่ระบุ", row => toNumber(row.loss_time_min));

  const topMachine = topEntry(machineDowntime);
  const topProblem = topEntry(problemCount);
  const topArea = topEntry(areaCount);
  const topShift = topEntry(shiftDowntime);

  els.focusMachine.textContent = topMachine ? topMachine[0] : "-";
  els.focusMachineDetail.textContent = topMachine ? `Breakdown Downtime รวม ${formatNumber(topMachine[1])} นาที` : "-";

  els.focusProblem.textContent = topProblem ? topProblem[0] : "-";
  els.focusProblemDetail.textContent = topProblem ? `พบทั้งหมด ${formatNumber(topProblem[1])} ครั้ง` : "-";

  els.focusArea.textContent = topArea ? topArea[0] : "-";
  els.focusAreaDetail.textContent = topArea ? `พบทั้งหมด ${formatNumber(topArea[1])} ครั้ง` : "-";

  els.focusShift.textContent = topShift ? `กะ ${topShift[0]}` : "-";
  els.focusShiftDetail.textContent = topShift ? `Breakdown Downtime รวม ${formatNumber(topShift[1])} นาที` : "-";
}

function renderDashboardCharts(rows) {
  renderDowntimeByMachine(rows);
  renderTopAreaChart(rows);
  renderDailyDowntimeChart(rows);
  renderBreakdownTypeChart(rows);
  renderTopProblemChart(rows);
}

function renderDowntimeByMachine(rows) {
  const grouped = groupSum(
    rows,
    row => `${row.machine_name || "-"} | ${row.machine_no || "-"}`,
    row => toNumber(row.loss_time_min)
  );

  const top = sortEntries(grouped).slice(0, 10);

  createChart("downtimeByMachineChart", "bar",
    top.map(item => item[0]),
    top.map(item => item[1]),
    "Breakdown Downtime (นาที)",
    "blue"
  );
}

function renderTopAreaChart(rows) {
  const grouped = groupCount(rows, row => row.area_point_name || "ไม่ระบุ");
  const top = sortEntries(grouped).slice(0, 10);

  createChart("topAreaChart", "bar",
    top.map(item => item[0]),
    top.map(item => item[1]),
    "จำนวนครั้ง",
    "red",
    true
  );
}

function renderDailyDowntimeChart(rows) {
  const grouped = groupSum(rows, row => row.repair_date || "-", row => toNumber(row.loss_time_min));
  const labels = Object.keys(grouped).sort();

  createChart("dailyDowntimeChart", "line",
    labels.map(formatDateShort),
    labels.map(label => grouped[label]),
    "Breakdown Downtime (นาที)",
    "green"
  );
}

function renderBreakdownTypeChart(rows) {
  const grouped = groupCount(rows, row => row.breakdown_type || "ไม่ระบุ");
  const top = sortEntries(grouped);

  createDoughnutChart("breakdownTypeChart",
    top.map(item => item[0]),
    top.map(item => item[1])
  );
}

function renderTopProblemChart(rows) {
  const grouped = groupCount(rows, row => row.problem_name || "ไม่ระบุ");
  const top = sortEntries(grouped).slice(0, 10);

  createChart("topProblemChart", "bar",
    top.map(item => item[0]),
    top.map(item => item[1]),
    "จำนวนครั้ง",
    "purple"
  );
}

function renderRankingTables(rows) {
  const problemTop = sortEntries(groupCount(rows, row => row.problem_name || "ไม่ระบุ")).slice(0, 5);
  const areaTop = sortEntries(groupCount(rows, row => row.area_point_name || "ไม่ระบุ")).slice(0, 5);

  const downtimeTop = sortEntries(groupSum(
    rows,
    row => `${row.machine_name || "-"} | ${row.machine_no || "-"}`,
    row => toNumber(row.loss_time_min)
  )).slice(0, 5);

  renderSimpleTable(els.topProblemTable, "อาการที่เสีย", "จำนวน", problemTop, "ครั้ง");
  renderSimpleTable(els.topAreaTable, "จุดที่เสีย", "จำนวน", areaTop, "ครั้ง");
  renderSimpleTable(els.topDowntimeTable, "เครื่องจักร", "Downtime", downtimeTop, "นาที");
}

function renderSimpleTable(container, leftHead, rightHead, rows, suffix) {
  if (!container) return;

  if (!rows.length) {
    container.innerHTML = `<div class="empty">ไม่มีข้อมูล</div>`;
    return;
  }

  container.innerHTML = `
    <div class="simple-row header">
      <div>${leftHead}</div>
      <div>${rightHead}</div>
    </div>
    ${rows.map(([name, value]) => `
      <div class="simple-row">
        <div class="simple-name">${escapeHtml(name)}</div>
        <div class="simple-value">${formatNumber(value)} ${suffix}</div>
      </div>
    `).join("")}
  `;
}

/* ================= Performance ================= */

function getDashboardTargets() {
  return {
    availability: Number(els.targetAvailabilityInput?.value || 80),
    mtbf: Number(els.targetMtbfInput?.value || 100),
    mttr: Number(els.targetMttrInput?.value || 37)
  };
}

function getPlannedTimeHours() {
  const manual = Number(els.plannedTimeInput?.value || 0);

  if (manual > 0) return manual;

  const days = Math.max(1, diffDays(els.fromDate.value, els.toDate.value) + 1);
  return days * 24;
}

function updatePlannedTimeText() {
  if (!els.plannedTimeText) return;

  const manual = Number(els.plannedTimeInput?.value || 0);
  const days = Math.max(1, diffDays(els.fromDate.value, els.toDate.value) + 1);
  const planned = getPlannedTimeHours();

  if (manual > 0) {
    els.plannedTimeText.textContent = `ใช้ Planned Time ที่กำหนดเอง = ${formatNumber(planned)} ชั่วโมง/เครื่อง`;
  } else {
    els.plannedTimeText.textContent = `ช่วงวันที่เลือกมี ${days} วัน × 24 ชั่วโมง = ${formatNumber(planned)} ชั่วโมง/เครื่อง`;
  }
}

function calculateMachinePerformance(rows) {
  const plannedTimeHr = getPlannedTimeHours();
  const targets = getDashboardTargets();
  const grouped = {};

  rows.forEach(row => {
    const key = machineKey(row);

    if (!grouped[key]) {
      grouped[key] = {
        machine_name: row.machine_name || "-",
        machine_no: row.machine_no || "-",
        production_line: row.production_line || "-",
        rows: []
      };
    }

    grouped[key].rows.push(row);
  });

  return Object.values(grouped).map(item => {
    const failureCount = item.rows.length;
    const downtimeMin = sumBy(item.rows, row => toNumber(row.loss_time_min));
    const downtimeHr = downtimeMin / 60;
    const uptimeHr = Math.max(0, plannedTimeHr - downtimeHr);
    const mtbf = failureCount ? uptimeHr / failureCount : plannedTimeHr;
    const mttr = failureCount ? downtimeMin / failureCount : 0;
    const availability = plannedTimeHr ? (uptimeHr / plannedTimeHr) * 100 : 100;

    const topArea = getTopKey(item.rows, row => row.area_point_name || "-");
    const topProblem = getTopKey(item.rows, row => row.problem_name || "-");

    let status = "normal";

    if (
      availability < targets.availability ||
      mtbf < targets.mtbf ||
      mttr > targets.mttr
    ) {
      status = "watch";
    }

    if (
      availability < targets.availability - 3 ||
      mtbf < targets.mtbf * 0.7 ||
      mttr > targets.mttr * 1.5
    ) {
      status = "critical";
    }

    return {
      ...item,
      plannedTimeHr,
      failureCount,
      downtimeMin,
      downtimeHr,
      uptimeHr,
      mtbf,
      mttr,
      availability,
      topArea,
      topProblem,
      status
    };
  }).sort((a, b) => {
    const order = { critical: 1, watch: 2, normal: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return b.downtimeHr - a.downtimeHr;
  });
}

function renderPerformanceCards(rows) {
  const data = calculateMachinePerformance(rows);
  const totalFailures = rows.length;
  const downtimeMin = sumBy(rows, row => toNumber(row.loss_time_min));
  const downtimeHr = downtimeMin / 60;

  const avgAvailability = data.length ? average(data.map(item => item.availability)) : 100;
  const avgMtbf = data.length ? average(data.map(item => item.mtbf)) : getPlannedTimeHours();
  const avgMttr = totalFailures ? downtimeMin / totalFailures : 0;

  const focusMachine = data[0];

  els.avgAvailability.textContent = `${formatNumber(avgAvailability, 1)}%`;
  els.avgMtbf.textContent = `${formatNumber(avgMtbf, 1)} ชม.`;
  els.avgMttr.textContent = `${formatNumber(avgMttr, 1)} นาที`;
  els.totalFailures.textContent = formatNumber(totalFailures);
  els.downtimeHours.textContent = `${formatNumber(downtimeHr, 1)} ชม.`;
  els.focusMachinePerf.textContent = focusMachine
    ? `${focusMachine.machine_name} | ${focusMachine.machine_no}`
    : "-";
}

function renderTargetCompare(rows) {
  const data = calculateMachinePerformance(rows);
  const targets = getDashboardTargets();

  const totalFailures = rows.length;
  const downtimeMin = sumBy(rows, row => toNumber(row.loss_time_min));
  const avgAvailability = data.length ? average(data.map(item => item.availability)) : 100;
  const avgMtbf = data.length ? average(data.map(item => item.mtbf)) : getPlannedTimeHours();
  const avgMttr = totalFailures ? downtimeMin / totalFailures : 0;

  setTargetCard(
    els.availabilityTargetBadge,
    els.availabilityBar,
    els.availabilityActualText,
    els.availabilityTargetText,
    avgAvailability >= targets.availability,
    avgAvailability,
    targets.availability,
    "%",
    true
  );

  setTargetCard(
    els.mtbfTargetBadge,
    els.mtbfBar,
    els.mtbfActualText,
    els.mtbfTargetText,
    avgMtbf >= targets.mtbf,
    avgMtbf,
    targets.mtbf,
    " ชม.",
    true
  );

  setTargetCard(
    els.mttrTargetBadge,
    els.mttrBar,
    els.mttrActualText,
    els.mttrTargetText,
    avgMttr <= targets.mttr || totalFailures === 0,
    avgMttr,
    targets.mttr,
    " นาที",
    false
  );
}

function setTargetCard(badge, bar, actualEl, targetEl, isPass, actual, target, suffix, higherBetter) {
  badge.textContent = isPass ? "PASS" : "WATCH";
  badge.style.color = isPass ? "#059669" : "#d97706";

  const percent = higherBetter
    ? target ? (actual / target) * 100 : 100
    : actual ? (target / actual) * 100 : 100;

  bar.style.width = `${clamp(percent, 0, 100)}%`;
  bar.className = `target-fill ${isPass ? "good" : "warn"}`;

  actualEl.textContent = `${formatNumber(actual, 1)}${suffix}`;
  targetEl.textContent = `${formatNumber(target, 0)}${suffix}`;
}

function renderActionRecommendation(rows) {
  if (!els.actionRecommendation) return;

  const data = calculateMachinePerformance(rows);
  const targets = getDashboardTargets();

  if (!data.length) {
    els.actionRecommendation.innerHTML = `
      <div class="action-item">
        <h3>ยังไม่มีข้อมูล</h3>
        <p>ยังไม่มีข้อมูลสำหรับวิเคราะห์ข้อเสนอแนะ</p>
      </div>
    `;
    return;
  }

  const lowestAvailability = [...data].sort((a, b) => a.availability - b.availability)[0];
  const highestDowntime = [...data].sort((a, b) => b.downtimeHr - a.downtimeHr)[0];
  const lowestMtbf = [...data].sort((a, b) => a.mtbf - b.mtbf)[0];
  const highestMttr = [...data].sort((a, b) => b.mttr - a.mttr)[0];

  const criticalCount = data.filter(item => item.status === "critical").length;
  const watchCount = data.filter(item => item.status === "watch").length;

  els.actionRecommendation.innerHTML = `
    <div class="action-item ${lowestAvailability.availability < targets.availability ? "danger" : "good"}">
      <h3>Availability Focus</h3>
      <p>${escapeHtml(lowestAvailability.machine_name)} | ${escapeHtml(lowestAvailability.machine_no)} ต่ำสุด ${formatNumber(lowestAvailability.availability, 1)}% เป้าหมาย ${targets.availability}%</p>
    </div>

    <div class="action-item ${highestDowntime.downtimeHr >= 1 ? "danger" : "good"}">
      <h3>Downtime Focus</h3>
      <p>${escapeHtml(highestDowntime.machine_name)} | ${escapeHtml(highestDowntime.machine_no)} Breakdown Downtime สูงสุด ${formatNumber(highestDowntime.downtimeHr, 1)} ชั่วโมง จาก ${highestDowntime.failureCount} ครั้ง</p>
    </div>

    <div class="action-item ${lowestMtbf.mtbf < targets.mtbf ? "danger" : "good"}">
      <h3>MTBF Focus</h3>
      <p>${escapeHtml(lowestMtbf.machine_name)} | ${escapeHtml(lowestMtbf.machine_no)} MTBF ต่ำสุด ${formatNumber(lowestMtbf.mtbf, 1)} ชั่วโมง/ครั้ง เป้าหมาย ${targets.mtbf} ชั่วโมง</p>
    </div>

    <div class="action-item ${highestMttr.mttr > targets.mttr ? "warn" : "good"}">
      <h3>MTTR Focus</h3>
      <p>${escapeHtml(highestMttr.machine_name)} | ${escapeHtml(highestMttr.machine_no)} MTTR สูงสุด ${formatNumber(highestMttr.mttr, 1)} นาที/ครั้ง เป้าหมาย ${targets.mttr} นาที</p>
    </div>

    <div class="action-item ${criticalCount ? "danger" : watchCount ? "warn" : "good"}">
      <h3>Action Priority</h3>
      <p>สถานะรวม: วิกฤต ${criticalCount} เครื่อง, เฝ้าระวัง ${watchCount} เครื่อง, Planned Time ${formatNumber(getPlannedTimeHours())} ชม./เครื่อง</p>
    </div>
  `;
}

function renderMachinePerformance(rows) {
  const data = calculateMachinePerformance(rows);

  if (!els.machinePerformanceBody) return;

  if (!data.length) {
    els.machinePerformanceBody.innerHTML = `<tr><td colspan="12" class="empty">ไม่มีข้อมูล</td></tr>`;
    return;
  }

  els.machinePerformanceBody.innerHTML = data.map(item => `
    <tr>
      <td>${escapeHtml(item.machine_name)}</td>
      <td>${escapeHtml(item.machine_no)}</td>
      <td>${formatNumber(item.plannedTimeHr, 0)} ชม.</td>
      <td>${formatNumber(item.failureCount)} ครั้ง</td>
      <td>${formatNumber(item.downtimeHr, 1)} ชม.</td>
      <td>${formatNumber(item.uptimeHr, 1)} ชม.</td>
      <td>${formatNumber(item.mtbf, 1)} ชม.</td>
      <td>${formatNumber(item.mttr, 1)} นาที</td>
      <td>${formatNumber(item.availability, 1)}%</td>
      <td>${escapeHtml(item.topArea)}</td>
      <td>${escapeHtml(item.topProblem)}</td>
      <td>${renderMachineStatus(item.status)}</td>
    </tr>
  `).join("");
}

function renderMachineStatus(status) {
  if (status === "critical") return `<span class="status-pill critical">วิกฤต</span>`;
  if (status === "watch") return `<span class="status-pill watch">เฝ้าระวัง</span>`;
  return `<span class="status-pill normal">ปกติ</span>`;
}

/* ================= Performance Charts ================= */

function renderPerformanceCharts(rows) {
  renderMonthlyAvailability(rows);
  renderMonthlyReliability(rows);
  renderMonthlyDowntimeFailure(rows);
  renderParetoProblem(rows);
  renderMttrByMachine(rows);
  renderAvailabilityByMachine(rows);
  renderMtbfByMachine(rows);
}

function renderMonthlyAvailability(rows) {
  const data = groupByMonthPerformance(rows);
  const labels = data.map(item => item.monthLabel);
  const values = data.map(item => item.availability);

  createChart("monthlyAvailabilityChart", "line", labels, values, "Availability (%)", "green");
}

function renderMonthlyReliability(rows) {
  const data = groupByMonthPerformance(rows);
  const labels = data.map(item => item.monthLabel);

  createMultiAxisLineChart("monthlyReliabilityChart", labels, [
    {
      label: "MTBF (ชม.)",
      data: data.map(item => item.mtbf),
      color: "#2563eb",
      yAxisID: "y"
    },
    {
      label: "MTTR (นาที)",
      data: data.map(item => item.mttr),
      color: "#f59e0b",
      yAxisID: "y1"
    }
  ]);
}

function renderMonthlyDowntimeFailure(rows) {
  const data = groupByMonthPerformance(rows);
  const labels = data.map(item => item.monthLabel);

  createMixedChart("monthlyDowntimeFailureChart", labels, [
    {
      type: "bar",
      label: "Breakdown Downtime (ชม.)",
      data: data.map(item => item.downtimeHr),
      color: "#ef4444",
      yAxisID: "y"
    },
    {
      type: "line",
      label: "Failure Count",
      data: data.map(item => item.failureCount),
      color: "#475569",
      yAxisID: "y1"
    }
  ]);
}

function renderParetoProblem(rows) {
  const grouped = groupSum(rows, row => row.problem_name || "ไม่ระบุ", row => toNumber(row.loss_time_min));
  const sorted = sortEntries(grouped).slice(0, 10);

  const total = sorted.reduce((sum, item) => sum + item[1], 0);
  let cumulative = 0;

  const labels = sorted.map(item => item[0]);
  const values = sorted.map(item => item[1]);
  const cumulativePercent = sorted.map(item => {
    cumulative += item[1];
    return total ? (cumulative / total) * 100 : 0;
  });

  createParetoChart("paretoProblemChart", labels, values, cumulativePercent);
}

function renderMttrByMachine(rows) {
  const data = calculateMachinePerformance(rows).slice(0, 10);
  createChart("mttrByMachineChart", "line",
    data.map(item => `${item.machine_name} | ${item.machine_no}`),
    data.map(item => item.mttr),
    "MTTR (นาที)",
    "amber"
  );
}

function renderAvailabilityByMachine(rows) {
  const data = calculateMachinePerformance(rows).slice(0, 10);
  createChart("availabilityByMachineChart", "line",
    data.map(item => `${item.machine_name} | ${item.machine_no}`),
    data.map(item => item.availability),
    "Availability (%)",
    "green"
  );
}

function renderMtbfByMachine(rows) {
  const data = calculateMachinePerformance(rows).slice(0, 10);
  createChart("mtbfByMachineChart", "line",
    data.map(item => `${item.machine_name} | ${item.machine_no}`),
    data.map(item => item.mtbf),
    "MTBF (ชม.)",
    "blue"
  );
}

function groupByMonthPerformance(rows) {
  const grouped = {};

  rows.forEach(row => {
    const date = parseDate(row.repair_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });

  return Object.keys(grouped).sort().map(key => {
    const monthRows = grouped[key];
    const plannedHr = getPlannedTimeHours();
    const failureCount = monthRows.length;
    const downtimeMin = sumBy(monthRows, row => toNumber(row.loss_time_min));
    const downtimeHr = downtimeMin / 60;
    const uptimeHr = Math.max(0, plannedHr - downtimeHr);
    const mtbf = failureCount ? uptimeHr / failureCount : plannedHr;
    const mttr = failureCount ? downtimeMin / failureCount : 0;
    const availability = plannedHr ? (uptimeHr / plannedHr) * 100 : 100;

    return {
      month: key,
      monthLabel: formatMonthLabel(key),
      failureCount,
      downtimeHr,
      mtbf,
      mttr,
      availability
    };
  });
}

/* ================= Chart Helpers ================= */

function createChart(canvasId, type, labels, values, label, colorKey = "blue", horizontal = false) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  destroyChart(canvasId);

  const color = getChartColor(colorKey);

  state.charts[canvasId] = new Chart(canvas, {
    type,
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: color.border,
        backgroundColor: type === "line" ? color.bgLight : color.bg,
        borderWidth: 2.5,
        tension: 0.35,
        fill: type === "line"
      }]
    },
    options: makeChartOptions(type, horizontal)
  });
}

function createDoughnutChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  destroyChart(canvasId);

  state.charts[canvasId] = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#2563eb",
          "#ef4444",
          "#f59e0b",
          "#10b981",
          "#7c3aed",
          "#475569",
          "#14b8a6",
          "#f97316"
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 18,
            boxHeight: 10,
            font: { family: "Kanit", size: 12, weight: "500" }
          }
        }
      }
    }
  });
}

function createMultiAxisLineChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  destroyChart(canvasId);

  state.charts[canvasId] = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: datasets.map(item => ({
        label: item.label,
        data: item.data,
        borderColor: item.color,
        backgroundColor: `${item.color}22`,
        borderWidth: 2.5,
        tension: 0.35,
        fill: false,
        yAxisID: item.yAxisID
      }))
    },
    options: makeDualAxisOptions()
  });
}

function createMixedChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  destroyChart(canvasId);

  state.charts[canvasId] = new Chart(canvas, {
    data: {
      labels,
      datasets: datasets.map(item => ({
        type: item.type,
        label: item.label,
        data: item.data,
        borderColor: item.color,
        backgroundColor: item.type === "bar" ? `${item.color}aa` : item.color,
        borderWidth: 2.5,
        tension: 0.35,
        yAxisID: item.yAxisID
      }))
    },
    options: makeDualAxisOptions()
  });
}

function createParetoChart(canvasId, labels, values, cumulativePercent) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  destroyChart(canvasId);

  state.charts[canvasId] = new Chart(canvas, {
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Breakdown Downtime (นาที)",
          data: values,
          backgroundColor: "rgba(37, 99, 235, 0.72)",
          borderColor: "#2563eb",
          borderWidth: 1,
          yAxisID: "y"
        },
        {
          type: "line",
          label: "Cumulative %",
          data: cumulativePercent,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.12)",
          borderWidth: 2.5,
          tension: 0.25,
          yAxisID: "y1"
        }
      ]
    },
    options: makeDualAxisOptions(true)
  });
}

function makeChartOptions(type, horizontal = false) {
  const isDoughnut = type === "doughnut";

  return {
    indexAxis: horizontal ? "y" : "x",
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 10, right: 12, bottom: 4, left: 4 }
    },
    plugins: {
      legend: {
        display: type === "line",
        labels: {
          boxWidth: 18,
          boxHeight: 10,
          font: { family: "Kanit", size: 12, weight: "500" }
        }
      },
      tooltip: {
        titleFont: { family: "Kanit", size: 13, weight: "600" },
        bodyFont: { family: "Kanit", size: 12 }
      }
    },
    scales: isDoughnut ? {} : {
      x: {
        ticks: {
          font: { family: "Kanit", size: 11 },
          maxRotation: 25,
          minRotation: 0,
          callback: function(value) {
            const label = this.getLabelForValue(value);
            return shortenLabel(label, 20);
          }
        },
        grid: { color: "rgba(148, 163, 184, 0.20)" }
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: { family: "Kanit", size: 11 }
        },
        grid: { color: "rgba(148, 163, 184, 0.22)" }
      }
    }
  };
}

function makeDualAxisOptions(isPercent = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { family: "Kanit", size: 12, weight: "500" }
        }
      },
      tooltip: {
        titleFont: { family: "Kanit", size: 13, weight: "600" },
        bodyFont: { family: "Kanit", size: 12 }
      }
    },
    scales: {
      x: {
        ticks: {
          font: { family: "Kanit", size: 11 },
          maxRotation: 25,
          callback: function(value) {
            const label = this.getLabelForValue(value);
            return shortenLabel(label, 22);
          }
        },
        grid: { color: "rgba(148, 163, 184, 0.20)" }
      },
      y: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        ticks: { font: { family: "Kanit", size: 11 } },
        grid: { color: "rgba(148, 163, 184, 0.22)" }
      },
      y1: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        max: isPercent ? 100 : undefined,
        ticks: { font: { family: "Kanit", size: 11 } },
        grid: { drawOnChartArea: false }
      }
    }
  };
}

function destroyChart(canvasId) {
  if (state.charts[canvasId]) {
    state.charts[canvasId].destroy();
    delete state.charts[canvasId];
  }
}

function getChartColor(key) {
  const colors = {
    blue: { border: "#2563eb", bg: "rgba(37, 99, 235, 0.72)", bgLight: "rgba(37, 99, 235, 0.15)" },
    red: { border: "#ef4444", bg: "rgba(239, 68, 68, 0.72)", bgLight: "rgba(239, 68, 68, 0.15)" },
    amber: { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.72)", bgLight: "rgba(245, 158, 11, 0.15)" },
    green: { border: "#10b981", bg: "rgba(16, 185, 129, 0.72)", bgLight: "rgba(16, 185, 129, 0.15)" },
    purple: { border: "#7c3aed", bg: "rgba(124, 58, 237, 0.72)", bgLight: "rgba(124, 58, 237, 0.15)" }
  };

  return colors[key] || colors.blue;
}


/* ================= Print Report ================= */

async function printDashboardReport() {
  updatePrintReportHeader();
  renderPrintExecutiveSummary();

  document.body.classList.add("is-printing-report");

  try {
    await preparePrintChartSnapshots();

    window.addEventListener("afterprint", cleanupPrintReport, { once: true });

    setTimeout(() => {
      window.print();
    }, 250);

    setTimeout(cleanupPrintReport, 3500);
  } catch (err) {
    console.error("Print report error:", err);
    cleanupPrintReport();
    toast("เตรียมรายงานสำหรับปริ้นไม่สำเร็จ", "error");
  }
}

function cleanupPrintReport() {
  document.body.classList.remove("is-printing-report");
  document.querySelectorAll(".print-chart-image").forEach(img => img.remove());

  setTimeout(() => {
    Object.values(state.charts).forEach(chart => {
      chart?.resize?.();
      chart?.update?.("none");
    });
  }, 80);
}

async function preparePrintChartSnapshots() {
  document.querySelectorAll(".print-chart-image").forEach(img => img.remove());

  Object.values(state.charts).forEach(chart => {
    chart?.resize?.();
    chart?.update?.("none");
  });

  await sleep(180);

  const activePanel = document.querySelector(".tab-panel.active");
  const canvases = activePanel ? [...activePanel.querySelectorAll("canvas")] : [];

  const images = [];

  canvases.forEach(canvas => {
    try {
      const src = canvas.toDataURL("image/png", 1);

      if (!src || src.length < 200) return;

      const img = document.createElement("img");
      img.className = "print-chart-image";
      img.alt = canvas.id || "chart";
      img.src = src;
      img.loading = "eager";
      img.decoding = "sync";

      canvas.insertAdjacentElement("afterend", img);
      images.push(img);
    } catch (err) {
      console.warn("Cannot create print image for chart:", canvas.id, err);
    }
  });

  await Promise.all(images.map(img => new Promise(resolve => {
    if (img.complete) resolve();
    else {
      img.onload = resolve;
      img.onerror = resolve;
    }
  })));
}

function renderPrintExecutiveSummary() {
  let container = document.getElementById("printExecutiveSummary");

  if (!container) {
    container = document.createElement("section");
    container.id = "printExecutiveSummary";
    container.className = "print-executive-summary";
    document.getElementById("printReportHeader")?.insertAdjacentElement("afterend", container);
  }

  const activeTab = [...(els.tabBtns || [])].find(btn => btn.classList.contains("active"));
  const isPerformance = activeTab?.dataset?.tab === "performancePanel";

  const summaryItems = isPerformance
    ? [
        ["Availability เฉลี่ย", els.avgAvailability?.textContent || "-"],
        ["MTBF เฉลี่ย", els.avgMtbf?.textContent || "-"],
        ["MTTR เฉลี่ย", els.avgMttr?.textContent || "-"],
        ["จำนวนครั้งที่เสีย", els.totalFailures?.textContent || "-"],
        ["Downtime รวม", els.downtimeHours?.textContent || "-"],
        ["เครื่องที่ควรโฟกัส", els.focusMachinePerf?.textContent || "-"]
      ]
    : [
        ["Breakdown Jobs", `${els.totalJobs?.textContent || "0"} รายการ`],
        ["Breakdown Downtime", `${els.totalDowntime?.textContent || "0"} นาที`],
        ["Avg Downtime / ครั้ง", `${els.avgDowntime?.textContent || "0"} นาที`],
        ["Active Machines", `${els.activeMachines?.textContent || "0"} เครื่อง`],
        ["Top Problem", els.topProblemName?.textContent || "-"],
        ["Top Area", els.topAreaName?.textContent || "-"],
        ["TPM/PM Jobs", `${els.pmTpmJobs?.textContent || "0"} รายการ`],
        ["TPM/PM Time", `${els.pmTpmTime?.textContent || "0"} นาที`]
      ];

  const focusText = isPerformance
    ? `Focus Machine: ${els.focusMachinePerf?.textContent || "-"}`
    : `Focus: ${els.focusMachine?.textContent || "-"} / ${els.focusProblem?.textContent || "-"} / ${els.focusArea?.textContent || "-"}`;

  container.innerHTML = `
    <div class="print-summary-head">
      <div>
        <h2>Executive Summary</h2>
        <p>${escapeHtml(focusText)}</p>
      </div>
      <span>${isPerformance ? "Performance KPI" : "Dashboard Overview"}</span>
    </div>
    <div class="print-summary-grid">
      ${summaryItems.map(([label, value]) => `
        <div class="print-summary-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function updatePrintReportHeader() {
  const activeTab = [...(els.tabBtns || [])].find(btn => btn.classList.contains("active"));
  const activeTabText = activeTab ? activeTab.textContent.trim().replace(/\s+/g, " ") : "Dashboard";

  const fromText = els.fromDate?.value ? formatDateShort(els.fromDate.value) : "-";
  const toText = els.toDate?.value ? formatDateShort(els.toDate.value) : "-";
  const shiftText = els.shiftFilter?.value ? `Shift ${els.shiftFilter.value}` : "All Shifts";
  const machineText = els.machineFilter?.value || "All Machines";

  if (els.printReportType) {
    els.printReportType.textContent = activeTabText.includes("Performance")
      ? "Performance KPI Report"
      : "Dashboard Overview Report";
  }

  if (els.printReportPeriod) {
    els.printReportPeriod.textContent = `${fromText} - ${toText}`;
  }

  if (els.printReportFilters) {
    els.printReportFilters.textContent = `${shiftText} / ${machineText}`;
  }

  if (els.printReportDate) {
    els.printReportDate.textContent = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ================= Utility ================= */

function setStatus(text, type) {
  if (els.systemStatus) els.systemStatus.textContent = text;

  if (!els.statusDot) return;

  if (type === "success") els.statusDot.style.background = "#10b981";
  else if (type === "error") els.statusDot.style.background = "#ef4444";
  else els.statusDot.style.background = "#f59e0b";
}

function toast(message, type = "success") {
  if (!els.toast) return;

  els.toast.className = `toast ${type}`;
  els.toast.textContent = message;

  setTimeout(() => {
    els.toast.className = "toast hidden";
  }, 3200);
}

function groupSum(rows, keyFn, valueFn) {
  return rows.reduce((acc, row) => {
    const key = keyFn(row);
    acc[key] = (acc[key] || 0) + valueFn(row);
    return acc;
  }, {});
}

function groupCount(rows, keyFn) {
  return rows.reduce((acc, row) => {
    const key = keyFn(row);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function sortEntries(obj) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

function topEntry(obj) {
  return sortEntries(obj)[0] || null;
}

function getTopKey(rows, keyFn) {
  const top = topEntry(groupCount(rows, keyFn));
  return top ? top[0] : "-";
}

function sumBy(rows, fn) {
  return rows.reduce((sum, row) => sum + fn(row), 0);
}

function average(values) {
  const filtered = values.filter(value => Number.isFinite(value));
  return filtered.length ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0;
}

function machineKey(row) {
  return `${row.machine_name || "-"}|${row.machine_no || "-"}`;
}

function toNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function clean(value) {
  return String(value ?? "").trim();
}

function parseDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function diffDays(start, end) {
  const a = parseDate(start);
  const b = parseDate(end);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateShort(value) {
  if (!value) return "-";

  const date = parseDate(value);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short"
  });
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric"
  });
}

function formatNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function shortenLabel(label, maxLength = 18) {
  const text = String(label || "");
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeHtmlWithBreaks(value) {
  return escapeHtml(value || "-").replace(/\n/g, "<br>");
}


function pickFirstValue(row, keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
}

function formatRepairClock(value) {
  if (value === undefined || value === null || String(value).trim() === "") return "";

  const raw = String(value).trim();

  const timeMatch = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (timeMatch) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  return raw;
}

function formatRepairTimeRange(row) {
  const start = pickFirstValue(row, [
    "start_repair_time",
    "repair_start_time",
    "repair_start",
    "start_time",
    "start_repair",
    "time_start",
    "repair_time_start",
    "start"
  ]);

  const end = pickFirstValue(row, [
    "repair_end_time",
    "end_repair_time",
    "end_repair",
    "repair_finish_time",
    "repair_end",
    "end_time",
    "finish_time",
    "time_end",
    "repair_time_end",
    "end"
  ]);

  const startText = formatRepairClock(start);
  const endText = formatRepairClock(end);

  if (startText && endText) return `${startText} - ${endText}`;
  if (startText) return `${startText} - ไม่ระบุเวลาจบ`;
  if (endText) return `ไม่ระบุเวลาเริ่ม - ${endText}`;

  return "-";
}

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}
/* =========================================================
   Monthly Presentation Print Report
   - Safe override: ไม่แก้ logic KPI เดิม
   - เปิดหน้า Report แยกสำหรับพรีเซนรายเดือน
========================================================= */

async function printDashboardReport() {
  try {
    setStatus("กำลังเตรียมรายงานพร้อมรูปภาพ...", "warning");

    const evidencePhotos = await loadRepairEvidencePhotosForReport();
    const reportData = buildMonthlyPresentationReportData(evidencePhotos);
    const reportHtml = buildMonthlyPresentationReportHtml(reportData);
    const printWindow = window.open("", "_blank", "width=1280,height=900");

    if (!printWindow) {
      toast("Browser บล็อกหน้าต่างรายงาน กรุณาอนุญาต Popup", "warning");
      setStatus("พร้อมใช้งาน", "success");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 850);
    };

    setStatus("พร้อมใช้งาน", "success");
  } catch (err) {
    console.error("Monthly report print error:", err);
    setStatus("สร้างรายงานไม่สำเร็จ", "error");
    toast("สร้างรายงานนำเสนอไม่สำเร็จ", "error");
  }
}

async function loadRepairEvidencePhotosForReport() {
  const breakdownRows = state.breakdownRows || state.filteredRows || [];

  const candidateRows = [...breakdownRows]
    .sort((a, b) => toNumber(b.loss_time_min) - toNumber(a.loss_time_min))
    .slice(0, 80);

  const ids = candidateRows.map(row => row.id).filter(Boolean);
  const recordIds = candidateRows.map(row => row.record_id).filter(Boolean);

  if (!ids.length && !recordIds.length) return [];

  let images = [];

  try {
    if (ids.length) {
      const { data, error } = await sb
        .from("repair_images")
        .select("*")
        .in("repair_log_id", ids);

      if (error) throw error;
      images = data || [];
    }
  } catch (err) {
    console.warn("Load repair_images by repair_log_id failed:", err);
  }

  if (!images.length && recordIds.length) {
    try {
      const { data, error } = await sb
        .from("repair_images")
        .select("*")
        .in("record_id", recordIds);

      if (error) throw error;
      images = data || [];
    } catch (err) {
      console.warn("Load repair_images by record_id failed:", err);
    }
  }

  if (!images.length) return [];

  const rowMap = new Map();
  candidateRows.forEach(row => {
    if (row.id) rowMap.set(String(row.id), row);
    if (row.record_id) rowMap.set(String(row.record_id), row);
  });

  const photos = images.map(img => {
    const key = img.repair_log_id || img.repair_id || img.record_id || img.repair_log_record_id;
    const row = rowMap.get(String(key));
    const url = getRepairImageUrl(img);

    if (!row || !url) return null;

    return {
      url,
      imageType: img.image_type || img.type || "Repair Photo",
      fileName: img.file_name || img.filename || "",
      row,
      downtime: toNumber(row.loss_time_min),
      sortTime: new Date(row.repair_date || row.created_at || 0).getTime() || 0
    };
  }).filter(Boolean);

  const seen = new Set();
  return photos
    .sort((a, b) => b.downtime - a.downtime || b.sortTime - a.sortTime)
    .filter(photo => {
      const key = `${photo.row.id || photo.row.record_id}|${photo.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

function getRepairImageUrl(img) {
  const directUrl = img.public_url || img.image_url || img.url || img.photo_url || img.file_url;
  if (directUrl) return directUrl;

  const path = img.file_path || img.path || img.storage_path;
  if (!path) return "";

  try {
    return sb.storage.from("repair-images").getPublicUrl(path).data?.publicUrl || "";
  } catch (err) {
    console.warn("Cannot get public URL for repair image:", err);
    return "";
  }
}

function buildMonthlyPresentationReportData(evidencePhotos = []) {
  const breakdownRows = state.breakdownRows || state.filteredRows || [];
  const pmRows = state.pmTpmRows || [];
  const allRows = state.allFilteredRows || state.rows || [];
  const targets = getDashboardTargets();
  const performance = calculateMachinePerformance(breakdownRows);

  const downtimeMin = sumBy(breakdownRows, row => toNumber(row.loss_time_min));
  const pmTimeMin = sumBy(pmRows, row => toNumber(row.loss_time_min));
  const totalFailures = breakdownRows.length;
  const activeMachines = new Set(breakdownRows.map(machineKey)).size;
  const avgDowntime = totalFailures ? downtimeMin / totalFailures : 0;

  const avgAvailability = performance.length ? average(performance.map(item => item.availability)) : 100;
  const avgMtbf = performance.length ? average(performance.map(item => item.mtbf)) : getPlannedTimeHours();
  const avgMttr = totalFailures ? downtimeMin / totalFailures : 0;

  const topMachineDowntime = sortEntries(groupSum(
    breakdownRows,
    row => `${row.machine_name || "-"} | ${row.machine_no || "-"}`,
    row => toNumber(row.loss_time_min)
  )).slice(0, 5);

  const topProblemCount = sortEntries(groupCount(
    breakdownRows,
    row => row.problem_name || "ไม่ระบุ"
  )).slice(0, 5);

  const topAreaCount = sortEntries(groupCount(
    breakdownRows,
    row => row.area_point_name || "ไม่ระบุ"
  )).slice(0, 5);

  const shiftDowntime = sortEntries(groupSum(
    breakdownRows,
    row => row.shift ? `กะ ${row.shift}` : "ไม่ระบุ",
    row => toNumber(row.loss_time_min)
  )).slice(0, 5);

  const pmTopMachine = sortEntries(groupSum(
    pmRows,
    row => `${row.machine_name || "-"} | ${row.machine_no || "-"}`,
    row => toNumber(row.loss_time_min)
  )).slice(0, 3);

  const topProblem = topProblemCount[0] || ["-", 0];
  const topArea = topAreaCount[0] || ["-", 0];
  const topMachine = topMachineDowntime[0] || ["-", 0];
  const topShift = shiftDowntime[0] || ["-", 0];

  const criticalMachines = performance.filter(item => item.status === "critical").length;
  const watchMachines = performance.filter(item => item.status === "watch").length;
  const focusMachine = performance[0] || null;

  return {
    title: "Monthly Maintenance Performance Report",
    periodText: getPresentationPeriodText(),
    filterText: getPresentationFilterText(),
    printedAt: new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    breakdownRows,
    pmRows,
    allRows,
    targets,
    performance,
    kpi: {
      totalFailures,
      downtimeMin,
      downtimeHr: downtimeMin / 60,
      avgDowntime,
      activeMachines,
      avgAvailability,
      avgMtbf,
      avgMttr,
      pmJobs: pmRows.length,
      pmTimeMin,
      pmTimeHr: pmTimeMin / 60,
      criticalMachines,
      watchMachines
    },
    topMachineDowntime,
    topProblemCount,
    topAreaCount,
    shiftDowntime,
    pmTopMachine,
    top: {
      machine: topMachine,
      problem: topProblem,
      area: topArea,
      shift: topShift,
      focusMachine
    },
    evidencePhotos,
    insight: buildMonthlyReportInsights({
      totalFailures,
      downtimeMin,
      avgDowntime,
      avgAvailability,
      avgMtbf,
      avgMttr,
      targets,
      topMachine,
      topProblem,
      topArea,
      topShift,
      criticalMachines,
      watchMachines,
      pmRows,
      pmTimeMin,
      focusMachine
    })
  };
}

function buildMonthlyReportInsights(data) {
  const lines = [];
  const actions = [];

  if (!data.totalFailures) {
    lines.push("ในช่วงที่เลือกไม่พบ Breakdown ที่นำมาคำนวณ KPI เครื่องเสีย");
    actions.push("ให้ตรวจสอบความครบถ้วนของข้อมูล Repair Report และแยกงาน TPM/PM ออกจากงานเสียต่อไป");
    return { lines, actions, conclusion: "สถานะโดยรวมยังไม่มี Breakdown สำหรับวิเคราะห์" };
  }

  lines.push(`เดือนนี้มี Breakdown ${formatNumber(data.totalFailures)} รายการ Downtime รวม ${formatNumber(data.downtimeMin)} นาที (${formatNumber(data.downtimeMin / 60, 1)} ชม.)`);
  lines.push(`เครื่องที่กระทบสูงสุดคือ ${data.topMachine[0]} Downtime ${formatNumber(data.topMachine[1])} นาที`);
  lines.push(`อาการที่เกิดบ่อยสุดคือ ${data.topProblem[0]} พบ ${formatNumber(data.topProblem[1])} ครั้ง และจุดเสียหลักคือ ${data.topArea[0]} พบ ${formatNumber(data.topArea[1])} ครั้ง`);

  if (data.avgMttr > data.targets.mttr) {
    actions.push(`MTTR เฉลี่ย ${formatNumber(data.avgMttr, 1)} นาที สูงกว่าเป้า ${formatNumber(data.targets.mttr)} นาที ควรเร่งลดเวลาวิเคราะห์/เตรียมอะไหล่และเครื่องมือให้พร้อม`);
  } else {
    actions.push(`MTTR เฉลี่ย ${formatNumber(data.avgMttr, 1)} นาที อยู่ในเกณฑ์เป้าหมาย ควรรักษามาตรฐานการตอบสนองของทีมซ่อม`);
  }

  if (data.avgMtbf < data.targets.mtbf) {
    actions.push(`MTBF เฉลี่ย ${formatNumber(data.avgMtbf, 1)} ชม. ต่ำกว่าเป้า ${formatNumber(data.targets.mtbf)} ชม. ควรนำ Top Machine / Top Problem เข้าแผน PM เดือนถัดไป`);
  } else {
    actions.push(`MTBF เฉลี่ย ${formatNumber(data.avgMtbf, 1)} ชม. ผ่านเป้าหมาย ให้ติดตามเครื่องที่มีปัญหาซ้ำต่อเนื่อง`);
  }

  if (data.criticalMachines || data.watchMachines) {
    actions.push(`มีเครื่องสถานะวิกฤต ${formatNumber(data.criticalMachines)} เครื่อง และเฝ้าระวัง ${formatNumber(data.watchMachines)} เครื่อง ควรจัดลำดับ PM ตามความเสี่ยงก่อน`);
  }

  if (data.pmRows.length) {
    lines.push(`มีงาน TPM/PM แยกต่างหาก ${formatNumber(data.pmRows.length)} รายการ รวมเวลา ${formatNumber(data.pmTimeMin)} นาที ไม่ได้นำไปรวมเป็น Breakdown Downtime`);
  }

  const conclusion = data.criticalMachines
    ? "ภาพรวมควรโฟกัสเครื่องวิกฤตและปัญหาซ้ำก่อน เพื่อป้องกัน Downtime ในเดือนถัดไป"
    : data.watchMachines
      ? "ภาพรวมยังควบคุมได้ แต่มีเครื่องที่ต้องเฝ้าระวังและควรติดตามผลหลัง PM"
      : "ภาพรวมอยู่ในเกณฑ์ดี ให้รักษารอบ PM และติดตามแนวโน้มซ้ำรายเครื่อง";

  return { lines, actions, conclusion };
}

function buildMonthlyPresentationReportHtml(report) {
  const k = report.kpi;
  const maxDowntime = Math.max(...report.topMachineDowntime.map(item => item[1]), 1);
  const maxProblem = Math.max(...report.topProblemCount.map(item => item[1]), 1);
  const maxArea = Math.max(...report.topAreaCount.map(item => item[1]), 1);

  const machineRows = report.performance.slice(0, 8).map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${escapeHtml(item.machine_name)} | ${escapeHtml(item.machine_no)}</strong><br><span>${escapeHtml(item.topArea || "-")}</span></td>
      <td>${formatNumber(item.failureCount)}</td>
      <td>${formatNumber(item.downtimeHr, 1)} ชม.</td>
      <td>${formatNumber(item.mtbf, 1)} ชม.</td>
      <td>${formatNumber(item.mttr, 1)} นาที</td>
      <td>${formatNumber(item.availability, 1)}%</td>
      <td>${renderReportStatus(item.status)}</td>
    </tr>
  `).join("") || `<tr><td colspan="8" class="empty">ไม่มีข้อมูลเครื่องจักร</td></tr>`;

  const evidenceHtml = buildEvidencePhotoSection(report.evidencePhotos || []);

  return `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(report.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Prompt", "Kanit", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    background: #f1f5f9;
    font-size: 10.8px;
    line-height: 1.55;
    letter-spacing: -0.01em;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .toolbar {
    position: sticky; top: 0; z-index: 20;
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 10px; background: #e2e8f0;
  }
  .toolbar button {
    border: 0; border-radius: 10px; padding: 8px 14px;
    background: #2563eb; color: white; font-weight: 600; cursor: pointer;
  }
  .report-page {
    width: 100%; max-width: 1120px; margin: 0 auto 14px; background: white;
    padding: 18px 20px; border-radius: 18px; box-shadow: 0 10px 28px rgba(15,23,42,.12);
  }
  .header {
    display: grid; grid-template-columns: 1.4fr .9fr; gap: 16px;
    padding-bottom: 12px; border-bottom: 2px solid #1e3a8a;
  }
  .eyebrow { color: #2563eb; font-weight: 800; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
  h1 { margin: 4px 0 6px; font-size: 25px; line-height: 1.15; letter-spacing: -0.03em; }
  .subtitle { color: #475569; line-height: 1.55; font-size: 10.8px;
    line-height: 1.55;
    letter-spacing: -0.01em; }
  .meta-box {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  }
  .meta { border: 1px solid #dbe3ef; border-radius: 12px; padding: 9px; background: #f8fafc; }
  .meta span { display: block; color: #64748b; font-size: 9px; }
  .meta strong { display: block; margin-top: 3px; font-size: 12px; }
  .section { margin-top: 12px; }
  .section-title {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #dbe3ef;
  }
  .section-title h2 { margin: 0; font-size: 15px; }
  .section-title span { color: #64748b; font-size: 10px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
  .kpi {
    border: 1px solid #dbe3ef; border-radius: 14px; padding: 10px;
    background: linear-gradient(180deg, #fff, #f8fafc);
    min-height: 72px;
  }
  .kpi .label { color: #64748b; font-size: 9.5px; font-weight: 600; }
  .kpi .value { margin-top: 5px; font-size: 18px; font-weight: 900; line-height: 1.1; }
  .kpi .note { margin-top: 4px; color: #64748b; font-size: 9px; }
  .blue { border-left: 5px solid #2563eb; } .red { border-left: 5px solid #ef4444; }
  .green { border-left: 5px solid #10b981; } .amber { border-left: 5px solid #f59e0b; }
  .purple { border-left: 5px solid #7c3aed; } .dark { border-left: 5px solid #475569; }
  .summary-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .box { border: 1px solid #dbe3ef; border-radius: 14px; padding: 11px; background: #fff; }
  .box h3 { margin: 0 0 7px; font-size: 13px; }
  .insight-list { margin: 0; padding-left: 18px; line-height: 1.65; }
  .action-list { margin: 0; padding-left: 18px; line-height: 1.65; }
  .conclusion { margin-top: 8px; padding: 9px 10px; border-radius: 12px; background: #eff6ff; color: #1e40af; font-weight: 600; }
  .chart-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .bar-list { display: grid; gap: 7px; }
  .bar-row { display: grid; grid-template-columns: 140px 1fr 58px; gap: 8px; align-items: center; }
  .bar-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #334155; }
  .bar-track { height: 10px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 999px; background: #2563eb; }
  .bar-fill.red { background: #ef4444; } .bar-fill.amber { background: #f59e0b; }
  .bar-value { text-align: right; font-weight: 800; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #eff6ff; color: #1e3a8a; text-align: left; padding: 7px; border: 1px solid #cbd5e1; }
  td { padding: 7px; border: 1px solid #e2e8f0; vertical-align: top; }
  td span { color: #64748b; }
  .pill { display: inline-flex; border-radius: 999px; padding: 4px 8px; font-weight: 800; font-size: 9px; }
  .pill.critical { background: #fee2e2; color: #b91c1c; }
  .pill.watch { background: #fef3c7; color: #b45309; }
  .pill.normal { background: #dcfce7; color: #047857; }
  .empty { text-align: center; color: #64748b; padding: 14px; }
  .footer-note { margin-top: 10px; color: #64748b; font-size: 9px; text-align: right; }
  .evidence-job-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
  .evidence-card { border: 1px solid #dbe3ef; border-radius: 14px; overflow: hidden; background: #fff; page-break-inside: avoid; }
  .grouped-job { display: grid; grid-template-columns: 44% 56%; align-items: stretch; }
  .evidence-photo-stack { display: grid; gap: 8px; padding: 10px; background: #f8fafc; border-right: 1px solid #e2e8f0; }
  .evidence-photo-stack.single { grid-template-columns: 1fr; }
  .evidence-photo-stack.double { grid-template-columns: 1fr 1fr; }
  .evidence-photo-stack.multi { grid-template-columns: 1fr 1fr; }
  .evidence-photo-item { margin: 0; display: flex; flex-direction: column; }
  .evidence-photo-item.before .evidence-photo { border-color: #fb923c; box-shadow: inset 0 0 0 2px rgba(251,146,60,0.18); }
  .evidence-photo-item.after .evidence-photo { border-color: #22c55e; box-shadow: inset 0 0 0 2px rgba(34,197,94,0.18); }
  .evidence-photo-item.during .evidence-photo { border-color: #60a5fa; box-shadow: inset 0 0 0 2px rgba(96,165,250,0.18); }
  .evidence-photo-caption { margin-top: 6px; font-size: 8.4px; font-weight: 800; text-align: center; padding: 3px 8px; border-radius: 999px; align-self: center; }
  .evidence-photo-caption.before { background: #fff7ed; color: #c2410c; border: 1px solid #fdba74; }
  .evidence-photo-caption.after { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
  .evidence-photo-caption.during { background: #eff6ff; color: #1d4ed8; border: 1px solid #93c5fd; }
  .evidence-photo-caption.other { background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; }
  .evidence-photo { width: 100%; height: 220px; object-fit: contain; display: block; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px; }
  .evidence-info { padding: 14px 15px 15px; }
  .evidence-info strong { display: block; font-size: 12.2px; line-height: 1.35; margin-bottom: 10px; color: #0f172a; letter-spacing: -0.01em; }
  .evidence-info p { margin: 0; color: #334155; font-size: 9.8px; line-height: 1.52; }
  .evidence-badge { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: #f8fafc; color: #334155; font-size: 8.6px; font-weight: 600; border: 1px solid #dbe3ef; }
  .evidence-type-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .evidence-detail-title { color: #64748b; font-weight: 600; min-width: 78px; display: inline-block; }
  .evidence-detail-value { color: #0f172a; font-weight: 500; }
  .evidence-meta-list { display: grid; gap: 7px; }
  .evidence-meta-item { display: grid; grid-template-columns: 88px 1fr; gap: 10px; align-items: start; padding: 5px 0; border-bottom: 1px dashed #e2e8f0; }
  .evidence-meta-item.is-downtime { margin: 6px 0 2px; padding: 9px 10px; border: 1px solid #fecaca; border-radius: 12px; background: #fff5f5; }
  .evidence-meta-item.is-downtime .evidence-detail-title { color: #b91c1c; }
  .evidence-meta-item.is-downtime .evidence-detail-value { color: #dc2626; font-weight: 800; font-size: 10.8px; }
  .evidence-meta-item:last-child { border-bottom: none; }
  .evidence-remark { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; }
  @media print {
    body { background: white; }
    .toolbar { display: none; }
    .report-page { box-shadow: none; margin: 0; max-width: none; border-radius: 0; padding: 0; }
    .section { page-break-inside: avoid; }
    tr, .box, .kpi, .evidence-card { page-break-inside: avoid; }
    .grouped-job { grid-template-columns: 44% 56%; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Print / Save PDF</button>
    <button onclick="window.close()">Close</button>
  </div>

  <main class="report-page">
    <section class="header">
      <div>
        <div class="eyebrow">MPR Smart Maintenance</div>
        <h1>Monthly Maintenance Report</h1>
        <div class="subtitle">
          สรุปผลการซ่อมบำรุงประจำเดือน แยก Breakdown Downtime ออกจากงาน TPM/PM เพื่อใช้ประชุมและวางแผนปรับปรุงเครื่องจักร
        </div>
      </div>
      <div class="meta-box">
        <div class="meta"><span>Period</span><strong>${escapeHtml(report.periodText)}</strong></div>
        <div class="meta"><span>Filter</span><strong>${escapeHtml(report.filterText)}</strong></div>
        <div class="meta"><span>Printed</span><strong>${escapeHtml(report.printedAt)}</strong></div>
        <div class="meta"><span>Report Type</span><strong>Monthly Summary</strong></div>
      </div>
    </section>

    <section class="section">
      <div class="section-title"><h2>1. Executive KPI Summary</h2><span>Breakdown KPI + TPM/PM Activity</span></div>
      <div class="kpi-grid">
        ${reportKpiCard("Breakdown Jobs", `${formatNumber(k.totalFailures)}`, "รายการ", "blue")}
        ${reportKpiCard("Breakdown Downtime", `${formatNumber(k.downtimeHr, 1)}`, "ชั่วโมง", "red")}
        ${reportKpiCard("MTTR Avg", `${formatNumber(k.avgMttr, 1)}`, `นาที | Target ${formatNumber(report.targets.mttr)} นาที`, k.avgMttr <= report.targets.mttr ? "green" : "amber")}
        ${reportKpiCard("MTBF Avg", `${formatNumber(k.avgMtbf, 1)}`, `ชั่วโมง | Target ${formatNumber(report.targets.mtbf)} ชม.`, k.avgMtbf >= report.targets.mtbf ? "green" : "amber")}
        ${reportKpiCard("Availability", `${formatNumber(k.avgAvailability, 1)}%`, `Target ${formatNumber(report.targets.availability)}%`, k.avgAvailability >= report.targets.availability ? "green" : "amber")}
        ${reportKpiCard("TPM/PM Activity", `${formatNumber(k.pmJobs)}`, `${formatNumber(k.pmTimeHr, 1)} ชม.`, "purple")}
      </div>
    </section>

    <section class="section summary-layout">
      <div class="box">
        <h3>2. สรุปประเด็นสำคัญประจำเดือน</h3>
        <ul class="insight-list">
          ${report.insight.lines.map(line => `<li>${escapeHtml(line)}</li>`).join("")}
        </ul>
        <div class="conclusion">${escapeHtml(report.insight.conclusion)}</div>
      </div>
      <div class="box">
        <h3>3. ข้อเสนอแนะ / Action Plan</h3>
        <ul class="action-list">
          ${report.insight.actions.map(line => `<li>${escapeHtml(line)}</li>`).join("")}
        </ul>
      </div>
    </section>

    <section class="section">
      <div class="section-title"><h2>4. Top Ranking สำหรับโฟกัสเดือนถัดไป</h2><span>ใช้สำหรับประชุม PM / Kaizen / Spare Part</span></div>
      <div class="chart-grid">
        <div class="box">
          <h3>Top Downtime Machine</h3>
          ${reportBarList(report.topMachineDowntime, maxDowntime, "นาที", "red")}
        </div>
        <div class="box">
          <h3>Top Problem</h3>
          ${reportBarList(report.topProblemCount, maxProblem, "ครั้ง", "amber")}
        </div>
        <div class="box">
          <h3>Top Area Point</h3>
          ${reportBarList(report.topAreaCount, maxArea, "ครั้ง", "blue")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-title"><h2>5. Machine Performance Priority</h2><span>เรียงตามความเสี่ยงและ Downtime</span></div>
      <table>
        <thead>
          <tr>
            <th>No.</th><th>Machine / Main Area</th><th>Failure</th><th>Downtime</th><th>MTBF</th><th>MTTR</th><th>Availability</th><th>Status</th>
          </tr>
        </thead>
        <tbody>${machineRows}</tbody>
      </table>
    </section>

    ${evidenceHtml}

    <section class="section summary-layout">
      <div class="box">
        <h3>7. Shift Downtime</h3>
        ${reportBarList(report.shiftDowntime, Math.max(...report.shiftDowntime.map(item => item[1]), 1), "นาที", "blue")}
      </div>
      <div class="box">
        <h3>8. TPM/PM Activity แยกจาก Breakdown</h3>
        ${report.pmTopMachine.length ? reportBarList(report.pmTopMachine, Math.max(...report.pmTopMachine.map(item => item[1]), 1), "นาที", "amber") : `<div class="empty">ไม่มีงาน TPM/PM ในช่วงนี้</div>`}
      </div>
    </section>

    <div class="footer-note">Prepared by MPR Smart Maintenance Dashboard · Breakdown KPI excludes TPM/PM activity</div>
  </main>
</body>
</html>`;
}


function rankEvidenceImageType(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("before") || t.includes("ก่อน")) return 1;
  if (t.includes("during") || t.includes("ระหว่าง")) return 2;
  if (t.includes("after") || t.includes("หลัง")) return 3;
  return 9;
}


function classifyEvidenceImageType(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("before") || t.includes("ก่อน")) return "before";
  if (t.includes("during") || t.includes("ระหว่าง")) return "during";
  if (t.includes("after") || t.includes("หลัง")) return "after";
  return "other";
}

function buildEvidencePhotoSection(photos) {
  if (!photos || !photos.length) {
    return `
    <section class="section">
      <div class="section-title"><h2>6. Evidence Photos from Repair Reports</h2><span>รูปภาพประกอบจากรายงานซ่อม</span></div>
      <div class="box"><div class="empty">ไม่มีรูปภาพประกอบจากรายงานซ่อมในช่วงนี้ หรือยังไม่ได้เปิดสิทธิ์อ่านตาราง repair_images</div></div>
    </section>`;
  }

  const groupedMap = new Map();

  photos.forEach(photo => {
    const row = photo.row || {};
    const key = String(row.id || row.record_id || `${row.machine_name || '-'}|${row.machine_no || '-'}|${row.repair_date || '-'}`);
    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        row,
        downtime: toNumber(row.loss_time_min),
        sortTime: photo.sortTime || 0,
        photos: []
      });
    }
    groupedMap.get(key).photos.push(photo);
  });

  const grouped = Array.from(groupedMap.values())
    .map(group => {
      group.photos = group.photos
        .sort((a, b) => rankEvidenceImageType(a.imageType) - rankEvidenceImageType(b.imageType));
      return group;
    })
    .sort((a, b) => b.downtime - a.downtime || b.sortTime - a.sortTime)
    .slice(0, 6);

  return `
    <section class="section">
      <div class="section-title"><h2>6. Evidence Photos from Repair Reports</h2><span>จัดกลุ่มเป็นงานเดียวกัน อ่านง่ายแบบรายงาน พร้อมรูป Before / After และชื่อช่างผู้ซ่อม</span></div>
      <div class="evidence-job-grid">
        ${grouped.map(group => {
          const row = group.row || {};
          const photoGridClass = group.photos.length === 1 ? 'single' : group.photos.length === 2 ? 'double' : 'multi';
          return `
            <article class="evidence-card grouped-job">
              <div class="evidence-photo-stack ${photoGridClass}">
                ${group.photos.map(photo => {
                  const photoTypeClass = classifyEvidenceImageType(photo.imageType);
                  return `
                  <figure class="evidence-photo-item ${photoTypeClass}">
                    <img class="evidence-photo ${photoTypeClass}" src="${escapeHtml(photo.url)}" alt="Repair evidence" loading="eager" decoding="sync" referrerpolicy="no-referrer">
                    <figcaption class="evidence-photo-caption ${photoTypeClass}">${escapeHtml(photo.imageType || 'Repair Photo')}</figcaption>
                  </figure>
                `;}).join('')}
              </div>
              <div class="evidence-info">
                <strong>${escapeHtml(row.machine_name || "-")} | ${escapeHtml(row.machine_no || "-")}</strong>
                <div class="evidence-meta-list">
                  <p class="evidence-meta-item"><span class="evidence-detail-title">วันที่</span><span class="evidence-detail-value">${escapeHtml(formatDateForReport(row.repair_date))} · กะ ${escapeHtml(row.shift || "-")}</span></p>
                  <p class="evidence-meta-item"><span class="evidence-detail-title">ช่างผู้ซ่อม</span><span class="evidence-detail-value">${escapeHtml(row.technician_name || row.technician || row.technician_code || "-")}</span></p>
                  <p class="evidence-meta-item"><span class="evidence-detail-title">ช่วงเวลาซ่อม</span><span class="evidence-detail-value">${escapeHtml(formatRepairTimeRange(row))}</span></p>
                  <p class="evidence-meta-item"><span class="evidence-detail-title">จุดเสีย</span><span class="evidence-detail-value">${escapeHtml(row.area_point_name || "-")}</span></p>
                  <p class="evidence-meta-item"><span class="evidence-detail-title">อาการ</span><span class="evidence-detail-value">${escapeHtml(row.problem_name || "-")}</span></p>
                  <p class="evidence-meta-item is-downtime"><span class="evidence-detail-title">Downtime</span><span class="evidence-detail-value">${formatNumber(row.loss_time_min)} นาที</span></p>
                  <p class="evidence-meta-item"><span class="evidence-detail-title">การแก้ไข</span><span class="evidence-detail-value">${escapeHtml(row.action_name || row.action || "-")}</span></p>
                  <p class="evidence-meta-item"><span class="evidence-detail-title">ผลหลังซ่อม</span><span class="evidence-detail-value">${escapeHtml(row.repair_result || row.result || "-")}</span></p>
                </div>
                <p class="evidence-remark"><span class="evidence-detail-title">หมายเหตุช่าง</span><span class="evidence-detail-value">${escapeHtmlWithBreaks(row.remark || row.remarks || "-")}</span></p>
                <div class="evidence-type-row">
                  ${(() => {
                    const counts = {};
                    group.photos.forEach(photo => {
                      const label = photo.imageType || "Repair Photo";
                      counts[label] = (counts[label] || 0) + 1;
                    });
                    return Object.entries(counts).map(([label, count]) => `<span class="evidence-badge">${escapeHtml(label)}${count > 1 ? ` × ${count}` : ``}</span>`).join('');
                  })()}
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>`;
}

function reportKpiCard(label, value, note, colorClass) {
  return `
    <div class="kpi ${colorClass}">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
      <div class="note">${escapeHtml(note)}</div>
    </div>
  `;
}

function reportBarList(items, maxValue, suffix, color = "blue") {
  if (!items || !items.length) {
    return `<div class="empty">ไม่มีข้อมูล</div>`;
  }

  return `
    <div class="bar-list">
      ${items.map(([name, value]) => {
        const percent = maxValue ? clamp((Number(value || 0) / maxValue) * 100, 4, 100) : 0;
        return `
          <div class="bar-row">
            <div class="bar-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
            <div class="bar-track"><div class="bar-fill ${color}" style="width:${percent}%"></div></div>
            <div class="bar-value">${formatNumber(value)} ${escapeHtml(suffix)}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderReportStatus(status) {
  if (status === "critical") return `<span class="pill critical">วิกฤต</span>`;
  if (status === "watch") return `<span class="pill watch">เฝ้าระวัง</span>`;
  return `<span class="pill normal">ปกติ</span>`;
}

function getPresentationPeriodText() {
  const from = els.fromDate?.value || "";
  const to = els.toDate?.value || "";

  if (!from || !to) return "-";

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  const sameMonth = fromDate.getFullYear() === toDate.getFullYear() && fromDate.getMonth() === toDate.getMonth();

  if (sameMonth) {
    return fromDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }

  return `${formatDateForReport(from)} - ${formatDateForReport(to)}`;
}

function getPresentationFilterText() {
  const shiftText = els.shiftFilter?.value ? `Shift ${els.shiftFilter.value}` : "All Shifts";
  const machineText = els.machineFilter?.value || "All Machines";
  return `${shiftText} / ${machineText}`;
}

function formatDateForReport(value) {
  if (!value) return "-";
  return parseDate(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
