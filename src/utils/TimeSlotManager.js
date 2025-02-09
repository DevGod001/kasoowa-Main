// src/utils/TimeSlotManager.js
class TimeSlotManager {
    constructor() {
      this.getStoredBookings();
    }
  
    getStoredBookings() {
      const bookings = localStorage.getItem('kasoowaTimeSlots');
      this.bookings = bookings ? JSON.parse(bookings) : {};
    }
  
    saveBookings() {
      localStorage.setItem('kasoowaTimeSlots', JSON.stringify(this.bookings));
    }
  
    generateAvailableSlots(date) {
      const selectedDate = new Date(date);
      const now = new Date();
      const slots = [];
      const startHour = 9; // Start at 9 AM
      const endHour = 21; // End at 9 PM
      const intervalMinutes = 10; // 10-minute intervals
  
      // If selected date is today, start from the next 10-minute interval
      let currentHour = selectedDate.toDateString() === now.toDateString()
        ? now.getHours()
        : startHour;
  
      let currentMinute = selectedDate.toDateString() === now.toDateString()
        ? Math.ceil(now.getMinutes() / intervalMinutes) * intervalMinutes
        : 0;
  
      // If we're past today's start time, adjust to start from next interval
      if (selectedDate.toDateString() === now.toDateString() && currentHour < startHour) {
        currentHour = startHour;
        currentMinute = 0;
      }
  
      // Generate slots in 10-minute intervals
      for (let hour = currentHour; hour < endHour; hour++) {
        const startMinute = hour === currentHour ? currentMinute : 0;
        
        for (let minute = startMinute; minute < 60; minute += intervalMinutes) {
          const slotTime = new Date(selectedDate);
          slotTime.setHours(hour, minute, 0, 0);
  
          // Skip if slot is in the past
          if (slotTime <= now) continue;
  
          // Skip if we're past the end hour
          if (hour === endHour - 1 && minute > 0) continue;
  
          const slotKey = slotTime.toISOString();
          const isAvailable = !this.bookings[slotKey];
  
          slots.push({
            time: slotTime,
            available: isAvailable,
            formattedTime: slotTime.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          });
        }
      }
  
      return slots;
    }
  
    bookSlot(time, orderId) {
      const slotKey = new Date(time).toISOString();
      if (this.bookings[slotKey]) {
        return false;
      }
      this.bookings[slotKey] = orderId;
      this.saveBookings();
      return true;
    }
  
    releaseSlot(time, orderId) {
      const slotKey = new Date(time).toISOString();
      if (this.bookings[slotKey] === orderId) {
        delete this.bookings[slotKey];
        this.saveBookings();
        return true;
      }
      return false;
    }
  }
  
  export default TimeSlotManager;