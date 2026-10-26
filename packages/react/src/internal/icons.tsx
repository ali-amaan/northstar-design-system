// Small internal glyphs (16px grid, currentColor). Not part of the public API.
const base = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false } as const;

export const ChevronDown = () => <svg {...base}><path d="M4 6l4 4 4-4" /></svg>;
export const ChevronLeft = () => <svg {...base}><path d="M10 4L6 8l4 4" /></svg>;
export const ChevronRight = () => <svg {...base}><path d="M6 4l4 4-4 4" /></svg>;
export const Close = () => <svg {...base}><path d="M4 4l8 8M12 4l-8 8" /></svg>;
export const Search = () => <svg {...base}><circle cx="7" cy="7" r="4.25" /><path d="M10.25 10.25L13 13" /></svg>;
export const Check = () => <svg {...base}><path d="M3.5 8.5l3 3 6-7" /></svg>;
export const Minus = () => <svg {...base}><path d="M4 8h8" /></svg>;
export const Plus = () => <svg {...base}><path d="M8 4v8M4 8h8" /></svg>;
