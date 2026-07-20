const { fetchTrakt } = require("./api-helpers");
const { traktToMetas } = require("./metadata-service");
const axios = require('axios');
const { loadConfigs, saveConfigs } = require("../utils/config-store");

async function refreshTraktToken(userToken, config) {
  if(!config.traktRefreshToken) return null;
  try {
    const res = await axios.post('https://api.trakt.tv/oauth/token', {
      refresh_token: config.traktRefreshToken,
      client_id: process.env.TRAKT_CLIENT_ID,
      client_secret: process.env.TRAKT_CLIENT_SECRET,
      grant_type: 'refresh_token'
    }, { headers: { 'Content-Type': 'application/json' } });
    const data = res.data;
    if(!data.access_token) return null;
    const configs = loadConfigs();
    configs[userToken].traktAccessToken = data.access_token;
    configs[userToken].traktRefreshToken = data.refresh_token;
    configs[userToken].traktTokenExpiry = Date.now() + (data.expires_in * 1000);
    saveConfigs(configs);
    console.log('[Trakt] Token refreshed for:', userToken.slice(0,8));
    return data.access_token;
  } catch(e) {
    console.error('[Trakt] Refresh failed:', e.message);
    return null;
  }
}

async function getValidTraktToken(userToken, config) {
  if(!config.traktAccessToken) return null;
  if(config.traktTokenExpiry && Date.now() > config.traktTokenExpiry - 300000) {
    const newToken = await refreshTraktToken(userToken, config);
    return newToken || config.traktAccessToken;
  }
  return config.traktAccessToken;
}

async function handleTraktCatalog(
  handler,
  type,
  traktUser,
  language,
  rpdbKey,
  tpKey,
  excludeUnreleased,
  traktClientId,
  traktAccessToken = null,
  userToken = null,
  userConfig = null
) {
  // Refresh token if needed
  let activeToken = traktAccessToken;
  if(traktAccessToken && userToken && userConfig) {
    activeToken = await getValidTraktToken(userToken, userConfig) || traktAccessToken;
  }
  const authHeaders = activeToken
    ? { 'Authorization': `Bearer ${activeToken}`, 'trakt-api-version': '2', 'trakt-api-key': traktClientId }
    : null;
  switch (handler) {
    case "trakt_trending": {
      const path = type === "series" ? "/shows/trending" : "/movies/trending";
      const data = await fetchTrakt(`${path}?limit=50`, traktClientId, authHeaders);
      return {
        metas: await traktToMetas(
          data, type, language, rpdbKey, tpKey, excludeUnreleased
        )
      };
    }

    case "trakt_popular": {
      const path = type === "series" ? "/shows/popular" : "/movies/popular";
      const data = await fetchTrakt(`${path}?limit=50&extended=full`, traktClientId, authHeaders);
      return {
        metas: await traktToMetas(
          data, type, language, rpdbKey, tpKey, excludeUnreleased
        )
      };
    }

    case "trakt_anticipated": {
      const path = type === "series" ? "/shows/anticipated" : "/movies/anticipated";
      const data = await fetchTrakt(`${path}?limit=50`, traktClientId, authHeaders);
      return {
        metas: await traktToMetas(
          data, type, language, rpdbKey, tpKey, excludeUnreleased
        )
      };
    }

    case "trakt_user_favorites": {
      if (!traktUser) return { metas: [] };
      const t = type === "series" ? "shows" : "movies";
      const data = await fetchTrakt(`/users/${traktUser}/favorites/${t}?limit=50`, traktClientId, authHeaders);
      return {
        metas: await traktToMetas(
          data, type, language, rpdbKey, tpKey, excludeUnreleased
        )
      };
    }

    case "trakt_user_watchlist": {
      if (!traktUser) return { metas: [] };
      const t = type === "series" ? "shows" : "movies";
      const data = await fetchTrakt(`/users/${traktUser}/watchlist/${t}?limit=50`, traktClientId, authHeaders);
      return {
        metas: await traktToMetas(
          data, type, language, rpdbKey, tpKey, excludeUnreleased
        )
      };
    }

    case "trakt_user_collection": {
      if (!traktUser) return { metas: [] };
      const t = type === "series" ? "shows" : "movies";
      const data = await fetchTrakt(`/users/${traktUser}/collection/${t}`, traktClientId, authHeaders);
      return {
        metas: await traktToMetas(
          data, type, language, rpdbKey, tpKey, excludeUnreleased
        )
      };
    }

    default:
      return null;
  }
}

module.exports = {
  handleTraktCatalog,
  getValidTraktToken
};
