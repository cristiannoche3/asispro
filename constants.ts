

import { Period } from './types';

export const INSTITUTIONAL_COLORS = {
  BLUE: 'institucional-blue', // Defined in tailwind.config
  YELLOW: 'institucional-yellow',
  WHITE: 'institucional-white',
  TEXT_LIGHT: 'text-institucional-white',
  TEXT_DARK: 'text-gray-800',
};

export const DEFAULT_PERIODS: Period[] = [
  { id: 'period_1', name: 'Primer Periodo' },
  { id: 'period_2', name: 'Segundo Periodo' },
  { id: 'period_3', name: 'Tercer Periodo' },
];

export const APP_TITLE = "AsisPRO";
export const APP_SUBTITLE = "Colegio de la Presentación Santa Marta - Asignatura Informática";
export const FOOTER_TEXT = "Desarrollado para Colegio de la Presentación Santa Marta – Asignatura Informática";
export const AUTHOR_NAME = "Diseñado por el Licenciado en Informática Cristian Deivis Romero Noche";

export const CLASS_HOURS: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
export const COMPUTER_NUMBERS: number[] = Array.from({ length: 35 }, (_, i) => i + 1);


export const ALERT_THRESHOLD_UNEXCUSED_ABSENCES = 3;

// LOGO_TEXT is no longer needed as an image is used.