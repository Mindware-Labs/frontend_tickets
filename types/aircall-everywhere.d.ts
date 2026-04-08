declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "aircall-everywhere" {
  interface AircallPhoneOptions {
    domToLoadPhone: string;
    onLogin?: (settings: any) => void;
    onLogout?: () => void;
  }

  class AircallPhone {
    constructor(options: AircallPhoneOptions);
    on(event: string, callback: (data: any) => void): void;
    send(
      event: string,
      payload: any,
      callback?: (success: boolean, data: any) => void,
    ): void;
    isLoggedIn(callback: (response: any) => void): void;
  }

  export default AircallPhone;
}
