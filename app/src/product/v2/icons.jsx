/* Thin-stroke icons for the v2 case pages. Decorative: the text next to them carries the meaning. */
const base = {viewBox: '0 0 20 20', width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false'};
export const ArrowRight = props => <svg {...base} {...props}><path d="M4 10h11.5M11 5.5l4.5 4.5-4.5 4.5"/></svg>;
export const ArrowDown = props => <svg {...base} {...props}><path d="M10 4v11.5M5.5 11l4.5 4.5 4.5-4.5"/></svg>;
export const ArrowUpRight = props => <svg {...base} {...props}><path d="M6 14 14 6M7.5 6H14v6.5"/></svg>;
export const Reset = props => <svg {...base} {...props}><path d="M4.5 9.5a5.6 5.6 0 1 1 1.6 4.4M4.5 14.5v-5h5"/></svg>;
export const Info = props => <svg {...base} {...props}><circle cx="10" cy="10" r="7.25"/><path d="M10 9v4.5M10 6.6v.1"/></svg>;
