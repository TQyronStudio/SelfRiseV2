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

  // TODO: Add remaining translations progressively
  // For now, missing keys will fall back to English
};

export default es;
