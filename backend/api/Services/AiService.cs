using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using api.Interfaces;

namespace api.Services;

public class AiService : IAiService
{
    private const string OpenAiEndpoint = "https://api.openai.com/v1/responses";

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

        using var request = new HttpRequestMessage(HttpMethod.Post, OpenAiEndpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim());

        var requestBody = new
        {
            model = "gpt-5-mini",
            instructions = """
                Du är Innovia Hubs AI-guide. Hjälp användaren att förstå hur Innovia Hub fungerar.
                Ge korta, tydliga och praktiska svar på svenska.
                Du får endast ge information och vägledning. Du får inte skapa, ändra eller ta bort bokningar.
                Om du inte har tillräcklig information ska du säga det tydligt och hänvisa användaren till
                den vanliga bokningsvyn eller en administratör. Hitta inte på funktioner, regler eller
                tillgänglighet som du inte känner till.

                Innovia Hub är en coworking- och forskningsplattform där användare kan boka resurser
                och se tillgänglighet. Bokningsbara resurstyper är skrivbord, mötesrum, VR-headset och
                AI-server. Användaren väljer resurs, datum och ledig tid i bokningsvyn.
                """,
            input = question
        };

        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json"
        );

        using var response = await _httpClient.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            var providerError = GetProviderError(responseBody);
            throw new InvalidOperationException(
                $"OpenAI API returnerade {(int)response.StatusCode} {response.StatusCode}. {providerError}"
            );
        }

        using var document = JsonDocument.Parse(responseBody);

        foreach (var output in document.RootElement
                     .GetProperty("output")
                     .EnumerateArray())
        {
            if (!output.TryGetProperty("content", out var content))
            {
                continue;
            }

            foreach (var item in content.EnumerateArray())
            {
                if (item.TryGetProperty("type", out var type) &&
                    type.GetString() == "output_text" &&
                    item.TryGetProperty("text", out var text))
                {
                    var answer = text.GetString();

                    if (!string.IsNullOrWhiteSpace(answer))
                    {
                        return answer;
                    }
                }
            }
        }

        return "Jag kunde inte hitta ett svar just nu.";
    }

    private static string GetProviderError(string responseBody)
    {
        try
        {
            using var document = JsonDocument.Parse(responseBody);
            if (document.RootElement.TryGetProperty("error", out var error))
            {
                var code = error.TryGetProperty("code", out var codeElement)
                    ? codeElement.ToString()
                    : null;
                var type = error.TryGetProperty("type", out var typeElement)
                    ? typeElement.ToString()
                    : null;
                var message = error.TryGetProperty("message", out var messageElement)
                    ? messageElement.ToString()
                    : null;

                return string.Join(" ", new[] { type, code, message }
                    .Where(value => !string.IsNullOrWhiteSpace(value)));
            }
        }
        catch (JsonException)
        {
            // Do not expose an unstructured provider response in application errors.
        }

        return "OpenAI skickade ingen läsbar felbeskrivning.";
    }
}
