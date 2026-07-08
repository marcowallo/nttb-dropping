# Dropping app v3

Nieuwe PWA-versie voor iPhone/Android zonder Apple Developer-account.

## Nieuw in deze versie

- Mooier blauw/oranje app-ontwerp.
- Donkerder nacht-thema voor tijdens de dropping.
- Geen kompas en geen richting.
- Geen doelcoördinaten zichtbaar voor deelnemers.
- Grote afstandscirkel.
- Voortgang: checkpoint X van totaal.
- Afteller tot volgende update.
- Handmatige knop: “Nu bijwerken”.
- Trilling bij checkpoint bereikt, als het toestel dit ondersteunt.
- Beheerpagina met:
  - groepen toevoegen/verwijderen;
  - checkpoints toevoegen/verwijderen;
  - radius instellen;
  - update-interval instellen;
  - import/export.
- Offline cache via service worker.

## Gebruik

1. Open `admin.html`.
2. Stel groepen, checkpoints, berichten, radius en update-interval in.
3. Open `index.html` voor deelnemers.
4. Deelnemers kiezen hun groep en geven GPS-toegang.

## Belangrijk voor GPS

Op telefoons werkt GPS alleen goed via HTTPS. Gebruik bijvoorbeeld:
- Netlify
- Vercel
- GitHub Pages

Open je de bestanden direct vanaf je computer, dan werkt GPS op veel telefoons niet.

## Achtergrond-updates

Zonder echte native iPhone-app kan de app niet betrouwbaar op de achtergrond blijven updaten. Laat deelnemers de app open houden of spreek af dat ze de app iedere paar minuten openen.


## Kleine update v3.1

- Titel bovenin aangepast naar alleen “Dropping”.
- GPS-status is nu groen bij werkende GPS en rood bij zoeken/fout.
- Kort geluid toegevoegd bij een zichtbare afstandsupdate.


## Update v4

- Tekst onder de afstand weggehaald.
- Knop “Nu bijwerken” weggehaald.
- Animatie toegevoegd bij checkpoint bereikt.
- Trilling toegevoegd bij zichtbare update en checkpoint bereikt.
- Twee geluiden toegevoegd:
  - korte ping bij update;
  - feestelijker geluid bij checkpoint bereikt.
- Beheerpagina beveiligd met pincode.
- Standaard beheerpincode: `2026`.

Let op: sommige telefoons blokkeren geluid totdat de gebruiker eerst op de pagina heeft getikt. Omdat deelnemers op “Start route” drukken, zou het geluid daarna normaal moeten werken.


Kleine wijziging v4.1:
- Het voorbeeld in het pincodeveld is verwijderd.
