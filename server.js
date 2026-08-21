// ZenWrite Secure Standalone Server
// Zero-dependency HTTP Basic Auth Protected Server for Railway, Render, & Cloud Hosting

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const USERNAME = process.env.ZENWRITE_USER || "admin";
const PASSWORD = process.env.ZENWRITE_PASS || "changeme123";

// MIME types for static asset serving
const MIME_TYPES = {
    ".html": "text/html; charset=UTF-8",
    ".js": "text/javascript; charset=UTF-8",
    ".css": "text/css; charset=UTF-8",
    ".json": "application/json; charset=UTF-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".zip": "application/zip",
    ".txt": "text/plain; charset=UTF-8"
};

// Constant-time string comparison to prevent timing attacks
function safeCompare(a, b) {
    if (typeof a !== "string" || typeof b !== "string") return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

// Basic Authentication Validator
function checkAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) return false;
    
    try {
        const credentials = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
        const colonIndex = credentials.indexOf(":");
        if (colonIndex === -1) return false;
        
        const user = credentials.substring(0, colonIndex);
        const pass = credentials.substring(colonIndex + 1);
        
        return safeCompare(user, USERNAME) && safeCompare(pass, PASSWORD);
    } catch (e) {
        return false;
    }
}

const server = http.createServer((req, res) => {
    // Healthcheck endpoint for Railway / Render
    if (req.url === "/health" || req.url === "/ping") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
        return;
    }

    // Require HTTP Basic Auth for all requests
    if (!checkAuth(req)) {
        res.writeHead(401, {
            "WWW-Authenticate": 'Basic realm="ZenWrite Private Editor", charset="UTF-8"',
            "Content-Type": "text/html; charset=UTF-8",
            "Cache-Control": "no-store, no-cache, must-revalidate"
        });
        res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ZenWrite - Access Required</title>
    <style>
        body { background: #0A0A0B; color: #FAF9F6; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .box { background: #1C1917; border: 1px solid rgba(226, 184, 116, 0.2); border-radius: 12px; padding: 32px; max-width: 420px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        h1 { color: #E2B874; margin-top: 0; font-size: 1.5rem; }
        p { color: #A8A29E; line-height: 1.5; font-size: 0.95rem; }
        .btn { display: inline-block; margin-top: 16px; padding: 10px 20px; background: #E2B874; color: #0A0A0B; text-decoration: none; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }
        .btn:hover { background: #F3C985; }
    </style>
</head>
<body>
    <div class="box">
        <h1>🔒 Private Editor Access</h1>
        <p>Authentication is required to access this ZenWrite instance.</p>
        <button class="btn" onclick="location.reload()">Sign In</button>
    </div>
</body>
</html>`);
        return;
    }

    // Parse URL and sanitize file path
    const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    let reqPath = decodeURIComponent(parsedUrl.pathname);
    if (reqPath === "/" || reqPath === "") {
        reqPath = "/index.html";
    }

    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, "");
    const filePath = path.join(__dirname, safePath);

    // Prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Forbidden");
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        const headers = {
            "Content-Type": contentType,
            "Content-Length": stats.size,
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "SAMEORIGIN",
            "Cache-Control": ext === ".html" || ext === ".js" ? "no-cache, must-revalidate" : "max-age=86400"
        };

        res.writeHead(200, headers);
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log("===============================================");
    console.log("✍️  ZenWrite Secure Server Active");
    console.log(`📡 URL:      http://localhost:${PORT}`);
    console.log(`👤 User:     ${USERNAME}`);
    console.log(`🔑 Password: ${PASSWORD === "changeme123" ? "changeme123 (Default - Update in Railway ENV!)" : "****** (Configured)"}`);
    console.log("===============================================");
});
