const DEFAULT_DATA = {
  "settings": {
    "radiusMeters": 50,
    "updateIntervalMinutes": 1
  },
  "groups": [
    {
      "name": "Test 1",
      "checkpoints": [
        {
          "name": "Checkpoint 1",
          "lat": 52.001763,
          "lng": 4.370245,
          "message": "Check 1 werkt!"
        },
        {
          "name": "Checkpoint 2",
          "lat": 51.999999,
          "lng": 4.374448,
          "message": "Check 2 werkt"
        },
        {
          "name": "Eindlocatie",
          "lat": 51.998669,
          "lng": 4.370768,
          "message": "Finish!"
        }
      ]
    },
    {
      "name": "Groep 2",
      "checkpoints": [
        {
          "name": "Checkpoint 1",
          "lat": 0,
          "lng": 0,
          "message": "Checkpoint bereikt."
        },
        {
          "name": "Checkpoint 2",
          "lat": 0,
          "lng": 0,
          "message": "Checkpoint bereikt."
        },
        {
          "name": "Checkpoint 3",
          "lat": 0,
          "lng": 0,
          "message": "Checkpoint bereikt."
        },
        {
          "name": "Eindlocatie",
          "lat": 0,
          "lng": 0,
          "message": "Eindlocatie bereikt!"
        }
      ]
    }
  ]
}
