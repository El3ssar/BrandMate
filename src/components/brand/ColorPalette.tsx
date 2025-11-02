import React, { useState } from 'react';
import type { BrandColor } from '@/types';

interface ColorPaletteProps {
  colors: BrandColor[];
  onChange: (colors: BrandColor[]) => void;
}

export function ColorPalette({ colors, onChange }: ColorPaletteProps) {
  const [newColor, setNewColor] = useState({ name: 'Principal', hex: '#1E3A8A' });

  const addColor = () => {
    if (!newColor.name || !/^#([0-9A-F]{3}){1,2}$/i.test(newColor.hex)) return;
    if (colors.some(c => c.hex === newColor.hex)) return;
    
    onChange([...colors, { ...newColor }]);
    setNewColor({ name: '', hex: '#000000' });
  };

  const removeColor = (hex: string) => {
    onChange(colors.filter(c => c.hex !== hex));
  };

  return (
    <div className="card">
      <label className="block text-sm font-bold text-gray-900 mb-2">
        🎨 Step 1: Color Palette
      </label>
      <p className="text-sm text-gray-600 mb-3">
        Define your brand's official colors. Add at least 2-3 primary brand colors.
      </p>
      
      {/* Existing colors */}
      <div className="space-y-2 mb-4">
        {colors.map((color) => (
          <div key={color.hex} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className="color-display"
                style={{ background: color.hex }}
              />
              <span className="font-semibold text-sm">{color.name}:</span>
              <span className="font-mono text-sm text-brand-700">{color.hex}</span>
            </div>
            <button
              onClick={() => removeColor(color.hex)}
              className="text-red-600 hover:text-red-800 font-bold text-lg px-2"
              title="Remove color"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add new color */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newColor.name}
          onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
          className="flex-1 input-field text-sm"
          placeholder="Color name"
        />
        <input
          type="color"
          value={newColor.hex}
          onChange={(e) => setNewColor({ ...newColor, hex: e.target.value.toUpperCase() })}
          className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300"
        />
        <input
          type="text"
          value={newColor.hex}
          onChange={(e) => setNewColor({ ...newColor, hex: e.target.value.toUpperCase() })}
          className="w-28 input-field text-sm uppercase font-mono"
          placeholder="#HEX"
        />
        <button
          onClick={addColor}
          className="btn-primary text-sm px-4"
        >
          Add
        </button>
      </div>
    </div>
  );
}

