# Innovia Hub – presentationsunderlag

## Bild 1 – Problem och mål
Innovia Hub är en plattform för en coworking- och forskningsmiljö.
Målet är att samla bokning av resurser och ge användaren en tydlig ingång
till systemets funktioner.

## Bild 2 – Teknik
- Frontend: React, TypeScript och Vite
- Backend: ASP.NET Core Web API, .NET 8
- Databas: PostgreSQL och Entity Framework Core
- Autentisering: ASP.NET Core Identity och JWT
- Realtid: SignalR
- AI: OpenAI API via backend

## Bild 3 – Funktioner
- Inloggning och användarbehörigheter
- Bokningsvy för resurser
- Separat administratörsvy
- AI-assistent för vägledning
- Sensorvy för IoT-data

Visa endast funktioner som har verifierats i den körande applikationen.

## Bild 4 – Säkerhet och AI
Backend kontrollerar autentisering och behörighet.
AI-assistenten är avsedd för information och vägledning och ska inte ändra
bokningar. API-nyckeln ska förvaras på serversidan.

## Bild 5 – Realtid och IoT
SignalR-hubben är konfigurerad i backend. IoT-systemet är separat.
Demonstrera realtidsuppdatering och status när IoT är frånkopplat om dessa
flöden har verifierats före presentationen.

## Bild 6 – Utmaningar och lärdomar
- Att skilja mellan användar- och administratörsbehörigheter
- Att koppla ihop frontend, backend och databas
- Att hantera externa tjänster och fel
- Att hålla hemligheter utanför källkoden

## Bild 7 – Status och nästa steg
Redovisa faktiska testresultat och den verifierade driftsättningslänken.
Kända förbättringar är bättre övervakning, mer integrationstestning och
tydligare hantering av frånkopplade tjänster.
