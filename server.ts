import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer as createViteServer } from "vite";
import { fetchTravelOptionsInternal, chatWithAIInternal } from "./services/aiProvider.ts";

console.log("Initializing OneYatra Server...");
console.log("Environment:", process.env.NODE_ENV || "development");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API routes
  app.get("/api/locations", async (req, res) => {
    try {
      const { q, limit, lat, lon, lang, reverse } = req.query;
      
      let url: string;
      if (reverse === 'true' && lat && lon) {
        url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
      } else {
        const params = new URLSearchParams({
          q: (q as string) || '',
          limit: (limit as string) || '10',
          lang: (lang as string) || 'en',
          lat: (lat as string) || '20.5937',
          lon: (lon as string) || '78.9629'
        });
        url = `https://photon.komoot.io/api/?${params.toString()}`;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      try {
        const response = await fetch(url, { signal: controller.signal });
        let data = await response.json();
        
        // Fallback to Nominatim if Photon returns no results for a search
        if (reverse !== 'true' && (!data.features || data.features.length === 0) && q) {
          const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q as string)}&limit=${limit || 10}&countrycodes=in&addressdetails=1`;
          const nomRes = await fetch(nominatimUrl, { 
            headers: { 'User-Agent': 'OneYatra/1.0' },
            signal: controller.signal
          });
          const nomData = await nomRes.json();
          
          if (Array.isArray(nomData) && nomData.length > 0) {
            data = {
              features: nomData.map((item: any) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [parseFloat(item.lon), parseFloat(item.lat)] },
                properties: {
                  name: item.display_name.split(',')[0],
                  city: item.address?.city || item.address?.town || item.address?.village || item.address?.suburb,
                  state: item.address?.state,
                  country: item.address?.country || 'India',
                  osm_id: item.osm_id,
                  osm_value: item.type
                }
              }))
            };
          }
        }
        
        // Fallback for Reverse Geocoding
        if (reverse === 'true' && (!data.features || data.features.length === 0) && lat && lon) {
          const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
          const nomRes = await fetch(nominatimUrl, { 
            headers: { 'User-Agent': 'OneYatra/1.0' },
            signal: controller.signal
          });
          const nomData = await nomRes.json();
          
          if (nomData && nomData.display_name) {
            data = {
              features: [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [parseFloat(nomData.lon), parseFloat(nomData.lat)] },
                properties: {
                  name: nomData.display_name.split(',')[0],
                  city: nomData.address?.city || nomData.address?.town || nomData.address?.village,
                  state: nomData.address?.state,
                  country: nomData.address?.country || 'India'
                }
              }]
            };
          }
        }
        
        res.json(data);
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("Server /api/locations Error:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.post("/api/travel", async (req, res) => {
    try {
      const results = await fetchTravelOptionsInternal(req.body);
      res.json(results);
    } catch (error) {
      console.error("Server /api/travel Error:", error);
      res.status(500).json({ error: "Failed to fetch travel options" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const response = await chatWithAIInternal(message, history);
      res.json({ response });
    } catch (error) {
      console.error("Server /api/chat Error:", error);
      res.status(500).json({ error: "Failed to chat with AI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
