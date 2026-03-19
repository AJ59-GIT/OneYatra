import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer as createViteServer } from "vite";
import { fetchTravelOptionsInternal, chatWithAIInternal } from "./services/aiProvider.ts";
import { getGeminiSuggestions } from "./services/locationService.ts";

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
      const { q, query, limit, lat, lon, lang, reverse, source } = req.query;
      const searchQuery = (q as string) || (query as string) || '';

      // Handle AI Source
      if (source === 'ai' && searchQuery) {
        const aiSuggestions = await getGeminiSuggestions(searchQuery);
        return res.json(aiSuggestions);
      }
      
      let url: string;
      if (reverse === 'true' && lat && lon) {
        url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
      } else {
        const params = new URLSearchParams({
          q: searchQuery,
          limit: (limit as string) || '15', // Increased limit
          lang: (lang as string) || 'en',
          lat: (lat as string) || '20.5937', // Center of India
          lon: (lon as string) || '78.9629'
        });
        url = `https://photon.komoot.io/api/?${params.toString()}`;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // Increased timeout to 4s

      try {
        const response = await fetch(url, { signal: controller.signal });
        let data = await response.json();
        
        // Filter for India results if it's a search
        if (reverse !== 'true' && data.features) {
          data.features = data.features.filter((f: any) => 
            f.properties.country === 'India' || 
            !f.properties.country || 
            f.properties.state?.toLowerCase().includes('india')
          );
        }

        // Fallback to Nominatim if Photon returns no results or too few results for a search
        if (reverse !== 'true' && (!data.features || data.features.length < 3) && q) {
          // Nominatim is more precise for Indian districts/states
          const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q as string)}&limit=${limit || 15}&countrycodes=in&addressdetails=1`;
          const nomRes = await fetch(nominatimUrl, { 
            headers: { 'User-Agent': 'OneYatra/1.0' },
            signal: controller.signal
          });
          const nomData = await nomRes.json();
          
          if (Array.isArray(nomData) && nomData.length > 0) {
            const nomFeatures = nomData.map((item: any) => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [parseFloat(item.lon), parseFloat(item.lat)] },
              properties: {
                name: item.display_name.split(',')[0],
                city: item.address?.city || item.address?.town || item.address?.village || item.address?.suburb || item.address?.district,
                state: item.address?.state,
                country: item.address?.country || 'India',
                osm_id: item.osm_id,
                osm_value: item.type,
                district: item.address?.district,
                county: item.address?.county
              }
            }));
            
            // Merge results, prioritizing Nominatim if it found better matches
            data.features = [...(data.features || []), ...nomFeatures];
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
                  city: nomData.address?.city || nomData.address?.town || nomData.address?.village || nomData.address?.district,
                  state: nomData.address?.state,
                  country: nomData.address?.country || 'India',
                  district: nomData.address?.district
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
