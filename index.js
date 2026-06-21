const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");

const manifest = {
    id: "community.ekinotv.addon.v2",
    version: "1.0.1",
    name: "Ekino-TV Poprawione",
    resources: ["catalog", "stream"],
    types: ["movie"],
    catalogs: [{
        type: "movie",
        id: "ekino_poprawne",
        name: "Ekino Nowości",
        extra: [{ name: "search", isRequired: false }]
    }]
};

const builder = new addonBuilder(manifest);

// Klient udający prawdziwą przeglądarkę z telefonu
const client = axios.create({
    timeout: 10000, 
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl,en-US;q=0.7,en;q=0.3',
        'Referer': 'https://ekino-tv.pl/',
        'Origin': 'https://ekino-tv.pl'
    }
});

builder.defineCatalogHandler(async (args) => {
    const metas = [];
    try {
        let url = 'https://ekino-tv.pl/';
        
        if (args.extra && args.extra.search) {
            url = `https://ekino-tv.pl/search/search?q=${encodeURIComponent(args.extra.search)}`;
        }

        console.log("Próbuję pobrać stronę: " + url);
        const response = await client.get(url);
        const $ = cheerio.load(response.data);

        $(".movies-list-item, .v-box").each((i, el) => {
            const title = $(el).find(".title, .v-title").text().trim();
            const link = $(el).find("a").attr("href");
            const img = $(el).find("img").attr("src");

            if (title && link) {
                metas.push({
                    id: `ekino_${link.replace(/\//g, 'MULTIPLY')}`,
                    name: title,
                    type: "movie",
                    poster: img ? (img.startsWith('http') ? img : `https://ekino-tv.pl${img}`) : ''
                });
            }
        });

        console.log(`Sukces! Znaleziono ${metas.length} filmów.`);

    } catch (err) {
        console.error("BŁĄD POBIERANIA STRONY:", err.message);
    }

    return { metas: metas };
});

builder.defineStreamHandler(async (args) => {
    // Testowy odtwarzacz z bajką, żeby sprawdzić samo działanie wtyczki
    return { streams: [{ title: "Odtwórz (Test)", url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }] };
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
console.log("Serwer poprawiony działa na porcie 7000!");
