import { NextResponse } from "next/server";
import { getWeather, WeatherError } from "@/lib/weather";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const city = new URL(request.url).searchParams.get("city")?.trim().replace(/\s+/g, " ");
  if (!city || city.length > 100) {
    return NextResponse.json({ error: "Enter a city name up to 100 characters" }, { status: 400, headers });
  }
  try {
    return NextResponse.json(await getWeather(city.toLowerCase()), { headers });
  } catch (error) {
    if (error instanceof WeatherError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    }
    return NextResponse.json({ error: "Weather is temporarily unavailable" }, { status: 500, headers });
  }
}
