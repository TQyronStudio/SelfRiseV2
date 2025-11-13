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
    streakActive: 'Serie aktiv!',
    startToday: 'Heute beginnen',
    bestStreak: 'Beste',
    canRecover: 'Mit Werbung wiederherstellen',
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
    // Quick Actions
    quickActions: 'Schnellaktionen',
    addHabit: 'Gewohnheit hinzufügen',
    addJournal: 'Eintrag hinzufügen',
    addGoal: 'Ziel hinzufügen',
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
    },
  } as any,

  // Habits screen
  habits: {
    title: 'Meine Gewohnheiten',
    addHabit: 'Gewohnheit hinzufügen',
    editHabit: 'Gewohnheit bearbeiten',
    deleteHabit: 'Gewohnheit löschen',
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
  } as any,

  // Journal screen
  journal: {
    title: 'Mein Tagebuch',
    addGratitude: 'Dankbarkeit hinzufügen',
    gratitudePlaceholder: 'Wofür bist du heute dankbar?',
    minimumRequired: 'Schreibe mindestens 3 Einträge, um deine Serie aufrechtzuerhalten',
    bonusGratitude: 'Bonus-Eintrag',
    currentStreak: 'Aktuelle Serie',
    longestStreak: 'Längste Serie',
    history: 'Historie',
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
    },
  } as any,

  // Goals screen
  goals: {
    title: 'Meine Ziele',
    addGoal: 'Ziel hinzufügen',
    editGoal: 'Ziel bearbeiten',
    deleteGoal: 'Ziel löschen',
    noGoals: 'Noch keine Ziele. Beginne mit der Erstellung deines ersten Ziels!',
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
    },

    form: {
      title: 'Zieltitel',
      description: 'Beschreibung (Optional)',
      unit: 'Einheit',
      targetValue: 'Zielwert',
      category: 'Kategorie',
      targetDate: 'Zieldatum (Empfohlen)',
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

  // TODO: Add remaining translations progressively for other sections
  // For now, missing keys will fall back to English
};

export default de;
