import {useId, useState} from 'react';
import {useCaseLang} from '../../i18n';
import {SIDES} from './content';

/* You / Them (site-spec/WORLD-ARDEN.md, Round 2): the same moment, seen by the wearer and by the person across from
   them. A two-option switch and two panels stacked in one grid cell, so the box keeps its size; the change is a quick
   crossfade with a touch of blur (under 300 ms), and instant with reduced motion. The hidden side is inert. */

export function useSide() { return useState('you'); }

export function SideSwitch({side, onSide, tone = 'light', className = ''}) {
  const {t} = useCaseLang();
  const keys = e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 'you' : e.key === 'End' ? 'them' : side === 'you' ? 'them' : 'you';
    onSide(next);
    e.currentTarget.querySelector(`[data-side="${next}"]`)?.focus();
  };
  return <div className={`ar-sides ar-seg is-${tone} ${className}`} role="radiogroup" aria-label={t(SIDES.label)} onKeyDown={keys}>
    {['you', 'them'].map(s => <button key={s} type="button" role="radio" data-side={s} aria-checked={side === s} tabIndex={side === s ? 0 : -1}
      className="ar-seg-opt" onClick={() => onSide(s)}>{t(SIDES[s])}</button>)}
  </div>;
}

export function SidePanels({side, you, them, className = ''}) {
  const id = useId();
  return <div className={`ar-side-stack ${className}`} id={id}>
    <div className="ar-side" data-on={side === 'you' || undefined} inert={side !== 'you'} aria-hidden={side !== 'you' || undefined}>{you}</div>
    <div className="ar-side" data-on={side === 'them' || undefined} inert={side !== 'them'} aria-hidden={side !== 'them' || undefined}>{them}</div>
  </div>;
}
