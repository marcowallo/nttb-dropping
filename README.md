# Dropping app v10

Firebase-first versie met centrale database.

## Nieuwe functies

- Firebase als primaire opslag onder `events/kamp2026`.
- Live kaart voor de leiding.
- Live groepsstatus.
- Scorebord met punten.
- Stopwatch per groep.
- Berichten naar specifieke groepen.
- Noodmelding naar alle groepen.
- Groep op afstand doorschakelen naar volgende checkpoint.
- Checkpoints activeren/deactiveren.
- Punten per checkpoint.
- Opdrachttekst per checkpoint.
- Quizvraag + antwoord per checkpoint.
- Import/export van volledige event-data.

## Belangrijk

Plak je Firebase config in `firebase-config.js`.

Gebruik voor testen in Firebase Realtime Database tijdelijk:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Upload alle bestanden en mappen naar GitHub Pages.

## Let op

PWA's kunnen op iPhone/Android niet betrouwbaar locatie blijven volgen wanneer het scherm uit staat. Voor echte achtergrondlocatie is een native app nodig.

## Foto-upload

Foto-upload is nog niet ingebouwd. Dat vereist Firebase Storage plus strengere security rules. Dit kan als aparte volgende stap.


## v10.1 - Beheerlogin en volledige reset

### Wachtwoord instellen

Open `firebase-config.js` en verander:

```js
window.DROPPING_ADMIN_PASSWORD = "verander-mij";
```

in een eigen wachtwoord.

De beheerlogin blijft actief tijdens de huidige browsersessie.

Let op: dit is een eenvoudige afscherming. Omdat GitHub Pages en de JavaScript-broncode openbaar zijn, is dit geen beveiliging voor gevoelige informatie.

### Nieuwe dropping starten

De knop **Reset volledige dropping** wist:

- groepsvoortgang;
- scores;
- start- en eindtijden;
- live locaties;
- groepsberichten;
- noodmeldingen.

Routes, checkpoints en instellingen blijven behouden.
