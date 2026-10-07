import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import styles from "./css/LandingPage.module.css";
import Calendar from "../components/Calendar";
import TimeSlots from "../components/TimeSlots";
import Resources from "../components/Resources";
import Bookings from "../components/Bookings";
import AiAssistant from "../components/AiAssistant";

const API_URL = import.meta.env.VITE_API_URL;

type TimeSlot = {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    status: "green" | "yellow" | "red" | "locked";
};

export default function LandingPage() {
    const navigate = useNavigate();

    const [selectedDate, setSelectedDate] = useState<Date>();
    
    const [selectedResourceType, setSelectedResourceType] =
        useState<string | null>(null);

    const [selectedResourceId, setSelectedResourceId] =
        useState<number | null>(null);

    const [selectedSlot, setSelectedSlot] =
        useState<TimeSlot | null>(null);

    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMessage, setBookingMessage] = useState("");
    const [bookingError, setBookingError] = useState("");
    const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);

    async function handleBooking() {
        if (selectedResourceType === null || !selectedSlot) {
            setBookingError("Välj en resurs och en tid först.");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            setBookingError("Du måste vara inloggad för att boka.");
            return;
        }

        setBookingLoading(true);
        setBookingError("");
        setBookingMessage("");

        try {
            /*
             * BookingController tolkar inkommande tider som svensk lokal tid.
             * Därför skickar vi tiderna utan Z/UTC-offset.
             */
            const start = new Date(selectedSlot.startTime);
            const end = new Date(selectedSlot.endTime);

            const toSwedishLocalDateTime = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");
                const seconds = String(date.getSeconds()).padStart(2, "0");

                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            };

            const bookingData =
                selectedResourceId !== null
                    ? {
                        resourceId: selectedResourceId,
                        startTime: toSwedishLocalDateTime(start),
                        endTime: toSwedishLocalDateTime(end)
                    }
                    : {
                        resourceType: selectedResourceType,
                        startTime: toSwedishLocalDateTime(start),
                        endTime: toSwedishLocalDateTime(end)
                    };

            const bookingUrl =
                selectedResourceId !== null
                    ? `${API_URL}/api/Bookings`
                    : `${API_URL}/api/Bookings/automatic`;

            const response = await fetch(bookingUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            if (response.status === 401) {
                throw new Error(
                    "Du är inte inloggad eller din inloggning har gått ut."
                );
            }

            if (response.status === 409) {
                throw new Error(
                    "Tiden är redan bokad. Välj en annan tid."
                );
            }

            if (!response.ok) {
                const message = await response.text();

                throw new Error(
                    message || "Bokningen kunde inte genomföras."
                );
            }

            setBookingMessage("Bokningen är genomförd!");

            setSelectedSlot(null);

            /*
             * Triggerar en ny hämtning av bokningar.
             */
            setBookingsRefreshKey((current) => current + 1);
        } catch (error) {
            console.error("Fel vid bokning:", error);

            if (error instanceof Error) {
                setBookingError(error.message);
            } else {
                setBookingError("Ett okänt fel uppstod.");
            }
        } finally {
            setBookingLoading(false);
        }
    }

    return (
        <>
            <Navbar />

            <main className={styles.landingPage}>
                <div className={styles.resourcesLandingWrapper}>
                    <Resources
                        selectedResourceType={selectedResourceType}
                        onResourceTypeSelect={(resourceType) => {
                            setSelectedResourceType(resourceType);
                            setSelectedResourceId(null);
                            setSelectedSlot(null);
                            setBookingMessage("");
                            setBookingError("");
                        }}
                    />

                    <section className={styles.welcome}>
                        <p className={styles.eyebrow}>
                            Innovia
                        </p>

                        <h1>Välkommen</h1>

                        <p className={styles.description}>
                            Välj en resurs, ett datum och en ledig tid för att
                            genomföra en bokning.
                        </p>

                        <button
                            className={styles.adminButton}
                            onClick={() => navigate("/admin")}
                        >
                            Gå till admin-vy
                        </button>
                    </section>
                </div>

                <div className={styles.bookingCalendarWrapper}>
                    <Calendar
                        selectedDate={selectedDate}
                        selectedResourceType={selectedResourceType}
                        onDateSelect={(date) => {
                            setSelectedDate(date);
                            setSelectedSlot(null);
                            setBookingMessage("");
                            setBookingError("");
                        }}
                    />

                    <TimeSlots
                        selectedDate={selectedDate}
                        selectedResourceType={selectedResourceType}
                        selectedResourceId={selectedResourceId}
                        onResourceSelect={setSelectedResourceId}
                        selectedSlot={selectedSlot}
                        onSlotSelect={setSelectedSlot}
                    />

                    {selectedSlot && (
                        <section className={styles.bookingAction}>
                            <p>
                                Vald tid:{" "}
                                {new Date(
                                    selectedSlot.startTime
                                ).toLocaleTimeString("sv-SE", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                                {" – "}
                                {new Date(
                                    selectedSlot.endTime
                                ).toLocaleTimeString("sv-SE", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                            </p>

                            <button
                                type="button"
                                onClick={handleBooking}
                                disabled={bookingLoading}
                            >
                                {bookingLoading
                                    ? "Bokar..."
                                    : "Boka tid"}
                            </button>
                        </section>
                    )}

                    {bookingMessage && (
                        <div className={styles.successMessage}>
                            {bookingMessage}
                        </div>
                    )}

                    {bookingError && (
                        <div className={styles.errorMessage}>
                            {bookingError}
                        </div>
                    )}

                    <Bookings key={bookingsRefreshKey} />
                    <AiAssistant />
                </div>
            </main>
        </>
    );
}