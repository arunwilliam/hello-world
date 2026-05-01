import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { describeWeatherCode } from './weather-codes';
import { WeatherService } from './weather.service';
import type { GeoResult } from './weather.types';
import type { OpenMeteoForecastResponse } from './weather.types';

const DEFAULT_LOCATION: GeoResult = {
  name: 'London',
  latitude: 51.5085,
  longitude: -0.1257,
  country: 'United Kingdom',
};

export interface DailyRow {
  date: string;
  weatherCode: number;
  maxC: number;
  minC: number;
  precipPct: number | null;
  windKmh: number | null;
}

@Component({
  selector: 'app-weather-forecast',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './weather-forecast.html',
  styleUrl: './weather-forecast.scss',
})
export class WeatherForecast implements OnInit {
  private readonly weather = inject(WeatherService);
  private forecastRequestSeq = 0;

  protected readonly forecast = signal<OpenMeteoForecastResponse | undefined>(undefined);
  protected readonly loading = signal(false);
  protected readonly geoLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchError = signal<string | null>(null);
  protected readonly selectedPlace = signal<GeoResult>(DEFAULT_LOCATION);
  protected readonly searchResults = signal<GeoResult[]>([]);
  protected searchQuery = '';

  protected readonly describeCode = describeWeatherCode;

  protected readonly dailyRows = computed<DailyRow[]>(() => {
    const d = this.forecast()?.daily;
    if (!d?.time?.length) return [];
    return d.time.map((date, i) => ({
      date,
      weatherCode: d.weather_code[i] ?? 0,
      maxC: d.temperature_2m_max[i] ?? 0,
      minC: d.temperature_2m_min[i] ?? 0,
      precipPct: d.precipitation_probability_max?.[i] ?? null,
      windKmh: d.wind_speed_10m_max?.[i] ?? null,
    }));
  });

  ngOnInit(): void {
    this.fetchForecast(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
  }

  protected searchPlaces(): void {
    const q = this.searchQuery.trim();
    if (q.length < 2) {
      this.searchError.set('Enter at least 2 letters.');
      return;
    }
    this.searchError.set(null);
    this.searchResults.set([]);
    this.geoLoading.set(true);
    this.weather
      .searchLocations(q)
      .pipe(finalize(() => this.geoLoading.set(false)))
      .subscribe({
        next: (res) => {
          const list = res.results ?? [];
          if (!list.length) {
            this.searchError.set('No places matched that name.');
            return;
          }
          this.searchResults.set(list);
          if (list.length === 1) {
            this.applyLocation(list[0]);
          }
        },
        error: () => this.searchError.set('Search failed — try again later.'),
      });
  }

  protected pickSearchResult(place: GeoResult): void {
    this.applyLocation(place);
    this.searchResults.set([]);
    this.searchQuery = `${place.name}${place.country ? ', ' + place.country : ''}`;
  }

  protected useMyLocation(): void {
    if (!navigator.geolocation) {
      this.searchError.set('Geolocation is not supported in this browser.');
      return;
    }
    this.geoLoading.set(true);
    this.searchError.set(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.geoLoading.set(false);
        const place: GeoResult = {
          name: 'Your location',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        this.applyLocation(place);
        this.searchResults.set([]);
      },
      () => {
        this.geoLoading.set(false);
        this.searchError.set('Could not read your location. Check browser permissions.');
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  protected refresh(): void {
    const p = this.selectedPlace();
    this.fetchForecast(p.latitude, p.longitude);
  }

  protected placeLabel(place: GeoResult): string {
    const parts = [place.name, place.admin1, place.country].filter(Boolean);
    return parts.join(', ');
  }

  private applyLocation(place: GeoResult): void {
    this.selectedPlace.set(place);
    this.fetchForecast(place.latitude, place.longitude);
  }

  private fetchForecast(lat: number, lon: number): void {
    const seq = ++this.forecastRequestSeq;
    this.loading.set(true);
    this.error.set(null);
    this.weather
      .getForecast(lat, lon)
      .pipe(finalize(() => seq === this.forecastRequestSeq && this.loading.set(false)))
      .subscribe({
        next: (data) => {
          if (seq !== this.forecastRequestSeq) return;
          this.forecast.set(data);
        },
        error: () => {
          if (seq !== this.forecastRequestSeq) return;
          this.error.set('Could not load weather from Open‑Meteo. Try again later.');
        },
      });
  }
}
