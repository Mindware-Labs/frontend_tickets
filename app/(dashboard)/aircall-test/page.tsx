"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Loader2,
  User,
  Clock,
  Hash,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Info,
} from "lucide-react";

interface CallEvent {
  timestamp: string;
  type: string;
  data: Record<string, unknown>;
}

interface AgentInfo {
  email?: string;
  first_name?: string;
  last_name?: string;
  availability?: string;
}

export default function AircallTestPage() {
  const phoneRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [callEvents, setCallEvents] = useState<CallEvent[]>([]);
  const [currentCall, setCurrentCall] = useState<Record<string, any> | null>(
    null,
  );
  const [dialNumber, setDialNumber] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);

  const addEvent = useCallback(
    (type: string, data: Record<string, unknown>) => {
      setCallEvents((prev) => [
        { timestamp: new Date().toLocaleTimeString(), type, data },
        ...prev.slice(0, 49),
      ]);
    },
    [],
  );

  const loadPhone = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setLoadStep(1);

    try {
      const AircallPhone = (await import("aircall-everywhere")).default;
      setLoadStep(2);

      setLoadStep(3);
      phoneRef.current = new AircallPhone({
        domToLoadPhone: "#aircall-phone-container",
        onLogin: (settings: any) => {
          setLoadStep(5);
          setIsLoggedIn(true);
          setAgentInfo({
            email: settings?.user?.email,
            first_name: settings?.user?.first_name,
            last_name: settings?.user?.last_name,
            availability: settings?.user?.availability,
          });
          addEvent("login", settings || {});
        },
        onLogout: () => {
          setIsLoggedIn(false);
          setAgentInfo(null);
          setCurrentCall(null);
          addEvent("logout", {});
        },
      });

      phoneRef.current.on("incoming_call", (callInfos: any) => {
        setCurrentCall(callInfos);
        addEvent("incoming_call", callInfos);
      });

      phoneRef.current.on("call_end_ringtone", (callInfos: any) => {
        addEvent("call_end_ringtone", callInfos);
      });

      phoneRef.current.on("call_ended", (callInfos: any) => {
        setCurrentCall(null);
        addEvent("call_ended", callInfos);
      });

      phoneRef.current.on("comment_saved", (callInfos: any) => {
        addEvent("comment_saved", callInfos);
      });

      phoneRef.current.on("outgoing_call", (callInfos: any) => {
        setCurrentCall(callInfos);
        addEvent("outgoing_call", callInfos);
      });

      phoneRef.current.on("outgoing_answered", (callInfos: any) => {
        addEvent("outgoing_answered", callInfos);
      });

      setLoadStep(4);
      setIsLoaded(true);
    } catch (err: any) {
      setLoadStep(0);
      setLoadError(err.message || "Failed to load Aircall Phone SDK");
    } finally {
      setIsLoading(false);
    }
  }, [addEvent]);

  const checkLoggedIn = useCallback(() => {
    if (!phoneRef.current) return;
    phoneRef.current.isLoggedIn((response: any) => {
      addEvent("isLoggedIn_check", { result: response });
    });
  }, [addEvent]);

  const handleDial = useCallback(() => {
    if (!phoneRef.current || !dialNumber.trim()) return;
    phoneRef.current.send(
      "dial_number",
      { phone_number: dialNumber.trim() },
      (success: boolean, data: any) => {
        addEvent("dial_number", { success, data, phone_number: dialNumber });
      },
    );
  }, [dialNumber, addEvent]);

  useEffect(() => {
    return () => {
      phoneRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aircall SDK Test</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Prueba de integración del softphone Aircall Everywhere dentro del
          Support Center
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Phone embed */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Aircall Phone
            </CardTitle>
            <CardDescription>
              El softphone se embebe aquí. Requiere sesión activa en Aircall.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {!isLoaded && !isLoading && (
              <div className="w-full space-y-4">
                <Button
                  onClick={loadPhone}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Cargar Aircall Phone
                </Button>
                <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <p className="font-medium">Antes de iniciar:</p>
                      <ul className="list-disc ml-3 space-y-0.5">
                        <li>
                          Tu dominio debe estar en el whitelist de Aircall
                        </li>
                        <li>El agente necesita una cuenta activa en Aircall</li>
                        <li>Podrás hacer login dentro del teléfono embebido</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="w-full space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Inicializando Aircall Phone...
                </div>
                <div className="space-y-2 pl-1">
                  {[
                    { step: 1, label: "Descargando SDK de Aircall..." },
                    { step: 2, label: "SDK cargado correctamente" },
                    { step: 3, label: "Inicializando softphone..." },
                    { step: 4, label: "Esperando conexión con Aircall..." },
                  ].map(({ step, label }) => (
                    <div key={step} className="flex items-center gap-2 text-xs">
                      {loadStep > step ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : loadStep === step ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                      <span
                        className={
                          loadStep >= step
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                        }
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoaded && !isLoggedIn && (
              <div className="w-full rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-medium">
                      Teléfono cargado — esperando login
                    </p>
                    <p className="mt-1">
                      Ingresa tus credenciales de Aircall en el teléfono de
                      abajo para comenzar a recibir y hacer llamadas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isLoaded && isLoggedIn && (
              <div className="w-full rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-green-700 dark:text-green-300">
                    <p className="font-medium">Conectado a Aircall</p>
                    <p className="mt-1">
                      El softphone está listo. Puedes hacer y recibir llamadas
                      directamente desde aquí.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loadError && (
              <div className="w-full rounded-md border border-destructive/30 bg-destructive/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="text-xs text-destructive">
                    <p className="font-medium">Error al cargar el teléfono</p>
                    <p className="mt-1">{loadError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={loadPhone}
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div
              id="aircall-phone-container"
              className="w-full min-h-166.5 flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25"
            >
              {!isLoaded && !isLoading && (
                <div className="text-center space-y-2 p-4">
                  <Phone className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground text-sm">
                    El teléfono aparecerá aquí
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Status + Controls */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Estado del Agente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoggedIn && agentInfo ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="font-medium">
                      {agentInfo.first_name} {agentInfo.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{agentInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge
                      variant={
                        agentInfo.availability === "available"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {agentInfo.availability || "unknown"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {isLoaded
                    ? "Esperando login en Aircall..."
                    : "Phone no cargado aún."}
                </p>
              )}
              {isLoaded && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={checkLoggedIn}
                >
                  Verificar sesión
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentCall ? (
                  <PhoneCall className="h-5 w-5 text-green-500 animate-pulse" />
                ) : (
                  <PhoneOff className="h-5 w-5 text-muted-foreground" />
                )}
                Llamada Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentCall ? (
                <div className="space-y-2 text-sm">
                  {currentCall.from && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desde:</span>
                      <span className="font-mono">
                        {String(currentCall.from)}
                      </span>
                    </div>
                  )}
                  {currentCall.to && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hacia:</span>
                      <span className="font-mono">
                        {String(currentCall.to)}
                      </span>
                    </div>
                  )}
                  {currentCall.call_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Call ID:</span>
                      <span className="font-mono text-xs">
                        {String(currentCall.call_id)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Sin llamada activa
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Marcar Número
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                placeholder="+1 (786) 453-7888"
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                disabled={!isLoggedIn}
              />
              <Button
                onClick={handleDial}
                disabled={!isLoggedIn || !dialNumber.trim()}
              >
                <PhoneOutgoing className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Event log */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Event Log
              {callEvents.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {callEvents.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Eventos del ciclo de vida de llamadas en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            {callEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Esperando eventos...
              </p>
            ) : (
              <div className="space-y-2 max-h-150 overflow-y-auto pr-2">
                {callEvents.map((evt, i) => (
                  <div
                    key={`${evt.timestamp}-${i}`}
                    className="rounded-md border p-3 text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          evt.type.includes("incoming")
                            ? "default"
                            : evt.type.includes("outgoing")
                              ? "secondary"
                              : evt.type.includes("ended")
                                ? "destructive"
                                : "outline"
                        }
                      >
                        {evt.type === "incoming_call" && (
                          <PhoneIncoming className="h-3 w-3 mr-1" />
                        )}
                        {evt.type === "outgoing_call" && (
                          <PhoneOutgoing className="h-3 w-3 mr-1" />
                        )}
                        {evt.type}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {evt.timestamp}
                      </span>
                    </div>
                    <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(evt.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
