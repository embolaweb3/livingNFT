import axios from 'axios'
import * as dotenv from 'dotenv'
import { getUserCity } from './getUserCity';
dotenv.config()

export async function getETHPriceUSD(): Promise<number> {
    const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
      params: {
        ids: "ethereum",
        vs_currencies: "usd",
      },
    });
  
    return res.data.ethereum.usd;
  }
  
  export async function getWeather(defaultCity = "Lagos"): Promise<string> {
    let city = defaultCity;
  
    const userCity = await getUserCity();
    if (userCity) {
      city = userCity;
    }
  
    const res = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: {
        q: city,
        appid: process.env.NEXT_PUBLIC_WEATHER_API_KEY,
      },
    });
  
    const weather = res.data.weather[0].main.toLowerCase();
    return weather;
  }

  export function getCurrentSeason(): string {
    const month = new Date().getMonth(); // 0 = Jan
  
    if ([11, 0, 1].includes(month)) return "Winter";
    if ([2, 3, 4].includes(month)) return "Spring";
    if ([5, 6, 7].includes(month)) return "Summer";
    return "Autumn";
  }
  