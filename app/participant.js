(() => {
  const els = {
    setupCard: document.getElementById("setupCard"),
    routeCard: document.getElementById("routeCard"),
    groupSelect: document.getElementById("groupSelect"),
    startBtn: document.getElementById("startBtn"),
    resetBtn: document.getElementById("resetBtn"),
    nextBtn: document.getElementById("nextBtn"),
    gpsBadge: document.getElementById("gpsBadge"),
    groupName: document.getElementById("groupName"),
    checkpointName: document.getElementById("checkpointName"),
    stepText: document.getElementById("stepText"),
    updateText: document.getElementById("updateText"),
    pongProgress: document.getElementById("pongProgress"),
    progressBar: document.getElementById("progressBar"),
    previousDistanceText: document.getElementById("previousDistanceText"),
    distanceText: document.getElementById("distanceText"),
    countdownText: document.getElementById("countdownText"),
    arrivalOverlay: document.getElementById("arrivalOverlay"),
    checkpointMessage: document.getElementById("checkpointMessage"),
    locationText: document.getElementById("locationText")
  };

  let data = DroppingStorage.getData();
  let activeGroupIndex = null;
  let activeCheckpointIndex = 0;
  let lastPosition = null;
  let lastVisibleUpdateAt = 0;
  let nextUpdateAt = 0;
  let previousDistance = null;
  let arrivedKeyShown = null;

  let watchId = null;
  let intervalId = null;
  let countdownId = null;
  let arrivalCheckId = null;
  let remoteUnsubscribe = null;

  function currentGroup() {
    return activeGroupIndex !== null ? data.groups[activeGroupIndex] : null;
  }

  function currentCheckpoint() {
    return currentGroup()?.checkpoints?.[activeCheckpointIndex] || null;
  }

  function intervalMs() {
    return Math.max(1, Number(data.settings.updateIntervalMinutes || 5)) * 60 * 1000;
  }

  function radiusMeters() {
    return Math.max(5, Number(data.settings.radiusMeters || 50));
  }

  function arrivalCheckMs() {
    return Math.max(5, Number(data.settings.arrivalCheckSeconds || 15)) * 1000;
  }

  function setGps(ok, text) {
    els.gpsBadge.classList.toggle("gps-ok", ok);
    els.gpsBadge.classList.toggle("gps-error", !ok);
    els.gpsBadge.title = text;
  }

  function populateGroups() {
    els.groupSelect.innerHTML = "";
    data.groups.forEach((group, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = group.name;
      els.groupSelect.appendChild(option);
    });
  }

  function saveState() {
    DroppingStorage.setState({ groupIndex: activeGroupIndex, checkpointIndex: activeCheckpointIndex });
  }

  function renderProgress() {
    const group = currentGroup();
    if (!group) return;

    els.pongProgress.innerHTML = "";
    group.checkpoints.forEach((_, index) => {
      const dot = document.createElement("span");
      dot.className = index < activeCheckpointIndex ? "pong-dot done" : index === activeCheckpointIndex ? "pong-dot active" : "pong-dot todo";
      dot.textContent = index === group.checkpoints.length - 1 ? "🏁" : "🏓";
      els.pongProgress.appendChild(dot);
    });

    const total = group.checkpoints.length;
    els.stepText.textContent = `Checkpoint ${Math.min(activeCheckpointIndex + 1, total)} van ${total}`;
    els.progressBar.style.width = `${(activeCheckpointIndex / total) * 100}%`;
  }

  function showRoute() {
    const group = currentGroup();
    const checkpoint = currentCheckpoint();
    if (!group) return;

    els.setupCard.classList.add("hidden");
    els.routeCard.classList.remove("hidden");
    els.arrivalOverlay.classList.add("hidden");

    els.groupName.textContent = group.name;
    els.checkpointName.textContent = checkpoint ? checkpoint.name : "Route voltooid";
    renderProgress();
    saveState();
    startLocationSystem();
  }

  function clearTimers() {
    GpsService.clearWatch(watchId);
    if (intervalId) clearInterval(intervalId);
    if (countdownId) clearInterval(countdownId);
    if (arrivalCheckId) clearInterval(arrivalCheckId);
    watchId = intervalId = countdownId = arrivalCheckId = null;
  }

  function startLocationSystem() {
    clearTimers();
    requestLocation({ visible: true });

    watchId = GpsService.watch(
      position => handlePosition(position, { visible: false }),
      error => {
        setGps(false, "GPS fout");
        els.updateText.textContent = GpsService.errorMessage(error);
      }
    );

    intervalId = setInterval(() => requestLocation({ visible: true }), intervalMs());
    countdownId = setInterval(updateCountdown, 1000);
    arrivalCheckId = setInterval(() => requestLocation({ arrivalOnly: true }), arrivalCheckMs());
  }

  async function requestLocation({ visible = false, arrivalOnly = false } = {}) {
    try {
      setGps(false, "GPS zoeken");
      const position = await GpsService.getCurrent({ highAccuracy: true, timeout: 20000, maxAge: 0 });
      handlePosition(position, { visible, arrivalOnly });
    } catch (error) {
      setGps(false, "GPS fout");
      els.updateText.textContent = GpsService.errorMessage(error);
    }
  }

  function handlePosition(position, { visible = false, arrivalOnly = false } = {}) {
    lastPosition = position;
    setGps(true, "GPS OK");

    const checkpoint = currentCheckpoint();
    if (!checkpoint) return;

    const distance = Distance.meters(
      position.coords.latitude,
      position.coords.longitude,
      checkpoint.lat,
      checkpoint.lng
    );

    if (arrivalOnly) {
      if (distance <= radiusMeters()) {
        makeVisibleUpdate(distance, { silentUpdateNotification: true });
        showArrival();
      }
      return;
    }

    if (visible || Date.now() - lastVisibleUpdateAt >= intervalMs()) {
      makeVisibleUpdate(distance);
    }
  }

  function makeVisibleUpdate(distance, { silentUpdateNotification = false } = {}) {
    const now = Date.now();
    lastVisibleUpdateAt = now;
    nextUpdateAt = now + intervalMs();

    if (previousDistance !== null) {
      els.previousDistanceText.textContent = `Vorige afstand: ${Distance.format(previousDistance)}`;
      els.previousDistanceText.classList.remove("hidden");
    }

    previousDistance = distance;
    els.distanceText.textContent = Distance.format(distance);
    els.updateText.textContent = `Laatst bijgewerkt om ${new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`;
    els.locationText.textContent = `Jouw locatie is beschikbaar. Nauwkeurigheid: ongeveer ${Math.round(lastPosition.coords.accuracy || 0)} m.`;

    updateCountdown();
    uploadStatus({ distanceMeters: Math.round(distance) });

    if (!silentUpdateNotification) Notify.show("Nieuwe update", "De afstand is bijgewerkt.", "update");

    if (distance <= radiusMeters()) showArrival();
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

    if (remaining === 0 && document.hidden) {
      Notify.show("Tijd voor een update", "Open Dropping om de nieuwe afstand te bekijken.", "update");
      nextUpdateAt = Date.now() + intervalMs();
    }
  }

  function showArrival() {
    const checkpoint = currentCheckpoint();
    const key = `${activeGroupIndex}-${activeCheckpointIndex}`;
    if (!checkpoint) return;

    els.arrivalOverlay.classList.remove("hidden");
    els.checkpointMessage.textContent = checkpoint.message || "Checkpoint bereikt.";

    if (arrivedKeyShown !== key) {
      arrivedKeyShown = key;
      Notify.show("Checkpoint bereikt!", checkpoint.message || "Jullie zijn bij het checkpoint.", "arrival");
      uploadStatus({ progress: "arrived" });
    }
  }

  function nextCheckpoint() {
    const group = currentGroup();
    if (!group) return;

    activeCheckpointIndex += 1;
    arrivedKeyShown = null;
    previousDistance = null;
    els.previousDistanceText.classList.add("hidden");

    if (activeCheckpointIndex >= group.checkpoints.length) {
      els.arrivalOverlay.classList.add("hidden");
      els.checkpointName.textContent = "Route voltooid";
      els.distanceText.textContent = "Klaar";
      els.stepText.textContent = "Route voltooid";
      els.progressBar.style.width = "100%";
      els.updateText.textContent = "Route voltooid";
      uploadStatus({ progress: "completed", distanceMeters: 0 });
      clearTimers();
      saveState();
      return;
    }

    showRoute();
  }

  function resetRoute() {
    clearTimers();
    DroppingStorage.clearState();
    location.href = "index.html?reset=1";
  }

  function uploadStatus(extra = {}) {
    if (!DroppingFirebase.isEnabled() || activeGroupIndex === null) return;

    const group = currentGroup();
    const checkpoint = currentCheckpoint();
    const payload = {
      activeCheckpointIndex,
      activeCheckpointName: checkpoint ? checkpoint.name : "Route voltooid",
      progress: checkpoint ? "active" : "completed",
      ...extra
    };

    if (lastPosition) {
      payload.lat = lastPosition.coords.latitude;
      payload.lng = lastPosition.coords.longitude;
      payload.accuracy = Math.round(lastPosition.coords.accuracy || 0);
    }

    DroppingFirebase.updateGroupStatus(group.name, payload).catch(console.warn);
  }

  async function init() {
    Notify.requestPermission();

    const params = new URLSearchParams(location.search);
    if (params.has("reset")) data = DroppingStorage.resetData();

    const firebaseReady = DroppingFirebase.init();

    if (firebaseReady) {
      try {
        const remote = await DroppingFirebase.getAppData();
        if (remote) {
          data = DroppingStorage.setData(remote);
        } else {
          await DroppingFirebase.setAppData(data);
        }

        remoteUnsubscribe = DroppingFirebase.onAppData(remoteData => {
          data = DroppingStorage.setData(remoteData);
          populateGroups();

          const state = DroppingStorage.getState();
          if (state && data.groups[state.groupIndex]) {
            activeGroupIndex = state.groupIndex;
            activeCheckpointIndex = Math.min(state.checkpointIndex || 0, data.groups[state.groupIndex].checkpoints.length - 1);
            if (!els.routeCard.classList.contains("hidden")) showRoute();
          }
        });
      } catch (error) {
        console.warn("Firebase laden mislukt. Lokale data wordt gebruikt.", error);
      }
    }

    populateGroups();

    const state = DroppingStorage.getState();
    if (state && data.groups[state.groupIndex]) {
      activeGroupIndex = state.groupIndex;
      activeCheckpointIndex = state.checkpointIndex || 0;
      showRoute();
    }
  }

  els.startBtn.addEventListener("click", () => {
    activeGroupIndex = Number(els.groupSelect.value);
    activeCheckpointIndex = 0;
    previousDistance = null;
    els.previousDistanceText.classList.add("hidden");
    showRoute();
  });

  els.nextBtn.addEventListener("click", nextCheckpoint);
  els.resetBtn.addEventListener("click", resetRoute);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && activeGroupIndex !== null && nextUpdateAt && Date.now() >= nextUpdateAt) {
      requestLocation({ visible: true });
    }
  });

  init();
})();
