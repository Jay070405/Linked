export const PASS = { current: 9000, target: 12000, rateLow: 200, rateHigh: 300, daysLeft: 18.5 };

export function estimateTarget({current=PASS.current, target=PASS.target, rateLow=PASS.rateLow, rateHigh=PASS.rateHigh, history=true, paid=true, paidReward=true}={}) {
  if (![current,target].every(Number.isFinite)) throw new TypeError('Experience must be finite');
  const remaining=Math.max(0,target-current), needsPass=paidReward&&!paid;
  if (!remaining) return {remaining, status:'reached',hours:null,needsPass};
  if (!history || !Number.isFinite(rateLow) || !Number.isFinite(rateHigh) || rateLow<=0 || rateHigh<rateLow) return {remaining,status:'insufficient',hours:null,needsPass};
  return {remaining,status:'estimate',hours:[remaining/rateHigh,remaining/rateLow],needsPass};
}

export function matchBand(blue,red) {
  if (![blue,red].every(Number.isFinite)) return {kind:'unavailable',delta:null,higher:null};
  const delta=Math.abs(blue-red);
  return {kind:delta<25?'close':delta<75?'slight':'wide',delta,higher:blue===red?null:blue>red?'blue':'red'};
}
export const MATCH_SCENARIOS = {
  close:{blue:1570,red:1575}, slight:{blue:1570,red:1615}, wide:{blue:1570,red:1660}, unavailable:{blue:null,red:null}
};

// Curated demonstration fixtures, not recorded player matches. Both teams consume the same series pool.
export const SERIES = [
  {blue:['Aatrox','Amumu','Ahri','Ashe','Braum'],red:['Fiora','LeeSin','Orianna','Jinx','Thresh'],winner:'blue'},
  {blue:['Darius','Diana','Azir','Kaisa','Rakan'],red:['Camille','JarvanIV','Syndra','Ezreal','Leona'],winner:'red'},
  {blue:['Gnar','Sejuani','Viktor','Xayah','Nautilus'],red:['Jax','Vi','Akali','Caitlyn','Lulu'],winner:'blue'}
];
export function seriesFor(result='2-1') {
  return result==='2-0' ? SERIES.slice(0,2).map(round=>({...round,winner:'blue'})) : SERIES;
}
export function seriesState(round=1,result='2-1') {
  const rounds=seriesFor(result), index=Math.min(rounds.length-1,Math.max(0,Math.trunc(round)-1));
  const used=rounds.slice(0,index).flatMap(game=>[...game.blue,...game.red]);
  return {round:index+1,used,current:rounds[index],available:170-10-used.length,rounds,championLineup:rounds.flatMap(game=>game.blue)};
}
export const CHAMPIONS = {
  Aatrox:['亚托克斯','Aatrox'],Amumu:['阿木木','Amumu'],Ahri:['阿狸','Ahri'],Ashe:['艾希','Ashe'],Braum:['布隆','Braum'],Fiora:['菲奥娜','Fiora'],LeeSin:['李青','Lee Sin'],Orianna:['奥莉安娜','Orianna'],Jinx:['金克丝','Jinx'],Thresh:['锤石','Thresh'],Darius:['德莱厄斯','Darius'],Diana:['黛安娜','Diana'],Azir:['阿兹尔','Azir'],Kaisa:['卡莎',"Kai’Sa"],Rakan:['洛','Rakan'],Camille:['卡蜜尔','Camille'],JarvanIV:['嘉文四世','Jarvan IV'],Syndra:['辛德拉','Syndra'],Ezreal:['伊泽瑞尔','Ezreal'],Leona:['蕾欧娜','Leona'],Gnar:['纳尔','Gnar'],Sejuani:['瑟庄妮','Sejuani'],Viktor:['维克托','Viktor'],Xayah:['霞','Xayah'],Nautilus:['诺提勒斯','Nautilus'],Jax:['贾克斯','Jax'],Vi:['蔚','Vi'],Akali:['阿卡丽','Akali'],Caitlyn:['凯特琳','Caitlyn'],Lulu:['璐璐','Lulu']
};
