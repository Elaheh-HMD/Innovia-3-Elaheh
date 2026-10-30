# Innovia Hub

Innovia Hub är en webbapplikation för ett coworking- och forskningscenter. Användare kan se tillgängliga resurser och boka dem. Applikationen innehåller även en AI-guide och en separat vy för IoT-sensorer.

## Teknik

- **Frontend:** React, TypeScript och Vite
- **Backend:** ASP.NET Core Web API (.NET 8)
- **Databas:** PostgreSQL och Entity Framework Core
- **Autentisering och behörighet:** ASP.NET Core Identity och JWT
- **Realtidskommunikation:** SignalR
- **AI:** OpenAI API via backend
- **Lokal databas:** Docker Compose

## Funktioner

- Registrering och inloggning
- Roller för användare och administratörer
- Bokning av skrivbord, mötesrum, VR-headset och AI-server
- Kontroll av resursens tillgänglighet och överlappande bokningar
- Daglig tillgänglighetskontroll med en samlad API-förfrågan och en databasfråga per datum, i svensk lokal tid
- Realtidsuppdatering av bokningar via SignalR
- AI-guide för frågor om hur Innovia Hub används
- Sensor Dashboard för IoT-enheter och larm, med tydlig status när IoT-tjänsterna inte är tillgängliga

## Driftsatt applikation

- **Frontend:** https://innovia-elaheh-web.onrender.com
- **Backend API:** https://innovia-elaheh-api.onrender.com
- **Databas:** PostgreSQL på Render

Frontend och backend är separata Render-tjänster. Frontend använder miljövariabeln `VITE_API_URL` för backendens publika adress. Backendens miljövariabler omfattar databasanslutning, JWT, CORS och OpenAI-nyckeln. AI-guiden i produktion använder miljövariabeln `OpenAI__ApiKey` under API-tjänstens Environment-inställningar i Render. Efter att den tidigare nyckeln returnerade `401 Unauthorized – expired_secret_key` tillhandahöll kursläraren en ny nyckel. Den nya nyckeln har konfigurerats i Render och ett live-test med en riktig fråga har gett ett svar. Själva nyckelvärdet lagras endast som hemlighet i Render och finns inte i Git. Hemligheter lagras i Render-konfigurationen och ska inte checkas in i Git.

Render-databasens anslutnings-URL konverteras i backend till ett anslutningsformat som Npgsql kan använda.

## Kom igång lokalt

### Förutsättningar

- .NET 8 SDK
- Node.js och npm
- Docker Desktop

### 1. Klona projektet

```bash
git clone -b dev https://github.com/Elaheh-HMD/Innovia-3-Elaheh.git
cd Innovia-3-Elaheh
```

### 2. Starta PostgreSQL

Kör från projektets rotmapp:

```bash
docker compose up -d
docker compose ps
```

Kontrollera att PostgreSQL-containern körs.

### 3. Konfigurera backendens hemligheter

Gå till backendprojektet:

```bash
cd backend/api
```

Konfigurera en egen JWT-nyckel och OpenAI-nyckel med .NET User Secrets:

```bash
dotnet user-secrets set "Jwt:Key" "<din-jwt-nyckel>"
dotnet user-secrets set "OpenAI:ApiKey" "<din-openai-api-nyckel>"
```

Använd aldrig riktiga nycklar i källkoden eller i Git.

### 4. Starta backend

Från backend/api:

```bash
dotnet run
```

Backendens lokala adress är http://localhost:5197.

### 5. Starta frontend

Öppna en ny terminal från projektets rotmapp:

```bash
cd frontend
npm install
npm run dev
```

Frontendens lokala adress är http://localhost:5173.

Om den lokala API-adressen skiljer sig från standardvärdet behöver VITE_API_URL konfigureras för frontend.

## Databas och tester

Backend tillämpar EF Core-migrationer vid uppstart. Migrationer kan även köras manuellt från backend/api:

```bash
dotnet ef database update
```

Kör backendens tester från projektets rotmapp:

```bash
dotnet test backend/api.Tests/api.Tests.csproj
```

AI-controllerns fyra enhetstester använder en mockad AI-tjänst och kontrollerar controllerlogiken utan att göra riktiga anrop till OpenAI: tom fråga avvisas, fråga över maxgränsen avvisas, ett lyckat tjänstesvar returneras korrekt och ett fel från tjänsten hanteras. Dessa tester verifierar API:ets beteende men bevisar inte att en extern API-nyckel fungerar. Fel från AI-leverantören loggas på backend så att driftproblem kan diagnostiseras utan att API-nyckeln exponeras.

## Realtidskommunikation

Backend exponerar BookingHub på /Hubs/Booking. När en bokning skapas eller tas bort skickar backend händelsen BookingsChanged. Frontend lyssnar på händelsen och hämtar den uppdaterade bokningslistan.

Vid manuell kontroll öppnades applikationen i två webbläsarfönster med samma administratörskonto. När en bokning skapades i det ena fönstret dök den upp snabbt i det andra fönstrets bokningslista utan omladdning. Kalenderns färgmarkeringar för lediga/upptagna tider uppdateras däremot inte omedelbart via SignalR; de hämtas på nytt när kalendern laddas om eller relevanta val ändras.

## AI-guide

AI-guiden nås via backendens POST /api/ai/ask och kräver autentisering. Tomma frågor och frågor längre än 1 000 tecken avvisas. OpenAI anropas från backend via IAiService och AiService; API-nyckeln exponeras inte i frontend.

AI-guiden är avsedd för information och vägledning om Innovia Hub och ska inte skapa, ändra eller ta bort bokningar. Efter att kursläraren tillhandahöll en ny API-nyckel konfigurerades `OpenAI__ApiKey` i Render. En riktig fråga skickades därefter i den driftsatta applikationen och AI-guiden returnerade ett svar.

## IoT och offline-läge

IoT-systemet är separat från bokningsapplikationen och behöver inte vara driftsatt för denna inlämning. När IoT-tjänsterna inte är tillgängliga ska Sensor Dashboard visa en tydlig status. Bokningsfunktionerna ska fortsätta fungera oberoende av IoT-systemet.

## Administratörskonto

Ett demoadministratörskonto är konfigurerat även i den driftsatta Render-miljön. Följande uppgifter har verifierats för inloggning i den publicerade applikationen:

- **E-post:** admin@innoviahub.se
- **Lösenord:** Admin123!

Kontot är avsett för demonstration av projektet. Använd inte samma lösenord för personliga eller andra tjänster.

## Inlämning

- **Driftsatt applikation:** https://innovia-elaheh-web.onrender.com
- **GitHub-repository:** https://github.com/Elaheh-HMD/Innovia-3-Elaheh
- **VG-reflektion:** [vg-reflektion.md](vg-reflektion.md)

### Testa applikationen

1. Öppna den driftsatta applikationen och logga in med demoadministratörskontot ovan eller registrera ett användarkonto.
2. Testa att skapa en bokning och kontrollera att den visas i bokningslistan.
3. Kontrollera att en överlappande bokning av samma resurs avvisas.
4. Öppna applikationen i två webbläsarfönster. Skapa en bokning i det ena och kontrollera att den visas i det andra fönstrets bokningslista utan omladdning. Observera att kalenderns färgmarkeringar ännu kräver omladdning eller att relevanta val ändras.
5. Öppna AI-guiden, ställ en fråga om hur plattformen används och kontrollera att ett svar visas. Live-anropet har verifierats efter att den nya nyckeln konfigurerades i Render.
6. Öppna Sensor Dashboard och kontrollera att offline-status visas när IoT-servern inte är tillgänglig.

## Individuellt vidareutvecklade funktioner

- AI-guide via backendens POST /api/ai/ask, med validering och serverbaserad hantering av OpenAI-nyckeln.
- Sensor Dashboard för IoT-enheter och larm, inklusive hantering och presentation av offline-status.
- Förbättringar av driftsättning och miljökonfiguration för den individuella webbapplikationen.

## VG-reflektion

Se [vg-reflektion.md](vg-reflektion.md) för tekniska val, arkitekturöversikt, realtidskommunikation, AI-implementation, driftsättning, utmaningar och kända begränsningar.
