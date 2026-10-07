using api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Authorize]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly IAiService _aiService;

    public AiController(IAiService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] string question)
    {
        if (string.IsNullOrWhiteSpace(question))
        {
            return BadRequest("Frågan får inte vara tom.");
        }

        if (question.Length > 1000)
        {
            return BadRequest("Frågan får vara högst 1000 tecken.");
        }

        try
        {
            var answer = await _aiService.AskAsync(question);
            return Ok(new { answer });
        }
        catch (Exception)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                "AI-tjänsten kunde inte svara just nu."
            );
        }
    }
}