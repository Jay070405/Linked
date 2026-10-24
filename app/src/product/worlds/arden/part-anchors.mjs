// Render JSON retains rx_insert so previously generated assets remain usable.
export function partAnchorGroup(part, frame = {}) {
  return frame[part.id] ?? (part.id === 'rx_lens' ? frame.rx_insert : undefined)
    ?? Object.values(frame).find(a => a?.n === part.n);
}

// Keep each sub-anchor's own visibility; a visible group does not expose its hidden members.
export function partAnchors(parts, frame = {}) {
  return parts.flatMap(part => {
    const group = partAnchorGroup(part, frame);
    if (!group) return [];
    const anchors = Array.isArray(group.anchors) && group.anchors.length ? group.anchors : [group];
    const valid = anchors.filter(a => Number.isFinite(a.x_pct) && Number.isFinite(a.y_pct));
    const firstVisible = valid.findIndex(a => a.visible !== false);
    return valid.map((a, i) => ({
      part, key: `${part.id}:${a.id ?? i}`, sub: i > 0, anchorId: a.id,
      x: a.x_pct, y: a.y_pct, on: a.visible !== false, focusable: i === firstVisible,
    }));
  });
}

export function remapPartAnchors(parts, {sourceW, sourceH, crop}) {
  for (const frame of parts.frames ?? []) for (const group of Object.values(frame.parts ?? {})) {
    for (const a of [group, ...(group.anchors ?? [])]) {
      if (!Number.isFinite(a.x_pct) || !Number.isFinite(a.y_pct)) continue;
      a.x_pct = (a.x_pct * sourceW / 100 - crop.left) / crop.width * 100;
      a.y_pct = (a.y_pct * sourceH / 100 - crop.top) / crop.height * 100;
    }
  }
  return parts;
}
