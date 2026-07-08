const DEFAULT_DATA = {
  settings: {
    radiusMeters: 50,
    updateIntervalMinutes: 5
  },
  groups: [
    {
      name: "Test 1",
      checkpoints: [
        {
          name: "Checkpoint 1",
          lat: 52.3676,
          lng: 4.9041,
          message: "Goed gedaan! Jullie hebben checkpoint 1 bereikt. Open de volgende opdracht."
        },
        {
          name: "Checkpoint 2",
          lat: 52.3702,
          lng: 4.8952,
          message: "Mooi werk! Jullie mogen door naar checkpoint 3."
        },
        {
          name: "Checkpoint 3",
          lat: 52.3731,
          lng: 4.8922,
          message: "Bijna klaar. Nog één laatste stuk naar de eindlocatie."
        },
        {
          name: "Eindlocatie",
          lat: 52.3791,
          lng: 4.9003,
          message: "Gefeliciteerd, jullie zijn aangekomen bij de eindlocatie!"
        }
      ]
    },
    {
      name: "Groep 2",
      checkpoints: [
        { name: "Checkpoint 1", lat: 52.3650, lng: 4.8990, message: "Checkpoint 1 bereikt." },
        { name: "Checkpoint 2", lat: 52.3685, lng: 4.8910, message: "Checkpoint 2 bereikt." },
        { name: "Checkpoint 3", lat: 52.3720, lng: 4.8870, message: "Checkpoint 3 bereikt." },
        { name: "Eindlocatie", lat: 52.3780, lng: 4.8960, message: "Eindlocatie bereikt!" }
      ]
    }
  ]
};
