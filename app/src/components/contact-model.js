export const resumeFor = (author, lang) => lang === 'en' ? '/assets/docs/jay-lin-resume-en.pdf' : author.resume;
export const contactLinks = (author, lang) => [
  {id:'email', href:`mailto:${author.email}`, label:author.email},
  {id:'resume', href:resumeFor(author,lang), label:lang==='en'?'Résumé PDF':'简历 PDF'},
  ...(author.linkedin?.trim() ? [{id:'linkedin', href:author.linkedin.trim(), label:'LinkedIn'}] : []),
];
export function contactState(state, action) {
  if(action==='open') return true;
  if(['close','escape','outside'].includes(action)) return false;
  if(action==='toggle') return !state;
  return state;
}
export function tabDestination(index, count, shift) {
  if(!count) return -1;
  if(index<0) return shift ? count-1 : 0;
  return (index+(shift?-1:1)+count)%count;
}
