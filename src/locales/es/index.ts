import { TranslationKeys } from '../../types/i18n';

const es: TranslationKeys = {
  // Navigation
  tabs: {
    home: 'Inicio',
    habits: 'Hábitos',
    gratitude: 'Mi Gratitud',
    goals: 'Metas',
    settings: 'Configuración',
  },
  
  // Home screen
  home: {
    title: '¡Bienvenido de vuelta!',
    gratitudeStreak: 'Racha de Gratitud',
    habitStatistics: 'Estadísticas de Hábitos',
    weeklyProgress: 'Progreso Semanal',
    monthlyProgress: 'Progreso Mensual',
    dayDetail: 'Detalle del Día',
  },
  
  // Habits screen
  habits: {
    title: 'Mis Hábitos',
    addHabit: 'Añadir Hábito',
    editHabit: 'Editar Hábito',
    deleteHabit: 'Eliminar Hábito',
    habitName: 'Nombre del Hábito',
    habitNamePlaceholder: 'Ingrese el nombre del hábito...',
    selectColor: 'Seleccionar Color',
    selectIcon: 'Seleccionar Icono',
    scheduledDays: 'Días Programados',
    markCompleted: 'Marcar como Completado',
    viewCalendar: 'Ver Calendario',
    confirmDelete: 'Confirmar Eliminación',
    deleteMessage: '¿Está seguro de que desea eliminar este hábito? Esta acción no se puede deshacer.',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    save: 'Guardar',
  },
  
  // Gratitude screen
  gratitude: {
    title: 'Mi Gratitud',
    addGratitude: 'Añadir Gratitud',
    gratitudePlaceholder: '¿Por qué estás agradecido hoy?',
    minimumRequired: 'Escriba al menos 3 gratitudes para mantener su racha',
    bonusGratitude: 'Gratitud Bonus',
    currentStreak: 'Racha Actual',
    longestStreak: 'Racha Más Larga',
    history: 'Historial',
    celebration: {
      title: '¡Felicidades! 🎉',
      message: '¡Has completado tu práctica diaria de gratitud!',
      bonusPrompt: '¿Te gustaría añadir una gratitud bonus?',
      continue: 'Continuar',
    },
    milestone: {
      title: '¡Logro Increíble! 🏆',
      message: '¡Has alcanzado una racha de {{days}} días!',
    },
    streakLost: {
      title: 'Racha Perdida',
      message: 'Tu racha de gratitud se ha roto. ¿Qué te gustaría hacer?',
      reset: 'Reiniciar Racha',
      recover: 'Recuperar con Anuncio',
    },
  },
  
  // Goals screen
  goals: {
    title: 'Mis Metas',
    addGoal: 'Añadir Meta',
    editGoal: 'Editar Meta',
    deleteGoal: 'Eliminar Meta',
    goalTitle: 'Título de la Meta',
    goalTitlePlaceholder: 'Ingrese su meta...',
    unit: 'Unidad',
    unitPlaceholder: 'ej. €, kg, horas...',
    targetValue: 'Valor Objetivo',
    addProgress: 'Añadir Progreso',
    progressValue: 'Valor del Progreso',
    progressNote: 'Nota',
    progressNotePlaceholder: 'Añada una nota sobre su progreso...',
    completed: 'Completado',
    progress: 'Progreso',
    confirmDelete: 'Confirmar Eliminación',
    deleteMessage: '¿Está seguro de que desea eliminar esta meta? Esta acción no se puede deshacer.',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    save: 'Guardar',
  },
  
  // Settings screen
  settings: {
    title: 'Configuración',
    language: 'Idioma',
    notifications: 'Notificaciones',
    morningNotification: 'Notificación Matutina',
    eveningNotification: 'Notificación Nocturna',
    account: 'Cuenta',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    logout: 'Cerrar Sesión',
    about: 'Acerca de',
    version: 'Versión',
    privacyPolicy: 'Política de Privacidad',
    termsOfService: 'Términos de Servicio',
  },
  
  // Auth screens
  auth: {
    login: {
      title: 'Bienvenido de Vuelta',
      email: 'Correo Electrónico',
      emailPlaceholder: 'Ingrese su correo electrónico...',
      password: 'Contraseña',
      passwordPlaceholder: 'Ingrese su contraseña...',
      loginButton: 'Iniciar Sesión',
      forgotPassword: '¿Olvidó su contraseña?',
      noAccount: '¿No tiene una cuenta?',
      signUp: 'Registrarse',
    },
    register: {
      title: 'Crear Cuenta',
      displayName: 'Nombre para Mostrar',
      displayNamePlaceholder: 'Ingrese su nombre...',
      email: 'Correo Electrónico',
      emailPlaceholder: 'Ingrese su correo electrónico...',
      password: 'Contraseña',
      passwordPlaceholder: 'Ingrese su contraseña...',
      confirmPassword: 'Confirmar Contraseña',
      confirmPasswordPlaceholder: 'Confirme su contraseña...',
      registerButton: 'Registrarse',
      hasAccount: '¿Ya tiene una cuenta?',
      signIn: 'Iniciar Sesión',
    },
  },
  
  // Common
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Añadir',
    confirm: 'Confirmar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    retry: 'Reintentar',
    done: 'Hecho',
    back: 'Atrás',
    next: 'Siguiente',
    skip: 'Omitir',
    close: 'Cerrar',
    yes: 'Sí',
    no: 'No',
  },
  
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
  },
  
  // Notifications
  notifications: {
    morning: {
      variant1: '¡Buenos días! Comienza tu día con gratitud 🌅',
      variant2: '¡Levántate y brilla! ¿Por qué estás agradecido hoy? ✨',
      variant3: '¡Un nuevo día, una nueva oportunidad para crecer! 🌱',
      variant4: 'Motivación matutina: ¡revisa tus hábitos y establece tu intención! 💪',
    },
    evening: {
      variant1: 'Reflexión nocturna: ¿Cómo fueron tus hábitos hoy? 🌙',
      variant2: 'Termina tu día con gratitud. ¿Qué salió bien? 🙏',
      variant3: '¡Hora de revisar tu progreso y planificar mañana! 📝',
      variant4: '¡Buenas noches! ¡No olvides completar tu gratitud diaria! 🌟',
    },
  },
};

export default es;