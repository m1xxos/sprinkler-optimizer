# Stardew Valley Sprinkler Optimizer

Веб-приложение для оптимизации расстановки спринклеров и пугал на фермах
Stardew Valley. / A web app to optimize sprinkler & scarecrow placement on
Stardew Valley farms.

## Возможности / Features

- Все официальные карты ферм (Standard, Riverland, Forest, Hill-top,
  Wilderness, Four Corners, Beach) с реальными изображениями и точной сеткой
  клеток под посадку.
- Ручная расстановка: обычный / качественный / иридиевый спринклер, насадка
  давления (pressure nozzle), обычное и делюкс-пугало.
- Подсветка зон полива (синий) и защиты пугал (зелёный).
- Автооптимизатор (в Web Worker): по заданному инвентарю максимизирует покрытие,
  с приоритетом области у фермерского дома.
- Выделение зоны и авто-подсчёт клеток под посадку.
- Двуязычный интерфейс (RU / EN).

## Разработка / Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # производственная сборка в dist/
npm run preview  # предпросмотр сборки
```

Управление картой: колесо мыши — зум, перетаскивание правой кнопкой — панорама,
левая кнопка — установка/выделение.

## Данные карт / Map data

Карты и данные клеток под посадку генерируются из проекта
[stardewplanner](https://github.com/hpeinar/stardewplanner) (Apache 2.0).
Скрипт: `scripts/gen-maps.mjs` (см. `public/maps/CREDITS.md`).

## Деплой / Deploy

Пуш в ветку `main` автоматически собирает и публикует на GitHub Pages
(workflow `.github/workflows/deploy.yml`). В настройках репозитория включите
Pages → Source: **GitHub Actions**. `base` в `vite.config.ts` относительный
(`./`), поэтому работает на любом субпути.
