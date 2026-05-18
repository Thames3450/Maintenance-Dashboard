const SUPABASE_URL = "https://crigkewtzvslkpmsufxk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaWdrZXd0enZzbGtwbXN1ZnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDc5OTQsImV4cCI6MjA5Mzk4Mzk5NH0.G13M84Qz7mjLXuCtdCHe07BpP7feeBwVD4c2K4czot4";


const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  rows: [],
  filteredRows: [],
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

  state.filteredRows = state.rows.filter(row => {
    if (shift && row.shift !== shift) return false;
    if (machine && row.machine_name !== machine) return false;
    return true;
  });

  renderAll();
}

/* ================= Render All ================= */

function renderAll() {
  const rows = state.filteredRows;

  updatePlannedTimeText();

  renderDashboardCards(rows);
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
  els.focusMachineDetail.textContent = topMachine ? `Downtime รวม ${formatNumber(topMachine[1])} นาที` : "-";

  els.focusProblem.textContent = topProblem ? topProblem[0] : "-";
  els.focusProblemDetail.textContent = topProblem ? `พบทั้งหมด ${formatNumber(topProblem[1])} ครั้ง` : "-";

  els.focusArea.textContent = topArea ? topArea[0] : "-";
  els.focusAreaDetail.textContent = topArea ? `พบทั้งหมด ${formatNumber(topArea[1])} ครั้ง` : "-";

  els.focusShift.textContent = topShift ? `กะ ${topShift[0]}` : "-";
  els.focusShiftDetail.textContent = topShift ? `Downtime รวม ${formatNumber(topShift[1])} นาที` : "-";
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
    "Downtime (นาที)",
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
    "Downtime (นาที)",
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
      <p>${escapeHtml(highestDowntime.machine_name)} | ${escapeHtml(highestDowntime.machine_no)} Downtime สูงสุด ${formatNumber(highestDowntime.downtimeHr, 1)} ชั่วโมง จาก ${highestDowntime.failureCount} ครั้ง</p>
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
      label: "Downtime (ชม.)",
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
          label: "Downtime (นาที)",
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

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}