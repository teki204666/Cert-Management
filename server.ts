import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Public QR Verification Route
  app.get("/api/verify/:certId", (req, res) => {
    // This will eventually fetch from Firestore
    // For now, return a placeholder or 404
    res.json({ 
      status: "pending_implementation",
      message: "Verification system is being initialized."
    });
  });

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Notification Cron Job (Runs every day at 9:00 AM)
  cron.schedule("0 9 * * *", async () => {
    console.log("Running expiry check cron job...");
    // Logic to check Firestore for expiring certs and send emails
    // This will be implemented once Firebase is ready
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
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
