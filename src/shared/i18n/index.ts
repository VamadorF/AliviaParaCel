import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      appName: 'Plantilla Móvil',
      login: {
        title: 'Iniciar sesión',
        email: 'Correo',
        password: 'Contraseña',
        submit: 'Entrar',
        demo: 'Entrar como demo',
        hint: 'Usa demo@plantilla.app o edita users.mock.ts',
      },
      home: {
        title: 'Inicio',
        forecast: 'Pronóstico',
        mockBadge: 'Datos mock',
      },
      profile: {
        title: 'Perfil',
        logout: 'Cerrar sesión',
        theme: 'Cambiar tema',
      },
      tabs: {
        home: 'Inicio',
        profile: 'Perfil',
      },
    },
  },
  en: {
    translation: {
      appName: 'Mobile Template',
      login: {
        title: 'Sign in',
        email: 'Email',
        password: 'Password',
        submit: 'Sign in',
        demo: 'Sign in as demo',
        hint: 'Use demo@plantilla.app or edit users.mock.ts',
      },
      home: {
        title: 'Home',
        forecast: 'Forecast',
        mockBadge: 'Mock data',
      },
      profile: {
        title: 'Profile',
        logout: 'Sign out',
        theme: 'Toggle theme',
      },
      tabs: {
        home: 'Home',
        profile: 'Profile',
      },
    },
  },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export default i18n;
