const DEFAULT_DATA = {
  settings: {
    radiusMeters: 50,
    updateIntervalMinutes: 5
  },
  groups: [
    {
      name: "Groep 1",
      checkpoints: [
        {
          name: "Checkpoint 1",
          lat: 53.000314, 
          lng: 4.375723,
          message: "Goed gedaan! Jullie hebben checkpoint 1 bereikt. Open de volgende opdracht."
        },
        {
          name: "Checkpoint 2",
          lat: 51.998617, 
          lng: 4.370785,
          message: "Mooi werk! Jullie mogen door naar checkpoint 3."
        },
        {
          name: "Eindlocatie",
          lat: 52.001855, 
          lng: 4.370401,
          message: "Check voltooid"
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
