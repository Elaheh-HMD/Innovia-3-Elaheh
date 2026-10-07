# Testning och kvalitet

## Mina tester

- Backend-projektet har byggts med dotnet build utan fel.
- Tomma AI-frågor valideras i backend.
- API-nyckeln läses från .NET User Secrets och finns inte i källkoden.
- Frontend skickar AI-frågan till backend i stället för direkt till AI-leverantören.
- Fel från AI-tjänsten hanteras med ett generellt felmeddelande.
- AI-guiden visar exempel på frågor, laddningsstatus och felmeddelanden.
- Git-diffen har kontrollerats så att AI-ändringarna är avgränsade.

Automatiserade enhetstester är nästa kvalitetssteg, särskilt för validering och svarshantering i AiService. De är viktiga eftersom de gör framtida ändringar säkrare.

## Framtids säkring

Lösningen är uppdelad i interface, service och controller. Det gör det enklare att byta AI-leverantör eller vidareutveckla funktionen utan att frontend behöver känna till leverantörens API.

Framtida förbättringar är en separat DTO för frågor och svar, fler automatiserade tester, bättre serverloggning, konfigurerbar modell och kontrollerad koppling till Innovias egna data.

## Säkerhet

API-nyckeln lagras lokalt med .NET User Secrets och ska inte läggas i Git eller frontend-koden.

Frontend anropar Innovias backend. AI-tjänsten får inte direkt åtkomst till databasen.

I produktion bör nyckeln lagras i en säker secret manager. AI-guiden ska fortsätta vara begränsad till information och vägledning och inte själv skapa, ändra eller ta bort bokningar.
