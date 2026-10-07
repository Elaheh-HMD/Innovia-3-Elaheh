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
            throw new InvalidOperationException("OpenAI API key saknas.");
        }

        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        var requestBody = new
        {
            model = "gpt-5-mini",
            input = question
        };

        var json = JsonSerializer.Serialize(requestBody);

        using var content = new StringContent(
            json,
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.PostAsync(
            "https://api.openai.com/v1/responses",
            content
        );

        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"OpenAI API returnerade fel: {response.StatusCode}"
            );
        }

        using var document = JsonDocument.Parse(responseBody);

        var outputText = document.RootElement
            .GetProperty("output")[0]
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString();

        return outputText ?? "Jag kunde inte hitta ett svar.";
    }
}