import { useEffect, useState } from "react";
import styles from "./css/ResourceStatus.module.css";
import * as signalR from "@microsoft/signalr";

const API_URL = import.meta.env.VITE_API_URL;

type ResourceAvailability = {
  resourceType: number | string;
  totalResources: number;
  availableResources: number;
};

export default function ResourceStatus() {
  const [resourceStatus, setResourceStatus] = useState<ResourceAvailability[]>(
    [],
  );

  useEffect(() => {
    const fetchResourceStatus = async () => {
      try {
        const resourceTypes = [1, 2, 3, 4];

        const startTime = new Date();

        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        const requests = resourceTypes.map(async (resourceType) => {
          const response = await fetch(
            `${API_URL}/api/Resources/types/${resourceType}/availability` +
              `?startTime=${startTime.toISOString()}` +
              `&endTime=${endTime.toISOString()}`,
          );

          if (!response.ok) {
            throw new Error(
              `Kunde inte hämta tillgänglighet för resurstyp ${resourceType}`,
            );
          }

          const data: ResourceAvailability = await response.json();

          return data;
        });

        const data = await Promise.all(requests);

        console.log("Resursstatus:", data);

        setResourceStatus(data);
      } catch (error) {
        console.error("Fel vid hämtning av resursstatus:", error);
      }
    };

    fetchResourceStatus();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/Hubs/booking`)
      .withAutomaticReconnect()
      .build();

    connection.on("BookingsChanged", () => {
      fetchResourceStatus();
    });

    connection
      .start()
      .then(() => {
        console.log("SignalR ansluten!");
      })
      .catch((error) => {
        if (
          error instanceof Error &&
          error.message.includes("stopped during negotiation")
        ) {
          return;
        }

        console.error("SignalR-fel:", error);
      });

    return () => {
      connection.stop();
    };
  }, []);

  const getResourceName = (resourceType: number | string) => {
  const resourceNames: Record<string, string> = {
    "1": "Drop-in skrivbord",
    "2": "Mötesrum",
    "3": "VR-headset",
    "4": "AI-server",
    Undefined: "Okänd resurs",
    Skrivbord: "Drop-in skrivbord",
    Mötesrum: "Mötesrum",
    VRHeadset: "VR-headset",
    AIServer: "AI-server",
  };

  return resourceNames[String(resourceType)] ?? "Okänd resurs";
};

  return (
    <section className={styles.resourceStatus}>
      <p className={styles.eyebrow}>Resursstatus</p>

      <div className={styles.statusCards}>
        {resourceStatus.map((resource) => (
          <div key={resource.resourceType} className={styles.statusCard}>
            <div>
              <h3>{getResourceName(resource.resourceType)}</h3>

              <p>{resource.totalResources} st totalt</p>
            </div>

            <div className={styles.availability}>
              <span className={styles.statusDot}></span>

              <span>{resource.availableResources} st tillgängliga</span>
            </div>

            <div className={styles.progressBar}>
              <div
                className={styles.progress}
                style={{
                  width:
                    resource.totalResources === 0
                      ? "0%"
                      : `${
                          (resource.availableResources /
                            resource.totalResources) *
                          100
                        }%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
