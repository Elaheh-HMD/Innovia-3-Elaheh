# VG-reflektion – Innovia Hub

## 1. Lärdomar
Arbetet med Innovia Hub har gett erfarenhet av att utveckla en fullstackapplikation
med React och TypeScript i frontend och ASP.NET Core Web API i backend.
Projektet har också gett praktisk erfarenhet av autentisering, behörighetskontroll,
databasåtkomst, realtidskommunikation och integration av en extern AI-tjänst.

## 2. Tekniska val och motiveringar
- **React och TypeScript:** används för ett komponentbaserat gränssnitt och
  tydligare typer i frontend.
- **ASP.NET Core Web API och .NET 8:** hanterar API-anrop och affärslogik.
- **PostgreSQL och Entity Framework Core:** används för lagring och databasåtkomst.
- **ASP.NET Core Identity och JWT:** används för identitet och autentisering.
  Backend ska kontrollera behörighet; frontendens navigering är inte en
  säkerhetsgräns.
- **SignalR:** är registrerat i backend för realtidskommunikation.
- **OpenAI API:** används via en separat AI-tjänst bakom backend. API-nyckeln
  ska lagras i konfiguration eller secrets, inte i frontendens källkod.

## 3. Problem och utmaningar
En viktig utmaning är att skilja mellan användarens och administratörens
behörigheter. Bokningar behöver skyddas så att användare bara kan hantera
åtgärder de har rätt till, medan administratörer kan ha utökad åtkomst.

En annan utmaning är beroenden till externa system, exempelvis AI-tjänsten
och IoT-enheter. Applikationen behöver hantera fel och visa tydlig status
i stället för att förutsätta att alla tjänster alltid är tillgängliga.

## 4. Arkitektur
Lösningen består av en React/TypeScript-frontend, ett ASP.NET Core Web API,
en PostgreSQL-databas och externa tjänster. Frontend skickar HTTP-anrop till
backend. Backend hanterar autentisering, behörighet, dataåtkomst och anrop
till AI-tjänsten. SignalR-hubben är exponerad på `/Hubs/Booking`.

IoT-lösningen är ett separat system och ska inte betraktas som samma process
som webbapplikationens backend.

## 5. Realtidskommunikation
Backend registrerar SignalR med `AddSignalR()` och exponerar
`BookingHub` på `/Hubs/Booking`. En hubb kan användas för att meddela
anslutna klienter när bokningar ändras. Att hubben är registrerad bevisar
dock inte i sig att hela klientflödet fungerar; anslutning och händelser
måste verifieras i den körande applikationen.

## 6. AI-funktion
AI-funktionen exponeras genom `POST /api/ai/ask` och kräver autentisering.
Backend avvisar tomma frågor och frågor längre än 1 000 tecken.
`AiService` anropar OpenAI Responses API med modellen `gpt-5-mini`.
Instruktionerna begränsar assistenten till vägledning: den ska inte skapa,
ändra eller ta bort bokningar. API-nyckeln ska hanteras på serversidan.

## 7. Driftsättning och miljökonfiguration
Den lokala utvecklingsmiljön använder frontend med Vite, backend med .NET
och PostgreSQL via Docker Compose. Lokal API-adress som dokumenterats i
projektet är `http://localhost:5197`.

En verifierad publik driftsättningsadress har inte dokumenterats här.
Före inlämning måste den faktiska driftsättningen, miljövariablerna,
databasanslutningen och eventuella CORS-inställningar kontrolleras.
Hemligheter får inte checkas in i Git.

## 8. Kända begränsningar och framtida förbättringar
- Dokumentera och verifiera en publik driftsättning.
- Verifiera SignalR-anslutning och uppdatering av bokningar från flera klienter.
- Verifiera hur gränssnittet visar att IoT-systemet är offline.
- Förbättra felhantering, loggning och övervakning av externa tjänster.
- Utöka automatiserade tester för behörighet, bokningsflöden och integrationer.

## 9. Testning
Backendtester kan köras med:
`dotnet test backend/api.Tests/api.Tests.csproj`

Frontendens produktionsbygge kan kontrolleras med:
`cd frontend && npm run build`

Frontendens kodkontroll kan köras med:
`cd frontend && npm run lint`

Testresultat ska dokumenteras utifrån den faktiska körningen; inga testresultat
antas vara godkända utan att kommandona har slutförts.
