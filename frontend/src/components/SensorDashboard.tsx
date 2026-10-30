
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import styles from "./css/SensorDashboard.module.css";

type Device = {
    id: string;
    serial: string;
    model: string;
    status: string;
};

type Measurement = {
    tenantSlug: string;
    deviceId: string;
    type: string;
    value: number;
    time: string;
};

type AlertItem = {
    id: string;
    deviceId?: string;
    type: string;
    value: number;
    threshold: number;
    operator: string;
    severity: string;
    message: string;
    time: string;
};

const HUB_URL = import.meta.env.VITE_IOT_HUB_URL || "http://localhost:5103/hub/telemetry";
const RULES_URL = import.meta.env.VITE_IOT_RULES_API_URL || "http://localhost:5000";
const REGISTRY_URL = import.meta.env.VITE_IOT_REGISTRY_API_URL || "http://localhost:5101";
const TENANT = import.meta.env.VITE_IOT_TENANT_SLUG || "innovia";
const TENANT_ID = import.meta.env.VITE_IOT_TENANT_ID || "996cc7d8-99b0-4a7e-8c33-7618b03f1f5e";

function formatTime(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function SensorDashboard() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [latest, setLatest] = useState<Record<string, Record<string, Measurement>>>({});
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [showAllAlerts, setShowAllAlerts] = useState(false);
    const [connection, setConnection] = useState("Ansluter...");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadDevices() {
            try {
                const response = await fetch(
                    `${REGISTRY_URL}/api/tenants/${encodeURIComponent(TENANT_ID)}/devices`
                );
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data: Device[] = await response.json();
                if (active) setDevices(data);
            } catch {
                if (active) setError("IoT-servern är inte tillgänglig just nu. Enhetslistan kan inte hämtas, men bokningar och övriga delar av Innovia fungerar fortfarande.");
            }
        }

        async function loadAlerts() {
            try {
                const response = await fetch(
                    `${RULES_URL}/alerts?tenantId=${encodeURIComponent(TENANT_ID)}`
                );
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data: AlertItem[] = await response.json();
                if (active) {
                    setAlerts(
                        data.sort(
                            (a, b) =>
                                new Date(b.time).getTime() - new Date(a.time).getTime()
                        ).slice(0, 20)
                    );
                }
            } catch {
                if (active) setError("IoT-servern är inte tillgänglig just nu. Tidigare larm kan inte hämtas, men bokningar och övriga delar av Innovia fungerar fortfarande.");
            }
        }

        void loadDevices();
        void loadAlerts();

        const hub = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL)
            .withAutomaticReconnect()
            .build();

        hub.on("measurementReceived", (measurement: Measurement) => {
            if (!active || measurement.tenantSlug !== TENANT) return;

            const deviceId = measurement.deviceId;
            const type = measurement.type.toLowerCase();

            setLatest(previous => ({
                ...previous,
                [deviceId]: {
                    ...previous[deviceId],
                    [type]: measurement,
                },
            }));
        });

        hub.on("alertRaised", (alert: AlertItem) => {
            if (!active) return;
            setAlerts(previous =>
                [alert, ...previous.filter(item => item.id !== alert.id)]
                    .sort(
                        (a, b) =>
                            new Date(b.time).getTime() - new Date(a.time).getTime()
                    )
                    .slice(0, 20)
            );
        });

        hub.onreconnecting(() => {
            if (active) setConnection("Återansluter...");
        });

        hub.onreconnected(async () => {
            if (!active) return;
            try {
                await hub.invoke("JoinTenant", TENANT);
                if (active) setConnection("Ansluten");
            } catch {
                if (active) setConnection("Kunde inte ansluta till kanalen");
            }
        });

        let startPromise: Promise<void> | undefined;

        async function connect() {
            try {
                startPromise = hub.start();
                await startPromise;

                if (!active) return;

                await hub.invoke("JoinTenant", TENANT);

                if (active) {
                    setConnection("Ansluten");
                    setError("");
                }
            } catch (err) {
                if (active) {
                    console.error("SignalR connection failed:", err);
                    setConnection("IoT-servern är offline");
                    setError(
                        "IoT-servern är inte tillgänglig just nu. Enheter och livedata kan inte visas, men bokningar och övriga delar av Innovia fungerar fortfarande."
                    );
                }
            }
        }

        void connect();

        return () => {
            active = false;

            void (async () => {
                try {
                    if (startPromise) {
                        await startPromise;
                    }
                } catch {
                    // Anslutningen kan misslyckas innan den startar.
                }

                try {
                    if (hub.state !== signalR.HubConnectionState.Disconnected) {
                        await hub.stop();
                    }
                } catch (err) {
                    console.error("SignalR cleanup failed:", err);
                }
            })();
        };
    }, []);

    return (
        <section className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>INNOVIA IOT</p>
                    <h2>Sensor Dashboard</h2>
                    <p className={styles.description}>
                        Live sensor measurements and alerts
                    </p>
                </div>
                <span role="status" aria-live="polite" className={`${styles.status} ${
                    connection === "Ansluten" ? styles.connected : ""
                }`}>
                    {connection}
                </span>
            </div>

            {error && <p className={styles.error} role="status" aria-live="polite">{error}</p>}

            <h3>Enheter ({devices.length})</h3>
            <div className={styles.metrics}>
                {devices.map(device => {
                    const measurements = latest[device.id] ?? {};
                    const temperature = measurements.temperature;
                    const co2 = measurements.co2;

                    return (
                        <article className={styles.metric} key={device.id}>
                            <h3>{device.serial}</h3>
                            <small>{device.model}</small>
                            <small>
                                Status: {device.status === "active" ? "Aktiv" : "Frånkopplad"}
                            </small>

                            <p>Temperatur</p>
                            <strong>
                                {temperature
                                    ? `${temperature.value.toFixed(1)} °C`
                                    : "—"}
                            </strong>
                            <small>
                                {temperature
                                    ? formatTime(temperature.time)
                                    : "Väntar på livedata"}
                            </small>

                            <p>CO₂</p>
                            <strong>
                                {co2 ? `${co2.value.toFixed(0)} ppm` : "—"}
                            </strong>
                            <small>
                                {co2
                                    ? formatTime(co2.time)
                                    : "Väntar på livedata"}
                            </small>
                        </article>
                    );
                })}
            </div>


            <div className={styles.alertHeader}>
                <h3>Larm</h3>
                <span>{alerts.length} sparade</span>
            </div>

            {alerts.length === 0 ? (
                <p className={styles.empty}>Inga larm har mottagits ännu.</p>
            ) : (
                <>
                    <div className={styles.alertList}>
                        {(showAllAlerts ? alerts : alerts.slice(0, 5)).map(alert => {
                            const device = devices.find(
                                item => item.id === alert.deviceId
                            );

                            return (
                                <article className={styles.alert} key={alert.id}>
                                    <div className={styles.alertTitle}>
                                        <strong>{alert.type}</strong>
                                        <span>{alert.severity}</span>
                                    </div>
                                    <p>{alert.message}</p>
                                    <small>
                                        Enhet: {device?.serial ?? alert.deviceId ?? "Okänd enhet"}
                                    </small>
                                    <small>{formatTime(alert.time)}</small>
                                </article>
                            );
                        })}
                    </div>

                    {alerts.length > 5 && (
                        <button
                            type="button"
                            className={styles.alertToggle}
                            onClick={() => setShowAllAlerts(previous => !previous)}
                        >
                            {showAllAlerts ? "Visa färre larm" : `Visa alla ${alerts.length} larm`}
                        </button>
                    )}
                </>
            )}
        </section>
    );
}
