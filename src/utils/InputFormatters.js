// src/utils/InputFormatters.js

// Format phone number input (only allow numbers and limit to 11 digits)
export const formatPhoneNumber = (value) => {
  // Remove non-digits
  const cleaned = value.replace(/\D/g, '');
  
  // Limit to 11 digits (standard for Nigerian numbers)
  if (cleaned.length > 11) {
    return cleaned.slice(0, 11);
  }
  
  return cleaned;
};

// Format account number input (only allow numbers and limit to 10 digits)
export const formatAccountNumber = (value) => {
  // Remove non-digits
  const cleaned = value.replace(/\D/g, '');
  
  // Limit to 10 digits (standard for Nigerian accounts)
  if (cleaned.length > 10) {
    return cleaned.slice(0, 10);
  }
  
  return cleaned;
};

// Format person name input (only allow letters, spaces, hyphens and apostrophes)
export const formatPersonName = (value) => {
  return value.replace(/[^a-zA-Z\s\-']/g, '');
};