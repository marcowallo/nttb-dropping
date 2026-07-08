// Dropping v7 Firebase helper.
// Werkt met Firebase compat SDK zodat de rest van de app simpel kan blijven.

(function () {
  const PLACEHOLDER_API_KEY = "VUL_HIER_JE_API_KEY_IN";

  window.DroppingSync = {
    enabled: false,
    ready: false,
    db: null,
    rootRef: null,

    init() {
      try {
        const config = window.DROPPING_FIREBASE_CONFIG;
        const path = window.DROPPING_FIREBASE_PATH || "kamp2026";

        if (!config || !config.apiKey || config.apiKey === PLACEHOLDER_API_KEY) {
          console.warn("Firebase niet ingesteld. App gebruikt lokale opslag.");
          return false;
        }

        if (!window.firebase) {
          console.warn("Firebase SDK niet geladen. App gebruikt lokale opslag.");
          return false;
        }

        firebase.initializeApp(config);
        this.db = firebase.database();
        this.rootRef = this.db.ref(`droppings/${path}`);
        this.enabled = true;
        this.ready = true;
        console.info("Dropping Firebase sync actief.");
        return true;
      } catch (error) {
        console.warn("Firebase init mislukt. App gebruikt lokale opslag.", error);
        return false;
      }
    },

    async getData() {
      if (!this.enabled) return null;
      const snapshot = await this.rootRef.child("appData").get();
      return snapshot.exists() ? snapshot.val() : null;
    },

    async setData(data) {
      if (!this.enabled) return false;
      await this.rootRef.child("appData").set(data);
      await this.rootRef.child("updatedAt").set(Date.now());
      return true;
    },

    onData(callback) {
      if (!this.enabled) return () => {};
      const ref = this.rootRef.child("appData");
      const handler = snapshot => {
        if (snapshot.exists()) callback(snapshot.val());
      };
      ref.on("value", handler);
      return () => ref.off("value", handler);
    },

    async updateGroupStatus(groupName, status) {
      if (!this.enabled || !groupName) return false;
      await this.rootRef.child("groupStatus").child(safeKey(groupName)).update({
        ...status,
        groupName,
        updatedAt: Date.now()
      });
      return true;
    },

    onGroupStatus(callback) {
      if (!this.enabled) return () => {};
      const ref = this.rootRef.child("groupStatus");
      const handler = snapshot => callback(snapshot.val() || {});
      ref.on("value", handler);
      return () => ref.off("value", handler);
    }
  };

  function safeKey(value) {
    return String(value).replace(/[.#$/\[\]]/g, "_");
  }
})();
