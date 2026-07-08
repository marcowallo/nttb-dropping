const STORAGE_KEY = "droppingDataV3";



let appData = normalizeData(loadData());
let unsubscribeRemoteData = null;
let unsubscribeGroupStatus = null;
let selectedGroupIndex = 0;

const els = {
  radiusInput: document.getElementById("radiusInput"),
  intervalInput: document.getElementById("intervalInput"),
  groupSelect: document.getElementById("groupSelect"),
  addGroupBtn: document.getElementById("addGroupBtn"),
  deleteGroupBtn: document.getElementById("deleteGroupBtn"),
  groupNameInput: document.getElementById("groupNameInput"),
  checkpointEditor: document.getElementById("checkpointEditor"),
  saveBtn: document.getElementById("saveBtn"),
  saveStatus: document.getElementById("saveStatus"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  jsonBox: document.getElementById("jsonBox"),
  testDistanceBtn: document.getElementById("testDistanceBtn"),
  testDistanceResult: document.getElementById("testDistanceResult")
};

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

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
  if (window.DroppingSync && window.DroppingSync.enabled) {
    window.DroppingSync.setData(appData).catch(error => {
      console.warn("Opslaan naar Firebase mislukt.", error);
    });
  }
}

function render() {
  appData = normalizeData(appData);
  els.radiusInput.value = appData.settings.radiusMeters;
  els.intervalInput.value = appData.settings.updateIntervalMinutes;
  renderGroups();
  renderEditor();
}

function renderGroups() {
  els.groupSelect.innerHTML = "";
  appData.groups.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = group.name;
    els.groupSelect.appendChild(option);
  });
  els.groupSelect.value = selectedGroupIndex;
}

function renderEditor() {
  const group = appData.groups[selectedGroupIndex];
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
  const group = appData.groups[selectedGroupIndex];
  group.name = els.groupNameInput.value.trim() || `Groep ${selectedGroupIndex + 1}`;

  appData.settings.radiusMeters = Math.max(5, Number(els.radiusInput.value || 50));
  appData.settings.updateIntervalMinutes = Math.max(1, Number(els.intervalInput.value || 5));

  els.checkpointEditor.querySelectorAll("[data-field]").forEach(input => {
    const index = Number(input.dataset.index);
    const field = input.dataset.field;

    if (!group.checkpoints[index]) return;

    if (field === "lat" || field === "lng") {
      group.checkpoints[index][field] = Number(input.value);
    } else {
      group.checkpoints[index][field] = input.value.trim();
    }
  });
}

function addGroup() {
  readEditor();
  appData.groups.push({
    name: `Groep ${appData.groups.length + 1}`,
    checkpoints: [
      { name: "Checkpoint 1", lat: 0, lng: 0, message: "Checkpoint bereikt." },
      { name: "Checkpoint 2", lat: 0, lng: 0, message: "Checkpoint bereikt." },
      { name: "Checkpoint 3", lat: 0, lng: 0, message: "Checkpoint bereikt." },
      { name: "Eindlocatie", lat: 0, lng: 0, message: "Eindlocatie bereikt!" }
    ]
  });
  selectedGroupIndex = appData.groups.length - 1;
  saveData();
  render();
}

function deleteGroup() {
  if (appData.groups.length <= 1) {
    flash("Je moet minimaal één groep behouden.");
    return;
  }

  appData.groups.splice(selectedGroupIndex, 1);
  selectedGroupIndex = Math.max(0, selectedGroupIndex - 1);
  saveData();
  render();
}

function addCheckpoint() {
  readEditor();
  const group = appData.groups[selectedGroupIndex];
  group.checkpoints.push({
    name: group.checkpoints.length === 0 ? "Checkpoint 1" : `Checkpoint ${group.checkpoints.length + 1}`,
    lat: 0,
    lng: 0,
    message: "Checkpoint bereikt."
  });
  saveData();
  render();
}

function removeCheckpoint(index) {
  readEditor();
  const group = appData.groups[selectedGroupIndex];
  if (group.checkpoints.length <= 1) return;
  group.checkpoints.splice(index, 1);
  saveData();
  render();
}

function flash(message) {
  els.saveStatus.textContent = message;
  setTimeout(() => els.saveStatus.textContent = "", 2400);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[s]));
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

els.exportBtn.addEventListener("click", () => {
  readEditor();
  saveData();
  els.jsonBox.value = JSON.stringify(appData, null, 2);
  flash("Export klaar.");
});

els.importBtn.addEventListener("click", () => {
  try {
    const imported = normalizeData(JSON.parse(els.jsonBox.value));
    if (!Array.isArray(imported.groups)) throw new Error("Geen groepen gevonden.");
    appData = imported;
    selectedGroupIndex = 0;
    saveData();
    render();
    flash("Import gelukt.");
  } catch (e) {
    flash("Import mislukt. Controleer de data.");
  }
});


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
  if (!Number.isFinite(meters)) return "Onbekend";
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

function testDistanceFromCurrentLocation() {
  readEditor();
  saveData();

  const group = appData.groups[selectedGroupIndex];
  const cp = group?.checkpoints?.[0];

  if (!cp || !Number.isFinite(cp.lat) || !Number.isFinite(cp.lng)) {
    els.testDistanceResult.textContent = "Checkpoint 1 heeft geen geldige coördinaten.";
    return;
  }

  if (!navigator.geolocation) {
    els.testDistanceResult.textContent = "GPS wordt niet ondersteund door deze browser.";
    return;
  }

  els.testDistanceResult.textContent = "GPS-locatie zoeken...";

  navigator.geolocation.getCurrentPosition(
    position => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const distance = distanceMeters(userLat, userLng, cp.lat, cp.lng);
      const accuracy = Math.round(position.coords.accuracy || 0);

      els.testDistanceResult.textContent =
        `Afstand tot checkpoint 1 van ${group.name}: ${formatDistance(distance)}. ` +
        `GPS-nauwkeurigheid: ±${accuracy} m. ` +
        `Jouw locatie: ${userLat.toFixed(6)}, ${userLng.toFixed(6)}. ` +
        `Checkpoint: ${Number(cp.lat).toFixed(6)}, ${Number(cp.lng).toFixed(6)}.`;
    },
    error => {
      const messages = {
        1: "GPS-toegang geweigerd.",
        2: "Locatie niet beschikbaar.",
        3: "GPS zoeken duurde te lang."
      };
      els.testDistanceResult.textContent = messages[error.code] || "Onbekende GPS-fout.";
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
}

if (els.testDistanceBtn) {
  els.testDistanceBtn.addEventListener("click", testDistanceFromCurrentLocation);
}



async function initAdmin() {
  const syncReady = window.DroppingSync && window.DroppingSync.init();

  if (syncReady) {
    try {
      const remoteData = await window.DroppingSync.getData();

      if (remoteData) {
        appData = normalizeData(remoteData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
      } else {
        await window.DroppingSync.setData(appData);
      }

      unsubscribeRemoteData = window.DroppingSync.onData(remoteData => {
        appData = normalizeData(remoteData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        selectedGroupIndex = Math.min(selectedGroupIndex, appData.groups.length - 1);
        render();
      });

      unsubscribeGroupStatus = window.DroppingSync.onGroupStatus(statusMap => {
        renderGroupStatus(statusMap);
      });
    } catch (error) {
      console.warn("Firebase laden mislukt. Lokale data wordt gebruikt.", error);
    }
  }

  render();
}

function renderGroupStatus(statusMap) {
  let box = document.getElementById("liveStatusBox");
  if (!box) {
    box = document.createElement("section");
    box.id = "liveStatusBox";
    box.className = "admin-card";
    const title = document.createElement("h2");
    title.textContent = "Live groepsstatus";
    box.appendChild(title);
    const intro = document.createElement("p");
    intro.className = "muted";
    intro.textContent = "Laatste bekende status van deelnemers die de app open hebben.";
    box.appendChild(intro);
    const list = document.createElement("div");
    list.id = "liveStatusList";
    box.appendChild(list);
    const firstAdminCard = document.querySelector(".admin-card");
    firstAdminCard.parentNode.insertBefore(box, firstAdminCard.nextSibling);
  }

  const list = document.getElementById("liveStatusList");
  list.innerHTML = "";

  const values = Object.values(statusMap || {});
  if (!values.length) {
    list.innerHTML = `<p class="muted">Nog geen live deelnemersstatus ontvangen.</p>`;
    return;
  }

  values
    .sort((a, b) => String(a.groupName).localeCompare(String(b.groupName)))
    .forEach(status => {
      const item = document.createElement("div");
      item.className = "live-status-item";
      const updated = status.updatedAt ? new Date(status.updatedAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "-";
      const distance = Number.isFinite(status.distanceMeters) ? (status.distanceMeters >= 1000 ? `${(status.distanceMeters/1000).toFixed(2)} km` : `${status.distanceMeters} m`) : "-";
      item.innerHTML = `
        <strong>${escapeHtml(status.groupName || "Onbekende groep")}</strong>
        <span>${escapeHtml(status.activeCheckpointName || "-")}</span>
        <span>Afstand: ${distance}</span>
        <span>Laatst gezien: ${updated}</span>
      `;
      list.appendChild(item);
    });
}

initAdmin();

