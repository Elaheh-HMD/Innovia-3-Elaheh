import { useEffect, useMemo, useState } from "react";
import styles from "./css/Bookings.module.css";
import * as signalR from "@microsoft/signalr";

const API_URL = import.meta.env.VITE_API_URL;

type Booking = {
  bookingId: number;
  startTime: string;
  endTime: string;
  resourceId: number;
  resourceType: string;
  userId: string;
  userEmail: string;
};

export default function Bookings({ adminView = false }: { adminView?: boolean }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [showPassed, setShowPassed] = useState(false);

  // const connection = new signalR.HubConnectionBuilder()
  //   .withUrl("http://localhost:5197/Hubs/Booking")
  //   .build();

  // connection.on("BookingsChanged", () => {
  //   console.log("Hallo from connection!");
  // });
  const now = new Date().getTime();

  console.log("now: " + now);

  const currentBookings = useMemo(
    () => bookings.filter((b) => Date.parse(b.endTime) > now),
    [bookings, now],
  );
  const pastBookings = useMemo(
    () => bookings.filter((b) => Date.parse(b.endTime) <= now),
    [bookings, now],
  );

  useEffect(() => {
    async function getBookings() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Ingen inloggningstoken hittades.");
        }

        const endpoint = adminView ? `${API_URL}/api/Bookings` : `${API_URL}/api/Bookings/mine`;
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("GET /api/Bookings status:", response.status);

        if (response.status === 401) {
          throw new Error("Du är inte inloggad eller token har gått ut.");
        }

        if (response.status === 403) {
          throw new Error("Du har inte behörighet att läsa bokningarna.");
        }

        if (!response.ok) {
          throw new Error(
            `Kunde inte hämta bokningar. Status: ${response.status}`,
          );
        }

        const data: Booking[] = await response.json();

        console.log("Bokningar från backend:", data);

        setBookings(data);
      } catch (error) {
        console.error("Fel vid hämtning av bokningar:", error);

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Ett okänt fel uppstod.");
        }
      } finally {
        setLoading(false);
      }
    }

    getBookings();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/Hubs/Booking`)
      .withAutomaticReconnect()
      .build();

    connection.on("BookingsChanged", () => {
      getBookings();
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
  }, [adminView]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("sv-SE");
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const deleteBooking = async (id: number) => {
    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/api/Bookings/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      if (response.ok) {
        setBookings(
          bookings.filter((booking) => {
            return booking.bookingId !== id;
          }),
        );
      } else {
        return;
      }
    });
  };

  // const visibleBookings = showAll && !showPassed ? bookings : bookings.slice(0, 5);
  function visibleBookings() {
    const selectedBookings = showPassed ? pastBookings : currentBookings;
    return showAll ? selectedBookings : selectedBookings.slice(0, 5);
  }

  return (
    <section id="bookings" className={styles.bookingsWrapper}>
      <div className={styles.heading}>
        <div className={styles.headerAndButton}>
          <p className={styles.eyebrow}>Bokningar</p>

          {bookings.length > 5 && (
            <button type="button" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Visa färre bokningar ↑" : "Visa alla bokningar →"}
            </button>
          )}
          <button type="button" onClick={() => setShowPassed(!showPassed)}>
            {showPassed ? "Visa gamla bokningar" : "Visa aktuella bokningar"}
          </button>
        </div>

        <div className={styles.info}>
          <div className={styles.resource}>Resurs</div>
          <div className={styles.user}>Användare</div>
          <div className={styles.date}>Datum</div>
          <div className={styles.time}>Tid</div>
        </div>
      </div>

      {loading && (
        <div className={styles.placeholder}>
          <p>Hämtar bokningar...</p>
        </div>
      )}

      {!loading && error && (
        <div className={styles.placeholder}>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className={styles.placeholder}>
          <p>Inga bokningar ännu</p>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className={styles.bookingList}>
          {visibleBookings().map((booking) => (
            <div key={booking.bookingId} className={styles.bookingRow}>
              <div className={styles.resource}>{booking.resourceType}</div>

              <div className={styles.user}>{booking.userEmail}</div>

              <div className={styles.date}>{formatDate(booking.startTime)}</div>

              <div className={styles.time}>
                {formatTime(booking.startTime)}
                {" – "}
                {formatTime(booking.endTime)}
              </div>
              <button
                className={styles.deleteButton}
                onClick={() => deleteBooking(booking.bookingId)}
              >
                Ta bort
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
