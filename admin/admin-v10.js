(() => {
  const els = {
    leaderMap: document.getElementById("leaderMap"),
    fitMapBtn: document.getElementById("fitMapBtn"),
    liveStatusList: document.getElementById("liveStatusList"),
    scoreboardList: document.getElementById("scoreboardList"),
    messageGroupSelect: document.getElementById("messageGroupSelect"),
    messageInput: document.getElementById("messageInput"),
    sendMessageBtn: document.getElementById("sendMessageBtn"),
    emergencyInput: document.getElementById("emergencyInput"),
    sendEmergencyBtn: document.getElementById("sendEmergencyBtn"),
    clearEmergencyBtn: document.getElementById("clearEmergencyBtn"),
    messageStatus: document.getElementById("messageStatus"),
    radiusInput: document.getElementById("radiusInput"),
    intervalInput: document.getElementById("intervalInput"),
    arrivalCheckInput: document.getElementById("arrivalCheckInput"),
    groupSelect: document.getElementById("groupSelect"),
    addGroupBtn: document.getElementById("addGroupBtn"),
    deleteGroupBtn: document.getElementById("deleteGroupBtn"),
    skipGroupBtn: document.getElementById("skipGroupBtn"),
    groupNameInput: document.getElementById("groupNameInput"),
    groupScoreInput: document.getElementById("groupScoreInput"),
    groupActiveInput: document.getElementById("groupActiveInput"),
    checkpointEditor: document.getElementById("checkpointEditor"),
    saveBtn: document.getElementById("saveBtn"),
    saveStatus: document.getElementById("saveStatus"),
    testDistanceBtn: document.getElementById("testDistanceBtn"),
    testDistanceResult: document.getElementById("testDistanceResult"),
    exportBtn: document.getElementById("exportBtn"),
    importBtn: document.getElementById("importBtn"),
    jsonBox: document.getElementById("jsonBox")
  };

  let eventData = Utils.normalizeEvent(window.DEFAULT_EVENT_DATA);
  let selectedGroupId = null;
  let liveStatus = {};
  let map = null;
  let markers = new Map();

  function groups() { return Utils.groupsArray(eventData); }
  function selectedGroup() { return selectedGroupId ? eventData.groups[selectedGroupId] : null; }
  function selectedRoute() { return selectedGroupId ? (eventData.routes[selectedGroupId] || []) : []; }
  function flash(message) { els.saveStatus.textContent = message; setTimeout(() => els.saveStatus.textContent = "", 2500); }
  function msg(message) { els.messageStatus.textContent = message; setTimeout(() => els.messageStatus.textContent = "", 2500); }

  function render() {
    if (!selectedGroupId || !eventData.groups[selectedGroupId]) selectedGroupId = groups()[0]?.id || null;
    els.radiusInput.value = eventData.settings.radiusMeters;
    els.intervalInput.value = eventData.settings.updateIntervalMinutes;
    els.arrivalCheckInput.value = eventData.settings.arrivalCheckSeconds;
    renderGroupSelects();
    renderEditor();
    renderScoreboard();
  }

  function renderGroupSelects() {
    [els.groupSelect, els.messageGroupSelect].forEach(select => {
      select.innerHTML = "";
      groups().forEach(group => {
        const opt = document.createElement("option");
        opt.value = group.id;
        opt.textContent = group.name;
        select.appendChild(opt);
      });
    });
    if (selectedGroupId) {
      els.groupSelect.value = selectedGroupId;
      els.messageGroupSelect.value = selectedGroupId;
    }
  }

  function renderEditor() {
    const group = selectedGroup();
    if (!group) return;
    els.groupNameInput.value = group.name;
    els.groupScoreInput.value = Number(group.score || 0);
    els.groupActiveInput.value = String(group.active !== false);
    els.checkpointEditor.innerHTML = "";

    selectedRoute().forEach((cp, index) => {
      const block = document.createElement("div");
      block.className = "checkpoint-block";
      block.innerHTML = `
        <div class="checkpoint-head">
          <h3>${index === selectedRoute().length - 1 ? "Eindlocatie" : `Checkpoint ${index + 1}`}</h3>
          <button class="tiny danger remove-cp" data-index="${index}" ${selectedRoute().length <= 1 ? "disabled" : ""}>Verwijder</button>
        </div>
        <label>Naam</label>
        <input data-index="${index}" data-field="name" value="${Utils.escapeHtml(cp.name)}">
        <div class="grid3">
          <div><label>Latitude</label><input data-index="${index}" data-field="lat" type="number" step="any" value="${Number(cp.lat)}"></div>
          <div><label>Longitude</label><input data-index="${index}" data-field="lng" type="number" step="any" value="${Number(cp.lng)}"></div>
          <div><label>Punten</label><input data-index="${index}" data-field="points" type="number" step="1" value="${Number(cp.points || 0)}"></div>
        </div>
        <label>Checkpoint actief</label>
        <select data-index="${index}" data-field="active">
          <option value="true" ${cp.active !== false ? "selected" : ""}>Actief</option>
          <option value="false" ${cp.active === false ? "selected" : ""}>Niet actief</option>
        </select>
        <label>Bericht bij aankomst</label>
        <textarea data-index="${index}" data-field="message" rows="3">${Utils.escapeHtml(cp.message || "")}</textarea>
        <label>Opdrachttekst</label>
        <textarea data-index="${index}" data-field="task" rows="3">${Utils.escapeHtml(cp.task || "")}</textarea>
        <label>Quizvraag</label>
        <input data-index="${index}" data-field="quizQuestion" value="${Utils.escapeHtml(cp.quizQuestion || "")}">
        <label>Quizantwoord</label>
        <input data-index="${index}" data-field="quizAnswer" value="${Utils.escapeHtml(cp.quizAnswer || "")}">
      `;
      els.checkpointEditor.appendChild(block);
    });

    const add = document.createElement("button");
    add.className = "secondary";
    add.textContent = "Checkpoint toevoegen";
    add.addEventListener("click", addCheckpoint);
    els.checkpointEditor.appendChild(add);

    els.checkpointEditor.querySelectorAll(".remove-cp").forEach(btn => {
      btn.addEventListener("click", () => removeCheckpoint(Number(btn.dataset.index)));
    });
  }

  function readEditor() {
    const group = selectedGroup();
    if (!group) return;
    eventData.settings.radiusMeters = Math.max(5, Number(els.radiusInput.value || 50));
    eventData.settings.updateIntervalMinutes = Math.max(1, Number(els.intervalInput.value || 5));
    eventData.settings.arrivalCheckSeconds = Math.max(5, Number(els.arrivalCheckInput.value || 15));
    eventData.groups[selectedGroupId] = {
      ...group,
      name: els.groupNameInput.value.trim() || group.name,
      score: Number(els.groupScoreInput.value || 0),
      active: els.groupActiveInput.value === "true"
    };
    const route = selectedRoute();
    els.checkpointEditor.querySelectorAll("[data-field]").forEach(input => {
      const index = Number(input.dataset.index);
      const field = input.dataset.field;
      if (!route[index]) return;
      if (field === "lat" || field === "lng" || field === "points") route[index][field] = Number(input.value);
      else if (field === "active") route[index][field] = input.value === "true";
      else route[index][field] = input.value.trim();
    });
  }

  async function saveAll() { readEditor(); if (Db.isEnabled()) await Db.setFullEvent(eventData); flash("Opgeslagen."); render(); }
  async function addGroup() {
    readEditor();
    const id = Utils.safeKey(`groep_${groups().length + 1}_${Date.now()}`);
    eventData.groups[id] = { id, name: `Groep ${groups().length + 1}`, color: "#8BFF4D", active: true, score: 0, currentCheckpointIndex: 0, startedAt: null, finishedAt: null };
    eventData.routes[id] = [
      { id: Utils.uid("cp"), name: "Checkpoint 1", lat: 0, lng: 0, active: true, points: 10, message: "Checkpoint bereikt.", task: "", quizQuestion: "", quizAnswer: "" },
      { id: Utils.uid("finish"), name: "Eindlocatie", lat: 0, lng: 0, active: true, points: 20, message: "Eindlocatie bereikt!", task: "", quizQuestion: "", quizAnswer: "" }
    ];
    selectedGroupId = id;
    if (Db.isEnabled()) await Db.setFullEvent(eventData);
    render();
  }
  async function deleteGroup() {
    if (!selectedGroupId || groups().length <= 1) { flash("Je moet minimaal één groep behouden."); return; }
    const id = selectedGroupId;
    delete eventData.groups[id]; delete eventData.routes[id]; delete eventData.messages[id];
    selectedGroupId = groups()[0]?.id || null;
    if (Db.isEnabled()) await Db.removeGroup(id);
    render();
  }
  function addCheckpoint() {
    readEditor();
    eventData.routes[selectedGroupId].push({ id: Utils.uid("cp"), name: `Checkpoint ${selectedRoute().length + 1}`, lat: 0, lng: 0, active: true, points: 10, message: "Checkpoint bereikt.", task: "", quizQuestion: "", quizAnswer: "" });
    render();
  }
  function removeCheckpoint(index) {
    readEditor();
    if (selectedRoute().length <= 1) return;
    eventData.routes[selectedGroupId].splice(index, 1);
    render();
  }
  async function skipGroup() {
    const group = selectedGroup();
    if (!group) return;
    const next = Math.min((group.currentCheckpointIndex || 0) + 1, selectedRoute().length);
    eventData.groups[selectedGroupId] = { ...group, currentCheckpointIndex: next };
    if (Db.isEnabled()) await Db.setGroup(selectedGroupId, eventData.groups[selectedGroupId]);
    flash("Groep doorgeschakeld.");
    render();
  }
  async function sendMessage() {
    const groupId = els.messageGroupSelect.value;
    const text = els.messageInput.value.trim();
    if (!groupId || !text) return;
    if (Db.isEnabled()) await Db.sendMessage(groupId, text);
    msg("Bericht verstuurd.");
    els.messageInput.value = "";
  }
  async function sendEmergency() {
    const text = els.emergencyInput.value.trim() || eventData.settings.emergencyMessage || "Noodmelding";
    if (Db.isEnabled()) await Db.setEmergency(true, text);
    msg("Noodmelding verstuurd.");
  }
  async function clearEmergency() { if (Db.isEnabled()) await Db.setEmergency(false, ""); msg("Noodmelding uitgezet."); }

  function renderLive(statusMap) { liveStatus = statusMap || {}; renderLiveList(); renderMap(); renderScoreboard(); }
  function renderLiveList() {
    const statuses = Object.values(liveStatus || {});
    if (!statuses.length) { els.liveStatusList.innerHTML = `<p class="muted">Nog geen live status.</p>`; return; }
    els.liveStatusList.innerHTML = "";
    statuses.sort((a,b) => String(a.groupName).localeCompare(String(b.groupName))).forEach(st => {
      const item = document.createElement("div");
      item.className = "live-status-item";
      item.innerHTML = `
        <strong>${Utils.escapeHtml(st.groupName || "-")}</strong>
        <span>${Utils.escapeHtml(st.activeCheckpointName || "-")}</span>
        <span>Afstand: ${Number.isFinite(st.distanceMeters) ? Distance.format(st.distanceMeters) : "-"}</span>
        <span>Score: ${Number(st.score || 0)}</span>
        <span>GPS: ${Number.isFinite(st.accuracy) ? "±" + st.accuracy + " m" : "-"}</span>
        <span>Laatst gezien: ${st.updatedAt ? new Date(st.updatedAt).toLocaleTimeString("nl-NL", {hour:"2-digit", minute:"2-digit"}) : "-"}</span>
      `;
      els.liveStatusList.appendChild(item);
    });
  }
  function renderScoreboard() {
    const rows = groups().map(g => ({ ...g, live: liveStatus[g.id] || {} })).sort((a,b) => Number(b.score || 0) - Number(a.score || 0));
    els.scoreboardList.innerHTML = "";
    rows.forEach((g, i) => {
      const item = document.createElement("div");
      item.className = "score-row";
      item.innerHTML = `<strong>${i + 1}. ${Utils.escapeHtml(g.name)}</strong><span>${Number(g.score || 0)} punten</span><span>${Utils.escapeHtml(g.live.activeCheckpointName || "Nog niet gestart")}</span>`;
      els.scoreboardList.appendChild(item);
    });
  }

  function initMap() {
    if (!window.L || map) return;
    map = L.map("leaderMap").setView([52.1326, 5.2913], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
    setTimeout(() => map.invalidateSize(), 250);
  }
  function renderMap() {
    initMap();
    if (!map) return;
    const seen = new Set();
    Object.values(liveStatus || {}).forEach(st => {
      if (!Number.isFinite(st.lat) || !Number.isFinite(st.lng)) return;
      const id = st.groupId || Utils.safeKey(st.groupName);
      seen.add(id);
      const popup = `<strong>${Utils.escapeHtml(st.groupName || "-")}</strong><br>${Utils.escapeHtml(st.activeCheckpointName || "-")}<br>Afstand: ${Number.isFinite(st.distanceMeters) ? Distance.format(st.distanceMeters) : "-"}<br>Score: ${Number(st.score || 0)}<br>GPS: ${Number.isFinite(st.accuracy) ? "±" + st.accuracy + " m" : "-"}`;
      const icon = L.divIcon({ className: "group-map-marker", html: `<div>🏓</div>`, iconSize: [38,38], iconAnchor: [19,19] });
      if (!markers.has(id)) markers.set(id, L.marker([st.lat, st.lng], { icon }).addTo(map).bindPopup(popup));
      else markers.get(id).setLatLng([st.lat, st.lng]).setPopupContent(popup);
    });
    for (const [id, marker] of markers.entries()) {
      if (!seen.has(id)) { marker.remove(); markers.delete(id); }
    }
  }
  function fitMap() {
    if (!map || markers.size === 0) return;
    const fg = L.featureGroup(Array.from(markers.values()));
    map.fitBounds(fg.getBounds().pad(0.25), { maxZoom: 16 });
  }
  async function gpsTest() {
    const cp = selectedRoute()[0];
    if (!cp) return;
    els.testDistanceResult.textContent = "GPS zoeken...";
    navigator.geolocation.getCurrentPosition(pos => {
      const d = Distance.meters(pos.coords.latitude, pos.coords.longitude, cp.lat, cp.lng);
      els.testDistanceResult.textContent = `Afstand tot checkpoint 1: ${Distance.format(d)}. Jouw locatie: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}.`;
    }, () => { els.testDistanceResult.textContent = "GPS-test mislukt."; }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  }

  async function init() {
    initMap();
    Db.init();
    if (Db.isEnabled()) {
      eventData = await Db.bootstrap(window.DEFAULT_EVENT_DATA);
      Db.onEvent(data => { eventData = data; render(); });
      Db.onLive(renderLive);
    }
    render();
  }

  els.groupSelect.addEventListener("change", () => { readEditor(); selectedGroupId = els.groupSelect.value; render(); });
  els.addGroupBtn.addEventListener("click", addGroup);
  els.deleteGroupBtn.addEventListener("click", deleteGroup);
  els.skipGroupBtn.addEventListener("click", skipGroup);
  els.saveBtn.addEventListener("click", saveAll);
  els.sendMessageBtn.addEventListener("click", sendMessage);
  els.sendEmergencyBtn.addEventListener("click", sendEmergency);
  els.clearEmergencyBtn.addEventListener("click", clearEmergency);
  els.fitMapBtn.addEventListener("click", fitMap);
  els.testDistanceBtn.addEventListener("click", gpsTest);
  els.exportBtn.addEventListener("click", () => { readEditor(); els.jsonBox.value = JSON.stringify(eventData, null, 2); });
  els.importBtn.addEventListener("click", async () => {
    try { eventData = Utils.normalizeEvent(JSON.parse(els.jsonBox.value)); if (Db.isEnabled()) await Db.setFullEvent(eventData); render(); flash("Import gelukt."); }
    catch { flash("Import mislukt."); }
  });
  init();
})();
