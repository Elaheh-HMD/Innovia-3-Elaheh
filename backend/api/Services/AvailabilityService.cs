using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Dtos.ResourceDtos;
using api.Interfaces;
using api.Enums;

namespace api.Services
{
    public class AvailabilityService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IResourceRepository _resourceRepository;

        public AvailabilityService(IBookingRepository bookingRepository, IResourceRepository resourceRepository)
        {
            _bookingRepository = bookingRepository;
            _resourceRepository = resourceRepository;
        }

        public async Task<ResourceAvailabilityDto?> GetResourceAvailabilityAsync(int resourceId, DateTime startTime, DateTime endTime)
        {
            var resource = await _resourceRepository.GetResourceAsync(resourceId);

            if (resource == null)
            {
                return null;
            }

            var isAvailable = await _bookingRepository.IsResourceAvailableAsync(startTime, endTime, resourceId);

            return new ResourceAvailabilityDto
            {
                ResourceId = resourceId,
                IsAvailable = isAvailable
            };
        }

        public async Task<ResourceTypeAvailabilityDto> GetResourceTypeAvailabilityAsync(ResourceType type, DateTime startTime, DateTime endTime)
        {
            var resources = (await _resourceRepository.GetByTypeAsync(type)).ToList();
            var resourceIds = resources.Select(resource => resource.ResourceId).ToArray();

            // Fetch all overlapping bookings in one database query instead of
            // issuing one AnyAsync query for every resource.
            var overlappingBookings = await _bookingRepository.GetOverlappingAsync(
                startTime, endTime, resourceIds);

            var unavailableResourceIds = overlappingBookings
                .Select(booking => booking.ResourceId)
                .Distinct()
                .ToHashSet();

            return new ResourceTypeAvailabilityDto
            {
                ResourceType = type,
                TotalResources = resources.Count,
                AvailableResources = resources.Count(resource =>
                    !unavailableResourceIds.Contains(resource.ResourceId))
            };
        }
    }
}