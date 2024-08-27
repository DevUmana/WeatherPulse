import { Router } from "express";
const router = Router();

import apiRoutes from "./api/index.js";
import htmlRoutes from "./htmlRoutes.js";

// Middleware
// Use the apiRoutes for all routes starting with /api
// Use the htmlRoutes for all other routes
router.use("/api", apiRoutes);
router.use("/", htmlRoutes);

export default router;
