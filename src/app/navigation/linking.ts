import { getStateFromPath as defaultGetStateFromPath, type LinkingOptions } from '@react-navigation/native';
import { parseConsultaDeepLink } from '@/shared/navigation/deep-links';
import type { RootStackParamList } from '@/shared/types/navigation';

/** MOB-24 · Deep links alivia:// */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['alivia://'],
  getStateFromPath(path, options) {
    const href = path.includes('://') ? path : `alivia://${path.replace(/^\//, '')}`;
    const appointmentId = parseConsultaDeepLink(href);
    if (appointmentId) {
      return {
        routes: [
          {
            name: 'Main',
            state: {
              routes: [
                {
                  name: 'Diario',
                  state: {
                    routes: [{ name: 'DiarioHome', params: { appointmentId } }],
                  },
                },
              ],
            },
          },
        ],
      };
    }
    return defaultGetStateFromPath(path, options);
  },
  config: {
    screens: {
      Auth: 'login',
      Main: {
        screens: {
          Diario: {
            screens: {
              Checkin: 'checkin',
              DiarioHome: 'diario',
              Progreso: 'progreso',
            },
          },
          AlivIA: 'mensajes',
          Comunidad: 'comunidad',
          Perfil: 'perfil',
        },
      },
    },
  },
};
