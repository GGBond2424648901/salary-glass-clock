const paths={
float:'<rect x="3" y="4" width="18" height="16" rx="3"/><rect x="11" y="11" width="8" height="6.5" rx="1.5"/><path d="M6 8h5"/>',
pin:'<path d="m9 3 8 0-1 7 3 3v1h-6l-1 7-1-7H5v-1l3-3 1-7Z"/>',
expand:'<path d="M14 3h7v7M21 3l-8 8M10 21H3v-7M3 21l8-8"/>',
compact:'<path d="M4 8h6V2M10 8 3 1M20 16h-6v6M14 16l7 7"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6h5"/>',
calendar:'<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M7.5 2.5v5M16.5 2.5v5M3.5 10h17"/>',
settings:'<path d="m9.5 3 .6-1h3.8l.6 2.3 1.8 1 2.3-.6 1.9 3.3-1.7 1.7v2.1l1.7 1.7-1.9 3.3-2.3-.6-1.8 1-.6 2.3h-3.8l-.6-2.3-1.8-1-2.3.6-1.9-3.3 1.7-1.7V9.7L3.5 8l1.9-3.3 2.3.6 1.8-1 .6-2.3" transform="translate(0 1)"/><circle cx="12" cy="12" r="3.3"/>',
close:'<path d="m6 6 12 12M18 6 6 18"/>',
left:'<path d="m14.5 5-7 7 7 7"/>',
right:'<path d="m9.5 5 7 7-7 7"/>'
};
export const icon=name=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.clock}</svg>`;
