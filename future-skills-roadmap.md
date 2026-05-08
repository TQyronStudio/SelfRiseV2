# SelfRise V2 - Future Skills Roadmap

> **Účel dokumentu:** Centrální seznam všech užitečných Claude Code schopností (skills) a MCP serverů pro projekt SelfRise V2. Slouží jako paměť mezi konverzacemi, abychom v dlouhých chatech nezapomněli, co plánujeme instalovat a kdy.

**Strategie:** Postupná instalace ve 3 vlnách podle fáze projektu. Žádný token bloat, žádné zbytečné nástroje.

**Living document:** Aktualizuje se při každé instalaci/vytvoření skill nebo když se objeví nová potřeba.

---

## Legenda

| Status | Význam |
|--------|--------|
| ✅ **INSTALLED** | Aktivní a funkční v Claude Code |
| 🔧 **TO CREATE** | Je třeba vytvořit pomocí `skill-creator` |
| 🔍 **TO RESEARCH** | Existuje v komunitě, je třeba ověřit URL a kvalitu |
| ⏸️ **DEFERRED** | Odložené — nainstalovat až při potřebě |
| ❌ **SKIPPED (YAGNI)** | Rozhodli jsme nepoužívat |

| Priorita | Význam |
|----------|--------|
| 🔥 **CRITICAL** | Bez tohoto se neobejdeme |
| ⭐ **HIGH** | Velká úspora času |
| 💡 **NICE-TO-HAVE** | Pomůže, ale není nutné |

---

## ✅ Currently Installed

| Skill | Účel | Použití | Lokace |
|-------|------|---------|--------|
| **app-store-screenshots** | Generuje marketingové screenshoty pro App Store / Google Play | Phase 10 launch | Globální |
| **i18n-auditor** | Audit překladů EN/DE/ES, hardcoded stringy, neplatné t() klíče | Před commit/build | Project-local |
| **theme-validator** | Validace Light/Dark theme compliance, hardcoded barvy, shadows | Po UI změnách | Project-local |
| **app-icon-generator** | Generuje iOS/Android ikony z 1024×1024 master | Phase 10 launch | Project-local |

---

## 🌊 Wave 1 — INSTALL NOW (využijeme okamžitě)

Skills, které pomohou už při **aktuální vývojové práci**. Nízké riziko, vysoký užitek.

### 1. i18n-auditor 🔥 CRITICAL — ✅ INSTALLED (2026-05-01)
- **Co dělá:** Automaticky kontroluje synchronizaci překladů mezi `src/locales/en/`, `de/`, `es/`. Najde:
  - Chybějící klíče v DE/ES (existuje v EN, chybí jinde)
  - Hardcoded stringy v `.tsx` komponentech bez `t()` volání
  - Nepoužívané klíče (mrtvý kód)
  - Nesladěné struktury (klíč existuje na jiném místě)
- **Proč TEĎ:** Aplikace má 3 jazyky, riziko regresí roste. Phase 11 dokončila i18n, potřebujeme to udržet.
- **Závislosti:** Žádné — čistě statická analýza.
- **Odhad vytvoření:** ~1 hodina práce

### 2. theme-validator ⭐ HIGH — ✅ INSTALLED (2026-05-01)
- **Co dělá:** Najde porušení Theme & Color System pravidel:
  - Hardcoded barvy (`#FFFFFF`, `'white'`) místo `colors.text`
  - StyleSheet mimo komponenty (statické styly nepřizpůsobí téma)
  - `shadowColor`/`elevation` v komponentech (nemělo by být v Dark mode)
  - Pure black `#000000` použití (`colors.background`)
- **Proč TEĎ:** Light/Dark theme byl velký refaktor, hlídá konzistenci.
- **Závislosti:** Žádné.
- **Odhad vytvoření:** ~1.5 hodiny práce

### 3. app-icon-generator ⭐ HIGH — ✅ INSTALLED (2026-05-01)
- **Co dělá:** Z **1 master ikony 1024×1024** vygeneruje:
  - iOS icon set (všechny velikosti 20pt-1024pt)
  - Android adaptive icon (foreground + background layers)
  - Splash screen variants
  - Favicon pro web
- **Proč TEĎ (i když launch je daleko):** Jakmile se objeví finální design ikony, můžeš okamžitě vyzkoušet, jak vypadá v aplikaci. Ušetří hodiny pro Phase 10.
- **Závislosti:** Master ikona od designéra (nebo vygenerovaná AI).
- **Odhad vytvoření:** ~2 hodiny práce

---

## 🌊 Wave 2 — BEFORE PHASE 10 LAUNCH (2-3 týdny před vydáním)

Skills specifické pro **App Store + Google Play submission**. Instalovat až když se přiblížíme launch.

### 4. privacy-policy-builder 🔥 CRITICAL — 🔧 TO CREATE
- **Co dělá:** Generuje GDPR-compliant Privacy Policy dokument:
  - Přesně popisuje data zbíraná aplikací (Firebase Analytics, AdMob, AsyncStorage)
  - ATT (App Tracking Transparency) sekce pro iOS
  - Cookies/storage disclosure
  - Output ve **3 jazycích** (EN/DE/ES)
- **Proč CRITICAL:** Bez Privacy Policy **Apple ani Google neschválí** vydání aplikace.
- **Závislosti:** Seznam použitých 3rd-party služeb (máme zdokumentováno).
- **Odhad vytvoření:** ~2 hodiny práce

### 5. app-store-listing-writer 🔥 CRITICAL — 🔧 TO CREATE
- **Co dělá:** Píše ASO-optimalizovaný App Store / Google Play listing:
  - Title (max 30 znaků) — EN/DE/ES
  - Subtitle / Short description — EN/DE/ES
  - Full description s SEO klíčovými slovy — EN/DE/ES
  - Keywords field (iOS) — research-based
  - Promotional text — EN/DE/ES
- **Proč CRITICAL:** Špatný listing = nikdo aplikaci nenajde. ASO je 60% úspěchu launch.
- **Závislosti:** Keyword research (může být součástí skill).
- **Odhad vytvoření:** ~2.5 hodiny práce

### 6. splash-screen-generator ⭐ HIGH — 🔧 TO CREATE
- **Co dělá:** Vygeneruje splash screens pro iOS + Android adaptive splash:
  - Všechny velikosti zařízení
  - Light + Dark variants
  - Branded design konzistentní s ikonou
- **Závislosti:** Logo + brand colors.
- **Odhad vytvoření:** ~1 hodina práce

### 7. eas-build-orchestrator ⭐ HIGH — 🔧 TO CREATE
- **Co dělá:** Automatizuje EAS Build pipeline:
  - Auto-bump verze (semver) na základě commitů
  - Auto-výběr build profilu (development/preview/production)
  - Pre-build kontroly (TypeScript, i18n auditor, theme validator)
  - Post-build notifikace (build status)
  - Auto-upload do TestFlight / Internal Testing
- **Závislosti:** EAS account, Apple Developer + Google Play Console účty.
- **Odhad vytvoření:** ~3 hodiny práce

### 8. release-notes-generator ⭐ HIGH — 🔧 TO CREATE
- **Co dělá:** Z git commit historie vygeneruje:
  - User-facing changelog (ne technický!) — EN/DE/ES
  - In-app "What's New" modal content
  - Store update text
- **Závislosti:** Strukturované commit messages (Conventional Commits ideal).
- **Odhad vytvoření:** ~1.5 hodiny práce

---

## 🌊 Wave 3 — POST LAUNCH (marketing & growth)

Skills pro **růst, akvizici, retence**. Nainstalovat až po vydání, kdy budeme mít první uživatele a data.

### 9. firebase-analytics-dashboard 💡 NICE-TO-HAVE — 🔧 TO CREATE
- **Co dělá:** Vytvoří custom dashboard se smysluplnými metrikami pro habit tracking app:
  - DAU/MAU retention curve
  - Habit completion rates distribution
  - Streak distribution (kolik users má 7+ dní streak)
  - Funnel: install → onboarding → first habit → first week
  - XP/Level progression
- **Proč POST:** Dříve nemáme data k analýze.
- **Závislosti:** Firebase Analytics už integrované (Phase 12 ✅).

### 10. review-responder 💡 NICE-TO-HAVE — 🔧 TO CREATE
- **Co dělá:** Drafty odpovědí na App Store / Google Play recenze:
  - Personalizované podle obsahu recenze
  - Empatické, profesionální
  - Ve **3 jazycích** podle locale recenze
  - Návrh, jak řešit kritiku (bug → ticket, request → roadmap)

### 11. landing-page-builder 💡 NICE-TO-HAVE — 🔍 TO RESEARCH
- **Co dělá:** Vytvoří promo Next.js stránku pro selfrise.app:
  - Hero section s app screenshoty
  - Features showcase
  - App Store + Google Play badges
  - SEO-optimalizované
  - **3 jazyky**
- **Závislosti:** Vercel účet (deploy), doména.

### 12. press-kit-creator 💡 NICE-TO-HAVE — 🔧 TO CREATE
- **Co dělá:** Připraví kompletní press kit pro novináře / influencery:
  - Logo varianty (light/dark/transparent)
  - App ikony ve všech velikostech
  - Hero screenshoty
  - About-the-app text (EN/DE/ES)
  - Contact info, fact sheet

### 13. aso-keyword-research 💡 NICE-TO-HAVE — 🔧 TO CREATE
- **Co dělá:** Research klíčových slov pro habit tracker / journal niche:
  - Konkurenční analýza (top apps v kategorii)
  - Search volume + competition skóre
  - Long-tail keywords pro DE/ES trh
- **Pozn.:** Může být součástí `app-store-listing-writer`.

---

## 🤖 MCP Servers (Maximum Autonomy Boost)

MCP servery dávají Claude **přímý přístup k externím službám** — to je ten největší skok v autonomii. Ale **vyžadují účty + API klíče**.

### 14. App Store Connect API MCP 🔥 CRITICAL — 🔍 TO RESEARCH
- **Co umožní:**
  - Auto-upload buildů do App Store Connect
  - Auto-vyplnění metadata (description, screenshots, keywords)
  - Submission for review bez tvého klikání
  - Monitoring review status
- **Závislosti:** Apple Developer account + API klíč (issuer ID, key ID).
- **Hodnota:** **Obrovská** — ušetří dny manuální práce při každém release.

### 15. Google Play Console API MCP 🔥 CRITICAL — 🔍 TO RESEARCH
- **Co umožní:** Stejné jako Apple, jen pro Android.
- **Závislosti:** Google Play Console + service account JSON.

### 16. GitHub MCP ⭐ HIGH — 🔍 TO RESEARCH
- **Co umožní:**
  - Auto-create issues / PRs / milestones
  - Automated triage komentáře
  - Branch management
- **Závislosti:** GitHub Personal Access Token.

### 17. Sentry MCP ⭐ HIGH — 🔍 TO RESEARCH
- **Co umožní:**
  - Číst crash reporty + auto-triage
  - Linkovat crashes na konkrétní commits
  - Auto-create GitHub issues z fatálních chyb
- **Závislosti:** Sentry účet + DSN.
- **Pozn.:** Aktuálně používáme Firebase Crashlytics — Sentry je alternativa.

### 18. Vercel MCP 💡 NICE-TO-HAVE — 🔍 TO RESEARCH
- **Co umožní:** Deploy landing page bez tvého zásahu.
- **Závislosti:** Vercel účet + token.
- **Použití:** Až budeme dělat landing page (Wave 3).

### 19. DeepL Translate MCP 💡 NICE-TO-HAVE — 🔍 TO RESEARCH
- **Co umožní:** Profesionální překlady DE/ES s validací kontextu.
- **Závislosti:** DeepL API klíč (placený plán pro production).
- **Pozn.:** Aktuálně překlady děláme ručně/AI — DeepL je vyšší kvalita.

---

## ❌ Skipped (YAGNI — neinstalujeme)

Skills, které jsme rozhodli **nepoužívat** pro tento projekt:

| Skill | Důvod skip |
|-------|-----------|
| reddit-marketing-helper | Žádný plán Reddit kampaně |
| product-hunt-launch-kit | Strategie launch ještě nedefinována |
| influencer-outreach-template | Marketing strategy zatím neexistuje |
| email-marketing-template | Email kampaně nejsou v roadmap (žádný backend pro email collection) |
| visual-regression-testing | Pro mobile app komplikované — místo toho používáme manuální QA |

**Pozn.:** Pokud se priority změní, vrátíme je sem zpět.

---

## 📋 Quick Action Checklist

### Tento týden (Wave 1)
- [x] Vytvořit `i18n-auditor` skill ✅ (2026-05-01)
- [x] Vytvořit `theme-validator` skill ✅ (2026-05-01)
- [x] Vytvořit `app-icon-generator` skill ✅ (2026-05-01) — čeká na master ikonu

### 2-3 týdny před Phase 10
- [ ] Vytvořit `privacy-policy-builder`
- [ ] Vytvořit `app-store-listing-writer`
- [ ] Vytvořit `splash-screen-generator`
- [ ] Vytvořit `eas-build-orchestrator`
- [ ] Vytvořit `release-notes-generator`
- [ ] Setup Apple Developer + API klíč → research App Store Connect MCP
- [ ] Setup Google Play Console → research Google Play MCP

### Po launch (Phase 10+)
- [ ] Vytvořit `firebase-analytics-dashboard`
- [ ] Vytvořit `review-responder`
- [ ] Research `landing-page-builder`
- [ ] Vytvořit `press-kit-creator`

---

## 🔄 Revize roadmap

**Pravidla pro aktualizaci:**

1. **Při instalaci/vytvoření skill** → změň status na ✅ INSTALLED + datum
2. **Při objevení nové potřeby** → přidej do správné vlny (Wave 1/2/3)
3. **Když se skill ukáže jako nepotřebný** → přesuň do "Skipped" s důvodem
4. **Před každou novou fází projektu** → projdi roadmap a re-prioritizuj

**Reference v projectplan.md:** Sekce "Future Skills Roadmap" → @future-skills-roadmap.md

---

*Last updated: 2026-05-01*
*Next review: Před začátkem Phase 10 přípravy*
