import { useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react';
import GlassSurface from './GlassSurface';
import './portfolio-surface.css';

export function PortfolioGlass({ children, className = '', radius = 24 }) {
  return <GlassSurface width="100%" height="auto" borderRadius={radius} borderWidth={.08} brightness={70} opacity={.9} blur={9} displace={.4} backgroundOpacity={.15} saturation={1} distortionScale={-32} redOffset={0} greenOffset={0} blueOffset={0} className={`portfolio-glass ${className}`}>{children}</GlassSurface>;
}

// Motion values keep pointer movement outside React's render loop.
export function PortfolioTilt({ children, className = '', reduced = false }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const lightX = useMotionValue(50), lightY = useMotionValue(30);
  const rotateX = useSpring(x, { stiffness: 180, damping: 26 });
  const rotateY = useSpring(y, { stiffness: 180, damping: 26 });
  const light = useMotionTemplate`radial-gradient(ellipse at ${lightX}% ${lightY}%, #ffffff35, transparent 65%)`;
  useEffect(() => { if (reduced) { x.set(0); y.set(0); } }, [reduced, x, y]);
  return <motion.div className={`portfolio-tilt ${className}`} style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 1000 }} onPointerMove={event => {
    if (reduced || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width, py = (event.clientY - rect.top) / rect.height;
    x.set((.5 - py) * 4); y.set((px - .5) * 5);
    lightX.set(px * 100); lightY.set(py * 100);
  }} onPointerLeave={() => { x.set(0); y.set(0); }}>
    {children}<motion.span className="portfolio-tilt-light" aria-hidden="true" style={{ background: light }} />
  </motion.div>;
}
