import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// GET request to serve the index.html file to the client
router.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  console.log("Serving index.html - " + new Date().toISOString());
  console.log("===============================================");
});

export default router;
