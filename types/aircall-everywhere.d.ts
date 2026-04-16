declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "aircall-everywhere" {
  type AircallSize = "big" | "small" | "auto";

  interface AircallLoginSettings {
    user: {
      email: string;
      first_name: string;
      last_name: string;
      company_name: string;
    };
    settings: Record<string, any>;
  }

  interface AircallWorkspaceOptions {
    domToLoadWorkspace: string;
    onLogin?: (settings: AircallLoginSettings) => void;
    onLogout?: () => void;
    integrationToLoad?: "zendesk" | "hubspot";
    size?: AircallSize;
    debug?: boolean;
  }

  class AircallWorkspace {
    constructor(options: AircallWorkspaceOptions);
    isLoggedIn(callback: (loggedIn: boolean) => void): void;
    on(event: string, callback: (data: any) => void): void;
    send(
      event: string,
      payload?: Record<string, any>,
      callback?: (success: boolean, data: any) => void,
    ): void;
    removeListener(event: string): void;
  }

  export default AircallWorkspace;
}
