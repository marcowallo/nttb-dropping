window.Utils = {
  clone(value) { return JSON.parse(JSON.stringify(value)); },
  uid(prefix = "id") { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; },
  safeKey(value) {
    return String(value || "unknown").toLowerCase().replace(/[.#$/\[\]]/g, "_").replace(/[^a-z0-9_-]/g, "_");
  },
  escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[s]));
  },
  formatTime(ms) {
    if (!Number.isFinite(ms) || ms < 0) return "00:00";
    const total = Math.floor(ms / 1000), h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  },
  groupsArray(data) {
    return Object.values(data.groups || {}).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  },
  normalizeEvent(data) {
    const d = data && typeof data === "object" ? data : Utils.clone(window.DEFAULT_EVENT_DATA);
    d.settings = d.settings || {};
    d.settings.radiusMeters = Number(d.settings.radiusMeters || 50);
    d.settings.updateIntervalMinutes = Number(d.settings.updateIntervalMinutes || 5);
    d.settings.arrivalCheckSeconds = Number(d.settings.arrivalCheckSeconds || 15);
    d.settings.emergencyMessage = d.settings.emergencyMessage || "Noodmelding";
    d.groups = d.groups || {};
    d.routes = d.routes || {};
    d.messages = d.messages || {};
    d.emergency = d.emergency || { active: false, message: "", updatedAt: null };
    return d;
  }
};
