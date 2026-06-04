function normalizePlace(value) {
  return normalize(String(value || "")).replace(/tp\.?hcm|tphcm|ho chi minh|sai gon/g, "tp.hcm").trim();
}

function getSearchResults(mode, slots) {
  const source = tripCatalog.filter((item) => item.transport_mode === mode);
  const routeMatches = source.filter((item) => (
    normalizePlace(item.origin) === normalizePlace(slots.origin) &&
    normalizePlace(item.destination) === normalizePlace(slots.destination)
  ));
  const scoped = routeMatches;
  return prioritizeResults(scoped, mode === "flight" ? slots.preferred_provider : null);
}

function prioritizeResults(results, preferredProvider) {
  return [...results].sort((a, b) => {
    if (preferredProvider) {
      const aPreferred = a.provider === preferredProvider ? 0 : 1;
      const bPreferred = b.provider === preferredProvider ? 0 : 1;
      if (aPreferred !== bPreferred) return aPreferred - bPreferred;
    }
    return a.total_price_vnd - b.total_price_vnd || a.duration_minutes - b.duration_minutes;
  });
}
