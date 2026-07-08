const STORAGE_KEY = "droppingDataV3";
const STATE_KEY = "droppingStateV3";

let appData = normalizeData(loadData());
let activeGroupIndex = null;
let activeCheckpointIndex = 0;
let lastPosition = null;
let lastVisibleUpdateAt = 0;
let nextUpdateAt = 0;
let watchId = null;
let updateTimerId = null;
let countdownTimerId = null;
let arrivedKeyShown = null;

const els = {
  setupCard: document.getElementById("setupCard"),
  routeCard: document.getElementById("routeCard"),
  groupSelect: document.getElementById("groupSelect"),
  startBtn: document.getElementById("startBtn"),
  resetBtn: document.getElementById("resetBtn"),
  nextBtn: document.getElementById("nextBtn"),
  connectionBadge: document.getElementById("connectionBadge"),
  groupName: document.getElementById("groupName"),
  checkpointName: document.getElementById("checkpointName"),
  stepText: document.getElementById("stepText"),
  progressBar: document.getElementById("progressBar"),
  updateText: document.getElementById("updateText"),
  distanceText: document.getElementById("distanceText"),
  countdownText: document.getElementById("countdownText"),
  arrivalBox: document.getElementById("arrivalBox"),
  checkpointMessage: document.getElementById("checkpointMessage"),
  locationText: document.getElementById("locationText")
};

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  // Import older versions if present
  const older = localStorage.getItem("droppingData");
  if (older) return JSON.parse(older);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
  return DEFAULT_DATA;
}

function normalizeData(data) {
  if (!data.settings) data.settings = { radiusMeters: 50, updateIntervalMinutes: 5 };
  if (!data.settings.radiusMeters) data.settings.radiusMeters = 50;
  if (!data.settings.updateIntervalMinutes) data.settings.updateIntervalMinutes = 5;
  return data;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify({
    groupIndex: activeGroupIndex,
    checkpointIndex: activeCheckpointIndex
  }));
}

function loadState() {
  const raw = localStorage.getItem(STATE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function populateGroups() {
  els.groupSelect.innerHTML = "";
  appData.groups.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = group.name;
    els.groupSelect.appendChild(option);
  });
}

function init() {
  saveData();
  populateGroups();

  const state = loadState();
  if (state && appData.groups[state.groupIndex]) {
    activeGroupIndex = state.groupIndex;
    activeCheckpointIndex = state.checkpointIndex || 0;
    showRoute();
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

function currentGroup() {
  return appData.groups[activeGroupIndex];
}

function currentCheckpoint() {
  return currentGroup()?.checkpoints?.[activeCheckpointIndex];
}

function showRoute() {
  const group = currentGroup();
  const checkpoint = currentCheckpoint();

  els.setupCard.classList.add("hidden");
  els.routeCard.classList.remove("hidden");
  els.arrivalBox.classList.add("hidden");
  arrivedKeyShown = null;

  els.groupName.textContent = group.name;
  els.checkpointName.textContent = checkpoint ? checkpoint.name : "Route voltooid";

  const total = group.checkpoints.length;
  const step = Math.min(activeCheckpointIndex + 1, total);
  els.stepText.textContent = `Checkpoint ${step} van ${total}`;
  els.progressBar.style.width = `${((activeCheckpointIndex) / total) * 100}%`;

  saveState();
  startLocationSystem();
}

function startLocationSystem() {
  if (!navigator.geolocation) {
    setStatus("GPS niet ondersteund", "error");
    return;
  }

  clearTimers();
  requestLocation(true);

  // WatchPosition may fire more often than desired, so display updates are throttled.
  watchId = navigator.geolocation.watchPosition(
    pos => handlePosition(pos, false),
    handleGeoError,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
  );

  const intervalMs = getIntervalMs();
  updateTimerId = setInterval(() => requestLocation(true), intervalMs);
  countdownTimerId = setInterval(updateCountdown, 1000);
}

function clearTimers() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  if (updateTimerId !== null) clearInterval(updateTimerId);
  if (countdownTimerId !== null) clearInterval(countdownTimerId);
  watchId = null;
  updateTimerId = null;
  countdownTimerId = null;
}

function getIntervalMs() {
  return Math.max(1, Number(appData.settings.updateIntervalMinutes || 5)) * 60 * 1000;
}

function requestLocation(forceDisplay) {
  setGpsBadge(false, "GPS...");
  navigator.geolocation.getCurrentPosition(
    pos => handlePosition(pos, forceDisplay),
    handleGeoError,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function handlePosition(position, forceDisplay = false) {
  lastPosition = position;
  setGpsBadge(true, "GPS OK");

  const now = Date.now();
  const intervalMs = getIntervalMs();

  if (forceDisplay || now - lastVisibleUpdateAt >= intervalMs) {
    lastVisibleUpdateAt = now;
    nextUpdateAt = now + intervalMs;
    updateDistanceDisplay();
    updateCountdown();
    playSound("update");
    vibrate("update");
  }
}

function setGpsBadge(ok, text) {
  els.connectionBadge.textContent = text;
  els.connectionBadge.classList.toggle("gps-ok", ok);
  els.connectionBadge.classList.toggle("gps-error", !ok);
}

function playSound(type = "update") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const notes = type === "arrival"
      ? [523.25, 659.25, 783.99, 1046.5]
      : [880, 1175];

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.09);
      osc.connect(gain);
      osc.start(ctx.currentTime + index * 0.09);
      osc.stop(ctx.currentTime + index * 0.09 + 0.08);
    });

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(type === "arrival" ? 0.11 : 0.07, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + notes.length * 0.09 + 0.14);
  } catch (e) {}
}

function vibrate(type = "update") {
  if (!navigator.vibrate) return;
  if (type === "arrival") navigator.vibrate([220, 90, 220, 90, 320]);
  else navigator.vibrate(120);
}

function handleGeoError(error) {
  setGpsBadge(false, "GPS fout");
  const messages = {
    1: "GPS-toegang geweigerd. Zet locatie-toegang aan voor deze website.",
    2: "Locatie is niet beschikbaar. Probeer buiten of met beter bereik.",
    3: "Locatie zoeken duurde te lang. Probeer opnieuw."
  };
  els.updateText.textContent = messages[error.code] || "Onbekende GPS-fout.";
}

function updateDistanceDisplay() {
  const group = currentGroup();
  const checkpoint = currentCheckpoint();

  if (!checkpoint) {
    els.distanceText.textContent = "Klaar";
    els.updateText.textContent = "Route voltooid";
    els.progressBar.style.width = "100%";
    clearTimers();
    return;
  }

  const userLat = lastPosition.coords.latitude;
  const userLng = lastPosition.coords.longitude;
  const distance = distanceMeters(userLat, userLng, checkpoint.lat, checkpoint.lng);

  els.distanceText.textContent = formatDistance(distance);
  els.updateText.textContent = `Laatst bijgewerkt om ${new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`;
  els.locationText.textContent = `Jouw locatie is beschikbaar. Doelcoördinaten en richting blijven verborgen.`;
  els.progressBar.style.width = `${(activeCheckpointIndex / group.checkpoints.length) * 100}%`;

  const radius = Number(appData.settings.radiusMeters || 50);
  if (distance <= radius) {
    els.arrivalBox.classList.remove("hidden");
    els.checkpointMessage.textContent = checkpoint.message || "Checkpoint bereikt.";
    els.hintText.textContent = "Jullie zijn dicht genoeg bij het checkpoint.";
    tryVibrate();
  } else if (distance < radius * 3) {
    els.arrivalBox.classList.add("hidden");
    els.hintText.textContent = "Jullie zijn in de buurt. Zoek goed om je heen.";
  } else {
    els.arrivalBox.classList.add("hidden");
    els.hintText.textContent = "Blijf puzzelen met de route. De app geeft geen richting weg.";
  }
}

function updateCountdown() {
  if (!nextUpdateAt) {
    els.countdownText.textContent = "--:--";
    return;
  }

  const remaining = Math.max(0, nextUpdateAt - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  els.countdownText.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function tryVibrate() {
  if (navigator.vibrate) navigator.vibrate([180, 80, 180]);
}

function nextCheckpoint() {
  const group = currentGroup();
  activeCheckpointIndex += 1;

  if (activeCheckpointIndex >= group.checkpoints.length) {
    els.arrivalBox.classList.add("hidden");
    els.checkpointName.textContent = "Route voltooid";
    els.stepText.textContent = `Route voltooid`;
    els.progressBar.style.width = "100%";
    els.distanceText.textContent = "Klaar";
    els.updateText.textContent = "Route voltooid";
    saveState();
    clearTimers();
    return;
  }

  lastVisibleUpdateAt = 0;
  nextUpdateAt = 0;
  showRoute();
}

function resetRoute() {
  localStorage.removeItem(STATE_KEY);
  clearTimers();
  location.reload();
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return "GPS zoeken...";
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

els.startBtn.addEventListener("click", () => {
  activeGroupIndex = Number(els.groupSelect.value);
  activeCheckpointIndex = 0;
  lastVisibleUpdateAt = 0;
  showRoute();
});

els.nextBtn.addEventListener("click", nextCheckpoint);
els.resetBtn.addEventListener("click", resetRoute);

init();
