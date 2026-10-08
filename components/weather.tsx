"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Weather } from "@/lib/weather";

const savedCity = () => document.cookie.match(/(?:^|; )city=([^;]*)/)?.[1] ? decodeURIComponent(document.cookie.match(/(?:^|; )city=([^;]*)/)![1]) : "Stockholm";

export function WeatherWidget({ initialWeather }: { initialWeather: Weather | null }) {
  const [city, setCity] = useState("Stockholm");
  const [weather, setWeather] = useState<Weather | null>(initialWeather);
  const [message, setMessage] = useState("");
  const load = async (nextCity: string) => {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(nextCity)}`);
    if (response.ok) { setWeather(await response.json()); setMessage(""); } else setMessage("Please enter a city name");
  };
  useEffect(() => { const current = savedCity(); setCity(current); void load(current); const timer = window.setInterval(() => void load(current), 900_000); return () => clearInterval(timer); }, []);
  const submit = (event: FormEvent) => { event.preventDefault(); document.cookie = `city=${encodeURIComponent(city)}; max-age=155520000; SameSite=Lax; path=/`; void load(city); };
  return <div className="wcontainer"><div className="bottom-banner"><section className="ajax-section"><div className="cities">{weather && <div className="city"><div className="city-info"><h2 className="city-name"><span>{weather.name}</span><sup>{weather.sys.country}</sup></h2><div className="city-temp">{Math.round(weather.main.temp)}<sup>°C</sup></div><figcaption>{weather.weather[0]?.description}</figcaption><figure><img className="city-icon" src={`https://openweathermap.org/img/wn/${weather.weather[0]?.icon}@2x.png`} alt="Weather icon" /></figure></div></div>}</div></section><form onSubmit={submit}><input placeholder="Search for a city" aria-label="City" value={city} onChange={(event) => setCity(event.target.value)} /><button className="search-button" aria-label="Search">⌕</button><span className="msg">{message}</span></form></div></div>;
}
