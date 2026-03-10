import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // WooCommerce Proxy Endpoint
  app.post("/api/proxy/woocommerce", express.json(), async (req, res) => {
    const { url, key, secret, endpoint } = req.body;

    if (!url || !key || !secret) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    try {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      const baseUrl = formattedUrl.endsWith('/') ? formattedUrl.slice(0, -1) : formattedUrl;
      const endpointPath = endpoint || 'system_status';

      const tryFetch = async (targetUrl: string) => {
        const urlObj = new URL(targetUrl);
        
        // Add auth to query params as a fallback
        urlObj.searchParams.append('consumer_key', key);
        urlObj.searchParams.append('consumer_secret', secret);

        const auth = Buffer.from(`${key}:${secret}`).toString('base64');
        const headers: Record<string, string> = {
          'Authorization': `Basic ${auth}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': baseUrl + '/'
        };

        console.log(`Attempting WooCommerce request to: ${urlObj.origin}${urlObj.pathname}`);
        
        return await fetch(urlObj.toString(), {
          method: 'GET',
          headers,
          redirect: 'follow'
        });
      };
      
      // Try 1: Standard REST API path
      let apiUrl = `${baseUrl}/wp-json/wc/v3/${endpointPath}`;
      let response = await tryFetch(apiUrl);

      // Try 2: If 405 or 404, try with index.php
      if (response.status === 405 || response.status === 404) {
        console.log(`Attempt 1 failed (${response.status}), trying with index.php...`);
        apiUrl = `${baseUrl}/index.php/wp-json/wc/v3/${endpointPath}`;
        response = await tryFetch(apiUrl);
      }

      // Try 3: Legacy API if still failing
      if (response.status === 405 || response.status === 404) {
        console.log(`Attempt 2 failed (${response.status}), trying legacy API path...`);
        apiUrl = `${baseUrl}/wc-api/v3/${endpointPath}`;
        response = await tryFetch(apiUrl);
      }

      console.log(`Final WooCommerce response status: ${response.status}`);
      const text = await response.text();
      
      let data;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.warn("Failed to parse WooCommerce response as JSON:", text.substring(0, 200));
          return res.status(response.status || 500).json({ 
            message: `The server returned a non-JSON response (${response.status}).`,
            debug: text.substring(0, 100)
          });
        }
      } else {
        console.warn("Received empty response from WooCommerce");
        return res.status(response.status || 500).json({ 
          message: `The server returned an empty response (${response.status}).`
        });
      }
      
      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.json(data);
    } catch (error) {
      console.error("Proxy Error:", error);
      res.status(500).json({ message: "Failed to connect to WooCommerce store. Please check the URL and ensure it's accessible." });
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
    // Serve static files from the 'dist' directory in production
    app.use(express.static(path.join(__dirname, "dist")));
    
    // Handle SPA routing: serve index.html for any unknown paths
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
