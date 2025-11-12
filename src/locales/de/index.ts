import { TranslationKeys } from '../../types/i18n';

/**
 * German (Deutsch) Translations
 *
 * Status: Work in Progress
 * Coverage: Partial - many keys will fall back to English
 *
 * Translation Strategy:
 * - Keys with [EN] prefix are not yet translated (fallback to English)
 * - Keys without prefix are fully translated
 * - Gradually translate based on priority (see i18n-migration-tracker.md)
 */

const de: Partial<TranslationKeys> = {
  // Navigation
  tabs: {
    home: 'Startseite',
    habits: 'Gewohnheiten',
    journal: 'Mein Tagebuch',
    goals: 'Ziele',
    achievements: 'Erfolge',
    settings: 'Einstellungen',
  },

  // Settings screen - Language section (PRIORITY 1)
  settings: {
    title: 'Einstellungen',

    // Appearance
    appearance: 'Erscheinungsbild',
    theme: 'Theme',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeSystem: 'System Auto',
    themeDescription: 'Wählen Sie Ihr bevorzugtes Farbschema',
    themeSystemDescription: 'Entspricht Ihren Geräteeinstellungen',

    // Language
    language: 'Sprache',
    languageDescription: 'Wählen Sie Ihre bevorzugte Sprache',
    languageEnglish: 'English',
    languageGerman: 'Deutsch',
    languageSpanish: 'Español',

    // Notifications
    notifications: 'Benachrichtigungen',
    morningNotification: 'Morgenbenachrichtigung',
    eveningNotification: 'Abendbenachrichtigung',

    // Account
    account: 'Konto',
    login: 'Anmelden',
    register: 'Registrieren',
    logout: 'Abmelden',

    // About
    about: 'Über',
    version: 'Version',
    privacyPolicy: 'Datenschutzrichtlinie',
    termsOfService: 'Nutzungsbedingungen',

    // Tutorial
    tutorialReset: 'Tutorial neustarten',
    tutorialResetDescription: 'Tutorial von vorne beginnen',
    tutorialResetConfirmTitle: 'Tutorial neustarten?',
    tutorialResetConfirmMessage: 'Dies startet das Tutorial von Anfang an neu. Diese Aktion kann nicht rückgängig gemacht werden.',
    tutorialResetSuccess: 'Tutorial wurde erfolgreich neu gestartet!',

    // Common
    cancel: 'Abbrechen',
    reset: 'Neustarten',
  } as any,

  // Common
  common: {
    save: 'Speichern',
    saving: 'Speichern...',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    create: 'Erstellen',
    update: 'Aktualisieren',
    confirm: 'Bestätigen',
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
    retry: 'Wiederholen',
    ok: 'OK',
    done: 'Fertig',
    back: 'Zurück',
    next: 'Weiter',
    skip: 'Überspringen',
    close: 'Schließen',
    continue: 'Fortfahren',
    yes: 'Ja',
    no: 'Nein',
  } as any,

  // Days of week
  days: {
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag',
    short: {
      monday: 'Mo',
      tuesday: 'Di',
      wednesday: 'Mi',
      thursday: 'Do',
      friday: 'Fr',
      saturday: 'Sa',
      sunday: 'So',
    },
  } as any,

  // Achievements - All 78 achievements translated to German
  achievements: {
    // HABITS ACHIEVEMENTS (8 achievements)
    first_habit: {
      name: 'Erste Schritte',
      description: 'Erstelle deine allererste Gewohnheit und beginne deine Reise zur Selbstverbesserung'
    },
    habit_builder: {
      name: 'Gewohnheits-Baumeister',
      description: 'Erstelle 5 verschiedene Gewohnheiten, um deine persönliche Entwicklung zu diversifizieren'
    },
    century_club: {
      name: 'Century Club',
      description: 'Schließe 100 Gewohnheitsaufgaben ab - tritt den Elite-Reihen der konsequenten Leistungsträger bei'
    },
    consistency_king: {
      name: 'König der Beständigkeit',
      description: 'Schließe 1000 Gewohnheitsaufgaben ab - du bist der Meister der Beständigkeit'
    },
    streak_champion: {
      name: 'Gewohnheits-Serien-Champion',
      description: 'Erreiche eine 21-Tage-Serie mit jeder einzelnen Gewohnheit - baue dauerhafte Veränderung auf'
    },
    century_streak: {
      name: 'Jahrhundert-Serie',
      description: 'Halte eine 75-Tage-Serie mit jeder Gewohnheit aufrecht - nähere dich dem legendären Status'
    },
    multi_tasker: {
      name: 'Multitasker',
      description: 'Schließe 5 verschiedene Gewohnheiten an einem einzigen Tag ab - zeige vielfältiges Engagement'
    },
    habit_legend: {
      name: 'Gewohnheits-Legende',
      description: 'Erreiche Level 50 "Spezialist V" mit XP, die hauptsächlich aus Gewohnheitsaktivitäten verdient wurden - wahre Meisterschaft'
    },

    // JOURNAL ACHIEVEMENTS (33 achievements)
    first_journal: {
      name: 'Erste Reflexion',
      description: 'Schreibe deinen ersten Dankbarkeitstagebuch-Eintrag und beginne mit der Achtsamkeitspraxis'
    },
    deep_thinker: {
      name: 'Tiefgründiger Denker',
      description: 'Schreibe einen Tagebuch-Eintrag mit mindestens 200 Zeichen - zeige deine Nachdenklichkeit'
    },
    journal_enthusiast: {
      name: 'Tagebuch-Enthusiast',
      description: 'Schreibe 100 Tagebuch-Einträge - du baust eine wunderbare Gewohnheit der Reflexion auf'
    },
    gratitude_guru: {
      name: 'Dankbarkeits-Guru',
      description: 'Erreiche eine 30-Tage-Serie beim Tagebuch-Schreiben - du bist ein Meister der täglichen Reflexion'
    },
    eternal_gratitude: {
      name: 'Ewige Dankbarkeit',
      description: 'Halte eine 100-Tage-Tagebuch-Serie aufrecht - deine Dankbarkeitspraxis ist legendär'
    },
    bonus_seeker: {
      name: 'Bonus-Sucher',
      description: 'Schreibe 50 Bonus-Tagebuch-Einträge - du gehst in deiner Dankbarkeitspraxis über dich hinaus'
    },
    journal_streaker: {
      name: 'Dankbarkeits-Wächter',
      description: 'Schreibe 21 aufeinanderfolgende Tage in dein Tagebuch'
    },
    triple_crown: {
      name: 'Dreifache Krone',
      description: 'Halte gleichzeitig 7+ Tage Serien in Gewohnheiten, Tagebuch und Zielen aufrecht'
    },
    lightning_start: {
      name: 'Blitzstart',
      description: 'Erstelle und schließe 3 Mal am selben Tag eine Gewohnheit ab - sofortiger Tatmensch'
    },
    first_star: {
      name: 'Erster Stern',
      description: 'Erhalte deinen ersten Stern (erster Bonus-Eintrag des Tages) - entdecke erweiterte Dankbarkeit'
    },
    five_stars: {
      name: 'Fünf Sterne',
      description: 'Erhalte insgesamt 5 Mal einen Stern - regelmäßige Erweiterung der Dankbarkeitspraxis'
    },
    flame_achiever: {
      name: 'Flammen-Erreicher',
      description: 'Erhalte deine erste Flamme (5 Boni an einem Tag) - ein Tag intensiver Dankbarkeit und Reflexion'
    },
    bonus_week: {
      name: 'Bonus-Woche',
      description: '7 Tage in Folge mindestens 1 Bonus jeden Tag - eine Woche konsequenter erweiterter Praxis'
    },
    crown_royalty: {
      name: 'Kronen-Königtum',
      description: 'Erhalte deine erste Krone (10 Boni an einem Tag) - Höhepunkttag der Reflexion mit königlichem Status'
    },
    flame_collector: {
      name: 'Flammen-Sammler',
      description: 'Erhalte insgesamt 5 Mal Flammen - Meister der intensiven Dankbarkeitstage'
    },
    golden_bonus_streak: {
      name: 'Goldene Bonus-Serie',
      description: '7 Tage in Folge mindestens 3 Boni jeden Tag - eine Woche tiefer und erweiterter Reflexion'
    },
    triple_crown_master: {
      name: 'Dreifacher Kronen-Meister',
      description: 'Erhalte insgesamt 3 Mal Kronen - legendärer Meister der königlichen Reflexionstage'
    },
    bonus_century: {
      name: 'Bonus-Jahrhundert',
      description: 'Schreibe insgesamt 200 Bonus-Einträge - ultimativer Meister der erweiterten Dankbarkeitspraxis'
    },
    star_beginner: {
      name: 'Stern-Anfänger',
      description: 'Erhalte insgesamt 10 Mal Sterne - beginnender Sammler von Bonus-Erfahrungen'
    },
    star_collector: {
      name: 'Stern-Sammler',
      description: 'Erhalte insgesamt 25 Mal Sterne - regelmäßiger Erweiterer der Dankbarkeitspraxis'
    },
    star_master: {
      name: 'Stern-Meister',
      description: 'Erhalte insgesamt 50 Mal Sterne - Meister der erweiterten täglichen Reflexion'
    },
    star_champion: {
      name: 'Stern-Champion',
      description: 'Erhalte insgesamt 100 Mal Sterne - Champion der langfristigen erweiterten Praxis'
    },
    star_legend: {
      name: 'Stern-Legende',
      description: 'Erhalte insgesamt 200 Mal Sterne - legendärer Meister der Bonus-Erfahrungen'
    },
    flame_starter: {
      name: 'Flammen-Starter',
      description: 'Erhalte insgesamt 5 Mal Flammen - beginnender Meister der intensiven Tage'
    },
    flame_accumulator: {
      name: 'Flammen-Akkumulator',
      description: 'Erhalte insgesamt 10 Mal Flammen - Sammler außergewöhnlicher Dankbarkeitstage'
    },
    flame_master: {
      name: 'Flammen-Meister',
      description: 'Erhalte insgesamt 25 Mal Flammen - Meister systematischer intensiver Tage'
    },
    flame_champion: {
      name: 'Flammen-Champion',
      description: 'Erhalte insgesamt 50 Mal Flammen - Champion der tiefen täglichen Reflexion'
    },
    flame_legend: {
      name: 'Flammen-Legende',
      description: 'Erhalte insgesamt 100 Mal Flammen - legendärer Meister der intensiven Dankbarkeitspraxis'
    },
    crown_achiever: {
      name: 'Kronen-Erreicher',
      description: 'Erhalte insgesamt 3 Mal Kronen - erreiche königliche Reflexionstage'
    },
    crown_collector: {
      name: 'Kronen-Sammler',
      description: 'Erhalte insgesamt 5 Mal Kronen - Sammler königlicher Dankbarkeitserfahrungen'
    },
    crown_master: {
      name: 'Kronen-Meister',
      description: 'Erhalte insgesamt 10 Mal Kronen - Meister der königlichen Reflexion'
    },
    crown_champion: {
      name: 'Kronen-Champion',
      description: 'Erhalte insgesamt 25 Mal Kronen - Champion der königlichen Dankbarkeitstage'
    },
    crown_emperor: {
      name: 'Kronen-Kaiser',
      description: 'Erhalte insgesamt 50 Mal Kronen - kaiserlicher Status in der tiefen Reflexionspraxis'
    },

    // GOALS ACHIEVEMENTS (8 achievements)
    first_goal: {
      name: 'Erste Vision',
      description: 'Setze dein erstes Ziel und definiere, wohin deine Reise führen soll'
    },
    goal_getter: {
      name: 'Ziel-Erreicher',
      description: 'Schließe dein erstes Ziel ab - du verwandelst Träume in Realität'
    },
    goal_champion: {
      name: 'Ziel-Champion',
      description: 'Schließe 5 Ziele ab - du wirst zum Meister der Leistung'
    },
    ambitious: {
      name: 'Ehrgeizig',
      description: 'Setze ein Ziel mit einem Zielwert von 1000 oder mehr - du träumst groß'
    },
    progress_tracker: {
      name: 'Fortschritts-Tracker',
      description: 'Mache 7 aufeinanderfolgende Tage Fortschritte bei Zielen - Beständigkeit führt zum Erfolg'
    },
    mega_dreamer: {
      name: 'Mega-Träumer',
      description: 'Setze ein Ziel mit einem Zielwert von 1.000.000 oder mehr - du träumst in Millionen'
    },
    million_achiever: {
      name: 'Millionen-Erreicher',
      description: 'Schließe ein Ziel mit einem Zielwert von 1.000.000 oder mehr ab - du verwandelst massive Träume in Realität'
    },
    goal_achiever: {
      name: 'Traum-Erfüller',
      description: 'Schließe 3 Ziele ab - du verwandelst Träume in Realität'
    },

    // CONSISTENCY ACHIEVEMENTS (6 achievements)
    weekly_warrior: {
      name: 'Wöchentlicher Krieger',
      description: 'Halte eine 7-Tage-Serie in jeder Gewohnheit aufrecht - beweise deine Hingabe'
    },
    monthly_master: {
      name: 'Monatlicher Meister',
      description: 'Erreiche eine 30-Tage-Serie - du baust wirklich dauerhafte Gewohnheiten auf'
    },
    hundred_days: {
      name: 'Zenturio',
      description: 'Erreiche 100 Tage Beständigkeit - tritt den Elite-Reihen der Gewohnheitsmeister bei'
    },
    daily_visitor: {
      name: 'Täglicher Besucher',
      description: 'Nutze die App 7 aufeinanderfolgende Tage - baue eine gesunde Gewohnheit auf'
    },
    dedicated_user: {
      name: 'Engagierter Nutzer',
      description: 'Nutze die App 30 aufeinanderfolgende Tage - dein Engagement ist inspirierend'
    },
    perfect_month: {
      name: 'Perfekter Monat',
      description: 'Schließe Aktivitäten in allen 3 Bereichen (Gewohnheiten, Tagebuch, Ziele) für 28+ Tage in einem beliebigen Monat ab'
    },

    // MASTERY ACHIEVEMENTS (9 achievements)
    level_up: {
      name: 'Level Up',
      description: 'Erreiche Level 10 "Anfänger V" - du wirst stärker'
    },
    selfrise_expert: {
      name: 'SelfRise-Experte',
      description: 'Erreiche Level 25 "Adept V" - du hast die Grundlagen gemeistert'
    },
    selfrise_master: {
      name: 'SelfRise-Meister',
      description: 'Erreiche Level 50 "Spezialist V" - du bist ein wahrer Meister der Selbstverbesserung'
    },
    recommendation_master: {
      name: 'Empfehlungs-Meister',
      description: 'Folge 20 personalisierten Empfehlungen aus dem Für dich-Bereich'
    },
    balance_master: {
      name: 'Balance-Meister',
      description: 'Nutze alle 3 Funktionen (Gewohnheiten, Tagebuch, Ziele) an einem einzigen Tag 10 Mal'
    },
    trophy_collector_basic: {
      name: 'Trophäen-Sammler',
      description: 'Schalte 10 Erfolge frei - du baust eine beeindruckende Sammlung auf'
    },
    trophy_collector_master: {
      name: 'Trophäen-Meister',
      description: 'Schalte 25 Erfolge frei - dein Trophäenraum ist legendär'
    },
    ultimate_selfrise_legend: {
      name: 'Ultimative SelfRise-Legende',
      description: 'Erreiche Level 100 "Mythisch V" - du hast die ultimative Meisterschaft der Selbstverbesserung erreicht'
    },
    loyalty_ultimate_veteran: {
      name: 'Ultimativer Veteran',
      description: 'Insgesamt 500 aktive Tage - deine Hingabe ist unübertroffen'
    },

    // SPECIAL ACHIEVEMENTS (14 achievements)
    grateful_heart: {
      name: 'Dankbares Herz',
      description: 'Halte eine 7-Tage-Tagebuchschreib-Serie aufrecht - Beständigkeit baut Dankbarkeit auf'
    },
    achievement_unlocked: {
      name: 'Erfolg Freigeschaltet',
      description: 'Schließe 10 Ziele ab - du bist ein legendärer Ziel-Erreicher'
    },
    seven_wonder: {
      name: 'Siebtes Weltwunder',
      description: 'Habe gleichzeitig 7 oder mehr aktive Gewohnheiten - Meister der Organisation'
    },
    persistence_pays: {
      name: 'Beharrlichkeit Zahlt Sich Aus',
      description: 'Setze die Aktivität nach einer 3+ Tage Pause fort und schließe 7 Aktivitäten ab - Comeback-Champion'
    },
    legendary_master: {
      name: 'SelfRise-Legende',
      description: 'Erreiche Meisterschaft in allen Bereichen: 10 abgeschlossene Ziele, 500 erledigte Gewohnheiten, 365 Tagebuch-Einträge'
    },
    loyalty_first_week: {
      name: 'Erste Woche',
      description: 'Insgesamt 7 aktive Tage - Beginn deiner Loyalitätsreise'
    },
    loyalty_two_weeks_strong: {
      name: 'Zwei Wochen Stark',
      description: 'Insgesamt 14 aktive Tage - deine Hingabe wächst'
    },
    loyalty_three_weeks_committed: {
      name: 'Drei Wochen Engagiert',
      description: 'Insgesamt 21 aktive Tage - engagiert für dein Wachstum'
    },
    loyalty_month_explorer: {
      name: 'Monats-Entdecker',
      description: 'Insgesamt 30 aktive Tage - erkunde dein Potenzial'
    },
    loyalty_two_month_veteran: {
      name: 'Zwei-Monats-Veteran',
      description: 'Insgesamt 60 aktive Tage - erfahren in persönlichem Wachstum'
    },
    loyalty_century_user: {
      name: 'Jahrhundert-Nutzer',
      description: 'Insgesamt 100 aktive Tage - unter den Elite-Nutzern'
    },
    loyalty_half_year_hero: {
      name: 'Halbjahres-Held',
      description: 'Insgesamt 183 aktive Tage - dein Engagement ist legendär'
    },
    loyalty_year_legend: {
      name: 'Jahres-Legende',
      description: 'Insgesamt 365 aktive Tage - du hast legendären Status erreicht'
    },
    loyalty_master: {
      name: 'Loyalitäts-Meister',
      description: 'Insgesamt 1000 aktive Tage - du hast ultimative Loyalität erreicht'
    },
  } as any,

  // TODO: Add remaining translations progressively for other sections
  // For now, missing keys will fall back to English
};

export default de;
