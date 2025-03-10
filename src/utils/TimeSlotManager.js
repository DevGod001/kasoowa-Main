// src/utils/TimeSlotManager.js

class TimeSlotManager {
  constructor() {
    this.getStoredBookings();
  }

  getStoredBookings() {
    const bookings = localStorage.getItem("kasoowaTimeSlots");
    this.bookings = bookings ? JSON.parse(bookings) : {};
  }

  saveBookings() {
    localStorage.setItem("kasoowaTimeSlots", JSON.stringify(this.bookings));
  }

  generateAvailableSlots(date) {
    const selectedDate = new Date(date);
    const now = new Date();
    const slots = [];
    const startHour = 9; // Start at 9 AM
    const endHour = 21; // End at 9 PM
    const intervalMinutes = 10; // 10-minute intervals

    // If selected date is today, start from the next 10-minute interval
    let currentHour =
      selectedDate.toDateString() === now.toDateString()
        ? now.getHours()
        : startHour;

    let currentMinute =
      selectedDate.toDateString() === now.toDateString()
        ? Math.ceil(now.getMinutes() / intervalMinutes) * intervalMinutes
        : 0;

    // If we're past today's start time, adjust to start from next interval
    if (
      selectedDate.toDateString() === now.toDateString() &&
      currentHour < startHour
    ) {
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
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
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

  // In TimeSlotManager.js
  releasePickupSlotForCompletedOrder(order) {
    if (!order) return false;

    // Only proceed if this is a pickup order with a scheduled time
    if (order.pickupScheduled && order.pickupTime) {
      try {
        const timeSlot = new Date(order.pickupTime);
        const slotKey = timeSlot.toISOString();

        // Force release the slot by directly removing it from bookings
        if (this.bookings[slotKey]) {
          delete this.bookings[slotKey];
          this.saveBookings();
          console.log(
            `Successfully released time slot for completed order ${order.id}`
          );
          return true;
        } else {
          // Check if there's another form of the same time in the bookings
          const timeKeys = Object.keys(this.bookings);
          const matchingKey = timeKeys.find((key) => {
            const keyTime = new Date(key);
            return keyTime.getTime() === timeSlot.getTime();
          });

          if (matchingKey) {
            delete this.bookings[matchingKey];
            this.saveBookings();
            console.log(
              `Found and released time slot with different format for order ${order.id}`
            );
            return true;
          }

          console.log(
            `Time slot for order ${order.id} was not found in bookings`
          );
          return false;
        }
      } catch (error) {
        console.error(
          "Error releasing pickup slot for completed order:",
          error
        );
        return false;
      }
    }

    return false;
  }
}

export default TimeSlotManager;
