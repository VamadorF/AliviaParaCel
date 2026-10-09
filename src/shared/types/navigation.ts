export type AuthStackParamList = {
  Login: undefined;
};

export type DiarioStackParamList = {
  DiarioHome: undefined;
  Checkin: undefined;
};

export type MainTabParamList = {
  Diario: undefined;
  AlivIA: undefined;
  Comunidad: undefined;
  Perfil: undefined;
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
