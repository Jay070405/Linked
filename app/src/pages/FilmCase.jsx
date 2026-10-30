import {lazy,Suspense} from 'react';

// Each product launch film has its own page, built around its product rather than one template:
// Variables for agents is a design file (frames, a layers panel, the agent's invented names), Last 100 Feet is the
// route itself (the page walks 290 ft from the curb to door 214), and Common Ground shows its arithmetic (bars that
// stretch into a year, the $600 proof, a receipt). The pieces they share live in ./story.
const PAGES={
 'variables-for-agents':lazy(()=>import('./film-pages/VariablesPage')),
 'last-100-feet':lazy(()=>import('./film-pages/LastHundredFeetPage')),
 'common-ground':lazy(()=>import('./film-pages/CommonGroundPage')),
};

export default function FilmCase(props){
 const Page=PAGES[props.slug];
 return <Suspense fallback={null}><Page {...props}/></Suspense>;
}
