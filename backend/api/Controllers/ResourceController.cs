using api.Enums;
using api.Interfaces;
using api.Services;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]s")]
    public class ResourceController : ControllerBase
    {
        private const int BookingStartHour = 7;
        private const int BookingEndHour = 24;

        private readonly IResourceRepository _resourceRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly AvailabilityService _availabilityService;
        private readonly TimeService _timeService;

        public ResourceController(
            IResourceRepository resourceRepository,
            IBookingRepository bookingRepository,
            AvailabilityService availabilityService,
            TimeService timeService)
        {
            _resourceRepository = resourceRepository;
            _bookingRepository = bookingRepository;
            _availabilityService = availabilityService;
            _timeService = timeService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var resources = await _resourceRepository.GetAllAsync();
            return Ok(resources);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var resource = await _resourceRepository.GetResourceAsync(id);
            return resource == null ? NotFound() : Ok(resource);
        }

        [HttpGet("types/{type}")]
        public async Task<IActionResult> GetByType([FromRoute] ResourceType type)
        {
            var resources = await _resourceRepository.GetByTypeAsync(type);
            return Ok(resources);
        }

        [HttpGet("{resourceId:int}/bookings")]
        public async Task<IActionResult> GetBookingsByResourceId([FromRoute] int resourceId)
        {
            var bookings = await _bookingRepository.GetByResourceIdAsync(resourceId);
            return Ok(bookings);
        }

        [HttpGet("{id:int}/availability")]
        public async Task<IActionResult> GetAvailabilityById(
            int id,
            [FromQuery] DateTime startTime,
            [FromQuery] DateTime endTime)
        {
            if (startTime >= endTime)
            {
                return BadRequest("Starttiden måste vara lägre än sluttiden");
            }

            var availability = await _availabilityService.GetResourceAvailabilityAsync(
                id, startTime, endTime);

            return availability == null ? NotFound() : Ok(availability);
        }

        [HttpGet("types/{type}/availability")]
        public async Task<IActionResult> GetAvailabilityByType(
            ResourceType type,
            [FromQuery] DateTime startTime,
            [FromQuery] DateTime endTime)
        {
            if (startTime >= endTime)
            {
                return BadRequest("Starttiden måste vara lägre än sluttiden");
            }

            var availability = await _availabilityService.GetResourceTypeAvailabilityAsync(
                type, startTime, endTime);

            return Ok(availability);
        }

        // One request returns all hourly availability for a local Swedish date.
        // This avoids dozens of simultaneous HTTP requests from the weekly calendar.
        [HttpGet("types/{type}/availability/day")]
        public async Task<IActionResult> GetAvailabilityForDay(
            ResourceType type,
            [FromQuery] DateOnly date,
            [FromQuery] int? resourceId = null)
        {
            var resources = (await _resourceRepository.GetByTypeAsync(type)).ToList();

            if (resourceId.HasValue)
            {
                resources = resources
                    .Where(resource => resource.ResourceId == resourceId.Value)
                    .ToList();

                if (resources.Count == 0)
                {
                    return NotFound("Resursen tillhör inte den valda resurstypen.");
                }
            }

            var resourceIds = resources.Select(resource => resource.ResourceId).ToArray();
            var firstLocalHour = date.ToDateTime(
                new TimeOnly(BookingStartHour, 0), DateTimeKind.Unspecified);
            var endLocalHour = date.AddDays(1).ToDateTime(
                TimeOnly.MinValue, DateTimeKind.Unspecified);
            var firstUtcHour = _timeService.ToUtc(firstLocalHour);
            var endUtcHour = _timeService.ToUtc(endLocalHour);

            // Read all overlapping bookings for the selected date in one database query.
            var overlappingBookings = (await _bookingRepository.GetOverlappingAsync(
                firstUtcHour, endUtcHour, resourceIds)).ToList();

            var result = new List<object>();

            for (var hour = BookingStartHour; hour < BookingEndHour; hour++)
            {
                var localStart = date.ToDateTime(
                    new TimeOnly(hour, 0), DateTimeKind.Unspecified);
                var localEnd = localStart.AddHours(1);

                var startUtc = _timeService.ToUtc(localStart);
                var endUtc = _timeService.ToUtc(localEnd);

                var unavailableResourceIds = overlappingBookings
                    .Where(booking => startUtc < booking.EndTime && endUtc > booking.StartTime)
                    .Select(booking => booking.ResourceId)
                    .ToHashSet();

                var availableResources = resourceIds.Count(id => !unavailableResourceIds.Contains(id));

                result.Add(new
                {
                    startTime = DateTime.SpecifyKind(startUtc, DateTimeKind.Utc),
                    endTime = DateTime.SpecifyKind(endUtc, DateTimeKind.Utc),
                    isAvailable = availableResources > 0,
                    availableResources,
                    totalResources = resources.Count
                });
            }

            return Ok(result);
        }
    }
}