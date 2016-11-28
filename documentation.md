# Overview

Webová aplikácia určená na pomoc dispečerom kuriérov v reštauráciách. Pomocou aplikácie je možné:

-vyhľadať približné miesto, kde je situovaná reštaurácia interaktívne z mapy
-vyhľadať relevantné miesta doručenia jedla podľa názvov ulíc
-vyhľadať relevantné miesta doručenia interaktívne z mapy
-aproximovať najvýhodnejšie poradie navštívenia zákazníkov kuriérom
-vypočítať najkratšiu cestu kuriéra k zákazníkom a späť do reštaurácie podľa aproximácie

This is it in action:

![Screenshot](screenshot.png)

Webová aplikácia je rozdelená na frontendovú a backendovú časť. [Frontend](#frontend) využíva mapbox API a mapbox.js. [Backend](#backend) je napísaný v JavaScripte, postavený na Node.js JavaScript runtime environment. Databáza je uložená v PostGIS. Frontend komunikuje s backendom pomocou [REST API](#api).

# Frontend

Frontend sa skladá zo statickej html stránky (`index.html`),ktorá obsahuje mapbox.js widget. Mapa zobrazuje predvolenú reštauráciu, z ktorej sa majú vykonávať roznášky jedla. Túto reštauráciu je možné vymeniť za inú. Zvolili sme predvolený štýl mapy, nakoľko vhodne zvýrazňovala cesty na mape, ktoré sú pre nás najdôležitejšie. Mapa je interaktívna a po kliknutí do mapy sa objaví bod, kam sme klikli. Farebne sme ladili aplikáciu tak, aby si jednotlivé rozdielne funkcionality užívateľ zafixoval pod rovnakou farbou a nemýlil sa. 

Kód strany klienta sa nachádza v súbore `client-js/client.js` na ktorý sa odkazuje statická stránka v súbore `index.html`. Úlohy na strane klienta sú:
- komunikácia so serverom pomocou REST API a JSON 
- zobrazovanie kontrolnej lišty a spravovanie udalostí, ktoré prislúchajú požiadavkám užívateľa
- starať sa o interaktivitu stránky
- starať sa o zobrazovanie údajov zo servera na mape

# Backend

Backend aplikácie je napísaný v JavaScripte a postavený na Node.js. Server sa stará o príjimanie dopytov od klienta, dopytovanie do databázy, riešenie aplikačnej logiky a odosielanie odpovedí klientovi. Nad PostGIS databázou geoúdajov sme si vytvorili pgrouting databázu, doplňujúcu geoúdaje o graf ciest.

## Data

Dáta sme získali z predpripraveného exportu z [Open Street Maps](http://download.geofabrik.de/europe/slovakia.html). Stiahli sme si dáta pre celé Slovensko a importovali do PostGIS databázy použitím `osm2pgsql` programu. Query nad databázou sú vysunuté do súboru `server-js/serverPostHandler.js` ako handlery volaní do API. GeoJSON je generovaný z priestorových dát funkciou PostGIS `st_asgeojson`. GeoJSON je spracovávaný a dopĺňaný o ďalšie informácie pred odosielaním na frontend.

## Api

**Nájdi najbližší geografický uzol k miestu kliknutia**

`GET /query2-url` s JSON v request.body vo forme:
`body: JSON.stringify({
  click_lat: click_lat,
  click_lon: click_lon
})`

**Nájdi relevantný geografický uzol k názvu ulice a miestu reštaurácie**

`GET /query-street-url` s JSON v request.body vo forme:
`body: JSON.stringify({
  street: street,
  rest_lat: my_restaurantLatLon.click_lat,
  rest_lon: my_restaurantLatLon.click_lon
})`

**Aproximuj najvhodnejšie poradie donášok zákazníkom a nájdi najlepšie cesty**

`GET /query4-url` s JSON v request.body vo forme:
`body: JSON.stringify({
  restaurant: my_restaurant,
  deliveries: deliveries,
  restaurantLatLon: my_restaurantLatLon,
  deliveriesLatLon: deliveriesLatLon
})`

### Response

API odpovedá na požiadavky vždy relevantnými údajmi pod samoopisnými kľúčmi a `geojson` dátami. 
