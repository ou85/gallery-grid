import { NextResponse } from "next/server";
import { getWeather } from "@/lib/weather";

export async function GET(request: Request) {
  const city = new URL(request.url).searchParams.get("city")?.trim().slice(0, 100);
  if (!city) return NextResponse.json({ error: "Weather is unavailable" }, { status: 400 });
  const weather = await getWeather(city);
  if (!weather) return NextResponse.json({ error: "City not found" }, { status: 404 });
  return NextResponse.json(weather);
}
