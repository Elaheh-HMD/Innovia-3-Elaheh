using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using api.Interfaces;

namespace api.Services;

public class AiService : IAiService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public AiService(IConfiguration configuration, HttpClient httpClient)
    {
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<string> AskAsync(string question)
    {
        var apiKey = _configuration["OpenAI:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("OpenAI API-nyckel saknas.");
        }

        var requestBody = new
        {
            model = "gpt-5-mini",
            instructions = """
                Du är Innovia Hubs AI-guide.
                Hjälp användaren att förstå hur Innovia Hub fungerar.
                Ge korta, tydliga svar på svenska.
                Du får bara ge information och vägledning.
                Du får inte skapa, ändra eller ta bort bokningar och du får inte påstå att du har utfört en bokning.
                Om du saknar tillräcklig information om Innovia Hub ska du säga det tydligt i stället för att gissa.
                Innovia Hub används för att hitta och boka resurser, se tillgänglighet och hantera bokningar.
                Exempel på resurser är skrivbord, mötesrum, VR-headset och AI-server.
                När en användare frågar hur en bokning görs ska du förklara att användaren väljer resurs, datum och ledig tid och sedan genomför bokningen i gränssnittet.
                """,
            input = question
        };

        var json = JsonSerializer.Serialize(requestBody);

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://api.openai.com/v1/responses"
        );

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        request.Content = new StringContent(
            json,
            Encoding.UTF8,
            "application/json"
        );

        using var response = await _httpClient.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"OpenAI API returnerade statuskod {response.StatusCode}."
            );
        }

        using var document = JsonDocument.Parse(responseBody);

        var output = document.RootElement.GetProperty("output");

        foreach (var item in output.EnumerateArray())
        {
            if (!item.TryGetProperty("content", out var content))
            {
                continue;
            }

            foreach (var contentItem in content.EnumerateArray())
            {
                if (contentItem.TryGetProperty("text", out var text))
                {
                    var value = text.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        return value;
                    }
                }
            }
        }

        return "Jag kunde inte hitta ett svar från AI-tjänsten.";
    }
}
