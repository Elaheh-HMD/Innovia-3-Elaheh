# Innovia Hub

Innovia Hub är en webbapplikation för ett coworking- och forskningscenter där användare kan boka resurser och se deras tillgänglighet.

Projektet består av:

- **Backend:** ASP.NET Core Web API (.NET 8)
- **Frontend:** React + TypeScript + Vite
- **Databas:** PostgreSQL
- **Realtidskommunikation:** SignalR
- **Autentisering:** ASP.NET Core Identity + JWT
- **Databasåtkomst:** Entity Framework Core
- **Docker:** PostgreSQL körs lokalt i Docker

## Kom igång

### 1. Klona `dev`

Klona projektets `dev`-branch:

```powershell
git clone -b dev https://github.com/Innovia-3/Innovia-3.git
cd Innovia-3
```

### 2. Starta PostgreSQL

Se till att Docker Desktop är startat.

Kör sedan från projektets rotmapp:

```powershell
docker compose up -d
```

Kontrollera att PostgreSQL kör:

```powershell
docker compose ps
```

Containern `innoviahub-postgres` ska ha status `Up`.

### 3. Konfigurera JWT

Gå till backend:

```powershell
cd backend\api
```

Projektet använder .NET User Secrets för JWT-nyckeln:

```powershell
dotnet user-secrets set "Jwt:Key" "<din-JWT-nyckel>"
```

JWT-nyckeln för projektet tillhandahålls separat.

### 4. Uppdatera databasen

På en ny databas behöver EF Core-migrationerna köras:

```powershell
dotnet ef database update
```

Detta skapar databastabellerna och lägger in projektets seedade data.

### 5. Starta backend

Från `backend/api`:

```powershell
dotnet run
```

Backend körs på:

```text
http://localhost:5197
```

Låt terminalen vara igång.

### 6. Starta frontend

Öppna en ny terminal och gå till frontend:

```powershell
cd frontend
npm install
npm run dev
```

Frontend körs på:

```text
http://localhost:5173
```

Öppna adressen i webbläsaren.

## Starta projektet efter första installationen

När databasen redan är konfigurerad behöver migrationerna och `npm install` normalt inte köras igen.

Starta PostgreSQL från projektets rot:

```powershell
docker compose up -d
```

Starta backend:

```powershell
cd backend\api
dotnet run
```

Starta frontend i en separat terminal:

```powershell
cd frontend
npm run dev
```

## AI-guide

Innovia Hubs AI-guide är en inloggningsskyddad funktion som hjälper användaren att förstå hur plattformen fungerar.

AI-guiden:
- tar emot frågor via backendens `POST /api/ai/ask`
- använder OpenAI via backend, inte direkt från frontend
- använder en separat `IAiService` och `AiService`, vilket gör lösningen enklare att vidareutveckla
- hämtar API-nyckeln från .NET User Secrets lokalt
- får endast ge information och vägledning och ska inte skapa, ändra eller ta bort bokningar
- begränsar frågor till högst 1000 tecken

### Testa backendens enhetstester

Från projektets rotmapp:

```powershell
dotnet test backend/api.Tests/api.Tests.csproj
```

Enhetstesterna täcker tom fråga, för lång fråga, lyckat svar och fel från AI-tjänsten.

### AI-nyckel lokalt

API-nyckeln ska aldrig läggas i Git eller frontend-koden. Lägg den lokalt i User Secrets:

```powershell
cd backend\api
dotnet user-secrets set "OpenAI:ApiKey" "DIN_API_NYCKEL"
```

I produktion ska nyckeln lagras i en säker secret manager.

## Kort om systemet

Innovia Hub hanterar fyra typer av bokningsbara resurser:

| Resurs     | Antal |
| ---------- | ----: |
| Skrivbord  |    15 |
| Mötesrum   |     4 |
| VR-headset |     4 |
| AI-server  |     1 |

Tillgänglighet beräknas utifrån befintliga bokningar och valt tidsintervall.

SignalR används för att uppdatera bokningsinformation i realtid. När en bokning skapas eller tas bort skickar backend eventet `BookingsChanged` till anslutna klienter.

Användare autentiseras med ASP.NET Core Identity och JWT. Systemet har rollerna `User` och `Admin`.

## Vanliga problem

Om backend ger:

```text
relation "AspNetRoles" does not exist
```

har migrationerna inte körts. Kör:

```powershell
cd backend\api
dotnet ef database update
```

Om backend inte får kontakt med PostgreSQL, kontrollera Docker:

```powershell
docker compose ps
```

och starta databasen vid behov:

```powershell
docker compose up -d
```

Om frontend saknar dependencies:

```powershell
cd frontend
npm install
```

## Komplettering inför inlämning

### AI-assistent
AI-funktionen finns bakom `POST /api/ai/ask` och kräver autentisering.
Frågor får inte vara tomma eller längre än 1 000 tecken. OpenAI-nyckeln
ska konfigureras på backend och får inte placeras i frontend.

### Sensorvy
Sensorvyn finns under `/sensors`. IoT-systemet körs separat från webbappen.
Kontrollera att statusen för frånkopplade enheter visas korrekt i den miljö
som demonstreras.

### VG-reflektion och presentation
Se [vg-reflektion.md](vg-reflektion.md) för arkitektur, tekniska val,
realtidskommunikation, begränsningar och framtida förbättringar.
Se [PRESENTATION.md](PRESENTATION.md) för presentationsunderlag.

### Säkerhet
Lägg inte API-nycklar, lösenord eller andra hemligheter i Git. Konfigurera
miljövariabler och secrets i den miljö där backend körs.


## Driftsättning och miljövariabler

En publik driftsättning är inte konfigurerad automatiskt av GitHub. När backend och frontend driftsätts på olika domäner behöver följande värden konfigureras i respektive hostingtjänst:

**Backend**
- `ConnectionStrings__DefaultConnection`: anslutningssträng till den hostade PostgreSQL-databasen.
- `Jwt__Key`: en stark, privat JWT-nyckel. Lägg den inte i Git.
- `Jwt__Issuer` och `Jwt__Audience`: måste matcha värdena som används när JWT-token skapas och valideras.
- `OpenAI__ApiKey`: OpenAI-nyckeln om AI-funktionen ska användas.
- `Cors__AllowedOrigins__0`: frontendens exakta HTTPS-origin, till exempel `https://din-app.example`. Behåll inte enbart localhost i produktion.

**Frontend (byggvariabler)**
- `VITE_API_URL`: backendens publika basadress, utan avslutande snedstreck.
- IoT-integrationen använder `VITE_IOT_HUB_URL`, `VITE_IOT_RULES_API_URL`, `VITE_IOT_REGISTRY_API_URL`, `VITE_IOT_TENANT_SLUG` och `VITE_IOT_TENANT_ID` när dessa tjänster finns tillgängliga. Om IoT-servern inte körs ska gränssnittet visa anslutnings-/felstatus i stället för att anta att data finns.

Efter att miljövariabler har ändrats måste frontend byggas om. Använd endast publika adresser i frontendvariabler; lägg aldrig hemligheter i `VITE_*`-variabler eftersom de exponeras i webbläsaren.
