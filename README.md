# Dropping app v8

Volledig opgeschoonde PWA-versie met losse modules.

## Wat is nieuw

- Stabielere projectstructuur.
- Losse modules voor:
  - afstandsberekening;
  - opslag;
  - Firebase;
  - notificaties;
  - GPS;
  - deelnemersapp;
  - beheerdashboard.
- Tafeltennis-/scoreborddesign behouden.
- Firebase live synchronisatie behouden.
- Live groepsstatus op beheerpagina.
- Reset via `index.html?reset=1`.

## Bestandsstructuur

```text
index.html
admin.html
data.js
firebase-config.js
shared/
  distance.js
  storage.js
  firebase-service.js
  notifications.js
app/
  gps.js
  participant.js
admin/
  dashboard.js
styles/
  theme.css
assets/
  icon.svg
```

## Firebase instellen

Open `firebase-config.js` en vul jouw Firebase config in.

Belangrijk: gebruik de compat-vorm die al in dit bestand staat. Gebruik dus geen `import`-regels.

Voor testen in Realtime Database Rules:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Dit is handig om te testen, maar niet veilig voor definitief gebruik.

## Uploaden naar GitHub

Upload alle bestanden en mappen naar je GitHub Pages repository.

Open daarna:

```text
index.html?reset=1
```

## Let op

Een PWA kan op iPhone/Android niet betrouwbaar locatie blijven checken wanneer het scherm uit is. Voor echte achtergrondlocatie is een native app nodig.


## v9 - Live kaart voor de leiding

Deze versie voegt een live kaart toe aan `admin.html`.

### Wat is nieuw

- Live kaart op de beheerpagina.
- Groepslocaties verschijnen als 🏓 markers.
- Marker-kleur:
  - oranje = onderweg;
  - limegroen = checkpoint bereikt;
  - blauw = route voltooid.
- Popup met:
  - groep;
  - actief checkpoint;
  - afstand;
  - GPS-nauwkeurigheid;
  - laatst gezien.
- Knop “Toon alle groepen”.

### Belangrijk

Deelnemers zien nog steeds géén kaart, richting of coördinaten. Alleen de beheerpagina toont de live kaart.

De kaart gebruikt OpenStreetMap/Leaflet via CDN. Internetverbinding is dus nodig op de beheerpagina.
