function getStaticIds(CATALOG_DEFS, FILTER_ENABLED) {
  return Object.keys(CATALOG_DEFS).filter(id => {
    if (!FILTER_ENABLED) return true;
    return !["crunchyroll","hidive","anime","bollywood"].some(x => id.includes(x));
  });
}

function buildManifestCatalogs(ids, CATALOG_DEFS) {
  return ids.map(id => {
    const def = CATALOG_DEFS[id];
    if (!def) return null;

    return {
      type: def.type,
      id,
      name: def.name,
      extra: [{ name:"skip", isRequired:false }]
    };
  }).filter(Boolean);
}

function buildCatalogsFromIds(
  selectedIds,
  hiddenIds = [],
  QUICK_PICK_CATALOGS,
  CATALOG_DEFS
) {
  const hiddenSet = new Set(hiddenIds || []);
  const quickMap = new Map(
    QUICK_PICK_CATALOGS.map(c => [c.id, c])
  );

  return selectedIds.map(id => {
    const quick = quickMap.get(id);

    if (quick) {
      return {
        type: quick.type,
        id: quick.id,
        name: quick.name,
        extra: [{ name:"skip", isRequired:false }]
      };
    }

    const def = CATALOG_DEFS[id];
    if (!def) return null;

    return {
      type: def.type,
      id,
      name: def.name,
      showInHome: !hiddenSet.has(id),
      extra: [{ name:"skip", isRequired:false }]
    };
  }).filter(Boolean);
}

module.exports = {
  getStaticIds,
  buildManifestCatalogs,
  buildCatalogsFromIds
};
