import {createContext, useContext} from 'react';

/** How product pages move: the homepage router's open() in the full site, pushState in the standalone product entry. */
export const NavigateContext = createContext(null);

/** A real link that, on a plain click, navigates inside whichever router is hosting the page. */
export function Go({to, children, ...props}) {
  const navigate = useContext(NavigateContext);
  const onClick = event => {
    props.onClick?.(event);
    if (event.defaultPrevented || !navigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };
  return <a href={to} {...props} onClick={onClick}>{children}</a>;
}
