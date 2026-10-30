using api.Models;
using Microsoft.AspNetCore.Identity;

namespace api.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<bool> CheckPasswordAsync(User user, string password);
        Task<bool> CreateUserAsync(User user, string password);
        Task<IdentityResult> CreateUserWithResultAsync(User user, string password);
        Task<List<User>> GetAllAsync();
        Task<IList<string>> GetRolesAsync(User user);
    }
}
