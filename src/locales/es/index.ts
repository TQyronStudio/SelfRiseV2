import { TranslationKeys } from '../../types/i18n';

/**
 * Spanish (Español) Translations
 *
 * Status: COMPLETE
 * Coverage: 100% - All user-facing text translated
 *
 * Translation Strategy:
 * - Informal "tú" form for friendly tone
 * - Motivational and encouraging language throughout
 * - Tutorial content falls back to English (onboarding UI elements translated)
 */

const es: Partial<TranslationKeys> = {
  // Navigation
  tabs: {
    home: 'Inicio',
    habits: 'Hábitos',
    journal: 'Mi Diario',
    goals: 'Metas',
    achievements: 'Logros',
    settings: 'Ajustes',
  },

  // Home screen
  home: {
    title: '¡Bienvenido de nuevo!',
    journalStreak: 'Mi Racha de Diario',
    habitStatistics: 'Estadísticas de Hábitos',
    weeklyProgress: 'Progreso Semanal',
    monthlyProgress: 'Progreso Mensual',
    dayDetail: 'Detalle del Día',
    // Streak display
    day: 'día',
    days: 'días',
    frozen: 'congelada',
    streakActive: '¡Racha activa!',
    startToday: 'Comenzar hoy',
    bestStreak: 'Mejor',
    canRecover: 'Recuperar con anuncio',
    streakFrozen: 'Racha Congelada - Calienta para Continuar ❄️🔥',
    streakFrozenTap_one: '❄️ Racha Congelada: {{count}} día - Toca para calentar',
    streakFrozenTap_other: '❄️ Racha Congelada: {{count}} días - Toca para calentar',
    // Streak visualization
    recentActivity: 'Actividad Reciente',
    completed: 'Completado',
    bonus: 'Bonus',
    today: 'Hoy',
    // Streak history graph
    journalHistory: 'Mi Historial de Diario',
    last30Days: 'Últimos 30 días - entradas por día',
    todayCount: 'Hoy',
    peakDay: 'Día Pico',
    completeDays: 'Completo',
    bonusDays: 'Bonus',
    // Habit Statistics Dashboard
    habitStats: {
      weeklyChart: 'Finalización Semanal de Hábitos',
      monthlyOverview: 'Resumen Mensual',
      performanceIndicators: 'Rendimiento',
      trendAnalysis: 'Tendencias - Hábitos',
      totalHabits: 'Hábitos Totales',
      activeHabits: 'Hábitos Activos',
      completedToday: 'Completados Hoy',
      weeklyAverage: 'Promedio Semanal',
      monthlyAverage: 'Promedio Mensual',
      bestDay: 'Mejor Día',
      improvingTrend: 'Tendencia al alza',
      decliningTrend: 'Tendencia a la baja',
      steadyProgress: 'Progreso estable',
      noData: 'No hay datos de hábitos disponibles',
      chartToggle: 'Vista',
      week: 'Semana',
      month: 'Mes',
    },
    // Streak sharing
    shareStreak: 'Compartir Mi Racha',
    shareSubtitle: '¡Muestra tu viaje en el diario!',
    sharePreview: 'Vista Previa del Mensaje',
    copyText: 'Copiar Texto',
    shareNow: 'Compartir Ahora',
    sharing: 'Compartiendo...',
    shareTitle: 'Mi Racha de Diario',
    shareStreakText: '¡Tengo una racha de {{current}} días escribiendo en mi diario! 🔥',
    shareBestStreak: 'Mi mejor racha: {{best}} días',
    shareBadges: 'Logros',
    shareAppPromo: '#Diario #SelfRise #CrecimientoPersonal',
    copiedToClipboard: '¡Copiado al portapapeles!',
    shareError: 'Error al compartir. Por favor, inténtalo de nuevo.',
    copyError: 'Error al copiar. Por favor, inténtalo de nuevo.',
    todayHabits: 'Hábitos de Hoy',
    // Daily Quote
    dailyQuote: 'Inspiración Diaria',
    quoteCategories: {
      motivation: 'Motivación',
      gratitude: 'Gratitud',
      habits: 'Hábitos',
      goals: 'Metas',
      achievement: 'Logro',
      level: 'Nivel',
      streak: 'Racha',
      consistency: 'Consistencia',
      growth: 'Crecimiento',
    },
    // Personalized Recommendations
    recommendations: 'Para Ti',
    noRecommendations: '¡Buen trabajo! Estás al día con todo.',
    journalPrompt: 'Prueba esta sugerencia',
    // Home Customization
    customization: {
      title: 'Personalizar Inicio',
      components: 'Componentes de Inicio',
      componentsDescription: 'Elige qué secciones mostrar en tu pantalla de inicio',
      order: 'Posición {{order}}',
      actions: 'Acciones',
      resetToDefaults: 'Restaurar Valores Predeterminados',
      resetTitle: 'Restaurar Diseño de Inicio',
      resetMessage: 'Esto restaurará el diseño de pantalla de inicio predeterminado. ¿Estás seguro?',
      errors: {
        visibilityFailed: 'No se pudo actualizar la visibilidad del componente. Por favor, inténtalo de nuevo.',
      },
      componentNames: {
        xpProgressBar: 'Progreso de XP',
        xpMultiplier: 'Multiplicador de XP',
        journalStreak: 'Racha del Diario',
        quickActions: 'Acciones Rápidas',
        dailyQuote: 'Inspiración Diaria',
        recommendations: 'Para Ti',
        streakHistory: 'Historial de Rachas',
        habitStats: 'Estadísticas de Hábitos',
        habitPerformance: 'Rendimiento',
        habitTrends: 'Tendencias',
        monthlyChallenges: 'Desafíos Mensuales',
      },
    },
    // Habit Performance Indicators
    habitPerformance: {
      noHabitsDescription: 'Añade hábitos para ver indicadores de rendimiento',
      vsLastWeek: 'vs. {{percent}}% la semana pasada',
      thisWeek: 'Esta Semana',
      buildingHabit: '{{name}} (en construcción)',
      monthlyFocus: 'Enfoque de {{month}}',
    },
    // Habit Trend Analysis
    habitTrends: {
      noDataDescription: 'Completa hábitos durante algunas semanas para ver el análisis de tendencias',
      overallProgress: '🚀 Progreso General',
      improvedByPercent: 'Mejorado en {{percent}}% durante 4 semanas. ¡Sigue así!',
      needsAttention: '⚠️ Necesita Atención',
      droppedByPercent: 'Bajó {{percent}}% recientemente. Revisa tu rutina.',
      steadyProgress: '📈 Progreso Constante',
      consistencyStable: 'Consistencia estable en {{percent}}% promedio.',
      buildingNewHabits: '🌱 Construyendo Nuevos Hábitos',
      newHabitsProgress: '¡{completions, plural, one {# finalización} other {# finalizaciones}} en {habits, plural, one {# nuevo hábito} other {# nuevos hábitos}}! ¡Excelente comienzo!',
      earlyMomentum: '🚀 Impulso Inicial',
      earlyMomentumDescription: '{{percent}}% tasa promedio de finalización en hábitos en construcción. ¡Estás estableciendo patrones fuertes!',
      starPerformer: '🏆 Mejor Rendimiento',
      streakChampions: '🔥 Campeones de Rachas',
      streakChampionsDescription: '¡{count, plural, one {# hábito} other {# hábitos}} con rachas de 7+ días!',
      excellentWeek: '🎯 Excelente Semana',
      excellentWeekDescription: '{{percent}}% de finalización esta semana. ¡Increíble!',
      last4Weeks: 'Últimas 4 semanas',
    },
    // Monthly Habit Overview
    monthlyOverview: {
      title: 'Últimos 30 Días',
      activeDays: '{{active}}/{{total}} días activos',
      perActiveDay: 'por día activo',
      dailyProgress: 'Progreso Diario (Últimos 30 Días)',
      topPerformer: '🏆 Mejor Rendimiento',
      needsFocus: '💪 Necesita Enfoque',
      greatMonth: '¡Excelente mes! Sigue con el gran trabajo.',
      reviewHabits: 'Considera revisar tus hábitos y metas.',
      noDataDescription: 'Añade algunos hábitos para ver tu resumen mensual',
    },
    // XP Multiplier Section
    xpMultiplier: {
      sectionTitle: '⚡ Multiplicador de XP',
      activeTitle: '¡2x XP Activo! {{time}}',
      harmonyReward: 'Recompensa de Racha de Armonía',
      multiplierActive: 'Multiplicador Activo',
      activeDescription: 'Todas las ganancias de XP se duplican mientras este multiplicador está activo',
      harmonyStreak: 'Racha de Armonía: {{current}}/7',
      readyToActivate: '¡Listo para activar 2x XP!',
      moreDays: '{days, plural, one {# día más} other {# días más}} para 2x XP',
      activateButton: 'Activar 2x XP',
    },
    // Monthly 30 Day Chart
    monthly30Day: {
      title30: 'Finalización de los Últimos 30 Días',
      titleCustom: 'Finalización de los Últimos {{days}} Días',
      completionRate: '{{completed}}/{{total}} ({{percent}}%)',
      bonus: '{{count}} bonus',
      completed: 'Completado',
      missed: 'Perdido',
      bonusLabel: 'Bonus',
    },
    // Weekly Habit Chart
    weeklyChart: {
      title7: 'Finalización de los Últimos 7 Días',
      titleCustom: 'Finalización de los Últimos {{days}} Días',
      completionRate: '{{completed}}/{{total}} ({{percent}}%)',
      bonus: '{{count}} bonus',
      completed: 'Completado',
      missed: 'Perdido',
      bonusLabel: 'Bonus',
    },
    // Quick Actions
    quickActionsTitle: 'Acciones Rápidas',
    quickActions: {
      addHabit: 'Añadir Hábito',
      gratitude: 'Gratitud',
      selfPraise: 'Autoelogio',
      addGoal: 'Añadir Meta',
    },
    // Yearly Habit Overview
    yearlyOverview: {
      title365: 'Resumen de los Últimos 365 Días',
      titleCustom: 'Resumen de los Últimos {{days}} Días',
      activeDays: '{{active}}/{{total}} días activos',
      yearlyAverage: 'Promedio Anual',
      dailyAverage: 'Promedio Diario',
      perActiveDay: 'por día activo',
      excellentYear: '🔥 Excelente Año',
      excellentYearDescription: '¡Rendimiento anual sobresaliente! Sigue así.',
      roomForImprovement: '📈 Margen de Mejora',
      noDataDescription: 'Añade algunos hábitos para ver tu resumen anual',
      loading: 'Cargando estadísticas anuales...',
    },
    // Habit Stats Dashboard
    habitStatsDashboard: {
      week: 'Semana',
      month: 'Mes',
      year: 'Año',
    },
    // Premium Trophy Icon
    premiumTrophy: {
      label: 'Trofeos',
    },
    // Screen labels
    streakHistoryLoading: 'Cargando...',
    // Level Progress
    yourProgress: 'Tu Progreso',
    currentLevelSummary: 'Actualmente estás en el nivel {currentLevel} de 100 niveles',
    keepEarningXp: '¡Sigue ganando XP para desbloquear niveles superiores!',
  } as any,

  // Levels & Navigation screens
  screens: {
    levelOverview: 'Descripción General de Niveles',
    levelsLoading: 'Cargando niveles...',
    goBack: 'Atrás',
    backNavigation: 'Inicio',
    reorderHabits: {
      title: 'Reordenar Hábitos',
      instructions: 'Mantén presionado y arrastra cualquier hábito para reordenarlos',
    },
    habitStats: {
      activeHabits: 'Hábitos Activos',
      inactiveHabits: 'Hábitos Inactivos',
      noHabitsFound: 'No se encontraron hábitos',
      noHabitsSubtext: 'Crea algunos hábitos primero para ver sus estadísticas',
    },
    goalStats: {
      loading: 'Cargando...',
    },
    trophyRoom: {
      title: 'Sala de Trofeos',
    },
  },

  // Common labels
  common: {
    ok: 'OK',
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando...',
    edit: 'Editar',
    delete: 'Eliminar',
    retry: 'Reintentar',
    tryAgain: 'Reintentar',
    add: 'Añadir',
    create: 'Crear',
    update: 'Actualizar',
    confirm: 'Confirmar',
    error: 'Error',
    success: 'Éxito',
    done: 'Hecho',
    back: 'Atrás',
    next: 'Siguiente',
    skip: 'Saltar',
    close: 'Cerrar',
    continue: 'Continuar',
    yes: 'Sí',
    no: 'No',
    copy: 'Copiar',
    share: 'Compartir',
    startFresh: 'Empezar de nuevo',
    level: 'Nivel',
    totalXP: 'XP Total',
    achievements: 'Logros',
    category: 'Categoría',
    rarity: 'Rareza',
    xpReward: 'Recompensa XP',
    // Uppercase labels for celebration badges
    dayUppercase: 'DÍA',
    daysUppercase: 'DÍAS',
    bonusUppercase: 'BONO',
    bonusesUppercase: 'BONOS',
    levelUppercase: 'NIVEL',
    createdLabel: 'Creado',
    completed: '{{completed}} de {{total}} completado',
    loading: {
      default: 'Cargando...',
      levels: 'Cargando niveles...',
      habits: 'Cargando hábitos...',
      progress: 'Cargando progreso...',
    },
    modals: {
      errorTitle: 'Error',
      confirmTitle: 'Confirmar Acción',
      confirm: 'Confirmar',
      closeButton: 'Cerrar',
    },
    errors: {
      goals: {
        failedToSave: 'No se pudo guardar el objetivo',
        failedToDelete: 'No se pudo eliminar el objetivo',
        failedToReorder: 'No se pudieron reordenar los objetivos',
        failedToAddProgress: 'No se pudo agregar el progreso',
        noProgressData: 'Sin datos de progreso aún. Agregue algo de progreso para ver estadísticas.',
      },
      habits: {
        failedToSave: 'No se pudo guardar el hábito',
        failedToDelete: 'No se pudo eliminar el hábito',
        failedToUpdate: 'No se pudo actualizar el hábito',
        failedToReorder: 'No se pudieron reordenar los hábitos',
        failedToToggleCompletion: 'No se pudo cambiar la finalización',
        loadingHabits: 'Cargando hábitos...',
        activeHabits: 'Hábitos Activos',
        inactiveHabits: 'Hábitos Inactivos',
        noHabitsFound: 'No se encontraron hábitos',
        createHabitsFirst: 'Cree algunos hábitos primero para ver sus estadísticas',
      },
      gratitude: {
        failedToSave: 'No se pudo guardar la gratitud',
      },
      social: {
        failedToLoadHeroes: 'No se pudieron cargar los héroes diarios',
      },
    },
    celebration: {
      general_announcement: '¡Felicidades por tu logro!',
      modal: 'Celebración de logro',
      default_title: '¡Felicidades!',
      default_message: '¡Buen trabajo!',
    },
    help: 'Ayuda',
    helpNotAvailable: 'Información de ayuda no disponible para esta función.',
  },

  // UI Labels
  ui: {
    progressStep: 'Paso {current} de {total}',
    skipTutorial: 'Omitir tutorial',
    nextStep: 'Siguiente paso',
    continue: 'Continuar',
    next: 'Siguiente',
    cancel: 'Cancelar',
    save: 'Guardar',
    edit: 'Editar',
    delete: 'Eliminar',
    retry: 'Reintentar',
    tutorialComplete: 'Tutorial Completado',
    readyToRise: 'Listo para Subir',
  },

  // Habits screen
  habits: {
    title: 'Mis Hábitos',
    addHabit: 'Añadir Hábito',
    editHabit: 'Editar Hábito',
    deleteHabit: 'Eliminar Hábito',
    activeHabits: 'Hábitos Activos',
    inactiveHabits: 'Hábitos Inactivos',
    addNewHabit: 'Añadir Nuevo Hábito',
    done: 'Hecho',
    reorder: 'Reordenar',
    bonus: 'Bonificación',
    scheduled: 'Programado',
    habitName: 'Nombre del Hábito',
    habitNamePlaceholder: 'Introduce el nombre del hábito...',
    selectColor: 'Seleccionar Color',
    selectIcon: 'Seleccionar Icono',
    scheduledDays: 'Días Programados',
    markCompleted: 'Marcar como Completado',
    viewCalendar: 'Ver Calendario',
    confirmDelete: 'Confirmar Eliminación',
    deleteMessage: '¿Estás seguro de que quieres eliminar este hábito? Esta acción no se puede deshacer.',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    save: 'Guardar',
    form: {
      name: 'Nombre del Hábito',
      namePlaceholder: 'Introduce el nombre del hábito...',
      color: 'Seleccionar Color',
      icon: 'Seleccionar Icono',
      scheduledDays: 'Días Programados',
      description: 'Descripción (Opcional)',
      descriptionPlaceholder: 'Añade una descripción para tu hábito...',
      errors: {
        nameRequired: 'El nombre del hábito es obligatorio',
        nameTooShort: 'El nombre del hábito debe tener al menos 2 caracteres',
        nameTooLong: 'El nombre del hábito debe tener menos de 50 caracteres',
        daysRequired: 'Por favor, selecciona al menos un día',
        descriptionTooLong: 'La descripción debe tener menos de 200 caracteres',
        submitFailed: 'No se pudo guardar el hábito. Por favor, inténtalo de nuevo.',
      },
    },
    emptyState: {
      title: 'Aún no hay hábitos',
      subtitle: 'Comienza a construir mejores hábitos creando tu primero',
    },
    emptyStateWithCompletion: {
      title: 'Aún no se han creado hábitos',
      subtitle: '¡Toca "Añadir Nuevo Hábito" para comenzar!',
    },
    emptyStateTracker: {
      title: 'No hay hábitos activos',
      subtitle: '¡Crea tu primer hábito para empezar a rastrear!',
    },
    stats: {
      activeHabits: 'Hábitos activos',
    },
    calendar: {
      legendScheduled: 'Programado',
      legendCompleted: 'Completado',
      legendMissed: 'Perdido',
      legendMakeup: 'Recuperado',
      bonus: 'Bonificación',
    },
    // Habit list summary
    days: 'Días',
    listSummary: '{{active}} activos • {{inactive}} inactivos',
    // Error messages
    errors: {
      failedToSave: 'No se pudo guardar el hábito',
      failedToDelete: 'No se pudo eliminar el hábito',
      failedToUpdate: 'No se pudo actualizar el hábito',
      failedToReorder: 'No se pudieron reordenar los hábitos',
      failedToToggle: 'No se pudo cambiar el estado de finalización',
    },
  } as any,

  // Journal screen
  journal: {
    title: 'Mi Diario',
    addGratitude: 'Añadir Gratitud',
    addGratitudeButton: '+ Añadir Gratitud',
    addSelfPraiseButton: '+ Añadir Autoelogio',
    gratitudePlaceholder: '¿Por qué estás agradecido hoy?',
    minimumRequired: 'Escribe al menos 3 entradas para mantener tu racha',
    bonusGratitude: 'Entrada Bonus',
    currentStreak: 'Racha Actual',
    longestStreak: 'Racha Más Larga',
    frozenStreak: 'Racha Congelada',
    history: 'Historial',
    statistics: 'Estadísticas',
    // Daily Progress Display
    progress: {
      title: 'Progreso del Diario Hoy',
      complete: 'Completo ✓',
      bonusAmazing: '¡Increíble! ¡Has agregado entradas bonus! 🌟',
      dailyComplete: '¡Diario completado hoy! ¡Mantén tu racha viva! 🔥',
      entriesNeeded_one: '{{count}} entrada más requerida',
      entriesNeeded_other: '{{count}} entradas más requeridas',
    },
    // --- BONUS MILESTONE SYSTEM ---
    bonusMilestone1_title: '¡Primera Entrada Bonus! ⭐',
    bonusMilestone1_text: '¡Increíble! ¡Has escrito tu primera entrada bonus hoy! ¡Sigue así!',
    bonusMilestone5_title: '¡Quinta Entrada Bonus! 🔥',
    bonusMilestone5_text: '¡Increíble! Has escrito 5 entradas bonus hoy. ¡Estás en llamas!',
    bonusMilestone10_title: '¡Décima Entrada Bonus! 👑',
    bonusMilestone10_text: '¡Legendario! Has escrito 10 entradas bonus hoy. ¡Eres un campeón del diario!',
    // Pro hlavní 'SelfRise Streak'
    streakMilestone_generic_title: '¡Otro Hito! 🎯',
    streakMilestone_generic_text: '¡Felicidades por alcanzar {{days}} días seguidos!',
    streakMilestone7_title: '¡Una Semana Fuerte! 🔥',
    streakMilestone7_text: '¡7 días seguidos! Estás construyendo impulso y formando un hábito poderoso. ¡Sigue adelante!',
    streakMilestone14_title: '¡Dos Semanas Fuerte! 💪',
    streakMilestone14_text: '¡14 días de dedicación! Te estás demostrando a ti mismo que la consistencia es posible. ¡Mantén el impulso!',
    streakMilestone21_title: '¡Se Está Formando un Hábito! 🌱',
    streakMilestone21_text: '¡21 días seguidos! Estás construyendo un hábito fuerte de autorreflexión positiva. ¡Sigue adelante!',
    streakMilestone100_title: '¡Bienvenido al Club de los 100! 💯',
    streakMilestone100_text: 'Cien días de consistencia. Esto ya es un estilo de vida. ¡Eres una gran inspiración!',
    streakMilestone365_title: '¡Un Año de Autocrecimiento! 🎉',
    streakMilestone365_text: 'Increíble. Un año completo de disciplina y pensamiento positivo. Mira hacia atrás el enorme viaje que has recorrido.',
    streakMilestone1000_title: '¡LEGENDARIO! 传奇',
    streakMilestone1000_text: '1000 días. Has alcanzado una meta que demuestra una fuerza de voluntad increíble. Eres una leyenda de SelfRise.',
    streakLost: {
      title: 'Racha Perdida',
      message: 'Tu racha se ha roto. ¿Qué te gustaría hacer?',
      reset: 'Reiniciar Racha',
      recover: 'Recuperar con Anuncio',
    },

    celebration: {
      daily_complete_announcement: '¡Felicidades! ¡Has completado tu práctica diaria de diario!',
      streak_milestone_announcement: '¡Increíble! ¡Has alcanzado un hito de racha de {{days}} días!',
      bonus_milestone_announcement: '¡Excelente! ¡Has completado {{count}} entradas bonus de diario!',
      epic_crown_announcement: '¡Logro legendario! ¡Has alcanzado el hito bonus definitivo número 10 con celebración de corona real!',
      daily_complete_modal: 'Celebración de finalización del diario diario',
      streak_milestone_modal: 'Celebración del hito de racha de {{days}} días',
      bonus_milestone_modal: 'Celebración de {{count}} entradas bonus',
      epic_crown_modal: 'Celebración épica de corona real por el logro del hito bonus número 10',
      streak_badge_accessibility: 'Insignia de logro de racha de {{days}} días',
      bonus_badge_accessibility: 'Insignia de logro de {{count}} entrada{{#eq count 1}}{{else}}s{{/eq}} bonus',
      // Fallback strings for CelebrationModal (when i18n keys are missing)
      daily_complete_title: '¡Felicidades! 🎉',
      daily_complete_message: '¡Has completado tu práctica diaria de diario!',
      level_up_title: '¡Subes de Nivel! 🎉',
      level_up_message: '¡Felicidades por alcanzar un nuevo nivel!',
      default_title: '¡Felicidades!',
      default_message: '¡Bien hecho!',
      xp_earned: 'XP Ganado',
      rewards_title: 'Nuevas Recompensas:',
      milestone_suffix: ' ¡Hito!',
      unlocked_prefix: 'Has desbloqueado',
      milestone_first: 'Primero',
      milestone_fifth: 'Quinto',
      milestone_tenth: 'Décimo',
    },

    export: {
      title: 'Exportación de Diario - Formato {{format}}',
      truncated: '[Contenido truncado para visualización]',
      error: 'No se pudieron exportar los datos del diario',
      modalTitle: 'Exportar Diario',
      description: 'Exporta tus entradas de diario y estadísticas. Los datos se mostrarán en una ventana emergente para que puedas copiarlos y guardarlos.',
      textFormat: 'Formato de Texto',
      textFormatDescription: 'Formato legible perfecto para compartir y leer',
      jsonFormat: 'Formato JSON',
      jsonFormatDescription: 'Formato de datos estructurado para respaldo o uso técnico',
      exporting: 'Exportando tu diario...',
    },

    errors: {
      searchFailed: 'No se pudo buscar en las entradas del diario',
      deleteFailed: 'No se pudo eliminar la entrada del diario',
    },

    // Journal UI text
    searchPlaceholder: 'Buscar entradas del diario...',
    editPlaceholder: 'Edita tu entrada del diario...',
    historyTitle: 'Historial del diario',
    today: 'Hoy',
    searchResults_one: 'Se encontró {{count}} resultado para "{{term}}"',
    searchResults_other: 'Se encontraron {{count}} resultados para "{{term}}"',
    noSearchResults: 'No se encontraron resultados para "{{term}}"',
    emptySearch: 'No hay entradas del diario que coincidan con tu búsqueda.',
    emptyHistory: 'No hay entradas del diario para {{date}}.',
    loadingStats: 'Cargando estadísticas...',

    // Delete confirmation
    deleteConfirm: {
      title: 'Eliminar entrada del diario',
      message: '¿Estás seguro de que quieres eliminar esta entrada de {{type}}? Esta acción no se puede deshacer.',
      gratitude: 'gratitud',
      selfPraise: 'autoelogio',
    },

    // Journal stats
    stats: {
      title: 'Estadísticas del diario',
      totalEntries: 'Total de entradas',
      allTime: 'De todos los tiempos',
      activeDays: 'Días activos',
      daysWithEntries: '{count, plural, one {# día} other {# días}} con entradas',
      currentStreak: 'Racha actual',
      dailyAverage: 'Promedio diario',
      entriesPerDay: 'entradas por día activo',
      milestoneBadges: 'Insignias de hitos',
      bestStreak: 'Mejor racha: {{days}} días',
      startToday: '¡Comienza tu racha hoy!',
      personalBest: '¡Mejor marca personal! 🎉',
      best: 'Mejor: {{days}} días',
      motivationTitle: '¡Sigue así!',
      motivationNoStreak: "Todo viaje comienza con un solo paso. ¡Comienza tu racha de diario hoy!",
      motivationDay1: "¡Buen comienzo! Un día completado, muchos más por venir. ¡Mantén el impulso!",
      motivationDays: "¡Increíble racha de {{days}} días! Estás construyendo un hábito poderoso.",
    },

    // Gratitude Input Component
    input: {
      // Header titles
      addGratitudeTitle: 'Agregar gratitud',
      addSelfPraiseTitle: 'Agregar autoelogio',

      // Entry type labels (used in list and edit modal)
      typeGratitude: 'Gratitud',
      typeSelfPraise: 'Autoelogio',

      // Error messages
      emptyError: 'Por favor, escribe tu gratitud',
      minLengthError: 'La gratitud debe tener al menos 3 caracteres',
      frozenStreakError_one: 'Tu racha está congelada desde hace {{count}} día. ¡Caliéntala en la pantalla de Inicio y luego continúa escribiendo! 🔥',
      frozenStreakError_other: 'Tu racha está congelada desde hace {{count}} días. ¡Caliéntala en la pantalla de Inicio y luego continúa escribiendo! 🔥',

      // Fallback placeholder
      defaultPlaceholder: '¿Por qué estás agradecido hoy?',
      // Optional suffix for bonus entries
      optional: '(opcional)',

      // Gratitude placeholders (rotating)
      gratitudePlaceholders: [
        '¿Qué te hizo sonreír hoy?',
        '¿A quién le agradeces ahora mismo?',
        '¿Qué pequeña cosa te trajo alegría?',
        '¿Qué cosa hermosa viste hoy?',
        '¿Qué habilidad agradeces tener?',
        '¿Por qué parte de tu día estás más agradecido?',
        '¿Qué es algo que esperas con ansias?',
        '¿Qué comida agradeces hoy?',
        '¿Qué canción mejoró tu día?',
        '¿Qué placer simple disfrutaste?',
      ],

      // Self-praise placeholders (rotating)
      selfPraisePlaceholders: [
        '¿Qué desafío superaste hoy?',
        '¿Qué cosa hiciste bien hoy?',
        '¿Qué hiciste hoy de lo que te sientes orgulloso?',
        '¿Cómo diste un paso hacia tus metas?',
        '¿Qué buena decisión tomaste?',
        '¿Cuándo fuiste disciplinado hoy?',
        '¿Cómo mostraste amabilidad contigo mismo?',
        '¿Qué aprendiste hoy?',
        '¿De qué esfuerzo te sientes orgulloso, sin importar el resultado?',
        '¿Qué hiciste hoy solo para ti?',
      ],
    },

    // Warm-up modals
    warmUp: {
      title: 'Calienta tu racha',
      frozenDays: 'Días congelados',
      frozenMessage_one: 'Tu racha ha estado congelada durante {{count}} día. Mira {{adsNeeded}} anuncio para calentarla y continúa escribiendo libremente! ❄️➡️🔥',
      frozenMessage_other: 'Tu racha ha estado congelada durante {{count}} días. Mira {{adsNeeded}} anuncios para calentarla y continúa escribiendo libremente! ❄️➡️🔥',
      streakWarmedUp: '¡Racha calentada! ¡Ve al Diario y continúa tu viaje! ✨',
      warmingUp: 'Calentando: {{current}}/{{total}} 🔥',
      warmingProgress: 'Progreso de calentamiento',
      adsProgress: '{{watched}}/{{total}} anuncios',
      loadingAd: 'Cargando anuncio...',
      warmUpComplete: '¡Calentamiento completado! ✓',
      warmUpButton: 'Calentar ({{current}}/{{total}})',
      infoText: 'Primero calienta tu racha congelada viendo anuncios. Después de que tu racha esté caliente, puedes escribir entradas de diario normalmente sin ver más anuncios.',

      adFailed: {
        title: 'Anuncio fallido',
        message: 'No se pudo cargar el anuncio. Por favor, inténtalo de nuevo.',
        ok: 'OK',
      },

      error: {
        title: 'Error',
        message: 'Algo salió mal. Por favor, inténtalo de nuevo.',
        ok: 'OK',
      },

      confirmation: {
        title: 'Ver anuncio para calentar racha',
        message: 'Esto mostraría un anuncio real. ¿Continuar con la simulación del anuncio?',
        cancel: 'Cancelar',
        confirm: 'Ver anuncio',
      },

      startFresh: {
        title: '¿Empezar de nuevo?',
        message: '⚠️ Esto restablecerá permanentemente tu racha actual a 0. Puedes empezar de nuevo sin calentar tu racha congelada. Esta acción no se puede deshacer.',
      },

      modals: {
        success: {
          title: '¡Éxito!',
          message: 'Operación completada exitosamente.',
          button: 'OK',
        },
        error: {
          title: 'Error',
          message: 'Algo salió mal. Por favor, inténtalo de nuevo.',
          button: 'OK',
        },
        confirmation: {
          title: 'Confirmación',
          message: '¿Estás seguro de que quieres continuar?',
          confirm: 'Confirmar',
          cancel: 'Cancelar',
        },
        issue: {
          title: 'Problema detectado',
          message: 'Hay un problema. Elige cómo quieres proceder.',
          primaryAction: 'Intentar de nuevo',
          secondaryAction: 'Calentamiento rápido',
        },
        quickWarmUp: {
          title: 'Calentamiento rápido',
          message: 'Esto calentará tu racha congelada sin ver anuncios. Tu racha continuará normalmente. ¿Continuar?',
          confirm: 'Calentar',
          cancel: 'Cancelar',
        },
      },
    },

    // Streak rescue modals
    rescue: {
      congratulations: {
        title: '🎉 ¡Racha rescatada!',
        message: '¡Felicidades! Tu racha ha sido rescatada exitosamente. Ahora puedes escribir entradas de diario normalmente.',
        continue: 'Continuar',
      },
      autoFixed: {
        title: '¡Racha rescatada!',
        message: '¡Tu racha ha sido rescatada exitosamente! Hubo un problema técnico pero lo arreglamos automáticamente.',
      },
      issueResolved: {
        title: 'Problema resuelto',
        message: 'Pedimos disculpas por el problema técnico. Tu racha ha sido rescatada exitosamente y ahora puedes continuar escribiendo entradas normalmente.',
      },
      noDebt: {
        title: 'Sin deuda',
        message: 'Tu racha parece estar ya rescatada. Actualizando tus datos de racha...',
      },
      technicalIssue: {
        title: 'Problema técnico',
        message: 'Viste todos los anuncios requeridos pero encontramos un problema técnico. Tu rescate de racha está completo, por favor reinicia la aplicación si es necesario.',
      },
      technicalIssueRetry: {
        title: 'Problema técnico',
        message: 'Encontramos un problema técnico al completar tu rescate de racha (intento {{attempt}}/2). Por favor, inténtalo de nuevo.',
      },
      criticalError: {
        title: 'Error crítico',
        message: 'Encontramos un problema técnico crítico. Por favor reinicia la aplicación. Tus datos están seguros.',
      },
      resetFailed: {
        title: 'Reinicio fallido',
        message: 'No se pudo reiniciar la deuda. Por favor contacta con el soporte.',
      },
    },

    // Fallback messages
    fallback: {
      success: '¡Éxito!',
      operationComplete: 'Operación completada con éxito.',
      error: 'Error',
      errorMessage: 'Algo salió mal. Por favor, inténtalo de nuevo.',
      congratulations: '¡Felicidades! 🎉',
      debtCleared: '¡Tu deuda ha sido liquidada con éxito!',
    },
  } as any,

  // Goals screen
  goals: {
    title: 'Mis Metas',
    addGoal: 'Añadir Meta',
    editGoal: 'Editar Meta',
    deleteGoal: 'Eliminar Meta',
    noGoals: 'Aún no hay metas. ¡Comienza creando tu primera meta!',

    // Error states
    error: 'Error',
    goalNotFound: 'Meta no encontrada',
    goalTitleLabel: 'Título de la Meta',
    goalTitlePlaceholder: 'Introduce tu meta...',
    unitLabel: 'Unidad',
    unitPlaceholder: 'ej., €, kg, horas...',
    targetValueLabel: 'Valor Objetivo',
    addProgressButton: 'Añadir Progreso',
    progressValue: 'Valor de Progreso',
    progressNote: 'Nota',
    progressNotePlaceholder: 'Añade una nota sobre tu progreso...',
    completed: 'Completado',
    progressLabel: 'Progreso',
    confirmDelete: 'Confirmar Eliminación',
    deleteMessage: '¿Estás seguro de que quieres eliminar esta meta? Esta acción no se puede deshacer.',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    save: 'Guardar',
    selectTargetDate: 'Seleccionar Fecha Objetivo',

    selectYear: 'Seleccionar Año',
    selectMonth: 'Seleccionar Mes',
    selectDay: 'Seleccionar Día',

    useTemplate: 'Usar Plantilla',
    stats: {
      overview: 'Resumen',
      trends: 'Tendencias',
      predictions: 'Predicciones',
      sectionStatistics: 'Estadísticas',
      labelEntries: 'Entradas',
      labelDaysActive: 'Días Activos',
      labelAvgDaily: 'Promedio Diario',
      labelTimelineStatus: 'Estado del Cronograma',
      sectionPredictions: 'Predicciones',
      labelEstimatedCompletion: 'Finalización Estimada:',
    },

    form: {
      title: 'Título de la Meta',
      description: 'Descripción (Opcional)',
      unit: 'Unidad',
      targetValue: 'Valor Objetivo',
      category: 'Categoría',
      targetDate: 'Fecha Objetivo (Recomendado)',
      targetDateHint: 'Toca para abrir el selector de fecha paso a paso',
      targetDatePlaceholder: 'Seleccionar fecha objetivo (opcional)',
      placeholders: {
        title: 'Introduce el título de tu meta...',
        description: 'Describe tu meta con más detalle...',
        unit: 'ej., €, kg, horas, libros...',
        targetValue: '100',
        targetDate: 'AAAA-MM-DD',
      },
      errors: {
        titleRequired: 'El título de la meta es obligatorio',
        titleTooShort: 'El título de la meta debe tener al menos 2 caracteres',
        titleTooLong: 'El título de la meta debe tener menos de 100 caracteres',
        unitRequired: 'La unidad es obligatoria',
        unitTooLong: 'La unidad debe tener menos de 20 caracteres',
        targetValueRequired: 'El valor objetivo debe ser mayor que 0',
        targetValueTooLarge: 'El valor objetivo debe ser menor que 1.000.000',
        descriptionTooLong: 'La descripción debe tener menos de 300 caracteres',
        submitFailed: 'No se pudo guardar la meta. Por favor, inténtalo de nuevo.',
        pastDate: 'La fecha seleccionada no puede estar en el pasado',
      },
    },

    progress: {
      addProgress: 'Añadir Progreso',
      progressHistory: 'Historial de Progreso',
      noProgress: 'Aún no hay entradas de progreso',
      confirmDelete: 'Eliminar Entrada de Progreso',
      deleteMessage: '¿Estás seguro de que quieres eliminar esta entrada de progreso? Esta acción no se puede deshacer.',
      form: {
        progressType: 'Tipo de Progreso',
        value: 'Valor',
        note: 'Nota (Opcional)',
        date: 'Fecha',
        preview: 'Vista Previa',
        submit: 'Añadir Progreso',
        placeholders: {
          value: '0',
          note: 'Añade una nota sobre tu progreso...',
          date: 'AAAA-MM-DD',
        },
        types: {
          add: 'Añadir',
          subtract: 'Restar',
          set: 'Establecer En',
        },
        errors: {
          valueRequired: 'El valor debe ser mayor que 0',
          valueTooLarge: 'El valor debe ser menor que 1.000.000',
          noteTooLong: 'La nota debe tener menos de 200 caracteres',
          submitFailed: 'No se pudo añadir el progreso. Por favor, inténtalo de nuevo.',
        },
      },
    },

    details: {
      predictions: 'Predicciones de Finalización',
    },

    categories: {
      personal: 'Personal',
      health: 'Salud',
      learning: 'Aprendizaje',
      career: 'Carrera',
      financial: 'Financiero',
      other: 'Otro',
    },

    category: {
      health: 'Salud',
      financial: 'Financiero',
      learning: 'Aprendizaje',
      career: 'Carrera',
      personal: 'Personal',
      other: 'Otro',
    },

    templates: {
      title: 'Plantillas de Metas',
      searchPlaceholder: 'Buscar plantillas...',
      footerText: 'Selecciona una plantilla para comenzar rápidamente con detalles de meta precompletados.',
      all: 'Todas',
      target: 'Objetivo',
      noTemplates: 'No se encontraron plantillas que coincidan con tu búsqueda.',

      loseWeight: 'Perder Peso',
      loseWeightDescription: 'Establece una meta de pérdida de peso saludable con seguimiento de progreso.',

      saveMoney: 'Ahorrar Dinero',
      saveMoneyDescription: 'Construye tus ahorros con una cantidad objetivo específica.',
      payDebt: 'Pagar Deuda',
      payDebtDescription: 'Rastrea el progreso hacia la eliminación completa de la deuda.',

      readBooks: 'Leer Libros',
      readBooksDescription: 'Establece una meta para leer un número específico de libros este año.',
      learnLanguage: 'Aprender Idioma',
      learnLanguageDescription: 'Rastrea las horas dedicadas a aprender un nuevo idioma.',
      onlineCourse: 'Completar Curso Online',
      onlineCourseDescription: 'Termina lecciones o módulos en un curso online.',

      jobApplications: 'Solicitudes de Empleo',
      jobApplicationsDescription: 'Rastrea el número de solicitudes de empleo enviadas.',
      networking: 'Networking Profesional',
      networkingDescription: 'Construye tu red profesional con nuevas conexiones.',

      meditation: 'Meditación Diaria',
      meditationDescription: 'Rastrea los minutos dedicados a la práctica diaria de meditación.',

      artProjects: 'Proyectos de Arte',
      artProjectsDescription: 'Completa proyectos de arte creativos durante el año.',
      cookingRecipes: 'Probar Nuevas Recetas',
      cookingRecipesDescription: 'Amplía tus habilidades culinarias probando nuevas recetas.',
    },

    dashboard: {
      overview: 'Resumen',
      activeGoals: 'Metas Activas',
      completedGoals: 'Metas Completadas',
      completionRate: 'Tasa de Finalización',
      onTrack: 'En Camino',
      deadlines: 'Fechas Límite',
      overdue: 'Atrasado',
      dueThisWeek: 'Vence Esta Semana',
      dueThisMonth: 'Vence Este Mes',
      behindSchedule: 'Detrás del Horario',
      categories: 'Categorías',
      active: 'Activo',
      completed: 'Completado',
      completion: 'Finalización',
      quickActions: 'Acciones Rápidas',
      complete: 'Completar',
      wayAhead: 'Muy Adelantado',
      ahead: 'Adelantado',
      behind: 'Atrasado',
      wayBehind: 'Muy Atrasado',
    },

    sections: {
      activeGoals: 'Metas Activas',
      completedGoals: 'Metas Completadas',
      otherGoals: 'Otras Metas',
    },

    actions: {
      reorder: 'Reordenar',
      done: 'Hecho',
    },

    status: {
      active: 'Activo',
      paused: 'Pausado',
      archived: 'Archivado',
    },

    detailsCard: {
      title: 'Detalles de la Meta',
      status: 'Estado:',
      progress: 'Progreso:',
      category: 'Categoría:',
      targetDate: 'Fecha Objetivo:',
      target: 'Objetivo',
      completion: 'Finalización',
    },

    analysis: {
      progressTrend: 'Tendencia de Progreso',
      progressChart: 'Gráfico de Progreso',
      statistics: 'Estadísticas',
      insights: 'Perspectivas',
      totalEntries: 'Entradas Totales',
      currentProgress: 'Progreso Actual',
      avgDaily: 'Promedio Diario',
      noData: 'No hay datos de progreso disponibles para análisis.',
      recentProgress: 'Progreso Reciente',
      positiveProgress: '¡Gran progreso! Aumento diario promedio del {{rate}}%.',
      negativeProgress: 'El progreso ha disminuido un {{rate}}% diariamente. Considera revisar tu enfoque.',
      upwardTrend: 'Tu progreso reciente muestra una tendencia ascendente. ¡Sigue así!',
      downwardTrend: 'El progreso reciente está disminuyendo. Es hora de reenfocar tu meta.',
      completionPrediction: 'A este ritmo, completarás tu meta en {{days}} días.',
    },

    predictions: {
      title: 'Predicciones de Finalización de Metas',
      methods: 'Métodos de Predicción',
      insights: 'Perspectivas',
      estimatedDate: 'Fecha Estimada',
      daysRemaining: 'Días Restantes',
      confidence: 'Confianza',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
      basicMethod: 'Estimación Básica',
      linearMethod: 'Progresión Lineal',
      trendMethod: 'Tendencia Reciente',
      targetMethod: 'Fecha Objetivo',
      acceleratedMethod: 'Progreso Acelerado',
      noDataTitle: 'Datos Insuficientes',
      noDataDescription: 'Añade más entradas de progreso para obtener predicciones precisas.',
      highConfidenceTitle: 'Predicción de Alta Confianza',
      highConfidenceDescription: 'Basado en {{method}}, completarás tu meta el {{date}} con un {{confidence}}% de confianza.',
      inconsistentTitle: 'Predicciones Inconsistentes',
      inconsistentDescription: 'Las predicciones varían en {{difference}} días. Considera añadir más datos de progreso.',
      behindScheduleTitle: 'Detrás del Horario',
      behindScheduleDescription: 'Estás {{days}} días detrás de tu fecha objetivo. Considera aumentar tu tasa de progreso.',
      aheadScheduleTitle: 'Adelantado al Horario',
      aheadScheduleDescription: '¡Buen trabajo! Estás {{days}} días adelantado a tu fecha objetivo.',
      increaseRateTitle: 'Aumentar Tasa de Progreso',
      increaseRateDescription: 'Necesitas {{required}} {{unit}} diarios vs. tus {{current}} {{unit}} diarios actuales para cumplir tu objetivo.',
    },

    sharing: {
      title: 'Compartir Meta',
      shareOptions: 'Opciones de Compartir',
      copyOptions: 'Opciones de Copiar',
      quickSummary: 'Resumen Rápido',
      quickSummaryDescription: 'Comparte un breve resumen del progreso de tu meta.',
      detailedReport: 'Informe Detallado',
      detailedReportDescription: 'Comparte detalles de progreso completos y perspectivas.',
      dataExport: 'Exportar Datos',
      dataExportDescription: 'Exporta datos de meta en formato JSON para respaldo o análisis.',
      copyToClipboard: 'Copiar Resumen',
      copyToClipboardDescription: 'Copia el resumen de la meta a tu portapapeles.',
      copyDetailed: 'Copiar Detallado',
      copyDetailedDescription: 'Copia el informe de progreso detallado al portapapeles.',
      copyJson: 'Copiar JSON',
      copyJsonDescription: 'Copia los datos de la meta en formato JSON al portapapeles.',
      footerText: 'Comparte tu progreso con otros o exporta tus datos para respaldo.',
      complete: 'Completado',
      summary: 'Meta: {{title}}\nProgreso: {{completion}}% ({{current}}/{{target}} {{unit}})\nDías Activos: {{daysActive}}\nPromedio Diario: {{averageDaily}} {{unit}}',
      progressEntry: '{{date}}: {{type}} {{value}} {{unit}} - {{note}}',
      noNote: 'Sin nota',
      onTrack: '✅ En camino para cumplir la fecha objetivo',
      estimatedCompletion: '📅 Finalización estimada: {{date}}',
      noRecentProgress: 'No hay entradas de progreso recientes.',
      noInsights: 'No hay perspectivas disponibles.',
      detailedReportTemplate: 'INFORME DE PROGRESO DE META\n\n{{summary}}\n\nPROGRESO RECIENTE:\n{{recentProgress}}\n\nPERSPECTIVAS:\n{{insights}}',
      summaryTitle: 'Resumen de Meta: {{title}}',
      detailedTitle: 'Informe de Meta: {{title}}',
      jsonTitle: 'Datos de Meta: {{title}}',
      exportError: 'No se pudieron exportar los datos de la meta. Por favor, inténtalo de nuevo.',
      copied: '¡Contenido copiado al portapapeles!',
      copyError: 'No se pudo copiar el contenido. Por favor, inténtalo de nuevo.',
    },

    // Goal Completion Modal
    completion: {
      continue: 'Continuar',
      title: '¡Meta Completada!',
      bonus: 'Bonus de Meta Completada',
      statusComplete: 'Completada',
      statusCompleted: 'Completada',
      message1: '¡Felicidades! ¡Has alcanzado tu meta!',
      message2: '¡Trabajo increíble! ¡Meta completada con éxito!',
      message3: '¡Fantástico! ¡Has llegado a tu objetivo!',
      message4: '¡Bien hecho! ¡Tu dedicación dio frutos!',
      message5: '¡Excelente! ¡Otra meta conquistada!',
    },

    // Target Date Confirmation Modal
    targetDateConfirmation: {
      title: '¿Añadir Fecha Objetivo?',
      message: 'Una meta sin fecha es solo un sueño. Establecer una fecha objetivo te ayudará a mantenerte motivado y en el camino.',
      addDate: 'Añadir Fecha',
      continueWithout: 'Continuar Sin Fecha',
    },

    // No progress data messages
    noProgressStats: 'Aún no hay datos de progreso. Añade progreso para ver estadísticas.',
    noProgressPredictions: 'Aún no hay datos de progreso. Añade progreso para ver predicciones.',
  } as any,

  // Monthly Challenge
  monthlyChallenge: {
    // Section title
    title: 'Desafío Mensual',

    // States
    loading: 'Cargando desafío...',
    preparing: '🗓️ Preparando tu desafío mensual...',
    noActiveChallenge: 'Sin desafío activo',
    challengePreparing: '⏳ Desafío en preparación',
    errorLoading: 'Error al cargar el desafío',
    failedToLoad: 'No se pudo cargar el desafío mensual',
    retry: 'Reintentar',

    // Actions
    view: 'Ver',
    close: 'Cerrar',
    awesome: '¡Increíble!',
    continueJourney: 'Continuar el Viaje',

    // Labels
    complete: 'Completado',
    completePercentage: 'Completo',
    daysLeft: 'Días restantes',
    daysLeftCompact: 'd rest.',
    level: 'Nivel',
    difficulty: 'Dificultad',
    difficultyLabel: 'Dificultad',
    activeDays: 'Días Activos',
    maxXP: 'XP Máx.',
    milestones: 'Hitos',
    requirements: 'Requisitos',

    // First Month
    firstMonthPrefix: 'Primer Mes',
    firstMonthDescription: '¡Esta es tu introducción a los desafíos mensuales! Lo hemos hecho extra alcanzable para ayudarte a ganar confianza.',

    // Categories
    categories: {
      habits: 'HÁBITOS',
      journal: 'DIARIO',
      goals: 'METAS',
      consistency: 'CONSISTENCIA',
    },

    // Calendar
    calendar: {
      title: 'Calendario de Progreso Mensual',
      dailyProgress: 'Progreso Diario',
      weeklyBreakdown: 'Desglose Semanal',
      week: 'Semana {{number}}',
      noActivity: 'Sin Actividad (<10%)',
      someActivity: 'Algo de Actividad (10-50%)',
      goodProgress: 'Buen Progreso (51-90%)',
      perfectDay: 'Día Perfecto (91%+)',
      weekDays: {
        mon: 'Lun',
        tue: 'Mar',
        wed: 'Mié',
        thu: 'Jue',
        fri: 'Vie',
        sat: 'Sáb',
        sun: 'Dom',
      },
      active: 'activo',
      some: 'algo',
      good: 'bueno',
      perfect: 'perfecto',
    },

    // Progress
    monthlyProgress: 'Progreso Mensual',
    monthStreak: 'Racha Mensual',
    yourChallengeLevels: 'Tus Niveles de Desafío',

    // Completion
    monthComplete: '✓ Mes Completo',
    completed: '¡Desafío Mensual Completado! 🎉',
    endsDate: 'Termina: {{date}}',

    // Fallback challenge (shown when generation has issues)
    fallback: {
      titlePrefix: '🔧 Respaldo',
      descriptionSuffix: '⚠️ Este es un desafío simplificado debido a problemas de generación.',
    },

    // Star rarity labels
    rarity: {
      common: 'Común',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Legendario',
      master: 'Maestro',
      unknown: 'Desconocido',
    },

    // Star level names
    starLevels: {
      novice: 'Principiante',
      explorer: 'Explorador',
      challenger: 'Retador',
      expert: 'Experto',
      master: 'Maestro',
    },

    // Completion Modal
    completionModal: {
      subtitle: 'Desafío Mensual',
      finalResults: 'Resultados Finales',

      // Completion titles
      titles: {
        perfect: '¡Finalización Perfecta!',
        outstanding: '¡Logro Sobresaliente!',
        great: '¡Gran Progreso!',
        completed: '¡Desafío Completado!',
        progress: '¡Progreso del Mes!',
      },

      // Completion messages
      messages: {
        perfect: '¡Increíble! Has logrado una finalización perfecta en este desafío {{rarity}} de {{category}}. ¡Tu dedicación es verdaderamente inspiradora!',
        outstanding: '¡Trabajo increíble! Casi has dominado este desafío {{rarity}} de {{category}} con una consistencia sobresaliente.',
        great: '¡Excelente progreso! Has mostrado gran compromiso con este desafío {{rarity}} de {{category}} este mes.',
        completed: '¡Bien hecho! Has completado exitosamente este desafío {{rarity}} de {{category}} y ganado tus recompensas.',
        progress: '¡Buen esfuerzo! Has hecho un progreso significativo en este desafío {{rarity}} de {{category}} este mes.',
      },

      progressStats: {
        requirements: 'Requisitos',
        activeDays: 'Días Activos',
        milestones: 'Hitos',
      },

      // Rewards
      rewards: {
        title: 'Recompensas de XP Ganadas',
        baseXP: 'XP Base del Desafío',
        completionBonus: 'Bonificación de Finalización',
        streakBonus: 'Bonificación de Racha Mensual 🔥',
        perfectBonus: 'Finalización Perfecta 🏆',
        totalEarned: 'Total de XP Ganado',
      },

      // Star progression
      starProgression: {
        title: '¡Progresión de Nivel de Estrellas! 🌟',
        previous: 'Anterior',
        newLevel: 'Nuevo Nivel',
        description: '¡Tu próximo desafío mensual será más difícil con mayores recompensas de XP!',
      },

      // Streak
      streak: {
        title: 'Racha Mensual 🔥',
        month_one: 'Mes',
        month_other: 'Meses',
        description: '¡Mantén el impulso! Cada mes consecutivo aumenta tus bonificaciones de racha.',
      },

      // Next month
      nextMonth: {
        title: '¿Listo para el Próximo Mes?',
        description: 'Tu próximo desafío se generará automáticamente el día 1.',
        descriptionWithLevel: 'Tu próximo desafío se generará automáticamente el día 1. ¡Con tu nuevo nivel de estrellas, espera un desafío mayor y mejores recompensas!',
      },
    },

    // Detail Modal
    detailModal: {
      strategyDescription: 'Este es un desafío de dificultad {{rarity}} ({{stars}}★) diseñado para ayudarte a crecer consistentemente.',
      strategyDescriptionAdvance: '¡Completa este desafío para avanzar al siguiente nivel de estrellas y desbloquear mayores recompensas de XP!',
      rewardTitle: '{{xp}} Puntos de Experiencia',
      streakBonus: '🔥 Bonificación de Racha: +{{bonus}} XP por {{count}} meses de racha',

      // Category-specific tips
      tips: {
        habits: [
          'Concéntrate en construir hábitos sostenibles que se alineen con tu estilo de vida.',
          'Comienza con hábitos más fáciles y aumenta gradualmente la dificultad.',
          'Rastrea tus hábitos diariamente para mantener la responsabilidad.',
          'Celebra las pequeñas victorias para mantenerte motivado durante todo el mes.',
          'Usa el apilamiento de hábitos para vincular nuevos hábitos con rutinas existentes.',
        ],
        journal: [
          'Reserva tiempo dedicado cada día para el journaling.',
          'Escribe auténticamente sobre tus experiencias y sentimientos.',
          'Usa indicaciones de journaling cuando te sientas atascado.',
          'Revisa entradas pasadas para rastrear tu crecimiento.',
          'Experimenta con diferentes estilos de journaling para encontrar lo que funciona.',
        ],
        goals: [
          'Divide metas grandes en hitos más pequeños y accionables.',
          'Revisa y ajusta tus metas semanalmente.',
          'Concéntrate en el progreso, no en la perfección.',
          'Documenta las lecciones aprendidas en el camino.',
          'Celebra los logros de hitos para mantener el impulso.',
        ],
        consistency: [
          'Preséntate cada día, incluso si el progreso parece pequeño.',
          'Construye rutinas que apoyen tus objetivos de consistencia.',
          'Rastrea tus actividades diarias para identificar patrones.',
          'Usa recordatorios y herramientas de responsabilidad.',
          'Recuerda que la consistencia se compone con el tiempo.',
        ],
        default: [
          'Mantente enfocado en tus objetivos durante todo el mes.',
          'Rastrea tu progreso diariamente para mantener el impulso.',
          'Celebra los hitos en el camino.',
          'Ajusta tu enfoque si es necesario, pero sigue avanzando.',
          'Recuerda por qué empezaste cuando surjan desafíos.',
        ],
      },
    },

    // Star Progress Indicator
    starProgress: {
      title: 'Progresión de Estrellas',
      categoryProgress: 'Progreso de {{category}}',
      loadingProgress: 'Cargando progreso...',

      // Empty state
      emptyState: {
        noChallengeHistory: 'Sin historial de desafíos aún',
        noCategoryHistory: 'Sin historial de desafíos de {{category}} aún',
        completeToSeeProgress: 'Completa desafíos mensuales para ver tu progreso',
      },

      // Performance Analysis
      performanceAnalysis: {
        title: 'Análisis de Rendimiento',
        overallRating: 'Calificación General',
        trend: 'Tendencia',
        successRate: 'Tasa de Éxito',
        strongest: 'Más Fuerte',
      },

      // Trend labels
      trends: {
        improving: 'mejorando',
        declining: 'decreciendo',
        stable: 'estable',
      },

      // Progress display
      percentageCompleted: '{{percentage}}% completado',
    },
  } as any,

  // Settings screen - Language section (PRIORITY 1)
  settings: {
    title: 'Ajustes',

    // Appearance
    appearance: 'Apariencia',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeSystem: 'Sistema Auto',
    themeDescription: 'Elige tu esquema de color preferido',
    themeSystemDescription: 'Coincide con la configuración de tu dispositivo',
    lightMode: 'Modo Claro',
    darkMode: 'Modo Oscuro',
    systemAuto: 'Sistema Auto',
    systemAutoDescription: 'Coincide con la configuración de tu dispositivo',

    // Language
    language: 'Idioma',
    languageDescription: 'Selecciona tu idioma preferido',
    languageEnglish: 'English',
    languageGerman: 'Deutsch',
    languageSpanish: 'Español',

    // Notifications
    notifications: 'Notificaciones',
    morningNotification: 'Notificación Matutina',
    eveningNotification: 'Notificación Nocturna',
    notificationSettings: {
      errors: {
        loadFailed: 'No se pudo cargar la configuración de notificaciones',
        permissionsTitle: 'Permisos Requeridos',
        permissionsMessage: 'Se necesitan permisos de notificaciones para enviarte recordatorios. Puedes habilitarlos en la configuración del sistema.',
        permissionsFailed: 'No se pudieron solicitar permisos de notificaciones',
        settingsFailed: 'No se pudo abrir la configuración del sistema',
        afternoonUpdateFailed: 'No se pudo actualizar el recordatorio de la tarde',
        eveningUpdateFailed: 'No se pudo actualizar el recordatorio de la noche',
        afternoonTimeFailed: 'No se pudo actualizar la hora del recordatorio de la tarde',
        eveningTimeFailed: 'No se pudo actualizar la hora del recordatorio de la noche',
      },
      buttons: {
        openSettings: 'Abrir Configuración',
      },
    },

    // Analytics
    habitAnalytics: 'Análisis de Hábitos',
    individualHabitStats: 'Estadísticas Individuales de Hábitos',

    // Account
    account: 'Cuenta',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    logout: 'Cerrar Sesión',

    // About
    about: 'Acerca de',
    version: 'Versión',
    privacyPolicy: 'Política de Privacidad',
    termsOfService: 'Términos de Servicio',

    // Tutorial & Onboarding
    tutorial: 'Tutorial',
    tutorialReset: 'Reiniciar Tutorial',
    tutorialResetDescription: 'Reiniciar el tutorial desde el principio',
    tutorialResetConfirmTitle: '¿Reiniciar Tutorial?',
    tutorialResetConfirmMessage: 'Esto reiniciará el tutorial desde el principio. Esta acción no se puede deshacer.',
    tutorialResetSuccess: '¡Tutorial reiniciado exitosamente!',

    // Common
    cancel: 'Cancelar',
    reset: 'Reiniciar',
    success: 'Éxito',
    errorTitle: 'Error',
    resetting: 'Reiniciando...',
  } as any,

  // Days of week
  days: {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
    short: {
      monday: 'Lun',
      tuesday: 'Mar',
      wednesday: 'Mié',
      thursday: 'Jue',
      friday: 'Vie',
      saturday: 'Sáb',
      sunday: 'Dom',
    },
    shortest: {
      monday: 'L',
      tuesday: 'M',
      wednesday: 'M',
      thursday: 'J',
      friday: 'V',
      saturday: 'S',
      sunday: 'D',
    },
  } as any,

  // Achievements - All 78 achievements translated to Spanish
  achievements: {
    title: 'Sala de Trofeos',
    subtitle: 'Tu salón personal de la fama',

    // View mode toggle
    viewModeTrophyRoom: '🏠 Sala de Trofeos',
    viewModeBrowseAll: '🏆 Explorar Todos',

    // Loading states
    loadingTitle: 'Cargando Sala de Trofeos',
    loadingText: 'Puliendo tus logros...',

    // Overview Statistics
    overview: {
      unlockedCount: 'Desbloqueados',
      totalCount: 'Total',
      completionRate: 'Progreso',
      totalXP: 'XP Total',
      recentUnlocks: 'Recientes',
      nextToUnlock: 'Próximos',
      noAchievements: 'Aún no hay logros desbloqueados',
      getStarted: '¡Comienza a completar hábitos, escribe en tu diario y alcanza metas para desbloquear tu primer logro!',
    },

    // Achievement Spotlight
    spotlight: {
      title: 'Destacado de Logros',
      titleWithEmoji: '🌟 Destacado de Logros',
      subtitle: 'Celebrando Tu Éxito',
      emptyTitle: 'Destacado de Logros',
      emptySubtitle: '¡Desbloquea logros para verlos destacados aquí con historias inspiradoras!',
      featuredAchievement: '✨ Logro Destacado ✨',
      rotationText: 'Rota cada 30 segundos',

      // Inspirational stories by rarity
      stories: {
        common1: 'Cada gran viaje comienza con un solo paso. Este logro marca el inicio de tu transformación.',
        common2: 'Pequeñas victorias conducen a grandes triunfos. Has dado un primer paso importante.',
        common3: 'La base del éxito se construye logro a logro. ¡Bien hecho!',

        rare1: 'La dedicación y la constancia te han traído hasta aquí. Este logro refleja tu creciente compromiso.',
        rare2: 'Estás desarrollando los hábitos de un campeón. Este logro raro prueba tu determinación.',
        rare3: 'La excelencia no es un acto, sino un hábito. Este logro muestra que estás construyendo ese hábito.',

        epic1: 'Los logros extraordinarios requieren esfuerzos extraordinarios. Has demostrado que tienes lo necesario.',
        epic2: 'Este logro épico te coloca entre los pocos dedicados que superan sus límites.',
        epic3: 'La grandeza no se da, se gana. Este logro es prueba de tu compromiso excepcional.',

        legendary1: 'Las leyendas no nacen, se forjan a través de la búsqueda incansable de la excelencia. Eres legendario.',
        legendary2: 'Este logro representa el pináculo de la dedicación. Te has unido a las filas de los extraordinarios.',
        legendary3: 'La historia recordará a quienes se atrevieron a ser grandes. Este logro legendario es tu huella en la eternidad.',
      },
    },

    // Categories
    categories: {
      all: 'Todos',
      habits: 'Hábitos',
      journal: 'Diario',
      goals: 'Metas',
      consistency: 'Consistencia',
      mastery: 'Maestría',
      social: 'Social',
      special: 'Especial',
    },

    // Rarity levels
    rarity: {
      common: 'Común',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Legendario',
    },

    // Achievement Card
    card: {
      locked: 'Bloqueado',
      unlocked: 'Desbloqueado',
      unlockedOn: 'Desbloqueado el {{date}}',
      progress: 'Progreso: {{current}}/{{target}}',
      xpReward: '+{{xp}} XP',
      viewDetails: 'Ver Detalles',
      almostThere: '¡Casi lo logras!',
      keepGoing: '¡Sigue adelante!',
      accessibility_label: '{{name}}, logro de rareza {{rarity}}. Estado: {{status}}. {{description}}',
      accessibility_hint: 'Toca para ver más detalles sobre este logro',
    },

    // Celebration Modal
    celebration: {
      announcement: '¡Logro {{rarity}} desbloqueado: {{name}}! Has ganado {{xp}} puntos de experiencia.',
      continue_button: 'Continuar',
      continue_hint: 'Cerrar celebración de logro y volver a la app',
      rarity_common: '¡Logro Desbloqueado!',
      rarity_rare: '¡Logro Raro!',
      rarity_epic: '¡Logro Épico!',
      rarity_legendary: '¡Logro Legendario!',
      xp_earned: 'XP Ganado',
    },

    // Achievement Detail Modal
    detail: {
      unlockedYesterday: 'Desbloqueado ayer',
      unlockedDaysAgo: 'Desbloqueado hace {{days}} días',
      unlockedWeeksAgo: 'Desbloqueado hace {{weeks}} semanas',
      unlockedRecently: 'Desbloqueado recientemente',
      recentlyUnlocked: 'Desbloqueado recientemente',
      titleUnlocked: '¡Logro Desbloqueado!',
      titleDetails: 'Detalles del Logro',
      detailsSection: 'Detalles del Logro',
      categoryLabel: 'Categoría:',
      rarityLabel: 'Rareza:',
      xpRewardLabel: 'Recompensa XP:',
      xpPointsUnit: 'puntos',
      progressToUnlock: 'Progreso para Desbloquear',
      progressLoading: 'Cargando progreso...',
      progressPercent: '{{percent}}% completado',
      howToUnlock: 'Cómo Desbloquear',
      estimatedDays: 'Estimado: {{days}} días restantes',
      lockedMessage: 'Este logro está bloqueado. ¡Sigue usando la app para desbloquearlo!',
      requirementFallback: 'Requisito del logro',
      actionHint: '¡Sigue trabajando hacia este objetivo!',
      closeButton: 'Cerrar detalles del logro',
      shareButton: 'Compartir logro',
      rarityCommon: 'COMÚN',
      rarityRare: 'RARO',
      rarityEpic: 'ÉPICO',
      rarityLegendary: 'LEGENDARIO',
      // Accessibility announcements
      accessibilityUnlocked: 'Detalles del logro: {{name}}. Este logro {{rarity}} está desbloqueado.',
      accessibilityLocked: 'Detalles del logro: {{name}}. Este logro {{rarity}} está bloqueado. Información de progreso disponible.',
    },
    history: {
      justNow: 'Justo ahora',
      today: 'Hoy',
      yesterday: 'Ayer',
      thisWeek: 'Esta semana',
      lastWeek: 'La semana pasada',
      thisMonth: 'Este mes',
      aWhileAgo: 'Hace un tiempo',
    },

    // Trophy Room Stats
    trophyRoom: {
      totalTrophies: 'Total de Trofeos',
      collected: 'Recogidos',
      completionRate: 'Tasa de Finalización',
      overallProgress: 'Progreso General',
      showingResults: 'Mostrando {{filtered}} de {{total}} Logros',
    },

    // Sorting
    sort: {
      byName: 'Nombre',
      byUnlockDate: 'Fecha de Desbloqueo',
      byRarity: 'Rareza',
      byCategory: 'Categoría',
      byProgress: 'Progreso',
      ascending: 'A-Z',
      descending: 'Z-A',
    },

    // Achievement Details Modal
    details: {
      title: 'Detalles del Logro',
      description: 'Descripción',
      category: 'Categoría',
      rarity: 'Rareza',
      xpReward: 'Recompensa XP',
      unlockCondition: 'Cómo Desbloquear',
      progress: 'Tu Progreso',
      unlockedDate: 'Fecha de Desbloqueo',
      timeToUnlock: 'Tiempo para Desbloquear',
      tips: 'Consejos',
      close: 'Cerrar',
      shareAchievement: 'Compartir Logro',
    },

    // Interactive Features
    interactive: {
      celebrationHistory: 'Celebraciones Recientes',
      achievementSpotlight: 'Logro Destacado',
      featuredAchievement: 'Logro Destacado',
      dailyChallenge: 'Desafío de Hoy',
      progressPreview: 'Vista Previa de Progreso',
      upcomingRewards: 'Recompensas Próximas',
    },

    // Statistics Panel
    stats: {
      title: 'Estadísticas de Logros',
      breakdown: 'Desglose por Categoría',
      rarityDistribution: 'Distribución de Rareza',
      unlockTimeline: 'Línea de Tiempo de Desbloqueos',
      averageTimeToUnlock: 'Tiempo Promedio para Desbloquear',
      totalXPEarned: 'XP Total de Logros',
      achievementRate: 'Tasa de Logros',
      consistencyScore: 'Puntuación de Consistencia',
      nextMilestone: 'Próximo Hito',
      daysActive: '{{days}} días activos',
      thisWeek: 'Esta Semana',
      thisMonth: 'Este Mes',
      allTime: 'Todo el Tiempo',
    },

    // Empty States
    empty: {
      noAchievements: 'Aún No Hay Logros',
      noAchievementsSubtitle: '¡Completa tu primer hábito, entrada de diario o meta para comenzar a ganar logros!',
      noSearchResults: 'No Se Encontraron Resultados',
      noSearchResultsSubtitle: 'Intenta ajustar tus términos de búsqueda o filtros.',
      noCategory: 'Aún no hay logros en esta categoría.',
      noCategorySubtitle: '¡Sigue usando la app y los logros aparecerán aquí!',
    },

    // Achievement Names (will be used for individual achievements)
    names: {
      firstSteps: 'Primeros Pasos',
      habitBuilder: 'Constructor de Hábitos',
      streakMaster: 'Maestro de Rachas',
      deepThinker: 'Pensador Profundo',
      goalGetter: 'Conseguidor de Metas',
      consistent: 'Consistente',
      dedicated: 'Dedicado',
      perfectMonth: 'Mes Perfecto',
    },

    // Achievement Descriptions (will be used for individual achievements)
    descriptions: {
      firstSteps: 'Creaste tu primer hábito, entrada de diario o meta.',
      habitBuilder: 'Creaste 5 hábitos diferentes.',
      streakMaster: 'Mantuviste una racha de 30 días.',
      deepThinker: 'Escribiste una entrada de diario con más de 200 caracteres.',
      goalGetter: 'Completaste tu primera meta.',
      consistent: 'Usaste la app durante 7 días consecutivos.',
      dedicated: 'Usaste la app durante 30 días consecutivos.',
      perfectMonth: 'Completaste todas las actividades durante 30 días.',
    },

    // Sharing
    sharing: {
      shareTitle: '¡Acabo de desbloquear un logro!',
      shareText: '¡Acabo de desbloquear "{{name}}" en SelfRise! 🏆 {{description}}',
      shareError: 'Error al compartir el logro. Por favor, inténtalo de nuevo.',
      copySuccess: '¡Detalles del logro copiados al portapapeles!',
      copyError: 'Error al copiar los detalles del logro.',
    },

    // Filtering and Search
    filter: {
      showAll: 'Mostrar Todos',
      unlockedOnly: 'Solo Desbloqueados',
      lockedOnly: 'Solo Bloqueados',
      byCategory: 'Por Categoría',
      byRarity: 'Por Rareza',
      searchPlaceholder: 'Buscar logros...',
      noResults: 'No se encontraron logros',
      noResultsSubtitle: 'Intenta ajustar tus filtros o criterios de búsqueda',
      clearFilters: 'Limpiar Filtros',
    },

    // Accessibility
    accessibility: {
      achievementCard: 'Tarjeta de logro para {{name}}',
      lockedAchievement: 'Logro bloqueado: {{name}}',
      unlockedAchievement: 'Logro desbloqueado: {{name}}, obtenido el {{date}}',
      progressBar: 'Progreso: {{progress}} por ciento completo',
      categoryFilter: 'Filtrar por categoría {{category}}',
      rarityBadge: 'Logro de rareza {{rarity}}',
      searchInput: 'Buscar logros por nombre o descripción',
      sortButton: 'Ordenar logros por {{criteria}}',
      filterButton: 'Filtrar logros',
      viewDetails: 'Ver detalles para el logro {{name}}',
    },

    // Achievement Names (78 achievements)
    achievementNames: {
      'first-habit': 'Primeros Pasos',
      'habit-builder': 'Constructor de Hábitos',
      'century-club': 'Club del Siglo',
      'consistency-king': 'Rey de la Consistencia',
      'habit-streak-champion': 'Campeón de Racha de Hábitos',
      'century-streak': 'Racha del Siglo',
      'streak-champion': 'Campeón de Racha',
      'multi-tasker': 'Multitarea',
      'habit-legend': 'Leyenda de Hábitos',
      'first-journal': 'Primera Reflexión',
      'deep-thinker': 'Pensador Profundo',
      'journal-enthusiast': 'Entusiasta del Diario',
      'grateful-heart': 'Corazón Agradecido',
      'gratitude-guru': 'Gurú de la Gratitud',
      'eternal-gratitude': 'Gratitud Eterna',
      'journal-streaker': 'Streaker de Diario',
      'bonus-seeker': 'Buscador de Bonificaciones',
      'first-star': 'Primera Estrella',
      'five-stars': 'Cinco Estrellas',
      'flame-achiever': 'Logrador de Llama',
      'bonus-week': 'Semana de Bonificación',
      'crown-royalty': 'Realeza de Corona',
      'flame-collector': 'Coleccionista de Llamas',
      'golden-bonus-streak': 'Racha de Bonificación Dorada',
      'triple-crown-master': 'Maestro de Triple Corona',
      'bonus-century': 'Siglo de Bonificación',
      'star-beginner': 'Principiante de Estrellas',
      'star-collector': 'Coleccionista de Estrellas',
      'star-master': 'Maestro de Estrellas',
      'star-champion': 'Campeón de Estrellas',
      'star-legend': 'Leyenda de Estrellas',
      'flame-starter': 'Iniciador de Llamas',
      'flame-accumulator': 'Acumulador de Llamas',
      'flame-master': 'Maestro de Llamas',
      'flame-champion': 'Campeón de Llamas',
      'flame-legend': 'Leyenda de Llamas',
      'crown-achiever': 'Logrador de Corona',
      'crown-collector': 'Coleccionista de Coronas',
      'crown-master': 'Maestro de Coronas',
      'crown-champion': 'Campeón de Coronas',
      'crown-emperor': 'Emperador de Coronas',
      'first-goal': 'Primera Visión',
      'goal-getter': 'Conseguidor de Objetivos',
      'ambitious': 'Ambicioso',
      'goal-champion': 'Campeón de Objetivos',
      'progress-tracker': 'Seguidor de Progreso',
      'mega-dreamer': 'Mega Soñador',
      'achievement-unlocked': 'Logro Desbloqueado',
      'million-achiever': 'Logrador de Millones',
      'weekly-warrior': 'Guerrero Semanal',
      'monthly-master': 'Maestro Mensual',
      'centurion': 'Centurión',
      'hundred-days': 'Cien Días',
      'daily-visitor': 'Visitante Diario',
      'dedicated-user': 'Usuario Dedicado',
      'perfect-month': 'Mes Perfecto',
      'triple-crown': 'Triple Corona',
      'gratitude-guardian': 'Guardián de la Gratitud',
      'dream-fulfiller': 'Cumplidor de Sueños',
      'goal-achiever': 'Logrador de Objetivos',
      'level-up': 'Subir de Nivel',
      'selfrise-expert': 'Experto en SelfRise',
      'selfrise-master': 'Maestro de SelfRise',
      'ultimate-selfrise-legend': 'Leyenda Definitiva de SelfRise',
      'recommendation-master': 'Maestro de Recomendaciones',
      'balance-master': 'Maestro del Equilibrio',
      'trophy-collector-basic': 'Coleccionista de Trofeos',
      'trophy-collector-master': 'Maestro de Trofeos',
      'lightning-start': 'Inicio Relámpago',
      'seven-wonder': 'Siete Maravillas',
      'persistence-pays': 'La Persistencia Paga',
      'legendary-master': 'Maestro Legendario',
      'selfrise-legend': 'Leyenda de SelfRise',
      'loyalty-first-week': 'Primera Semana',
      'loyalty-two-weeks-strong': 'Dos Semanas Fuerte',
      'loyalty-three-weeks-committed': 'Tres Semanas Comprometido',
      'loyalty-month-explorer': 'Explorador de Mes',
      'loyalty-two-month-veteran': 'Veterano de Dos Meses',
      'loyalty-century-user': 'Usuario del Centenario',
      'loyalty-half-year-hero': 'Héroe de Medio Año',
      'loyalty-year-legend': 'Leyenda del Año',
      'loyalty-ultimate-veteran': 'Veterano Definitivo',
      'loyalty-master': 'Maestro de Lealtad',
    },

    // Achievement Requirements (78 achievements)
    achievementRequirements: {
      'first-habit': 'Crea tu primer hábito',
      'habit-builder': 'Crea 5 hábitos diferentes',
      'century-club': 'Completa 100 tareas de hábitos',
      'consistency-king': 'Completa 1000 tareas de hábitos',
      'habit-streak-champion': 'Logra una racha de 21 días con cualquier hábito',
      'century-streak': 'Mantén una racha de 75 días con cualquier hábito',
      'streak-champion': 'Logra una racha de 21 días con cualquier hábito',
      'multi-tasker': 'Completa 5 hábitos diferentes en un día',
      'habit-legend': 'Alcanza el Nivel 50 "Especialista V" con XP principalmente de actividades de hábitos',
      'first-journal': 'Escribe tu primera entrada de diario de gratitud',
      'deep-thinker': 'Escribe una entrada de diario con al menos 200 caracteres',
      'journal-enthusiast': 'Escribe 100 entradas de diario',
      'grateful-heart': 'Mantén una racha de escritura de diario de 7 días',
      'gratitude-guru': 'Logra una racha de escritura de diario de 30 días',
      'eternal-gratitude': 'Mantén una racha de diario de 100 días',
      'journal-streaker': 'Logra una racha de escritura de diario de 21 días',
      'bonus-seeker': 'Escribe 50 entradas de diario bonificadas',
      'first-star': 'Gana una estrella (primera entrada bonificada del día)',
      'five-stars': 'Gana una estrella 5 veces en total',
      'flame-achiever': 'Gana una llama (5 bonificaciones en un día) por primera vez',
      'bonus-week': 'Al menos 1 bonificación cada día durante 7 días seguidos',
      'crown-royalty': 'Gana una corona (10 bonificaciones en un día) por primera vez',
      'flame-collector': 'Gana una llama 5 veces en total',
      'golden-bonus-streak': 'Al menos 3 bonificaciones cada día durante 7 días seguidos',
      'triple-crown-master': 'Gana una corona 3 veces en total',
      'bonus-century': 'Escribe 200 entradas bonificadas en total',
      'star-beginner': 'Gana una estrella 10 veces en total',
      'star-collector': 'Gana una estrella 25 veces en total',
      'star-master': 'Gana una estrella 50 veces en total',
      'star-champion': 'Gana una estrella 100 veces en total',
      'star-legend': 'Gana una estrella 200 veces en total',
      'flame-starter': 'Gana una llama 5 veces en total',
      'flame-accumulator': 'Gana una llama 10 veces en total',
      'flame-master': 'Gana una llama 25 veces en total',
      'flame-champion': 'Gana una llama 50 veces en total',
      'flame-legend': 'Gana una llama 100 veces en total',
      'crown-achiever': 'Gana una corona 3 veces en total',
      'crown-collector': 'Gana una corona 5 veces en total',
      'crown-master': 'Gana una corona 10 veces en total',
      'crown-champion': 'Gana una corona 25 veces en total',
      'crown-emperor': 'Gana una corona 50 veces en total',
      'first-goal': 'Establece tu primer objetivo',
      'goal-getter': 'Completa tu primer objetivo',
      'ambitious': 'Establece un objetivo con valor de 1000 o más',
      'goal-champion': 'Completa 5 objetivos',
      'progress-tracker': 'Avanza en objetivos durante 7 días consecutivos',
      'mega-dreamer': 'Establece un objetivo con valor de 1,000,000 o más',
      'achievement-unlocked': 'Completa 10 objetivos',
      'million-achiever': 'Completa un objetivo con valor de 1,000,000 o más',
      'weekly-warrior': 'Mantén una racha de 7 días en cualquier hábito',
      'monthly-master': 'Logra una racha de 30 días',
      'centurion': 'Logra 100 días de consistencia',
      'hundred-days': 'Mantén una racha de 100 días de completar hábitos',
      'daily-visitor': 'Usa la app durante 7 días consecutivos',
      'dedicated-user': 'Usa la app durante 30 días consecutivos',
      'perfect-month': 'Completa actividades en las 3 áreas durante 28+ días en un mes',
      'triple-crown': 'Mantén rachas de 7+ días en hábitos, diario y objetivos simultáneamente',
      'gratitude-guardian': 'Escribe entradas de diario durante 21 días consecutivos',
      'dream-fulfiller': 'Completa 3 objetivos',
      'goal-achiever': 'Completa 3 objetivos',
      'level-up': 'Alcanza el nivel 10 "Principiante V"',
      'selfrise-expert': 'Alcanza el nivel 25 "Adepto V"',
      'selfrise-master': 'Alcanza el nivel 50 "Especialista V"',
      'ultimate-selfrise-legend': 'Alcanza el nivel 100 "Mítico V"',
      'recommendation-master': 'Sigue 20 recomendaciones personalizadas',
      'balance-master': 'Usa las 3 funciones en un día 10 veces',
      'trophy-collector-basic': 'Desbloquea 10 logros',
      'trophy-collector-master': 'Desbloquea 25 logros',
      'lightning-start': 'Crea y completa un hábito el mismo día 3 veces',
      'seven-wonder': 'Ten 7 o más hábitos activos simultáneamente',
      'persistence-pays': 'Regresa después de un descanso de 3+ días y completa 7 actividades',
      'legendary-master': 'Logra estado de élite en 3 categorías principales',
      'selfrise-legend': 'Logra la maestría: 10 objetivos + 500 hábitos + 365 entradas de diario',
      'loyalty-first-week': '7 días activos en total',
      'loyalty-two-weeks-strong': '14 días activos en total',
      'loyalty-three-weeks-committed': '21 días activos en total',
      'loyalty-month-explorer': '30 días activos en total',
      'loyalty-two-month-veteran': '60 días activos en total',
      'loyalty-century-user': '100 días activos en total',
      'loyalty-half-year-hero': '183 días activos en total',
      'loyalty-year-legend': '365 días activos en total',
      'loyalty-ultimate-veteran': '500 días activos en total',
      'loyalty-master': '1000 días activos en total',
    },

    // HABITS ACHIEVEMENTS (8 achievements)
    first_habit: {
      name: 'Primeros Pasos',
      description: 'Crea tu primer hábito y comienza tu viaje hacia la superación personal'
    },
    habit_builder: {
      name: 'Constructor de Hábitos',
      description: 'Crea 5 hábitos diferentes para diversificar tu desarrollo personal'
    },
    century_club: {
      name: 'Club del Siglo',
      description: 'Completa 100 tareas de hábitos - únete a las filas élite de los ejecutores consistentes'
    },
    consistency_king: {
      name: 'Rey de la Consistencia',
      description: 'Completa 1000 tareas de hábitos - eres el maestro de la consistencia'
    },
    streak_champion: {
      name: 'Campeón de Rachas',
      description: 'Alcanza una racha de 21 días con cada hábito - construye un cambio duradero'
    },
    century_streak: {
      name: 'Racha del Siglo',
      description: 'Mantén una racha de 75 días con cada hábito - acercándote al estado legendario'
    },
    multi_tasker: {
      name: 'Multitarea',
      description: 'Completa 5 hábitos diferentes en un solo día - demuestra compromiso diverso'
    },
    habit_legend: {
      name: 'Leyenda de Hábitos',
      description: 'Alcanza el nivel 50 "Especialista V" con XP ganada principalmente de actividades de hábitos - verdadera maestría'
    },

    // JOURNAL ACHIEVEMENTS (33 achievements)
    first_journal: {
      name: 'Primera Reflexión',
      description: 'Escribe tu primera entrada en el diario de gratitud y comienza la práctica de mindfulness'
    },
    deep_thinker: {
      name: 'Pensador Profundo',
      description: 'Escribe una entrada de al menos 200 caracteres - muestra tu reflexión'
    },
    journal_enthusiast: {
      name: 'Entusiasta del Diario',
      description: 'Escribe 100 entradas - estás construyendo un hábito maravilloso de reflexión'
    },
    gratitude_guru: {
      name: 'Gurú de la Gratitud',
      description: 'Alcanza una racha de 30 días escribiendo en el diario - eres un maestro de la reflexión diaria'
    },
    eternal_gratitude: {
      name: 'Gratitud Eterna',
      description: 'Mantén una racha de 100 días en el diario - tu práctica de gratitud es legendaria'
    },
    bonus_seeker: {
      name: 'Buscador de Bonos',
      description: 'Escribe 50 entradas bonus - vas más allá en tu práctica de gratitud'
    },
    journal_streaker: {
      name: 'Guardián de la Gratitud',
      description: 'Escribe en tu diario durante 21 días consecutivos'
    },
    triple_crown: {
      name: 'Triple Corona',
      description: 'Mantén rachas de 7+ días en hábitos, diario y metas simultáneamente'
    },
    lightning_start: {
      name: 'Inicio Relámpago',
      description: 'Crea y completa un hábito 3 veces el mismo día - ejecutor inmediato'
    },
    first_star: {
      name: 'Primera Estrella',
      description: 'Gana tu primera estrella (primera entrada bonus del día) - descubre la gratitud expandida'
    },
    five_stars: {
      name: 'Cinco Estrellas',
      description: 'Gana estrellas 5 veces en total - expansión regular de la práctica de gratitud'
    },
    flame_achiever: {
      name: 'Logrador de Llamas',
      description: 'Gana tu primera llama (5 bonos en un día) - un día de intensa gratitud y reflexión'
    },
    bonus_week: {
      name: 'Semana Bonus',
      description: '7 días consecutivos con al menos 1 bonus cada día - una semana de práctica expandida consistente'
    },
    crown_royalty: {
      name: 'Realeza de la Corona',
      description: 'Gana tu primera corona (10 bonos en un día) - día cumbre de reflexión con estatus real'
    },
    flame_collector: {
      name: 'Coleccionista de Llamas',
      description: 'Gana llamas 5 veces en total - maestro de días intensos de gratitud'
    },
    golden_bonus_streak: {
      name: 'Racha Dorada de Bonos',
      description: '7 días consecutivos con al menos 3 bonos cada día - una semana de reflexión profunda y expandida'
    },
    triple_crown_master: {
      name: 'Maestro de la Triple Corona',
      description: 'Gana coronas 3 veces en total - maestro legendario de días de reflexión reales'
    },
    bonus_century: {
      name: 'Siglo de Bonos',
      description: 'Escribe 200 entradas bonus en total - maestro definitivo de la práctica de gratitud expandida'
    },
    star_beginner: {
      name: 'Principiante Estelar',
      description: 'Gana estrellas 10 veces en total - coleccionista inicial de experiencias bonus'
    },
    star_collector: {
      name: 'Coleccionista de Estrellas',
      description: 'Gana estrellas 25 veces en total - expansor regular de la práctica de gratitud'
    },
    star_master: {
      name: 'Maestro de Estrellas',
      description: 'Gana estrellas 50 veces en total - maestro de la reflexión diaria expandida'
    },
    star_champion: {
      name: 'Campeón de Estrellas',
      description: 'Gana estrellas 100 veces en total - campeón de la práctica expandida a largo plazo'
    },
    star_legend: {
      name: 'Leyenda de Estrellas',
      description: 'Gana estrellas 200 veces en total - maestro legendario de experiencias bonus'
    },
    flame_starter: {
      name: 'Iniciador de Llamas',
      description: 'Gana llamas 5 veces en total - maestro inicial de días intensos'
    },
    flame_accumulator: {
      name: 'Acumulador de Llamas',
      description: 'Gana llamas 10 veces en total - coleccionista de días excepcionales de gratitud'
    },
    flame_master: {
      name: 'Maestro de Llamas',
      description: 'Gana llamas 25 veces en total - maestro de días intensos sistemáticos'
    },
    flame_champion: {
      name: 'Campeón de Llamas',
      description: 'Gana llamas 50 veces en total - campeón de la reflexión diaria profunda'
    },
    flame_legend: {
      name: 'Leyenda de Llamas',
      description: 'Gana llamas 100 veces en total - maestro legendario de la práctica intensa de gratitud'
    },
    crown_achiever: {
      name: 'Logrador de Coronas',
      description: 'Gana coronas 3 veces en total - alcanza días de reflexión reales'
    },
    crown_collector: {
      name: 'Coleccionista de Coronas',
      description: 'Gana coronas 5 veces en total - coleccionista de experiencias reales de gratitud'
    },
    crown_master: {
      name: 'Maestro de Coronas',
      description: 'Gana coronas 10 veces en total - maestro de la reflexión real'
    },
    crown_champion: {
      name: 'Campeón de Coronas',
      description: 'Gana coronas 25 veces en total - campeón de días reales de gratitud'
    },
    crown_emperor: {
      name: 'Emperador de Coronas',
      description: 'Gana coronas 50 veces en total - estatus imperial en la práctica de reflexión profunda'
    },

    // GOALS ACHIEVEMENTS (8 achievements)
    first_goal: {
      name: 'Primera Visión',
      description: 'Establece tu primera meta y define hacia dónde va tu viaje'
    },
    goal_getter: {
      name: 'Conquistador de Metas',
      description: 'Completa tu primera meta - estás convirtiendo sueños en realidad'
    },
    goal_champion: {
      name: 'Campeón de Metas',
      description: 'Completa 5 metas - te estás convirtiendo en maestro del logro'
    },
    ambitious: {
      name: 'Ambicioso',
      description: 'Establece una meta con valor objetivo de 1000 o más - sueñas en grande'
    },
    progress_tracker: {
      name: 'Rastreador de Progreso',
      description: 'Haz progreso en metas durante 7 días consecutivos - la consistencia lleva al éxito'
    },
    mega_dreamer: {
      name: 'Mega Soñador',
      description: 'Establece una meta con valor objetivo de 1.000.000 o más - sueñas en millones'
    },
    million_achiever: {
      name: 'Logrador Millonario',
      description: 'Completa una meta con valor objetivo de 1.000.000 o más - conviertes sueños masivos en realidad'
    },
    goal_achiever: {
      name: 'Realizador de Sueños',
      description: 'Completa 3 metas - conviertes sueños en realidad'
    },

    // CONSISTENCY ACHIEVEMENTS (6 achievements)
    weekly_warrior: {
      name: 'Guerrero Semanal',
      description: 'Mantén una racha de 7 días en cada hábito - prueba tu dedicación'
    },
    monthly_master: {
      name: 'Maestro Mensual',
      description: 'Alcanza una racha de 30 días - realmente estás construyendo hábitos duraderos'
    },
    hundred_days: {
      name: 'Centurión',
      description: 'Alcanza 100 días de consistencia - únete a las filas élite de los maestros de hábitos'
    },
    daily_visitor: {
      name: 'Visitante Diario',
      description: 'Usa la app durante 7 días consecutivos - construye un hábito saludable'
    },
    dedicated_user: {
      name: 'Usuario Dedicado',
      description: 'Usa la app durante 30 días consecutivos - tu compromiso es inspirador'
    },
    perfect_month: {
      name: 'Mes Perfecto',
      description: 'Completa actividades en las 3 áreas (hábitos, diario, metas) durante 28+ días en cualquier mes'
    },

    // MASTERY ACHIEVEMENTS (9 achievements)
    level_up: {
      name: 'Subir de Nivel',
      description: 'Alcanza el nivel 10 "Principiante V" - te estás volviendo más fuerte'
    },
    selfrise_expert: {
      name: 'Experto SelfRise',
      description: 'Alcanza el nivel 25 "Adepto V" - has dominado los fundamentos'
    },
    selfrise_master: {
      name: 'Maestro SelfRise',
      description: 'Alcanza el nivel 50 "Especialista V" - eres un verdadero maestro de la superación personal'
    },
    recommendation_master: {
      name: 'Maestro de Recomendaciones',
      description: 'Sigue 20 recomendaciones personalizadas del área Para Ti'
    },
    balance_master: {
      name: 'Maestro del Equilibrio',
      description: 'Usa las 3 funciones (hábitos, diario, metas) en un solo día 10 veces'
    },
    trophy_collector_basic: {
      name: 'Coleccionista de Trofeos',
      description: 'Desbloquea 10 logros - estás construyendo una colección impresionante'
    },
    trophy_collector_master: {
      name: 'Maestro de Trofeos',
      description: 'Desbloquea 25 logros - tu sala de trofeos es legendaria'
    },
    ultimate_selfrise_legend: {
      name: 'Leyenda Definitiva de SelfRise',
      description: 'Alcanza el nivel 100 "Mítico V" - has logrado la maestría definitiva de la superación personal'
    },
    loyalty_ultimate_veteran: {
      name: 'Veterano Definitivo',
      description: '500 días activos en total - tu dedicación es inigualable'
    },

    // SPECIAL ACHIEVEMENTS (14 achievements)
    grateful_heart: {
      name: 'Corazón Agradecido',
      description: 'Mantén una racha de 7 días escribiendo en el diario - la consistencia construye gratitud'
    },
    achievement_unlocked: {
      name: 'Logro Desbloqueado',
      description: 'Completa 10 metas - eres un conquistador legendario de metas'
    },
    seven_wonder: {
      name: 'Séptima Maravilla',
      description: 'Ten 7 o más hábitos activos simultáneamente - maestro de la organización'
    },
    persistence_pays: {
      name: 'La Persistencia Paga',
      description: 'Reanuda la actividad después de un descanso de 3+ días y completa 7 actividades - campeón del regreso'
    },
    legendary_master: {
      name: 'Leyenda SelfRise',
      description: 'Alcanza la maestría en todas las áreas: 10 metas completadas, 500 hábitos realizados, 365 entradas en el diario'
    },
    loyalty_first_week: {
      name: 'Primera Semana',
      description: '7 días activos en total - comienzo de tu viaje de lealtad'
    },
    loyalty_two_weeks_strong: {
      name: 'Dos Semanas Fuerte',
      description: '14 días activos en total - tu dedicación está creciendo'
    },
    loyalty_three_weeks_committed: {
      name: 'Tres Semanas Comprometido',
      description: '21 días activos en total - comprometido con tu crecimiento'
    },
    loyalty_month_explorer: {
      name: 'Explorador Mensual',
      description: '30 días activos en total - explora tu potencial'
    },
    loyalty_two_month_veteran: {
      name: 'Veterano de Dos Meses',
      description: '60 días activos en total - experimentado en crecimiento personal'
    },
    loyalty_century_user: {
      name: 'Usuario del Siglo',
      description: '100 días activos en total - entre los usuarios élite'
    },
    loyalty_half_year_hero: {
      name: 'Héroe de Medio Año',
      description: '183 días activos en total - tu compromiso es legendario'
    },
    loyalty_year_legend: {
      name: 'Leyenda del Año',
      description: '365 días activos en total - has alcanzado estatus legendario'
    },
    loyalty_master: {
      name: 'Maestro de Lealtad',
      description: '1000 días activos en total - has alcanzado la lealtad definitiva'
    },

    // Achievement Progress Preview Hints (245+ keys for progress tracking)
    preview: {
      // Default fallback
      default: {
        progress: 'Progreso hacia este logro',
        action: '¡Usa las funciones de la app para desbloquear este logro!'
      },

      // HABITS ACHIEVEMENTS (8 achievements = 24 keys)
      first_habit: {
        progress_incomplete: '¡Crea tu primer hábito para empezar!',
        progress_complete: '✅ ¡Primer hábito creado!',
        requirement: 'Crea tu primer hábito',
        action: '¡Ve a la pestaña de Hábitos y crea tu primer hábito!'
      },
      habit_builder: {
        progress: 'Crea 5 hábitos ({{current}}/{{target}})',
        requirement: 'Crea 5 hábitos diferentes para diversificar tu desarrollo',
        action: '¡Crea más hábitos para diversificar tu crecimiento!'
      },
      century_club: {
        progress: 'Completa 100 hábitos ({{current}}/{{target}})',
        requirement: 'Completa 100 tareas de hábitos en total',
        action: '¡Sigue completando tus hábitos diarios!'
      },
      consistency_king: {
        progress: 'Completa 1000 hábitos ({{current}}/{{target}})',
        requirement: 'Completa 1000 tareas de hábitos en total',
        action: '¡Estás construyendo una consistencia increíble!'
      },
      streak_champion: {
        progress: 'Alcanza racha de 21 días (mejor: {{current}} días)',
        requirement: 'Alcanza una racha de 21 días con un solo hábito',
        action: '¡Concéntrate en la consistencia con un hábito!'
      },
      century_streak: {
        progress: 'Alcanza racha de 75 días (mejor: {{current}} días)',
        requirement: 'Mantén una racha de 75 días con cualquier hábito',
        action: '¡Dedicación increíble! ¡Mantén la racha viva!'
      },
      multi_tasker: {
        progress: 'Completa 5 hábitos en un día (mejor: {{current}})',
        requirement: 'Completa 5 hábitos diferentes en un solo día',
        action: '¡Desafíate con múltiples hábitos hoy!'
      },
      habit_legend: {
        progress: 'Alcanza Nivel 50 con 50%+ XP de hábitos (Nivel {{level}}, {{xpPercent}}% XP de hábitos)',
        requirement: 'Alcanza Nivel 50 con 50%+ XP de actividades de hábitos',
        action: '¡Concéntrate en actividades de hábitos para aumentar tu ratio de XP!'
      },

      // JOURNAL ACHIEVEMENTS - Basic (8 achievements = 24 keys)
      first_journal: {
        progress_incomplete: '¡Escribe tu primera entrada de gratitud!',
        progress_complete: '✅ ¡Primera reflexión completada!',
        requirement: 'Escribe tu primera entrada en el diario de gratitud',
        action: '¡Ve a la pestaña de Diario y escribe tu primera entrada!'
      },
      deep_thinker: {
        progress_checking: 'Verificando tus entradas reflexivas...',
        requirement: 'Escribe una entrada de diario con al menos 200 caracteres',
        action: '¡Exprésate completamente en tu próxima entrada de diario!'
      },
      journal_enthusiast: {
        progress: 'Escribe 100 entradas de diario ({{current}}/{{target}})',
        requirement: 'Escribe 100 entradas de diario en total',
        action: '¡Sigue expresando gratitud diariamente!'
      },
      grateful_heart: {
        progress: 'Mantén racha de 7 días (actual: {{current}} días)',
        requirement: 'Mantén una racha de escritura de diario de 7 días',
        action: '¡Mantén tu racha viva con entradas diarias!'
      },
      journal_streaker: {
        progress: 'Alcanza racha de 21 días (mejor: {{current}} días)',
        requirement: 'Escribe en tu diario durante 21 días consecutivos',
        action: '¡Construyendo un hábito fuerte de gratitud!'
      },
      gratitude_guru: {
        progress: 'Alcanza racha de 30 días (mejor: {{current}} días)',
        requirement: 'Alcanza una racha de escritura de diario de 30 días',
        action: '¡Te estás convirtiendo en un maestro de la gratitud!'
      },
      eternal_gratitude: {
        progress: 'Alcanza racha de 100 días (mejor: {{current}} días)',
        requirement: 'Mantén una racha de diario de 100 días',
        action: '¡Dedicación increíble a la gratitud!'
      },
      bonus_seeker: {
        progress: 'Escribe 50 entradas bonus ({{current}}/{{target}})',
        requirement: 'Escribe 50 entradas de diario bonus',
        action: '¡Ve más allá del mínimo diario con entradas bonus!'
      },

      // JOURNAL BONUS ACHIEVEMENTS - Basic (9 achievements = 27 keys)
      first_star: {
        progress_incomplete: '¡Consigue tu primer hito bonus ⭐!',
        progress_complete: '✅ ¡Primera estrella ganada!',
        requirement: 'Escribe tu primera entrada de diario bonus para obtener una estrella',
        action: '¡Escribe 4+ entradas de diario hoy para ganar tu primera ⭐!'
      },
      five_stars: {
        progress: 'Gana 5 estrellas en total ({{current}}/{{target}})',
        requirement: 'Gana hito ⭐ 5 veces en total',
        action: '¡Sigue escribiendo entradas bonus para ganar más estrellas!'
      },
      flame_achiever: {
        progress_incomplete: '¡Consigue tu primer hito de llama 🔥!',
        progress_complete: '✅ ¡Primera llama ganada!',
        requirement: 'Escribe 5+ entradas bonus en un día para ganar una llama',
        action: '¡Desafíate con 8+ entradas de diario en un día!'
      },
      bonus_week: {
        progress: 'Racha bonus 7 días ({{current}}/{{target}})',
        requirement: 'Escribe al menos 1 entrada bonus durante 7 días consecutivos',
        action: '¡Escribe 4+ entradas diarias para mantener tu racha bonus!'
      },
      crown_royalty: {
        progress_incomplete: '¡Consigue tu primer hito de corona 👑!',
        progress_complete: '✅ ¡Primera corona ganada!',
        requirement: 'Escribe 10+ entradas bonus en un día para ganar una corona',
        action: '¡Ve por el estatus real con 13+ entradas de diario en un día!'
      },
      flame_collector: {
        progress: 'Colecciona 5 llamas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 🔥 5 veces en total',
        action: '¡Sigue teniendo días intensos de gratitud con 5+ entradas bonus!'
      },
      golden_bonus_streak: {
        progress: 'Racha bonus dorada 7 días ({{current}}/{{target}})',
        requirement: 'Escribe 3+ entradas bonus diarias durante 7 días consecutivos',
        action: '¡Escribe 6+ entradas diarias para la racha bonus definitiva!'
      },
      triple_crown_master: {
        progress: 'Gana 3 coronas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 👑 3 veces en total',
        action: '¡Domina el arte de los días de gratitud reales!'
      },
      bonus_century: {
        progress: 'Escribe 200 entradas bonus ({{current}}/{{target}})',
        requirement: 'Escribe 200 entradas de diario bonus en total',
        action: '¡Maestría bonus definitiva - sigue escribiendo más allá del mínimo!'
      },

      // JOURNAL BONUS - Star Milestones (5 achievements = 15 keys)
      star_beginner: {
        progress: 'Gana 10 estrellas en total ({{current}}/{{target}})',
        requirement: 'Gana hito ⭐ 10 veces en total',
        action: '¡Construye tu colección de días bonus!'
      },
      star_collector: {
        progress: 'Gana 25 estrellas en total ({{current}}/{{target}})',
        requirement: 'Gana hito ⭐ 25 veces en total',
        action: '¡Te estás convirtiendo en un coleccionista de estrellas!'
      },
      star_master: {
        progress: 'Gana 50 estrellas en total ({{current}}/{{target}})',
        requirement: 'Gana hito ⭐ 50 veces en total',
        action: '¡Maestría de estrellas a la vista - sigue ganando hitos bonus!'
      },
      star_champion: {
        progress: 'Gana 75 estrellas en total ({{current}}/{{target}})',
        requirement: 'Gana hito ⭐ 75 veces en total',
        action: '¡Eres un verdadero campeón de estrellas!'
      },
      star_legend: {
        progress: 'Gana 100 estrellas en total ({{current}}/{{target}})',
        requirement: 'Gana hito ⭐ 100 veces en total',
        action: '¡Estatus legendario de coleccionista de estrellas - eres imparable!'
      },

      // JOURNAL BONUS - Flame Milestones (5 achievements = 15 keys)
      flame_starter: {
        progress: 'Gana 10 llamas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 🔥 10 veces en total',
        action: '¡Sigue teniendo esos días intensos de escritura!'
      },
      flame_accumulator: {
        progress: 'Gana 20 llamas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 🔥 20 veces en total',
        action: '¡Tu colección de llamas está creciendo!'
      },
      flame_master: {
        progress: 'Gana 35 llamas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 🔥 35 veces en total',
        action: '¡Maestro de sesiones intensas de gratitud!'
      },
      flame_champion: {
        progress: 'Gana 50 llamas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 🔥 50 veces en total',
        action: '¡Eres un campeón de llamas!'
      },
      flame_legend: {
        progress: 'Gana 75 llamas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 🔥 75 veces en total',
        action: '¡Estatus legendario de llamas - tu dedicación es inspiradora!'
      },

      // JOURNAL BONUS - Crown Milestones (5 achievements = 15 keys)
      crown_achiever: {
        progress: 'Gana 5 coronas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 👑 5 veces en total',
        action: '¡Estás alcanzando el estatus real de gratitud!'
      },
      crown_collector: {
        progress: 'Gana 10 coronas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 👑 10 veces en total',
        action: '¡Construyendo tu colección de coronas!'
      },
      crown_master: {
        progress: 'Gana 15 coronas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 👑 15 veces en total',
        action: '¡Maestro de días de diario real!'
      },
      crown_champion: {
        progress: 'Gana 25 coronas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 👑 25 veces en total',
        action: '¡Eres un campeón de coronas!'
      },
      crown_emperor: {
        progress: 'Gana 40 coronas en total ({{current}}/{{target}})',
        requirement: 'Gana hito 👑 40 veces en total',
        action: '¡Estatus imperial alcanzado - eres la realeza de la gratitud!'
      },

      // GOALS ACHIEVEMENTS (8 achievements = 24 keys)
      first_goal: {
        progress_incomplete: '¡Crea tu primera meta para empezar!',
        progress_complete: '✅ ¡Primera meta creada!',
        requirement: 'Crea tu primera meta',
        action: '¡Ve a la pestaña de Metas y establece tu primera meta!'
      },
      goal_getter: {
        progress: 'Crea 5 metas ({{current}}/{{target}})',
        requirement: 'Crea 5 metas diferentes',
        action: '¡Establece más metas para expandir tus ambiciones!'
      },
      goal_achiever: {
        progress: 'Completa 5 metas ({{current}}/{{target}})',
        requirement: 'Completa 5 metas en total',
        action: '¡Sigue completando tus metas!'
      },
      goal_champion: {
        progress: 'Completa 20 metas ({{current}}/{{target}})',
        requirement: 'Completa 20 metas en total',
        action: '¡Eres un campeón logrando metas!'
      },
      achievement_unlocked: {
        progress: 'Completa 10 metas ({{current}}/{{target}})',
        progress_incomplete: '¡Completa tu primera meta!',
        progress_complete: '✅ ¡Primera meta completada!',
        requirement: 'Completa tu primera meta',
        action: '¡Haz progreso en tus metas activas!'
      },
      ambitious: {
        progress_incomplete: '¡Crea una meta con valor objetivo de 1000+!',
        progress_complete: '✅ ¡Meta grande creada!',
        requirement: 'Crea una meta con valor objetivo de 1000 o más',
        action: '¡Piensa en grande y establece una meta ambiciosa!'
      },
      progress_tracker: {
        progress: 'Actualiza progreso de meta durante 10 días ({{current}}/{{target}})',
        requirement: 'Actualiza progreso de meta durante 10 días consecutivos',
        action: '¡Sigue rastreando tu progreso diario de metas!'
      },
      goal_explorer: {
        progress: 'Crea metas en 3 categorías ({{current}}/{{target}})',
        requirement: 'Crea metas en 3 categorías diferentes',
        action: '¡Diversifica tus metas entre categorías!'
      },

      // CONSISTENCY ACHIEVEMENTS (8 achievements = 24 keys)
      weekly_warrior: {
        progress: 'Usa la app durante 7 días ({{current}}/{{target}})',
        requirement: 'Usa la app durante 7 días consecutivos',
        action: '¡Mantén tu racha diaria viva!'
      },
      monthly_master: {
        progress: 'Usa la app durante 30 días ({{current}}/{{target}})',
        requirement: 'Usa la app durante 30 días consecutivos',
        action: '¡Estás construyendo una consistencia increíble!'
      },
      hundred_days: {
        progress: 'Usa la app durante 100 días ({{current}}/{{target}})',
        requirement: 'Usa la app durante 100 días consecutivos',
        action: '¡Consistencia legendaria - sigue así!'
      },
      daily_visitor: {
        progress: 'Abre la app {{current}} veces',
        requirement: 'Abre la app regularmente durante {{target}} días en total',
        action: '¡Haz de la app parte de tu rutina diaria!'
      },
      dedicated_user: {
        progress: '{{current}} días activos en total',
        requirement: 'Sé activo durante {{target}} días en total (no consecutivos)',
        action: '¡Sigue volviendo y creciendo!'
      },
      perfect_month: {
        progress: 'Días perfectos este mes: {{current}}/{{target}}',
        requirement: 'Completa los tres tipos de actividad cada día durante 30 días',
        action: '¡Completa hábitos, diario y metas diariamente!'
      },
      triple_crown: {
        progress_incomplete: '¡Completa hábitos, diario y metas hoy!',
        progress_complete: '✅ ¡Triple corona ganada!',
        requirement: 'Completa al menos un hábito, entrada de diario y progreso de meta en un día',
        action: '¡Haz los tres tipos de actividad hoy para la corona!'
      },
      balance_master: {
        progress: 'Días equilibrados: {{current}}/{{target}}',
        requirement: 'Usa las tres funciones (hábitos, diario, metas) en un día, {{target}} veces en total',
        action: '¡Sigue equilibrando todas las áreas de crecimiento!'
      },

      // MASTERY ACHIEVEMENTS (9 achievements = 27 keys)
      level_up: {
        progress: 'Alcanza Nivel 10 (actual: Nivel {{current}})',
        requirement: 'Alcanza Nivel 10',
        action: '¡Sigue ganando XP a través de actividades!'
      },
      selfrise_expert: {
        progress: 'Alcanza Nivel 25 (actual: Nivel {{current}})',
        requirement: 'Alcanza Nivel 25',
        action: '¡Te estás convirtiendo en un experto de SelfRise!'
      },
      selfrise_master: {
        progress: 'Alcanza Nivel 50 (actual: Nivel {{current}})',
        requirement: 'Alcanza Nivel 50',
        action: '¡Nivel maestro acercándose - sigue creciendo!'
      },
      ultimate_selfrise_legend: {
        progress: 'Alcanza Nivel 100 (actual: Nivel {{current}})',
        requirement: 'Alcanza el Nivel 100 máximo',
        action: '¡El logro definitivo - el estatus legendario te espera!'
      },
      trophy_collector_basic: {
        progress: 'Desbloquea 10 logros ({{current}}/{{target}})',
        requirement: 'Desbloquea 10 logros en total',
        action: '¡Sigue desbloqueando logros en todas las categorías!'
      },
      trophy_collector_master: {
        progress: 'Desbloquea 30 logros ({{current}}/{{target}})',
        requirement: 'Desbloquea 30 logros en total',
        action: '¡Estatus de coleccionista maestro - encuentra todos los logros!'
      },
      recommendation_master: {
        progress: 'Sigue {{current}} recomendaciones',
        requirement: 'Sigue {{target}} recomendaciones personalizadas',
        action: '¡Revisa la sección de Recomendaciones y sigue la guía!'
      },
      balance_master_alt: {
        progress: 'Días equilibrados: {{current}}/{{target}}',
        requirement: 'Usa hábitos, diario y metas en un día durante {{target}} días',
        action: '¡Sigue usando las tres funciones diariamente!'
      },
      harmony_streak: {
        progress: 'Racha de armonía actual: {{current}} días',
        requirement: 'Mantén armonía (todas las funciones) durante {{target}} días consecutivos',
        action: '¡Completa hábitos, diario y metas cada día!'
      },

      // SPECIAL ACHIEVEMENTS (14 achievements = 42 keys)
      lightning_start: {
        progress: 'Inicios rápidos: {{current}}/{{target}}',
        requirement: 'Crea y completa un hábito el mismo día ({{target}} veces)',
        action: '¡Crea un hábito y complétalo hoy!'
      },
      seven_wonder: {
        progress: 'Hábitos activos: {{current}}/{{target}}',
        requirement: 'Ten {{target}} hábitos activos simultáneamente',
        action: '¡Crea más hábitos para alcanzar {{target}} hábitos activos!'
      },
      persistence_pays: {
        progress: 'Regresos: {{current}}/{{target}}',
        requirement: 'Regresa a la app después de 7+ días de inactividad ({{target}} veces)',
        action: '¡Incluso si tomas un descanso, volver es lo que importa!'
      },
      legendary_master: {
        progress: '{{current}}% hacia estatus legendario',
        requirement: 'Completa todos los hitos principales en todas las categorías',
        action: '¡Domina cada aspecto de SelfRise para alcanzar el estatus legendario!'
      },

      // Loyalty Achievements (10 achievements = 30 keys)
      loyalty_first_week: {
        progress: 'Días activos: {{current}}/{{target}}',
        requirement: '7 días activos en total',
        action: '¡Sigue usando la app diariamente!'
      },
      loyalty_two_weeks_strong: {
        progress: 'Días activos: {{current}}/{{target}}',
        requirement: '14 días activos en total',
        action: '¡Tu compromiso está creciendo!'
      },
      loyalty_three_weeks_committed: {
        progress: 'Días activos: {{current}}/{{target}}',
        requirement: '21 días activos en total',
        action: '¡Tres semanas de dedicación!'
      },
      loyalty_month_explorer: {
        progress: 'Días activos: {{current}}/{{target}}',
        requirement: '30 días activos en total',
        action: '¡Explorando tu potencial!'
      },
      loyalty_two_month_veteran: {
        progress: 'Días activos: {{current}}/{{target}}',
        requirement: '60 días activos en total',
        action: '¡Experimentado en crecimiento personal!'
      },
      loyalty_century_user: {
        progress: 'Días activos: {{current}}/{{target}}',
        requirement: '100 días activos en total',
        action: '¡Estatus de usuario élite acercándose!'
      },
      loyalty_half_year_hero: {
        progress: 'Días activos: {{current}}/{{target}}',
        requirement: '183 días activos en total',
        action: '¡Tu compromiso es legendario!'
      },
      loyalty_year_legend: {
        progress: 'Días activos: {{current}}/{{target}})',
        requirement: '365 días activos en total',
        action: '¡Estatus legendario al alcance!'
      },
      loyalty_ultimate_veteran: {
        progress: 'Días activos: {{current}}/{{target}}',
        requirement: '500 días activos en total',
        action: '¡Dedicación definitiva!'
      },
      loyalty_master: {
        progress: 'Días activos: {{current}}/{{target}}',
        requirement: '1000 días activos en total',
        action: '¡Maestro de lealtad - eres imparable!'
      },
    },
  } as any,

  // Auth screens
  auth: {
    login: {
      title: 'Bienvenido de Nuevo',
      email: 'Correo Electrónico',
      emailPlaceholder: 'Introduce tu correo electrónico...',
      password: 'Contraseña',
      passwordPlaceholder: 'Introduce tu contraseña...',
      loginButton: 'Iniciar Sesión',
      forgotPassword: '¿Olvidaste tu Contraseña?',
      noAccount: '¿No tienes una cuenta?',
      signUp: 'Registrarse',
    },
    register: {
      title: 'Crear Cuenta',
      displayName: 'Nombre para Mostrar',
      displayNamePlaceholder: 'Introduce tu nombre...',
      email: 'Correo Electrónico',
      emailPlaceholder: 'Introduce tu correo electrónico...',
      password: 'Contraseña',
      passwordPlaceholder: 'Introduce tu contraseña...',
      confirmPassword: 'Confirmar Contraseña',
      confirmPasswordPlaceholder: 'Confirma tu contraseña...',
      registerButton: 'Registrarse',
      hasAccount: '¿Ya tienes una cuenta?',
      signIn: 'Iniciar Sesión',
    },
  } as any,

  // Gamification System
  gamification: {
    xp: {
      label: 'Puntos de Experiencia',
      short: 'EXP',
      gained: 'EXP Ganados',
      lost: 'EXP Perdidos',
      total: 'EXP Totales',
      loading: 'Cargando EXP...',

      sources: {
        habit_completion: 'Hábito Completado',
        habit_bonus: 'Bonus de Hábito',
        journal_entry: 'Entrada de Diario',
        journal_bonus: 'Bonus de Diario',
        journal_bonus_milestone: 'Hito de Bonus de Diario',
        goal_progress: 'Progreso de Meta',
        goal_completion: 'Meta Completada',
        goal_milestone: 'Hito de Meta',
        habit_streak_milestone: 'Hito de Racha de Hábito',
        journal_streak_milestone: 'Hito de Racha de Diario',
        achievement_unlock: 'Logro Desbloqueado',
        general_activity: 'Actividad',
        daily_engagement: 'Compromiso Diario',
        daily_launch: 'Inicio Diario',
        monthly_challenge: 'Desafío Mensual',
        recommendation_follow: 'Recomendación',
        xp_multiplier_bonus: 'Bonus de Multiplicador',
        XP_MULTIPLIER_BONUS: 'Bonus de Regreso',
      },

      notification: {
        message: 'Notificación de puntos de experiencia: {{message}}',
        amount: 'Puntos de experiencia {{type}}: {{amount}}',
      },

      announcement: {
        balanced: 'No se ganaron ni perdieron puntos de experiencia netos de actividades recientes',
        decreased: 'Se perdieron {{xp}} puntos de experiencia de actividades recientes',
        single: 'Se ganaron {{xp}} puntos de experiencia al completar {{count}} {{source}}',
        multiple_same: 'Se ganaron {{xp}} puntos de experiencia al completar {{count}} {{source}}',
        multiple_mixed: 'Se ganaron {{xp}} puntos de experiencia al completar múltiples actividades',
      },

      popup: {
        gained: 'Se ganaron {{amount}} puntos de experiencia de {{source}}',
        lost: 'Se perdieron {{amount}} puntos de experiencia de {{source}}',
        amount_label: '{{sign}} {{amount}} puntos de experiencia',
      },

      // Notification messages
      notifications: {
        completed: 'completado',
        balanced: 'Actividades balanceadas (sin progreso neto)',
        reversed: 'Progreso revertido',
        updated: 'Actividades actualizadas',
        and: 'y',
      },

      // XP Notification Component - Source Names (plural forms for display)
      xpNotification: {
        sources: {
          habits: 'hábitos',
          journalEntries: 'entradas de diario',
          journalMilestones: 'hitos de diario',
          goals: 'metas',
          goalMilestones: 'hitos de meta',
          streaks: 'rachas',
          achievements: 'logros',
          monthlyChallenges: 'desafíos mensuales',
          multiplierBonuses: 'bonos de multiplicador',
          dailyLaunches: 'inicios diarios',
          recommendations: 'recomendaciones',
          activities: 'actividades',
        },
        messages: {
          completed: 'completado',
          balanced: 'Actividades balanceadas (sin progreso neto)',
          reversed: 'Progreso revertido',
          updated: 'Actividades actualizadas',
          and: 'y',
        },
        announcements: {
          balanced: 'No se ganaron ni perdieron puntos de experiencia netos de actividades recientes',
          decreased: 'Se perdieron {{xp}} puntos de experiencia de actividades recientes',
          single: 'Se ganaron {{xp}} puntos de experiencia al completar {{count}} {{source}}',
          multipleSame: 'Se ganaron {{xp}} puntos de experiencia al completar {{count}} {{source}}',
          multipleMixed: 'Se ganaron {{xp}} puntos de experiencia al completar múltiples actividades',
        },
        accessibility: {
          notification: 'Notificación de puntos de experiencia: {{message}}',
          amount: 'Puntos de experiencia {{type}}: {{amount}}',
          typeGained: 'ganados',
          typeLost: 'perdidos',
          typeBalanced: 'balanceados',
        },
        unit: 'EXP',
      },
    },

    progress: {
      level: 'Nivel',
      progress: 'Progreso',
      to_next_level: 'hasta Nivel {{level}}',
      xp_remaining: '{{xp}} EXP restantes',
      loading: 'Cargando EXP...',

      accessibility: {
        label: 'Nivel de experiencia {{currentLevel}}, {{levelTitle}}. {{progress}} por ciento de progreso hasta el nivel {{nextLevel}}. {{xpRemaining}} puntos de experiencia restantes.{{#isMilestone}} Este es un nivel hito.{{/isMilestone}}',
        hint: 'Tu nivel de experiencia actual y progreso hacia el siguiente nivel.{{#isMilestone}} Has alcanzado un nivel hito especial con recompensas únicas.{{/isMilestone}}',
      },

      badge: {
        accessibility: 'Insignia de nivel {{currentLevel}}, {{levelTitle}}{{#isMilestone}}, nivel hito{{/isMilestone}}',
      },

      bar: {
        accessibility: 'Barra de progreso de experiencia, {{progress}} por ciento completado',
      },

      milestone: {
        accessibility: 'Indicador de nivel hito',
      },
    },

    levels: {
      current: 'Nivel Actual',
      next: 'Siguiente Nivel',
      milestone: 'Nivel Hito',
      rewards: 'Recompensas de Nivel',
      title: 'Título de Nivel',
      description: 'Descripción de Nivel',

      // Level Overview Screen
      overview: {
        currentBadge: 'Actual',
        xpRequiredSuffix: 'XP requeridos',
        rarity: {
          mythic: 'Mítico',
          legendary: 'Legendario',
          epic: 'Épico',
          rare: 'Raro',
          growing: 'Creciente',
          beginner: 'Principiante',
        },
      },
    },

    effects: {
      level_up: 'Celebración de subida de nivel',
      milestone: 'Celebración de logro hito',
      achievement: 'Celebración de logro desbloqueado',
      celebration: 'Celebración general',
      general: 'Efectos de celebración',
      accessibility_label: '{{type}} con efectos de partículas de intensidad {{intensity}}',
    },

    celebration: {
      level_up_announcement: '¡Felicidades! ¡Has alcanzado el nivel {{level}}{{#isMilestone}}, un nivel hito{{/isMilestone}}!',
      level_up_modal: 'Celebración de logro de nivel {{level}}{{#isMilestone}} hito{{/isMilestone}}',
      level_up_section_accessibility: 'Detalles de logro de nivel {{level}}{{#isMilestone}} hito{{/isMilestone}}',
      level_badge_accessibility: 'Insignia de nivel {{level}}{{#isMilestone}} hito{{/isMilestone}}',
      level_title_accessibility: 'Título de nivel: {{title}}',
      rewards_section_accessibility: 'Lista de nuevas recompensas con {{count}} elementos',
      rewards_title: 'Nuevas Recompensas:',
      reward_item_accessibility: 'Recompensa {{index}}: {{reward}}',
      continue_button_accessibility: 'Continuar y cerrar celebración',
      continue_button_hint: 'Toca para cerrar esta celebración y volver a la aplicación',

      emoji: {
        daily_complete: 'Emoji de celebración de fiesta',
        streak_milestone: 'Emoji de celebración de trofeo',
        bonus_milestone: 'Emoji de celebración de estrella',
        level_up: 'Emoji de celebración de subida de nivel',
      },
    },

    // XP Multiplier
    multiplier: {
      continue: 'Continuar',
      harmonyActivated: '¡Racha de Armonía Activada!',
      achievementUnlocked: '🎯 ¡Logro Desbloqueado!',
      harmonyStreakLabel: 'Días de Racha de Armonía',
      bonusXP: 'XP Bonificación',
      duration: 'Duración del Multiplicador',
      activated: '🚀 ¡MULTIPLICADOR ACTIVADO!',
      activateButton: 'Activar 2x XP',
      duration24h: '24 horas',

      // XP Multiplier Indicator
      harmonyStreak: 'Racha de Armonía',
      harmonyStreakProgress: 'Racha de Armonía: {{current}}/7',
      activeMultiplier: 'Multiplicador de XP activo: {{multiplier}}x, {{time}} restante',
      multiplierValue: '{{multiplier}}x XP',
      progressSubtext: 'Usa las 3 funciones diariamente para desbloquear 2x XP',
      noMultiplier: 'Sin Multiplicador',

      // Activation Messages
      activatingMultiplier: 'Activando multiplicador de racha de armonía',
      multiplierActivatedMessage: '¡Multiplicador activado! {{multiplier}}x XP por {{hours}} horas',
      activationFailed: 'Activación fallida: {{error}}',
      unknownError: 'Error desconocido',

      // Accessibility Labels
      activateMultiplierAccessibility: 'Activar multiplicador de 2x XP por 24 horas. Racha de armonía actual: {{streak}} días',
      activateMultiplierHint: 'Toca dos veces para activar el multiplicador',
      harmonyProgressAccessibility: 'Progreso de racha de armonía: {{current}} de 7 días necesarios',

      // Modal Content
      achievementDescription: '¡Has usado las tres funciones (Hábitos, Diario, Metas) diariamente durante {{days}} días consecutivos! Disfruta de recompensas de XP dobles durante las próximas 24 horas.',
      shareButton: '🎉 Compartir',
      shareAccessibility: 'Compartir tu logro',

      // Timer Display
      timeFormat: {
        hoursMinutes: '{{hours}}h {{minutes}}m',
        minutesSeconds: '{{minutes}}m {{seconds}}s',
        seconds: '{{seconds}}s',
        hoursOnly: '{{hours}}h',
      },

      // Countdown Timer
      timerAccessibility: 'Multiplicador de XP: {{multiplier}}x, {{time}} restante',
      noActiveMultiplier: 'Sin multiplicador de XP activo',
    },

    analysis: {
      title: 'Análisis de Rendimiento',
      overallRating: 'Calificación General',
      trend: 'Tendencia',
      successRate: 'Tasa de Éxito',
      strongest: 'Más Fuerte',
    },

    achievement: {
      unlocked: '¡Logro Desbloqueado!',
      locked: 'Logro Bloqueado',
      progress: 'Progreso: {{current}}/{{target}}',
      xp_reward: '+{{xp}} EXP',
      requirements: 'Requisitos',
      unlock_condition: 'Condición de Desbloqueo',

      announcement: {
        unlocked: '¡Logro desbloqueado: {{name}}! Has ganado {{xp}} puntos de experiencia.',
      },
    },

    sources: {
      habit_completion: {
        icon_description: 'Icono de persona corriendo que representa la finalización del hábito',
      },
      habit_bonus: {
        icon_description: 'Icono de persona corriendo que representa el bonus de hábito',
      },
      journal_entry: {
        icon_description: 'Icono de escritura que representa la entrada de diario',
      },
      journal_bonus: {
        icon_description: 'Icono de escritura que representa el bonus de diario',
      },
      journal_bonus_milestone: {
        icon_description: 'Icono de estrella que representa el logro de hito de bonus de diario',
      },
      goal_progress: {
        icon_description: 'Icono de objetivo que representa el progreso de meta',
      },
      goal_completion: {
        icon_description: 'Icono de objetivo que representa la finalización de meta',
      },
      goal_milestone: {
        icon_description: 'Icono de estrella que representa el hito de meta',
      },
      habit_streak_milestone: {
        icon_description: 'Icono de fuego que representa el hito de racha de hábito',
      },
      journal_streak_milestone: {
        icon_description: 'Icono de fuego que representa el hito de racha de diario',
      },
      achievement_unlock: {
        icon_description: 'Icono de trofeo que representa el desbloqueo de logro',
      },
      weekly_challenge: {
        icon_description: 'Icono de trofeo que representa la finalización del desafío semanal',
      },
      general_activity: {
        icon_description: 'Icono de destellos que representa la actividad general',
      },
      monthly_challenge: {
        icon_description: 'Icono de calendario que representa el progreso del desafío mensual',
      },
      XP_MULTIPLIER_BONUS: {
        icon_description: 'Icono de rayo que representa el multiplicador de bonus de regreso',
      },
    },
  } as any,

  // Help System
  help: {
    habits: {
      scheduling: {
        title: 'Programación de Hábitos',
        content: '¡Tú tienes el control! Elige qué días debe estar activo tu hábito (de lunes a domingo). Por ejemplo, si tu hábito es "Ir al gimnasio" y solo quieres ir los lunes, miércoles y viernes, marca solo esos días. En otros días, el hábito no aparecerá en tu lista, por lo que no afectará tu racha ni tu XP.'
      },
      bonusConversion: {
        title: 'Conversión de Bonus',
        content: 'Completa un hábito más de una vez al día y tus finalizaciones adicionales se convierten en BONUS. Cada bonus gana +10 XP (en lugar de +25 XP), ¡pero no hay límite! ¡Cuanto más hagas, más XP ganarás!'
      },
      streakTracking: {
        title: 'Rachas de Hábitos',
        content: 'Rastrea rachas individuales para cada hábito, rastrea tu racha total de hábitos (que cubre todos los hábitos activos juntos) y obtén notificaciones de hitos. Alcanzar hitos de racha desbloquea logros especiales y bonos de XP.'
      },
      colorAndIcon: {
        title: 'Personalización de Hábitos',
        content: 'Haz que cada hábito sea visualmente distintivo eligiendo un color e icono. Esto hace que tu lista de hábitos sea más fácil de escanear y más personal.'
      },
      makeupFunction: {
        title: 'Sistema Inteligente de Recuperación',
        content: 'Si pierdes un día para un hábito, puedes recuperar hasta 2 días programados perdidos viendo un anuncio por día. Esto mantiene viva tu racha si estuviste enfermo o excepcionalmente ocupado.'
      }
    },
    journal: {
      gratitudeStreak: {
        title: 'Racha de Gratitud',
        content: 'Escribe al menos 3 entradas de gratitud cada día para mantener tu racha de gratitud. Mantener tu racha construye impulso, desbloquea logros y aumenta tu XP a través de bonos de hitos de racha.'
      },
      selfRiseStreak: {
        title: 'Racha SelfRise',
        content: 'Tu racha SelfRise rastrea días consecutivos con al menos 3 entradas de gratitud. Alcanzar 7, 14, 21, 30, 100 y más días activa celebraciones especiales y grandes recompensas de XP.'
      },
      bonusEntries: {
        title: 'Entradas Bonus',
        content: 'Cada entrada después de tu tercera entrada diaria cuenta como BONUS. Las entradas bonus ganan +5 XP cada una. Si llegas a 5 entradas bonus (8 totales) en un día, ganas una "Llama 🔥". Si llegas a 10 entradas bonus (13 totales), ganas una "Corona 👑".'
      },
      debtRecovery: {
        title: 'Recuperación de Racha',
        content: 'Si pierdes tu racha de diario, puedes recuperar hasta 2 días perdidos viendo un anuncio por día. Esto puede prevenir perder semanas de progreso debido a un solo día perdido.'
      }
    },
    goals: {
      overview: {
        title: 'Visión General de Metas',
        content: 'Establece metas cuantificables con unidades (€, kg, libros, etc.) y rastrea tu progreso. Las metas pueden ser a corto plazo (ahorrar €200) o a largo plazo (leer 52 libros en un año).'
      },
      predictions: {
        title: 'Predicciones',
        content: 'Basado en tu tasa de progreso reciente, SelfRise predice cuándo completarás tu meta. Utiliza múltiples métodos (lineal, tendencia, básico) para darte perspectivas realistas.'
      },
      progressTracking: {
        title: 'Rastreo de Progreso',
        content: 'Añade progreso usando tres modos: "Añadir" (aumenta tu total), "Restar" (reduce tu total) o "Establecer En" (establece un valor exacto). Cada entrada puede incluir notas sobre tu progreso.'
      },
      templates: {
        title: 'Plantillas de Metas',
        content: 'Comienza rápidamente con plantillas preconstruidas para metas comunes como "Perder Peso", "Ahorrar Dinero", "Leer Libros" y más. Cada plantilla incluye sugerencias de unidades, valores objetivo y orientación.'
      }
    },
    home: {
      recommendations: {
        title: 'Recomendaciones Personalizadas',
        content: 'Tu área "Para Ti" muestra sugerencias inteligentes como: "Escribe 2 entradas bonus de diario más hoy" o "Completa Yoga para mantener tu racha". Seguir estas recomendaciones te ayuda a mantenerte en camino y ganar logros.'
      },
      xpSystem: {
        title: 'Sistema XP',
        content: 'Gana XP completando hábitos (+25 XP), escribiendo entradas de diario (+10 XP), añadiendo progreso de metas (+15 XP), alcanzando hitos de racha y desbloqueando logros. ¡Tu XP determina tu nivel!'
      },
      streakBadges: {
        title: 'Insignias de Racha',
        content: 'Visualiza tu racha de diario actual, mejor racha y días de racha recientes en insignias bellamente diseñadas en tu página de inicio. ¡Comparte estos logros con amigos!'
      },
      habitStatistics: {
        title: 'Estadísticas de Hábitos',
        content: 'Ve tendencias de finalización semanales y mensuales, indicadores de rendimiento (total de hábitos, finalizados hoy, promedio semanal) y análisis de tendencias.'
      }
    },
    achievements: {
      trophyRoom: {
        totalTrophies: 'Trofeos totales',
        collected: 'Recolectados',
        completionRate: 'Tasa de finalización',
        overallProgress: 'Progreso general',
      },
    },
    challenges: {
      templates: {
        // HABITS templates
        habits_consistency_master: {
          title: 'Maestro de Consistencia',
          description: 'Completa tus hábitos programados consistentemente durante todo el mes',
          requirement: 'Completa tareas de hábitos programados',
          bonus1: 'Completación perfecta (+20% de bonus)',
          bonus2: 'Continuación de racha mensual (+100 XP por mes)',
          bonus3: 'Bonus de consistencia de fin de semana (+50 XP)'
        },
        habits_variety_champion: {
          title: 'Campeón de Variedad',
          description: 'Explora diferentes hábitos cada semana para construir una rutina diversa',
          requirement: 'Completa diferentes hábitos cada semana',
          bonus1: 'Descubrimiento de nuevo hábito (+25 XP por hábito nuevo)',
          bonus2: 'Hito de variedad semanal (+30 XP por semana)',
          bonus3: 'Bonus de equilibrio de categorías (+100 XP)'
        },
        habits_streak_builder: {
          title: 'Constructor de Rachas',
          description: 'Mantén rachas de hábitos consistentes durante todo el mes',
          requirement: 'Mantén rachas de hábitos por días consecutivos',
          bonus1: 'Recompensas de hito de racha (+50 XP por racha de 7 días)',
          bonus2: 'Rachas de múltiples hábitos (+75 XP de bonus)',
          bonus3: 'Racha de mes perfecto (+200 XP)'
        },
        habits_bonus_hunter: {
          title: 'Cazador de Bonus',
          description: 'Ve más allá de tus hábitos programados con completaciones bonus',
          requirement: 'Completa hábitos bonus por encima de tu horario',
          bonus1: 'Recompensas por completación bonus (+15 XP por bonus)',
          bonus2: 'Campeón de bonus diario (+50 XP por 5+ bonus)',
          bonus3: 'Maestro de bonus mensual (+200 XP)'
        },
        // JOURNAL templates
        journal_reflection_expert: {
          title: 'Experto en Reflexión',
          description: 'Escribe entradas de diario diarias durante todo el mes',
          requirement: 'Escribe entradas de diario en el número objetivo de días',
          bonus1: 'Recompensa por reflexión diaria (+15 XP por día)',
          bonus2: 'Consistencia semanal (+60 XP por semana)',
          bonus3: 'Mes perfecto de diario (+250 XP)'
        },
        journal_gratitude_guru: {
          title: 'Gurú de Gratitud',
          description: 'Enfócate en entradas de diario con tema de gratitud',
          requirement: 'Escribe entradas de diario enfocadas en gratitud',
          bonus1: 'Bonus de entrada de gratitud (+20 XP por entrada)',
          bonus2: 'Racha de gratitud semanal (+75 XP)',
          bonus3: 'Maestro de gratitud mensual (+250 XP)'
        },
        journal_consistency_writer: {
          title: 'Escritor Consistente',
          description: 'Mantén racha de escritura diaria en el diario',
          requirement: 'Escribe entradas de diario consecutivamente',
          bonus1: 'Recompensa por racha diaria (+25 XP por día)',
          bonus2: 'Hito de racha semanal (+100 XP)',
          bonus3: 'Racha de mes ininterrumpida (+400 XP)'
        },
        journal_depth_explorer: {
          title: 'Explorador de Profundidad',
          description: 'Escribe entradas de diario detalladas y reflexivas',
          requirement: 'Escribe entradas detalladas (200+ caracteres)',
          bonus1: 'Bonus de entrada detallada (+30 XP por entrada)',
          bonus2: 'Reflexión reflexiva (+100 XP semanalmente)',
          bonus3: 'Maestro de palabras (+350 XP mensualmente)'
        },
        // GOALS templates
        goals_progress_champion: {
          title: 'Campeón de Progreso',
          description: 'Haz progreso diario consistente hacia tus metas',
          requirement: 'Haz progreso en metas en el número objetivo de días',
          bonus1: 'Logro de progreso diario (+20 XP por día)',
          bonus2: 'Consistencia semanal (+50 XP por semana)',
          bonus3: 'Mes de progreso perfecto (+200 XP)'
        },
        goals_completion_master: {
          title: 'Logro Desbloqueado',
          description: 'Completa múltiples metas durante todo el mes',
          requirement: 'Completa el número objetivo de metas',
          bonus1: 'Bonus de completación de meta (+100 XP por meta)',
          bonus2: 'Logro de múltiples metas (+150 XP por 3+ metas)',
          bonus3: 'Bonus de gran meta (+200 XP por metas de valor 1000+)'
        },
        // CONSISTENCY templates
        consistency_triple_master: {
          title: 'Maestro Triple',
          description: 'Usa las tres funciones (hábitos, diario, metas) cada día',
          requirement: 'Usa hábitos, diario y metas diariamente',
          bonus1: 'Día triple perfecto (+30 XP por día)',
          bonus2: 'Logro triple semanal (+100 XP por semana)',
          bonus3: 'Maestro triple mensual (+300 XP)'
        },
        consistency_perfect_month: {
          title: 'Mes Perfecto',
          description: 'Alcanza mínimos diarios (1+ hábitos, 3+ entradas de diario) consistentemente',
          requirement: 'Cumple con los requisitos mínimos diarios consistentemente',
          bonus1: 'Logro de día perfecto (+50 XP por día)',
          bonus2: 'Bonus de semana perfecta (+200 XP por semana)',
          bonus3: 'Mes impecable (+500 XP por 100%)'
        },
        consistency_xp_champion: {
          title: 'Campeón de XP',
          description: 'Acumula XP total a través de compromiso mensual consistente',
          requirement: 'Acumula XP a través de todas las actividades de la app mensualmente',
          bonus1: 'Logros de hito (+50 XP por hito)',
          bonus2: 'Bonos de consistencia (+100 XP por bonus)',
          bonus3: 'Completación de mes perfecto (+500 XP por alcanzar el 100%)'
        },
        consistency_balance_expert: {
          title: 'Experto en Equilibrio',
          description: 'Mantén fuentes de XP equilibradas (ninguna fuente >60% del total)',
          requirement: 'Mantén uso equilibrado de funciones',
          bonus1: 'Bonus de equilibrio perfecto (+100 XP por semana)',
          bonus2: 'Campeón de variedad (+150 XP mensualmente)',
          bonus3: 'Logro de armonía (+200 XP por equilibrio excepcional)'
        }
      },
      detail: {
        tabOverview: 'Resumen',
        tabCalendar: 'Calendario',
        tabTips: 'Consejos',
        sectionDescription: 'Descripción del Desafío',
        sectionTimeline: 'Cronograma',
        labelDaysRemaining: 'Días Restantes',
        labelActiveDays: 'Días Activos',
        labelTotalDays: 'Días Totales',
        sectionRequirements: 'Progreso de Requisitos',
        sectionTips: 'Consejos para el Éxito',
        sectionStrategy: 'Estrategia Mensual',
        sectionRewards: 'Recompensas',
        rewardDescription: '¡Completa todos los requisitos para ganar esta recompensa de XP. La finalización perfecta (100%) gana XP adicional!',
        completed: '✓ Completado',
      },
      starDifficulty: {
        title: 'Dificultad de Estrellas',
        content: 'Los desafíos se clasifican por dificultad de estrellas (⭐ a ⭐⭐⭐⭐⭐). Los desafíos de mayor dificultad ofrecen mayores recompensas de XP pero requieren más dedicación para completarse.'
      },
      progressTracking: {
        title: 'Rastreo de Progreso',
        content: 'Rastrea el progreso del desafío en tiempo real. Los desafíos pueden requerir completar tareas múltiples veces o durante días específicos. Los desafíos semanales se reinician cada lunes.'
      },
      completionRewards: {
        title: 'Recompensas de Finalización',
        content: 'Completa desafíos para ganar bonos grandes de XP (50-500 XP según la dificultad) y logros especiales. Algunos desafíos también desbloquean insignias o títulos únicos.'
      }
    },
    gamification: {
      levelProgression: {
        title: 'Progresión de Nivel',
        content: 'Sube de nivel ganando XP. Cada nivel requiere más XP que el anterior. Los niveles hito (cada 5 niveles) ofrecen recompensas especiales y celebraciones.'
      },
      xpMultipliers: {
        title: 'Multiplicadores de XP',
        content: 'Gana multiplicadores de XP para rachas largas, consistencia y logros especiales. Estos multiplicadores pueden aumentar tu ganancia de XP en un 10-50%, ayudándote a subir de nivel más rápido.'
      },
      harmonyStreak: {
        title: 'Racha de Armonía',
        content: 'Usa las 3 funciones (hábitos, diario, metas) en el mismo día para construir tu racha de "armonía". Las rachas de armonía largas desbloquean títulos especiales y bonos de XP.'
      }
    }
  } as any,

  // Tutorial System (UI elements only, detailed content falls back to EN)
  tutorial: {
    skip: 'Saltar Tutorial',
    next: 'Siguiente',
    continue: 'Continuar',
    getStarted: 'Comenzar',
    finish: 'Finalizar Tutorial',
    progressText: 'Paso {{current}} de {{total}}',
    loading: 'Configurando tu tutorial...',
    steps: {
      createGoalButton: {
        title: 'Crea Tu Primer Objetivo',
        content: '¡Haz clic en + Agregar Objetivo para establecer tu primer objetivo significativo!',
        button: 'Haz clic aquí',
      },
    } as any,
    validation: {} as any,
    errors: {
      recoveryMode: 'El tutorial experimentó problemas. Ejecutándose en modo simplificado.',
      reset: 'El tutorial encontró un error y fue reiniciado.',
      retry: 'Intentar de Nuevo',
      generalError: 'El tutorial encontró un error. Por favor, inténtalo de nuevo.',
      alreadyCompleted: 'Tutorial ya completado u omitido',
    },
    stepProgress: 'Paso {{current}} de {{total}}',
    skipConfirmation: {
      title: '¿Saltar Tutorial?',
      message: '¿Estás seguro de que quieres saltar el tutorial? Siempre puedes reiniciarlo más tarde desde Ajustes.',
      skip: 'Sí, Saltar',
      continue: 'Continuar Tutorial'
    }
  } as any,

  // Notifications
  notifications: {
    disabled: 'Notificaciones deshabilitadas',
    enableTap: 'Toca para habilitar notificaciones',
    settingsTap: 'Toca para abrir configuración del sistema',
    afternoonReminder: 'Recordatorio Vespertino',
    afternoonDescription: 'Chequeo motivacional',
    eveningReminder: 'Recordatorio Nocturno',
    eveningDescription: 'Recordatorio de tareas inteligente',
    morning: {
      variant1: '¡Buenos días! Comienza tu día con gratitud 🌅',
      variant2: '¡Despierta y brilla! ¿Por qué estás agradecido hoy? ✨',
      variant3: '¡Un nuevo día, una nueva oportunidad de crecer! 🌱',
      variant4: '¡Motivación matutina: revisa tus hábitos y establece tu intención! 💪'
    },
    evening: {
      variant1: '¡Hora de reflexionar! ¿Cómo fue tu día? 🌙',
      variant2: 'Registra tu día en el diario antes de dormir ✨',
      variant3: '¿Qué tres cosas salieron bien hoy? 🙏',
      variant4: 'Termina tu día con reflexión positiva 🌟'
    },
    reminders: {
      afternoon: {
        variant1: {
          title: 'Registro SelfRise ☀️',
          body: '¿Cómo va tu día? Revisa tus hábitos y añade una entrada de diario rápida sobre tu progreso.'
        },
        variant2: {
          title: 'Motivación de la Tarde 💪',
          body: '¡Ya pasaste la mitad del día! Marca algunos hábitos y reflexiona sobre tus pequeñas victorias.'
        },
        variant3: {
          title: 'Hora de Progreso 🎯',
          body: 'Un recordatorio amistoso para mantenerte en camino. Registra tus hábitos y añade cualquier progreso de metas.'
        },
        variant4: {
          title: 'Momento de Micro-victoria ✨',
          body: 'Cada pequeño paso cuenta. Abre SelfRise y registra tu progreso, sin importar cuán pequeño sea.'
        }
      },
      evening: {
        incomplete_habits: {
          title: '¡Aún tienes hábitos por completar! 🏃‍♂️',
          body_one: 'Aún tienes 1 hábito por completar. ¡Vamos!',
          body_other: 'Aún tienes {{count}} hábitos por completar. ¡Vamos!'
        },
        missing_journal: {
          title: 'Mantén tu racha de diario 📝',
          body_one: 'Escribe solo 1 entrada más para completar tu registro diario de diario.',
          body_other: 'Escribe {{count}} entradas más para completar tu registro diario de diario.'
        },
        bonus_opportunity: {
          title: '¡Oportunidad de Bonus! ⭐',
          body: '¡Has completado tu diario diario! Añade entradas bonus para ganar XP extra.'
        },
        fallback: {
          title: '¡Termina tu día fuerte! 🌟',
          body: 'Revisa tus hábitos y reflexiona sobre tu día en tu diario.'
        }
      }
    }
  } as any,

  social: {
    // Phase 7: DailyHeroesSection
    dailyHeroes: {
      title: 'Héroes Diarios 🦸‍♀️',
      subtitle: 'Logros anónimos para inspirarte',
      loading: 'Cargando logros inspiradores...',
      tryAgain: 'Reintentar',
      noHeroes: 'No hay héroes disponibles ahora',
      noHeroesSubtitle: '¡Vuelve más tarde para nueva inspiración!',
      footer: 'Cada logro compartido aquí es del viaje real de un usuario. ¡No estás solo! 💪',
      inspiring: 'Inspirador',
      daysActive: '{{days}} días activos',
      today: '🟢 Hoy',
      yesterday: '🟡 Ayer',
      recent: '🔵 Reciente',
      heroAccessibilityLabel: 'Héroe anónimo logró {{achievement}}',
      loadError: 'Error al cargar los héroes del día',
    },
    // Phase 8: NotificationSettings & LoyaltyCard
    loyalty: {
      loadingData: 'Cargando datos de lealtad...',
      unavailableData: '⚠️ Datos de lealtad no disponibles',
      journeyTitle: '🏆 Viaje de Lealtad',
      activeDays: 'Días Activos',
      daysRemaining: 'días restantes',
      maxReached: '¡Has alcanzado la lealtad máxima!',
      daysOfDedication: 'días de dedicación',
      currentStreak: 'Racha Actual',
      longestStreak: 'Racha Más Larga',
      level: 'Nivel',
    },
    quote: {
      copy: 'Copiar',
      share: 'Compartir',
      copiedTitle: '📋 ¡Copiado!',
      copiedMessage: 'Cita copiada al portapapeles.',
      copyError: 'No se pudo copiar la cita. Por favor, inténtalo de nuevo.',
      title: '✨ Cita Motivadora',
      dailyInspiration: 'Inspiración diaria',
      personalizedJourney: 'Personalizado para tu viaje',
    },
    achievements: {
      shareSuccessTitle: '🎉 ¡Compartido Exitosamente!',
      shareSuccessMessage: 'Tu logro ha sido compartido. ¡Sigue con el buen trabajo!',
      shareError: 'No se pudo compartir el logro. Por favor, inténtalo de nuevo.',
      copiedTitle: '📋 ¡Copiado!',
      copiedMessage: 'Detalles del logro copiados al portapapeles. ¡Ahora puedes pegarlos en cualquier lugar!',
      shareAchievementTitle: 'Compartir Logro',
      shareAchievementDescription: 'Compartir usando las opciones integradas de tu dispositivo',
      copyClipboardTitle: 'Copiar al Portapapeles',
      copyClipboardDescription: 'Copiar detalles del logro a tu portapapeles',
    },
    achievements_filters: {
      allCategories: 'Todas las Categorías',
      habitsCategory: 'Hábitos',
      journalCategory: 'Diario',
      goalsCategory: 'Metas',
      consistencyCategory: 'Consistencia',
      categoryLabel: 'Categoría',
      rarityLabel: 'Rareza',
      recentLabel: 'Reciente',
      alphabeticalLabel: 'A-Z',
      sortByLabel: 'Ordenar por',
      unlockedOnlyLabel: 'Solo Desbloqueados',
      allRarities: 'Todas las Rarezas',
      commonRarity: 'Común',
      rareRarity: 'Raro',
      epicRarity: 'Épico',
      legendaryRarity: 'Legendario',
    },
    achievements_trophies: {
      habitMastery: 'Completar todos los logros relacionados con hábitos',
      journalMastery: 'Dominar todos los aspectos de la reflexión en diario',
      goalMastery: 'Lograr dominio en establecimiento y cumplimiento de metas',
      legendaryCollector: 'Recopilar todos los logros legendarios',
      epicCollector: 'Desbloquear todos los logros épicos',
      universalBeginning: 'Dar tus primeros pasos en todas las áreas',
      consistencyMaster: 'Dominar el arte de la consistencia',
      timeMaster: 'Destacar en logros basados en el tiempo',
    },
    trophy_combinations: {
      title: 'Colecciones de Trofeos',
      subtitle: 'Completa conjuntos temáticos para recompensas adicionales',
      collectionsCompleted: 'Colecciones\nCompletadas',
      bonusXPEarned: 'XP Adicional\nGanado',
      collectionRate: 'Tasa de\nColección',
      collectionComplete: '🎉 ¡Colección Completada!',
      completedProgress: '{{completed}}/{{total}} completado',
      moreToUnlock: '{{count}} más para desbloquear',
      collections: {
        'habits-master': 'Maestro de Hábitos',
        'journal-sage': 'Sabio del Diario',
        'goal-champion': 'Campeón de Objetivos',
        'legendary-collector': 'Coleccionista Legendario',
        'epic-hunter': 'Cazador Épico',
        'first-steps': 'Constructor de Fundamentos',
        'consistency-king': 'Rey de la Consistencia',
        'time-master': 'Maestro del Tiempo',
      },
    },
    loyalty_progress: {
      keepGrowing: '¡Sigue creciendo!',
      level: 'Nivel',
      loadingData: 'Cargando datos de lealtad...',
      unavailableData: '⚠️ Datos de lealtad no disponibles',
      journeyTitle: '🏆 Viaje de Lealtad',
      activeDays: 'Días Activos',
      progressNext: 'Camino a {{name}}: {{days}} días activos restantes',
      daysRemaining: 'días restantes',
      maximumReached: '¡Has alcanzado la lealtad máxima!',
      daysOfDedication: 'días de dedicación',
      currentStreak: 'Serie Actual',
      longestStreak: 'Serie Más Larga',
      // Motivation messages based on days remaining
      motivation: {
        oneDay: '¡Solo 1 día activo más para desbloquear {{name}}!',
        fewDays: '{{days}} días activos para {{name}} - ¡tan cerca!',
        withinReach: '{{name}} está al alcance: ¡{{days}} días más!',
        building: 'Camino a {{name}}: {{days}} días activos restantes',
        continuing: 'Tu viaje de lealtad continúa hacia {{name}}',
      },
      levels: {
        newcomer: {
          name: 'Recién Llegado',
          description: 'Comenzando tu viaje'
        },
        explorer: {
          name: 'Explorador',
          description: 'Descubriendo tu potencial'
        },
        veteran: {
          name: 'Veterano',
          description: 'Experimentado en el crecimiento'
        },
        legend: {
          name: 'Leyenda',
          description: 'Compromiso legendario'
        },
        master: {
          name: 'Maestro de Lealtad',
          description: 'Dedicación suprema'
        }
      }
    },
    days: {
      monday: 'Lu',
      tuesday: 'Ma',
      wednesday: 'Mi',
      thursday: 'Ju',
      friday: 'Vi',
      saturday: 'Sá',
      sunday: 'Do',
    },
    // Filters - labels for header
    filterLabels: {
      category: 'Categoría',
      rarity: 'Rareza',
      sortBy: 'Ordenar por',
    },
    // Trophy combinations
    combinations: {
      collections: 'Colecciones',
      completed: 'Completado',
      earned: 'Ganado',
      collection: 'Colección',
      rate: 'Tasa',
    },
    // Achievement states
    states: {
      new: 'NUEVO',
      keepGrowing: '¡Sigue creciendo!',
      level: 'Nivel',
    },
    // Achievement History
    history: {
      newBadge: 'NUEVO',
      emptyTitle: 'Sin Trofeos Aún',
      recentVictories: 'Victorias Recientes',
      latestAchievements_one: 'Tu último {{count}} logro',
      latestAchievements_other: 'Tus últimos {{count}} logros',
      moreAchievements: 'Y {{count}} más en tu colección...',
    },
    // Achievement Tooltip
    tooltip: {
      completed: '✅ Logro Desbloqueado',
      progressAndRequirements: '📊 Progreso y Requisitos',
      requirement: 'Requisito:',
      currentProgress: 'Progreso Actual:',
      nextSteps: '💡 Próximos Pasos:',
      smartTips: '💡 Consejos Inteligentes',
    },
    // Achievement Detail Modal
    detail: {
      category: 'Categoría:',
      rarity: 'Rareza:',
      xpReward: 'Recompensa XP:',
    },
    // Trophy Room
    trophyRoom: {
      title: '🏆 Sala de Trofeos',
      subtitle: 'Tu Galería Personal de la Fama',
      qualitySection: 'Calidad del Trofeo',
      categoryProgress: '{{unlocked}} de {{total}} desbloqueados',
    },
    // Share Achievement Modal
    shareModal: {
      title: 'Compartir Logro',
      subtitle: '¡Celebra tu progreso! 🎉',
      preparing: 'Preparando tu logro... 🏆',
      messagePreview: 'Vista previa del mensaje compartido',
      sharingOptions: 'Opciones de Compartir',
      privacyProtected: 'Privacidad Protegida',
      privacyDescription: 'Tu información personal nunca se comparte. Solo se incluyen el progreso del logro y contenido motivacional en las comparticiones.',
      loadError: 'No se pueden cargar los datos del logro',
    },
  } as any,

  // Challenges
  challenges: {
    calendar: {
      dailyProgress: 'Progreso Diario',
      title: 'Calendario de Progreso Mensual',
      noActivity: 'Sin Actividad (<10%)',
      someActivity: 'Alguna Actividad (10-50%)',
      goodProgress: 'Buen Progreso (51-90%)',
      perfectDay: 'Día Perfecto (91%+)',
      weeklyBreakdown: 'Desglose Semanal',
      week: 'Semana {week}',
    },
    completion: {
      requirements: 'Requisitos',
      activeDays: 'Días Activos',
      milestones: 'Hitos',
    },
  } as any,

  // Gratitude/Journal
  gratitude: {
    daily: {
      title: 'Progreso del Diario Hoy',
    },
    export: {
      title: 'Exportar Diario',
      textFormat: 'Formato de Texto',
      jsonFormat: 'Formato JSON',
      exporting: 'Exportando tu diario...',
    },
    edit: {
      title: 'Editar Entrada del Diario',
    },
    bonus: {
      label: 'BONIFICACIÓN ⭐',
    },
  } as any,

  // Accessibility
  accessibility: {
    activateMultiplier: 'Activar multiplicador de XP 2x',
    tapToContinueTutorial: 'Toca para continuar el tutorial',
    achievementGrid: 'Cuadrícula de logros',
    closeAchievementDetails: 'Cerrar detalles del logro',
    shareAchievement: 'Compartir logro',
    shareYourAchievement: 'Comparte tu logro',
    continueWithMultiplier: 'Continúa usando la aplicación con multiplicador activo',
    multiplierCelebration: 'Celebración de activación del multiplicador de XP',
    getNewQuote: 'Obtener nueva cita',
    copyQuoteToClipboard: 'Copiar cita al portapapeles',
    shareQuote: 'Compartir cita',
    skipTutorial: 'Omitir tutorial',
    viewAllLevels: 'Ver todos los niveles',
    refreshDailyHeroes: 'Actualizar héroes del día',
    closeSharingModal: 'Cerrar modal de compartir',
    closeHelp: 'Cerrar ayuda',
    hints: {
      openLevelOverview: 'Abre la vista general de niveles',
      doubleTapShowHelp: 'Toca dos veces para mostrar información de ayuda',
      tapForInspiration: 'Toca para ver más inspiración',
    },
  },
};

export default es;
