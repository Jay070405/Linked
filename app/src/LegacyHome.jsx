import LegacyHero from './LegacyHero';
import OneStroke from './onestroke/OneStroke';

// The home before JL-01: the office, and the line through the lake. It is still what a visitor gets who asked for reduced
// motion or whose browser has no WebGL, because it has a complete static form. Loaded only then.
export default function LegacyHome({lang, reduced, covered, onOpen, onNavigate, onTransition}) {
  return <>
    <LegacyHero lang={lang} reduced={reduced} onProduct={() => onOpen('/product')}/>
    <OneStroke lang={lang} reduced={reduced} covered={covered} onOpen={onOpen} onArchive={() => onOpen('/works/archive')} onAbout={() => onNavigate('about')} onNavigate={onNavigate} onTransition={onTransition}/>
  </>;
}
