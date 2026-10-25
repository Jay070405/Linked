import test from 'node:test';
import assert from 'node:assert/strict';
import {badgeState,initialBadgeState,badgeEggVisible} from './about-badge-state.js';

test('cat reveals while pulled or statically lifted and hides when the badge returns',()=>{
  for(const input of ['lanyard onReveal','StaticBadge toggle']) {
    let state=badgeState(initialBadgeState,{type:'image',value:true});
    assert.equal(badgeEggVisible(state),false,input);
    state=badgeState(state,{type:'reveal',value:true});assert.equal(badgeEggVisible(state),true,input);
    state=badgeState(state,{type:'reveal',value:false});assert.equal(badgeEggVisible(state),false,input);
    state=badgeState(state,{type:'reveal',value:true});
    state=badgeState(state,{type:'projection',value:{x:100,y:150,width:90,height:120}});
    assert.equal(badgeEggVisible(state),false,'resize/reset hides the cat behind the resting badge');
  }
  const pulled=badgeState(initialBadgeState,{type:'reveal',value:true});
  assert.equal(badgeEggVisible(pulled),false,'wait for image load');
  assert.equal(badgeEggVisible(badgeState(pulled,{type:'image',value:true})),true);
  assert.equal(badgeEggVisible(badgeState(pulled,{type:'image',value:false})),false);
});
