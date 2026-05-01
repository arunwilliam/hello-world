/** Open-Meteo forecast API subset — https://open-meteo.com/en/docs */
export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  current?: CurrentWeather;
  daily?: DailyForecast;
}

export interface CurrentWeather {
  time: string;
  interval?: number;
  temperature_2m: number;
  apparent_temperature?: number;
  weather_code: number;
  precipitation?: number;
  wind_speed_10m?: number;
}

export interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
}

/** Geocoding API — https://open-meteo.com/en/docs/geocoding-api */
export interface OpenMeteoGeocodingResponse {
  results?: GeoResult[];
}

export interface GeoResult {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}
