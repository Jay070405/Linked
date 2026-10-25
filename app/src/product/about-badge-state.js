export const initialBadgeState={revealed:false,imageReady:false,projection:null};
export function badgeState(state,action) {
  switch(action.type) {
    case 'reveal': return {...state,revealed:action.value};
    case 'projection': return {...state,projection:action.value,revealed:false};
    case 'image': return {...state,imageReady:action.value};
    case 'reset': return {...state,revealed:false,imageReady:false};
    default: return state;
  }
}
export const badgeEggVisible=state=>state.revealed&&state.imageReady;
