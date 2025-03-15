// src/components/ui/ColorPicker.jsx
import React from 'react';

export const ColorPicker = ({ color, onChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 rounded cursor-pointer"
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-md px-2 py-1 w-32 text-sm"
        placeholder="#000000"
      />
    </div>
  );
};