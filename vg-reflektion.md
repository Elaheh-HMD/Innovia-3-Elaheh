# VG-reflektion – Innovia Hub

## 1. Vad jag har lärt mig

Under kursen och vidareutvecklingen av Innovia Hub har jag fått praktisk erfarenhet av att arbeta med en fullstackapplikation. Jag har arbetat med React och TypeScript i frontend, ASP.NET Core Web API i backend och PostgreSQL som databas. Jag har också fått bättre förståelse för autentisering, behörighetskontroll, realtidskommunikation, externa API:er och driftsättning i en molnmiljö.

En viktig lärdom är att en funktion inte är färdig bara för att den fungerar lokalt. Den behöver också konfigureras, driftsättas och testas i den miljö där användaren faktiskt ska använda den.

## 2. Tekniska val och varför

- **React och TypeScript:** ger ett komponentbaserat gränssnitt och hjälper till att hålla frontendkoden strukturerad.
- **ASP.NET Core Web API (.NET 8):** hanterar API:er, affärslogik och integrationer på serversidan.
- **PostgreSQL och Entity Framework Core:** används för beständig lagring och för att hantera databasåtkomst med entiteter och migrationer.
- **ASP.NET Core Identity och JWT:** används för inloggning och för att identifiera användaren vid API-anrop. Behörighet kontrolleras i backend.
- **SignalR:** används för att informera anslutna klienter när bokningar förändras, så att bokningslistan kan uppdateras utan att användaren behöver ladda om sidan.
- **Samlad tillgänglighetskontroll:** kalendern hämtar dagens lediga tider med en API-förfrågan. Backend hämtar överlappande bokningar med en databasfråga för datumet och räknar ut timintervallen i minnet. Det minskar antalet samtidiga anrop och tar hänsyn till svensk lokal tid.
- **OpenAI API:** används av en separat AI-tjänst i backend. Frontend anropar backend och API-nyckeln hålls på serversidan i stället för att exponeras i webbläsaren.

Jag valde att lägga AI-anropet i en separat tjänst (`IAiService` och `AiService`). Det separerar integrationen mot AI-leverantören från controllern och gör lösningen enklare att testa och vidareutveckla.

## 3. Arkitekturöversikt

Applikationen består av följande huvuddelar:

```text
Användare
   |
   v
React + TypeScript (Frontend)
   |
   | HTTPS / REST API
   v
ASP.NET Core Web API (.NET 8)
   |             |                 |
   |             |                 +--> OpenAI API
   |             |
   |             +--> SignalR Hub (/Hubs/Booking)
   |
   v
PostgreSQL
     
Separat IoT-system:
Sensorer / simulator --> IoT-tjänster --> Sensor Dashboard
                         (kan vara offline)
```

Frontend kommunicerar med backend via HTTP-anrop. Backend ansvarar för validering, autentisering, behörighet och databasåtkomst. AI-anropet görs från backend. IoT-systemet är separat från bokningsapplikationen och är inte ett krav att driftsätta för denna inlämning.

## 4. Realtidskommunikation

Realtidskommunikationen för bokningar implementeras med SignalR.

Backend registrerar SignalR i `Program.cs` och exponerar `BookingHub` på `/Hubs/Booking`. När en bokning skapas eller tas bort skickar `BookingController` händelsen `BookingsChanged` via `IHubContext<BookingHub>`.

Frontendkomponenten för bokningar skapar en SignalR-anslutning till samma hubb. När klienten tar emot `BookingsChanged` hämtar den bokningslistan igen från API:et. På så sätt kan flera anslutna klienter få uppdaterad information när bokningar ändras.

Detta har även kontrollerats i den driftsatta applikationen: två webbläsarfönster öppnades med samma administratörskonto. När en bokning skapades i det ena fönstret visades den snabbt i det andra fönstrets bokningslista utan att sidan laddades om. En avgränsning är att kalenderns färgmarkeringar för tillgängliga tider inte uppdateras direkt av denna SignalR-händelse. De uppdateras när sidan laddas om eller när relevanta kalender-/resursval ändras. En framtida förbättring är att även låta kalenderkomponenten reagera på `BookingsChanged`.

## 5. AI-implementation

AI-guiden nås via backendens `POST /api/ai/ask`. Endpointen kräver autentisering. Tomma frågor och frågor längre än 1 000 tecken avvisas. Backend anropar OpenAI Responses API via `AiService` och returnerar svaret till frontend. Fel från AI-anropet loggas på serversidan för att skilja exempelvis saknad konfiguration från fel hos API-leverantören utan att visa hemligheter för klienten.

AI-guiden är avsedd att ge information om hur Innovia Hub används. Instruktionerna begränsar den till vägledning och den ska inte skapa, ändra eller ta bort bokningar. API-nyckeln läses från backendens konfiguration och ska aldrig läggas i frontendkod eller versionshanteras.

Lösningen är uppdelad i `AiController`, `IAiService` och `AiService`. Controllern ansvarar för HTTP-gränssnittet och validering, medan tjänsten ansvarar för anropet till OpenAI. Det gör controllerlogiken möjlig att testa isolerat med en mockad tjänst. Systeminstruktionen begränsar assistentens roll till att förklara hur plattformen används; den ska inte hitta på bokningsregler, tillgänglighet eller utföra bokningsåtgärder. Svaret parsas defensivt så att oväntade eller saknade fält i leverantörens svar inte hanteras som om de alltid fanns.

Vid det första produktionstestet svarade OpenAI med `401 Unauthorized – expired_secret_key`, vilket visade att den tidigare konfigurerade nyckeln hade gått ut. Kursläraren tillhandahöll därefter en ny nyckel. Den nya nyckeln konfigurerades som `OpenAI__ApiKey` i Render och ett nytt live-test genomfördes: en riktig fråga om användning av Innovia Hub skickades från den driftsatta applikationen och AI-guiden returnerade ett begripligt svar. Själva nyckelvärdet lagras endast i Render och har inte lagts i källkoden eller Git. De automatiska controller-testerna är fortfarande separata från detta externa live-test.

## 6. Driftsättning och miljökonfiguration

Applikationen är driftsatt på Render:

- **Frontend:** https://innovia-elaheh-web.onrender.com
- **Backend API:** https://innovia-elaheh-api.onrender.com
- **Databas:** PostgreSQL på Render.

Frontend och backend är separata tjänster. Frontendens byggkonfiguration använder `VITE_API_URL` för att anropa backend. Backendens miljökonfiguration innehåller databasanslutning, JWT-inställningar, CORS-origin och OpenAI-nyckel. AI-guiden i produktion kräver att `OpenAI__ApiKey` är satt till en giltig OpenAI API-nyckel i Render-tjänstens Environment-inställningar. Hemligheter hanteras som miljövariabler i driftmiljön och ska inte checkas in i Git.

Render tillhandahåller PostgreSQL-anslutningen som en databas-URL. Backend omvandlar den till ett anslutningsformat som Npgsql kan använda.

## 7. IoT och hantering av offline-läge

IoT-servern behöver enligt uppgiftens instruktioner inte vara driftsatt. Det viktiga är att webbplattformen fortsätter fungera när IoT-systemet inte är tillgängligt.

Sensor Dashboard försöker hämta enheter och larm från IoT-tjänsterna samt ansluta till SignalR-hubben för sensordata. Om tjänsterna inte svarar ska gränssnittet visa ett tydligt meddelande om att IoT-servern är offline eller inte tillgänglig. Bokningsflödet och övriga delar av Innovia ska fortfarande fungera oberoende av IoT.

## 8. Utmaningar och hur de hanterades

En utmaning var att få applikationen att fungera i en hostad miljö, eftersom konfigurationen där skiljer sig från lokal utveckling. Databasanslutning, CORS, API-adresser och hemligheter behöver hanteras separat för produktion.

En annan utmaning är att externa tjänster kan vara otillgängliga. Därför behöver applikationen hantera anslutningsfel och kommunicera status tydligt i gränssnittet i stället för att förutsätta att alla tjänster alltid är tillgängliga.

Jag har också behövt skilja på funktioner som tillhör bokningsplattformen och den separata IoT-lösningen. Det gör att den centrala applikationen kan demonstreras även när IoT-servern är offline.

## 9. Kända begränsningar och vad jag skulle förbättra

- Jag skulle utöka automatiserade tester för hela bokningsflödet och behörighetskontroller.
- Jag skulle lägga till integrationstester för den samlade dagliga tillgänglighetskontrollen och övervaka externa AI-anrop i produktionsmiljön.
- Jag skulle lägga till mer övervakning och strukturerad loggning för externa tjänster.
- Kalenderns färgmarkeringar för lediga och upptagna tider uppdateras inte omedelbart när en annan klient skapar eller tar bort en bokning. Bokningslistan uppdateras via SignalR, men kalenderkomponenten behöver i nuläget en omladdning eller ändring av relevanta val. Jag skulle låta även kalendern lyssna på `BookingsChanged`.
- Jag skulle förbättra hanteringen av återanslutning och statusinformation för SignalR.
- Jag skulle driftsätta och integrera IoT-tjänsterna i en senare version, även om det inte krävs för denna inlämning.
- Jag skulle utöka AI-guidens testning och utvärdera svarens kvalitet med fler realistiska användarfrågor.

## 10. Testning inför demonstration

Följande manuella tester är relevanta för att visa applikationens centrala funktioner:

1. Logga in och kontrollera att skyddade vyer bara visas för inloggade användare.
2. Skapa en bokning och kontrollera att den visas i bokningslistan.
3. Testa att boka samma resurs för en överlappande tid och kontrollera att systemet avvisar dubbelbokningen.
4. Använd två webbläsarfönster för att kontrollera SignalR-uppdateringen när en bokning skapas eller tas bort.
5. Öppna AI-guiden och ställ en fråga om hur plattformen används.
6. Öppna Sensor Dashboard när IoT-servern är offline och kontrollera att ett tydligt offline-meddelande visas samtidigt som bokningsdelen fortfarande fungerar.

### Automatiserade enhetstester för AI-controllern

De fyra testerna använder en mockad `IAiService`. På så sätt kan controllerns beteende kontrolleras utan nätverksanrop eller en riktig OpenAI-nyckel:

1. **Tom fråga:** kontrollerar att en tom eller blank fråga avvisas av valideringen.
2. **För lång fråga:** kontrollerar att en fråga som överskrider gränsen på 1 000 tecken avvisas.
3. **Lyckat svar:** kontrollerar att controllern returnerar ett lyckat svar när AI-tjänsten returnerar ett svar.
4. **Fel från AI-tjänsten:** kontrollerar att ett undantag från den injicerade tjänsten hanteras av controllern och inte lämnas ohanterat.

Testerna täcker därmed både validering, normalflöde och ett felaktigt tjänsteflöde. De testar inte OpenAI:s externa tillgänglighet eller om produktionsnyckeln är giltig.

### Manuella tester i den driftsatta applikationen

Följande manuella tester har genomförts i den driftsatta applikationen: registrering och inloggning, skapande av bokning, avvisning av överlappande bokning, SignalR-uppdatering av bokningslistan i ett andra webbläsarfönster, live-svar från AI-guiden efter att den nya nyckeln konfigurerades i Render samt offline-meddelande i Sensor Dashboard.

1. Logga in och kontrollera att skyddade vyer bara visas för inloggade användare.
2. Skapa en bokning och kontrollera att den visas i bokningslistan.
3. Testa att boka samma resurs för en överlappande tid och kontrollera att systemet avvisar dubbelbokningen.
4. Använd två webbläsarfönster för att kontrollera SignalR-uppdateringen när en bokning skapas eller tas bort.
5. Öppna Sensor Dashboard när IoT-servern är offline och kontrollera att ett tydligt offline-meddelande visas samtidigt som bokningsdelen fortfarande fungerar.
