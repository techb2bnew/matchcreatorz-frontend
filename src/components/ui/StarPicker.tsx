'use client';
import { useState } from 'react';

interface StarPickerProps {
  value: number;
  onChange: (v: number) => void;
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function StarPicker({ value, onChange }: StarPickerProps) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="text-2xl transition-transform hover:scale-110"
        >
          <i className={(hovered || value) >= i ? 'fa fa-star text-yellow-400' : 'fa fa-star-o text-gray-300'} />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500">
        {value > 0 ? LABELS[value] : 'Select rating'}
      </span>
    </div>
  );
}
