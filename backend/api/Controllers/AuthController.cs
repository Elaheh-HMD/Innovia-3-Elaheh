using api.Dtos.UserDtos;
using api.Interfaces;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly TokenService _tokenService;

        public AuthController(
            IUserRepository userRepository,
            TokenService tokenService)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterUserDto registerUserDto)
        {
            if (string.IsNullOrWhiteSpace(registerUserDto.Email) ||
                string.IsNullOrWhiteSpace(registerUserDto.Password))
            {
                return BadRequest("E-post och lösenord måste anges.");
            }

            var email = registerUserDto.Email.Trim();
            var user = new User
            {
                Email = email,
                UserName = email
            };

            var result = await _userRepository.CreateUserWithResultAsync(
                user,
                registerUserDto.Password
            );

            if (!result.Succeeded)
            {
                var errors = result.Errors
                    .Select(error => error.Description)
                    .Distinct()
                    .ToArray();

                return BadRequest(new
                {
                    message = "Användaren kunde inte skapas.",
                    errors
                });
            }

            return Ok(new { message = "Användaren skapades." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);

            if (user == null)
            {
                return Unauthorized("Fel email eller lösenord.");
            }

            var passwordCorrect = await _userRepository.CheckPasswordAsync(
                user,
                loginDto.Password
            );

            if (!passwordCorrect)
            {
                return Unauthorized("Fel email eller lösenord.");
            }

            var token = await _tokenService.CreateToken(user);

            return Ok(new { token });
        }
    }
}
