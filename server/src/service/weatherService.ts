import dotenv from "dotenv";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

// Load the environment variables
dotenv.config();

// dayjs plugins
dayjs.extend(customParseFormat);

//get the browser timezone
let userTimeZone: any;

// Coordinates interface
interface Coordinates {
  lat: number;
  lon: number;
}

// Weather class
class Weather {
  city: string;
  date: string;
  icon: string;
  iconDescription: string;
  tempF: number;
  windSpeed: number;
  humidity: number;

  constructor(
    city: string,
    date: string,
    icon: string,
    iconDescription: string,
    tempF: number,
    windSpeed: number,
    humidity: number
  ) {
    this.city = city;
    this.date = date;
    this.icon = icon;
    this.iconDescription = iconDescription;
    this.tempF = tempF;
    this.windSpeed = windSpeed;
    this.humidity = humidity;
  }
}

// WeatherService class with methods to fetch location data, destructure location data, build geocode query, build weather query, fetch and destructure location data, fetch weather data, parse current weather, build forecast array, and get weather for city
class WeatherService {
  private baseURL?: string;
  private apiKey?: string;
  private cityName: string = "";

  constructor() {
    this.baseURL = process.env.API_BASE_URL || "";
    this.apiKey = process.env.API_KEY || "";
  }

  // fetchLocationData method to fetch location data
  private async fetchLocationData(query: string) {
    const response = await fetch(query);
    const data = await response.json();
    const locationData = data[0];

    return locationData;
  }

  // destructureLocationData method to destructure location data and return the latitude and longitude
  private destructureLocationData(locationData: Coordinates): Coordinates {
    const { lat, lon } = locationData;
    return { lat, lon };
  }
  // buildGeocodeQuery method to build the geocode query
  private buildGeocodeQuery(): string {
    return `${this.baseURL}/geo/1.0/direct?q=${this.cityName}&appid=${this.apiKey}`;
  }
  // buildWeatherQuery method to build the weather query
  private buildWeatherQuery(coordinates: Coordinates): string {
    const { lat, lon } = coordinates;
    return `${this.baseURL}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=Imperial`;
  }
  // fetchAndDestructureLocationData method to fetch and destructure location data
  private async fetchAndDestructureLocationData() {
    const query = this.buildGeocodeQuery();
    const locationData = await this.fetchLocationData(query);
    return this.destructureLocationData(locationData);
  }
  // fetchWeatherData method to fetch weather data
  private async fetchWeatherData(coordinates: Coordinates) {
    const query = this.buildWeatherQuery(coordinates);
    const response = await fetch(query);
    return await response.json();
  }
  // parseCurrentWeather method to parse the current weather
  private parseCurrentWeather(response: any) {
    // Find the current weather day
    const currentWeatherDay = response[0];

    // Get the current date in the user's timezone
    const currentDate = new Date(currentWeatherDay.dt * 1000);
    const options = { timeZone: userTimeZone, hour12: false };
    const dateInUserTimeZone = currentDate.toLocaleString("en-US", options);
    const currentDateFormatted = dateInUserTimeZone.split(",")[0];

    // Create a new Weather object with the current weather data
    const currentWeather: Weather = new Weather(
      this.cityName,
      currentDateFormatted,
      currentWeatherDay.weather[0].icon,
      currentWeatherDay.weather[0].description,
      currentWeatherDay.main.temp,
      currentWeatherDay.wind.speed,
      currentWeatherDay.main.humidity
    );

    return currentWeather;
  }

  // buildForecastArray method to build the forecast array
  private buildForecastArray(currentWeather: Weather, weatherData: any[]) {
    // Create an array with the current weather object
    const forecastArray: Weather[] = [currentWeather];

    // Update the weatherData array with the user timezone
    weatherData.forEach((weather) => {
      const newDate = new Date(weather.dt * 1000);
      const options = { timeZone: userTimeZone, hour12: false };
      const dateInUserTimeZone = newDate.toLocaleString("en-US", options);
      weather.dt_txt = dateInUserTimeZone;
    });

    // increase the current date by 21 hours
    const currentDate = weatherData[0].dt_txt;
    const currentDateTime = currentDate.split(" ")[1];
    const currentDateTimeUpdated = dayjs(currentDateTime, "HH:mm:ss")
      .add(21, "hour")
      .format("HH:mm:ss");

    // Filter currentDateTimeUpdated from the weatherData array
    const uniqueDatesArray = weatherData.filter((weather) =>
      weather.dt_txt.includes(currentDateTimeUpdated)
    );

    // Create a new Weather object for each unique date and add it to the forecastArray
    uniqueDatesArray.forEach((weather) => {
      const weatherObject: Weather = new Weather(
        this.cityName,
        weather.dt_txt.split(",")[0],
        weather.weather[0].icon,
        weather.weather[0].description,
        weather.main.temp,
        weather.wind.speed,
        weather.main.humidity
      );

      forecastArray.push(weatherObject);
    });

    return forecastArray;
  }

  getTimeZone(timeZone: string) {
    userTimeZone = timeZone;
  }

  // getWeatherForCity method to get the weather for a city
  async getWeatherForCity(city: string) {
    this.cityName = city;
    const coordinates = await this.fetchAndDestructureLocationData();
    const weatherData = await this.fetchWeatherData(coordinates);
    const currentWeather = this.parseCurrentWeather(weatherData.list);
    const forecastArray = this.buildForecastArray(
      currentWeather,
      weatherData.list
    );
    return forecastArray;
  }
}

export default new WeatherService();
