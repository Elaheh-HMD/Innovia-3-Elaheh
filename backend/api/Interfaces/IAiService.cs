namespace api.Interfaces;

public interface IAiService
{
    Task<string> AskAsync(string question);
}