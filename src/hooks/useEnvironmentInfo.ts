"use client";

import { useCallback, useEffect, useState } from "react";
import type { CurrentWeather, TideInfo } from "@/lib/types";

const DEFAULT_WEATHER: CurrentWeather = {
  temperatureC: null,
};

const DEFAULT_TIDE: TideInfo = {
  tendencia: "--",
  tipo: "--",
  horario: "--:--",
};

type WeatherResponse = {
  current?: {
    temperature_2m?: number;
  };
};

type TideResponse = Partial<TideInfo>;

async function fetchWeather(latitude?: string, longitude?: string) {
  if (!latitude || !longitude) return DEFAULT_WEATHER;

  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m",
    timezone: "America/Fortaleza",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) return DEFAULT_WEATHER;

  const payload = (await response.json()) as WeatherResponse;
  const temperature = payload.current?.temperature_2m;

  return {
    temperatureC: typeof temperature === "number" ? temperature : null,
  };
}

async function fetchTide() {
  const response = await fetch("/api/tide", {
    cache: "no-store",
  });

  if (!response.ok) return DEFAULT_TIDE;

  const payload = (await response.json()) as TideResponse;

  return {
    tendencia: payload.tendencia || DEFAULT_TIDE.tendencia,
    tipo: payload.tipo || DEFAULT_TIDE.tipo,
    horario: payload.horario || DEFAULT_TIDE.horario,
  };
}

export function useEnvironmentInfo() {
  const [weather, setWeather] = useState<CurrentWeather>(DEFAULT_WEATHER);
  const [tide, setTide] = useState<TideInfo>(DEFAULT_TIDE);

  const latitude = process.env.NEXT_PUBLIC_WEATHER_LAT;
  const longitude = process.env.NEXT_PUBLIC_WEATHER_LON;

  const loadEnvironmentInfo = useCallback(async () => {
    try {
      const [nextWeather, nextTide] = await Promise.all([
        fetchWeather(latitude, longitude).catch(() => DEFAULT_WEATHER),
        fetchTide().catch(() => DEFAULT_TIDE),
      ]);

      setWeather(nextWeather);
      setTide(nextTide);
    } catch (error) {
      console.error("Erro ao carregar dados ambientais:", error);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      void loadEnvironmentInfo();
    }, 0);

    const interval = setInterval(loadEnvironmentInfo, 10 * 60 * 1000);

    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [loadEnvironmentInfo]);

  return { weather, tide };
}
