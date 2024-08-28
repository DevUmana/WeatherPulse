import dotenv from "dotenv";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
// Load the environment variables
dotenv.config();
// dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

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

    console.log(currentWeatherDay.dt);

    // Format the current weather day
    const currentWeatherDayFormatted = this.unixToLocalDate(
      currentWeatherDay.dt
    );

    // Create a new Weather object with the current weather data
    const currentWeather: Weather = new Weather(
      this.cityName,
      currentWeatherDayFormatted,
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

    // Filter unique dates from the forecastArray
    const uniqueDatesArray = weatherData.filter((weather) =>
      weather.dt_txt.includes("18:00:00")
    );

    // Create a new Weather object for each unique date and add it to the forecastArray
    uniqueDatesArray.forEach((weather) => {
      const weatherObject: Weather = new Weather(
        this.cityName,
        dayjs.unix(weather.dt).format("MM/DD/YYYY"),
        weather.weather[0].icon,
        weather.weather[0].description,
        weather.main.temp,
        weather.wind.speed,
        weather.main.humidity
      );

      forecastArray.push(weatherObject);
    });

    // Handle the case where the current weather day is the same as the second weather day due to the external API Limitation
    const currentWeatherDay = forecastArray[0].date;
    const secondWeatherDay = forecastArray[1].date;

    if (currentWeatherDay === secondWeatherDay) { 
      forecastArray.shift();
      const lastWeatherData = weatherData[weatherData.length - 1];
      console.log(lastWeatherData);
      console.log(lastWeatherData.dt);
      const weatherObject: Weather = new Weather(
        this.cityName,
        dayjs(lastWeatherData.dt_txt).format("MM/DD/YYYY"),
        lastWeatherData.weather[0].icon,
        lastWeatherData.weather[0].description,
        lastWeatherData.main.temp,
        lastWeatherData.wind.speed,
        lastWeatherData.main.humidity
      );
      forecastArray.push(weatherObject);
      console.log(forecastArray);
    }

    return forecastArray;
  }

  // unix timestamp conversion to locale date
  private unixToLocalDate(unixTimestamp: number) {
    const localeTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return dayjs.unix(unixTimestamp).tz(localeTimeZone).format("MM/DD/YYYY");
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
