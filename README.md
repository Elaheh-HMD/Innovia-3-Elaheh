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
- Realtidsuppdatering av bokningar via SignalR
- AI-guide för frågor om hur Innovia Hub används
- Sensor Dashboard för IoT-enheter och larm, med tydlig status när IoT-tjänsterna inte är tillgängliga

## Driftsatt applikation

- **Frontend:** https://innovia-elaheh-web.onrender.com
- **Backend API:** https://innovia-elaheh-api.onrender.com
- **Databas:** PostgreSQL på Render

Frontend och backend är separata Render-tjänster. Frontend använder miljövariabeln VITE_API_URL för backendens publika adress. Backendens miljövariabler omfattar databasanslutning, JWT, CORS och OpenAI-nyckeln. Hemligheter lagras i Render-konfigurationen och ska inte checkas in i Git.

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

AI-controllerns enhetstester omfattar bland annat tom fråga, för lång fråga, lyckat svar och fel från AI-tjänsten.

## Realtidskommunikation

Backend exponerar BookingHub på /Hubs/Booking. När en bokning skapas eller tas bort skickar backend händelsen BookingsChanged. Frontend lyssnar på händelsen och hämtar den uppdaterade bokningslistan.

För att manuellt kontrollera funktionen kan applikationen öppnas i två webbläsarfönster. En bokningsändring i det ena fönstret ska uppdatera informationen i det andra.

## AI-guide

AI-guiden nås via backendens POST /api/ai/ask och kräver autentisering. Tomma frågor och frågor längre än 1 000 tecken avvisas. OpenAI anropas från backend via IAiService och AiService; API-nyckeln exponeras inte i frontend.

AI-guiden är avsedd för information och vägledning om Innovia Hub och ska inte skapa, ändra eller ta bort bokningar.

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
4. Öppna applikationen i två webbläsarfönster och kontrollera SignalR-uppdateringen.
5. Öppna AI-guiden och ställ en fråga om hur plattformen används.
6. Öppna Sensor Dashboard och kontrollera att offline-status visas när IoT-servern inte är tillgänglig.

## Individuellt vidareutvecklade funktioner

- AI-guide via backendens POST /api/ai/ask, med validering och serverbaserad hantering av OpenAI-nyckeln.
- Sensor Dashboard för IoT-enheter och larm, inklusive hantering och presentation av offline-status.
- Förbättringar av driftsättning och miljökonfiguration för den individuella webbapplikationen.

## VG-reflektion

Se [vg-reflektion.md](vg-reflektion.md) för tekniska val, arkitekturöversikt, realtidskommunikation, AI-implementation, driftsättning, utmaningar och kända begränsningar.
