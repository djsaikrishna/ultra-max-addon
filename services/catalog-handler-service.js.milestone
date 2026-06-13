const { CATALOG_DEFS } = require("../catalogs/catalog-defs");

async function handleCatalog(
  catalogId,
  type,
  extra,
  mdbKey,
  filterLang,
  language,
  rpdbKey,
  tpKey,
  traktUser,
  excludeUnreleased,
  maxRating,
  customCatalogs,
  googleAiKey,
  fanartKey,
  omdbKey,
  deps
) {

  const {
    TMDB_KEY,
    TRAKT_CLIENT_ID,
    handleSearch,
    handleQuickPicks,
    handleRelatedContent,
    handleTraktCatalog,
    handleCatalogSearch,
    buildTmdbCatalogUrl,
    geminiAiRecommendations,
    tmdbResolveAiItems,
    fetchCached,
    filterByMaxRating,
    resultsToMetas,
    mdblistToMetas
  } = deps;

console.log(
  "HANDLECATALOG:",
  catalogId,
  "extra=",
  JSON.stringify(extra),
   "maxRating=",
  maxRating
);
if (extra && extra.search) {

const searchableCatalogs = new Set([
  "search_movies",
  "search_series",
  "popular_movies",
  "popular_series"
]);
  if (!searchableCatalogs.has(catalogId)) {
    return { metas: [] };
  }
}
  if (false && extra && extra.search && catalogId !== "search_movie" && catalogId !== "search_movies" && catalogId !== "search_series") {
    return { metas: [] };
  }
if (extra && extra.search) {
  return await handleSearch({
    catalogId,
    type,
    extra,
    mdbKey,
    filterLang,
    language,
    rpdbKey,
    tpKey,
    traktUser,
    excludeUnreleased,
    maxRating,
    customCatalogs,
    googleAiKey,
    fanartKey,
    omdbKey,
    TMDB_KEY,
    resultsToMetas,
    handleCatalog
  });
}

  const skip = extra?.skip || 0;
  const page = Math.floor(skip / 20) + 1;
  const tmdbType = type ==="series" ?"tv" :"movie";
  const tmdbId = extra?.tmdbId;
  // 🔥 QUICK PICKS ENGINE
  if (catalogId === "ai_recommended_movies" || catalogId === "ai_recommended_series") {

  const items = await geminiAiRecommendations({ type, googleAiKey, traktUser, language });
  const metas = await tmdbResolveAiItems(items, type, language, rpdbKey, tpKey, excludeUnreleased, fanartKey, omdbKey);

    return { metas };
  }
  if (catalogId.startsWith("quick_")) {
    return await handleQuickPicks({
    catalogId,
    type,
    page,
    maxRating,
    filterLang,
    language,
    rpdbKey,
    tpKey,
    excludeUnreleased,
    fanartKey,
    omdbKey,
    TMDB_KEY,
    fetchCached,
    filterByMaxRating,
    resultsToMetas
  });
}

  const RATING_ORDER = ["G","PG","PG-13","R","NC-17"];
  const allowedRatings = maxRating ? RATING_ORDER.slice(0, RATING_ORDER.indexOf(maxRating) + 1) : [];
  const ratingParam = allowedRatings.length ? `&certification_country=US&certification=${allowedRatings.map(encodeURIComponent).join("%7C")}` : "";
  const sortBy = extra?.sort === "chronological"
  ? "primary_release_date.asc"
  : (extra?.sort === "release_date_desc"
      ? "primary_release_date.desc"
      : (extra?.sort === "top_rated"
          ? "vote_average.desc&vote_count.gte=200"
          : "popularity.desc"));
  const relatedResult = await handleRelatedContent({
  catalogId,
  tmdbId,
  tmdbType,
  page,
  type,
  filterLang,
  language,
  rpdbKey,
  tpKey,
  excludeUnreleased,
  fanartKey,
  omdbKey,
  TMDB_KEY,
  fetchCached,
  resultsToMetas
});
if (relatedResult) {
  return relatedResult;
}

  const def = CATALOG_DEFS[catalogId];
  if (!def) return { metas: [] };
  if (def.handler ==="mdb") {
    const listId = catalogId.replace("mdb_","");
    return { metas: await mdblistToMetas(listId, type, mdbKey, rpdbKey, tpKey, maxRating, fanartKey, omdbKey) };
  }
  let url = buildTmdbCatalogUrl({
  def,
  type,
  tmdbType,
  page,
  sortBy,
  ratingParam,
  TMDB_KEY
});
switch(def.handler) {
    case"tmdb_collection": {
      let parts = (await fetchCached(`https://api.themoviedb.org/3/collection/${def.collectionId}?api_key=${TMDB_KEY}`)).parts || [];
      if(extra?.sort === "chronological") parts = parts.slice().sort((a,b) => (a.release_date||"").localeCompare(b.release_date||""));
      else if(extra?.sort === "release_date_desc") parts = parts.slice().sort((a,b) => (b.release_date||"").localeCompare(a.release_date||""));
      return { metas: await resultsToMetas(parts, type, filterLang, language, rpdbKey, tpKey, excludeUnreleased, fanartKey, omdbKey) };
    }
    case"tmdb_multi_collection": {
      let allParts = [];
      for(const cid of def.collectionIds) {
        try {
          const d = await fetchCached(`https://api.themoviedb.org/3/collection/${cid}?api_key=${TMDB_KEY}`);
          if(d.parts) allParts.push(...d.parts);
        } catch(e) {}
      }
      if(extra?.sort === "chronological") allParts = allParts.sort((a,b) => (a.release_date||"").localeCompare(b.release_date||""));
      else if(extra?.sort === "release_date_desc") allParts = allParts.sort((a,b) => (b.release_date||"").localeCompare(a.release_date||""));
      return { metas: await resultsToMetas(allParts, type, filterLang, language, rpdbKey, tpKey, excludeUnreleased, fanartKey, omdbKey) };
    }
    case "trakt_trending":
    case "trakt_popular":
    case "trakt_anticipated":
    case "trakt_user_favorites":
    case "trakt_user_watchlist":
    case "trakt_user_collection":
       return await handleTraktCatalog(
         def.handler,
         type,
         traktUser,
         language,
         rpdbKey,
         tpKey,
         excludeUnreleased,
           TRAKT_CLIENT_ID
  );
    case"tmdb_anime":
      url = `https://api.themoviedb.org/3/discover/${tmdbType}?api_key=${TMDB_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}${type==="movie"?ratingParam:""}`;
      break;
    case"tmdb_bollywood":
      url = `https://api.themoviedb.org/3/discover/${tmdbType}?api_key=${TMDB_KEY}&with_original_language=hi&sort_by=popularity.desc&page=${page}${type==="movie"?ratingParam:""}`;
      break;
    case"tmdb_paramount":
      url = `https://api.themoviedb.org/3/discover/${tmdbType}?api_key=${TMDB_KEY}&with_watch_providers=2616%7C2303&watch_region=US&sort_by=popularity.desc&page=${page}${type==="movie"?ratingParam:""}`;
      break;
    case "tmdb_ids": {
      const ids = Array.isArray(def.ids) ? def.ids : [];
      const results = [];

      for (const tmdbId of ids) {
        try {

       const item = await fetchCached(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId}?api_key=${TMDB_KEY}&language=${language}`);
          if(item && item.id) results.push(item);
        } catch(e) {
          console.log("tmdb_ids error", catalogId, tmdbId, e.message);
        }
      }
      return { metas: await resultsToMetas(results, type, false, language, rpdbKey, tpKey) };
    }
    case "tmdb_search": {

      const q = def.query || def.name;
      const data = await fetchCached(`https://api.themoviedb.org/3/search/${tmdbType}?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&page=1&language=${language}`);
      return { metas: await resultsToMetas(data.results || [], type, false, language, rpdbKey, tpKey) };
    }
   case "search":
  return await handleCatalogSearch({
    catalogId,                                                                                                                                                extra,
    tmdbType,
    type,
    language,
    rpdbKey,
    tpKey,
    TMDB_KEY,
    fetchCached,
    resultsToMetas
  });

default:
      return { metas: [] };                                                                                                                                 }
  if (language && language !== "en-US") url += `&language=${language}`;
  const startPage = Math.floor((extra?.skip || 0) / 100) * 5 + 1;
  const pages = await Promise.all(
    Array.from({length: 5}, (_, i) =>
      fetchCached(url.replace(`page=${page}`, `page=${startPage + i}`))
        .catch(() => ({ results: [] }))
    )
  );
  let allResults = pages.flatMap(d => d.results || []);
  if (type === "movie" && maxRating) {
      allResults = await filterByMaxRating(allResults, maxRating);
  }
  return { metas: await resultsToMetas(allResults, type, filterLang, language, rpdbKey, tpKey, excludeUnreleased, fanartKey, omdbKey) };
}


module.exports = {
  handleCatalog
};
