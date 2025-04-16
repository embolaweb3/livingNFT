import { getETHPriceUSD, getWeather, getCurrentSeason } from "../utils/dataFetchers";

(async () => {
  const ethPrice = await getETHPriceUSD();
  const weather = await getWeather("Lagos");
  const season = getCurrentSeason();

  console.log("💰 ETH Price:", ethPrice);
  console.log("🌦 Weather:", weather);
  console.log("🕰 Season:", season);
})();
