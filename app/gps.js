window.GpsService = (() => {
  function supported() {
    return "geolocation" in navigator;
  }

  function getCurrent({ highAccuracy = true, timeout = 20000, maxAge = 0 } = {}) {
    return new Promise((resolve, reject) => {
      if (!supported()) {
        reject(new Error("GPS wordt niet ondersteund."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge: maxAge
        }
      );
    });
  }

  function watch(onPosition, onError) {
    if (!supported()) return null;
    return navigator.geolocation.watchPosition(
      onPosition,
      onError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  function clearWatch(id) {
    if (id !== null && id !== undefined && supported()) navigator.geolocation.clearWatch(id);
  }

  function errorMessage(error) {
    const messages = {
      1: "GPS-toegang geweigerd.",
      2: "Locatie niet beschikbaar.",
      3: "GPS zoeken duurde te lang."
    };
    return messages[error.code] || error.message || "Onbekende GPS-fout.";
  }

  return { supported, getCurrent, watch, clearWatch, errorMessage };
})();
