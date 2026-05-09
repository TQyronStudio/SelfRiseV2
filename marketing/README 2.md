# Marketing Assets — SelfRise V2

Pracovní složka pro přípravu marketingových materiálů (App Store, Google Play, sociální sítě, web).

## Struktura

```
marketing/
├── raw/        ← VSTUP: Surové screenshoty z fyzického zařízení
└── final/      ← VÝSTUP: Hotové marketingové screenshoty (App Store ready)
```

**Záměr:** Začínáme s 2 složkami pro jednoduchost. Pokud workflow funguje, rozdělíme později podle:
- Platforma: `ios/`, `android/`
- Velikost zařízení: `phone/`, `tablet/`
- Jazyk: `en/`, `de/`, `es/`

## Workflow

### 1️⃣ Vstup (`raw/`)
- Surové screenshoty pořízené **na fyzickém zařízení** (s dev buildem)
- Obvykle obsahují: status bar, notifikace, AdMob banner, atd.
- Doporučené pojmenování: `home-screen.png`, `habits.png`, `journal.png`
- Doporučené pořízení:
  - Zapnutý režim **„Nerušit"** (skryje notifikační tečky)
  - **Demo data** připravená (pěkné streaks, vyplněné návyky, atd.)
  - Zvolené **téma** (Light/Dark) podle potřeby

### 2️⃣ Zpracování (Claude)
Claude provede:
- ✨ **Clean status bar overlay** (9:41, plná baterie, plný signál — Apple standard)
- ✂️ **Oříznutí / skrytí AdMob banneru**
- 📱 **Aplikace iPhone rámečku** (skill `app-store-screenshots`)
- 🎨 **Marketingový design** (pozadí, slogan, branding)
- 📐 **Export ve správné velikosti** podle App Store requirements

### 3️⃣ Výstup (`final/`)
Hotové screenshoty připravené k uploadu do App Store Connect / Google Play Console:
- **iPhone 6.7"** (Pro Max): 1290×2796 px (povinné pro iOS)
- **iPhone 6.5"** (Plus): 1284×2778 px
- **iPad Pro 12.9"**: 2048×2732 px

## Konvence pojmenování (final)

```
{screen}-{language}-{theme}-{device}.png

Příklady:
home-en-light-iphone67.png
habits-de-dark-iphone67.png
journal-es-light-ipad129.png
```

## Související dokumentace

- App Store screenshot skill: globální Claude Code skill `app-store-screenshots`
- Phase 10 plán: viz `projectplan.md` → "Phase 10: App Store & Google Play Preparation"
- Roadmap budoucích skills: `future-skills-roadmap.md`

---

*Last updated: 2026-05-01*
