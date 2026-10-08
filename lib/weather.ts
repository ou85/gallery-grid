export type Weather = { name: string; sys: { country: string }; main: { temp: number }; weather: Array<{ description: string; icon: string }> };

export async function getWeather(city: string): Promise<Weather | null> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return null;
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`, { next: { revalidate: 900 } });
  return response.ok ? response.json() : null;
}
