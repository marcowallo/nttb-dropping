window.DroppingStorage = (() => {
  const DATA_KEY = "dropping_v8_data";
  const STATE_KEY = "dropping_v8_state";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalize(data) {
    const safe = data && typeof data === "object" ? data : clone(window.DEFAULT_DROPPING_DATA);
    safe.settings = safe.settings || {};
    safe.settings.radiusMeters = Number(safe.settings.radiusMeters || 50);
    safe.settings.updateIntervalMinutes = Number(safe.settings.updateIntervalMinutes || 5);
    safe.settings.arrivalCheckSeconds = Number(safe.settings.arrivalCheckSeconds || 15);
    safe.groups = Array.isArray(safe.groups) ? safe.groups : [];
    return safe;
  }

  function getData() {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return normalize(clone(window.DEFAULT_DROPPING_DATA));
    try {
      return normalize(JSON.parse(raw));
    } catch {
      return normalize(clone(window.DEFAULT_DROPPING_DATA));
    }
  }

  function setData(data) {
    const normalized = normalize(data);
    localStorage.setItem(DATA_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function resetData() {
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(STATE_KEY);
    return setData(clone(window.DEFAULT_DROPPING_DATA));
  }

  function getState() {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function setState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function clearState() {
    localStorage.removeItem(STATE_KEY);
  }

  return { getData, setData, resetData, getState, setState, clearState, normalize, clone };
})();
