window.DEFAULT_EVENT_DATA = {
  settings: {
    radiusMeters: 50,
    updateIntervalMinutes: 5,
    arrivalCheckSeconds: 15,
    emergencyMessage: "Noodmelding: neem direct contact op met de leiding.",
    participantIntroTitle: "Welkom bij de dropping",
    participantIntroText: "Lees de uitleg goed door. Kies daarna je groep en start pas wanneer de leiding dit aangeeft."
  },
  groups: {
    groep1: {
      id: "groep1",
      name: "Groep 1",
      color: "#8BFF4D",
      active: true,
      score: 0,
      currentCheckpointIndex: 0,
      startedAt: null,
      finishedAt: null
    },
    groep2: {
      id: "groep2",
      name: "Groep 2",
      color: "#2D9CFF",
      active: true,
      score: 0,
      currentCheckpointIndex: 0,
      startedAt: null,
      finishedAt: null
    }
  },
  routes: {
    groep1: [
      { id: "g1cp1", name: "Checkpoint 1", lat: 52.3676, lng: 4.9041, revealMap: false, active: true, points: 10, message: "Goed gedaan! Jullie hebben checkpoint 1 bereikt.", tasks: ["Los de opdracht op en ga daarna door."], tasks: [], task: "", quizQuestion: "Hoeveel punten telt een normale tafeltennisgame?", quizAnswer: "11" },
      { id: "g1cp2", name: "Checkpoint 2", lat: 52.3702, lng: 4.8952, revealMap: false, active: true, points: 10, message: "Mooi werk! Jullie mogen door naar checkpoint 3.", tasks: ["Zoek de volgende aanwijzing."], tasks: [], task: "", quizQuestion: "", quizAnswer: "" },
      { id: "g1cp3", name: "Checkpoint 3", lat: 52.3731, lng: 4.8922, revealMap: false, active: true, points: 10, message: "Bijna klaar. Nog één laatste stuk.", tasks: [], task: "", quizQuestion: "", quizAnswer: "" },
      { id: "g1finish", name: "Eindlocatie", lat: 52.3791, lng: 4.9003, revealMap: false, active: true, points: 20, message: "Gefeliciteerd, jullie zijn aangekomen bij de eindlocatie!", tasks: [], task: "", quizQuestion: "", quizAnswer: "" }
    ],
    groep2: [
      { id: "g2cp1", name: "Checkpoint 1", lat: 52.3650, lng: 4.8990, revealMap: false, active: true, points: 10, message: "Checkpoint 1 bereikt.", tasks: [], task: "", quizQuestion: "", quizAnswer: "" },
      { id: "g2cp2", name: "Checkpoint 2", lat: 52.3685, lng: 4.8910, revealMap: false, active: true, points: 10, message: "Checkpoint 2 bereikt.", tasks: [], task: "", quizQuestion: "", quizAnswer: "" },
      { id: "g2cp3", name: "Checkpoint 3", lat: 52.3720, lng: 4.8870, revealMap: false, active: true, points: 10, message: "Checkpoint 3 bereikt.", tasks: [], task: "", quizQuestion: "", quizAnswer: "" },
      { id: "g2finish", name: "Eindlocatie", lat: 52.3780, lng: 4.8960, revealMap: false, active: true, points: 20, message: "Eindlocatie bereikt!", tasks: [], task: "", quizQuestion: "", quizAnswer: "" }
    ]
  },
  messages: {},
  emergency: {
    active: false,
    message: "",
    updatedAt: null
  }
};
