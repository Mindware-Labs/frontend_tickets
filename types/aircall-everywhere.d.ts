declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "aircall-everywhere" {
  type AircallSize = "big" | "small" | "auto";

  export interface AircallLoginSettings {
    user: {
      email: string;
      first_name: string;
      last_name: string;
      company_name: string;
    };
    settings: Record<string, any>;
  }

  export interface AircallIncomingCallPayload {
    from: string;
    to: string;
    call_id?: number;
    contact?: {
      phone_numbers?: Array<{ label?: string; value: string }>;
      first_name?: string;
      last_name?: string;
      company_name?: string;
    };
  }

  export interface AircallOutgoingCallPayload {
    from: string;
    to: string;
    call_id?: number;
  }

  export interface AircallEndedCallPayload {
    call_id?: number;
    duration?: number;
    answer_status?: "answered" | "disconnected" | "refused";
  }

  export interface AircallWorkspaceOptions {
    domToLoadWorkspace: string;
    onLogin?: (settings: AircallLoginSettings) => void;
    onLogout?: () => void;
    integrationToLoad?: "zendesk" | "hubspot";
    size?: AircallSize;
    debug?: boolean;
  }

  export type AircallEvent =
    | "incoming_call"
    | "call_end_ringtone"
    | "call_ended"
    | "outgoing_call"
    | "outgoing_answered"
    | "external_dialer"
    | "dialer_no_seat_available"
    | "comments_saved";

  export default class AircallWorkspace {
    constructor(options: AircallWorkspaceOptions);
    isLoggedIn(callback: (loggedIn: boolean) => void): void;
    on(event: AircallEvent | string, callback: (data: any) => void): void;
    send(
      event: string,
      payload?: Record<string, any>,
      callback?: (success: boolean, data: any) => void,
    ): void;
    removeListener(event: AircallEvent | string): void;
  }
}
