import { TranslationKeys } from '../../types/i18n';

/**
 * German (Deutsch) Translations
 *
 * Status: COMPLETE
 * Coverage: 100% - All user-facing text translated
 *
 * Translation Strategy:
 * - Informal "du" form for friendly tone
 * - Motivational and encouraging language throughout
 * - Tutorial content falls back to English (onboarding UI elements translated)
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

  // Home screen
  home: {
    title: 'Willkommen zurück!',
    journalStreak: 'Meine Tagebuch-Serie',
    habitStatistics: 'Gewohnheitsstatistiken',
    weeklyProgress: 'Wöchentlicher Fortschritt',
    monthlyProgress: 'Monatlicher Fortschritt',
    dayDetail: 'Tagesdetail',
    // Streak display
    day: 'Tag',
    days: 'Tage',
    frozen: 'eingefroren',
    streakActive: 'Serie aktiv!',
    startToday: 'Heute beginnen',
    bestStreak: 'Beste',
    canRecover: 'Mit Werbung wiederherstellen',
    streakFrozen: 'Serie eingefroren - Zum Fortsetzen aufwärmen ❄️🔥',
    streakFrozenTap_one: '❄️ Serie eingefroren: {{count}} Tag - Zum Aufwärmen tippen',
    streakFrozenTap_other: '❄️ Serie eingefroren: {{count}} Tage - Zum Aufwärmen tippen',
    // Streak visualization
    recentActivity: 'Letzte Aktivität',
    completed: 'Abgeschlossen',
    bonus: 'Bonus',
    today: 'Heute',
    // Streak history graph
    journalHistory: 'Meine Tagebuch-Historie',
    last30Days: 'Letzte 30 Tage - Einträge pro Tag',
    todayCount: 'Heute',
    peakDay: 'Spitzentag',
    completeDays: 'Abgeschlossen',
    bonusDays: 'Bonus',
    // Habit Statistics Dashboard
    habitStats: {
      weeklyChart: 'Wöchentliche Gewohnheitserfüllung',
      monthlyOverview: 'Monatsübersicht',
      performanceIndicators: 'Leistung',
      trendAnalysis: 'Trends - Gewohnheiten',
      totalHabits: 'Gewohnheiten gesamt',
      activeHabits: 'Aktive Gewohnheiten',
      completedToday: 'Heute erledigt',
      weeklyAverage: 'Wochendurchschnitt',
      monthlyAverage: 'Monatsdurchschnitt',
      bestDay: 'Bester Tag',
      improvingTrend: 'Aufwärtstrend',
      decliningTrend: 'Abwärtstrend',
      steadyProgress: 'Gleichmäßiger Fortschritt',
      noData: 'Keine Gewohnheitsdaten verfügbar',
      chartToggle: 'Ansicht',
      week: 'Woche',
      month: 'Monat',
    },
    // Streak sharing
    shareStreak: 'Meine Serie teilen',
    shareSubtitle: 'Zeige deine Tagebuch-Reise!',
    sharePreview: 'Nachrichtenvorschau',
    copyText: 'Text kopieren',
    shareNow: 'Jetzt teilen',
    sharing: 'Teilen...',
    shareTitle: 'Meine Tagebuch-Serie',
    shareStreakText: 'Ich habe eine {{current}}-Tage-Tagebuch-Serie! 🔥',
    shareBestStreak: 'Meine beste Serie: {{best}} Tage',
    shareBadges: 'Erfolge',
    shareAppPromo: '#Tagebuch #SelfRise #PersönlichesWachstum',
    copiedToClipboard: 'In die Zwischenablage kopiert!',
    shareError: 'Teilen fehlgeschlagen. Bitte versuche es erneut.',
    copyError: 'Kopieren fehlgeschlagen. Bitte versuche es erneut.',
    todayHabits: 'Heutige Gewohnheiten',
    // Daily Quote
    dailyQuote: 'Tägliche Inspiration',
    quoteCategories: {
      motivation: 'Motivation',
      gratitude: 'Dankbarkeit',
      habits: 'Gewohnheiten',
      goals: 'Ziele',
      achievement: 'Erfolg',
      level: 'Level',
      streak: 'Serie',
      consistency: 'Beständigkeit',
      growth: 'Wachstum',
    },
    // Personalized Recommendations
    recommendations: 'Für dich',
    noRecommendations: 'Gut gemacht! Du bist bei allem auf Kurs.',
    journalPrompt: 'Versuche diese Eingabeaufforderung',
    // Home Customization
    customization: {
      title: 'Startseite anpassen',
      components: 'Startseiten-Komponenten',
      componentsDescription: 'Wähle, welche Abschnitte auf deiner Startseite angezeigt werden sollen',
      order: 'Position {{order}}',
      actions: 'Aktionen',
      resetToDefaults: 'Auf Standard zurücksetzen',
      resetTitle: 'Startseiten-Layout zurücksetzen',
      resetMessage: 'Dies stellt das Standard-Startseiten-Layout wieder her. Bist du sicher?',
      errors: {
        visibilityFailed: 'Sichtbarkeit der Komponente konnte nicht aktualisiert werden. Bitte versuche es erneut.',
      },
      componentNames: {
        xpProgressBar: 'XP-Fortschritt',
        xpMultiplier: 'XP-Multiplikator',
        journalStreak: 'Tagebuch-Streak',
        quickActions: 'Schnellaktionen',
        dailyQuote: 'Tägliche Inspiration',
        recommendations: 'Für dich',
        streakHistory: 'Streak-Verlauf',
        habitStats: 'Gewohnheitsstatistiken',
        habitPerformance: 'Leistung',
        habitTrends: 'Trends',
        monthlyChallenges: 'Monatsherausforderungen',
      },
    },
    // Habit Performance Indicators
    habitPerformance: {
      noHabitsDescription: 'Füge Gewohnheiten hinzu, um Leistungsindikatoren zu sehen',
      vsLastWeek: 'vs. {{percent}}% letzte Woche',
      thisWeek: 'Diese Woche',
      buildingHabit: '{{name}} (im Aufbau)',
      monthlyFocus: '{{month}} Fokus',
    },
    // Habit Trend Analysis
    habitTrends: {
      noDataDescription: 'Erledige Gewohnheiten für ein paar Wochen, um die Trendanalyse zu sehen',
      overallProgress: '🚀 Gesamtfortschritt',
      improvedByPercent: 'Um {{percent}}% über 4 Wochen verbessert. Weiter so!',
      needsAttention: '⚠️ Braucht Aufmerksamkeit',
      droppedByPercent: 'Kürzlich um {{percent}}% gesunken. Überprüfe deine Routine.',
      steadyProgress: '📈 Stetiger Fortschritt',
      consistencyStable: 'Beständigkeit stabil bei {{percent}}% Durchschnitt.',
      buildingNewHabits: '🌱 Neue Gewohnheiten aufbauen',
      newHabitsProgress: '{completions, plural, one {# Erledigung} other {# Erledigungen}} über {habits, plural, one {# neue Gewohnheit} other {# neue Gewohnheiten}}! Großartiger Start!',
      earlyMomentum: '🚀 Früher Schwung',
      earlyMomentumDescription: '{{percent}}% durchschnittliche Erledigungsrate bei neuen Gewohnheiten. Du etablierst starke Muster!',
      starPerformer: '🏆 Spitzenleistung',
      streakChampions: '🔥 Serien-Champions',
      streakChampionsDescription: '{count, plural, one {# Gewohnheit} other {# Gewohnheiten}} mit 7+ Tage Serien!',
      excellentWeek: '🎯 Exzellente Woche',
      excellentWeekDescription: '{{percent}}% Erledigung diese Woche. Fantastisch!',
      last4Weeks: 'Letzte 4 Wochen',
    },
    // Monthly Habit Overview
    monthlyOverview: {
      title: 'Letzte 30 Tage',
      activeDays: '{{active}}/{{total}} aktive Tage',
      perActiveDay: 'pro aktivem Tag',
      dailyProgress: 'Täglicher Fortschritt (Letzte 30 Tage)',
      topPerformer: '🏆 Spitzenreiter',
      needsFocus: '💪 Braucht Fokus',
      greatMonth: 'Toller Monat! Weiter so mit der exzellenten Arbeit.',
      reviewHabits: 'Erwäge, deine Gewohnheiten und Ziele zu überprüfen.',
      noDataDescription: 'Füge einige Gewohnheiten hinzu, um deine Monatsübersicht zu sehen',
    },
    // XP Multiplier Section
    xpMultiplier: {
      sectionTitle: '⚡ XP Multiplikator',
      activeTitle: '2x XP Aktiv! {{time}}',
      harmonyReward: 'Harmonie-Serien-Belohnung',
      multiplierActive: 'Multiplikator Aktiv',
      activeDescription: 'Alle XP-Gewinne werden verdoppelt, während dieser Multiplikator aktiv ist',
      harmonyStreak: 'Harmonie-Serie: {{current}}/7',
      readyToActivate: 'Bereit, 2x XP zu aktivieren!',
      moreDays: '{days, plural, one {# weiterer Tag} other {# weitere Tage}} für 2x XP',
      activateButton: '2x XP aktivieren',
    },
    // Monthly 30 Day Chart
    monthly30Day: {
      title30: 'Erledigung der letzten 30 Tage',
      titleCustom: 'Erledigung der letzten {{days}} Tage',
      completionRate: '{{completed}}/{{total}} ({{percent}}%)',
      bonus: '{{count}} Bonus',
      completed: 'Erledigt',
      missed: 'Verpasst',
      bonusLabel: 'Bonus',
    },
    // Weekly Habit Chart
    weeklyChart: {
      title7: 'Erledigung der letzten 7 Tage',
      titleCustom: 'Erledigung der letzten {{days}} Tage',
      completionRate: '{{completed}}/{{total}} ({{percent}}%)',
      bonus: '{{count}} Bonus',
      completed: 'Erledigt',
      missed: 'Verpasst',
      bonusLabel: 'Bonus',
    },
    // Quick Actions
    quickActionsTitle: 'Schnellaktionen',
    quickActions: {
      addHabit: 'Gewohnheit hinzufügen',
      gratitude: 'Dankbarkeit',
      selfPraise: 'Selbstlob',
      addGoal: 'Ziel hinzufügen',
    },
    // Yearly Habit Overview
    yearlyOverview: {
      title365: 'Übersicht der letzten 365 Tage',
      titleCustom: 'Übersicht der letzten {{days}} Tage',
      activeDays: '{{active}}/{{total}} aktive Tage',
      yearlyAverage: 'Jahresdurchschnitt',
      dailyAverage: 'Tagesdurchschnitt',
      perActiveDay: 'pro aktivem Tag',
      excellentYear: '🔥 Exzellentes Jahr',
      excellentYearDescription: 'Herausragende Jahresleistung! Weiter so.',
      roomForImprovement: '📈 Verbesserungspotenzial',
      noDataDescription: 'Füge einige Gewohnheiten hinzu, um deine Jahresübersicht zu sehen',
      loading: 'Lade Jahresstatistiken...',
    },
    // Habit Stats Dashboard
    habitStatsDashboard: {
      week: 'Woche',
      month: 'Monat',
      year: 'Jahr',
    },
    // Premium Trophy Icon
    premiumTrophy: {
      label: 'Trophäen',
    },
    // Screen labels
    streakHistoryLoading: 'Wird geladen...',
    // Level Progress
    yourProgress: 'Dein Fortschritt',
    currentLevelSummary: 'Du befindest dich derzeit auf Level {currentLevel} von 100 Leveln',
    keepEarningXp: 'Verdiene weiterhin XP, um höhere Level freizuschalten!',
  } as any,

  // Levels & Navigation screens
  screens: {
    levelOverview: 'Level-Übersicht',
    levelsLoading: 'Level werden geladen...',
    goBack: 'Zurück',
    backNavigation: 'Startseite',
    reorderHabits: {
      title: 'Gewohnheiten neu ordnen',
      instructions: 'Halte eine Gewohnheit und ziehe sie, um sie neu zu ordnen',
    },
    habitStats: {
      activeHabits: 'Aktive Gewohnheiten',
      inactiveHabits: 'Inaktive Gewohnheiten',
      noHabitsFound: 'Keine Gewohnheiten gefunden',
      noHabitsSubtext: 'Erstelle zuerst einige Gewohnheiten, um ihre Statistiken anzusehen',
    },
    goalStats: {
      loading: 'Wird geladen...',
    },
    trophyRoom: {
      title: 'Trophäenzimmer',
    },
  },

  // Common labels
  common: {
    ok: 'OK',
    cancel: 'Abbrechen',
    save: 'Speichern',
    saving: 'Speichern...',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    retry: 'Erneut versuchen',
    tryAgain: 'Erneut versuchen',
    add: 'Hinzufügen',
    create: 'Erstellen',
    update: 'Aktualisieren',
    confirm: 'Bestätigen',
    error: 'Fehler',
    success: 'Erfolg',
    done: 'Fertig',
    back: 'Zurück',
    next: 'Weiter',
    skip: 'Überspringen',
    close: 'Schließen',
    continue: 'Fortfahren',
    yes: 'Ja',
    no: 'Nein',
    copy: 'Kopieren',
    share: 'Teilen',
    startFresh: 'Neu beginnen',
    level: 'Level',
    totalXP: 'Gesamt-XP',
    achievements: 'Erfolge',
    category: 'Kategorie',
    rarity: 'Seltenheit',
    xpReward: 'XP-Belohnung',
    completed: '{{completed}} von {{total}} abgeschlossen',
    loading: {
      default: 'Wird geladen...',
      levels: 'Level werden geladen...',
      habits: 'Gewohnheiten werden geladen...',
      progress: 'Fortschritt wird geladen...',
    },
    modals: {
      errorTitle: 'Fehler',
      confirmTitle: 'Aktion bestätigen',
      confirm: 'Bestätigen',
      closeButton: 'Schließen',
    },
    errors: {
      goals: {
        failedToSave: 'Ziel konnte nicht gespeichert werden',
        failedToDelete: 'Ziel konnte nicht gelöscht werden',
        failedToReorder: 'Ziele konnten nicht neu geordnet werden',
        failedToAddProgress: 'Fortschritt konnte nicht hinzugefügt werden',
        noProgressData: 'Noch keine Fortschrittsdaten. Fügen Sie einige Fortschritte hinzu, um Statistiken zu sehen.',
      },
      habits: {
        failedToSave: 'Gewohnheit konnte nicht gespeichert werden',
        failedToDelete: 'Gewohnheit konnte nicht gelöscht werden',
        failedToUpdate: 'Gewohnheit konnte nicht aktualisiert werden',
        failedToReorder: 'Gewohnheiten konnten nicht neu geordnet werden',
        failedToToggleCompletion: 'Abschluss konnte nicht umgeschaltet werden',
        loadingHabits: 'Gewohnheiten werden geladen...',
        activeHabits: 'Aktive Gewohnheiten',
        inactiveHabits: 'Inaktive Gewohnheiten',
        noHabitsFound: 'Keine Gewohnheiten gefunden',
        createHabitsFirst: 'Erstellen Sie zunächst einige Gewohnheiten, um ihre Statistiken anzuzeigen',
      },
      gratitude: {
        failedToSave: 'Dankbarkeit konnte nicht gespeichert werden',
      },
      social: {
        failedToLoadHeroes: 'Tägliche Helden konnten nicht geladen werden',
      },
    },
    celebration: {
      general_announcement: 'Glückwunsch zu deinem Erfolg!',
      modal: 'Erfolg-Feier',
    },
    help: 'Hilfe',
    helpNotAvailable: 'Hilfeinformationen nicht verfügbar für diese Funktion.',
  },

  // UI Labels
  ui: {
    progressStep: 'Schritt {current} von {total}',
    skipTutorial: 'Tutorial überspringen',
    nextStep: 'Nächster Schritt',
    continue: 'Fortfahren',
    next: 'Weiter',
    cancel: 'Abbrechen',
    save: 'Speichern',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    retry: 'Erneut versuchen',
    tutorialComplete: 'Tutorial abgeschlossen',
    readyToRise: 'Bereit zu steigen',
  },

  // Habits screen
  habits: {
    title: 'Meine Gewohnheiten',
    addHabit: 'Gewohnheit hinzufügen',
    editHabit: 'Gewohnheit bearbeiten',
    deleteHabit: 'Gewohnheit löschen',
    activeHabits: 'Aktive Gewohnheiten',
    inactiveHabits: 'Inaktive Gewohnheiten',
    addNewHabit: 'Neue Gewohnheit hinzufügen',
    done: 'Fertig',
    reorder: 'Neu ordnen',
    bonus: 'Bonus',
    scheduled: 'Geplant',
    habitName: 'Gewohnheitsname',
    habitNamePlaceholder: 'Gewohnheitsname eingeben...',
    selectColor: 'Farbe wählen',
    selectIcon: 'Symbol wählen',
    scheduledDays: 'Geplante Tage',
    markCompleted: 'Als erledigt markieren',
    viewCalendar: 'Kalender ansehen',
    confirmDelete: 'Löschen bestätigen',
    deleteMessage: 'Bist du sicher, dass du diese Gewohnheit löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    save: 'Speichern',
    form: {
      name: 'Gewohnheitsname',
      namePlaceholder: 'Gewohnheitsname eingeben...',
      color: 'Farbe wählen',
      icon: 'Symbol wählen',
      scheduledDays: 'Geplante Tage',
      description: 'Beschreibung (Optional)',
      descriptionPlaceholder: 'Füge eine Beschreibung für deine Gewohnheit hinzu...',
      errors: {
        nameRequired: 'Gewohnheitsname ist erforderlich',
        nameTooShort: 'Gewohnheitsname muss mindestens 2 Zeichen lang sein',
        nameTooLong: 'Gewohnheitsname muss weniger als 50 Zeichen lang sein',
        daysRequired: 'Bitte wähle mindestens einen Tag aus',
        descriptionTooLong: 'Beschreibung muss weniger als 200 Zeichen lang sein',
        submitFailed: 'Gewohnheit konnte nicht gespeichert werden. Bitte versuche es erneut.',
      },
    },
    emptyState: {
      title: 'Noch keine Gewohnheiten',
      subtitle: 'Beginne bessere Gewohnheiten aufzubauen, indem du deine erste erstellst',
    },
    emptyStateWithCompletion: {
      title: 'Noch keine Gewohnheiten erstellt',
      subtitle: 'Tippe auf "Gewohnheit hinzufügen", um loszulegen!',
    },
    emptyStateTracker: {
      title: 'Keine aktiven Gewohnheiten',
      subtitle: 'Erstelle deine erste Gewohnheit, um mit dem Tracking zu beginnen!',
    },
    stats: {
      activeHabits: 'Aktive Gewohnheiten',
    },
    calendar: {
      legendScheduled: 'Geplant',
      legendCompleted: 'Abgeschlossen',
      legendMissed: 'Verpasst',
      legendMakeup: 'Nachgeholt',
      bonus: 'Bonus',
    },
  } as any,

  // Journal screen
  journal: {
    title: 'Mein Tagebuch',
    addGratitude: 'Dankbarkeit hinzufügen',
    addGratitudeButton: '+ Dankbarkeit hinzufügen',
    addSelfPraiseButton: '+ Selbstlob hinzufügen',
    gratitudePlaceholder: 'Wofür bist du heute dankbar?',
    minimumRequired: 'Schreibe mindestens 3 Einträge, um deine Serie aufrechtzuerhalten',
    bonusGratitude: 'Bonus-Eintrag',
    currentStreak: 'Aktuelle Serie',
    longestStreak: 'Längste Serie',
    frozenStreak: 'Gefrorene Serie',
    history: 'Historie',
    statistics: 'Statistiken',
    // Daily Progress Display
    progress: {
      title: 'Fortschritt meines Tagebuchs heute',
      complete: 'Fertig ✓',
      bonusAmazing: 'Fantastisch! Du hast Bonus-Einträge hinzugefügt! 🌟',
      dailyComplete: 'Tagebuch heute abgeschlossen! Halte deine Serie am Leben! 🔥',
      entriesNeeded_one: '{{count}} weiterer Eintrag erforderlich',
      entriesNeeded_other: '{{count}} weitere Einträge erforderlich',
    },
    // --- BONUS MILESTONE SYSTEM ---
    bonusMilestone1_title: 'Erster Bonus-Eintrag! ⭐',
    bonusMilestone1_text: 'Fantastisch! Du hast heute deinen ersten Bonus-Eintrag geschrieben! Mach weiter so!',
    bonusMilestone5_title: 'Fünfter Bonus-Eintrag! 🔥',
    bonusMilestone5_text: 'Unglaublich! Du hast heute 5 Bonus-Einträge geschrieben. Du brennst!',
    bonusMilestone10_title: 'Zehnter Bonus-Eintrag! 👑',
    bonusMilestone10_text: 'Legendär! Du hast heute 10 Bonus-Einträge geschrieben. Du bist ein Tagebuch-Champion!',
    // Pro hlavní 'SelfRise Streak'
    streakMilestone_generic_title: 'Weiterer Meilenstein! 🎯',
    streakMilestone_generic_text: 'Herzlichen Glückwunsch zu {{days}} Tagen in Folge!',
    streakMilestone7_title: 'Eine Woche stark! 🔥',
    streakMilestone7_text: '7 Tage in Folge! Du baust Schwung auf und bildest eine kraftvolle Gewohnheit. Mach weiter!',
    streakMilestone14_title: 'Zwei Wochen stark! 💪',
    streakMilestone14_text: '14 Tage Hingabe! Du beweist dir selbst, dass Beständigkeit möglich ist. Halte die Dynamik aufrecht!',
    streakMilestone21_title: 'Eine Gewohnheit entsteht! 🌱',
    streakMilestone21_text: '21 Tage in Folge! Du baust eine starke Gewohnheit positiver Selbstreflexion auf. Mach weiter!',
    streakMilestone100_title: 'Willkommen im 100er-Club! 💯',
    streakMilestone100_text: 'Einhundert Tage Beständigkeit. Das ist jetzt ein Lebensstil. Du bist eine große Inspiration!',
    streakMilestone365_title: 'Ein Jahr Selbstwachstum! 🎉',
    streakMilestone365_text: 'Unglaublich. Ein ganzes Jahr Disziplin und positives Denken. Schau zurück auf die riesige Reise, die du zurückgelegt hast.',
    streakMilestone1000_title: 'LEGENDÄR! 传奇',
    streakMilestone1000_text: '1000 Tage. Du hast ein Ziel erreicht, das unglaubliche Willenskraft beweist. Du bist eine SelfRise-Legende.',
    streakLost: {
      title: 'Serie verloren',
      message: 'Deine Serie wurde unterbrochen. Was möchtest du tun?',
      reset: 'Serie zurücksetzen',
      recover: 'Mit Werbung wiederherstellen',
    },

    celebration: {
      daily_complete_announcement: 'Herzlichen Glückwunsch! Du hast deine tägliche Tagebuch-Praxis abgeschlossen!',
      streak_milestone_announcement: 'Fantastisch! Du hast einen {{days}}-Tage-Serien-Meilenstein erreicht!',
      bonus_milestone_announcement: 'Ausgezeichnet! Du hast {{count}} Bonus-Tagebuch-Einträge abgeschlossen!',
      epic_crown_announcement: 'Legendäre Leistung! Du hast den ultimativen 10. Bonus-Meilenstein mit königlicher Kronenfeier erreicht!',
      daily_complete_modal: 'Feier zur täglichen Tagebuchfertigstellung',
      streak_milestone_modal: 'Feier zum {{days}}-Tage-Serien-Meilenstein',
      bonus_milestone_modal: 'Feier zu {{count}} Bonus-Einträgen',
      epic_crown_modal: 'Epische königliche Kronenfeier für die Errungenschaft des 10. Bonus-Meilensteins',
      streak_badge_accessibility: 'Erfolgsabzeichen für {{days}} Tage Serie',
      bonus_badge_accessibility: 'Erfolgsabzeichen für {{count}} Bonus-{{#eq count 1}}Eintrag{{else}}Einträge{{/eq}}',
      // Fallback strings for CelebrationModal (when i18n keys are missing)
      daily_complete_title: 'Herzlichen Glückwunsch! 🎉',
      daily_complete_message: 'Du hast deine tägliche Tagebuch-Praxis abgeschlossen!',
      level_up_title: 'Level Erhöht! 🎉',
      level_up_message: 'Herzlichen Glückwunsch zum Erreichen eines neuen Levels!',
      default_title: 'Herzlichen Glückwunsch!',
      default_message: 'Gut gemacht!',
      xp_earned: 'XP Verdient',
      rewards_title: 'Neue Belohnungen:',
      milestone_suffix: ' Meilenstein!',
      unlocked_prefix: 'Du hast freigeschaltet',
      milestone_first: 'Erste',
      milestone_fifth: 'Fünfte',
      milestone_tenth: 'Zehnte',
    },

    export: {
      title: 'Tagebuch-Export - {{format}}-Format',
      truncated: '[Inhalt für Anzeige gekürzt]',
      error: 'Tagebuchdaten konnten nicht exportiert werden',
    },

    errors: {
      searchFailed: 'Suche in Tagebucheinträgen fehlgeschlagen',
      deleteFailed: 'Tagebucheintrag konnte nicht gelöscht werden',
    },

    // Journal UI text
    searchPlaceholder: 'Tagebucheinträge durchsuchen...',
    editPlaceholder: 'Bearbeite deinen Tagebucheintrag...',
    historyTitle: 'Tagebuch-Verlauf',
    today: 'Heute',
    searchResults_one: '{{count}} Ergebnis gefunden für "{{term}}"',
    searchResults_other: '{{count}} Ergebnisse gefunden für "{{term}}"',
    noSearchResults: 'Keine Ergebnisse gefunden für "{{term}}"',
    emptySearch: 'Keine Tagebucheinträge entsprechen deiner Suche.',
    emptyHistory: 'Keine Tagebucheinträge für {{date}}.',
    loadingStats: 'Lade Statistiken...',

    // Delete confirmation
    deleteConfirm: {
      title: 'Tagebucheintrag löschen',
      message: 'Bist du sicher, dass du diesen {{type}}-Eintrag löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.',
      gratitude: 'Dankbarkeits',
      selfPraise: 'Selbstlob',
    },

    // Journal stats
    stats: {
      title: 'Tagebuch-Statistiken',
      totalEntries: 'Gesamteinträge',
      allTime: 'Aller Zeiten',
      activeDays: 'Aktive Tage',
      daysWithEntries: '{count, plural, one {# Tag} other {# Tage}} mit Einträgen',
      currentStreak: 'Aktuelle Serie',
      dailyAverage: 'Täglicher Durchschnitt',
      entriesPerDay: 'Einträge pro aktivem Tag',
      milestoneBadges: 'Meilenstein-Abzeichen',
      bestStreak: 'Beste Serie: {{days}} Tage',
      startToday: 'Starte heute deine Serie!',
      personalBest: 'Persönliche Bestleistung! 🎉',
      best: 'Beste: {{days}} Tage',
      motivationTitle: 'Weiter so!',
      motivationNoStreak: "Jede Reise beginnt mit einem einzigen Schritt. Starte heute deine Tagebuch-Serie!",
      motivationDay1: "Toller Start! Ein Tag geschafft, viele weitere folgen. Bleib dran!",
      motivationDays: "Fantastische {{days}}-Tage-Serie! Du baust eine starke Gewohnheit auf.",
    },

    // Gratitude Input Component
    input: {
      // Header titles
      addGratitudeTitle: 'Dankbarkeit hinzufügen',
      addSelfPraiseTitle: 'Selbstlob hinzufügen',

      // Entry type labels (used in list and edit modal)
      typeGratitude: 'Dankbarkeit',
      typeSelfPraise: 'Selbstlob',

      // Error messages
      emptyError: 'Bitte gib deine Dankbarkeit ein',
      minLengthError: 'Dankbarkeit muss mindestens 3 Zeichen lang sein',
      frozenStreakError_one: 'Deine Serie ist seit {{count}} Tag eingefroren. Wärme sie auf dem Startbildschirm auf und schreibe dann weiter! 🔥',
      frozenStreakError_other: 'Deine Serie ist seit {{count}} Tagen eingefroren. Wärme sie auf dem Startbildschirm auf und schreibe dann weiter! 🔥',

      // Gratitude placeholders (rotating)
      gratitudePlaceholders: [
        'Was hat dich heute zum Lächeln gebracht?',
        'Wem bist du gerade jetzt dankbar?',
        'Was für eine kleine Sache hat dir Freude bereitet?',
        'Was für etwas Schönes hast du heute gesehen?',
        'Für welche Fähigkeit bist du dankbar?',
        'Für welchen Teil deines Tages bist du am dankbarsten?',
        'Worauf freust du dich?',
        'Für welches Essen bist du heute dankbar?',
        'Welches Lied hat deinen Tag besser gemacht?',
        'Welches einfache Vergnügen hast du genossen?',
      ],

      // Self-praise placeholders (rotating)
      selfPraisePlaceholders: [
        'Welche Herausforderung hast du heute gemeistert?',
        'Was hast du heute gut gemacht?',
        'Was hast du heute getan, auf das du stolz bist?',
        'Wie bist du deinen Zielen näher gekommen?',
        'Welche gute Entscheidung hast du getroffen?',
        'Wann warst du heute diszipliniert?',
        'Wie hast du Freundlichkeit zu dir selbst gezeigt?',
        'Was hast du heute gelernt?',
        'Auf welche Anstrengung bist du stolz, unabhängig vom Ergebnis?',
        'Was hast du heute nur für dich selbst getan?',
      ],
    },

    // Warm-up modals
    warmUp: {
      title: 'Wärme deine Serie auf',
      frozenDays: 'Eingefrorene Tage',
      frozenMessage_one: 'Deine Serie ist seit {{count}} Tag eingefroren. Schau dir {{adsNeeded}} Werbung an, um sie aufzuwärmen und schreibe dann frei weiter! ❄️➡️🔥',
      frozenMessage_other: 'Deine Serie ist seit {{count}} Tagen eingefroren. Schau dir {{adsNeeded}} Werbungen an, um sie aufzuwärmen und schreibe dann frei weiter! ❄️➡️🔥',
      streakWarmedUp: 'Serie aufgewärmt! Gehe zum Tagebuch und setze deine Reise fort! ✨',
      warmingUp: 'Aufwärmen: {{current}}/{{total}} 🔥',
      warmingProgress: 'Aufwärm-Fortschritt',
      adsProgress: '{{watched}}/{{total}} Werbungen',
      loadingAd: 'Lade Werbung...',
      warmUpComplete: 'Aufwärmen abgeschlossen! ✓',
      warmUpButton: 'Aufwärmen ({{current}}/{{total}})',
      infoText: 'Wärme zuerst deine eingefrorene Serie auf, indem du Werbungen ansiehst. Danach kannst du normal Tagebucheinträge schreiben, ohne weitere Werbungen anzusehen.',

      adFailed: {
        title: 'Werbung fehlgeschlagen',
        message: 'Werbung konnte nicht geladen werden. Bitte versuche es erneut.',
        ok: 'OK',
      },

      error: {
        title: 'Fehler',
        message: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
        ok: 'OK',
      },

      confirmation: {
        title: 'Werbung ansehen zum Aufwärmen',
        message: 'Hier würde eine echte Werbung gezeigt werden. Mit Werbesimulation fortfahren?',
        cancel: 'Abbrechen',
        confirm: 'Werbung ansehen',
      },

      startFresh: {
        title: 'Neu beginnen?',
        message: '⚠️ Dies setzt deine aktuelle Serie dauerhaft auf 0 zurück. Du kannst neu beginnen, ohne deine eingefrorene Serie aufzuwärmen. Diese Aktion kann nicht rückgängig gemacht werden.',
      },

      modals: {
        success: {
          title: 'Erfolg!',
          message: 'Vorgang erfolgreich abgeschlossen.',
          button: 'OK',
        },
        error: {
          title: 'Fehler',
          message: 'Etwas ist schief gelaufen. Bitte versuche es erneut.',
          button: 'OK',
        },
        confirmation: {
          title: 'Bestätigung',
          message: 'Möchtest du wirklich fortfahren?',
          confirm: 'Bestätigen',
          cancel: 'Abbrechen',
        },
        issue: {
          title: 'Problem erkannt',
          message: 'Es gibt ein Problem. Wähle, wie du fortfahren möchtest.',
          primaryAction: 'Erneut versuchen',
          secondaryAction: 'Schnelle Aufwärmung',
        },
        quickWarmUp: {
          title: 'Schnelle Aufwärmung',
          message: 'Dies wärmt deine eingefrorene Serie auf, ohne dass du Werbungen ansehen musst. Deine Serie wird normal fortgesetzt. Fortfahren?',
          confirm: 'Aufwärmen',
          cancel: 'Abbrechen',
        },
      },
    },

    // Streak rescue modals
    rescue: {
      congratulations: {
        title: '🎉 Serie gerettet!',
        message: 'Glückwunsch! Deine Serie wurde erfolgreich gerettet. Du kannst jetzt normal Tagebucheinträge schreiben.',
        continue: 'Weiter',
      },
      autoFixed: {
        title: 'Serie gerettet!',
        message: 'Deine Serie wurde erfolgreich gerettet! Es gab ein technisches Problem, aber wir haben es automatisch behoben.',
      },
      issueResolved: {
        title: 'Problem gelöst',
        message: 'Wir entschuldigen uns für das technische Problem. Deine Serie wurde erfolgreich gerettet und du kannst jetzt normal weiter schreiben.',
      },
      noDebt: {
        title: 'Keine Schuld',
        message: 'Deine Serie scheint bereits gerettet zu sein. Aktualisiere deine Seriendaten...',
      },
      technicalIssue: {
        title: 'Technisches Problem',
        message: 'Du hast alle erforderlichen Werbungen angesehen, aber wir haben ein technisches Problem festgestellt. Deine Serienrettung ist abgeschlossen, bitte starte die App bei Bedarf neu.',
      },
      technicalIssueRetry: {
        title: 'Technisches Problem',
        message: 'Wir haben ein technisches Problem beim Abschließen deiner Serienrettung festgestellt (Versuch {{attempt}}/2). Bitte versuche es erneut.',
      },
      criticalError: {
        title: 'Kritischer Fehler',
        message: 'Wir haben ein kritisches technisches Problem festgestellt. Bitte starte die App neu. Deine Daten sind sicher.',
      },
      resetFailed: {
        title: 'Zurücksetzen fehlgeschlagen',
        message: 'Schuld konnte nicht zurückgesetzt werden. Bitte kontaktiere den Support.',
      },
    },

    // Fallback messages
    fallback: {
      success: 'Erfolg!',
      operationComplete: 'Vorgang erfolgreich abgeschlossen.',
      error: 'Fehler',
      errorMessage: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
      congratulations: '🎉 Glückwunsch!',
      debtCleared: 'Deine Schuld wurde erfolgreich beglichen!',
    },
  } as any,

  // Goals screen
  goals: {
    title: 'Meine Ziele',
    addGoal: 'Ziel hinzufügen',
    editGoal: 'Ziel bearbeiten',
    deleteGoal: 'Ziel löschen',
    noGoals: 'Noch keine Ziele. Beginne mit der Erstellung deines ersten Ziels!',

    // Error states
    error: 'Fehler',
    goalNotFound: 'Ziel nicht gefunden',
    goalTitleLabel: 'Zieltitel',
    goalTitlePlaceholder: 'Gib dein Ziel ein...',
    unitLabel: 'Einheit',
    unitPlaceholder: 'z.B. €, kg, Stunden...',
    targetValueLabel: 'Zielwert',
    addProgressButton: 'Fortschritt hinzufügen',
    progressValue: 'Fortschrittswert',
    progressNote: 'Notiz',
    progressNotePlaceholder: 'Füge eine Notiz zu deinem Fortschritt hinzu...',
    completed: 'Abgeschlossen',
    progressLabel: 'Fortschritt',
    confirmDelete: 'Löschen bestätigen',
    deleteMessage: 'Bist du sicher, dass du dieses Ziel löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    save: 'Speichern',
    selectTargetDate: 'Zieldatum auswählen',

    selectYear: 'Jahr auswählen',
    selectMonth: 'Monat auswählen',
    selectDay: 'Tag auswählen',

    useTemplate: 'Vorlage verwenden',
    stats: {
      overview: 'Übersicht',
      trends: 'Trends',
      predictions: 'Vorhersagen',
      sectionStatistics: 'Statistiken',
      labelEntries: 'Einträge',
      labelDaysActive: 'Aktive Tage',
      labelAvgDaily: 'Ø Täglich',
      labelTimelineStatus: 'Zeitplan-Status',
      sectionPredictions: 'Vorhersagen',
      labelEstimatedCompletion: 'Geschätzte Fertigstellung:',
    },

    form: {
      title: 'Zieltitel',
      description: 'Beschreibung (Optional)',
      unit: 'Einheit',
      targetValue: 'Zielwert',
      category: 'Kategorie',
      targetDate: 'Zieldatum (Empfohlen)',
      targetDateHint: 'Tippe, um den schrittweisen Datumsauswahl zu öffnen',
      targetDatePlaceholder: 'Zieldatum auswählen (optional)',
      placeholders: {
        title: 'Gib deinen Zieltitel ein...',
        description: 'Beschreibe dein Ziel genauer...',
        unit: 'z.B. €, kg, Stunden, Bücher...',
        targetValue: '100',
        targetDate: 'JJJJ-MM-TT',
      },
      errors: {
        titleRequired: 'Zieltitel ist erforderlich',
        titleTooShort: 'Zieltitel muss mindestens 2 Zeichen lang sein',
        titleTooLong: 'Zieltitel muss weniger als 100 Zeichen lang sein',
        unitRequired: 'Einheit ist erforderlich',
        unitTooLong: 'Einheit muss weniger als 20 Zeichen lang sein',
        targetValueRequired: 'Zielwert muss größer als 0 sein',
        targetValueTooLarge: 'Zielwert muss kleiner als 1.000.000 sein',
        descriptionTooLong: 'Beschreibung muss weniger als 300 Zeichen lang sein',
        submitFailed: 'Ziel konnte nicht gespeichert werden. Bitte versuche es erneut.',
      },
    },

    progress: {
      addProgress: 'Fortschritt hinzufügen',
      progressHistory: 'Fortschrittsverlauf',
      noProgress: 'Noch keine Fortschrittseinträge',
      confirmDelete: 'Fortschrittseintrag löschen',
      deleteMessage: 'Bist du sicher, dass du diesen Fortschrittseintrag löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.',
      form: {
        progressType: 'Fortschrittstyp',
        value: 'Wert',
        note: 'Notiz (Optional)',
        date: 'Datum',
        preview: 'Vorschau',
        submit: 'Fortschritt hinzufügen',
        placeholders: {
          value: '0',
          note: 'Füge eine Notiz zu deinem Fortschritt hinzu...',
          date: 'JJJJ-MM-TT',
        },
        types: {
          add: 'Hinzufügen',
          subtract: 'Abziehen',
          set: 'Setzen auf',
        },
        errors: {
          valueRequired: 'Wert muss größer als 0 sein',
          valueTooLarge: 'Wert muss kleiner als 1.000.000 sein',
          noteTooLong: 'Notiz muss weniger als 200 Zeichen lang sein',
          submitFailed: 'Fortschritt konnte nicht hinzugefügt werden. Bitte versuche es erneut.',
        },
      },
    },

    details: {
      predictions: 'Vorhersagen zur Fertigstellung',
    },

    categories: {
      personal: 'Persönlich',
      health: 'Gesundheit',
      learning: 'Lernen',
      career: 'Karriere',
      financial: 'Finanziell',
      other: 'Sonstiges',
    },

    category: {
      health: 'Gesundheit',
      financial: 'Finanziell',
      learning: 'Lernen',
      career: 'Karriere',
      personal: 'Persönlich',
      other: 'Sonstiges',
    },

    templates: {
      title: 'Zielvorlagen',
      searchPlaceholder: 'Vorlagen durchsuchen...',
      footerText: 'Wähle eine Vorlage aus, um schnell mit vorausgefüllten Zieldetails zu beginnen.',
      all: 'Alle',
      target: 'Ziel',
      noTemplates: 'Keine Vorlagen gefunden, die deiner Suche entsprechen.',

      loseWeight: 'Gewicht verlieren',
      loseWeightDescription: 'Setze ein Ziel für gesunden Gewichtsverlust mit Fortschrittsverfolgung.',

      saveMoney: 'Geld sparen',
      saveMoneyDescription: 'Baue deine Ersparnisse mit einem bestimmten Zielbetrag auf.',
      payDebt: 'Schulden abbezahlen',
      payDebtDescription: 'Verfolge den Fortschritt beim vollständigen Schuldenabbau.',

      readBooks: 'Bücher lesen',
      readBooksDescription: 'Setze dir das Ziel, eine bestimmte Anzahl von Büchern dieses Jahr zu lesen.',
      learnLanguage: 'Sprache lernen',
      learnLanguageDescription: 'Verfolge die Stunden, die du mit dem Lernen einer neuen Sprache verbringst.',
      onlineCourse: 'Online-Kurs abschließen',
      onlineCourseDescription: 'Schließe Lektionen oder Module in einem Online-Kurs ab.',

      jobApplications: 'Bewerbungen',
      jobApplicationsDescription: 'Verfolge die Anzahl der eingereichten Bewerbungen.',
      networking: 'Professionelles Networking',
      networkingDescription: 'Baue dein professionelles Netzwerk mit neuen Kontakten aus.',

      meditation: 'Tägliche Meditation',
      meditationDescription: 'Verfolge die Minuten, die du täglich mit Meditation verbringst.',

      artProjects: 'Kunstprojekte',
      artProjectsDescription: 'Schließe kreative Kunstprojekte im Laufe des Jahres ab.',
      cookingRecipes: 'Neue Rezepte ausprobieren',
      cookingRecipesDescription: 'Erweitere deine Kochfähigkeiten, indem du neue Rezepte ausprobierst.',
    },

    dashboard: {
      overview: 'Übersicht',
      activeGoals: 'Aktive Ziele',
      completedGoals: 'Abgeschlossene Ziele',
      completionRate: 'Abschlussrate',
      onTrack: 'Im Plan',
      deadlines: 'Fristen',
      overdue: 'Überfällig',
      dueThisWeek: 'Fällig diese Woche',
      dueThisMonth: 'Fällig diesen Monat',
      behindSchedule: 'Hinter dem Zeitplan',
      categories: 'Kategorien',
      active: 'Aktiv',
      completed: 'Abgeschlossen',
      completion: 'Fertigstellung',
      quickActions: 'Schnellaktionen',
      complete: 'Abschließen',
      wayAhead: 'Weit voraus',
      ahead: 'Voraus',
      behind: 'Zurück',
      wayBehind: 'Weit zurück',
    },

    sections: {
      activeGoals: 'Aktive Ziele',
      completedGoals: 'Abgeschlossene Ziele',
      otherGoals: 'Andere Ziele',
    },

    actions: {
      reorder: 'Neu ordnen',
      done: 'Fertig',
    },

    status: {
      active: 'Aktiv',
      paused: 'Pausiert',
      archived: 'Archiviert',
    },

    detailsCard: {
      title: 'Zieldetails',
      status: 'Status:',
      progress: 'Fortschritt:',
      category: 'Kategorie:',
      targetDate: 'Zieldatum:',
      target: 'Ziel',
      completion: 'Fertigstellung',
    },

    analysis: {
      progressTrend: 'Fortschrittstrend',
      progressChart: 'Fortschrittsdiagramm',
      statistics: 'Statistiken',
      insights: 'Erkenntnisse',
      totalEntries: 'Einträge gesamt',
      currentProgress: 'Aktueller Fortschritt',
      avgDaily: 'Durchschnitt tägl.',
      noData: 'Keine Fortschrittsdaten für die Analyse verfügbar.',
      recentProgress: 'Kürzlicher Fortschritt',
      positiveProgress: 'Großartiger Fortschritt! Durchschnittlicher täglicher Anstieg von {{rate}}%.',
      negativeProgress: 'Der Fortschritt ist täglich um {{rate}}% zurückgegangen. Überdenke deinen Ansatz.',
      upwardTrend: 'Dein kürzlicher Fortschritt zeigt einen Aufwärtstrend. Mach weiter so!',
      downwardTrend: 'Der kürzliche Fortschritt nimmt ab. Zeit, sich wieder auf dein Ziel zu konzentrieren.',
      completionPrediction: 'Bei dieser Rate wirst du dein Ziel in {{days}} Tagen erreichen.',
    },

    predictions: {
      title: 'Vorhersagen zur Zielerreichung',
      methods: 'Vorhersagemethoden',
      insights: 'Erkenntnisse',
      estimatedDate: 'Geschätztes Datum',
      daysRemaining: 'Verbleibende Tage',
      confidence: 'Zuverlässigkeit',
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig',
      basicMethod: 'Grundschätzung',
      linearMethod: 'Lineare Progression',
      trendMethod: 'Aktueller Trend',
      targetMethod: 'Zieldatum',
      acceleratedMethod: 'Beschleunigter Fortschritt',
      noDataTitle: 'Unzureichende Daten',
      noDataDescription: 'Füge mehr Fortschrittseinträge hinzu, um genaue Vorhersagen zu erhalten.',
      highConfidenceTitle: 'Hochzuverlässige Vorhersage',
      highConfidenceDescription: 'Basierend auf {{method}} wirst du dein Ziel am {{date}} mit {{confidence}}% Zuverlässigkeit erreichen.',
      inconsistentTitle: 'Inkonsistente Vorhersagen',
      inconsistentDescription: 'Vorhersagen variieren um {{difference}} Tage. Erwäge, mehr Fortschrittsdaten hinzuzufügen.',
      behindScheduleTitle: 'Hinter dem Zeitplan',
      behindScheduleDescription: 'Du liegst {{days}} Tage hinter deinem Zieldatum. Erwäge, deine Fortschrittsrate zu erhöhen.',
      aheadScheduleTitle: 'Vor dem Zeitplan',
      aheadScheduleDescription: 'Gut gemacht! Du bist {{days}} Tage vor deinem Zieldatum.',
      increaseRateTitle: 'Fortschrittsrate erhöhen',
      increaseRateDescription: 'Du benötigst {{required}} {{unit}} täglich statt deiner aktuellen {{current}} {{unit}} täglich, um dein Ziel zu erreichen.',
    },

    sharing: {
      title: 'Ziel teilen',
      shareOptions: 'Teiloptionen',
      copyOptions: 'Kopieroptionen',
      quickSummary: 'Kurzzusammenfassung',
      quickSummaryDescription: 'Teile einen kurzen Überblick über deinen Zielfortschritt.',
      detailedReport: 'Detaillierter Bericht',
      detailedReportDescription: 'Teile umfassende Fortschrittsdetails und Erkenntnisse.',
      dataExport: 'Datenexport',
      dataExportDescription: 'Exportiere Zieldaten im JSON-Format zur Sicherung oder Analyse.',
      copyToClipboard: 'Zusammenfassung kopieren',
      copyToClipboardDescription: 'Kopiere die Zielzusammenfassung in deine Zwischenablage.',
      copyDetailed: 'Detailliert kopieren',
      copyDetailedDescription: 'Kopiere detaillierten Fortschrittsbericht in die Zwischenablage.',
      copyJson: 'JSON kopieren',
      copyJsonDescription: 'Kopiere Zieldaten im JSON-Format in die Zwischenablage.',
      footerText: 'Teile deinen Fortschritt mit anderen oder exportiere deine Daten zur Sicherung.',
      complete: 'Abgeschlossen',
      summary: 'Ziel: {{title}}\nFortschritt: {{completion}}% ({{current}}/{{target}} {{unit}})\nAktive Tage: {{daysActive}}\nDurchschnitt täglich: {{averageDaily}} {{unit}}',
      progressEntry: '{{date}}: {{type}} {{value}} {{unit}} - {{note}}',
      noNote: 'Keine Notiz',
      onTrack: '✅ Im Plan für Zieldatum',
      estimatedCompletion: '📅 Geschätzte Fertigstellung: {{date}}',
      noRecentProgress: 'Keine kürzlichen Fortschrittseinträge.',
      noInsights: 'Keine Erkenntnisse verfügbar.',
      detailedReportTemplate: 'ZIEL-FORTSCHRITTSBERICHT\n\n{{summary}}\n\nKÜRZLICHER FORTSCHRITT:\n{{recentProgress}}\n\nERKENNTNISSE:\n{{insights}}',
      summaryTitle: 'Zielzusammenfassung: {{title}}',
      detailedTitle: 'Zielbericht: {{title}}',
      jsonTitle: 'Zieldaten: {{title}}',
      exportError: 'Zieldaten konnten nicht exportiert werden. Bitte versuche es erneut.',
      copied: 'Inhalt in die Zwischenablage kopiert!',
      copyError: 'Inhalt konnte nicht kopiert werden. Bitte versuche es erneut.',
    },

    // Goal Completion Modal
    completion: {
      continue: 'Weiter',
      title: 'Ziel Erreicht!',
      bonus: 'Zielabschluss-Bonus',
      statusComplete: 'Abgeschlossen',
      statusCompleted: 'Abgeschlossen',
      message1: 'Herzlichen Glückwunsch! Du hast dein Ziel erreicht!',
      message2: 'Fantastische Arbeit! Ziel erfolgreich abgeschlossen!',
      message3: 'Großartig! Du hast dein Ziel erreicht!',
      message4: 'Gut gemacht! Deine Hingabe hat sich ausgezahlt!',
      message5: 'Ausgezeichnet! Ein weiteres Ziel erobert!',
    },
  } as any,

  // Monthly Challenge
  monthlyChallenge: {
    // Section title
    title: 'Monatsherausforderung',

    // States
    loading: 'Lade Herausforderung...',
    preparing: '🗓️ Bereite deine Monatsherausforderung vor...',
    noActiveChallenge: 'Keine aktive Herausforderung',
    challengePreparing: '⏳ Herausforderung wird vorbereitet',
    errorLoading: 'Fehler beim Laden der Herausforderung',
    failedToLoad: 'Monatsherausforderung konnte nicht geladen werden',
    retry: 'Erneut versuchen',

    // Actions
    view: 'Ansehen',
    close: 'Schließen',
    awesome: 'Großartig!',
    continueJourney: 'Reise fortsetzen',

    // Labels
    complete: 'Abgeschlossen',
    completePercentage: 'Abgeschlossen',
    daysLeft: 'Tage übrig',
    daysLeftCompact: 'T übrig',
    level: 'Stufe',
    difficulty: 'Schwierigkeit',
    difficultyLabel: 'Schwierigkeit',
    activeDays: 'Aktive Tage',
    maxXP: 'Max. EP',
    milestones: 'Meilensteine',
    requirements: 'Anforderungen',

    // First Month
    firstMonthPrefix: 'Erster Monat',
    firstMonthDescription: 'Dies ist deine Einführung in monatliche Herausforderungen! Wir haben es extra erreichbar gemacht, um dir zu helfen, Vertrauen aufzubauen.',

    // Categories
    categories: {
      habits: 'GEWOHNHEITEN',
      journal: 'TAGEBUCH',
      goals: 'ZIELE',
      consistency: 'BESTÄNDIGKEIT',
    },

    // Calendar
    calendar: {
      dailyProgress: 'Täglicher Fortschritt',
      weeklyBreakdown: 'Wöchentliche Aufschlüsselung',
      week: 'Woche {{number}}',
      noActivity: 'Keine Aktivität (<10%)',
      someActivity: 'Etwas Aktivität (10-50%)',
      goodProgress: 'Guter Fortschritt (51-90%)',
      perfectDay: 'Perfekter Tag (91%+)',
    },

    // Progress
    monthlyProgress: 'Monatsfortschritt',
    monthStreak: 'Monatsserie',
    yourChallengeLevels: 'Deine Herausforderungsstufen',

    // Completion
    monthComplete: '✓ Monat abgeschlossen',
    completed: 'Monatsherausforderung abgeschlossen! 🎉',
    endsDate: 'Endet: {{date}}',

    // Star rarity labels
    rarity: {
      common: 'Gewöhnlich',
      rare: 'Selten',
      epic: 'Episch',
      legendary: 'Legendär',
      master: 'Meister',
      unknown: 'Unbekannt',
    },

    // Star level names
    starLevels: {
      novice: 'Anfänger',
      explorer: 'Entdecker',
      challenger: 'Herausforderer',
      expert: 'Experte',
      master: 'Meister',
    },

    // Completion Modal
    completionModal: {
      subtitle: 'Monatsherausforderung',
      finalResults: 'Endergebnisse',

      // Completion titles
      titles: {
        perfect: 'Perfekte Vollendung!',
        outstanding: 'Herausragende Leistung!',
        great: 'Toller Fortschritt!',
        completed: 'Herausforderung abgeschlossen!',
        progress: 'Monatsfortschritt!',
      },

      // Completion messages
      messages: {
        perfect: 'Unglaublich! Du hast eine perfekte Vollendung bei dieser {{rarity}} {{category}} Herausforderung erreicht. Deine Hingabe ist wirklich inspirierend!',
        outstanding: 'Großartige Arbeit! Du hast diese {{rarity}} {{category}} Herausforderung mit herausragender Beständigkeit fast gemeistert.',
        great: 'Ausgezeichneter Fortschritt! Du hast großes Engagement für diese {{rarity}} {{category}} Herausforderung diesen Monat gezeigt.',
        completed: 'Gut gemacht! Du hast diese {{rarity}} {{category}} Herausforderung erfolgreich abgeschlossen und deine Belohnungen verdient.',
        progress: 'Gute Leistung! Du hast bedeutsamen Fortschritt bei dieser {{rarity}} {{category}} Herausforderung diesen Monat gemacht.',
      },

      // Rewards
      rewards: {
        title: 'Verdiente EP-Belohnungen',
        baseXP: 'Basis-Herausforderungs-EP',
        completionBonus: 'Vollendungsbonus',
        streakBonus: 'Monatlicher Serien-Bonus 🔥',
        perfectBonus: 'Perfekte Vollendung 🏆',
        totalEarned: 'Gesamt verdiente EP',
      },

      // Star progression
      starProgression: {
        title: 'Stern-Stufenfortschritt! 🌟',
        previous: 'Vorherige',
        newLevel: 'Neue Stufe',
        description: 'Deine nächste Monatsherausforderung wird anspruchsvoller mit höheren EP-Belohnungen sein!',
      },

      // Streak
      streak: {
        title: 'Monatliche Serie 🔥',
        month_one: 'Monat',
        month_other: 'Monate',
        description: 'Mach weiter so! Jeder aufeinanderfolgende Monat erhöht deine Serien-Boni.',
      },

      // Next month
      nextMonth: {
        title: 'Bereit für nächsten Monat?',
        description: 'Deine nächste Herausforderung wird automatisch am 1. generiert.',
        descriptionWithLevel: 'Deine nächste Herausforderung wird automatisch am 1. generiert. Mit deiner neuen Sternstufe erwarte eine größere Herausforderung und höhere Belohnungen!',
      },
    },

    // Detail Modal
    detailModal: {
      strategyDescription: 'Dies ist eine {{rarity}} ({{stars}}★) Schwierigkeitsherausforderung, die dir helfen soll, beständig zu wachsen.',
      strategyDescriptionAdvance: 'Schließe diese Herausforderung ab, um zur nächsten Sternstufe aufzusteigen und höhere EP-Belohnungen freizuschalten!',
      rewardTitle: '{{xp}} Erfahrungspunkte',
      streakBonus: '🔥 Serien-Bonus: +{{bonus}} EP für {{count}} Monate Serie',

      // Category-specific tips
      tips: {
        habits: [
          'Konzentriere dich darauf, nachhaltige Gewohnheiten aufzubauen, die zu deinem Lebensstil passen.',
          'Beginne mit einfacheren Gewohnheiten und steigere schrittweise die Schwierigkeit.',
          'Verfolge deine Gewohnheiten täglich, um Verantwortlichkeit zu bewahren.',
          'Feiere kleine Erfolge, um den ganzen Monat über motiviert zu bleiben.',
          'Nutze Gewohnheitsstapelung, um neue Gewohnheiten mit bestehenden Routinen zu verknüpfen.',
        ],
        journal: [
          'Reserviere jeden Tag eine feste Zeit für das Journaling.',
          'Schreibe authentisch über deine Erfahrungen und Gefühle.',
          'Nutze Journal-Eingabeaufforderungen, wenn du feststeckst.',
          'Überprüfe vergangene Einträge, um dein Wachstum zu verfolgen.',
          'Experimentiere mit verschiedenen Journaling-Stilen, um herauszufinden, was funktioniert.',
        ],
        goals: [
          'Teile große Ziele in kleinere, umsetzbare Meilensteine auf.',
          'Überprüfe und passe deine Ziele wöchentlich an.',
          'Konzentriere dich auf Fortschritt, nicht auf Perfektion.',
          'Dokumentiere Lektionen, die du auf dem Weg lernst.',
          'Feiere Meilenstein-Erfolge, um den Schwung aufrechtzuerhalten.',
        ],
        consistency: [
          'Erscheine jeden Tag, auch wenn der Fortschritt klein erscheint.',
          'Baue Routinen auf, die deine Beständigkeitsziele unterstützen.',
          'Verfolge deine täglichen Aktivitäten, um Muster zu identifizieren.',
          'Nutze Erinnerungen und Verantwortlichkeits-Tools.',
          'Denk daran, dass Beständigkeit sich im Laufe der Zeit verstärkt.',
        ],
        default: [
          'Bleib den ganzen Monat über auf deine Ziele fokussiert.',
          'Verfolge deinen Fortschritt täglich, um den Schwung aufrechtzuerhalten.',
          'Feiere Meilensteine auf dem Weg.',
          'Passe deinen Ansatz bei Bedarf an, aber bleib in Bewegung.',
          'Erinnere dich daran, warum du angefangen hast, wenn Herausforderungen auftreten.',
        ],
      },
    },
  } as any,

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
    lightMode: 'Heller Modus',
    darkMode: 'Dunkler Modus',
    systemAuto: 'System Auto',
    systemAutoDescription: 'Entspricht Ihren Geräteeinstellungen',

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
    notificationSettings: {
      errors: {
        loadFailed: 'Benachrichtigungseinstellungen konnten nicht geladen werden',
        permissionsTitle: 'Berechtigungen erforderlich',
        permissionsMessage: 'Benachrichtigungsberechtigungen werden benötigt, um dir Erinnerungen zu senden. Du kannst sie in den Systemeinstellungen aktivieren.',
        permissionsFailed: 'Benachrichtigungsberechtigungen konnten nicht angefordert werden',
        settingsFailed: 'Systemeinstellungen konnten nicht geöffnet werden',
        afternoonUpdateFailed: 'Nachmittagserinnerung konnte nicht aktualisiert werden',
        eveningUpdateFailed: 'Abenderinnerung konnte nicht aktualisiert werden',
        afternoonTimeFailed: 'Zeit der Nachmittagserinnerung konnte nicht aktualisiert werden',
        eveningTimeFailed: 'Zeit der Abenderinnerung konnte nicht aktualisiert werden',
      },
      buttons: {
        openSettings: 'Einstellungen öffnen',
      },
    },

    // Analytics
    habitAnalytics: 'Gewohnheitsanalytik',
    individualHabitStats: 'Individuelle Gewohnheitsstatistiken',

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

    // Tutorial & Onboarding
    tutorial: 'Tutorial',
    tutorialReset: 'Tutorial neustarten',
    tutorialResetDescription: 'Tutorial von vorne beginnen',
    tutorialResetConfirmTitle: 'Tutorial neustarten?',
    tutorialResetConfirmMessage: 'Dies startet das Tutorial von Anfang an neu. Diese Aktion kann nicht rückgängig gemacht werden.',
    tutorialResetSuccess: 'Tutorial wurde erfolgreich neu gestartet!',

    // Common
    cancel: 'Abbrechen',
    reset: 'Neustarten',
    success: 'Erfolg',
    errorTitle: 'Fehler',
    resetting: 'Wird neu gestartet...',
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
    shortest: {
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
    title: 'Trophäenzimmer',
    subtitle: 'Deine persönliche Ruhmeshalle',

    // View mode toggle
    viewModeTrophyRoom: '🏠 Trophäenzimmer',
    viewModeBrowseAll: '🏆 Alle durchsuchen',

    // Loading states
    loadingTitle: 'Trophäenzimmer wird geladen',
    loadingText: 'Erfolge werden poliert...',

    // Overview Statistics
    overview: {
      unlockedCount: 'Freigeschaltet',
      totalCount: 'Gesamt',
      completionRate: 'Fortschritt',
      totalXP: 'Gesamt-EP',
      recentUnlocks: 'Kürzlich',
      nextToUnlock: 'Als Nächstes',
      noAchievements: 'Noch keine Erfolge freigeschaltet',
      getStarted: 'Beginne Gewohnheiten zu erfüllen, schreibe in dein Tagebuch und erreiche Ziele, um deinen ersten Erfolg freizuschalten!',
    },

    // Achievement Spotlight
    spotlight: {
      title: 'Erfolgs-Spotlight',
      titleWithEmoji: '🌟 Erfolgs-Spotlight',
      subtitle: 'Feiere deinen Erfolg',
      emptyTitle: 'Erfolgs-Spotlight',
      emptySubtitle: 'Schalte Erfolge frei, um sie hier mit inspirierenden Geschichten zu sehen!',
      featuredAchievement: '✨ Ausgewählter Erfolg ✨',
      rotationText: 'Wechselt alle 30 Sekunden',

      // Inspirational stories by rarity
      stories: {
        common1: 'Jede große Reise beginnt mit einem einzigen Schritt. Dieser Erfolg markiert den Beginn deiner Transformation.',
        common2: 'Kleine Siege führen zu großen Triumphen. Du hast einen wichtigen ersten Schritt gemacht.',
        common3: 'Das Fundament des Erfolgs wird Schritt für Schritt aufgebaut. Gut gemacht!',

        rare1: 'Hingabe und Beständigkeit haben dich hierher gebracht. Dieser Erfolg zeigt dein wachsendes Engagement.',
        rare2: 'Du entwickelst die Gewohnheiten eines Champions. Dieser seltene Erfolg beweist deine Entschlossenheit.',
        rare3: 'Exzellenz ist keine Handlung, sondern eine Gewohnheit. Dieser Erfolg zeigt, dass du diese Gewohnheit aufbaust.',

        epic1: 'Außergewöhnliche Erfolge erfordern außergewöhnliche Anstrengungen. Du hast bewiesen, dass du das Zeug dazu hast.',
        epic2: 'Dieser epische Erfolg stellt dich unter die wenigen Engagierten, die über ihre Grenzen hinausgehen.',
        epic3: 'Größe wird nicht gegeben, sie wird verdient. Dieser Erfolg ist der Beweis für dein außergewöhnliches Engagement.',

        legendary1: 'Legenden werden nicht geboren, sie werden durch unerbittliches Streben nach Exzellenz geschmiedet. Du bist legendär.',
        legendary2: 'Dieser Erfolg repräsentiert den Höhepunkt der Hingabe. Du hast die Reihen der Außergewöhnlichen erreicht.',
        legendary3: 'Die Geschichte wird sich an diejenigen erinnern, die gewagt haben, großartig zu sein. Dieser legendäre Erfolg ist deine Spur in der Ewigkeit.',
      },
    },

    // Categories
    categories: {
      all: 'Alle',
      habits: 'Gewohnheiten',
      journal: 'Tagebuch',
      goals: 'Ziele',
      consistency: 'Beständigkeit',
      mastery: 'Meisterschaft',
      social: 'Sozial',
      special: 'Besonders',
    },

    // Rarity levels
    rarity: {
      common: 'Gewöhnlich',
      rare: 'Selten',
      epic: 'Episch',
      legendary: 'Legendär',
    },

    // Celebration Modal
    celebration: {
      announcement: '{{rarity}} Erfolg freigeschaltet: {{name}}! Du hast {{xp}} Erfahrungspunkte verdient.',
      continue_button: 'Fortfahren',
      continue_hint: 'Erfolgsfeier schließen und zur App zurückkehren',
      rarity_common: 'Erfolg Freigeschaltet!',
      rarity_rare: 'Seltener Erfolg!',
      rarity_epic: 'Epischer Erfolg!',
      rarity_legendary: 'Legendärer Erfolg!',
      xp_earned: 'XP Verdient',
    },

    // Achievement Detail Modal
    detail: {
      unlockedYesterday: 'Gestern freigeschaltet',
      unlockedDaysAgo: 'Vor {{days}} Tagen freigeschaltet',
      unlockedWeeksAgo: 'Vor {{weeks}} Wochen freigeschaltet',
      unlockedRecently: 'Kürzlich freigeschaltet',
      recentlyUnlocked: 'Kürzlich freigeschaltet',
      titleUnlocked: 'Erfolg Freigeschaltet',
      titleDetails: 'Erfolg-Details',
      detailsSection: 'Erfolg-Details',
      categoryLabel: 'Kategorie:',
      rarityLabel: 'Seltenheit:',
      xpRewardLabel: 'XP-Belohnung:',
      xpPointsUnit: 'Punkte',
      progressToUnlock: 'Fortschritt zum Freischalten',
      progressLoading: 'Fortschritt wird geladen...',
      howToUnlock: 'Wie man freischaltet',
      estimatedDays: 'Geschätzt: {{days}} Tage verbleibend',
      lockedMessage: 'Dieser Erfolg ist gesperrt. Verwende die App weiter, um ihn freizuschalten!',
      requirementFallback: 'Erfolganforderung',
      actionHint: 'Arbeite weiter auf dieses Ziel hin!',
    },
    history: {
      justNow: 'Gerade eben',
      today: 'Heute',
      yesterday: 'Gestern',
      thisWeek: 'Diese Woche',
      lastWeek: 'Letzte Woche',
      thisMonth: 'Diesen Monat',
      aWhileAgo: 'Vor einer Weile',
    },

    // Trophy Room Stats
    trophyRoom: {
      totalTrophies: 'Gesamttrophäen',
      collected: 'Gesammelt',
      completionRate: 'Abschlussrate',
      overallProgress: 'Gesamtfortschritt',
      showingResults: 'Zeige {{filtered}} von {{total}} Erfolgen',
    },

    // Filtering and Search
    filter: {
      showAll: 'Alle anzeigen',
      unlockedOnly: 'Nur Freigeschaltete',
      lockedOnly: 'Nur Gesperrte',
      byCategory: 'Nach Kategorie',
      byRarity: 'Nach Seltenheit',
      searchPlaceholder: 'Erfolge suchen...',
      noResults: 'Keine Erfolge gefunden',
      noResultsSubtitle: 'Versuche, deine Filter oder Suchkriterien anzupassen',
      clearFilters: 'Filter löschen',
    },

    // Accessibility
    accessibility: {
      achievementCard: 'Erfolgsabzeichen für {{name}}',
      lockedAchievement: 'Gesperrter Erfolg: {{name}}',
      unlockedAchievement: 'Freigeschalteter Erfolg: {{name}}, verdient am {{date}}',
      progressBar: 'Fortschritt: {{progress}} Prozent erledigt',
      categoryFilter: 'Nach {{category}} Kategorie filtern',
      rarityBadge: '{{rarity}} Seltenheit Erfolg',
      searchInput: 'Erfolge nach Name oder Beschreibung suchen',
      sortButton: 'Erfolge nach {{criteria}} sortieren',
      filterButton: 'Erfolge filtern',
      viewDetails: 'Details für {{name}} Erfolg anzeigen',
    },

    // Achievement Names (78 achievements)
    achievementNames: {
      'first-habit': 'Erste Schritte',
      'habit-builder': 'Gewohnheits-Baumeister',
      'century-club': 'Century Club',
      'consistency-king': 'König der Beständigkeit',
      'habit-streak-champion': 'Gewohnheits-Serien-Champion',
      'century-streak': 'Jahrhundert-Serie',
      'streak-champion': 'Serien-Champion',
      'multi-tasker': 'Multitasker',
      'habit-legend': 'Gewohnheits-Legende',
      'first-journal': 'Erste Reflexion',
      'deep-thinker': 'Tiefgründiger Denker',
      'journal-enthusiast': 'Tagebuch-Enthusiast',
      'grateful-heart': 'Dankbares Herz',
      'gratitude-guru': 'Dankbarkeits-Guru',
      'eternal-gratitude': 'Ewige Dankbarkeit',
      'journal-streaker': 'Tagebuch-Streaker',
      'bonus-seeker': 'Bonus-Sucher',
      'first-star': 'Erster Stern',
      'five-stars': 'Fünf Sterne',
      'flame-achiever': 'Flammen-Erreicher',
      'bonus-week': 'Bonus-Woche',
      'crown-royalty': 'Kronen-Königtum',
      'flame-collector': 'Flammen-Sammler',
      'golden-bonus-streak': 'Goldene Bonus-Serie',
      'triple-crown-master': 'Dreifache-Kronen-Meister',
      'bonus-century': 'Bonus-Jahrhundert',
      'star-beginner': 'Stern-Anfänger',
      'star-collector': 'Stern-Sammler',
      'star-master': 'Stern-Meister',
      'star-champion': 'Stern-Champion',
      'star-legend': 'Stern-Legende',
      'flame-starter': 'Flammen-Starter',
      'flame-accumulator': 'Flammen-Akkumulator',
      'flame-master': 'Flammen-Meister',
      'flame-champion': 'Flammen-Champion',
      'flame-legend': 'Flammen-Legende',
      'crown-achiever': 'Kronen-Erreicher',
      'crown-collector': 'Kronen-Sammler',
      'crown-master': 'Kronen-Meister',
      'crown-champion': 'Kronen-Champion',
      'crown-emperor': 'Kronen-Kaiser',
      'first-goal': 'Erste Vision',
      'goal-getter': 'Zielerfüller',
      'ambitious': 'Ehrgeizig',
      'goal-champion': 'Ziel-Champion',
      'progress-tracker': 'Fortschritts-Verfolger',
      'mega-dreamer': 'Mega-Träumer',
      'achievement-unlocked': 'Erfolg Freigeschaltet',
      'million-achiever': 'Millionen-Erreicher',
      'weekly-warrior': 'Wöchentlicher Krieger',
      'monthly-master': 'Monatlicher Meister',
      'centurion': 'Zenturio',
      'hundred-days': 'Hundert Tage',
      'daily-visitor': 'Täglicher Besucher',
      'dedicated-user': 'Engagierter Nutzer',
      'perfect-month': 'Perfekter Monat',
      'triple-crown': 'Dreifache Krone',
      'gratitude-guardian': 'Dankbarkeits-Wächter',
      'dream-fulfiller': 'Traumerfüller',
      'goal-achiever': 'Zielerfüller',
      'level-up': 'Level aufsteigen',
      'selfrise-expert': 'SelfRise-Experte',
      'selfrise-master': 'SelfRise-Meister',
      'ultimate-selfrise-legend': 'Ultimative SelfRise-Legende',
      'recommendation-master': 'Empfehlungs-Meister',
      'balance-master': 'Balance-Meister',
      'trophy-collector-basic': 'Trophäen-Sammler',
      'trophy-collector-master': 'Trophäen-Meister',
      'lightning-start': 'Blitzstart',
      'seven-wonder': 'Sieben Wunder',
      'persistence-pays': 'Beharrlichkeit zahlt sich aus',
      'legendary-master': 'Legendärer Meister',
      'selfrise-legend': 'SelfRise-Legende',
      'loyalty-first-week': 'Erste Woche',
      'loyalty-two-weeks-strong': 'Zwei Wochen stark',
      'loyalty-three-weeks-committed': 'Drei Wochen engagiert',
      'loyalty-month-explorer': 'Monats-Entdecker',
      'loyalty-two-month-veteran': 'Zwei-Monats-Veteran',
      'loyalty-century-user': 'Jahrhundert-Nutzer',
      'loyalty-half-year-hero': 'Halbjahres-Held',
      'loyalty-year-legend': 'Jahres-Legende',
      'loyalty-ultimate-veteran': 'Ultimativer Veteran',
      'loyalty-master': 'Treue-Meister',
    },

    // Achievement Requirements (78 achievements)
    achievementRequirements: {
      'first-habit': 'Erstelle deine erste Gewohnheit',
      'habit-builder': 'Erstelle 5 verschiedene Gewohnheiten',
      'century-club': 'Schließe 100 Gewohnheitsaufgaben ab',
      'consistency-king': 'Schließe 1000 Gewohnheitsaufgaben ab',
      'habit-streak-champion': 'Erreiche eine 21-Tage-Serie mit jeder Gewohnheit',
      'century-streak': 'Halte eine 75-Tage-Serie mit jeder Gewohnheit aufrecht',
      'streak-champion': 'Erreiche eine 21-Tage-Serie mit jeder Gewohnheit',
      'multi-tasker': 'Schließe 5 verschiedene Gewohnheiten an einem Tag ab',
      'habit-legend': 'Erreiche Level 50 "Spezialist V" mit XP hauptsächlich aus Gewohnheitsaktivitäten',
      'first-journal': 'Schreibe deinen ersten Dankbarkeitstagebuch-Eintrag',
      'deep-thinker': 'Schreibe einen Tagebuch-Eintrag mit mindestens 200 Zeichen',
      'journal-enthusiast': 'Schreibe 100 Tagebuch-Einträge',
      'grateful-heart': 'Halte eine 7-Tage-Tagebuchschreiben-Serie',
      'gratitude-guru': 'Erreiche eine 30-Tage-Tagebuchschreiben-Serie',
      'eternal-gratitude': 'Halte eine 100-Tage-Tagebuch-Serie aufrecht',
      'journal-streaker': 'Erreiche eine 21-Tage-Tagebuchschreiben-Serie',
      'bonus-seeker': 'Schreibe 50 Bonus-Tagebuch-Einträge',
      'first-star': 'Verdiene einen Stern (erster Bonuseintrag des Tages)',
      'five-stars': 'Verdiene insgesamt 5 Mal einen Stern',
      'flame-achiever': 'Verdiene zum ersten Mal eine Flamme (5 Bonuseinträge an einem Tag)',
      'bonus-week': 'Mindestens 1 Bonus jeden Tag für 7 Tage in Folge',
      'crown-royalty': 'Verdiene zum ersten Mal eine Krone (10 Bonuseinträge an einem Tag)',
      'flame-collector': 'Verdiene insgesamt 5 Mal eine Flamme',
      'golden-bonus-streak': 'Mindestens 3 Bonuseinträge jeden Tag für 7 Tage in Folge',
      'triple-crown-master': 'Verdiene insgesamt 3 Mal eine Krone',
      'bonus-century': 'Schreibe insgesamt 200 Bonuseinträge',
      'star-beginner': 'Verdiene insgesamt 10 Mal einen Stern',
      'star-collector': 'Verdiene insgesamt 25 Mal einen Stern',
      'star-master': 'Verdiene insgesamt 50 Mal einen Stern',
      'star-champion': 'Verdiene insgesamt 100 Mal einen Stern',
      'star-legend': 'Verdiene insgesamt 200 Mal einen Stern',
      'flame-starter': 'Verdiene insgesamt 5 Mal eine Flamme',
      'flame-accumulator': 'Verdiene insgesamt 10 Mal eine Flamme',
      'flame-master': 'Verdiene insgesamt 25 Mal eine Flamme',
      'flame-champion': 'Verdiene insgesamt 50 Mal eine Flamme',
      'flame-legend': 'Verdiene insgesamt 100 Mal eine Flamme',
      'crown-achiever': 'Verdiene insgesamt 3 Mal eine Krone',
      'crown-collector': 'Verdiene insgesamt 5 Mal eine Krone',
      'crown-master': 'Verdiene insgesamt 10 Mal eine Krone',
      'crown-champion': 'Verdiene insgesamt 25 Mal eine Krone',
      'crown-emperor': 'Verdiene insgesamt 50 Mal eine Krone',
      'first-goal': 'Setze dein erstes Ziel',
      'goal-getter': 'Schließe dein erstes Ziel ab',
      'ambitious': 'Setze ein Ziel mit einem Wert von 1000 oder mehr',
      'goal-champion': 'Schließe 5 Ziele ab',
      'progress-tracker': 'Mache 7 aufeinanderfolgende Tage Fortschritt bei Zielen',
      'mega-dreamer': 'Setze ein Ziel mit einem Wert von 1.000.000 oder mehr',
      'achievement-unlocked': 'Schließe 10 Ziele ab',
      'million-achiever': 'Schließe ein Ziel mit einem Wert von 1.000.000 oder mehr ab',
      'weekly-warrior': 'Halte eine 7-Tage-Serie in einer beliebigen Gewohnheit',
      'monthly-master': 'Erreiche eine 30-Tage-Serie',
      'centurion': 'Erreiche 100 Tage Beständigkeit',
      'hundred-days': 'Halte eine 100-Tage-Gewohnheitsabschluss-Serie aufrecht',
      'daily-visitor': 'Nutze die App 7 aufeinanderfolgende Tage',
      'dedicated-user': 'Nutze die App 30 aufeinanderfolgende Tage',
      'perfect-month': 'Schließe Aktivitäten in allen 3 Bereichen an 28+ Tagen in einem Monat ab',
      'triple-crown': 'Halte 7+ Tage-Serien in Gewohnheiten, Tagebuch und Zielen gleichzeitig',
      'gratitude-guardian': 'Schreibe Tagebucheinträge für 21 aufeinanderfolgende Tage',
      'dream-fulfiller': 'Schließe 3 Ziele ab',
      'goal-achiever': 'Schließe 3 Ziele ab',
      'level-up': 'Erreiche Level 10 "Anfänger V"',
      'selfrise-expert': 'Erreiche Level 25 "Adept V"',
      'selfrise-master': 'Erreiche Level 50 "Spezialist V"',
      'ultimate-selfrise-legend': 'Erreiche Level 100 "Mythisch V"',
      'recommendation-master': 'Folge 20 personalisierten Empfehlungen',
      'balance-master': 'Nutze alle 3 Funktionen an einem Tag 10 Mal',
      'trophy-collector-basic': 'Schalte 10 Erfolge frei',
      'trophy-collector-master': 'Schalte 25 Erfolge frei',
      'lightning-start': 'Erstelle und schließe eine Gewohnheit am selben Tag 3 Mal ab',
      'seven-wonder': 'Habe 7 oder mehr aktive Gewohnheiten gleichzeitig',
      'persistence-pays': 'Kehre nach einer 3+ Tage Pause zurück und schließe 7 Aktivitäten ab',
      'legendary-master': 'Erreiche Elite-Status über 3 Hauptkategorien',
      'selfrise-legend': 'Erreiche Meisterschaft: 10 Ziele + 500 Gewohnheiten + 365 Tagebucheinträge',
      'loyalty-first-week': '7 aktive Tage insgesamt',
      'loyalty-two-weeks-strong': '14 aktive Tage insgesamt',
      'loyalty-three-weeks-committed': '21 aktive Tage insgesamt',
      'loyalty-month-explorer': '30 aktive Tage insgesamt',
      'loyalty-two-month-veteran': '60 aktive Tage insgesamt',
      'loyalty-century-user': '100 aktive Tage insgesamt',
      'loyalty-half-year-hero': '183 aktive Tage insgesamt',
      'loyalty-year-legend': '365 aktive Tage insgesamt',
      'loyalty-ultimate-veteran': '500 aktive Tage insgesamt',
      'loyalty-master': '1000 aktive Tage insgesamt',
    },

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

    // Achievement Progress Preview Hints (245+ keys for progress tracking)
    preview: {
      // Default fallback
      default: {
        progress: 'Fortschritt für diese Errungenschaft',
        action: 'Nutze die App-Funktionen, um diese Errungenschaft freizuschalten!'
      },

      // HABITS ACHIEVEMENTS (8 achievements = 24 keys)
      first_habit: {
        progress_incomplete: 'Erstelle deine erste Gewohnheit, um zu beginnen!',
        progress_complete: '✅ Erste Gewohnheit erstellt!',
        requirement: 'Erstelle deine allererste Gewohnheit',
        action: 'Gehe zum Gewohnheiten-Tab und erstelle deine erste Gewohnheit!'
      },
      habit_builder: {
        progress: 'Erstelle 5 Gewohnheiten ({{current}}/{{target}})',
        requirement: 'Erstelle 5 verschiedene Gewohnheiten zur Entwicklung',
        action: 'Erstelle mehr Gewohnheiten, um dein Wachstum zu diversifizieren!'
      },
      century_club: {
        progress: 'Schließe 100 Gewohnheiten ab ({{current}}/{{target}})',
        requirement: 'Schließe insgesamt 100 Gewohnheitsaufgaben ab',
        action: 'Mach weiter mit deinen täglichen Gewohnheiten!'
      },
      consistency_king: {
        progress: 'Schließe 1000 Gewohnheiten ab ({{current}}/{{target}})',
        requirement: 'Schließe insgesamt 1000 Gewohnheitsaufgaben ab',
        action: 'Du baust erstaunliche Beständigkeit auf!'
      },
      streak_champion: {
        progress: 'Erreiche 21-Tage-Serie (beste: {{current}} Tage)',
        requirement: 'Erreiche eine 21-Tage-Serie mit einer einzigen Gewohnheit',
        action: 'Fokussiere dich auf Beständigkeit mit einer Gewohnheit!'
      },
      century_streak: {
        progress: 'Erreiche 75-Tage-Serie (beste: {{current}} Tage)',
        requirement: 'Halte eine 75-Tage-Serie mit einer Gewohnheit',
        action: 'Unglaubliche Hingabe! Halte die Serie am Leben!'
      },
      multi_tasker: {
        progress: 'Schließe 5 Gewohnheiten an einem Tag ab (beste: {{current}})',
        requirement: 'Schließe 5 verschiedene Gewohnheiten an einem einzigen Tag ab',
        action: 'Fordere dich heute mit mehreren Gewohnheiten heraus!'
      },
      habit_legend: {
        progress: 'Erreiche Level 50 mit 50%+ EP aus Gewohnheiten (Level {{level}}, {{xpPercent}}% Gewohnheits-EP)',
        requirement: 'Erreiche Level 50 mit 50%+ EP aus Gewohnheitsaktivitäten',
        action: 'Fokussiere dich auf Gewohnheitsaktivitäten, um dein EP-Verhältnis zu steigern!'
      },

      // JOURNAL ACHIEVEMENTS - Basic (8 achievements = 24 keys)
      first_journal: {
        progress_incomplete: 'Schreibe deinen ersten Dankbarkeitseintrag!',
        progress_complete: '✅ Erste Reflexion abgeschlossen!',
        requirement: 'Schreibe deinen ersten Dankbarkeits-Tagebucheintrag',
        action: 'Gehe zum Tagebuch-Tab und schreibe deinen ersten Eintrag!'
      },
      deep_thinker: {
        progress_checking: 'Prüfe deine nachdenklichen Einträge...',
        requirement: 'Schreibe einen Tagebucheintrag mit mindestens 200 Zeichen',
        action: 'Drücke dich in deinem nächsten Tagebucheintrag vollständig aus!'
      },
      journal_enthusiast: {
        progress: 'Schreibe 100 Tagebucheinträge ({{current}}/{{target}})',
        requirement: 'Schreibe insgesamt 100 Tagebucheinträge',
        action: 'Drücke weiterhin täglich Dankbarkeit aus!'
      },
      grateful_heart: {
        progress: 'Halte 7-Tage-Serie (aktuell: {{current}} Tage)',
        requirement: 'Halte eine 7-Tage-Tagebuch-Serie',
        action: 'Halte deine Serie mit täglichen Einträgen am Leben!'
      },
      journal_streaker: {
        progress: 'Erreiche 21-Tage-Serie (beste: {{current}} Tage)',
        requirement: 'Schreibe 21 aufeinanderfolgende Tage in dein Tagebuch',
        action: 'Du baust eine starke Dankbarkeitsgewohnheit auf!'
      },
      gratitude_guru: {
        progress: 'Erreiche 30-Tage-Serie (beste: {{current}} Tage)',
        requirement: 'Erreiche eine 30-Tage-Tagebuch-Serie',
        action: 'Du wirst zum Dankbarkeits-Meister!'
      },
      eternal_gratitude: {
        progress: 'Erreiche 100-Tage-Serie (beste: {{current}} Tage)',
        requirement: 'Halte eine 100-Tage-Tagebuch-Serie',
        action: 'Unglaubliche Hingabe zur Dankbarkeit!'
      },
      bonus_seeker: {
        progress: 'Schreibe 50 Bonus-Einträge ({{current}}/{{target}})',
        requirement: 'Schreibe 50 Bonus-Tagebucheinträge',
        action: 'Gehe über das tägliche Minimum hinaus mit Bonus-Einträgen!'
      },

      // JOURNAL BONUS ACHIEVEMENTS - Basic (9 achievements = 27 keys)
      first_star: {
        progress_incomplete: 'Hol dir deinen ersten ⭐ Bonus-Meilenstein!',
        progress_complete: '✅ Erster Stern verdient!',
        requirement: 'Schreibe deinen ersten Bonus-Tagebucheintrag für einen Stern',
        action: 'Schreibe 4+ Tagebucheinträge heute, um deinen ersten ⭐ zu verdienen!'
      },
      five_stars: {
        progress: 'Verdiene insgesamt 5 Sterne ({{current}}/{{target}})',
        requirement: 'Verdiene 5 Mal insgesamt ⭐ Meilenstein',
        action: 'Schreibe weiter Bonus-Einträge, um mehr Sterne zu verdienen!'
      },
      flame_achiever: {
        progress_incomplete: 'Hol dir deinen ersten 🔥 Flammen-Meilenstein!',
        progress_complete: '✅ Erste Flamme verdient!',
        requirement: 'Schreibe 5+ Bonus-Einträge an einem Tag, um eine Flamme zu verdienen',
        action: 'Fordere dich mit 8+ Tagebucheinträgen an einem Tag heraus!'
      },
      bonus_week: {
        progress: 'Bonus-Serie 7 Tage ({{current}}/{{target}})',
        requirement: 'Schreibe mindestens 1 Bonus-Eintrag für 7 aufeinanderfolgende Tage',
        action: 'Schreibe 4+ Einträge täglich, um deine Bonus-Serie zu halten!'
      },
      crown_royalty: {
        progress_incomplete: 'Hol dir deinen ersten 👑 Kronen-Meilenstein!',
        progress_complete: '✅ Erste Krone verdient!',
        requirement: 'Schreibe 10+ Bonus-Einträge an einem Tag, um eine Krone zu verdienen',
        action: 'Erreiche königlichen Status mit 13+ Tagebucheinträgen an einem Tag!'
      },
      flame_collector: {
        progress: 'Sammle insgesamt 5 Flammen ({{current}}/{{target}})',
        requirement: 'Verdiene 5 Mal insgesamt 🔥 Meilenstein',
        action: 'Hab weiter intensive Dankbarkeitstage mit 5+ Bonus-Einträgen!'
      },
      golden_bonus_streak: {
        progress: 'Goldene Bonus-Serie 7 Tage ({{current}}/{{target}})',
        requirement: 'Schreibe 3+ Bonus-Einträge täglich für 7 aufeinanderfolgende Tage',
        action: 'Schreibe 6+ Einträge täglich für die ultimative Bonus-Serie!'
      },
      triple_crown_master: {
        progress: 'Verdiene insgesamt 3 Kronen ({{current}}/{{target}})',
        requirement: 'Verdiene 3 Mal insgesamt 👑 Meilenstein',
        action: 'Meistere die Kunst königlicher Dankbarkeitstage!'
      },
      bonus_century: {
        progress: 'Schreibe 200 Bonus-Einträge ({{current}}/{{target}})',
        requirement: 'Schreibe insgesamt 200 Bonus-Tagebucheinträge',
        action: 'Ultimative Bonus-Meisterschaft - schreibe weiter über das Minimum hinaus!'
      },

      // JOURNAL BONUS - Star Milestones (5 achievements = 15 keys)
      star_beginner: {
        progress: 'Verdiene insgesamt 10 Sterne ({{current}}/{{target}})',
        requirement: 'Verdiene 10 Mal insgesamt ⭐ Meilenstein',
        action: 'Baue deine Sammlung von Bonus-Tagen auf!'
      },
      star_collector: {
        progress: 'Verdiene insgesamt 25 Sterne ({{current}}/{{target}})',
        requirement: 'Verdiene 25 Mal insgesamt ⭐ Meilenstein',
        action: 'Du wirst zum Sternensammler!'
      },
      star_master: {
        progress: 'Verdiene insgesamt 50 Sterne ({{current}}/{{target}})',
        requirement: 'Verdiene 50 Mal insgesamt ⭐ Meilenstein',
        action: 'Sternen-Meisterschaft in Sicht - verdiene weiter Bonus-Meilensteine!'
      },
      star_champion: {
        progress: 'Verdiene insgesamt 75 Sterne ({{current}}/{{target}})',
        requirement: 'Verdiene 75 Mal insgesamt ⭐ Meilenstein',
        action: 'Du bist ein echter Sternen-Champion!'
      },
      star_legend: {
        progress: 'Verdiene insgesamt 100 Sterne ({{current}}/{{target}})',
        requirement: 'Verdiene 100 Mal insgesamt ⭐ Meilenstein',
        action: 'Legendärer Sternensammler-Status - du bist unaufhaltsam!'
      },

      // JOURNAL BONUS - Flame Milestones (5 achievements = 15 keys)
      flame_starter: {
        progress: 'Verdiene insgesamt 10 Flammen ({{current}}/{{target}})',
        requirement: 'Verdiene 10 Mal insgesamt 🔥 Meilenstein',
        action: 'Hab weiter diese intensiven Tagebuch-Tage!'
      },
      flame_accumulator: {
        progress: 'Verdiene insgesamt 20 Flammen ({{current}}/{{target}})',
        requirement: 'Verdiene 20 Mal insgesamt 🔥 Meilenstein',
        action: 'Deine Flammensammlung wächst!'
      },
      flame_master: {
        progress: 'Verdiene insgesamt 35 Flammen ({{current}}/{{target}})',
        requirement: 'Verdiene 35 Mal insgesamt 🔥 Meilenstein',
        action: 'Meister intensiver Dankbarkeits-Sessions!'
      },
      flame_champion: {
        progress: 'Verdiene insgesamt 50 Flammen ({{current}}/{{target}})',
        requirement: 'Verdiene 50 Mal insgesamt 🔥 Meilenstein',
        action: 'Du bist ein Flammen-Champion!'
      },
      flame_legend: {
        progress: 'Verdiene insgesamt 75 Flammen ({{current}}/{{target}})',
        requirement: 'Verdiene 75 Mal insgesamt 🔥 Meilenstein',
        action: 'Legendärer Flammen-Status - deine Hingabe ist inspirierend!'
      },

      // JOURNAL BONUS - Crown Milestones (5 achievements = 15 keys)
      crown_achiever: {
        progress: 'Verdiene insgesamt 5 Kronen ({{current}}/{{target}})',
        requirement: 'Verdiene 5 Mal insgesamt 👑 Meilenstein',
        action: 'Du erreichst königlichen Dankbarkeitsstatus!'
      },
      crown_collector: {
        progress: 'Verdiene insgesamt 10 Kronen ({{current}}/{{target}})',
        requirement: 'Verdiene 10 Mal insgesamt 👑 Meilenstein',
        action: 'Baue deine Kronensammlung auf!'
      },
      crown_master: {
        progress: 'Verdiene insgesamt 15 Kronen ({{current}}/{{target}})',
        requirement: 'Verdiene 15 Mal insgesamt 👑 Meilenstein',
        action: 'Meister königlicher Tagebuch-Tage!'
      },
      crown_champion: {
        progress: 'Verdiene insgesamt 25 Kronen ({{current}}/{{target}})',
        requirement: 'Verdiene 25 Mal insgesamt 👑 Meilenstein',
        action: 'Du bist ein Kronen-Champion!'
      },
      crown_emperor: {
        progress: 'Verdiene insgesamt 40 Kronen ({{current}}/{{target}})',
        requirement: 'Verdiene 40 Mal insgesamt 👑 Meilenstein',
        action: 'Kaiserlicher Status erreicht - du bist Dankbarkeits-Royalität!'
      },

      // GOALS ACHIEVEMENTS (8 achievements = 24 keys)
      first_goal: {
        progress_incomplete: 'Erstelle dein erstes Ziel, um zu starten!',
        progress_complete: '✅ Erstes Ziel erstellt!',
        requirement: 'Erstelle dein allerstes Ziel',
        action: 'Gehe zum Ziele-Tab und setze dein erstes Ziel!'
      },
      goal_getter: {
        progress: 'Erstelle 5 Ziele ({{current}}/{{target}})',
        requirement: 'Erstelle 5 verschiedene Ziele',
        action: 'Setze mehr Ziele, um deine Ambitionen zu erweitern!'
      },
      goal_achiever: {
        progress: 'Schließe 5 Ziele ab ({{current}}/{{target}})',
        requirement: 'Schließe insgesamt 5 Ziele ab',
        action: 'Schließe weiter deine Ziele ab!'
      },
      goal_champion: {
        progress: 'Schließe 20 Ziele ab ({{current}}/{{target}})',
        requirement: 'Schließe insgesamt 20 Ziele ab',
        action: 'Du bist ein Ziel-Champion!'
      },
      achievement_unlocked: {
        progress: 'Absolviere 10 Ziele ({{current}}/{{target}})',
        progress_incomplete: 'Schließe dein erstes Ziel ab!',
        progress_complete: '✅ Erstes Ziel abgeschlossen!',
        requirement: 'Schließe dein erstes Ziel ab',
        action: 'Mach Fortschritte bei deinen aktiven Zielen!'
      },
      ambitious: {
        progress_incomplete: 'Erstelle ein Ziel mit 1000+ Zielwert!',
        progress_complete: '✅ Großes Ziel erstellt!',
        requirement: 'Erstelle ein Ziel mit einem Zielwert von 1000 oder mehr',
        action: 'Denke groß und setze ein ehrgeiziges Ziel!'
      },
      progress_tracker: {
        progress: 'Aktualisiere Ziel-Fortschritt für 10 Tage ({{current}}/{{target}})',
        requirement: 'Aktualisiere Ziel-Fortschritt für 10 aufeinanderfolgende Tage',
        action: 'Verfolge weiter deinen täglichen Ziel-Fortschritt!'
      },
      goal_explorer: {
        progress: 'Erstelle Ziele in 3 Kategorien ({{current}}/{{target}})',
        requirement: 'Erstelle Ziele in 3 verschiedenen Kategorien',
        action: 'Diversifiziere deine Ziele über Kategorien!'
      },

      // CONSISTENCY ACHIEVEMENTS (8 achievements = 24 keys)
      weekly_warrior: {
        progress: 'Nutze App für 7 Tage ({{current}}/{{target}})',
        requirement: 'Nutze die App für 7 aufeinanderfolgende Tage',
        action: 'Halte deine tägliche Serie am Leben!'
      },
      monthly_master: {
        progress: 'Nutze App für 30 Tage ({{current}}/{{target}})',
        requirement: 'Nutze die App für 30 aufeinanderfolgende Tage',
        action: 'Du baust unglaubliche Beständigkeit auf!'
      },
      hundred_days: {
        progress: 'Nutze App für 100 Tage ({{current}}/{{target}})',
        requirement: 'Nutze die App für 100 aufeinanderfolgende Tage',
        action: 'Legendäre Beständigkeit - mach weiter!'
      },
      daily_visitor: {
        progress: 'Öffne App {{current}} Mal',
        requirement: 'Öffne die App regelmäßig für {{target}} Tage insgesamt',
        action: 'Mach die App zu einem Teil deiner täglichen Routine!'
      },
      dedicated_user: {
        progress: '{{current}} aktive Tage insgesamt',
        requirement: 'Sei für {{target}} Tage insgesamt aktiv (nicht aufeinanderfolgend)',
        action: 'Komm weiter zurück und wachse!'
      },
      perfect_month: {
        progress: 'Perfekte Tage diesen Monat: {{current}}/{{target}}',
        requirement: 'Schließe alle drei Aktivitätstypen jeden Tag für 30 Tage ab',
        action: 'Schließe täglich Gewohnheiten, Tagebuch und Ziele ab!'
      },
      triple_crown: {
        progress_incomplete: 'Schließe heute Gewohnheiten, Tagebuch und Ziele ab!',
        progress_complete: '✅ Triple Crown verdient!',
        requirement: 'Schließe mindestens eine Gewohnheit, einen Tagebucheintrag und Ziel-Fortschritt an einem Tag ab',
        action: 'Mach heute alle drei Aktivitätstypen für die Krone!'
      },
      balance_master: {
        progress: 'Ausgeglichene Tage: {{current}}/{{target}}',
        requirement: 'Nutze alle drei Funktionen (Gewohnheiten, Tagebuch, Ziele) an einem Tag, {{target}} Mal insgesamt',
        action: 'Balanciere weiter alle Wachstumsbereiche!'
      },

      // MASTERY ACHIEVEMENTS (9 achievements = 27 keys)
      level_up: {
        progress: 'Erreiche Level 10 (aktuell: Level {{current}})',
        requirement: 'Erreiche Level 10',
        action: 'Verdiene weiter EP durch Aktivitäten!'
      },
      selfrise_expert: {
        progress: 'Erreiche Level 25 (aktuell: Level {{current}})',
        requirement: 'Erreiche Level 25',
        action: 'Du wirst zum SelfRise-Experten!'
      },
      selfrise_master: {
        progress: 'Erreiche Level 50 (aktuell: Level {{current}})',
        requirement: 'Erreiche Level 50',
        action: 'Meister-Level naht - wachse weiter!'
      },
      ultimate_selfrise_legend: {
        progress: 'Erreiche Level 100 (aktuell: Level {{current}})',
        requirement: 'Erreiche das maximale Level 100',
        action: 'Die ultimative Errungenschaft - legendärer Status wartet!'
      },
      trophy_collector_basic: {
        progress: 'Schalte 10 Errungenschaften frei ({{current}}/{{target}})',
        requirement: 'Schalte insgesamt 10 Errungenschaften frei',
        action: 'Schalte weiter Errungenschaften in allen Kategorien frei!'
      },
      trophy_collector_master: {
        progress: 'Schalte 30 Errungenschaften frei ({{current}}/{{target}})',
        requirement: 'Schalte insgesamt 30 Errungenschaften frei',
        action: 'Meister-Sammler-Status - finde alle Errungenschaften!'
      },
      recommendation_master: {
        progress: 'Folge {{current}} Empfehlungen',
        requirement: 'Folge {{target}} personalisierten Empfehlungen',
        action: 'Schau dir die Empfehlungen an und folge der Anleitung!'
      },
      balance_master_alt: {
        progress: 'Ausgeglichene Tage: {{current}}/{{target}}',
        requirement: 'Nutze Gewohnheiten, Tagebuch und Ziele an einem Tag für {{target}} Tage',
        action: 'Nutze weiter alle drei Funktionen täglich!'
      },
      harmony_streak: {
        progress: 'Aktuelle Harmonie-Serie: {{current}} Tage',
        requirement: 'Halte Harmonie (alle Funktionen) für {{target}} aufeinanderfolgende Tage',
        action: 'Schließe täglich Gewohnheiten, Tagebuch und Ziele ab!'
      },

      // SPECIAL ACHIEVEMENTS (14 achievements = 42 keys)
      lightning_start: {
        progress: 'Blitzstarts: {{current}}/{{target}}',
        requirement: 'Erstelle und schließe eine Gewohnheit am selben Tag ab ({{target}} Mal)',
        action: 'Erstelle eine Gewohnheit und schließe sie heute ab!'
      },
      seven_wonder: {
        progress: 'Aktive Gewohnheiten: {{current}}/{{target}}',
        requirement: 'Habe {{target}} aktive Gewohnheiten gleichzeitig',
        action: 'Erstelle mehr Gewohnheiten, um {{target}} aktive Gewohnheiten zu erreichen!'
      },
      persistence_pays: {
        progress: 'Comebacks: {{current}}/{{target}}',
        requirement: 'Kehre zur App zurück nach 7+ Tagen Inaktivität ({{target}} Mal)',
        action: 'Auch wenn du eine Pause machst, Zurückkommen zählt!'
      },
      legendary_master: {
        progress: '{{current}}% zum legendären Status',
        requirement: 'Schließe alle großen Meilensteine in allen Kategorien ab',
        action: 'Meistere jeden Aspekt von SelfRise, um legendären Status zu erreichen!'
      },

      // Loyalty Achievements (10 achievements = 30 keys)
      loyalty_first_week: {
        progress: 'Aktive Tage: {{current}}/{{target}}',
        requirement: '7 aktive Tage insgesamt',
        action: 'Nutze die App weiter täglich!'
      },
      loyalty_two_weeks_strong: {
        progress: 'Aktive Tage: {{current}}/{{target}}',
        requirement: '14 aktive Tage insgesamt',
        action: 'Dein Engagement wächst!'
      },
      loyalty_three_weeks_committed: {
        progress: 'Aktive Tage: {{current}}/{{target}}',
        requirement: '21 aktive Tage insgesamt',
        action: 'Drei Wochen Hingabe!'
      },
      loyalty_month_explorer: {
        progress: 'Aktive Tage: {{current}}/{{target}}',
        requirement: '30 aktive Tage insgesamt',
        action: 'Erkunde dein Potenzial!'
      },
      loyalty_two_month_veteran: {
        progress: 'Aktive Tage: {{current}}/{{target}}',
        requirement: '60 aktive Tage insgesamt',
        action: 'Erfahren in persönlichem Wachstum!'
      },
      loyalty_century_user: {
        progress: 'Aktive Tage: {{current}}/{{target}}',
        requirement: '100 aktive Tage insgesamt',
        action: 'Elite-Nutzer-Status naht!'
      },
      loyalty_half_year_hero: {
        progress: 'Aktive Tage: {{current}}/{{target}}',
        requirement: '183 aktive Tage insgesamt',
        action: 'Dein Engagement ist legendär!'
      },
      loyalty_year_legend: {
        progress: 'Aktive Tage: {{current}}/{{target}})',
        requirement: '365 aktive Tage insgesamt',
        action: 'Legendärer Status in Reichweite!'
      },
      loyalty_ultimate_veteran: {
        progress: 'Aktive Tage: {{current}}/{{target}}',
        requirement: '500 aktive Tage insgesamt',
        action: 'Ultimative Hingabe!'
      },
      loyalty_master: {
        progress: 'Aktive Tage: {{current}}/{{target}}',
        requirement: '1000 aktive Tage insgesamt',
        action: 'Meister der Loyalität - du bist unaufhaltsam!'
      },
    },
  } as any,

  // Auth screens
  auth: {
    login: {
      title: 'Willkommen zurück',
      email: 'E-Mail',
      emailPlaceholder: 'Gib deine E-Mail ein...',
      password: 'Passwort',
      passwordPlaceholder: 'Gib dein Passwort ein...',
      loginButton: 'Anmelden',
      forgotPassword: 'Passwort vergessen?',
      noAccount: 'Hast du noch kein Konto?',
      signUp: 'Registrieren',
    },
    register: {
      title: 'Konto erstellen',
      displayName: 'Anzeigename',
      displayNamePlaceholder: 'Gib deinen Namen ein...',
      email: 'E-Mail',
      emailPlaceholder: 'Gib deine E-Mail ein...',
      password: 'Passwort',
      passwordPlaceholder: 'Gib dein Passwort ein...',
      confirmPassword: 'Passwort bestätigen',
      confirmPasswordPlaceholder: 'Bestätige dein Passwort...',
      registerButton: 'Registrieren',
      hasAccount: 'Hast du bereits ein Konto?',
      signIn: 'Anmelden',
    },
  } as any,

  // Gamification System
  gamification: {
    xp: {
      label: 'Erfahrungspunkte',
      short: 'EP',
      gained: 'EP erhalten',
      lost: 'EP verloren',
      total: 'Gesamt-EP',
      loading: 'EP werden geladen...',

      sources: {
        habit_completion: 'Gewohnheit abgeschlossen',
        habit_bonus: 'Gewohnheits-Bonus',
        journal_entry: 'Tagebuch-Eintrag',
        journal_bonus: 'Tagebuch-Bonus',
        journal_bonus_milestone: 'Tagebuch-Bonus-Meilenstein',
        goal_progress: 'Zielfortschritt',
        goal_completion: 'Ziel abgeschlossen',
        habit_streak_milestone: 'Gewohnheits-Serien-Meilenstein',
        journal_streak_milestone: 'Tagebuch-Serien-Meilenstein',
        achievement_unlock: 'Erfolg freigeschaltet',
        general_activity: 'Aktivität',
        daily_engagement: 'Tägliches Engagement',
        monthly_challenge: 'Monatsherausforderung',
        XP_MULTIPLIER_BONUS: 'Comeback-Bonus',
      },

      notification: {
        message: 'Erfahrungspunkte-Benachrichtigung: {{message}}',
        amount: 'Erfahrungspunkte {{type}}: {{amount}}',
      },

      announcement: {
        balanced: 'Keine Netto-Erfahrungspunkte aus kürzlichen Aktivitäten gewonnen oder verloren',
        decreased: '{{xp}} Erfahrungspunkte aus kürzlichen Aktivitäten verloren',
        single: '{{xp}} Erfahrungspunkte aus {{count}} {{source}} erhalten',
        multiple_same: '{{xp}} Erfahrungspunkte aus {{count}} {{source}} erhalten',
        multiple_mixed: '{{xp}} Erfahrungspunkte aus mehreren Aktivitäten erhalten',
      },

      popup: {
        gained: '{{amount}} Erfahrungspunkte aus {{source}} erhalten',
        lost: '{{amount}} Erfahrungspunkte aus {{source}} verloren',
        amount_label: '{{sign}} {{amount}} Erfahrungspunkte',
      },

      // Notification messages
      notifications: {
        completed: 'abgeschlossen',
        balanced: 'Aktivitäten ausgeglichen (kein Netto-Fortschritt)',
        reversed: 'Fortschritt umgekehrt',
        updated: 'Aktivitäten aktualisiert',
        and: 'und',
      },
    },

    progress: {
      level: 'Level',
      progress: 'Fortschritt',
      to_next_level: 'bis Level {{level}}',
      xp_remaining: '{{xp}} EP verbleibend',
      loading: 'EP werden geladen...',

      accessibility: {
        label: 'Erfahrungslevel {{currentLevel}}, {{levelTitle}}. {{progress}} Prozent Fortschritt bis Level {{nextLevel}}. {{xpRemaining}} Erfahrungspunkte verbleibend.{{#isMilestone}} Dies ist ein Meilenstein-Level.{{/isMilestone}}',
        hint: 'Dein aktuelles Erfahrungslevel und Fortschritt zum nächsten Level.{{#isMilestone}} Du hast ein besonderes Meilenstein-Level mit einzigartigen Belohnungen erreicht.{{/isMilestone}}',
      },

      badge: {
        accessibility: 'Level {{currentLevel}} Abzeichen, {{levelTitle}}{{#isMilestone}}, Meilenstein-Level{{/isMilestone}}',
      },

      bar: {
        accessibility: 'Erfahrungsfortschrittsleiste, {{progress}} Prozent abgeschlossen',
      },

      milestone: {
        accessibility: 'Meilenstein-Level-Indikator',
      },
    },

    levels: {
      current: 'Aktuelles Level',
      next: 'Nächstes Level',
      milestone: 'Meilenstein-Level',
      rewards: 'Level-Belohnungen',
      title: 'Level-Titel',
      description: 'Level-Beschreibung',

      // Level Overview Screen
      overview: {
        currentBadge: 'Aktuell',
        xpRequiredSuffix: 'XP erforderlich',
        rarity: {
          mythic: 'Mythisch',
          legendary: 'Legendär',
          epic: 'Episch',
          rare: 'Selten',
          growing: 'Wachsend',
          beginner: 'Anfänger',
        },
      },
    },

    effects: {
      level_up: 'Level-Up-Feier',
      milestone: 'Meilenstein-Erfolg-Feier',
      achievement: 'Erfolgsfreischaltung-Feier',
      celebration: 'Allgemeine Feier',
      general: 'Feiereffekte',
      accessibility_label: '{{type}} mit {{intensity}} Intensität Partikeleffekte',
    },

    celebration: {
      level_up_announcement: 'Herzlichen Glückwunsch! Du hast Level {{level}}{{#isMilestone}}, ein Meilenstein-Level{{/isMilestone}} erreicht!',
      level_up_modal: 'Level {{level}} Erfolg{{#isMilestone}} Meilenstein{{/isMilestone}} Feier',
      level_up_section_accessibility: 'Level {{level}} Erfolg{{#isMilestone}} Meilenstein{{/isMilestone}} Details',
      level_badge_accessibility: 'Level {{level}}{{#isMilestone}} Meilenstein{{/isMilestone}} Abzeichen',
      level_title_accessibility: 'Level-Titel: {{title}}',
      rewards_section_accessibility: 'Liste neuer Belohnungen mit {{count}} Einträgen',
      rewards_title: 'Neue Belohnungen:',
      reward_item_accessibility: 'Belohnung {{index}}: {{reward}}',
      continue_button_accessibility: 'Fortfahren und Feier schließen',
      continue_button_hint: 'Tippe, um diese Feier zu schließen und zur App zurückzukehren',

      emoji: {
        daily_complete: 'Party-Feier-Emoji',
        streak_milestone: 'Trophäen-Feier-Emoji',
        bonus_milestone: 'Stern-Feier-Emoji',
        level_up: 'Level-Up-Feier-Emoji',
      },
    },

    // XP Multiplier
    multiplier: {
      continue: 'Weiter',
      harmonyActivated: 'Harmonie-Serie aktiviert!',
      achievementUnlocked: '🎯 Erfolg freigeschaltet!',
      harmonyStreakLabel: 'Tage Harmonie-Serie',
      bonusXP: 'Bonus-XP',
      duration: 'Multiplikator-Dauer',
      activated: '🚀 MULTIPLIKATOR AKTIVIERT!',
      activateButton: '2x XP aktivieren',
      duration24h: '24 Stunden',
    },

    analysis: {
      title: 'Leistungsanalyse',
      overallRating: 'Gesamtbewertung',
      trend: 'Trend',
      successRate: 'Erfolgsquote',
      strongest: 'Stärkste',
    },

    achievement: {
      unlocked: 'Erfolg freigeschaltet!',
      locked: 'Gesperrter Erfolg',
      progress: 'Fortschritt: {{current}}/{{target}}',
      xp_reward: '+{{xp}} EP',
      requirements: 'Anforderungen',
      unlock_condition: 'Freischaltbedingung',

      announcement: {
        unlocked: 'Erfolg freigeschaltet: {{name}}! Du hast {{xp}} Erfahrungspunkte erhalten.',
      },
    },

    sources: {
      habit_completion: {
        icon_description: 'Laufende Person Symbol für Gewohnheitsabschluss',
      },
      habit_bonus: {
        icon_description: 'Laufende Person Symbol für Gewohnheits-Bonus',
      },
      journal_entry: {
        icon_description: 'Schreib-Symbol für Tagebuch-Eintrag',
      },
      journal_bonus: {
        icon_description: 'Schreib-Symbol für Tagebuch-Bonus',
      },
      journal_bonus_milestone: {
        icon_description: 'Stern-Symbol für Tagebuch-Bonus-Meilenstein-Erfolg',
      },
      goal_progress: {
        icon_description: 'Ziel-Symbol für Zielfortschritt',
      },
      goal_completion: {
        icon_description: 'Ziel-Symbol für Zielabschluss',
      },
      goal_milestone: {
        icon_description: 'Stern-Symbol für Zielmeilenstein',
      },
      habit_streak_milestone: {
        icon_description: 'Feuer-Symbol für Gewohnheits-Serien-Meilenstein',
      },
      journal_streak_milestone: {
        icon_description: 'Feuer-Symbol für Tagebuch-Serien-Meilenstein',
      },
      achievement_unlock: {
        icon_description: 'Trophäen-Symbol für Erfolgsfreischaltung',
      },
      weekly_challenge: {
        icon_description: 'Trophäen-Symbol für Abschluss der Wochenherausforderung',
      },
      general_activity: {
        icon_description: 'Funkel-Symbol für allgemeine Aktivität',
      },
      monthly_challenge: {
        icon_description: 'Kalender-Symbol für Fortschritt der Monatsherausforderung',
      },
      XP_MULTIPLIER_BONUS: {
        icon_description: 'Blitz-Symbol für Comeback-Bonus-Multiplikator',
      },
    },
  } as any,

  // Help system
  help: {
    habits: {
      scheduling: {
        title: 'Gewohnheitsplanung',
        content: 'Du hast die Kontrolle! Wähle, an welchen Tagen deine Gewohnheit aktiv sein soll. Willst du tägliche Motivation? Dann nimm jeden Tag! Bevorzugst du nur Wochentage? Kein Problem! Individuelle Planung gibt dir die Freiheit, Gewohnheiten aufzubauen, die wirklich zu deinem Leben passen.'
      },
      bonusConversion: {
        title: 'Bonus-Umwandlung',
        content: 'Gehst du über dich hinaus? Wir lieben diese Energie! 🔥 Wenn du mehr als dein Tagesziel erreichst, verwandeln sich diese extra Bemühungen in Bonus-EP. Das ist unsere Art, deine fantastische Hingabe zu feiern!'
      },
      streakTracking: {
        title: 'Gewohnheitsserien',
        content: 'Baue unglaubliche Serien auf, indem du deine Gewohnheiten Tag für Tag abschließt! 📅 Beobachte, wie deine Zahlen wachsen und spüre den Schwung. Außerdem schaltest du großartige Erfolge bei wichtigen Meilensteinen frei!'
      },
      colorAndIcon: {
        title: 'Gewohnheits-Personalisierung',
        content: 'Mach es zu deinem! Wähle Farben und Symbole, die zu dir sprechen. 🎨 Wenn deine Gewohnheiten fantastisch aussehen, willst du sie tatsächlich abhaken. Es ist wie ein persönliches Dashboard, das dich jeden Tag motiviert!'
      },
      makeupFunction: {
        title: 'Intelligentes Nachholsystem',
        content: 'Das Leben passiert, und wir haben deinen Rücken! ✨ Wenn du einen geplanten Tag verpasst, können alle Bonus-Abschlüsse, die du verdienst, automatisch in "Nachholungen" für diesen Tag umgewandelt werden. Achte auf das goldene Häkchen ✓ in deinem Kalender - es bedeutet, dass du einen verpassten Tag mit deiner extra Anstrengung wiederhergestellt hast!'
      }
    },
    journal: {
      gratitudeStreak: {
        title: 'Dankbarkeits-Serie',
        content: 'Du baust etwas Wunderschönes auf! ✨ Jeden Tag, an dem du Dankbarkeitseinträge schreibst, wird deine Serie stärker. Nur 3 Einträge täglich halten deinen Schwung aufrecht und schalten fantastische Feier-Meilensteine frei!'
      },
      selfRiseStreak: {
        title: 'SelfRise-Serie',
        content: 'Das ist deine gesamte Wachstumsreise! 🌱 Um deine Serie aufrechtzuerhalten, schreibe täglich mindestens 3 Dankbarkeitseinträge. Dies verfolgt dein tägliches Engagement über alles hinweg - Gewohnheiten, Ziele und Tagebuch. Es ist das große Bild deines fantastischen Fortschritts!'
      },
      bonusEntries: {
        title: 'Bonus-Einträge',
        content: 'Fühlst du dich heute besonders dankbar? Leg los! 💫 Mehr als 3 Einträge zu schreiben bringt dir Bonus-EP und zeigt deine unglaubliche Hingabe. Außerdem schaltest du besondere Feiermomente frei!'
      },
      debtRecovery: {
        title: 'Serien-Wiederherstellung',
        content: 'Das Leben passiert, und das ist völlig okay! 💪 Wenn du einen Tag verpasst, schau eine kurze Werbung, um bis zu 3 verpasste Tage wiederherzustellen. Wir glauben an zweite Chancen und daran, dich wieder auf Kurs zu bringen!'
      }
    },
    goals: {
      overview: {
        title: 'Erstelle jedes Ziel',
        content: 'Du kannst absolut jedes Ziel erstellen, das du willst! 🎯 Gib einfach deine benutzerdefinierten Einheiten ein (Bücher, Meilen, Stunden, Seiten, Kilometer usw.) und setze deinen Zielwert. Das war\'s - die App verfolgt deinen Fortschritt!'
      },
      predictions: {
        title: 'Intelligente Zielvorhersagen',
        content: 'Wir sind wie dein persönlicher Fortschritts-Wahrsager! 🔮 Unser intelligentes System analysiert deine Muster und gibt dir realistische Zeitpläne. Kein Raten mehr - du weißt genau, wann du dieses Ziel erreichen wirst!'
      },
      progressTracking: {
        title: 'Verfolge deine Reise',
        content: 'Jeder Schritt zählt! 📈 Füge deinen täglichen oder wöchentlichen Fortschritt hinzu und beobachte, wie dein Ziel zum Leben erwacht. Du kannst erhöhen, verringern oder exakte Beträge festlegen. Füge Notizen hinzu, um dich an diese stolzen Momente zu erinnern!'
      },
      templates: {
        title: 'Zielvorlagen',
        content: 'Warum von Grund auf neu beginnen? Wir haben dich abgedeckt! 🎯 Wähle aus fertigen Vorlagen für beliebte Ziele und passe sie an deine einzigartige Reise an. Es ist wie einen Vorsprung zu haben!'
      }
    },
    home: {
      recommendations: {
        title: 'Deine persönlichen Vorschläge',
        content: 'Diese sind nur für dich gemacht! ⭐ Basierend auf deinen einzigartigen Mustern und Fortschritten schlagen wir Wege vor, motiviert zu bleiben und aufregende neue Möglichkeiten zu entdecken. Es ist wie einen persönlichen Coach zu haben!'
      },
      xpSystem: {
        title: 'Deine EP-Reise',
        content: 'Level up dein Leben! 🚀 Jede Gewohnheit, jeder Tagebuch-Eintrag und jeder Zielschritt bringt dir EP. Beobachte, wie sich deine Fortschrittsleiste füllt und feiere jedes neue Level, das du erreichst. Du wirst buchstäblich jeden Tag stärker!'
      },
      streakBadges: {
        title: 'Deine Serien-Sammlung',
        content: 'Diese Abzeichen erzählen deine Erfolgsgeschichte! 🏆 Verschiedene Farben zeigen, wie stark deine Serien sind, und spezielle Abzeichen feiern wichtige Meilensteine. Jedes repräsentiert deine fantastische Hingabe!'
      },
      habitStatistics: {
        title: 'Dein Erfolgs-Dashboard',
        content: 'Sieh, wie fantastisch du bist! 📊 Erhalte ein vollständiges Bild deines Gewohnheitserfolgs mit Abschlussraten, Trends und Mustern. Es ist der Beweis deiner unglaublichen Beständigkeit und deines Wachstums!'
      }
    },
    achievements: {
      trophyRoom: {
        totalTrophies: 'Gesamttrophäen',
        collected: 'Gesammelt',
        completionRate: 'Abschlussrate',
        overallProgress: 'Gesamtfortschritt',
      },
    },
    challenges: {
      templates: {
        // HABITS templates
        habits_consistency_master: {
          title: 'Beständigkeits-Meister',
          description: 'Schließe deine geplanten Gewohnheiten den ganzen Monat über beständig ab',
          requirement: 'Schließe geplante Gewohnheitsaufgaben ab',
          bonus1: 'Perfekte Vollendung (+20% Bonus)',
          bonus2: 'Monatliche Serien-Fortsetzung (+100 XP pro Monat)',
          bonus3: 'Wochenend-Beständigkeitsbonus (+50 XP)'
        },
        habits_variety_champion: {
          title: 'Vielfalt-Champion',
          description: 'Erkunde jede Woche verschiedene Gewohnheiten, um eine vielfältige Routine aufzubauen',
          requirement: 'Schließe jede Woche verschiedene Gewohnheiten ab',
          bonus1: 'Neue Gewohnheitsentdeckung (+25 XP pro neue Gewohnheit)',
          bonus2: 'Wöchentlicher Vielfaltsmeilenstein (+30 XP pro Woche)',
          bonus3: 'Kategorien-Balance-Bonus (+100 XP)'
        },
        habits_streak_builder: {
          title: 'Serien-Baumeister',
          description: 'Halte beständige Gewohnheitsserien den ganzen Monat über aufrecht',
          requirement: 'Halte Gewohnheitsserien für aufeinanderfolgende Tage aufrecht',
          bonus1: 'Serien-Meilenstein-Belohnungen (+50 XP pro 7-Tage-Serie)',
          bonus2: 'Mehrere Gewohnheitsserien (+75 XP Bonus)',
          bonus3: 'Perfekte Monats-Serie (+200 XP)'
        },
        habits_bonus_hunter: {
          title: 'Bonus-Jäger',
          description: 'Gehe über deine geplanten Gewohnheiten hinaus mit Bonusvollendungen',
          requirement: 'Schließe Bonusgewohnheiten über deinen Zeitplan hinaus ab',
          bonus1: 'Bonusvollendungs-Belohnungen (+15 XP pro Bonus)',
          bonus2: 'Täglicher Bonus-Champion (+50 XP für 5+ Boni)',
          bonus3: 'Monatlicher Bonus-Meister (+200 XP)'
        },
        // JOURNAL templates
        journal_reflection_expert: {
          title: 'Reflexions-Experte',
          description: 'Schreibe den ganzen Monat über täglich Tagebuch-Einträge',
          requirement: 'Schreibe Tagebuch-Einträge an der Zielanzahl von Tagen',
          bonus1: 'Tägliche Reflexionsbelohnung (+15 XP pro Tag)',
          bonus2: 'Wöchentliche Beständigkeit (+60 XP pro Woche)',
          bonus3: 'Perfekter Tagebuch-Monat (+250 XP)'
        },
        journal_gratitude_guru: {
          title: 'Dankbarkeits-Guru',
          description: 'Konzentriere dich auf dankbarkeitsthematische Tagebuch-Einträge',
          requirement: 'Schreibe dankbarkeitsfokussierte Tagebuch-Einträge',
          bonus1: 'Dankbarkeitseintrags-Bonus (+20 XP pro Eintrag)',
          bonus2: 'Wöchentliche Dankbarkeits-Serie (+75 XP)',
          bonus3: 'Monatlicher Dankbarkeits-Meister (+250 XP)'
        },
        journal_consistency_writer: {
          title: 'Beständigkeits-Schreiber',
          description: 'Halte tägliche Tagebuch-Schreib-Serie aufrecht',
          requirement: 'Schreibe Tagebuch-Einträge aufeinanderfolgend',
          bonus1: 'Tägliche Serien-Belohnung (+25 XP pro Tag)',
          bonus2: 'Wöchentlicher Serien-Meilenstein (+100 XP)',
          bonus3: 'Ununterbrochene Monats-Serie (+400 XP)'
        },
        journal_depth_explorer: {
          title: 'Tiefen-Entdecker',
          description: 'Schreibe detaillierte, durchdachte Tagebuch-Einträge',
          requirement: 'Schreibe detaillierte Einträge (200+ Zeichen)',
          bonus1: 'Detaillierter Eintragsbonus (+30 XP pro Eintrag)',
          bonus2: 'Durchdachte Reflexion (+100 XP wöchentlich)',
          bonus3: 'Meister-Wortschmied (+350 XP monatlich)'
        },
        // GOALS templates
        goals_progress_champion: {
          title: 'Fortschritts-Champion',
          description: 'Mache beständigen täglichen Fortschritt auf deine Ziele zu',
          requirement: 'Mache Zielfortschritt an der Zielanzahl von Tagen',
          bonus1: 'Tägliche Fortschrittsleistung (+20 XP pro Tag)',
          bonus2: 'Wöchentliche Beständigkeit (+50 XP pro Woche)',
          bonus3: 'Perfekter Fortschrittsmonat (+200 XP)'
        },
        goals_completion_master: {
          title: 'Erfolg Freigeschaltet',
          description: 'Schließe mehrere Ziele im Laufe des Monats ab',
          requirement: 'Schließe die Zielanzahl von Zielen ab',
          bonus1: 'Zielvollendungsbonus (+100 XP pro Ziel)',
          bonus2: 'Mehrfach-Ziel-Leistung (+150 XP für 3+ Ziele)',
          bonus3: 'Großer Zielbonus (+200 XP für 1000+-Werte-Ziele)'
        },
        // CONSISTENCY templates
        consistency_triple_master: {
          title: 'Dreifach-Meister',
          description: 'Nutze alle drei Funktionen (Gewohnheiten, Tagebuch, Ziele) jeden Tag',
          requirement: 'Nutze Gewohnheiten, Tagebuch und Ziele täglich',
          bonus1: 'Perfekter Dreifach-Tag (+30 XP pro Tag)',
          bonus2: 'Wöchentliche Dreifach-Leistung (+100 XP pro Woche)',
          bonus3: 'Monatlicher Dreifach-Meister (+300 XP)'
        },
        consistency_perfect_month: {
          title: 'Perfekter Monat',
          description: 'Erreiche tägliche Minima (1+ Gewohnheiten, 3+ Tagebuch-Einträge) beständig',
          requirement: 'Erfülle tägliche Mindestanforderungen beständig',
          bonus1: 'Perfekte Tagesleistung (+50 XP pro Tag)',
          bonus2: 'Perfekter Wochenbonus (+200 XP pro Woche)',
          bonus3: 'Makelloser Monat (+500 XP für 100%)'
        },
        consistency_xp_champion: {
          title: 'XP-Champion',
          description: 'Sammle Gesamt-XP durch beständiges monatliches Engagement',
          requirement: 'Sammle XP durch alle App-Aktivitäten monatlich',
          bonus1: 'Meilenstein-Leistungen (+50 XP pro Meilenstein)',
          bonus2: 'Beständigkeitsboni (+100 XP pro Bonus)',
          bonus3: 'Perfekte Monatsvollendung (+500 XP für das Erreichen von 100%)'
        },
        consistency_balance_expert: {
          title: 'Balance-Experte',
          description: 'Halte ausgewogene XP-Quellen aufrecht (keine einzelne Quelle >60% des Gesamtwerts)',
          requirement: 'Halte ausgewogene Funktionsnutzung aufrecht',
          bonus1: 'Perfekter Balance-Bonus (+100 XP pro Woche)',
          bonus2: 'Vielfalt-Champion (+150 XP monatlich)',
          bonus3: 'Harmonie-Leistung (+200 XP für außergewöhnliche Balance)'
        }
      },
      detail: {
        tabOverview: 'Übersicht',
        tabCalendar: 'Kalender',
        tabTips: 'Tipps',
        sectionDescription: 'Herausforderungsbeschreibung',
        sectionTimeline: 'Zeitplan',
        labelDaysRemaining: 'Verbleibende Tage',
        labelActiveDays: 'Aktive Tage',
        labelTotalDays: 'Gesamttage',
        sectionRequirements: 'Anforderungsfortschritt',
        sectionTips: 'Tipps für Erfolg',
        sectionStrategy: 'Monatsstrategie',
        sectionRewards: 'Belohnungen',
        rewardDescription: 'Erfülle alle Anforderungen, um diese XP-Belohnung zu verdienen. Perfekte Vollendung (100%) bringt Bonus-XP!',
        completed: '✓ Abgeschlossen',
      },
      starDifficulty: {
        title: 'Herausforderungs-Sternebewertung',
        content: 'Bereit für eine Herausforderung? ⭐ Wähle dein Abenteuer-Level! 1-Stern-Herausforderungen sind perfekt zum Einstieg, während 5-Stern-Herausforderungen für die ultimativen Leistungsträger sind. Höhere Sterne bedeuten größere EP-Belohnungen und Prahlrechte!'
      },
      progressTracking: {
        title: 'Beobachte deinen Fortschritt',
        content: 'Bleib den ganzen Monat motiviert! 📅 Verfolge deine täglichen Erfolge und sieh wöchentliche Aufschlüsselungen, die genau zeigen, wie du deine Herausforderung meisterst. Du wirst es lieben, deinen Fortschritt zu beobachten!'
      },
      completionRewards: {
        title: 'Epische Abschlussbelohnungen',
        content: 'Beende stark und werde großzügig belohnt! 🎁 Schließe monatliche Herausforderungen für massive EP-Boni und exklusive Erfolge ab. Je schwerer die Herausforderung, desto süßer die Siegesfeier!'
      }
    },
    gamification: {
      levelProgression: {
        title: 'Deine Level-Reise',
        content: 'Du bist auf einem epischen 100-Level-Abenteuer! 🎮 Jedes Level wird aufregender, wenn du stärker wirst. Beobachte, wie dein Rang durch 6 fantastische Farbstufen von Grau bis zum legendären Rot evoliert. Jedes Level ist eine Feier deines Fortschritts!'
      },
      xpMultipliers: {
        title: 'Doppel-EP Power-Up',
        content: 'Bereite dich auf EP-BOOST-Modus vor! ⚡ Erreiche Harmonie-Serie (Gewohnheiten + Tagebuch + Ziele an einem Tag) und schalte 24 Stunden doppelte EP frei! Es ist wie ein Power-Up zu finden, das alles doppelt zählen lässt!'
      },
      harmonyStreak: {
        title: 'Der ultimative Tagessieg',
        content: 'Hier geschieht die Magie! ✨ Schließe deine Gewohnheiten ab, schreibe in dein Tagebuch UND mache Zielfortschritt alles an einem Tag. Boom! Du hast gerade 24 Stunden 2x EP freigeschaltet. Es ist der perfekte Tag multipliziert!'
      }
    }
  } as any,

  // Tutorial System (UI elements only - full content falls back to EN for first-time experience)
  tutorial: {
    skip: 'Tutorial überspringen',
    next: 'Weiter',
    continue: 'Fortfahren',
    getStarted: 'Los geht\'s',
    finish: 'Tutorial beenden',
    progressText: 'Schritt {{current}} von {{total}}',
    loading: 'Tutorial wird eingerichtet...',
    steps: {
      createGoalButton: {
        title: 'Erstelle Dein Erstes Ziel',
        content: 'Klicke auf + Ziel hinzufügen, um dein erstes bedeutungsvolles Ziel zu setzen!',
        button: 'Hier klicken',
      },
    } as any,
    validation: {} as any,
    errors: {
      recoveryMode: 'Das Tutorial hatte Probleme. Wird im vereinfachten Modus ausgeführt.',
      reset: 'Das Tutorial hatte einen Fehler und wurde zurückgesetzt.',
      retry: 'Erneut versuchen',
    },
    skipConfirmation: {
      title: 'Tutorial überspringen?',
      message: 'Bist du sicher, dass du das Tutorial überspringen möchtest? Du kannst es später jederzeit über den Hilfebereich aufrufen.',
      skip: 'Ja, überspringen',
      continue: 'Tutorial fortsetzen',
    },
  } as any,

  // Notifications
  notifications: {
    disabled: 'Benachrichtigungen deaktiviert',
    enableTap: 'Tippe zum Aktivieren von Benachrichtigungen',
    settingsTap: 'Tippe zum Öffnen der Systemeinstellungen',
    afternoonReminder: 'Nachmittagserinnerung',
    afternoonDescription: 'Motivierender Check-in',
    eveningReminder: 'Abenderinnerung',
    eveningDescription: 'Intelligente Aufgabenerinnerung',
    morning: {
      variant1: 'Guten Morgen! Starte deinen Tag mit Dankbarkeit 🌅',
      variant2: 'Aufwachen! Wofür bist du heute dankbar? ✨',
      variant3: 'Ein neuer Tag, eine neue Chance zu wachsen! 🌱',
      variant4: 'Morgen-Motivation: Prüfe deine Gewohnheiten und setze deine Intention! 💪',
    },
    evening: {
      variant1: 'Abendreflexion: Wie liefen deine Gewohnheiten heute? 🌙',
      variant2: 'Beende deinen Tag mit Dankbarkeit. Was lief gut? 🙏',
      variant3: 'Zeit, deinen Fortschritt zu überprüfen und morgen zu planen! 📝',
      variant4: 'Gute Nacht! Vergiss nicht, deine tägliche Dankbarkeit abzuschließen! 🌟',
    },
    reminders: {
      afternoon: {
        variant1: {
          title: 'SelfRise Check-in ☀️',
          body: 'Wie läuft dein Tag? Vergiss nicht deine Ziele und Gewohnheiten! 🚀',
        },
        variant2: {
          title: 'Nachmittags-Motivation 💪',
          body: 'Du hast noch Zeit! Prüfe deine Gewohnheiten und Ziele 💪',
        },
        variant3: {
          title: 'Fortschrittszeit 🎯',
          body: 'Nachmittags-Check-in: Wie läuft es mit deinen Zielen? 🎯',
        },
        variant4: {
          title: 'Mikro-Erfolgs-Moment ✨',
          body: 'Zeit für einen Mikro-Erfolg! Kannst du noch eine Gewohnheit abschließen? 🏃‍♂️',
        },
      },
      evening: {
        incomplete_habits: {
          title: 'Du hast noch Gewohnheiten zu erledigen! 🏃‍♂️',
          body_one: 'Du hast noch 1 Gewohnheit zu erledigen. Los geht\'s!',
          body_other: 'Du hast noch {{count}} Gewohnheiten zu erledigen. Los geht\'s!',
        },
        missing_journal: {
          title: 'Abendreflexionszeit 📝',
          body_one: 'Vergiss nicht, noch 1 Tagebuch-Eintrag zu schreiben!',
          body_other: 'Vergiss nicht, noch {{count}} Tagebuch-Einträge zu schreiben!',
        },
        bonus_opportunity: {
          title: 'Bonus-Gelegenheit! ⭐',
          body: 'Du hast noch Zeit für Bonus-Einträge! (aktuell {{count}}/10)',
        },
        fallback: {
          title: 'Abend-Check-in 🌙',
          body: 'Zeit für Abendreflexion! Was hast du heute erreicht? 📝',
        },
      },
    },
  } as any,

  social: {
    // Phase 7: DailyHeroesSection
    dailyHeroes: {
      title: 'Tägliche Helden 🦸‍♀️',
      subtitle: 'Anonyme Erfolge zum Inspirieren',
      loading: 'Inspirierende Erfolge werden geladen...',
      tryAgain: 'Erneut versuchen',
      noHeroes: 'Keine Helden verfügbar',
      noHeroesSubtitle: 'Schau später vorbei für neue Inspiration!',
      footer: 'Jede Errungenschaft hier ist aus einer echten Benutzerreise. Du bist nicht allein! 💪',
      inspiring: 'Inspirierend',
      daysActive: 'Tage aktiv',
      today: '🟢 Heute',
      yesterday: '🟡 Gestern',
      recent: '🔵 Kürzlich',
    },
    loyalty: {
      loadingData: 'Treuedaten werden geladen...',
      unavailableData: '⚠️ Treuedaten nicht verfügbar',
      journeyTitle: '🏆 Treue-Reise',
      activeDays: 'Aktive Tage',
      daysRemaining: 'Verbleibende Tage',
      maxReached: 'Du hast maximale Treue erreicht!',
      daysOfDedication: 'Tage Hingabe',
      currentStreak: 'Aktuelle Serie',
      longestStreak: 'Längste Serie',
      level: 'Level',
    },
    quote: {
      copy: 'Kopieren',
      share: 'Teilen',
      copiedTitle: '📋 Kopiert!',
      copiedMessage: 'Zitat in Zwischenablage kopiert.',
      copyError: 'Zitat konnte nicht kopiert werden. Bitte versuche es erneut.',
      title: '✨ Motivierendes Zitat',
    },
    achievements: {
      shareSuccessTitle: '🎉 Erfolgreich geteilt!',
      shareSuccessMessage: 'Deine Errungenschaft wurde geteilt. Mach weiter so!',
      shareError: 'Errungenschaft konnte nicht geteilt werden. Bitte versuche es erneut.',
      copiedTitle: '📋 Kopiert!',
      copiedMessage: 'Errungenschaften-Details in Zwischenablage kopiert. Du kannst sie jetzt überall einfügen!',
      shareAchievementTitle: 'Errungenschaft teilen',
      shareAchievementDescription: 'Mit den integrierten Freigabeoptionen deines Geräts teilen',
      copyClipboardTitle: 'In Zwischenablage kopieren',
      copyClipboardDescription: 'Errungenschaften-Details in deine Zwischenablage kopieren',
    },
    achievements_filters: {
      allCategories: 'Alle Kategorien',
      habitsCategory: 'Gewohnheiten',
      journalCategory: 'Tagebuch',
      goalsCategory: 'Ziele',
      consistencyCategory: 'Beständigkeit',
      categoryLabel: 'Kategorie',
      rarityLabel: 'Seltenheit',
      recentLabel: 'Kürzlich',
      alphabeticalLabel: 'A-Z',
      sortByLabel: 'Sortieren nach',
      unlockedOnlyLabel: 'Nur entsperrt',
      allRarities: 'Alle Seltenheiten',
      commonRarity: 'Gewöhnlich',
      rareRarity: 'Selten',
      epicRarity: 'Episch',
      legendaryRarity: 'Legendär',
    },
    achievements_trophies: {
      habitMastery: 'Alle gewohnheitsbezogenen Erfolge freigeschaltet',
      journalMastery: 'Meistern aller Aspekte der reflektierenden Journalführung',
      goalMastery: 'Meisterschaft in Zielsetzung und -erreichung',
      legendaryCollector: 'Alle legendären Errungenschaften sammeln',
      epicCollector: 'Alle epischen Errungenschaften freigeschaltet',
      universalBeginning: 'Erste Schritte in allen Bereichen',
      consistencyMaster: 'Meistern der Kunst der Beständigkeit',
      timeMaster: 'Exzellenz in zeitbasierten Errungenschaften',
    },
    trophy_combinations: {
      title: 'Pokal-Sammlungen',
      subtitle: 'Vervollständige thematische Sets für Bonusbelohnungen',
      collectionsCompleted: 'Sammlungen\nAbgeschlossen',
      bonusXPEarned: 'Bonus-XP\nVerdient',
      collectionRate: 'Sammlungs-\nQuote',
      collectionComplete: '🎉 Sammlung abgeschlossen!',
      collections: {
        'habits-master': 'Gewohnheitsmeister',
        'journal-sage': 'Journal-Weiser',
        'goal-champion': 'Ziel-Champion',
        'legendary-collector': 'Legendärer Sammler',
        'epic-hunter': 'Epischer Jäger',
        'first-steps': 'Grundsteinleger',
        'consistency-king': 'König der Beständigkeit',
        'time-master': 'Zeitmeister',
      },
    },
    loyalty_progress: {
      keepGrowing: 'Weiter wachsen!',
      level: 'Stufe',
      loadingData: 'Loyalitätsdaten werden geladen...',
      unavailableData: '⚠️ Loyalitätsdaten nicht verfügbar',
      journeyTitle: '🏆 Loyalitätsreise',
      activeDays: 'Aktive Tage',
      progressNext: 'Auf dem Weg zu {{name}}: Noch {{days}} aktive Tage',
      daysRemaining: 'verbleibende Tage',
      maximumReached: 'Du hast maximale Loyalität erreicht!',
      daysOfDedication: 'Tage der Hingabe',
      currentStreak: 'Aktuelle Serie',
      longestStreak: 'Längste Serie',
      levels: {
        newcomer: {
          name: 'Neuling',
          description: 'Beginne deine Reise'
        },
        explorer: {
          name: 'Entdecker',
          description: 'Entdecke dein Potenzial'
        },
        veteran: {
          name: 'Veteran',
          description: 'Erfahren im Wachstum'
        },
        legend: {
          name: 'Legende',
          description: 'Legendäre Hingabe'
        },
        master: {
          name: 'Loyalitätsmeister',
          description: 'Ultimative Hingabe'
        }
      }
    },
    days: {
      monday: 'Mo',
      tuesday: 'Di',
      wednesday: 'Mi',
      thursday: 'Do',
      friday: 'Fr',
      saturday: 'Sa',
      sunday: 'So',
    },
    // Filters - labels for header
    filterLabels: {
      category: 'Kategorie',
      rarity: 'Seltenheit',
      sortBy: 'Sortieren nach',
    },
    // Trophy combinations
    combinations: {
      collections: 'Sammlungen',
      completed: 'Abgeschlossen',
      earned: 'Verdient',
      collection: 'Sammlung',
      rate: 'Quote',
    },
    // Achievement states
    states: {
      new: 'NEU',
      keepGrowing: 'Weiter wachsen!',
      level: 'Stufe',
    },
    // Achievement History
    history: {
      newBadge: 'NEU',
      emptyTitle: 'Noch keine Trophäen',
      recentVictories: 'Letzte Erfolge',
    },
    // Achievement Tooltip
    tooltip: {
      completed: '✅ Erfolg freigeschaltet',
      progressAndRequirements: '📊 Fortschritt und Anforderungen',
      requirement: 'Anforderung:',
      currentProgress: 'Aktueller Fortschritt:',
      nextSteps: '💡 Nächste Schritte:',
      smartTips: '💡 Intelligente Tipps',
    },
    // Achievement Detail Modal
    detail: {
      category: 'Kategorie:',
      rarity: 'Seltenheit:',
      xpReward: 'XP-Belohnung:',
    },
    // Trophy Room
    trophyRoom: {
      title: '🏆 Trophäenkammer',
      subtitle: 'Deine persönliche Ruhmeshalle',
      qualitySection: 'Trophäenqualität',
    },
    // Share Achievement Modal
    shareModal: {
      title: 'Erfolg teilen',
      subtitle: 'Feiern Sie Ihren Fortschritt! 🎉',
      preparing: 'Dein Erfolg wird vorbereitet... 🏆',
      messagePreview: 'Vorschau der Freigabemeldung',
      sharingOptions: 'Freigabeoptionen',
      privacyProtected: 'Datenschutz geschützt',
    },
  } as any,

  // Challenges
  challenges: {
    calendar: {
      dailyProgress: 'Täglicher Fortschritt',
      title: 'Monatlicher Fortschrittskalender',
      noActivity: 'Keine Aktivität (<10%)',
      someActivity: 'Einige Aktivitäten (10-50%)',
      goodProgress: 'Guter Fortschritt (51-90%)',
      perfectDay: 'Perfekter Tag (91%+)',
      weeklyBreakdown: 'Wöchentliche Aufschlüsselung',
      week: 'Woche {week}',
    },
    completion: {
      requirements: 'Anforderungen',
      activeDays: 'Aktive Tage',
      milestones: 'Meilensteine',
    },
  } as any,

  // Gratitude/Journal
  gratitude: {
    daily: {
      title: 'Heutiger Tagebuchfortschritt',
    },
    export: {
      title: 'Tagebuch exportieren',
      textFormat: 'Textformat',
      jsonFormat: 'JSON-Format',
      exporting: 'Dein Tagebuch wird exportiert...',
    },
    edit: {
      title: 'Tagebucheintrag bearbeiten',
    },
    bonus: {
      label: 'BONUS ⭐',
    },
  } as any,

  // Accessibility
  accessibility: {
    activateMultiplier: 'Aktiviere 2x XP Multiplikator',
    tapToContinueTutorial: 'Tippe zum Fortfahren des Tutorials',
    achievementGrid: 'Errungenschaftsgitter',
    closeAchievementDetails: 'Errungenschaftsdetails schließen',
    shareAchievement: 'Errungenschaft teilen',
    shareYourAchievement: 'Teile deine Errungenschaft',
    continueWithMultiplier: 'App mit aktivem Multiplikator weiter verwenden',
    multiplierCelebration: 'XP Multiplikator Aktivierungsfeier',
    getNewQuote: 'Neues Zitat abrufen',
    copyQuoteToClipboard: 'Zitat in Zwischenablage kopieren',
    shareQuote: 'Zitat teilen',
  },
};

export default de;
