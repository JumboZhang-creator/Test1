import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "data", "typhoon.json");
const API = "https://typhoon.slt.zj.gov.cn/Api";
const SOURCE_URL = "https://typhoon.slt.zj.gov.cn/";

const headers = {
  Accept: "application/json",
  Referer: SOURCE_URL,
  "User-Agent": "coastal-typhoon-alert/1.0 (+GitHub Actions)",
};

async function getJson(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

const numberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function normalizePoint(point, phase) {
  return {
    time: point.time || null,
    lng: numberOrNull(point.lng),
    lat: numberOrNull(point.lat),
    strength: point.strong || null,
    power: numberOrNull(point.power),
    windSpeed: numberOrNull(point.speed),
    pressure: numberOrNull(point.pressure),
    moveSpeed: numberOrNull(point.movespeed),
    moveDirection: point.movedirection || null,
    radius7: point.radius7 || null,
    radius10: point.radius10 || null,
    radius12: point.radius12 || null,
    phase,
  };
}

function normalizeTyphoon(info) {
  const points = Array.isArray(info.points) ? info.points : [];
  if (!points.length) return null;
  const latest = points.at(-1);
  const agencies = Array.isArray(latest.forecast) ? latest.forecast : [];
  const china = agencies.find((item) => item.tm === "中国") || agencies[0];
  const forecast = (china?.forecastpoints || [])
    .filter((point) => point.time !== latest.time)
    .map((point) => normalizePoint(point, "forecast"));

  return {
    id: String(info.tfid),
    name: info.name || "未命名",
    englishName: info.enname || "NAMELESS",
    active: String(info.isactive) === "1",
    warningLevel: info.warnlevel || "white",
    startedAt: info.starttime || null,
    endedAt: info.endtime || null,
    current: {
      ...normalizePoint(latest, "current"),
      positionDescription: latest.ckposition || null,
      movementDescription: latest.jl || null,
    },
    history: points.slice(-40).map((point) => normalizePoint(point, "history")),
    forecastAgency: china?.tm || null,
    forecast,
  };
}

async function main() {
  const now = new Date();
  const year = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(now);
  const list = await getJson(`${API}/TyphoonList/${year}`);
  if (!Array.isArray(list)) throw new Error("Typhoon list is not an array");

  const activeItems = list.filter((item) => String(item.isactive) === "1");
  const typhoons = (
    await Promise.all(activeItems.map((item) => getJson(`${API}/TyphoonInfo/${item.tfid}`)))
  ).map(normalizeTyphoon).filter(Boolean);

  const stablePayload = {
    schemaVersion: 1,
    status: typhoons.length ? "active" : "no-active",
    source: {
      name: "浙江省水利厅台风路径实时发布系统",
      url: SOURCE_URL,
    },
    typhoons,
  };

  let oldPayload = null;
  try {
    oldPayload = JSON.parse(await readFile(OUTPUT, "utf8"));
  } catch {}

  const comparableOld = oldPayload && { ...oldPayload };
  if (comparableOld) delete comparableOld.generatedAt;
  if (JSON.stringify(comparableOld) === JSON.stringify(stablePayload)) {
    console.log("No source-data change; keeping the existing snapshot.");
    return;
  }

  const payload = { ...stablePayload, generatedAt: now.toISOString() };
  await mkdir(dirname(OUTPUT), { recursive: true });
  const temporary = `${OUTPUT}.tmp`;
  await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(temporary, OUTPUT);
  console.log(`Saved ${typhoons.length} active typhoon(s) to ${OUTPUT}`);
}

main().catch((error) => {
  console.error(`Typhoon refresh failed: ${error.message}`);
  process.exitCode = 1;
});
