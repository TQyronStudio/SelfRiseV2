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
    home: 'Home',
    habits: 'Routine',
    journal: 'Tagebuch',
    goals: 'Ziele',
    achievements: 'Erfolge',
    settings: 'Menü',
  },

  // Home screen
  home: {
    title: 'Willkommen!',
    journalStreak: 'Serie',
    habitStatistics: 'Statistik',
    weeklyProgress: 'Woche',
    monthlyProgress: 'Monat',
    dayDetail: 'Details',
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
      weeklyChart: 'Wochenübersicht',
      monthlyOverview: 'Monatsübersicht',
      performanceIndicators: 'Leistung',
      trendAnalysis: 'Trends',
      totalHabits: 'Gesamt',
      activeHabits: 'Aktiv',
      completedToday: 'Heute',
      weeklyAverage: 'Ø Woche',
      monthlyAverage: 'Ø Monat',
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
    // Recommendation Card Content
    recommendationCards: {
      habits: {
        adjustSchedule: {
          title: 'Zeitplan anpassen',
          description: '{{habitName}} zeigt {{completionRate}}% Erfüllung. Erwäge die Häufigkeit zu reduzieren.',
          action: 'Zeitplan anpassen',
        },
        levelUp: {
          title: 'Level Up',
          description: 'Du rockst {{habitName}} mit {{completionRate}}%! Bereit für eine neue Herausforderung?',
          action: 'Herausforderung hinzufügen',
        },
        addNewHabit: {
          title: 'Neue Gewohnheit hinzufügen',
          description: 'Du machst das großartig mit bestehenden Gewohnheiten! {{successfulDays}} sind deine stärksten Tage.',
          action: 'Gewohnheit erstellen',
        },
      },
      journal: {
        buildStreak: {
          title: 'Baue deinen Streak auf',
          description: 'Regelmäßiges Journaling fördert Achtsamkeit. Beginne heute mit nur 3 Einträgen.',
          prompt: 'Was hat dich heute zum Lächeln gebracht?',
        },
        onFire: {
          title: 'Du bist on Fire!',
          description: 'Deine Journaling-Kontinuität ist beeindruckend. Halte den Schwung!',
          prompt: 'Reflektiere, wie das Journaling diese Woche deine Denkweise beeinflusst hat.',
        },
        trySelfPraise: {
          title: 'Versuche Selbstlob',
          description: 'Balance Dankbarkeit mit Selbstanerkennung. Was hast du heute gut gemacht?',
          prompt: 'Welche persönliche Eigenschaft hat dir heute zum Erfolg verholfen?',
        },
      },
      goals: {
        startProgress: {
          title: 'Beginne mit Fortschritt',
          description: '{{goalTitle}} braucht Aufmerksamkeit. Fange an, Fortschritte zu machen!',
          action: 'Fortschritt protokollieren',
        },
        almostThere: {
          title: 'Fast geschafft!',
          description: '{{goalTitle}} ist zu {{progressPercent}}% abgeschlossen. Gib den letzten Schub!',
          action: 'Letzter Schub',
        },
        timelineCheck: {
          title: 'Zeitplan-Check',
          description: '{{goalTitle}} benötigt möglicherweise eine Zeitplananpassung. Noch {{daysRemaining}} Tage.',
          action: 'Zeitplan anpassen',
        },
        setNewGoal: {
          title: 'Neues Ziel setzen',
          description: 'Ziele geben Richtung und Motivation. Was möchtest du erreichen?',
          action: 'Ziel erstellen',
        },
      },
    },
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
        xpProgressBar: 'XP-Status',
        xpMultiplier: 'Multiplikator',
        journalStreak: 'Serie',
        quickActions: 'Aktionen',
        dailyQuote: 'Inspiration',
        recommendations: 'Tipps',
        streakHistory: 'Verlauf',
        habitStats: 'Statistik',
        habitPerformance: 'Leistung',
        habitTrends: 'Trends',
        monthlyChallenges: 'Monatsziel',
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
      timeRemaining: {
        hoursMinutes: '({{hours}}h {{minutes}}m verbleibend)',
        hoursOnly: '({{hours}}h verbleibend)',
        minutesOnly: '({{minutes}}m verbleibend)',
        secondsOnly: '({{seconds}}s verbleibend)',
      },
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
    quickActionsTitle: 'Aktionen',
    quickActions: {
      addHabit: '+ Routine',
      gratitude: 'Dank',
      selfPraise: 'Lob',
      addGoal: '+ Ziel',
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
    currentLevelSummary: 'Du befindest dich derzeit auf Level {{currentLevel}} von 100 Leveln',
    keepEarningXp: 'Verdiene weiterhin XP, um höhere Level freizuschalten!',
    // Habit Feedback Messages (from habitCalculations.ts)
    habitFeedback: {
      buildingMomentum: {
        title: '🌱 Schwung aufbauen',
        description: 'Toller Start mit {{habitName}}! Mach weiter, um das Muster zu etablieren.',
      },
      excellentEarlyProgress: {
        title: '🚀 Exzellenter früher Fortschritt',
        description: '{{completionRate}}% Abschluss! Du baust ein starkes Fundament auf.',
      },
      goodEarlyPattern: {
        title: '📈 Gutes frühes Muster',
        description: '{{completionRate}}% Abschluss. Du bist auf dem richtigen Weg!',
      },
      earlyLearningPhase: {
        title: '💪 Frühe Lernphase',
        description: '{{completionRate}}% Abschluss. Jeder Schritt zählt beim Aufbau von Gewohnheiten!',
      },
      exceptionalPerformance: {
        title: '⭐ Außergewöhnliche Leistung',
        description: '{{completionRate}}% Abschlussrate! Dein Engagement für {{habitName}} ist außergewöhnlich.',
      },
      outstandingPerformance: {
        title: '🏆 Herausragende Leistung',
        description: '{{completionRate}}% Abschluss mit Bonuseinsatz. Exzellente Konstanz!',
      },
      strongConsistency: {
        title: '✅ Starke Konstanz',
        description: '{{completionRate}}% Abschlussrate. Gut gemacht bei {{habitName}}!',
      },
      steadyProgress: {
        title: '📊 Stetiger Fortschritt',
        description: '{{completionRate}}% Abschluss. Erwäge kleine Anpassungen für mehr Konstanz.',
      },
      focusOpportunity: {
        title: '💪 Fokus-Möglichkeit',
        description: '{{completionRate}}% Abschluss für {{habitName}}. Versuche es in kleinere Schritte aufzuteilen.',
      },
      progressTracking: {
        title: '📈 Fortschrittsverfolgung',
        description: '{{completionRate}}% Abschlussrate.',
      },
    },
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
    locale: 'de-DE',
    ok: 'OK',
    cancel: 'Abbrechen',
    save: 'Speichern',
    saving: 'Speichern...',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    retry: 'Nochmal',
    tryAgain: 'Nochmal',
    add: '+ Neu',
    create: 'Neu',
    update: 'Update',
    confirm: 'OK',
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
    // Uppercase labels for celebration badges
    dayUppercase: 'TAG',
    daysUppercase: 'TAGE',
    bonusUppercase: 'BONUS',
    bonusesUppercase: 'BONUSSE',
    levelUppercase: 'LEVEL',
    createdLabel: 'Erstellt',
    daysCount: '{{count}} Tage',
    completed: '{{completed}} von {{total}} abgeschlossen',
    loading: {
      default: 'Lade...',
      levels: 'Lade Level...',
      habits: 'Lade Routine...',
      progress: 'Lade...',
    },
    dates: {
      today: 'Heute',
      yesterday: 'Gestern',
      tomorrow: 'Morgen',
      nextDay: 'Nächsten {{dayName}}',
      lastDay: 'Letzten {{dayName}}',
    },
    modals: {
      errorTitle: 'Fehler',
      confirmTitle: 'Aktion bestätigen',
      confirm: 'Bestätigen',
      closeButton: 'Schließen',
    },
    errors: {
      goals: {
        failedToSave: 'Speichern fehlgeschlagen',
        failedToDelete: 'Löschen fehlgeschlagen',
        failedToReorder: 'Sortieren fehlgeschlagen',
        failedToAddProgress: 'Fortschritt fehlgeschlagen',
        noProgressData: 'Keine Daten. Füge Fortschritt hinzu.',
      },
      habits: {
        failedToSave: 'Speichern fehlgeschlagen',
        failedToDelete: 'Löschen fehlgeschlagen',
        failedToUpdate: 'Update fehlgeschlagen',
        failedToReorder: 'Sortieren fehlgeschlagen',
        failedToToggleCompletion: 'Aktion fehlgeschlagen',
        loadingHabits: 'Lade Routine...',
        activeHabits: 'Aktiv',
        inactiveHabits: 'Inaktiv',
        noHabitsFound: 'Keine Routine',
        createHabitsFirst: 'Erstelle Routinen für Statistiken',
      },
      gratitude: {
        failedToSave: 'Speichern fehlgeschlagen',
      },
      social: {
        failedToLoadHeroes: 'Laden fehlgeschlagen',
      },
    },
    celebration: {
      general_announcement: 'Glückwunsch!',
      modal: 'Feier',
      default_title: 'Glückwunsch!',
      default_message: 'Super!',
    },
    help: 'Hilfe',
    helpNotAvailable: 'Keine Hilfe verfügbar.',
  },

  // Global errors
  errors: {
    notFound: {
      title: 'Hoppla!',
      message: 'Seite existiert nicht.',
      goHome: 'Home',
    },
  },

  // UI Labels
  ui: {
    progressStep: '{{current}}/{{total}}',
    skipTutorial: 'Überspringen',
    nextStep: 'Weiter',
    continue: 'Weiter',
    next: 'Weiter',
    cancel: 'Abbrechen',
    save: 'Speichern',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    retry: 'Nochmal',
    tutorialComplete: 'Fertig!',
    readyToRise: 'Los geht\'s',
  },

  // Habits screen
  habits: {
    title: 'Meine Routine',
    addHabit: 'Neue Routine',
    editHabit: 'Bearbeiten',
    deleteHabit: 'Löschen',
    activeHabits: 'Aktiv',
    inactiveHabits: 'Inaktiv',
    addNewHabit: 'Neue Routine',
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
    // Habit list summary
    days: 'Tage',
    listSummary: '{{active}} aktiv • {{inactive}} inaktiv',
    // Error messages
    errors: {
      failedToSave: 'Gewohnheit konnte nicht gespeichert werden',
      failedToDelete: 'Gewohnheit konnte nicht gelöscht werden',
      failedToUpdate: 'Gewohnheit konnte nicht aktualisiert werden',
      failedToReorder: 'Gewohnheiten konnten nicht neu angeordnet werden',
      failedToToggle: 'Abschluss konnte nicht umgeschaltet werden',
    },
  } as any,

  // Journal screen
  journal: {
    title: 'Tagebuch',
    addGratitude: '+ Dankbarkeit',
    addGratitudeButton: '+ Dank',
    addSelfPraiseButton: '+ Lob',
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
      modalTitle: 'Tagebuch exportieren',
      description: 'Exportiere deine Tagebucheinträge und Statistiken. Die Daten werden in einem Popup angezeigt, damit du sie kopieren und speichern kannst.',
      textFormat: 'Textformat',
      textFormatDescription: 'Lesbares Format zum Teilen und Lesen',
      jsonFormat: 'JSON-Format',
      jsonFormatDescription: 'Strukturiertes Datenformat für Backup oder technische Nutzung',
      exporting: 'Dein Tagebuch wird exportiert...',
      formatText: 'Text',
      formatJson: 'JSON',
      content: {
        title: 'Mein Tagebuch-Export',
        generatedOn: 'Erstellt am',
        statistics: 'STATISTIKEN',
        totalEntries: 'Gesamteinträge',
        activeDays: 'Aktive Tage',
        averagePerDay: 'Durchschnitt pro Tag',
        currentStreak: 'Aktuelle Serie',
        longestStreak: 'Längste Serie',
        journalEntries: 'TAGEBUCHEINTRÄGE',
        bonus: 'BONUS',
      },
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
      entryTypes: 'Eintragstypen',
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

      // Fallback placeholder
      defaultPlaceholder: 'Wofür bist du heute dankbar?',
      // Optional suffix for bonus entries
      optional: '(optional)',

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
      adDismissed: {
        title: 'Werbung nicht abgeschlossen',
        message: 'Du musst die Werbung vollständig ansehen, um deinen Streak-Tag zu retten. Bitte versuche es erneut.',
      },
      adLoadFailed: {
        title: 'Werbung nicht verfügbar',
        message: 'Die Werbung konnte nicht geladen werden. Bitte überprüfe deine Internetverbindung und versuche es erneut.',
      },
      adError: {
        title: 'Werbungsfehler',
        message: 'Beim Anzeigen der Werbung ist ein Fehler aufgetreten. Bitte versuche es erneut.',
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
    addGoal: 'Neues Ziel',
    editGoal: 'Bearbeiten',
    deleteGoal: 'Löschen',
    noGoals: 'Noch keine Ziele. Beginne mit der Erstellung deines ersten Ziels!',

    // Error states
    error: 'Fehler',
    goalNotFound: 'Ziel nicht gefunden',
    goalTitleLabel: 'Zieltitel',
    goalTitlePlaceholder: 'Gib dein Ziel ein...',
    unitLabel: 'Einheit',
    unitPlaceholder: 'z.B. €, kg, Stunden...',
    targetValueLabel: 'Zielwert',
    addProgressButton: '+ Fortschritt',
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
        pastDate: 'Das ausgewählte Datum kann nicht in der Vergangenheit liegen',
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
      completed: 'Erledigt',
      completion: 'Status',
      quickActions: 'Aktionen',
      complete: 'Erledigt',
      wayAhead: 'Voraus++',
      ahead: 'Voraus',
      behind: 'Zurück',
      wayBehind: 'Zurück--',
    },

    sections: {
      activeGoals: 'Aktiv',
      completedGoals: 'Erledigt',
      otherGoals: 'Andere',
    },

    actions: {
      reorder: 'Sortieren',
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

    // Target Date Confirmation Modal
    targetDateConfirmation: {
      title: 'Zieldatum hinzufügen?',
      message: 'Ein Ziel ohne Datum ist nur ein Traum. Ein Zieldatum hilft dir, motiviert und auf Kurs zu bleiben.',
      addDate: 'Datum hinzufügen',
      continueWithout: 'Ohne Datum fortfahren',
    },

    // No progress data messages
    noProgressStats: 'Noch keine Fortschrittsdaten. Füge Fortschritt hinzu, um Statistiken zu sehen.',
    noProgressPredictions: 'Noch keine Fortschrittsdaten. Füge Fortschritt hinzu, um Vorhersagen zu sehen.',
  } as any,

  // Monthly Challenge
  monthlyChallenge: {
    // Section title
    title: 'Monatsziel',

    // States
    loading: 'Lade...',
    preparing: '🗓️ Vorbereitung...',
    noActiveChallenge: 'Keine aktive',
    challengePreparing: '⏳ Vorbereitung',
    errorLoading: 'Fehler',
    failedToLoad: 'Laden fehlgeschlagen',
    retry: 'Nochmal',

    // Actions
    view: 'Öffnen',
    close: 'Schließen',
    awesome: 'Super!',
    continueJourney: 'Weiter',

    // Labels
    complete: 'Erledigt',
    completePercentage: 'Erledigt',
    daysLeft: 'Tage',
    daysLeftCompact: 'T',
    level: 'Stufe',
    difficulty: 'Level',
    difficultyLabel: 'Level',
    activeDays: 'Aktiv',
    maxXP: 'Max XP',
    milestones: 'Ziele',
    requirements: 'Bedingung',

    // Milestone celebration modal
    milestone: {
      title: '{{milestone}}% Meilenstein erreicht!',
      xpBonus: 'Meilenstein-Bonus',
      motivation_25: 'Toller Start! Du hast ein Viertel deiner Herausforderung geschafft. Bleib am Ball!',
      motivation_50: 'Halbzeit! Du zeigst echtes Engagement. Das Ziel ist in Sicht!',
      motivation_75: 'Fast geschafft! Nur noch ein kleines Stück und du hast die gesamte Herausforderung gemeistert!',
      accessibility: '{{milestone}} Prozent Meilenstein erreicht für {{title}}',
    },

    // Warm-Up Challenge (for users with < 14 days of activity)
    warmUpPrefix: 'Aufwärm-Challenge',
    warmUpDescription: 'Dies ist deine Einführung in monatliche Herausforderungen! Wir haben es extra erreichbar gemacht, um dir zu helfen, Vertrauen aufzubauen.',

    // Categories
    categories: {
      habits: 'GEWOHNHEITEN',
      journal: 'TAGEBUCH',
      goals: 'ZIELE',
      consistency: 'BESTÄNDIGKEIT',
      mastery: 'MEISTERSCHAFT',
      special: 'BESONDERS',
    },

    // Requirement tooltips for complex tracking keys
    requirementTooltips: {
      balance_score: 'Misst, wie gleichmäßig du alle App-Funktionen nutzt (Gewohnheiten, Tagebuch, Ziele). Nutze alle Funktionen regelmäßig, um deinen Score zu verbessern.',
    },

    // Calendar
    calendar: {
      title: 'Kalender',
      dailyProgress: 'Täglich',
      weeklyBreakdown: 'Wöchentlich',
      week: 'W{{number}}',
      noActivity: 'Inaktiv (<10%)',
      someActivity: 'Etwas (10-50%)',
      goodProgress: 'Gut (51-90%)',
      perfectDay: 'Perfekt (91%+)',
      weekDays: {
        mon: 'Mo',
        tue: 'Di',
        wed: 'Mi',
        thu: 'Do',
        fri: 'Fr',
        sat: 'Sa',
        sun: 'So',
      },
      active: 'aktiv',
      some: 'etwas',
      good: 'gut',
      perfect: 'perfekt',
    },

    // Progress
    monthlyProgress: 'Fortschritt',
    monthStreak: 'Serie',
    yourChallengeLevels: 'Deine Stufen',

    // Completion
    monthComplete: '✓ Erledigt',
    completed: 'Geschafft! 🎉',
    endsDate: 'Endet: {{date}}',

    // Fallback challenge (shown when generation has issues)
    fallback: {
      titlePrefix: '🔧 Ersatz',
      descriptionSuffix: '⚠️ Dies ist eine vereinfachte Herausforderung aufgrund von Generierungsproblemen.',
    },

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

    // Star level change modal
    starChange: {
      promotionTitle: 'Sternstufe gestiegen!',
      demotionTitle: 'Sternstufe geändert',
      promotionMotivation: 'Dein Einsatz hat sich gelohnt! Höhere Sterne bedeuten härtere Herausforderungen und größere Belohnungen nächsten Monat.',
      demotionMotivation: 'Keine Sorge! Nächster Monat ist ein Neuanfang. Konzentriere dich auf Beständigkeit und du steigst wieder auf.',
      buttonPromotion: 'Super!',
      buttonDemotion: 'Los geht\'s!',
      reason: {
        doubleFail: 'Zwei aufeinanderfolgende Herausforderungen unter 70% Abschluss.',
        warmupPenalty: 'Drei aufeinanderfolgende Aufwärm-Herausforderungen haben eine Sternanpassung ausgelöst.',
        default: 'Deine Sternstufe wurde basierend auf deiner letzten Leistung angepasst.',
      },
      accessibility: {
        promotion: 'Sternstufe auf {{stars}} Sterne erhöht, Rang {{level}}, in der Kategorie {{category}}',
        demotion: 'Sternstufe auf {{stars}} Sterne gesunken, Rang {{level}}, in der Kategorie {{category}}',
      },
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

      progressStats: {
        requirements: 'Anforderungen',
        activeDays: 'Aktive Tage',
        milestones: 'Meilensteine',
      },

      // Rewards
      rewards: {
        title: 'Verdiente EP-Belohnungen',
        baseXP: 'Basis-Herausforderungs-EP',
        streakBonus: 'Monatlicher Serien-Bonus 🔥',
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
        continue: 'Weiter',
      },
    },

    // Failure Modal
    failureModal: {
      title: 'Herausforderung beendet',
      subtitle: 'Monatliche Herausforderung',

      messages: {
        partial: 'Du hast {{percentage}}% bei dieser {{category}}-Herausforderung erreicht. Fast geschafft — gib nächsten Monat alles!',
        failure: 'Du hast {{percentage}}% bei dieser {{category}}-Herausforderung erreicht. Gib nicht auf — jeder Monat ist ein neuer Anfang!',
      },

      progressStats: {
        completion: 'Abschluss',
        requirements: 'Erfüllte Anforderungen',
        activeDays: 'Aktive Tage',
      },

      starImpact: {
        title: 'Stern-Auswirkung',
        noChange: 'Dein Stern-Level bleibt bei {{stars}}★. Keine Strafe für teilweisen Abschluss.',
        warning: 'Erste unvollständige Herausforderung. Ein weiteres Scheitern senkt dein Stern-Level.',
        demotion: 'Dein Stern-Level ist von {{oldStars}}★ auf {{newStars}}★ gesunken wegen aufeinanderfolgender unvollständiger Herausforderungen.',
      },

      streakReset: {
        title: 'Serie zurückgesetzt',
        description: 'Deine {{previousStreak}}-Monats-Serie wurde zurückgesetzt. Starte eine neue!',
      },

      motivation: {
        title: 'Nächster Monat wartet',
        message: 'Eine neue Herausforderung wartet auf dich. Nutze was du diesen Monat gelernt hast und komm stärker zurück!',
      },

      button: 'Weiter',
    },

    // Detail Modal
    detailModal: {
      strategyDescription: 'Dies ist eine {{rarity}} ({{stars}}★) Schwierigkeitsherausforderung, die dir helfen soll, beständig zu wachsen.',
      strategyDescriptionAdvance: 'Schließe diese Herausforderung ab, um zur nächsten Sternstufe aufzusteigen und höhere EP-Belohnungen freizuschalten!',
      strategyStarSystem: '⭐ Sterne: 100% = +1 Stern. Zweimal unter 100% in gleicher Kategorie = -1 Stern.',
      strategyWarmUp: '🔥 Volle Challenges ab 20+ Tagen. 3× Aufwärm-Challenges = -1 Stern.',
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

    // Star Progress section
    starProgress: {
      title: 'Stern-Progression',
      categoryProgress: '{{category}} Fortschritt',
      loadingProgress: 'Lade Fortschritt...',

      // Empty state
      emptyState: {
        noChallengeHistory: 'Noch keine Herausforderungshistorie',
        noCategoryHistory: 'Noch keine {{category}} Herausforderungshistorie',
        completeToSeeProgress: 'Schließe monatliche Herausforderungen ab, um deinen Fortschritt zu sehen',
      },

      // Performance Analysis
      performanceAnalysis: {
        title: 'Leistungsanalyse',
        overallRating: 'Gesamtbewertung',
        trend: 'Trend',
        successRate: 'Erfolgsrate',
        strongest: 'Am stärksten',
      },

      // Trend labels
      trends: {
        improving: 'verbessernd',
        declining: 'rückläufig',
        stable: 'stabil',
      },

      // Progress display
      percentageCompleted: '{{percentage}}% abgeschlossen',
    },
  } as any,

  // Settings screen - Language section (PRIORITY 1)
  settings: {
    title: 'Menü',

    // Appearance
    appearance: 'Aussehen',
    theme: 'Theme',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeSystem: 'Auto',
    themeDescription: 'Wähle dein Farbschema',
    themeSystemDescription: 'Folgt Geräte-Einstellung',
    lightMode: 'Hell',
    darkMode: 'Dunkel',
    systemAuto: 'Auto',
    systemAutoDescription: 'Folgt Geräte-Einstellung',

    // Language
    language: 'Sprache',
    languageDescription: 'Wähle deine Sprache',
    languageEnglish: 'English',
    languageGerman: 'Deutsch',
    languageSpanish: 'Español',

    // Notifications
    notifications: 'Mitteilungen',
    morningNotification: 'Morgens',
    eveningNotification: 'Abends',
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
    habitAnalytics: 'Analytik',
    individualHabitStats: 'Statistiken',

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
    title: 'Trophäen',
    subtitle: 'Deine Ruhmeshalle',

    // View mode toggle
    viewModeTrophyRoom: '🏠 Trophäen',
    viewModeBrowseAll: '🏆 Alle',

    // Loading states
    loadingTitle: 'Lade Trophäen...',
    loadingText: 'Erfolge polieren...',

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
      accessibilityLabel: 'Erfolgsübersicht: {{unlocked}} von {{total}} Erfolgen freigeschaltet, {{percent}}% vollständig, {{xp}} Gesamt-EP verdient',
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

    // Category metadata (for constants)
    categoryMeta: {
      habits: {
        name: 'Gewohnheiten',
        description: 'Konsistente tägliche Routinen aufbauen',
      },
      journal: {
        name: 'Tagebuch',
        description: 'Reflektieren und Dankbarkeit ausdrücken',
      },
      goals: {
        name: 'Ziele',
        description: 'Deine Träume verwirklichen',
      },
      consistency: {
        name: 'Konsistenz',
        description: 'Jeden Tag auftauchen',
      },
      mastery: {
        name: 'Meisterschaft',
        description: 'Die beste Version von dir selbst werden',
      },
      special: {
        name: 'Besonders',
        description: 'Zeitlich begrenzte und einzigartige Erfolge',
      },
    },

    // Rarity metadata (for constants)
    rarityMeta: {
      common: 'Gewöhnlich',
      rare: 'Selten',
      epic: 'Episch',
      legendary: 'Legendär',
    },

    // Filtering and Search
    filter: {
      showAll: 'Alle',
      unlockedOnly: 'Offen',
      lockedOnly: 'Gesperrt',
      byCategory: 'Kategorie',
      byRarity: 'Seltenheit',
      searchPlaceholder: 'Suchen...',
      noResults: 'Keine Treffer',
      noResultsSubtitle: 'Passe Filter oder Suche an',
      clearFilters: 'Filter ×',
    },

    // Trophy Room Stats
    trophyRoom: {
      totalTrophies: 'Trophäen',
      collected: 'Gesammelt',
      completionRate: 'Quote',
      overallProgress: 'Fortschritt',
      showingResults: '{{filtered}}/{{total}} Erfolge',
    },

    // Sorting
    sort: {
      byName: 'Name',
      byUnlockDate: 'Datum',
      byRarity: 'Seltenheit',
      byCategory: 'Kategorie',
      byProgress: 'Fortschritt',
      ascending: 'A-Z',
      descending: 'Z-A',
    },

    // Achievement Card
    card: {
      locked: 'Gesperrt',
      unlocked: 'Offen',
      unlockedOn: 'Offen am {{date}}',
      progress: '{{current}}/{{target}}',
      xpReward: '+{{xp}} XP',
      viewDetails: 'Details',
      almostThere: 'Fast da!',
      keepGoing: 'Weiter!',
      accessibility_label: '{{name}}, {{rarity}} Erfolg. Status: {{status}}. {{description}}',
      accessibility_hint: 'Tippen für Details',
    },

    // Achievement Details Modal
    details: {
      title: 'Details',
      description: 'Info',
      category: 'Kategorie',
      rarity: 'Seltenheit',
      xpReward: 'XP-Bonus',
      unlockCondition: 'Bedingung',
      progress: 'Fortschritt',
      unlockedDate: 'Datum',
      timeToUnlock: 'Dauer',
      tips: 'Tipps',
      close: 'Schließen',
      shareAchievement: 'Teilen',
    },

    // Interactive Features
    interactive: {
      celebrationHistory: 'Feiern',
      achievementSpotlight: 'Spotlight',
      featuredAchievement: 'Featured',
      dailyChallenge: 'Tagesaufgabe',
      progressPreview: 'Vorschau',
      upcomingRewards: 'Belohnungen',
    },

    // Statistics Panel
    stats: {
      title: 'Statistik',
      breakdown: 'Kategorien',
      rarityDistribution: 'Seltenheit',
      unlockTimeline: 'Zeitleiste',
      averageTimeToUnlock: 'Ø Dauer',
      totalXPEarned: 'Gesamt-XP',
      achievementRate: 'Quote',
      consistencyScore: 'Konstanz',
      nextMilestone: 'Nächster',
      daysActive: '{{days}} Tage',
      thisWeek: 'Woche',
      thisMonth: 'Monat',
      allTime: 'Gesamt',
    },

    // Empty States
    empty: {
      noAchievements: 'Noch keine Erfolge',
      noAchievementsSubtitle: 'Erledige deine erste Gewohnheit, schreibe einen Tagebucheintrag oder erreiche ein Ziel, um Erfolge freizuschalten!',
      noSearchResults: 'Keine Ergebnisse gefunden',
      noSearchResultsSubtitle: 'Versuche, deine Suchbegriffe oder Filter anzupassen.',
      noCategory: 'Noch keine Erfolge in dieser Kategorie.',
      noCategorySubtitle: 'Verwende die App weiter und Erfolge werden hier erscheinen!',
    },

    // Achievement Names (will be used for individual achievements)
    names: {
      firstSteps: 'Erste Schritte',
      habitBuilder: 'Gewohnheits-Baumeister',
      streakMaster: 'Serien-Meister',
      deepThinker: 'Tiefgründiger Denker',
      goalGetter: 'Zielerfüller',
      consistent: 'Beständig',
      dedicated: 'Engagiert',
      perfectMonth: 'Perfekter Monat',
    },

    // Achievement Descriptions (will be used for individual achievements)
    descriptions: {
      firstSteps: 'Hast deine erste Gewohnheit, deinen ersten Tagebucheintrag oder dein erstes Ziel erstellt.',
      habitBuilder: 'Hast 5 verschiedene Gewohnheiten erstellt.',
      streakMaster: 'Hast eine 30-Tage-Serie aufrechterhalten.',
      deepThinker: 'Hast einen Tagebucheintrag mit mehr als 200 Zeichen geschrieben.',
      goalGetter: 'Hast dein erstes Ziel abgeschlossen.',
      consistent: 'Hast die App 7 aufeinanderfolgende Tage verwendet.',
      dedicated: 'Hast die App 30 aufeinanderfolgende Tage verwendet.',
      perfectMonth: 'Hast alle Aktivitäten für 30 Tage abgeschlossen.',
    },

    // Sharing
    sharing: {
      shareTitle: 'Ich habe gerade einen Erfolg freigeschaltet!',
      shareText: 'Habe gerade "{{name}}" in SelfRise freigeschaltet! 🏆 {{description}}',
      shareError: 'Erfolg konnte nicht geteilt werden. Bitte versuche es erneut.',
      copySuccess: 'Erfolgsdetails in die Zwischenablage kopiert!',
      copyError: 'Erfolgsdetails konnten nicht kopiert werden.',
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
      progressPercent: '{{percent}}% abgeschlossen',
      howToUnlock: 'Wie man freischaltet',
      estimatedDays: 'Geschätzt: {{days}} Tage verbleibend',
      lockedMessage: 'Dieser Erfolg ist gesperrt. Verwende die App weiter, um ihn freizuschalten!',
      requirementFallback: 'Erfolganforderung',
      actionHint: 'Arbeite weiter auf dieses Ziel hin!',
      closeButton: 'Erfolgsdetails schließen',
      shareButton: 'Erfolg teilen',
      rarityCommon: 'GEWÖHNLICH',
      rarityRare: 'SELTEN',
      rarityEpic: 'EPISCH',
      rarityLegendary: 'LEGENDÄR',
      // Accessibility announcements
      accessibilityUnlocked: 'Erfolgsdetails: {{name}}. Dieser {{rarity}} Erfolg ist freigeschaltet.',
      accessibilityLocked: 'Erfolgsdetails: {{name}}. Dieser {{rarity}} Erfolg ist gesperrt. Fortschrittsinformationen verfügbar.',
    },

    // Achievement Preview System
    preview: {
      // Completion date formatting
      recentlyUnlocked: 'Kürzlich freigeschaltet',
      justNow: 'Gerade eben',
      daysAgo_one: 'Vor {{count}} Tag',
      daysAgo_other: 'Vor {{count}} Tagen',
      hoursAgo_one: 'Vor {{count}} Stunde',
      hoursAgo_other: 'Vor {{count}} Stunden',
      minutesAgo_one: 'Vor {{count}} Minute',
      minutesAgo_other: 'Vor {{count}} Minuten',

      // Time to complete
      achievedThroughDedication: 'Durch Hingabe erreicht',
      achievedInDays_one: 'In {{count}} Tag erreicht',
      achievedInDays_other: 'In {{count}} Tagen erreicht',
      achievedInWeeks_one: 'In {{count}} Woche erreicht',
      achievedInWeeks_other: 'In {{count}} Wochen erreicht',
      achievedInMonths_one: 'In {{count}} Monat erreicht',
      achievedInMonths_other: 'In {{count}} Monaten erreicht',

      // Difficulty levels
      difficultyEasy: 'Einfach',
      difficultyMedium: 'Mittel',
      difficultyHard: 'Schwer',
      difficultyLegendary: 'Legendär',
      difficultyUnknown: 'Unbekannt',

      // Progress tips by category and level
      tips: {
        habits: {
          starting: 'Beginne mit dem täglichen Erstellen und Abschließen von Gewohnheiten',
          building: 'Konzentriere dich auf Beständigkeit bei deinen bestehenden Gewohnheiten',
          advancing: 'Du baust großartiges Gewohnheits-Momentum auf!',
          nearly_there: 'So nah an diesem Gewohnheits-Erfolg!',
        },
        journal: {
          starting: 'Beginne mit täglichen Dankbarkeitseinträgen',
          building: 'Halte deine Tagebuch-Schreibpraxis aufrecht',
          advancing: 'Deine Dankbarkeitspraxis wird stärker!',
          nearly_there: 'Fast diesen Tagebuch-Erfolg freigeschaltet!',
        },
        goals: {
          starting: 'Beginne damit, Ziele zu setzen und daran zu arbeiten',
          building: 'Mache weiter Fortschritte bei deinen Zielen',
          advancing: 'Ausgezeichneter Zielfortschritt!',
          nearly_there: 'Fast diesen Ziel-Erfolg abgeschlossen!',
        },
        consistency: {
          starting: 'Konzentriere dich auf den Aufbau täglicher Beständigkeit',
          building: 'Deine Beständigkeit verbessert sich!',
          advancing: 'Toller Beständigkeits-Streak im Aufbau!',
          nearly_there: 'So nah daran, Beständigkeit zu meistern!',
        },
        mastery: {
          starting: 'Erkunde alle Funktionen, um Meisterschaft zu erlangen',
          building: 'Du lernst die App gut kennen!',
          advancing: 'Werde ein echter SelfRise-Experte!',
          nearly_there: 'Fast das Meisterschaftslevel erreicht!',
        },
        special: {
          starting: 'Erkunde spezielle App-Funktionen',
          building: 'Gute Nutzung spezieller Funktionen!',
          advancing: 'Spezielle Fähigkeiten werden freigeschaltet!',
          nearly_there: 'Fast diesen speziellen Erfolg verdient!',
        },
      },

      // Motivational messages
      motivation: {
        starting: 'Jede Reise beginnt mit einem einzigen Schritt!',
        building: 'Du baust großartiges Momentum auf!',
        advancing: 'Ausgezeichneter Fortschritt - weiter so!',
        nearly_there: 'So nah daran, diesen Erfolg freizuschalten!',
      },

      // Action advice
      advice: {
        habits: 'Schließe täglich Gewohnheiten ab, um Fortschritte zu machen',
        journal: 'Schreibe regelmäßig Tagebucheinträge',
        goals: 'Setze Ziele und arbeite darauf hin',
        consistency: 'Halte tägliche Streaks aufrecht',
        mastery: 'Verdiene XP und steige im Level auf',
        special: 'Erkunde alle App-Funktionen',
      },

      // Effort estimates
      effort: {
        almostThere: 'Fast geschafft!',
        fewMoreDays: 'Noch ein paar Tage',
        oneToTwoWeeks: '~1-2 Wochen',
        twoToFourWeeks: '~2-4 Wochen',
        severalWeeks: 'Mehrere Wochen Aufwand',
      },

      // Default fallbacks
      default: {
        progress: 'Fortschrittsverfolgung...',
        action: 'Arbeite weiter auf dieses Ziel hin!',
      },
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
      description: 'Erhalte insgesamt 25 Mal Flammen - Meister der intensiven Dankbarkeitstage'
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

    // Achievement Progress Hints (245+ keys for progress tracking)
    progressHints: {
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
        progress: 'Sammle insgesamt 25 Flammen ({{current}}/{{target}})',
        requirement: 'Verdiene 25 Mal insgesamt 🔥 Meilenstein',
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
    // Level label (used in level up modals)
    level: 'Level',

    xp: {
      label: 'XP',
      short: 'XP',
      gained: '+XP',
      lost: '-XP',
      total: 'Gesamt',
      loading: 'Lade XP...',

      sources: {
        habit_completion: 'Routine',
        habit_bonus: 'Bonus',
        journal_entry: 'Tagebuch',
        journal_bonus: 'Bonus',
        journal_bonus_milestone: 'Meilenstein',
        goal_progress: 'Fortschritt',
        goal_completion: 'Ziel',
        goal_milestone: 'Meilenstein',
        habit_streak_milestone: 'Serie',
        journal_streak_milestone: 'Serie',
        achievement_unlock: 'Erfolg',
        general_activity: 'Aktivität',
        daily_engagement: 'Engagement',
        monthly_challenge: 'Monat',
        recommendation_follow: 'Tipp',
        xp_multiplier_bonus: 'Bonus',
        XP_MULTIPLIER_BONUS: 'Comeback',
      },

      notification: {
        message: 'XP: {{message}}',
        amount: 'XP {{type}}: {{amount}}',
      },

      announcement: {
        balanced: 'Keine Netto-XP',
        decreased: '-{{xp}} XP',
        single: '+{{xp}} XP: {{count}}× {{source}}',
        multiple_same: '+{{xp}} XP: {{count}}× {{source}}',
        multiple_mixed: '+{{xp}} XP',
      },

      popup: {
        gained: '+{{amount}} XP: {{source}}',
        lost: '-{{amount}} XP: {{source}}',
        amount_label: '{{sign}}{{amount}} XP',
      },

      // Notification messages
      notifications: {
        completed: 'abgeschlossen',
        balanced: 'Aktivitäten ausgeglichen (kein Netto-Fortschritt)',
        reversed: 'Fortschritt umgekehrt',
        updated: 'Aktivitäten aktualisiert',
        and: 'und',
      },

      // XP Notification Component - Source Names (plural forms for display)
      xpNotification: {
        sources: {
          habits: 'Routinen',
          journalEntries: 'Einträge',
          journalMilestones: 'Meilensteine',
          goals: 'Ziele',
          goalMilestones: 'Meilensteine',
          streaks: 'Serien',
          achievements: 'Erfolge',
          monthlyChallenges: 'Monat',
          multiplierBonuses: 'Boni',
          recommendations: 'Tipps',
          activities: 'Aktivität',
        },
        messages: {
          completed: 'abgeschlossen',
          balanced: 'Aktivitäten ausgeglichen (kein Netto-Fortschritt)',
          reversed: 'Fortschritt umgekehrt',
          updated: 'Aktivitäten aktualisiert',
          and: 'und',
        },
        announcements: {
          balanced: 'Keine Netto-XP',
          decreased: '-{{xp}} XP',
          single: '+{{xp}} XP: {{count}}× {{source}}',
          multipleSame: '+{{xp}} XP: {{count}}× {{source}}',
          multipleMixed: '+{{xp}} XP',
        },
        accessibility: {
          notification: 'XP: {{message}}',
          amount: 'XP {{type}}: {{amount}}',
          typeGained: 'erhalten',
          typeLost: 'verloren',
          typeBalanced: 'gleich',
        },
        unit: 'XP',
      },
    },

    // Progress and Levels
    progress: {
      level: 'Level',
      progress: 'Status',
      to_next_level: 'bis Lv.{{level}}',
      xp_remaining: '{{xp}} XP übrig',
      loading: 'Lade...',
      levelProgressFull: 'Lv.{{currentLevel}} {{progress}}% → Lv.{{nextLevel}}',
      xpProgressText: '{{current}}/{{total}} XP',
      levelProgressCompact: 'Lv.{{level}} • {{progress}}%',

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
      current: 'Aktuell',
      next: 'Nächstes',
      milestone: 'Meilenstein',
      rewards: 'Bonus',
      title: 'Titel',
      description: 'Info',

      // Level Overview Screen
      overview: {
        currentBadge: 'Jetzt',
        xpRequiredSuffix: 'XP nötig',
        rarity: {
          mythic: 'Mythisch',
          legendary: 'Legendär',
          epic: 'Episch',
          rare: 'Selten',
          growing: 'Wachsend',
          beginner: 'Start',
        },
      },
    },

    effects: {
      level_up: 'Level-Up',
      milestone: 'Meilenstein',
      achievement: 'Erfolg',
      celebration: 'Feier',
      general: 'Effekte',
      accessibility_label: '{{type}} {{intensity}} Partikel',
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

      // XP Multiplier Indicator
      harmonyStreak: 'Harmonie-Serie',
      harmonyStreakProgress: 'Harmonie-Serie: {{current}}/7',
      activeMultiplier: 'Aktiver XP-Multiplikator: {{multiplier}}x, {{time}} verbleibend',
      multiplierValue: '{{multiplier}}x XP',
      progressSubtext: 'Nutze alle 3 Funktionen täglich, um 2x XP freizuschalten',
      noMultiplier: 'Kein Multiplikator',

      // Activation Messages
      activatingMultiplier: 'Harmonie-Serien-Multiplikator wird aktiviert',
      multiplierActivatedMessage: 'Multiplikator aktiviert! {{multiplier}}x XP für {{hours}} Stunden',
      activationFailed: 'Aktivierung fehlgeschlagen: {{error}}',
      unknownError: 'Unbekannter Fehler',

      // Accessibility Labels
      activateMultiplierAccessibility: '2x XP-Multiplikator für 24 Stunden aktivieren. Aktuelle Harmonie-Serie: {{streak}} Tage',
      activateMultiplierHint: 'Doppeltippen, um Multiplikator zu aktivieren',
      harmonyProgressAccessibility: 'Harmonie-Serien-Fortschritt: {{current}} von 7 benötigten Tagen',

      // Modal Content
      achievementDescription: 'Du hast alle drei Funktionen (Gewohnheiten, Tagebuch, Ziele) täglich für {{days}} aufeinanderfolgende Tage genutzt! Genieße doppelte XP-Belohnungen für die nächsten 24 Stunden.',
      shareButton: '🎉 Teilen',
      shareAccessibility: 'Teile deinen Erfolg',

      // Timer Display
      timeFormat: {
        hoursMinutes: '{{hours}}h {{minutes}}m',
        minutesSeconds: '{{minutes}}m {{seconds}}s',
        seconds: '{{seconds}}s',
        hoursOnly: '{{hours}}h',
      },

      // Countdown Timer
      timerAccessibility: 'XP-Multiplikator: {{multiplier}}x, {{time}} verbleibend',
      noActiveMultiplier: 'Kein aktiver XP-Multiplikator',

      // Service-level messages
      errors: {
        alreadyActive: 'Multiplikator bereits aktiv',
        alreadyRunning: '{{source}} Multiplikator läuft bereits',
        needHarmonyStreak: '{{days}} Tage Harmonie-Serie erforderlich (aktuell: {{current}})',
        onCooldown: 'Harmonie-Multiplikator ist auf Abklingzeit',
        cannotActivate: 'Kann Harmonie-Multiplikator nicht aktivieren',
        cannotActivateInactive: 'Kann Inaktiv-Benutzer-Boost nicht aktivieren',
        userInactiveButActive: 'Benutzer ist inaktiv, aber Multiplikator bereits aktiv',
        userNotInactive: 'Benutzer ist nicht inaktiv ({{days}} Tage seit letzter Aktivität, 4+ benötigt)',
        challengeCooldownActive: 'Herausforderungs-Multiplikator ist auf Abklingzeit, versuche es später erneut',
      },
      descriptions: {
        harmonyStreak: 'Harmonie-Serie: {{multiplier}}x XP ({{hours}}h verbleibend)',
        challengeReward: 'Herausforderungsbelohnung: {{multiplier}}x XP ({{hours}}h verbleibend)',
        achievementBonus: 'Erfolgs-Bonus: {{multiplier}}x XP ({{hours}}h verbleibend)',
        specialEvent: 'Spezielles Event: {{multiplier}}x XP ({{hours}}h verbleibend)',
        welcomeBack: 'Willkommen zurück! {{multiplier}}x XP ({{hours}}h verbleibend)',
        default: '{{multiplier}}x XP-Multiplikator ({{hours}}h verbleibend)',
        harmonyActivated: 'Harmonie-Serie aktiviert! {{hours}}h mit 2x XP',
        welcomeBackBoost: 'Willkommen zurück! 2x XP für {{hours}} Stunden',
        xpFor: '2x XP für {{hours}} Stunden',
        comebackBonus: 'Comeback-Bonus: {{days}} Tage abwesend',
        achievementComboActivated: 'Erfolgs-Combo! {{count}} Erfolge freigeschaltet - {{hours}}h mit {{multiplier}}x XP',
        achievementCombo: 'Erfolgs-Combo: {{multiplier}}x XP ({{hours}}h verbleibend)',
        challengeCompletedActivated: 'Monatliche Herausforderung abgeschlossen! {{stars}}★ - {{hours}}h mit 1.5x XP',
      },
      notifications: {
        oneMoreDay: 'Noch ein Tag ausgewogener Aktivität, um den 2x XP-Multiplikator freizuschalten!',
        moreDays: 'Noch {{days}} Tage ausgewogener Aktivität, um den 2x XP-Multiplikator freizuschalten!',
      },
    },

    analysis: {
      title: 'Leistungsanalyse',
      overallRating: 'Gesamtbewertung',
      trend: 'Trend',
      successRate: 'Erfolgsquote',
      strongest: 'Stärkste',
    },

    // Level tier descriptions
    levelTiers: {
      common: 'Gewöhnlich - Aufbau der Grundlage deiner persönlichen Wachstumsreise.',
      rare: 'Selten - Entwicklung von Konsistenz und tieferem Verständnis deiner Gewohnheiten.',
      epic: 'Episch - Meisterung der Kunst der Selbstverbesserung mit fortgeschrittenen Techniken.',
      legendary: 'Legendär - Außergewöhnliches Wachstum erreichen und andere inspirieren.',
      mythic: 'Mythisch - Gewöhnliche Grenzen überschreiten und ein wahrer Meister werden.',
      default: 'Fortsetzung deiner Reise des persönlichen Wachstums und der Selbstverbesserung.',
    },

    // Milestone rewards
    milestoneRewards: {
      level10: {
        badge: 'Erfolgsabzeichen: Anfänger V',
        theme: 'Freischaltung eines benutzerdefinierten Farbthemas',
        multiplier: 'Bonus-XP-Multiplikator (1 Stunde)',
      },
      level25: {
        badge: 'Erfolgsabzeichen: Adept V',
        trophy: 'Trophäenraum-Erweiterung',
        challenge: 'Wöchentliche Herausforderung freigeschaltet',
      },
      level50: {
        badge: 'Erfolgsabzeichen: Spezialist V',
        prestige: 'Prestige-System-Zugang',
        stats: 'Erweiterte Statistiken freigeschaltet',
      },
      level75: {
        badge: 'Erfolgsabzeichen: Herausforderer V',
        legacy: 'Legacy-Funktionen freigeschaltet',
        mentor: 'Mentor-Modus freigeschaltet',
      },
      level100: {
        badge: 'Erfolgsabzeichen: Mythisch V Ultimativ',
        hallOfFame: 'Hall of Fame Eintrag',
        title: 'Ultimativer Titel freigeschaltet',
        customAchievement: 'Benutzerdefinierte Erfolge erstellen',
      },
      default: 'Level {{level}} Erfolgsabzeichen',
    },

    // XP Source descriptions
    xpSources: {
      habitCompletion: 'Geplante Gewohnheit abgeschlossen',
      habitBonus: 'Gewohnheit an nicht geplantem Tag abgeschlossen',
      habitStreakMilestone: 'Gewohnheits-Serie-Meilenstein erreicht',
      journalEntry: 'Tagebucheintrag erstellt',
      journalBonus: 'Bonus-Tagebucheintrag erstellt',
      journalBonusMilestone: 'Tagebuch-Bonus-Meilenstein erreicht',
      journalStreakMilestone: 'Tagebuch-Serie-Meilenstein erreicht',
      goalProgress: 'Fortschritt zum Ziel hinzugefügt',
      goalCompletion: 'Ziel abgeschlossen',
      goalMilestone: 'Ziel-Meilenstein erreicht',
      recommendationFollow: 'Empfehlung befolgt',
      achievementUnlock: 'Erfolg freigeschaltet',
      monthlyChallenge: 'Monatliche Herausforderung abgeschlossen',
      xpMultiplierBonus: 'XP-Multiplikator-Bonus angewendet',
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

    // Validierungsmeldungen
    validation: {
      xpMustBePositive: 'EP-Betrag muss positiv sein',
      xpSubtractMustBePositive: 'Abzuziehender EP-Betrag muss positiv sein',
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
      // Schritt 1: Willkommen & Grundlagen
      welcome: {
        title: 'Willkommen bei SelfRise! 🌟',
        content: 'Starte deine Reise des Wachstums! Wir zeigen dir, wie du Gewohnheiten erstellst, Tagebuch führst und Ziele setzt. Alles, was du brauchst, um dein bestes Leben zu leben! ✨',
        button: 'Los geht\'s!',
      },

      // App-Übersicht
      appOverview: {
        title: 'Dein Persönliches Wachstums-Dashboard 📊',
        content: 'Dies ist dein Startbildschirm, auf dem du deinen Fortschritt, Serien und Erfolge siehst. Schau täglich vorbei, um motiviert zu bleiben!',
        button: 'Zeig mir mehr',
      },

      // Schnellaktionen
      quickActions: {
        title: 'Schnellaktionen 🚀',
        content: 'Diese Schaltflächen ermöglichen dir, schnell Gewohnheiten, Tagebucheinträge oder Ziele hinzuzufügen. Tippe sie jederzeit an, wenn du Fortschritte machen möchtest!',
        button: 'Verstanden!',
      },

      // Gewohnheit erstellen Button
      createHabitButton: {
        title: 'Lass uns deine erste Gewohnheit erstellen! 🌱',
        content: 'Tippe auf diese Schaltfläche, um deine erste positive Gewohnheit aufzubauen. Wir führen dich Schritt für Schritt durch den Prozess.',
        button: 'Gewohnheit erstellen',
      },

      // Gewohnheit erstellen (Speichern-Button)
      habitCreate: {
        title: 'Speichere deine Gewohnheit 💾',
        content: 'Fertig mit Anpassen? Tippe auf die Speichern-Schaltfläche, um deine Gewohnheit zu erstellen und deine Serie zu starten!',
        button: 'Weiter',
      },

      // Zielkategorie
      goalCategory: {
        title: 'Wähle eine Kategorie 🏷️',
        content: 'Wähle eine Kategorie, die dein Ziel am besten beschreibt. Dies hilft, deine Ziele zu organisieren und den Fortschritt in verschiedenen Lebensbereichen zu verfolgen.',
        button: 'Nächster Schritt',
      },

      // Ziel erstellen (Speichern-Button)
      goalCreate: {
        title: 'Erstelle dein Ziel 🎯',
        content: 'Bereit zum Verfolgen zu starten? Tippe auf die Erstellen-Schaltfläche, um dein Ziel zu speichern und deine Reise zu beginnen!',
        button: 'Los geht\'s!',
      },

      // Ziel abgeschlossen
      goalComplete: {
        title: 'Ziel erstellt! 🎉',
        content: 'Fantastisch! Dein Ziel ist jetzt aktiv. Füge Fortschrittsaktualisierungen hinzu, um Vorhersagen zu sehen und deine Reise zu verfolgen!',
        button: 'Weiter',
      },

      // Zur Startseite navigieren
      navigateHome: {
        title: 'Lass uns nach Hause gehen 🏠',
        content: 'Tippe auf den Home-Tab, um dein Dashboard mit all deinen Fortschritten, Gewohnheiten und Erfolgen zu sehen!',
        button: 'Bring mich nach Hause',
      },

      // Trophäenraum
      trophyRoom: {
        title: 'Dein Trophäenraum 🏆',
        content: 'Hier leben all deine Erfolge! Schließe Herausforderungen ab, um Abzeichen freizuschalten und deine Siege zu feiern!',
        button: 'Großartig!',
      },

      // Schritt 2: Gewohnheitsname eingeben
      habitName: {
        title: 'Erstelle deine erste Gewohnheit 🌱',
        content: 'Was möchtest du täglich tun? Lesen, Sport, Meditation - wähle eine positive Gewohnheit, die dir guttut!',
        placeholder: 'z.B. 10 Minuten lesen',
        examples: ['Morgenmeditation', 'Täglicher Spaziergang', '8 Gläser Wasser trinken', 'In Dankbarkeitstagebuch schreiben', '20 Liegestütze machen'],
        button: 'Tolle Wahl!',
      },

      // Schritt 3: Gewohnheitsfarbe auswählen
      habitColor: {
        title: 'Mach es zu deinem! 🎨',
        content: 'Wähle eine Farbe, die dich begeistert! Sie wird dich an deine neue Gewohnheit erinnern.',
        button: 'Perfekt!',
      },

      // Schritt 4: Gewohnheitssymbol auswählen
      habitIcon: {
        title: 'Wähle dein Symbol ✨',
        content: 'Wähle ein Symbol für deine Gewohnheit! Es hilft dir, sie sofort zu erkennen.',
        button: 'Ich liebe es!',
      },

      // Schritt 5: Gewohnheitstage planen
      habitDays: {
        title: 'Wann wirst du dies tun? 📅',
        content: 'Wähle die Tage, die zu deinem Leben passen. Täglich oder nur an bestimmten Tagen - du entscheidest!',
        button: 'Klingt gut!',
      },

      // Schritt 6: Gewohnheit erfolgreich erstellt
      habitComplete: {
        title: 'Gewohnheit erstellt! 🎉',
        content: 'Fantastisch! Deine erste Gewohnheit ist bereit. Morgen kannst du sie abhaken und deine Serie starten!',
        button: 'Was kommt als Nächstes?',
      },

      // Schritt 7: Tagebuch-Einführung
      journalIntro: {
        title: 'Probiere das Tagebuch aus! 📝',
        content: 'Dankbarkeit aufschreiben stärkt positive Gedanken. Lass uns deinen ersten Eintrag schreiben!',
        button: 'Ich bin bereit!',
      },

      // Schritt 8: Erster Dankbarkeitseintrag
      gratitudeEntry: {
        title: 'Wofür bist du dankbar? 🙏',
        content: 'Denke an etwas, das du schätzt - groß oder klein. Eine Person, Erfahrung oder etwas Einfaches wie Morgenkaffee! ☕',
        placeholder: 'Ich bin dankbar für...',
        examples: ['Die Unterstützung meiner Familie', 'Ein Dach über dem Kopf zu haben', 'Die Fähigkeit, neue Dinge zu lernen', 'Einen sonnigen Tag', 'Meine Gesundheit'],
        button: 'Eintrag hinzufügen',
      },

      // Schritt 9: Tagebuch-Ermutigung
      journalEncouragement: {
        title: 'Du bist ein Naturtalent! ⭐',
        content: 'Super Eintrag! 3 tägliche Einträge halten deine Serie. Bonus-Einträge bringen extra XP!',
        button: 'Verstanden!',
      },

      // Schritt 10: Ziele-Einführung
      goalsIntro: {
        title: 'Zeit für ein Ziel! 🎯',
        content: 'Ziele geben Richtung. Wir helfen dir, Fortschritte zu verfolgen und vorherzusagen, wann du es erreichst!',
        button: 'Lass uns eines erstellen!',
      },

      // Schritt 11: Zieltitel
      goalTitle: {
        title: 'Was ist dein Ziel? 🏆',
        content: 'Wähle etwas Bedeutungsvolles und Spezifisches, worauf du stolz wärst!',
        placeholder: 'z.B. 24 Bücher dieses Jahr lesen',
        examples: ['5.000€ für Urlaub sparen', 'Spanisch fließend lernen', 'Einen 5K-Marathon laufen', 'Ein Buch schreiben', 'Gitarre lernen'],
        button: 'Tolles Ziel!',
      },

      // Schritt 12: Zieleinheit
      goalUnit: {
        title: 'Wie misst du den Fortschritt? 📊',
        content: 'Wähle eine Einheit für dein Ziel. Das hilft uns, deinen Fortschritt zu zeigen!',
        placeholder: 'z.B. Bücher',
        examples: ['Bücher', 'Euro', 'Kilogramm', 'Stunden', 'Kilometer', 'Seiten', 'Tage'],
        button: 'Perfekt!',
      },

      // Schritt 13: Zielzahl
      goalTarget: {
        title: 'Was ist deine Zielzahl? 🎯',
        content: 'Wie viele {{unit}} möchtest du erreichen? Herausfordernd aber realistisch!',
        placeholder: 'z.B. 24',
        button: 'Klingt erreichbar!',
      },

      // Schritt 14: Zieldatum (Optional)
      goalDate: {
        title: 'Wann möchtest du fertig sein? 📅',
        content: 'Ein Zieldatum hilft bei Vorhersagen. Optional - du kannst es später ändern.',
        placeholder: 'Zieldatum auswählen (optional)',
        button: 'Alles bereit!',
      },

      // Schritt 14b: Ziel erstellen Button
      createGoalButton: {
        title: 'Erstelle dein erstes Ziel',
        content: 'Klicke auf + Ziel hinzufügen, um dein erstes bedeutungsvolles Ziel zu setzen!',
        button: 'Hier klicken',
      },

      // Schritt 15: XP-System-Einführung
      xpIntro: {
        title: 'Du verdienst XP! ⚡',
        content: 'Du sammelst Erfahrungspunkte! Jede Aktion bringt XP und hilft dir, Level aufzusteigen. Wie ein Spiel für dein Leben! 🎮',
        button: 'So cool!',
      },

      // Schritt 16: Tutorial abgeschlossen
      completion: {
        title: 'Du bist bereit! 🚀',
        content: 'Glückwunsch! Gewohnheit, Tagebuch und Ziel sind erstellt. Schau täglich vorbei für Serien, XP und Erfolge! Willkommen bei SelfRise! 🌟',
        button: 'Starte meine Reise!',
      },
    },

    // Validierungsnachrichten
    validation: {
      habitName: {
        required: 'Bitte gib einen Gewohnheitsnamen ein, um fortzufahren',
        tooShort: 'Gib deiner Gewohnheit einen aussagekräftigeren Namen (mindestens 2 Zeichen)',
        tooLong: 'Halte deinen Gewohnheitsnamen unter 50 Zeichen',
      },
      habitDays: {
        required: 'Bitte wähle mindestens einen Tag für deine Gewohnheit',
      },
      goalTitle: {
        required: 'Bitte gib einen Zieltitel ein, um fortzufahren',
        tooShort: 'Gib deinem Ziel einen aussagekräftigeren Titel (mindestens 2 Zeichen)',
        tooLong: 'Halte deinen Zieltitel unter 100 Zeichen',
      },
      goalUnit: {
        required: 'Bitte gib eine Einheit für die Fortschrittsmessung an',
        tooLong: 'Halte deine Einheit unter 20 Zeichen',
      },
      goalTarget: {
        required: 'Bitte gib einen Zielwert größer als 0 ein',
        tooLarge: 'Zielwert sollte kleiner als 1.000.000 sein',
      },
      gratitudeEntry: {
        required: 'Bitte schreibe, wofür du dankbar bist',
        tooShort: 'Teile ein bisschen mehr Details darüber, wofür du dankbar bist',
      },
    },

    // Fehlermeldungen
    errors: {
      loadingFailed: 'Hoppla! Beim Laden des Tutorials ist etwas schiefgelaufen. Bitte versuche es erneut.',
      savingFailed: 'Wir konnten deinen Fortschritt nicht speichern. Bitte überprüfe deine Verbindung und versuche es erneut.',
      habitCreationFailed: 'Wir konnten deine Gewohnheit nicht erstellen. Bitte versuche es erneut.',
      goalCreationFailed: 'Wir konnten dein Ziel nicht erstellen. Bitte versuche es erneut.',
      journalEntryFailed: 'Wir konnten deinen Tagebucheintrag nicht speichern. Bitte versuche es erneut.',
      genericError: 'Etwas Unerwartetes ist passiert. Bitte versuche es erneut.',
      recoveryMode: 'Das Tutorial hatte Probleme. Wird im vereinfachten Modus ausgeführt.',
      reset: 'Das Tutorial hatte einen Fehler und wurde zurückgesetzt.',
      retry: 'Erneut versuchen',
      generalError: 'Das Tutorial ist auf einen Fehler gestoßen. Bitte versuche es erneut.',
      alreadyCompleted: 'Tutorial bereits abgeschlossen oder übersprungen',
    },

    // Benutzerfeedback-Nachrichten
    feedback: {
      simplifiedMode: 'Das Tutorial hatte Probleme. Wird im vereinfachten Modus ausgeführt.',
      errorReset: 'Das Tutorial hatte einen Fehler und wurde zurückgesetzt.',
      greatStart: 'Toller Start! Weiter tippen...',
      perfectChoice: 'Perfekte Wahl! 👌',
      targetDateSet: 'Super! Zieldatum: {{date}} 📅',
      chooseFutureDate: 'Bitte wähle ein zukünftiges Datum für dein Ziel! 🔮',
      daysConsistency: 'Perfekt! Mit {{count}} Tag(en) baust du Beständigkeit auf! 💪',
      daysMomentum: 'Ehrgeizig! {{count}} Tage sind großartig für Schwung! 🚀',
      perfectTarget: 'Super! {{value}} ist ein perfektes Ziel! ✨',
      enterPositiveNumber: 'Bitte gib eine positive Zahl ein! 🔢',
      enterPositiveGoal: 'Bitte gib eine positive Zahl für dein Ziel ein! 🎯',
      veryAmbitious: 'Das ist sehr ehrgeizig! Erwäge kleinere Meilensteine für besseren Erfolg! 🚀',
      goalAtLeastOne: 'Dein Ziel sollte mindestens 1 sein! Höher hinaus! ⭐',
      achievableTarget: 'Perfektes Ziel: {{value}}! Sieht erreichbar und motivierend aus! 🎯',
      farAhead: 'Das ist ziemlich weit voraus! Erwäge kürzerfristige Ziele für besseren Schwung! 📅',
      sprintGoal: '{{days}} Tage - ein schnelles Sprintziel! Perfekt für Schwung! ⚡',
      monthlyChallenge: '{{days}} Tage - tolle Monatsherausforderung! Erreichbar und motivierend! 📅',
      quarterlyGoal: '{{days}} Tage - ausgezeichnetes Quartalsziel! Perfekter Zeitrahmen! 🎯',
      longTermGoal: '{{days}} Tage - ehrgeiziges Langzeitziel! Erwäge Meilenstein-Checkpoints! 🏔️',
      selectCategory: 'Bitte wähle eine Kategorie zum Organisieren deines Ziels! 📂',
      greatCategoryChoice: 'Tolle Wahl! {{category}}-Ziele sind sehr wichtig für ausgewogenes Wachstum! 🌟',
      categoryHelpsTrack: 'Perfekt! Diese Kategorie hilft dir den Fortschritt zu verfolgen! 📊',
      specifyUnit: 'Bitte gib an, in welcher Einheit du messen wirst! 📏',
      descriptiveUnit: 'Versuche eine beschreibendere Einheit wie "Bücher" oder "Stunden"! 📚',
      excellentUnit: 'Ausgezeichnete Einheitswahl: "{{unit}}" - sehr klar und messbar! 📊',
      goodUnit: 'Gute Einheit: "{{unit}}" - stelle sicher, dass sie leicht zu verfolgen ist! ✅',
    },

    // Überspringen-Bestätigung
    skipConfirmation: {
      title: 'Tutorial überspringen?',
      message: 'Bist du sicher, dass du das Tutorial überspringen möchtest? Du kannst es später jederzeit über den Hilfebereich aufrufen.',
      skip: 'Ja, überspringen',
      continue: 'Tutorial fortsetzen',
    },

    // Fortschrittsnachrichten
    progress: {
      creatingHabit: 'Erstelle deine großartige Gewohnheit...',
      creatingGoal: 'Richte dein Ziel ein...',
      savingEntry: 'Speichere deinen Dankbarkeitseintrag...',
      loading: 'Lade nächsten Schritt...',
    },

    // Barrierefreiheit
    accessibility: {
      tutorialModal: 'Tutorial-Schritt {{step}} von {{total}}: {{title}}',
      spotlightArea: 'Tutorial-Spotlight hebt {{target}} hervor',
      progressIndicator: 'Tutorial-Fortschritt: {{progress}} Prozent abgeschlossen',
      skipButton: 'Tutorial überspringen und zur Haupt-App wechseln',
      nextButton: 'Weiter zum nächsten Tutorial-Schritt',
      formField: 'Tutorial-Eingabefeld für {{field}}',
      colorSelector: 'Farbauswahl für Gewohnheitsanpassung',
      iconSelector: 'Symbolauswahl für Gewohnheitsanpassung',
      daySelector: 'Tagesauswahl für Gewohnheitsplanung',
    },

    // Tutorial Recovery (for crash recovery)
    recovery: {
      title: 'Willkommen zurück! 👋',
      message: 'Es sieht so aus, als ob du mitten im Tutorial warst. Möchtest du dort weitermachen oder neu beginnen?',
      continue: 'Tutorial fortsetzen',
      restart: 'Neu starten',
    },

    stepProgress: 'Schritt {{current}} von {{total}}',
  },

  // Notifications
  notifications: {
    disabled: 'Deaktiviert',
    enableTap: 'Tippen zum Aktivieren',
    settingsTap: 'Einstellungen öffnen',
    afternoonReminder: 'Nachmittag',
    afternoonDescription: 'Check-in',
    eveningReminder: 'Abend',
    eveningDescription: 'Erinnerung',
    // Android-Benachrichtigungskanäle
    channels: {
      reminders: {
        name: 'Erinnerungen',
        description: 'Tägliche Erinnerungen',
      },
    },
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
        // Generische Nachrichten für zukünftige Tage (keine spezifischen Zahlen - immer wahrheitsgemäß)
        generic: {
          variant1: {
            title: 'Abend-Check-in 🌙',
            body: 'Wie war dein Tag? Überprüfe deine Gewohnheiten und dein Tagebuch! 📝',
          },
          variant2: {
            title: 'Zeit für Reflexion ✨',
            body: 'Vergiss nicht, deine Gewohnheiten zu überprüfen und einen Tagebucheintrag hinzuzufügen!',
          },
          variant3: {
            title: 'Täglicher Fortschritt 🎯',
            body: 'Hast du heute deine Gewohnheiten erfüllt? Nimm dir einen Moment zum Nachdenken.',
          },
          variant4: {
            title: 'Abendeinnnerung 💫',
            body: 'Deine Gewohnheiten und dein Tagebuch warten! Beende den Tag stark.',
          },
        },
      },
    },
  } as any,

  social: {
    // Share feature
    share: {
      achievementUnlockedTitle: '🏆 Erfolg freigeschaltet: {{name}}!',
    },
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
      daysActive: '{{days}} Tage aktiv',
      heroLevel: 'Level {{level}}',
      today: '🟢 Heute',
      yesterday: '🟡 Gestern',
      recent: '🔵 Kürzlich',
      heroAccessibilityLabel: 'Anonymer Held erreichte {{achievement}}',
      loadError: 'Fehler beim Laden der täglichen Helden',
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
      dailyInspiration: 'Tägliche Inspiration',
      personalizedJourney: 'Personalisiert für deine Reise',
      sharedFrom: 'Geteilt von SelfRise - Deine Reise der persönlichen Entwicklung',
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
      completedProgress: '{{completed}}/{{total}} abgeschlossen',
      moreToUnlock: 'Noch {{count}} freizuschalten',
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
      // Motivation messages based on days remaining
      motivation: {
        oneDay: 'Nur noch 1 aktiver Tag bis {{name}}!',
        fewDays: '{{days}} aktive Tage bis {{name}} - so nah!',
        withinReach: '{{name}} ist in Reichweite: Noch {{days}} Tage!',
        building: 'Auf dem Weg zu {{name}}: Noch {{days}} aktive Tage',
        continuing: 'Deine Loyalitätsreise führt weiter zu {{name}}',
      },
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
      latestAchievements_one: 'Dein neuester {{count}} Erfolg',
      latestAchievements_other: 'Deine neuesten {{count}} Erfolge',
      moreAchievements: 'Und {{count}} weitere in deiner Sammlung...',
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
      categoryProgress: '{{unlocked}} von {{total}} freigeschaltet',
    },
    // Share Achievement Modal
    shareModal: {
      title: 'Erfolg teilen',
      subtitle: 'Feiern Sie Ihren Fortschritt! 🎉',
      preparing: 'Dein Erfolg wird vorbereitet... 🏆',
      messagePreview: 'Vorschau der Freigabemeldung',
      sharingOptions: 'Freigabeoptionen',
      privacyProtected: 'Datenschutz geschützt',
      privacyDescription: 'Ihre persönlichen Informationen werden niemals geteilt. Nur Erfolgsfortschritt und motivierende Inhalte sind in Freigaben enthalten.',
      loadError: 'Erfolgsdaten konnten nicht geladen werden',
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
      week: 'Woche {{week}}',
    },
    completion: {
      requirements: 'Anforderungen',
      activeDays: 'Aktive Tage',
      milestones: 'Meilensteine',
    },
    guidance: {
      habitsTarget: '🎯 Ziel: {{target}} Gewohnheitsabschlüsse diesen Monat (ca. {{daily}} pro Tag)',
      habitsTip: '💡 Tipp: Beginne mit 1-2 Gewohnheiten und baue Konsistenz auf, bevor du mehr hinzufügst',
      journalTarget: '📝 Ziel: {{target}} Tagebucheinträge diesen Monat (ca. {{daily}} pro Tag)',
      journalTip: '💡 Tipp: Auch kurze Einträge zählen - konzentriere dich auf die Gewohnheit des täglichen Schreibens',
      goalsTarget: '🎯 Ziel: {{target}} Tage mit Zielfortschritt diesen Monat',
      goalsTip: '💡 Tipp: Mache täglich Fortschritte, selbst wenn du nur deine Ziele aktualisierst',
      consistencyTarget: '⭐ Ziel: {{target}} konsistente Aktivitätstage diesen Monat',
      consistencyTip: '💡 Tipp: Versuche, mehrere Funktionen täglich zu nutzen für maximale Konsistenz',
      checkProgress: '📊 Überprüfe deinen Fortschritt wöchentlich, um auf Kurs zu bleiben',
      buildHabit: '🎉 Denk daran: Dieser erste Monat geht um den Aufbau der Gewohnheit, nicht um Perfektion',
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

  // Überwachungssystem
  monitoring: {
    errors: {
      initFailed: 'Überwachung konnte nicht initialisiert werden',
      refreshFailed: 'Überwachungsdaten konnten nicht aktualisiert werden',
    },
  },

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
    skipTutorial: 'Tutorial überspringen',
    viewAllLevels: 'Alle Level anzeigen',
    refreshDailyHeroes: 'Tägliche Helden aktualisieren',
    closeSharingModal: 'Freigabedialog schließen',
    closeHelp: 'Hilfe schließen',
    particleEffects: '{{type}} Feier mit {{intensity}} Intensität Partikeleffekten',
    hints: {
      openLevelOverview: 'Öffnet Level-Übersicht',
      doubleTapShowHelp: 'Doppeltippen, um Hilfeinformationen anzuzeigen',
      tapForInspiration: 'Tippe für mehr Inspiration',
    },
  },

  // AdMob Werbung
  ads: {
    banner: {
      loading: 'Werbung lädt...',
      failed: 'Werbung konnte nicht geladen werden',
    },
    rewarded: {
      title: 'Stelle deine Serie wieder her',
      description: 'Schaue eine kurze Werbung, um deine Tagebuch-Serie wiederherzustellen',
      buttonWatch: 'Werbung ansehen',
      buttonCancel: 'Nicht jetzt',
      loading: 'Werbung lädt...',
      playing: 'Werbung läuft...',
      success: 'Serie wiederhergestellt!',
      failed: 'Werbung konnte nicht geladen werden. Bitte versuche es erneut.',
      dismissed: 'Werbung wurde abgebrochen. Keine Belohnung erhalten.',
    },
  },
};

export default de;
