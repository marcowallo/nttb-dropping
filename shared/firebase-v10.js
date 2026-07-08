window.Db = (() => {
  const PLACEHOLDER = "VUL_HIER_JE_API_KEY_IN";
  let enabled = false;
  let rootRef = null;

  function init() {
    try {
      const config = window.DROPPING_FIREBASE_CONFIG;
      const eventId = window.DROPPING_EVENT_ID || "kamp2026";
      if (!config || !config.apiKey || config.apiKey === PLACEHOLDER) {
        console.info("Firebase niet ingesteld. Lokale/demo modus actief.");
        return false;
      }
      if (!window.firebase || !firebase.database) {
        console.warn("Firebase SDK niet geladen.");
        return false;
      }
      if (!firebase.apps.length) firebase.initializeApp(config);
      rootRef = firebase.database().ref(`events/${eventId}`);
      enabled = true;
      console.info("Dropping v10 Firebase actief.");
      return true;
    } catch (error) {
      console.error("Firebase init mislukt:", error);
      enabled = false;
      return false;
    }
  }

  function isEnabled() { return enabled; }
  function ref(path = "") {
    if (!enabled) throw new Error("Firebase niet actief.");
    return path ? rootRef.child(path) : rootRef;
  }

  async function bootstrap(defaultData) {
    if (!enabled) return Utils.normalizeEvent(defaultData);
    const snapshot = await rootRef.child("meta/initialized").get();
    if (!snapshot.exists()) {
      const eventData = Utils.normalizeEvent(defaultData);
      await rootRef.set({
        settings: eventData.settings,
        groups: eventData.groups,
        routes: eventData.routes,
        messages: eventData.messages || {},
        emergency: eventData.emergency || { active: false, message: "", updatedAt: null },
        live: {},
        meta: { initialized: true, createdAt: Date.now(), updatedAt: Date.now() }
      });
      return eventData;
    }
    return getEvent();
  }

  async function getEvent() {
    if (!enabled) return Utils.normalizeEvent(window.DEFAULT_EVENT_DATA);
    const snapshot = await rootRef.get();
    const val = snapshot.val() || {};
    return Utils.normalizeEvent({ settings: val.settings, groups: val.groups, routes: val.routes, messages: val.messages, emergency: val.emergency });
  }

  function onEvent(callback) {
    if (!enabled) return () => {};
    const handler = snapshot => {
      const val = snapshot.val() || {};
      callback(Utils.normalizeEvent({ settings: val.settings, groups: val.groups, routes: val.routes, messages: val.messages, emergency: val.emergency }));
    };
    rootRef.on("value", handler);
    return () => rootRef.off("value", handler);
  }

  function onLive(callback) {
    if (!enabled) return () => {};
    const liveRef = rootRef.child("live");
    const handler = snapshot => callback(snapshot.val() || {});
    liveRef.on("value", handler);
    return () => liveRef.off("value", handler);
  }

  async function setGroup(groupId, group) { await ref(`groups/${groupId}`).set(group); await touch(); }
  async function removeGroup(groupId) {
    await ref(`groups/${groupId}`).remove();
    await ref(`routes/${groupId}`).remove();
    await ref(`live/${groupId}`).remove();
    await ref(`messages/${groupId}`).remove();
    await touch();
  }
  async function setFullEvent(eventData) {
    const d = Utils.normalizeEvent(eventData);
    await rootRef.update({
      settings: d.settings, groups: d.groups, routes: d.routes, messages: d.messages || {},
      emergency: d.emergency || { active: false, message: "", updatedAt: null },
      "meta/updatedAt": Date.now()
    });
  }
  async function updateLive(groupId, payload) {
    if (!enabled || !groupId) return;
    await ref(`live/${groupId}`).update({ ...payload, updatedAt: Date.now() });
  }
  async function sendMessage(groupId, message) {
    const payload = { id: Utils.uid("msg"), groupId, message, createdAt: Date.now(), read: false };
    await ref(`messages/${groupId}`).set(payload);
    return payload;
  }
  async function setEmergency(active, message = "") {
    await ref("emergency").set({ active, message, updatedAt: Date.now() });
  }
  async function touch() { await ref("meta/updatedAt").set(Date.now()); }

  return { init, isEnabled, bootstrap, getEvent, onEvent, onLive, setGroup, removeGroup, setFullEvent, updateLive, sendMessage, setEmergency };
})();
