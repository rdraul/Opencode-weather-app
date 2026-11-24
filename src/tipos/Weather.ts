export interface CurrentWeather {
  temperature: number;
  time: string | null;
}

export interface ForecastDay {
  date: string;
  max: number;
  min: number;
  code: number;
}
