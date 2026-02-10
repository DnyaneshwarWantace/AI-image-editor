export interface ColorPalette {
  id: string;
  name: string;
  category: 'dark' | 'light' | 'vibrant' | 'pastel' | 'muted';
  background: string;
  text: string;
  accent: string;
  secondary?: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
  // Dark Palettes
  { id: 'dark-1', name: 'Dark Navy', category: 'dark', background: '#1a1d2e', text: '#ffffff', accent: '#e5e7eb' },
  { id: 'dark-2', name: 'Dark Blue', category: 'dark', background: '#1e293b', text: '#ffffff', accent: '#60a5fa' },
  { id: 'dark-3', name: 'Dark Purple', category: 'dark', background: '#1e1b4b', text: '#ffffff', accent: '#a78bfa' },
  { id: 'dark-4', name: 'Dark Brown', category: 'dark', background: '#292524', text: '#ffffff', accent: '#fbbf24' },
  { id: 'dark-5', name: 'Dark Charcoal', category: 'dark', background: '#1f2937', text: '#ffffff', accent: '#10b981' },
  { id: 'dark-6', name: 'Dark Teal', category: 'dark', background: '#134e4a', text: '#ffffff', accent: '#5eead4' },
  { id: 'dark-7', name: 'Dark Slate', category: 'dark', background: '#0f172a', text: '#ffffff', accent: '#f472b6' },
  { id: 'dark-8', name: 'Dark Green', category: 'dark', background: '#14532d', text: '#ffffff', accent: '#86efac' },

  // Light Palettes
  { id: 'light-1', name: 'Light Gray', category: 'light', background: '#f3f4f6', text: '#1f2937', accent: '#1e40af' },
  { id: 'light-2', name: 'Light Blue', category: 'light', background: '#eff6ff', text: '#1e3a8a', accent: '#3b82f6' },
  { id: 'light-3', name: 'Light Purple', category: 'light', background: '#faf5ff', text: '#581c87', accent: '#a855f7' },
  { id: 'light-4', name: 'Light Orange', category: 'light', background: '#fff7ed', text: '#7c2d12', accent: '#f97316' },
  { id: 'light-5', name: 'Light Green', category: 'light', background: '#f0fdf4', text: '#14532d', accent: '#22c55e' },
  { id: 'light-6', name: 'Light Pink', category: 'light', background: '#fdf2f8', text: '#831843', accent: '#ec4899' },
  { id: 'light-7', name: 'Light Cyan', category: 'light', background: '#ecfeff', text: '#164e63', accent: '#06b6d4' },
  { id: 'light-8', name: 'Light Lime', category: 'light', background: '#f7fee7', text: '#365314', accent: '#84cc16' },

  // Vibrant Palettes
  { id: 'vibrant-1', name: 'Vibrant Purple', category: 'vibrant', background: '#6366f1', text: '#ffffff', accent: '#fbbf24' },
  { id: 'vibrant-2', name: 'Vibrant Blue', category: 'vibrant', background: '#0ea5e9', text: '#ffffff', accent: '#1f2937' },
  { id: 'vibrant-3', name: 'Vibrant Green', category: 'vibrant', background: '#10b981', text: '#ffffff', accent: '#1e293b' },
  { id: 'vibrant-4', name: 'Vibrant Orange', category: 'vibrant', background: '#f97316', text: '#ffffff', accent: '#0ea5e9' },
  { id: 'vibrant-5', name: 'Vibrant Pink', category: 'vibrant', background: '#ec4899', text: '#ffffff', accent: '#1f2937' },
  { id: 'vibrant-6', name: 'Vibrant Red', category: 'vibrant', background: '#ef4444', text: '#ffffff', accent: '#1e3a8a' },
  { id: 'vibrant-7', name: 'Vibrant Cyan', category: 'vibrant', background: '#06b6d4', text: '#ffffff', accent: '#84cc16' },
  { id: 'vibrant-8', name: 'Vibrant Lime', category: 'vibrant', background: '#84cc16', text: '#1f2937', accent: '#000000' },

  // Pastel Palettes
  { id: 'pastel-1', name: 'Pastel Blue', category: 'pastel', background: '#dbeafe', text: '#1e3a8a', accent: '#fda4af' },
  { id: 'pastel-2', name: 'Pastel Purple', category: 'pastel', background: '#e9d5ff', text: '#581c87', accent: '#fcd34d' },
  { id: 'pastel-3', name: 'Pastel Pink', category: 'pastel', background: '#fce7f3', text: '#831843', accent: '#a78bfa' },
  { id: 'pastel-4', name: 'Pastel Green', category: 'pastel', background: '#d1fae5', text: '#14532d', accent: '#fbbf24' },
  { id: 'pastel-5', name: 'Pastel Yellow', category: 'pastel', background: '#fef3c7', text: '#713f12', accent: '#9333ea' },
  { id: 'pastel-6', name: 'Pastel Cyan', category: 'pastel', background: '#cffafe', text: '#164e63', accent: '#ec4899' },
  { id: 'pastel-7', name: 'Pastel Lavender', category: 'pastel', background: '#f3e8ff', text: '#4c1d95', accent: '#10b981' },
  { id: 'pastel-8', name: 'Pastel Mint', category: 'pastel', background: '#d1fae5', text: '#065f46', accent: '#6366f1' },

  // Muted Palettes
  { id: 'muted-1', name: 'Muted Slate', category: 'muted', background: '#475569', text: '#f1f5f9', accent: '#cbd5e1' },
  { id: 'muted-2', name: 'Muted Blue', category: 'muted', background: '#475569', text: '#e0f2fe', accent: '#bfdbfe' },
  { id: 'muted-3', name: 'Muted Purple', category: 'muted', background: '#475569', text: '#f3e8ff', accent: '#ddd6fe' },
  { id: 'muted-4', name: 'Muted Green', category: 'muted', background: '#475569', text: '#ecfccb', accent: '#d9f99d' },
  { id: 'muted-5', name: 'Muted Orange', category: 'muted', background: '#475569', text: '#fed7aa', accent: '#fdba74' },
  { id: 'muted-6', name: 'Muted Pink', category: 'muted', background: '#475569', text: '#fce7f3', accent: '#fbcfe8' },
  { id: 'muted-7', name: 'Muted Teal', category: 'muted', background: '#475569', text: '#ccfbf1', accent: '#99f6e4' },
  { id: 'muted-8', name: 'Muted Brown', category: 'muted', background: '#475569', text: '#fed7aa', accent: '#a3a3a3' },
];

export const PALETTE_CATEGORIES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'vibrant', label: 'Vibrant' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'muted', label: 'Muted' },
] as const;

export function getPalettesByCategory(category: string): ColorPalette[] {
  return COLOR_PALETTES.filter(p => p.category === category);
}

export function getPaletteById(id: string): ColorPalette | undefined {
  return COLOR_PALETTES.find(p => p.id === id);
}
