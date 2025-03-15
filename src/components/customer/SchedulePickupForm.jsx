// src/components/customer/SchedulePickupForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { format, eachDayOfInterval, addDays, startOfToday } from 'date-fns';
import TimeSlotManager from '../../utils/TimeSlotManager';

const SchedulePickupForm = ({ orderId, onScheduleComplete }) => {
  const [timeManager] = useState(() => new TimeSlotManager());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [error, setError] = useState(null);
  const [existingSchedule, setExistingSchedule] = useState(null);
  const submitButtonRef = useRef(null);

  // Generate available dates (today and next 6 days = full week)
  const today = startOfToday();
  const availableDates = eachDayOfInterval({
    start: today,
    end: addDays(today, 6)
  });

  useEffect(() => {
    // Check if order already has a schedule
    const orders = JSON.parse(localStorage.getItem('kasoowaOrders') || '[]');
    const currentOrder = orders.find(order => order.id === orderId);
    if (currentOrder?.pickupScheduled) {
      setExistingSchedule({
        date: new Date(currentOrder.pickupDate),
        time: new Date(currentOrder.pickupTime)
      });
      return;
    }

    if (selectedDate) {
      const slots = timeManager.generateAvailableSlots(selectedDate);
      setAvailableSlots(slots);
    }
  }, [selectedDate, timeManager, orderId]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    // Scroll to button smoothly when time is selected
    if (submitButtonRef.current) {
      submitButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (!selectedDate || !selectedSlot) {
        setError('Please select both date and time');
        return;
      }

      const success = timeManager.bookSlot(selectedSlot.time, orderId);
      
      if (success) {
        await onScheduleComplete({
          orderId,
          pickupDate: format(selectedDate, 'yyyy-MM-dd'),
          pickupTime: selectedSlot.time.toISOString()
        });

        window.dispatchEvent(new Event('storage'));
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      setError(error.message || 'Failed to schedule pickup');
    }
  };

  if (existingSchedule) {
    return (
      <div className="p-4 bg-yellow-50 rounded-md">
        <p className="text-yellow-800">
          This order already has a scheduled pickup for{' '}
          {format(existingSchedule.time, 'PPpp')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSchedule} className="space-y-6">
      {/* Date Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Date</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {availableDates.map((date) => (
            <button
              type="button"
              key={date.toISOString()}
              onClick={() => handleDateSelect(date)}
              className={`py-3 px-2 rounded-lg border text-center transition-colors
                ${selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  ? 'bg-green-500 text-white border-green-500'
                  : 'hover:border-green-500'}`}
            >
              <div className="text-sm">{format(date, 'EEE')}</div>
              <div className="font-semibold">{format(date, 'd')}</div>
              {format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') && (
                <div className="text-xs mt-1 text-green-600">Today</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select Time</h3>
          <p className="text-sm text-gray-500 mb-4">
            Available pickup times: 9:00 AM - 9:00 PM
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {availableSlots.map((slot) => (
              <button
                type="button"
                key={slot.time.toISOString()}
                onClick={() => handleSlotSelect(slot)}
                disabled={!slot.available}
                className={`py-3 px-2 rounded-lg border text-center transition-colors text-sm
                  ${!slot.available
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : selectedSlot?.time.toISOString() === slot.time.toISOString()
                      ? 'bg-green-500 text-white border-green-500'
                      : 'hover:border-green-500'}`}
              >
                {format(slot.time, 'h:mm a')}
              </button>
            ))}
          </div>
          {availableSlots.length === 0 && (
            <p className="text-sm text-yellow-600 mt-2">
              No more available slots for this date. Please select another date.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Floating button when date and time are selected */}
      <div 
        ref={submitButtonRef}
        className={`transition-all duration-300 ease-in-out ${
          selectedDate && selectedSlot ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          type="submit"
          disabled={!selectedDate || !selectedSlot}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:bg-green-700 transition-colors"
        >
          Confirm Pickup Time
        </button>

        <p className="text-sm text-gray-500 text-center mt-2">
          Please arrive on time for your scheduled pickup
        </p>
      </div>
    </form>
  );
};

export default SchedulePickupForm;