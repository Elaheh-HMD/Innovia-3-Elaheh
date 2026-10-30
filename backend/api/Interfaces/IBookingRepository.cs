using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models;
using Microsoft.AspNetCore.Mvc;

namespace api.Interfaces
{
    public interface IBookingRepository
    {
        Task<IEnumerable<Booking>> GetAllAsync();
        Task<Booking?> GetByIdAsync(int id);
        Task<IEnumerable<Booking>> GetByUserIdAsync(string id);
        Task<IEnumerable<Booking>> GetByResourceIdAsync(int resourceId);
        Task<bool> IsResourceAvailableAsync(DateTime startTime, DateTime endTime, int resourceId);
        Task<IEnumerable<Booking>> GetOverlappingAsync(DateTime startTime, DateTime endTime, IReadOnlyCollection<int> resourceIds);
        Task<Booking?> CreateBookingAsync(Booking booking);
        Task<Booking?> DeleteBookingByIdAsync(int id); 
    }
}
