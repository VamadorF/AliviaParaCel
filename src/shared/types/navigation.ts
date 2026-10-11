export type AuthStackParamList = {
  Login: undefined;
  PoliticaPrivacidad: undefined;
};

export type DiarioStackParamList = {
  DiarioHome: { appointmentId?: string } | undefined;
  Checkin: undefined;
  QuickCheckin: undefined;
  Progreso: undefined;
};

export type MainTabParamList = {
  Diario: undefined;
  AlivIA: undefined;
  Comunidad: undefined;
  Perfil: undefined;
};

export type PerfilStackParamList = {
  PerfilHome: undefined;
  Recordatorios: undefined;
  PoliticaPrivacidad: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
