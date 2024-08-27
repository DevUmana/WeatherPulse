import { Router, type Request, type Response } from "express";
const router = Router();

// Import the services
import HistoryService from "../../service/historyService.js";
import WeatherService from "../../service/weatherService.js";

// POST Request with city name to retrieve weather data
router.post("/", async (req: Request, res: Response) => {
  try {
    const cityName = req.body.cityName;
    console.log(cityName);
    if (!cityName) {
      res.status(400).json({ msg: "City name is required" });
    }

    const cities = await WeatherService.getWeatherForCity(cityName);

    await HistoryService.addCity(cityName);
    console.log("City successfully added to search history - " + new Date().toISOString());
    console.log("===============================================");

    res.json(cities);
    console.log("Weather successfully retrieved - " + new Date().toISOString());
    console.log("===============================================");
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// GET search history
router.get("/history", async (_req: Request, res: Response) => {
  try {
    const savedCities = await HistoryService.getCities();
    res.json(savedCities);
    console.log("City successfully retrieved from search history - " + new Date().toISOString());
    console.log("===============================================");
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// DELETE city from search history
router.delete("/history/:id", async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      res.status(400).json({ msg: "State id is required" });
    }

    await HistoryService.removeCity(req.params.id);
    res.json({ success: "City successfully removed from search history" });
    console.log("City successfully removed from search history - " + new Date().toISOString());
    console.log("===============================================");
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default router;
