(() => {
  "use strict";

  let liveTyphoon = null;
  const sourceUrl = "https://typhoon.slt.zj.gov.cn/";
  const $ = (selector) => document.querySelector(selector);
  const safe = (value, fallback = "--") => value === null || value === undefined || value === "" ? fallback : String(value);
  const timeParts = (value) => {
    if (!value) return { date: "--", time: "--" };
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
    return match ? { date: `${match[2]}月${match[3]}日`, time: match[4] } : { date: value, time: "" };
  };

  const warningStyles = {
    red: { symbol: "红", title: "台风红色预警状态", color: "#c92d25", pale: "#fff0ef" },
    orange: { symbol: "橙", title: "台风橙色预警状态", color: "#cf570f", pale: "#fff6e9" },
    yellow: { symbol: "黄", title: "台风黄色预警状态", color: "#b88700", pale: "#fff9dc" },
    blue: { symbol: "蓝", title: "台风蓝色预警状态", color: "#1474b8", pale: "#edf7ff" },
    white: { symbol: "白", title: "路径系统当前无彩色预警", color: "#607784", pale: "#f5f8f9" },
  };

  function showLiveBanner(payload) {
    const banner = $(".demo-banner");
    banner.style.background = "#e7f8f5";
    banner.style.borderColor = "#8ad7ca";
    banner.style.color = "#174f49";
    banner.querySelector("b").textContent = "LIVE";
    banner.querySelector("b").style.background = "#166b61";
    banner.querySelector("strong").textContent = "已接入浙江省水利厅实时路径数据";
    banner.querySelector("span").textContent = `数据快照：${new Date(payload.generatedAt).toLocaleString("zh-CN", { hour12: false })}；预警请以当地主管部门正式发布为准。`;
    $(".data-health").lastChild.textContent = " 实时数据已载入";
  }

  function updateWarning(level) {
    const key = String(level || "white").toLowerCase();
    const style = warningStyles[key] || warningStyles.white;
    const card = $(".warning-card");
    card.style.borderColor = style.color;
    card.style.borderLeftColor = style.color;
    card.style.background = `linear-gradient(105deg, ${style.pale}, #fff 70%)`;
    const disc = $(".warning-level");
    disc.style.background = style.color;
    disc.querySelector("span").textContent = style.symbol;
    const copy = $(".warning-copy");
    copy.querySelector(".eyebrow").textContent = "浙江台风路径系统 · 实时状态";
    copy.querySelector("h2").textContent = style.title;
    copy.querySelector("p:not(.eyebrow)").textContent = key === "white"
      ? "该字段仅表示路径系统当前未返回彩色预警，不代表所在地没有气象风险。"
      : "请立即查看所在地气象台、应急管理部门发布的预警原文和行动指令。";
    const meta = copy.querySelectorAll(".warning-meta span");
    meta[0].textContent = "数据来源：浙江省水利厅";
    meta[1].textContent = "请同时关注所在地气象台正式预警";
    const link = card.querySelector("a");
    link.href = sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "查看数据源网站 →";
  }

  function updateOverview(typhoon) {
    const current = typhoon.current;
    $(".storm-heading .eyebrow").textContent = `当前活跃台风 · 编号 ${typhoon.id}`;
    const title = $("#typhoon-name");
    title.textContent = `台风“${safe(typhoon.name, "未命名")}” `;
    const en = document.createElement("span");
    en.textContent = safe(typhoon.englishName, "NAMELESS");
    title.append(en);
    $(".strength-badge").textContent = safe(current.strength, "强度待更新");
    $(".storm-position strong").textContent = safe(current.positionDescription, "中心位置以经纬度为准").trim();
    $(".storm-position small").textContent = `北纬 ${safe(current.lat)}° · 东经 ${safe(current.lng)}°`;

    const metric = $(".metrics").children;
    metric[0].querySelector("dd strong").textContent = safe(current.power);
    metric[0].querySelector("span").textContent = `${safe(current.windSpeed)} 米/秒`;
    metric[1].querySelector("dd strong").textContent = safe(current.pressure);
    metric[1].querySelector("span").textContent = safe(current.strength, "强度待更新");
    metric[2].querySelector("dd strong").textContent = safe(current.moveDirection);
    metric[2].querySelector("span").textContent = `每小时 ${safe(current.moveSpeed)} 公里`;
    const observed = timeParts(current.time);
    metric[3].querySelector("dt").textContent = "实况时间";
    metric[3].querySelector("dd").innerHTML = "";
    const observedStrong = document.createElement("strong");
    observedStrong.textContent = observed.time;
    metric[3].querySelector("dd").append(observedStrong);
    metric[3].querySelector("span").textContent = observed.date;
    $(".update-line").children[0].textContent = `源数据时间：${safe(current.time)}`;

    const localImpact = $(".local-impact");
    localImpact.querySelector("span").textContent = "本地影响提示";
    localImpact.querySelector("strong").textContent = "请查看宁波市气象台最新预警";

    const side = $(".arrival-card");
    side.querySelector(".eyebrow").textContent = "最新移动趋势";
    side.querySelector("h2").textContent = `${safe(current.moveDirection, "方向待更新")}移动`;
    const countdown = side.querySelector(".countdown");
    if (countdown) countdown.style.display = "none";
    let movement = side.querySelector(".movement-copy");
    if (!movement) {
      movement = document.createElement("p");
      movement.className = "movement-copy";
      side.querySelector("h2").after(movement);
    }
    movement.textContent = safe(current.movementDescription, "移动趋势描述待数据源更新").trim();
    movement.style.color = "#d2e2e9";
    movement.style.fontSize = "13px";
    movement.style.margin = "0 0 18px";
    const rows = side.querySelectorAll("li");
    const values = [
      ["移动速度", `${safe(current.moveSpeed)} 公里/小时`],
      ["移动方向", safe(current.moveDirection)],
      ["预报机构", safe(typhoon.forecastAgency)],
    ];
    rows.forEach((row, index) => {
      row.querySelector("span").textContent = values[index][0];
      row.querySelector("strong").textContent = values[index][1];
    });
    side.querySelector(".forecast-note").textContent = "路径预测存在不确定性，请持续关注最新发布。";
  }

  function updateTimeline(typhoon) {
    const timeline = $(".timeline");
    timeline.textContent = "";
    const entries = [typhoon.current, ...(typhoon.forecast || []).slice(0, 4)];
    entries.forEach((point, index) => {
      const li = document.createElement("li");
      if (index === 0) li.className = "now";
      const time = document.createElement("time");
      time.textContent = point.time ? point.time.slice(5, 16) : "时间待更新";
      const strength = document.createElement("strong");
      strength.textContent = index === 0 ? "当前位置" : safe(point.strength, "预测点");
      const wind = document.createElement("span");
      wind.textContent = `${safe(point.windSpeed)} 米/秒 · ${safe(point.power)} 级`;
      li.append(time, strength, wind);
      timeline.append(li);
    });
  }

  function drawLiveMap(typhoon) {
    const liveCanvas = $("#typhoon-map");
    const box = liveCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    liveCanvas.width = Math.round(box.width * dpr);
    liveCanvas.height = Math.round(box.height * dpr);
    const ctx = liveCanvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const width = box.width, height = box.height, pad = 42;
    ctx.clearRect(0, 0, width, height);
    document.querySelectorAll(".map-label").forEach((label) => label.style.display = "none");

    const history = (typhoon.history || []).filter((p) => Number.isFinite(p.lng) && Number.isFinite(p.lat));
    const forecast = (typhoon.forecast || []).filter((p) => Number.isFinite(p.lng) && Number.isFinite(p.lat));
    const all = [...history, ...forecast];
    if (!all.length) return;
    let minLng = Math.min(...all.map((p) => p.lng)), maxLng = Math.max(...all.map((p) => p.lng));
    let minLat = Math.min(...all.map((p) => p.lat)), maxLat = Math.max(...all.map((p) => p.lat));
    if (maxLng - minLng < 2) { minLng -= 1; maxLng += 1; }
    if (maxLat - minLat < 2) { minLat -= 1; maxLat += 1; }
    const project = (p) => [pad + (p.lng - minLng) / (maxLng - minLng) * (width - pad * 2), height - pad - (p.lat - minLat) / (maxLat - minLat) * (height - pad * 2)];

    ctx.font = "10px Microsoft YaHei";
    ctx.fillStyle = "rgba(31, 92, 112, .68)";
    ctx.fillText(`${maxLat.toFixed(1)}°N`, 8, 18);
    ctx.fillText(`${minLat.toFixed(1)}°N`, 8, height - 10);
    ctx.fillText(`${minLng.toFixed(1)}°E`, pad, height - 10);
    ctx.fillText(`${maxLng.toFixed(1)}°E`, width - 72, height - 10);

    const line = (points, color, dashed) => {
      if (!points.length) return;
      ctx.beginPath();
      points.forEach((point, index) => { const [x, y] = project(point); index ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.setLineDash(dashed ? [8, 7] : []); ctx.stroke();
    };
    line(history, "#1598c5", false);
    line([typhoon.current, ...forecast], "#ee8a2c", true);

    history.forEach((point) => { const [x, y] = project(point); ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = "#1598c5"; ctx.fill(); });
    forecast.forEach((point) => { const [x, y] = project(point); ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#ee8a2c"; ctx.lineWidth = 2; ctx.stroke(); });
    const [cx, cy] = project(typhoon.current);
    ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fillStyle = "#e84c42"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.stroke();
    $(".map-note").textContent = `实时路径 · ${safe(typhoon.forecastAgency)}预报 · 请以源站最新发布为准`;
  }

  function showNoActive(payload) {
    showLiveBanner(payload);
    $("#typhoon-name").textContent = "当前暂无活跃台风";
    $(".storm-heading .eyebrow").textContent = "浙江省水利厅实时路径数据";
    $(".strength-badge").textContent = "无活跃台风";
    $(".overview").querySelectorAll(".metrics dd strong").forEach((item) => item.textContent = "--");
    updateWarning("white");
  }

  async function loadLiveData() {
    const response = await fetch(`data/typhoon.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.typhoons?.length) return showNoActive(payload);
    liveTyphoon = payload.typhoons[0];
    showLiveBanner(payload);
    updateWarning(liveTyphoon.warningLevel);
    updateOverview(liveTyphoon);
    updateTimeline(liveTyphoon);
    drawLiveMap(liveTyphoon);
    $(".source-note p").textContent = "台风实况和路径自动同步自浙江省水利厅台风路径实时发布系统；预警字段不替代所在地气象台、应急管理部门的正式预警和指令。";
  }

  loadLiveData().catch((error) => {
    $(".demo-banner strong").textContent = "实时数据读取失败，当前显示演示数据";
    $(".demo-banner span").textContent = `错误：${error.message}。请以主管部门正式发布的信息为准。`;
    $(".data-health").lastChild.textContent = " 演示数据回退";
  });

  window.addEventListener("resize", () => {
    if (liveTyphoon) window.setTimeout(() => drawLiveMap(liveTyphoon), 180);
  });
})();
