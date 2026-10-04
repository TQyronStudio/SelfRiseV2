# SelfRise V2 - Project Plan

> 📦 **Handoff**: Blueprinty zbývající práce (runtime ověření, Crashlytics, Achievements audit, N27/N28/N31, Sprint 4) + nebezpečné zóny: @handoff-blueprints.md

> 🧹 **Úklid 2026-07-14**: Dokončené sekce přesunuty do @implementation-history.md (viz index níže). Tento soubor drží už jen ROZPRACOVANÉ a PLÁNOVANÉ úkoly + trvalou referenci.

> 🚀 **Stav 2026-10-04**: aplikace má **ostrou verzi v App Store i Google Play**. Fáze 1–10
> hotové. Hotové úkoly a jejich historie: @projectplan-archive.md → „Úklid projectplan.md
> 2026-10-04". Odložené / neplánované věci: @projectplan-future-updates.md (Phase 0–11).

---

## 🎯 AKTUÁLNÍ ÚKOLY

*Žádný rozpracovaný úkol.* Nový úkol se zapisuje sem jako seznam odškrtávacích bodů
(pravidlo 4 v CLAUDE.md) s odkazem na technického průvodce.

---

## 🚨 DŮLEŽITÉ - NEMAZAT 🚨

### Cílová kvalita - TOP světová úroveň:
Aplikace MUSÍ být na špičkové úrovni ve všech aspektech:
- **Funkcionalita** - Bezchybná, intuitivní, rychlá
- **Design** - Moderní, elegantní, profesionální
- **Animace** - Smooth, přírodní, poutavé
- **UX** - Vynikající uživatelský zážitek srovnatelný s nejlepšími aplikacemi na trhu

### 🛠️ Future Skills Roadmap
Seznam Claude Code skills a MCP serverů pro instalaci v jednotlivých fázích projektu (Wave 1: TEĎ, Wave 2: před Phase 10, Wave 3: post-launch):
**Roadmap:** @future-skills-roadmap.md

---

## Project Overview
SelfRise V2 is a React Native mobile application built with Expo and TypeScript, focused on goal tracking, habit formation, and gratitude journaling. The app will feature internationalization (i18n) support with English as the default language and future support for German and Spanish.

## Core Features
- **Home**: Daily gratitude streak display and interactive habit statistics
- **Habits**: Habit creation, management, and tracking with customizable scheduling
- **My Journal**: Daily reflection with gratitude and self-praise entries
- **Goals**: Long-term goal setting with progress tracking
- **Settings**: Notifications, user authentication, and preferences

## Technical Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Bottom tab navigation
- **Styling**: Consistent light theme design
- **Data Storage**: Local storage with future Firebase integration

---

## Development Phases

- Phase 1: Core Foundation (navigace, Home) ✅
- Phase 2: Habit Tracking System ✅
- Phase 3: My Journal ✅
- Phase 4: Goals System ✅
- Phase 5: Gamification & XP System ✅
- Phase 6: Monthly Challenges ✅
- Phase 7: Settings & UX (notifikace, theme, jazyk) ✅
- Phase 8: External Services (Firebase, AdMob, ATT) ✅
- Phase 9: Testing & QA ✅ — 49 sad / 684 testů (2026-10-04)
- Phase 10: App Store & Google Play ✅ — ostrá verze v obou obchodech

*(Detailní checklisty → @projectplan-archive.md a @implementation-history.md)*

---

## ✅ Dokončené fáze (archiv)

SQLite migrace (SEKCE 1–4), Firebase Analytics + ATT (Phase 12), Tutorial Spotlight refaktoring (Skia), vyřešené Known Issues — vše hotové, detaily: @implementation-history.md a @projectplan-archive.md.

---

---

## 🔮 FUTURE UPDATES

Plánované a odložené funkce: **@projectplan-future-updates.md** (export a zálohy dat, FCM,
orchestrator Úroveň 2, Meta Ads & analytika, dojezd Fáze 13, „omezit pohyb" u XP bubliny…).
