import { Routes } from '@angular/router';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'weather',
    loadComponent: () => import('./weather/weather-forecast').then((m) => m.WeatherForecast),
  },
  { path: '**', redirectTo: '' },
];
