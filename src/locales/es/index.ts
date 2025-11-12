import { TranslationKeys } from '../../types/i18n';

/**
 * Spanish (Español) Translations
 *
 * Status: Work in Progress
 * Coverage: Partial - many keys will fall back to English
 *
 * Translation Strategy:
 * - Keys with [EN] prefix are not yet translated (fallback to English)
 * - Keys without prefix are fully translated
 * - Gradually translate based on priority (see i18n-migration-tracker.md)
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

    // Tutorial
    tutorialReset: 'Reiniciar Tutorial',
    tutorialResetDescription: 'Reiniciar el tutorial desde el principio',
    tutorialResetConfirmTitle: '¿Reiniciar Tutorial?',
    tutorialResetConfirmMessage: 'Esto reiniciará el tutorial desde el principio. Esta acción no se puede deshacer.',
    tutorialResetSuccess: '¡Tutorial reiniciado exitosamente!',

    // Common
    cancel: 'Cancelar',
    reset: 'Reiniciar',
  } as any,

  // Common
  common: {
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Añadir',
    create: 'Crear',
    update: 'Actualizar',
    confirm: 'Confirmar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    retry: 'Reintentar',
    ok: 'OK',
    done: 'Hecho',
    back: 'Atrás',
    next: 'Siguiente',
    skip: 'Saltar',
    close: 'Cerrar',
    continue: 'Continuar',
    yes: 'Sí',
    no: 'No',
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
  } as any,

  // Achievements - All 78 achievements translated to Spanish
  achievements: {
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
  } as any,

  // TODO: Add remaining translations progressively for other sections
  // For now, missing keys will fall back to English
};

export default es;
