export type Lang = 'ru' | 'en';

export const STRINGS = {
  appTitle: { ru: 'Оптимизатор спринклеров Stardew Valley', en: 'Stardew Valley Sprinkler Optimizer' },
  farm: { ru: 'Ферма', en: 'Farm' },
  language: { ru: 'Язык', en: 'Language' },
  inventory: { ru: 'Инвентарь', en: 'Inventory' },
  palette: { ru: 'Палитра', en: 'Palette' },
  erase: { ru: 'Стереть', en: 'Erase' },
  optimize: { ru: 'Оптимизировать', en: 'Optimize' },
  optimizing: { ru: 'Оптимизация…', en: 'Optimizing…' },
  clear: { ru: 'Очистить', en: 'Clear' },
  zone: { ru: 'Зона', en: 'Zone' },
  selectZone: { ru: 'Выделить зону', en: 'Select zone' },
  clearZone: { ru: 'Сбросить зону', en: 'Clear zone' },
  wholeFarm: { ru: 'Вся ферма', en: 'Whole farm' },
  plantableInZone: { ru: 'Клеток под посадку', en: 'Plantable tiles' },
  stats: { ru: 'Статистика', en: 'Stats' },
  watered: { ru: 'Полито', en: 'Watered' },
  protected: { ru: 'Защищено', en: 'Protected' },
  used: { ru: 'Использовано', en: 'Used' },
  basic: { ru: 'Спринклер', en: 'Sprinkler' },
  quality: { ru: 'Качественный спринклер', en: 'Quality Sprinkler' },
  iridium: { ru: 'Иридиевый спринклер', en: 'Iridium Sprinkler' },
  scarecrow: { ru: 'Пугало', en: 'Scarecrow' },
  deluxe_scarecrow: { ru: 'Делюкс-пугало', en: 'Deluxe Scarecrow' },
  nozzle: { ru: 'Насадка давления', en: 'Pressure Nozzle' },
  nozzleHint: {
    ru: 'Клик по спринклеру переключает насадку',
    en: 'Click a sprinkler to toggle its nozzle',
  },
  placeHint: {
    ru: 'Выберите предмет и кликайте по клеткам',
    en: 'Pick an item and click tiles',
  },
  panHint: {
    ru: 'Колесо — зум, перетаскивание правой кнопкой — панорама',
    en: 'Wheel to zoom, right-drag to pan',
  },
  loading: { ru: 'Загрузка карты…', en: 'Loading map…' },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang];
}
