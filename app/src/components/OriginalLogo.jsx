import {useId} from 'react';

/** Use the supplied silhouette everywhere, including the animated wordmark. */
export default function OriginalLogo({className='v16-original-logo', ...props}) {
 const id=useId().replaceAll(':','');
 return <svg className={className} viewBox="85 90 355 410" aria-hidden="true" {...props}><defs><filter id={`${id}-invert`}><feColorMatrix values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"/></filter><mask id={`${id}-mask`} x="0" y="0" width="532" height="555" maskUnits="userSpaceOnUse" style={{maskType:'luminance'}}><image href="/assets/logo.png" width="532" height="555" filter={`url(#${id}-invert)`}/></mask></defs><rect width="532" height="555" fill="currentColor" mask={`url(#${id}-mask)`}/></svg>;
}
