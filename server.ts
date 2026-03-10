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
      let formattedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        formattedUrl = `https://${url}`;
      }
      const baseUrl = formattedUrl.endsWith('/') ? formattedUrl.slice(0, -1) : formattedUrl;
      const endpointPath = endpoint || 'system_status';
      
      // Use query parameters for better compatibility with different server configurations
      const apiUrl = new URL(`${baseUrl}/wp-json/wc/v3/${endpointPath}`);
      apiUrl.searchParams.append('consumer_key', key);
      apiUrl.searchParams.append('consumer_secret', secret);

      console.log(`Proxying request to: ${apiUrl.toString().replace(secret, '****')}`);

      const response = await fetch(apiUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BScale-AI-Proxy/1.0',
          'Accept': 'application/json'
        }
      });

      console.log(`WooCommerce response status: ${response.status}`);
      const contentType = response.headers.get('content-type');
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
