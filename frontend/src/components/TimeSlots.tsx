import { useEffect, useState } from "react";
import styles from "./css/TimeSlots.module.css";

const API_URL = import.meta.env.VITE_API_URL;

type TimeSlot = {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  status: "green" | "yellow" | "red" | "locked";
};

type TimeSlotsProps = {
  selectedDate?: Date;
  selectedResourceType:
    string | null;
  selectedResourceId: number | null;
  onResourceSelect: (resourceId: number | null) => void;
  onSlotSelect: (slot: TimeSlot | null) => void;
  selectedSlot: TimeSlot | null;
  overview?: boolean;
};

type Resource = {
  resourceId: number;
  resourceType: string;
};

const SLOT_START_HOUR = 0;
const SLOT_END_HOUR = 24;
const BOOKING_START_HOUR = 7;
const BOOKING_END_HOUR = 24;

function createSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (let hour = SLOT_START_HOUR; hour < SLOT_END_HOUR; hour++) {
    const start = new Date(date);
    start.setHours(hour, 0, 0, 0);

    const end = new Date(date);
    end.setHours(hour + 1, 0, 0, 0);

    slots.push({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      isAvailable: false,
      status: "locked",
    });
  }

  return slots;
}

export default function TimeSlots({
  selectedDate,
  selectedResourceType,
  onResourceSelect,
  selectedResourceId,
  onSlotSelect,
  selectedSlot,
  overview = false,
}: TimeSlotsProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStart, setSelectedStart] = useState<TimeSlot | null>(null);
  const [chooseSpecificResource, setChooseSpecificResource] = useState(false);

  useEffect(() => {
    async function fetchResources() {
      if (selectedResourceType === null) {
        setResources([]);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/Resources/types/${selectedResourceType}`,
        );

        if (!response.ok) {
          throw new Error("Kunde inte hämta resurser.");
        }

        const data: Resource[] = await response.json();
        setResources(data);
      } catch (error) {
        console.error("Kunde inte hämta resurs-ID:n:", error);
      }
    }

    fetchResources();
  }, [selectedResourceType]);

  useEffect(() => {
    const controller = new AbortController();

    async function checkAvailability() {
      if (!selectedDate || selectedResourceType === null) {
        setSlots([]);
        setSelectedStart(null);
        onSlotSelect(null);
        return;
      }

      setLoading(true);
      setError("");
      setSelectedStart(null);
      onSlotSelect(null);

      try {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const params = new URLSearchParams({ date: `${year}-${month}-${day}` });

        if (selectedResourceId !== null) {
          params.set("resourceId", String(selectedResourceId));
        }

        const response = await fetch(
          `${API_URL}/api/Resources/types/${encodeURIComponent(selectedResourceType)}/availability/day?${params.toString()}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Kunde inte kontrollera tillgänglighet (HTTP ${response.status}).`);
        }

        const availability = await response.json();
        const availabilityByStart = new Map<number, {
          isAvailable: boolean;
          availableResources: number;
          totalResources: number;
        }>();
        availability.forEach((item: {
          startTime: string;
          isAvailable: boolean;
          availableResources: number;
          totalResources: number;
        }) => {
          availabilityByStart.set(new Date(item.startTime).getTime(), item);
        });

        const daySlots = createSlots(selectedDate).map((slot) => {
          const hour = new Date(slot.startTime).getHours();

          if (hour < BOOKING_START_HOUR || hour >= BOOKING_END_HOUR) {
            return { ...slot, isAvailable: false, status: "locked" as const };
          }

          const data = availabilityByStart.get(
            new Date(slot.startTime).getTime(),
          ) as {
            isAvailable: boolean;
            availableResources: number;
            totalResources: number;
          } | undefined;

          if (!data) {
            return { ...slot, isAvailable: false, status: "locked" as const };
          }

          if (selectedResourceId !== null) {
            return {
              ...slot,
              isAvailable: data.isAvailable,
              status: data.isAvailable ? "green" as const : "red" as const,
            };
          }

          const status =
            data.availableResources === 0
              ? "red" as const
              : data.availableResources < data.totalResources
                ? "yellow" as const
                : "green" as const;

          return {
            ...slot,
            isAvailable: data.isAvailable,
            status,
          };
        });

        setSlots(daySlots);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Fel vid kontroll av tillgänglighet:", error);
        setError("Kunde inte hämta lediga tider. Försök igen om en liten stund.");
        setSlots([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void checkAvailability();

    return () => controller.abort();
  }, [selectedDate, selectedResourceId, selectedResourceType, onSlotSelect]);

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isEndTime(time: string) {
    return new Date(time).getHours() === BOOKING_END_HOUR;
  }

  function handleTimeClick(time: string) {
    const selectedTime = new Date(time);
    const selectedHour = selectedTime.getHours();

    /* första klicket = starttid */
    if (!selectedStart) {
      const startSlot = slots.find((slot) => slot.startTime === time);

      if (
        !startSlot ||
        !startSlot.isAvailable ||
        selectedHour < BOOKING_START_HOUR ||
        selectedHour >= BOOKING_END_HOUR
      ) {
        return;
      }

      setSelectedStart(startSlot);
      setError("");
      onSlotSelect(null);
      return;
    }

    /* sluttiden måste ligga efter starttiden */
    if (selectedTime <= new Date(selectedStart.startTime)) {
      return;
    }

    /* sluttiden får inte vara efter bokningsfönstret */
    if (selectedHour > BOOKING_END_HOUR) {
      return;
    }

    const slotsInRange = slots.filter(
      (slot) =>
        new Date(slot.startTime) >= new Date(selectedStart.startTime) &&
        new Date(slot.startTime) < selectedTime,
    );

    const allAvailable = slotsInRange.every((slot) => slot.isAvailable);

    if (!allAvailable) {
      setError("En eller flera tider i intervallet är redan bokade.");
      return;
    }

    const selectedRange: TimeSlot = {
      startTime: selectedStart.startTime,
      endTime: time,
      isAvailable: true,
      status: selectedStart.status,
    };

    onSlotSelect(selectedRange);
    setSelectedStart(null);
    setError("");
  }

  if (!selectedDate || selectedResourceType === null) {
    return (
      <section className={styles.timeSlotsWrapper}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Tider</p>
          <p className={styles.description}>
            Välj en resurs och ett datum för att se tillgängliga tider.
          </p>
        </div>
      </section>
    );
  }
  function formatResourceType(resourceType: string) {
    switch (resourceType) {
      case "VRHeadset":
        return "VR Headset";
      case "AIServer":
        return "AI Server";
      default:
        return resourceType;
    }
  }

  if (overview) {
    return (
      <div className={styles.overviewTimeSlotList}>
        {slots.map((slot) => {
          const time = slot.startTime;

          return (
            <div
              key={time}
              className={`
              ${styles.overviewTimeSlot}
              ${styles[slot.status]}
            `}
            >
              {formatTime(time)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className={styles.timeSlotsWrapper}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Tider</p>

        <p className={styles.description}>
          Välj starttid och sluttid för din bokning
        </p>
      </div>

      <div className={styles.resourceChoice}>
        <button
          type="button"
          className={styles.chooseButton}
          onClick={() => {
            const newValue = !chooseSpecificResource;

            setChooseSpecificResource(newValue);

            if (!newValue) {
              onResourceSelect(null);
              setSelectedStart(null);
              onSlotSelect(null);
            }
          }}
        >
          Välj själv
        </button>

        {chooseSpecificResource && (
          <div className={styles.resourceIdList}>
            {resources.map((resource, index) => (
              <button
                key={resource.resourceId}
                type="button"
                className={
                  selectedResourceId === resource.resourceId
                    ? styles.resourceIdSelected
                    : ""
                }
                onClick={() => {
                  onResourceSelect(resource.resourceId);
                  setSelectedStart(null);
                  onSlotSelect(null);
                }}
              >
                {formatResourceType(resource.resourceType)} {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className={styles.placeholder}>
          <p>Kontrollerar tillgänglighet...</p>
        </div>
      )}

      {!loading && error && (
        <div className={styles.placeholder}>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className={styles.placeholder}>
          <div className={styles.timeSlotList}>
            {slots.map((slot) => {
              const time = slot.startTime;

              const isSelected =
                selectedStart?.startTime === time ||
                (selectedSlot &&
                  new Date(time) >= new Date(selectedSlot.startTime) &&
                  new Date(time) <= new Date(selectedSlot.endTime));

              return (
                <button
                  key={time}
                  type="button"
                  disabled={!slot.isAvailable && !isEndTime(time)}
                  className={`
                    ${styles.timeButton}
                    ${styles[slot.status]}
                    ${isSelected ? styles.selected : ""}
                    `}
                  onClick={() => handleTimeClick(time)}
                >
                  {formatTime(time)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
