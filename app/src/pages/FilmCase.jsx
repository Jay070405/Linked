import {lazy,Suspense} from 'react';

// Each product launch film has its own page on how the film was made, each on a different technical thread:
// Variables for agents follows its camera path (nearly one take), Last 100 Feet its timing (the shot-by-shot re-pacing
// that fixed the judder), and Common Ground its six review rounds. Each product's design story is its own case under
// /product. The pieces the pages share live in ./story.
const PAGES={
 'variables-for-agents':lazy(()=>import('./film-pages/VariablesPage')),
 'last-100-feet':lazy(()=>import('./film-pages/LastHundredFeetPage')),
 'common-ground':lazy(()=>import('./film-pages/CommonGroundPage')),
};

export default function FilmCase(props){
 const Page=PAGES[props.slug];
 return <Suspense fallback={null}><Page {...props}/></Suspense>;
}
