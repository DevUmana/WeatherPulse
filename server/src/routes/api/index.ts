import { Router } from "express";
const router = Router();

import weatherRoutes from "./weatherRoutes.js";

// Use the weatherRoutes for all routes starting with /weather
router.use("/weather", weatherRoutes);

export default router;
