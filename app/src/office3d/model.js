let request;
export function preloadOffice() {
  if (!request) request = fetch('/assets/office3d/studio.glb').then(response => {
    if (!response.ok) throw new Error(`Office model: ${response.status}`);
    return response.arrayBuffer();
  }).catch(error => { request = undefined; throw error; });
  return request;
}
