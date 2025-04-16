import axios from 'axios'
import * as dotenv from 'dotenv'
dotenv.config()

export async function getWeather(city = "Lagos"): Promise<string> {
    const res = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: {
        q: city,
        appid: process.env.WEATHER_API_KEY,
      },
    });
  
    const weather = res.data.weather[0].main.toLowerCase();
    return weather; // e.g., "rain", "clear", "clouds"
  }

  export function getCurrentSeason(): string {
    const month = new Date().getMonth(); // 0 = Jan
  
    if ([11, 0, 1].includes(month)) return "Winter";
    if ([2, 3, 4].includes(month)) return "Spring";
    if ([5, 6, 7].includes(month)) return "Summer";
    return "Autumn";
  }
  