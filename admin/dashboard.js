(() => {
  const els = {
    liveStatusList: document.getElementById("liveStatusList"),
    radiusInput: document.getElementById("radiusInput"),
    intervalInput: document.getElementById("intervalInput"),
    groupSelect: document.getElementById("groupSelect"),
    addGroupBtn: document.getElementById("addGroupBtn"),
    deleteGroupBtn: document.getElementById("deleteGroupBtn"),
    groupNameInput: document.getElementById("groupNameInput"),
    checkpointEditor: document.getElementById("checkpointEditor"),
    saveBtn: document.getElementById("saveBtn"),
    saveStatus: document.getElementById("saveStatus"),
    testDistanceBtn: document.getElementById("testDistanceBtn"),
    testDistanceResult: document.getElementById("testDistanceResult"),
    exportBtn: document.getElementById("exportBtn"),
    importBtn: document.getElementById("importBtn"),
    jsonBox: document.getElementById("jsonBox")
  };

  let data = DroppingStorage.getData();
  let selectedGroupIndex = 0;

  function saveData({ remote = true } = {}) {
    data = DroppingStorage.setData(data);
    if (remote && DroppingFirebase.isEnabled()) {
      DroppingFirebase.setAppData(data).catch(error => {
        flash("Opslaan naar Firebase mislukt.");
        console.warn(error);
      });
    }
  }

  function flash(message) {
    els.saveStatus.textContent = message;
    setTimeout(() => els.saveStatus.textContent = "", 2500);
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, s => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[s]));
  }

  function render() {
    data = DroppingStorage.normalize(data);
    selectedGroupIndex = Math.min(selectedGroupIndex, Math.max(0, data.groups.length - 1));

    els.radiusInput.value = data.settings.radiusMeters;
    els.intervalInput.value = data.settings.updateIntervalMinutes;

    renderGroups();
    renderEditor();
  }

  function renderGroups() {
    els.groupSelect.innerHTML = "";
    data.groups.forEach((group, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = group.name;
      els.groupSelect.appendChild(option);
    });
    els.groupSelect.value = selectedGroupIndex;
  }

  function renderEditor() {
    const group = data.groups[selectedGroupIndex];
    if (!group) return;

    els.groupNameInput.value = group.name;
    els.checkpointEditor.innerHTML = "";

    group.checkpoints.forEach((cp, index) => {
      const block = document.createElement("div");
      block.className = "checkpoint-block";
      block.innerHTML = `
        <div class="checkpoint-head">
          <h3>${index === group.checkpoints.length - 1 ? "Eindlocatie" : `Checkpoint ${index + 1}`}</h3>
          <button class="tiny danger remove-cp" data-index="${index}" ${group.checkpoints.length <= 1 ? "disabled" : ""}>Verwijder</button>
        </div>

        <label>Naam</label>
        <input data-index="${index}" data-field="name" value="${escapeHtml(cp.name)}">

        <div class="grid2">
          <div>
            <label>Latitude</label>
            <input data-index="${index}" data-field="lat" type="number" step="any" value="${Number(cp.lat)}">
          </div>
          <div>
            <label>Longitude</label>
            <input data-index="${index}" data-field="lng" type="number" step="any" value="${Number(cp.lng)}">
          </div>
        </div>

        <label>Bericht bij aankomst</label>
        <textarea data-index="${index}" data-field="message" rows="4">${escapeHtml(cp.message || "")}</textarea>
      `;
      els.checkpointEditor.appendChild(block);
    });

    const addButton = document.createElement("button");
    addButton.className = "secondary";
    addButton.textContent = "Checkpoint toevoegen";
    addButton.addEventListener("click", addCheckpoint);
    els.checkpointEditor.appendChild(addButton);

    els.checkpointEditor.querySelectorAll(".remove-cp").forEach(btn => {
      btn.addEventListener("click", () => removeCheckpoint(Number(btn.dataset.index)));
    });
  }

  function readEditor() {
    const group = data.groups[selectedGroupIndex];
    if (!group) return;

    data.settings.radiusMeters = Math.max(5, Number(els.radiusInput.value || 50));
    data.settings.updateIntervalMinutes = Math.max(1, Number(els.intervalInput.value || 5));
    group.name = els.groupNameInput.value.trim() || `Groep ${selectedGroupIndex + 1}`;

    els.checkpointEditor.querySelectorAll("[data-field]").forEach(input => {
      const index = Number(input.dataset.index);
      const field = input.dataset.field;
      if (!group.checkpoints[index]) return;

      group.checkpoints[index][field] = field === "lat" || field === "lng"
        ? Number(input.value)
        : input.value.trim();
    });
  }

  function addGroup() {
    readEditor();
    data.groups.push({
      name: `Groep ${data.groups.length + 1}`,
      checkpoints: [
        { name: "Checkpoint 1", lat: 0, lng: 0, message: "Checkpoint bereikt." },
        { name: "Checkpoint 2", lat: 0, lng: 0, message: "Checkpoint bereikt." },
        { name: "Checkpoint 3", lat: 0, lng: 0, message: "Checkpoint bereikt." },
        { name: "Eindlocatie", lat: 0, lng: 0, message: "Eindlocatie bereikt!" }
      ]
    });
    selectedGroupIndex = data.groups.length - 1;
    saveData();
    render();
  }

  function deleteGroup() {
    if (data.groups.length <= 1) {
      flash("Je moet minimaal één groep behouden.");
      return;
    }
    data.groups.splice(selectedGroupIndex, 1);
    selectedGroupIndex = Math.max(0, selectedGroupIndex - 1);
    saveData();
    render();
  }

  function addCheckpoint() {
    readEditor();
    const group = data.groups[selectedGroupIndex];
    group.checkpoints.push({
      name: `Checkpoint ${group.checkpoints.length + 1}`,
      lat: 0,
      lng: 0,
      message: "Checkpoint bereikt."
    });
    saveData();
    render();
  }

  function removeCheckpoint(index) {
    readEditor();
    const group = data.groups[selectedGroupIndex];
    if (group.checkpoints.length <= 1) return;
    group.checkpoints.splice(index, 1);
    saveData();
    render();
  }

  async function testDistance() {
    readEditor();
    saveData();

    const group = data.groups[selectedGroupIndex];
    const cp = group?.checkpoints?.[0];

    if (!cp || !Number.isFinite(cp.lat) || !Number.isFinite(cp.lng)) {
      els.testDistanceResult.textContent = "Checkpoint 1 heeft geen geldige coördinaten.";
      return;
    }

    els.testDistanceResult.textContent = "GPS-locatie zoeken...";

    try {
      const position = await GpsAsPromise();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const distance = Distance.meters(userLat, userLng, cp.lat, cp.lng);
      const accuracy = Math.round(position.coords.accuracy || 0);

      els.testDistanceResult.textContent =
        `Afstand tot checkpoint 1 van ${group.name}: ${Distance.format(distance)}. ` +
        `GPS-nauwkeurigheid: ±${accuracy} m. ` +
        `Jouw locatie: ${userLat.toFixed(6)}, ${userLng.toFixed(6)}. ` +
        `Checkpoint: ${Number(cp.lat).toFixed(6)}, ${Number(cp.lng).toFixed(6)}.`;
    } catch (error) {
      els.testDistanceResult.textContent = error.message || "GPS-test mislukt.";
    }
  }

  function GpsAsPromise() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS wordt niet ondersteund door deze browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      });
    });
  }

  function renderLiveStatus(statusMap) {
    const statuses = Object.values(statusMap || {});
    if (!statuses.length) {
      els.liveStatusList.innerHTML = `<p class="muted">Nog geen live deelnemersstatus ontvangen.</p>`;
      return;
    }

    els.liveStatusList.innerHTML = "";
    statuses
      .sort((a, b) => String(a.groupName).localeCompare(String(b.groupName)))
      .forEach(status => {
        const item = document.createElement("div");
        item.className = "live-status-item";
        const updated = status.updatedAt ? new Date(status.updatedAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "-";
        const distance = Number.isFinite(status.distanceMeters) ? Distance.format(status.distanceMeters) : "-";
        const accuracy = Number.isFinite(status.accuracy) ? `±${status.accuracy} m` : "-";
        item.innerHTML = `
          <strong>${escapeHtml(status.groupName || "Onbekende groep")}</strong>
          <span>${escapeHtml(status.activeCheckpointName || "-")}</span>
          <span>Afstand: ${distance}</span>
          <span>Nauwkeurigheid: ${accuracy}</span>
          <span>Laatst gezien: ${updated}</span>
        `;
        els.liveStatusList.appendChild(item);
      });
  }

  async function init() {
    DroppingFirebase.init();

    if (DroppingFirebase.isEnabled()) {
      try {
        const remote = await DroppingFirebase.getAppData();
        if (remote) {
          data = DroppingStorage.setData(remote);
        } else {
          await DroppingFirebase.setAppData(data);
        }

        DroppingFirebase.onAppData(remoteData => {
          data = DroppingStorage.setData(remoteData);
          render();
        });

        DroppingFirebase.onGroupStatus(renderLiveStatus);
      } catch (error) {
        console.warn("Firebase laden mislukt. Lokale data wordt gebruikt.", error);
      }
    }

    render();
  }

  els.groupSelect.addEventListener("change", () => {
    readEditor();
    selectedGroupIndex = Number(els.groupSelect.value);
    saveData();
    render();
  });

  els.addGroupBtn.addEventListener("click", addGroup);
  els.deleteGroupBtn.addEventListener("click", deleteGroup);

  els.saveBtn.addEventListener("click", () => {
    readEditor();
    saveData();
    renderGroups();
    flash("Opgeslagen.");
  });

  els.testDistanceBtn.addEventListener("click", testDistance);

  els.exportBtn.addEventListener("click", () => {
    readEditor();
    saveData();
    els.jsonBox.value = JSON.stringify(data, null, 2);
    flash("Export klaar.");
  });

  els.importBtn.addEventListener("click", () => {
    try {
      const imported = DroppingStorage.normalize(JSON.parse(els.jsonBox.value));
      data = imported;
      selectedGroupIndex = 0;
      saveData();
      render();
      flash("Import gelukt.");
    } catch {
      flash("Import mislukt. Controleer de data.");
    }
  });

  init();
})();
