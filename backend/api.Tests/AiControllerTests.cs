using api.Controllers;
using api.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Api.Tests;

public class AiControllerTests
{
    [Fact]
    public async Task Ask_ReturnsBadRequest_WhenQuestionIsEmpty()
    {
        var controller = CreateController(new FakeAiService("Svar"));
        var result = await controller.Ask(" ");
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Ask_ReturnsBadRequest_WhenQuestionIsTooLong()
    {
        var controller = CreateController(new FakeAiService("Svar"));
        var result = await controller.Ask(new string('a', 1001));
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Ask_ReturnsAnswer_WhenServiceSucceeds()
    {
        var controller = CreateController(new FakeAiService("Det här är ett testsvar."));
        var result = await controller.Ask("Hur bokar jag ett mötesrum?");
        var okResult = Assert.IsType<OkObjectResult>(result);
        var answer = okResult.Value?.GetType().GetProperty("answer")?.GetValue(okResult.Value);
        Assert.Equal("Det här är ett testsvar.", answer);
    }

    [Fact]
    public async Task Ask_ReturnsServerError_WhenServiceFails()
    {
        var controller = CreateController(new ThrowingAiService());
        var result = await controller.Ask("Testfråga");
        var errorResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, errorResult.StatusCode);
    }

    private static AiController CreateController(IAiService service) =>
        new(service, NullLogger<AiController>.Instance);

    private sealed class FakeAiService : IAiService
    {
        private readonly string _answer;
        public FakeAiService(string answer) => _answer = answer;
        public Task<string> AskAsync(string question) => Task.FromResult(_answer);
    }

    private sealed class ThrowingAiService : IAiService
    {
        public Task<string> AskAsync(string question) =>
            throw new InvalidOperationException("Testfel");
    }
}
