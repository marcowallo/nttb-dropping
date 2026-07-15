(() => {
  const LOCAL_STATE_KEY = "dropping_v10_state";

  const els = {
    introCard: document.getElementById("introCard"),
    introTitle: document.getElementById("introTitle"),
    introText: document.getElementById("introText"),
    continueBtn: document.getElementById("continueBtn"),
    setupCard: document.getElementById("setupCard"),
    routeCard: document.getElementById("routeCard"),
    groupSelect: document.getElementById("groupSelect"),
    startBtn: document.getElementById("startBtn"),
    resetBtn: document.getElementById("resetBtn"),
    gpsBadge: document.getElementById("gpsBadge"),
    groupName: document.getElementById("groupName"),
    scoreText: document.getElementById("scoreText"),
    pongProgress: document.getElementById("pongProgress"),
    stepText: document.getElementById("stepText"),
    stopwatchText: document.getElementById("stopwatchText"),
    progressBar: document.getElementById("progressBar"),
    checkpointName: document.getElementById("checkpointName"),
    previousDistanceText: document.getElementById("previousDistanceText"),
    distanceText: document.getElementById("distanceText"),
    countdownText: document.getElementById("countdownText"),
    updateText: document.getElementById("updateText"),
    taskCard: document.getElementById("taskCard"),
    taskList: document.getElementById("taskList"),
    arrivalOverlay: document.getElementById("arrivalOverlay"),
    checkpointMessage: document.getElementById("checkpointMessage"),
    nextBtn: document.getElementById("nextBtn"),
    locationText: document.getElementById("locationText"),
    messageBanner: document.getElementById("messageBanner"),
    emergencyBanner: document.getElementById("emergencyBanner"),
    participantMapCard: document.getElementById("participantMapCard"),
    participantMap: document.getElementById("participantMap")
  };

  let eventData = Utils.normalizeEvent(window.DEFAULT_EVENT_DATA);
  let selectedGroupId = null;
  let lastPosition = null;
  let previousDistance = null;
  let nextUpdateAt = 0;
  let lastArrivalKey = null;
  let currentMessageId = null;
  let currentEmergencyAt = null;
  let participantMapInstance = null;
  let participantMapLayer = null;
  let watchId = null, intervalTimer = null, countdownTimer = null, arrivalTimer = null, stopwatchTimer = null;

  function getState() { try { return JSON.parse(localStorage.getItem(LOCAL_STATE_KEY) || "null"); } catch { return null; } }
  function saveState(patch = {}) {
    const group = selectedGroup();
    const existing = getState() || {};
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify({ groupId: selectedGroupId, startedAt: existing.startedAt || group?.startedAt || Date.now(), ...patch }));
  }
  function clearState() { localStorage.removeItem(LOCAL_STATE_KEY); }
  function selectedGroup() { return selectedGroupId ? eventData.groups[selectedGroupId] : null; }
  function route() { return selectedGroupId ? (eventData.routes[selectedGroupId] || []) : []; }
  function activeIndex() { return Number(selectedGroup()?.currentCheckpointIndex || 0); }
  function activeCheckpoint() { return route()[activeIndex()] || null; }
  function radius() { return Number(eventData.settings.radiusMeters || 50); }
  function intervalMs() { return Number(eventData.settings.updateIntervalMinutes || 5) * 60 * 1000; }
  function arrivalCheckMs() { return Number(eventData.settings.arrivalCheckSeconds || 15) * 1000; }

  function setGps(ok, text) {
    els.gpsBadge.classList.toggle("gps-ok", ok);
    els.gpsBadge.classList.toggle("gps-error", !ok);
    els.gpsBadge.title = text;
  }


  function renderIntro() {
    els.introTitle.textContent = eventData.settings.participantIntroTitle || "Welkom bij de dropping";
    const raw = eventData.settings.participantIntroText || "";
    els.introText.innerHTML = raw
      .split(/\n+/)
      .filter(Boolean)
      .map(line => `<p>${Utils.escapeHtml(line)}</p>`)
      .join("");
  }

  function routeTasks(checkpoint) {
    if (!checkpoint) return [];
    if (Array.isArray(checkpoint.tasks)) return checkpoint.tasks.filter(Boolean);
    if (checkpoint.tasks && typeof checkpoint.tasks === "object") return Object.values(checkpoint.tasks).filter(Boolean);
    if (checkpoint.task) return [checkpoint.task];
    return [];
  }

  function renderParticipantMap() {
    const checkpoint = activeCheckpoint();

    if (!checkpoint?.revealMap || !Number.isFinite(Number(checkpoint.lat)) || !Number.isFinite(Number(checkpoint.lng))) {
      els.participantMapCard.classList.add("hidden");
      return;
    }

    els.participantMapCard.classList.remove("hidden");

    if (!window.L) return;

    if (!participantMapInstance) {
      participantMapInstance = L.map("participantMap", {
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
      }).addTo(participantMapInstance);

      participantMapInstance.dragging.disable();
      participantMapInstance.scrollWheelZoom.disable();
      participantMapInstance.doubleClickZoom.disable();
      participantMapInstance.touchZoom.disable();
      participantMapInstance.boxZoom.disable();
      participantMapInstance.keyboard.disable();
      if (participantMapInstance.tap) participantMapInstance.tap.disable();
    }

    if (participantMapLayer) participantMapLayer.remove();

    participantMapLayer = L.featureGroup();

    L.circleMarker([Number(checkpoint.lat), Number(checkpoint.lng)], {
      radius: 10,
      color: "#8BFF4D",
      fillColor: "#2D9CFF",
      fillOpacity: 0.95,
      weight: 3
    })
    .bindTooltip(checkpoint.name || "Checkpoint", { permanent: false })
    .addTo(participantMapLayer);

    participantMapLayer.addTo(participantMapInstance);

    // Toon ongeveer 200 meter rondom het checkpoint.
    // 1 graad latitude is ongeveer 111.320 meter.
    const lat = Number(checkpoint.lat);
    const lng = Number(checkpoint.lng);
    const radiusMeters = 200;
    const latDelta = radiusMeters / 111320;
    const lngDelta = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));

    const bounds = L.latLngBounds(
      [lat - latDelta, lng - lngDelta],
      [lat + latDelta, lng + lngDelta]
    );

    participantMapInstance.fitBounds(bounds, {
      padding: [0, 0],
      animate: false
    });

    setTimeout(() => participantMapInstance.invalidateSize(), 150);
  }

  function populateGroups() {
    els.groupSelect.innerHTML = "";
    Utils.groupsArray(eventData).filter(g => g.active !== false).forEach(group => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = group.name;
      els.groupSelect.appendChild(option);
    });
  }

  function renderRoute() {
    const group = selectedGroup();
    const cps = route();
    const checkpoint = activeCheckpoint();
    if (!group) return;

    els.setupCard.classList.add("hidden");
    els.routeCard.classList.remove("hidden");
    els.groupName.textContent = group.name;
    els.scoreText.textContent = `Score: ${Number(group.score || 0)}`;
    els.checkpointName.textContent = checkpoint ? checkpoint.name : "Route voltooid";

    const idx = activeIndex();
    const total = cps.length || 1;
    els.stepText.textContent = checkpoint ? `Checkpoint ${idx + 1} van ${total}` : "Route voltooid";
    els.progressBar.style.width = `${Math.min(100, (idx / total) * 100)}%`;

    els.pongProgress.innerHTML = "";
    cps.forEach((cp, i) => {
      const dot = document.createElement("span");
      dot.className = i < idx ? "route-point done" : i === idx ? "route-point active" : "route-point todo";
      dot.setAttribute("aria-label", i === cps.length - 1 ? "Eindlocatie" : `Checkpoint ${i + 1}`);
      if (cp.active === false) dot.classList.add("inactive");
      els.pongProgress.appendChild(dot);
    });

    renderTask(checkpoint);
    renderMessages();
    renderParticipantMap();
  }

  function renderTask(checkpoint) {
    const tasks = routeTasks(checkpoint);

    if (!checkpoint || !tasks.length) {
      els.taskCard.classList.add("hidden");
      return;
    }

    els.taskCard.classList.remove("hidden");
    els.taskList.innerHTML = "";

    tasks.forEach((task, index) => {
      const item = document.createElement("div");
      item.className = "task-item";
      item.innerHTML = `<span class="task-number">${index + 1}</span><p>${Utils.escapeHtml(task)}</p>`;
      els.taskList.appendChild(item);
    });
  }

  function renderMessages() {
    if (!selectedGroupId) return;
    const msg = eventData.messages?.[selectedGroupId];
    if (msg && msg.id !== currentMessageId) {
      currentMessageId = msg.id;
      els.messageBanner.textContent = msg.message;
      els.messageBanner.classList.remove("hidden");
      Notify.show("Bericht van de leiding", msg.message, "update");
    } else if (!msg) {
      els.messageBanner.classList.add("hidden");
    }

    const emergency = eventData.emergency;
    if (emergency?.active) {
      els.emergencyBanner.textContent = emergency.message || eventData.settings.emergencyMessage || "Noodmelding";
      els.emergencyBanner.classList.remove("hidden");
      if (currentEmergencyAt !== emergency.updatedAt) {
        currentEmergencyAt = emergency.updatedAt;
        Notify.show("Noodmelding", emergency.message || "Noodmelding van de leiding", "emergency");
      }
    } else {
      els.emergencyBanner.classList.add("hidden");
    }
  }

  function startGps() {
    clearTimers();
    requestLocation(true);
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        pos => handlePosition(pos, false, false),
        error => { setGps(false, "GPS fout"); els.updateText.textContent = gpsError(error); },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    }
    intervalTimer = setInterval(() => requestLocation(true), intervalMs());
    countdownTimer = setInterval(updateCountdown, 1000);
    arrivalTimer = setInterval(() => requestLocation(false, true), arrivalCheckMs());
    stopwatchTimer = setInterval(updateStopwatch, 1000);
  }

  function clearTimers() {
    if (watchId !== null && "geolocation" in navigator) navigator.geolocation.clearWatch(watchId);
    [intervalTimer, countdownTimer, arrivalTimer, stopwatchTimer].forEach(t => t && clearInterval(t));
    watchId = intervalTimer = countdownTimer = arrivalTimer = stopwatchTimer = null;
  }

  function requestLocation(visible, arrivalOnly = false) {
    if (!("geolocation" in navigator)) { els.updateText.textContent = "GPS wordt niet ondersteund."; return; }
    setGps(false, "GPS zoeken");
    navigator.geolocation.getCurrentPosition(
      pos => handlePosition(pos, visible, arrivalOnly),
      error => { setGps(false, "GPS fout"); els.updateText.textContent = gpsError(error); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  function handlePosition(pos, visible, arrivalOnly) {
    lastPosition = pos;
    setGps(true, "GPS OK");
    const cp = activeCheckpoint();
    if (!cp) return;
    const distance = Distance.meters(pos.coords.latitude, pos.coords.longitude, cp.lat, cp.lng);
    if (arrivalOnly) {
      if (distance <= radius()) { visibleUpdate(distance, true); showArrival(); }
      return;
    }
    if (visible) visibleUpdate(distance, false);
  }

  function visibleUpdate(distance, silent) {
    if (previousDistance !== null) {
      els.previousDistanceText.textContent = `Vorige afstand: ${Distance.format(previousDistance)}`;
      els.previousDistanceText.classList.remove("hidden");
    }
    previousDistance = distance;
    els.distanceText.textContent = Distance.format(distance);
    els.updateText.textContent = `Laatst bijgewerkt om ${new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`;
    els.locationText.textContent = `Jouw locatie is beschikbaar. Nauwkeurigheid: ongeveer ${Math.round(lastPosition.coords.accuracy || 0)} m.`;
    nextUpdateAt = Date.now() + intervalMs();
    updateCountdown();
    uploadLive(Math.round(distance));
    if (!silent) Notify.show("Nieuwe update", "De afstand is bijgewerkt.", "update");
    if (distance <= radius()) showArrival();
  }

  async function showArrival() {
    const cp = activeCheckpoint();
    const group = selectedGroup();
    if (!cp || !group) return;
    const key = `${selectedGroupId}-${activeIndex()}`;
    els.arrivalOverlay.classList.remove("hidden");
    els.checkpointMessage.textContent = cp.message || "Checkpoint bereikt.";
    if (lastArrivalKey !== key) {
      lastArrivalKey = key;
      Notify.show("Checkpoint bereikt!", cp.message || "Checkpoint bereikt.", "arrival");
      uploadLive(0, "arrived");
      if (Db.isEnabled()) {
        const newScore = Number(group.score || 0) + Number(cp.points || 0);
        await Db.setGroup(selectedGroupId, { ...group, score: newScore });
      }
    }
  }

  async function nextCheckpoint() {
    const group = selectedGroup();
    const cps = route();
    if (!group) return;
    const nextIndex = activeIndex() + 1;
    lastArrivalKey = null;
    previousDistance = null;
    els.previousDistanceText.classList.add("hidden");
    els.arrivalOverlay.classList.add("hidden");
    if (nextIndex >= cps.length) {
      const finished = { ...group, currentCheckpointIndex: cps.length, finishedAt: Date.now() };
      if (Db.isEnabled()) await Db.setGroup(selectedGroupId, finished);
      eventData.groups[selectedGroupId] = finished;
      uploadLive(0, "completed");
      renderRoute();
      clearTimers();
      return;
    }
    const updated = { ...group, currentCheckpointIndex: nextIndex };
    if (Db.isEnabled()) await Db.setGroup(selectedGroupId, updated);
    eventData.groups[selectedGroupId] = updated;
    renderRoute();
    startGps();
  }

  function updateCountdown() {
    if (!nextUpdateAt) { els.countdownText.textContent = "--:--"; return; }
    const remaining = Math.max(0, nextUpdateAt - Date.now());
    const m = Math.floor(remaining / 60000), s = Math.floor((remaining % 60000) / 1000);
    els.countdownText.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    if (remaining === 0 && document.hidden) Notify.show("Tijd voor een update", "Open Dropping om de nieuwe afstand te bekijken.", "update");
  }

  function updateStopwatch() {
    const st = getState();
    const startedAt = st?.startedAt || selectedGroup()?.startedAt;
    els.stopwatchText.textContent = startedAt ? Utils.formatTime(Date.now() - Number(startedAt)) : "00:00";
  }

  function uploadLive(distanceMeters, progress = "active") {
    if (!Db.isEnabled() || !selectedGroupId) return;
    const group = selectedGroup();
    const cp = activeCheckpoint();
    const payload = {
      groupId: selectedGroupId,
      groupName: group?.name || selectedGroupId,
      activeCheckpointIndex: activeIndex(),
      activeCheckpointName: cp ? cp.name : "Route voltooid",
      distanceMeters,
      progress,
      score: Number(group?.score || 0),
      startedAt: getState()?.startedAt || group?.startedAt || null
    };
    if (lastPosition) {
      payload.lat = lastPosition.coords.latitude;
      payload.lng = lastPosition.coords.longitude;
      payload.accuracy = Math.round(lastPosition.coords.accuracy || 0);
    }
    Db.updateLive(selectedGroupId, payload).catch(console.warn);
  }

  function gpsError(error) { return ({1:"GPS-toegang geweigerd.",2:"Locatie niet beschikbaar.",3:"GPS zoeken duurde te lang."})[error.code] || "GPS-fout."; }
  function reset() { clearTimers(); clearState(); location.href = "index.html?reset=1"; }

  async function start() {
    selectedGroupId = els.groupSelect.value;
    const group = selectedGroup();
    const startedAt = group?.startedAt || Date.now();
    saveState({ startedAt });
    if (Db.isEnabled() && group && !group.startedAt) {
      await Db.setGroup(selectedGroupId, { ...group, startedAt, currentCheckpointIndex: group.currentCheckpointIndex || 0 });
    }
    renderRoute();
    startGps();
  }

  async function init() {
    Notify.requestPermission();
    Db.init();
    if (Db.isEnabled()) {
      eventData = await Db.bootstrap(window.DEFAULT_EVENT_DATA);
      Db.onEvent(data => {
        eventData = data;
        populateGroups();
        if (selectedGroupId) renderRoute();
      });
    } else {
      eventData = Utils.normalizeEvent(window.DEFAULT_EVENT_DATA);
    }
    renderIntro();
    populateGroups();
    const st = getState();
    if (st?.groupId && eventData.groups[st.groupId]) {
      selectedGroupId = st.groupId;
      els.introCard.classList.add("hidden");
      els.setupCard.classList.add("hidden");
      renderRoute();
      startGps();
    }
  }

  els.continueBtn.addEventListener("click", () => {
    els.introCard.classList.add("hidden");
    els.setupCard.classList.remove("hidden");
  });
  els.startBtn.addEventListener("click", start);
  els.resetBtn.addEventListener("click", reset);
  els.nextBtn.addEventListener("click", nextCheckpoint);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && selectedGroupId && nextUpdateAt && Date.now() >= nextUpdateAt) requestLocation(true);
  });
  init();
})();
