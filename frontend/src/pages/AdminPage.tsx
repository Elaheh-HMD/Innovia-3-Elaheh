import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import styles from "./css/AdminPage.module.css";
import UserList from "../components/UserList";
import Bookings from "../components/Bookings";
import ResourceStatus from "../components/ResourceStatus";
import RegisterUser from "../components/RegisterUser";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <>
        <Navbar />
            <main className={styles.adminPage}>
                <RegisterUser />
                <div className={styles.adminBookingViewWrapper}>
                    <section className={styles.admin}>
                        <p className={styles.eyebrow}>
                            Innovia
                        </p>

                        <h1>Admin-vy</h1>

                        <p className={styles.description}>
                            Här kommer admin kunna se alla bokningar, resurser och användare (bokat som ledigt). Även vy över olika sensorer.
                        </p>
                        <button className={styles.landingButton} onClick={() => navigate("/")}>
                            Gå till landnings-vy
                        </button>
                    </section>
                    <Bookings adminView />
                </div>

                <div className={styles.resourceStatusAndUserListWrapper}>
                    <ResourceStatus />
                    <UserList />
                </div>
            </main>
        </>
    );
}