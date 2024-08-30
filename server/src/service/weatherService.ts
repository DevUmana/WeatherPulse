import dotenv from "dotenv";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
// Load the environment variables
dotenv.config();
// dayjs plugins
dayjs.extend(customParseFormat);

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

    // Format the current weather day
    console.log("currentWeatherDay");
    console.log(currentWeatherDay.dt);
    console.log("===============================================");
    const currentDate = new Date(currentWeatherDay.dt * 1000);
    console.log("currentDate");
    console.log(currentDate);
    //log timezone
    console.log("timezone");
    console.log(currentDate.getTimezoneOffset());
    // log UTC
    console.log("UTC");
    console.log(currentDate.toUTCString());
    // log GMT
    console.log("GMT");
    console.log(currentDate.toUTCString());
    // log local time
    console.log("local time");
    console.log(currentDate.toLocaleString());
    // log format
    console.log("format");
    console.log(currentDate.toDateString());

    // format to MM/DD/YYYY
    const currentD = currentDate.getDate();
    const currentM = currentDate.getMonth() + 1;
    const currentY = currentDate.getFullYear();
    const currentDateTime = `${currentM}/${currentD}/${currentY}`;

    // Create a new Weather object with the current weather data
    const currentWeather: Weather = new Weather(
      this.cityName,
      currentDateTime,
      currentWeatherDay.weather[0].icon,
      currentWeatherDay.weather[0].description,
      currentWeatherDay.main.temp,
      currentWeatherDay.wind.speed,
      currentWeatherDay.main.humidity
    );

    return currentWeather;
  }

  // buildForecastArray method to build the forecast array
  private buildForecastArray(weatherData: any[]) {
    // Create an array with the current weather object
    const forecastArray: Weather[] = [];

    // Creates a new current date thats 24 hours ahead
    const currentDate = weatherData[0].dt_txt;
    const currentDateTime = currentDate.split(" ")[1];
    const currentDateTimeUpdated = dayjs(currentDateTime, "HH:mm:ss")
      .add(24, "hour")
      .format("HH:mm:ss");

    // Filter unique dates from the forecastArray using the currentDate
    const uniqueDatesArray = weatherData.filter((weather) =>
      weather.dt_txt.includes(currentDateTimeUpdated)
    );

    //update weatherData dt time to user local time minus the current date time
    weatherData.forEach((weather) => {
      const newDate = new Date(weather.dt * 1000);
      // format to MM/DD/YYYY
      const currentD = newDate.getDate();
      const currentM = newDate.getMonth() + 1;
      const currentY = newDate.getFullYear();
      const currentDateTime = `${currentM}/${currentD}/${currentY}`;
      weather.dt_txt = currentDateTime;
    });

    // add last day to uniqueDatesArray
    uniqueDatesArray.push(weatherData[weatherData.length - 1]);

    // Create a new Weather object for each unique date and add it to the forecastArray
    uniqueDatesArray.forEach((weather) => {
      const weatherObject: Weather = new Weather(
        this.cityName,
        weather.dt_txt,
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

  // getWeatherForCity method to get the weather for a city
  async getWeatherForCity(city: string) {
    this.cityName = city;
    const coordinates = await this.fetchAndDestructureLocationData();
    const weatherData = await this.fetchWeatherData(coordinates);
    this.parseCurrentWeather(weatherData.list);
    const forecastArray = this.buildForecastArray(weatherData.list);
    return forecastArray;
  }
}

export default new WeatherService();
