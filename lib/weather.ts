import { unstable_cache } from "next/cache";

export type Weather = {
  name: string;
  sys: { country: string };
  main: { temp: number };
  weather: [{ description: string; icon: string }];
};

export class WeatherError extends Error {
  constructor(readonly status: 404 | 502 | 503 | 504, message: string) {
    super(message);
  }
}

function object(value: unknown): Record<string, unknown> | undefined {
  if (value !== null && typeof value === "object") return value as Record<string, unknown>;
}

function readWeather(value: unknown): Weather {
  const data = object(value);
  const country = object(data?.sys)?.country;
  const temp = object(data?.main)?.temp;
  const condition = Array.isArray(data?.weather) ? object(data.weather[0]) : undefined;
  if (
    typeof data?.name !== "string" || typeof country !== "string" ||
    typeof temp !== "number" || !Number.isFinite(temp) ||
    typeof condition?.description !== "string" ||
    typeof condition.icon !== "string" || !/^\d{2}[dn]$/.test(condition.icon)
  ) {
    throw new WeatherError(502, "Weather service returned an invalid response");
  }
  return {
    name: data.name,
    sys: { country },
    main: { temp },
    weather: [{ description: condition.description, icon: condition.icon }],
  };
}

function getApiKey() {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new WeatherError(503, "Weather is not configured");
  return key;
}

const getCachedWeather = unstable_cache(async (city: string): Promise<Weather> => {
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.search = new URLSearchParams({ q: city, appid: getApiKey(), units: "metric" }).toString();
  const signal = AbortSignal.timeout(5_000);

  try {
    const response = await fetch(url, { cache: "no-store", signal });
    if (response.status === 404) throw new WeatherError(404, "City not found");
    if (!response.ok) throw new WeatherError(502, "Weather service is unavailable");
    return readWeather(await response.json());
  } catch (error) {
    if (error instanceof WeatherError) throw error;
    if (signal.aborted) throw new WeatherError(504, "Weather service timed out");
    throw new WeatherError(502, "Weather service is unavailable");
  }
}, ["weather-v1"], { revalidate: 900 });

export async function getWeather(city: string): Promise<Weather> {
  getApiKey();
  return getCachedWeather(city);
}
