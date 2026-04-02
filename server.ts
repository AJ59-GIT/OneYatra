import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import session from "express-session";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { fetchTravelOptionsInternal, chatWithAIInternal } from "./services/aiProvider.ts";
import { getGeminiSuggestions } from "./services/locationService.ts";

console.log("Initializing OneYatra Server...");
console.log("Environment:", process.env.NODE_ENV || "development");
console.log("Gemini API Key Configured:", !!(process.env.GEMINI_API_KEY || process.env.API_KEY));
if (process.env.GEMINI_API_KEY) {
  console.log("Gemini API Key Prefix:", process.env.GEMINI_API_KEY.substring(0, 4) + "...");
} else if (process.env.API_KEY) {
  console.log("API_KEY Prefix:", process.env.API_KEY.substring(0, 4) + "...");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Trust proxy is required for express-rate-limit and secure cookies to work behind a proxy
  app.set('trust proxy', 1);

  // 1. Security Headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow external scripts/styles for now
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      frameguard: false, // Allow iframes
    })
  );

  // 2. Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // High limit for development
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production' // Skip in dev
  });
  app.use("/api/", limiter);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 3. CORS Configuration
  app.use(cors({
    origin: true, // Reflect request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
  }));

  // Middleware to ensure CHIPS (Partitioned cookies) for iframe compatibility
  app.use((req, res, next) => {
    const originalSetHeader = res.setHeader;
    res.setHeader = function(name: string, value: any): any {
      if (name.toLowerCase() === 'set-cookie') {
        const addAttributes = (cookieStr: string) => {
          let newVal = cookieStr;
          // In an iframe, SameSite=None and Secure are mandatory
          if (!newVal.toLowerCase().includes('samesite=')) {
            newVal += '; SameSite=None';
          } else if (newVal.toLowerCase().includes('samesite=lax') || newVal.toLowerCase().includes('samesite=strict')) {
            newVal = newVal.replace(/SameSite=(Lax|Strict)/i, 'SameSite=None');
          }
          
          if (!newVal.toLowerCase().includes('secure')) {
            newVal += '; Secure';
          }
          
          // Add Partitioned (CHIPS) for better cross-site cookie support
          if (!newVal.toLowerCase().includes('partitioned')) {
            newVal += '; Partitioned';
          }
          return newVal;
        };

        if (Array.isArray(value)) {
          value = value.map(v => typeof v === 'string' ? addAttributes(v) : v);
        } else if (typeof value === 'string') {
          value = addAttributes(value);
        }
      }
      return originalSetHeader.call(this, name, value);
    };
    next();
  });
  
  app.use(cookieParser(process.env.SESSION_SECRET || 'oneyatra-secret-key'));

  // Use express-session instead of cookie-session for better reliability in iframes
  app.use(session({
    name: 'oneyatra.sid',
    secret: process.env.SESSION_SECRET || 'oneyatra-secret-key',
    resave: false,
    saveUninitialized: true,
    proxy: true, // Required for secure cookies behind a proxy
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'none',
      // @ts-ignore
      partitioned: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

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
      console.log(`[API] Processing travel request from ${req.ip} for ${req.body?.origin} to ${req.body?.destination}`);
      console.log(`[API] Session ID: ${req.sessionID} - Body: ${JSON.stringify(req.body)}`);
      
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Empty request body" });
      }

      const results = await fetchTravelOptionsInternal(req.body);
      res.json(results);
    } catch (error: any) {
      console.error("Server /api/travel Error:", error);
      console.error("Stack Trace:", error.stack);
      res.status(500).json({ 
        error: "Failed to fetch travel options",
        details: error.message || "Unknown server error"
      });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      console.log(`[API] Processing chat request. Session ID: ${req.sessionID}`);
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
      server: { 
        middlewareMode: true,
        allowedHosts: true, // Allow all hosts in Vite 6
        fs: {
          strict: false // Allow serving files from anywhere in the project
        }
      },
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
