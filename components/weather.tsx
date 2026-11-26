"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Weather } from "@/lib/weather";

const savedCity = () => {
  const value = document.cookie.match(/(?:^|; )city=([^;]*)/)?.[1];
  try {
    const city = value ? decodeURIComponent(value).trim() : "";
    return city && city.length <= 100 ? city : "Stockholm";
  } catch {
    return "Stockholm";
  }
};

export function WeatherWidget() {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<{ city: string } | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [message, setMessage] = useState("Loading weather…");

  useEffect(() => {
    setSelection({ city: savedCity() });
  }, []);

  useEffect(() => {
    if (!selection) return;
    const controller = new AbortController();
    let pending = false;

    const load = async () => {
      if (pending || controller.signal.aborted) return;
      pending = true;
      try {
        const response = await fetch(
          `/api/weather?city=${encodeURIComponent(selection.city)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) {
          const message = response.status === 404 ? "City not found" : "Weather is temporarily unavailable";
          if (!controller.signal.aborted) setMessage(message);
          return;
        }
        const result: Weather = await response.json();
        if (!controller.signal.aborted) {
          setWeather(result);
          setMessage("");
        }
      } catch {
        if (!controller.signal.aborted) setMessage("Weather is temporarily unavailable");
      } finally {
        pending = false;
      }
    };

    void load();
    const timer = window.setInterval(load, 900_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [selection]);

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const city = query.trim();
    if (!city || city.length > 100) return;

    document.cookie = `city=${encodeURIComponent(city)}; max-age=155520000; SameSite=Lax; path=/`;
    setMessage("Loading weather…");
    setSelection({ city });
    setQuery("");
  };

  const condition = weather?.weather[0];

  return (
    <div className="wcontainer">
      <div className="bottom-banner">
        <section className="ajax-section">
          <div className="cities">
            {weather && (
              <li className="city">
                <div className="city-info">
                  <h2
                    className="city-name"
                    data-name={`${weather.name},${weather.sys.country}`}
                  >
                    <span>{weather.name}</span>
                    <sup>{weather.sys.country}</sup>
                  </h2>
                  <div className="city-temp">{Math.round(weather.main.temp)}<sup>°C</sup></div>
                  <figcaption>{condition?.description}</figcaption>
                  <figure>
                    <img
                      className="city-icon"
                      src={`https://openweathermap.org/img/wn/${condition?.icon}@2x.png`}
                      alt={condition?.description ?? "Weather icon"}
                    />
                  </figure>
                </div>
              </li>
            )}
          </div>
        </section>
        <form onSubmit={submit}>
          <input
            id="search"
            placeholder="Search for a city"
            aria-label="City"
            maxLength={100}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="search-button" aria-label="Search">
            <i className="fas fa-search" style={{ color: "#c0bfbc" }} />
          </button>
          <span className="msg" role="status">{message}</span>
        </form>
      </div>
    </div>
  );
}
