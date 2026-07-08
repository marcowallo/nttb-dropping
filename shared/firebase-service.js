window.DroppingFirebase = (() => {
  const PLACEHOLDER = "VUL_HIER_JE_API_KEY_IN";
  let enabled = false;
  let rootRef = null;

  function safeKey(value) {
    return String(value || "unknown").replace(/[.#$/\[\]]/g, "_");
  }

  function init() {
    try {
      const config = window.DROPPING_FIREBASE_CONFIG;
      const path = window.DROPPING_FIREBASE_PATH || "kamp2026";

      if (!config || !config.apiKey || config.apiKey === PLACEHOLDER) {
        console.info("Firebase niet ingesteld. Lokale modus actief.");
        return false;
      }

      if (!window.firebase || !firebase.database) {
        console.warn("Firebase SDK niet geladen. Lokale modus actief.");
        return false;
      }

      if (!firebase.apps.length) firebase.initializeApp(config);

      rootRef = firebase.database().ref(`droppings/${path}`);
      enabled = true;
      console.info("Dropping Firebase sync actief.");
      return true;
    } catch (error) {
      console.error("Firebase init mislukt:", error);
      enabled = false;
      return false;
    }
  }

  function isEnabled() {
    return enabled;
  }

  async function getAppData() {
    if (!enabled) return null;
    const snapshot = await rootRef.child("appData").get();
    return snapshot.exists() ? snapshot.val() : null;
  }

  async function setAppData(data) {
    if (!enabled) return false;
    await rootRef.child("appData").set(data);
    await rootRef.child("updatedAt").set(Date.now());
    return true;
  }

  function onAppData(callback) {
    if (!enabled) return () => {};
    const ref = rootRef.child("appData");
    const handler = snapshot => {
      if (snapshot.exists()) callback(snapshot.val());
    };
    ref.on("value", handler);
    return () => ref.off("value", handler);
  }

  async function updateGroupStatus(groupName, payload) {
    if (!enabled || !groupName) return false;
    await rootRef.child("groupStatus").child(safeKey(groupName)).update({
      groupName,
      ...payload,
      updatedAt: Date.now()
    });
    return true;
  }

  function onGroupStatus(callback) {
    if (!enabled) return () => {};
    const ref = rootRef.child("groupStatus");
    const handler = snapshot => callback(snapshot.val() || {});
    ref.on("value", handler);
    return () => ref.off("value", handler);
  }

  return { init, isEnabled, getAppData, setAppData, onAppData, updateGroupStatus, onGroupStatus };
})();
