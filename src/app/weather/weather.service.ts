import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { OpenMeteoForecastResponse, OpenMeteoGeocodingResponse } from './weather.types';

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);

  searchLocations(query: string): Observable<OpenMeteoGeocodingResponse> {
    const q = query.trim();
    const url = `${GEO_BASE}?name=${encodeURIComponent(q)}&count=8`;
    return this.http.get<OpenMeteoGeocodingResponse>(url);
  }

  getForecast(latitude: number, longitude: number): Observable<OpenMeteoForecastResponse> {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      timezone: 'auto',
      forecast_days: '8',
      current: ['temperature_2m', 'apparent_temperature', 'weather_code', 'precipitation', 'wind_speed_10m'].join(','),
      daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max', 'wind_speed_10m_max'].join(','),
    });
    const url = `${FORECAST_BASE}?${params.toString()}`;
    return this.http.get<OpenMeteoForecastResponse>(url);
  }
}
