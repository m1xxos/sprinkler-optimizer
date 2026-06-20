import type { FarmMeta } from '../types';

const base = import.meta.env.BASE_URL;

export const FARMS: FarmMeta[] = [
  { id: 'standard', nameRu: 'Стандартная', nameEn: 'Standard', data: `${base}maps/standard.json` },
  { id: 'riverland', nameRu: 'Речная', nameEn: 'Riverland', data: `${base}maps/riverland.json` },
  { id: 'forest', nameRu: 'Лесная', nameEn: 'Forest', data: `${base}maps/forest.json` },
  { id: 'hilltop', nameRu: 'Холмистая', nameEn: 'Hill-top', data: `${base}maps/hilltop.json` },
  { id: 'wilderness', nameRu: 'Дикая', nameEn: 'Wilderness', data: `${base}maps/wilderness.json` },
  { id: 'fourcorners', nameRu: 'Четыре угла', nameEn: 'Four Corners', data: `${base}maps/fourcorners.json` },
  { id: 'beach', nameRu: 'Пляжная', nameEn: 'Beach', data: `${base}maps/beach.json` },
  { id: 'meadowlands', nameRu: 'Луговая', nameEn: 'Meadowlands', data: `${base}maps/meadowlands.json` },
  { id: 'ginger', nameRu: 'Имбирный остров', nameEn: 'Ginger Island', data: `${base}maps/ginger.json` },
];

export function farmName(meta: FarmMeta, lang: 'ru' | 'en'): string {
  return lang === 'ru' ? meta.nameRu : meta.nameEn;
}
