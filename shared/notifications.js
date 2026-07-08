window.Notify = (() => {
  function requestPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }

  function play(type = "update") {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      const notes = type === "arrival"
        ? [523.25, 659.25, 783.99, 1046.5]
        : [880, 1175];

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.09);
        osc.connect(gain);
        osc.start(ctx.currentTime + index * 0.09);
        osc.stop(ctx.currentTime + index * 0.09 + 0.08);
      });

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(type === "arrival" ? 0.12 : 0.075, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + notes.length * 0.09 + 0.16);
    } catch {}
  }

  function vibrate(type = "update") {
    if (!navigator.vibrate) return;
    if (type === "arrival") navigator.vibrate([220, 90, 220, 90, 320]);
    else navigator.vibrate([120, 60, 120]);
  }

  function show(title, body, type = "update") {
    play(type);
    vibrate(type);

    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      try {
        new Notification(title, {
          body,
          icon: "assets/icon.svg",
          silent: false
        });
      } catch {}
    }
  }

  return { requestPermission, play, vibrate, show };
})();
