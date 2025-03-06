import secrets from './secrets';

const config = {
    caption: ``,
    defaultLocation: [56.25997, 43.98309],
    defaultZoom: 10,
    googleApiUrl: `https://maps.googleapis.com/maps/api/js?v=3&key=${secrets.google}`,
    westraDataBaseUrl: 'https://nakarte.me/westraPasses/',
    CORSProxyUrl: 'https://proxy.nakarte.me/',
    elevationsServer: 'https://elevation.nakarte.me/',
    wikimediaCommonsCoverageUrl: 'https://tiles.nakarte.me/wikimedia_commons_images/{z}/{x}/{y}',
    geocachingSuUrl: 'https://nakarte.me/geocachingSu/geocaching_su2.json',
    tracksStorageServer: 'https://tracks.nakarte.me',
    wikimapiaTilesBaseUrl: 'https://proxy.nakarte.me/wikimapia/',
    mapillaryRasterTilesUrl: 'https://mapillary.nakarte.me/{z}/{x}/{y}',
    urlsBypassCORSProxy: [new RegExp('^https://pkk\\.rosreestr\\.ru/', 'u')],
    elevationTileUrl: 'https://tiles.nakarte.me/elevation/{z}/{x}/{y}',
    ...secrets,
};

export default config;
