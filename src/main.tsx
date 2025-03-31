import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Define Google Calendar colors as CSS variables
const googleCalendarColors = {
  1: '#7986CB', // Lavender
  2: '#33B679', // Sage
  3: '#8E24AA', // Grape
  4: '#E67C73', // Flamingo
  5: '#F6BF26', // Banana
  6: '#F4511E', // Tangerine
  7: '#039BE5', // Peacock
  8: '#616161', // Graphite
  9: '#3F51B5', // Blueberry
  10: '#0B8043', // Basil
  11: '#D50000', // Tomato
};

// Create a style element to inject calendar colors
const styleEl = document.createElement('style');
let colorVars = ':root {\n';

Object.entries(googleCalendarColors).forEach(([id, color]) => {
  colorVars += `  --color-${id}: ${color};\n`;
});

colorVars += '}';
styleEl.textContent = colorVars;
document.head.appendChild(styleEl);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);