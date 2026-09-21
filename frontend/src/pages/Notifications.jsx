
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (!user?.id) {
      setError("Please log in to view notifications.");
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await api.get(
        `/api/notifications/user/${user.id}`
      );

      setNotifications(response.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications(true);

    // Automatically refresh every 15 seconds.
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 15000);

    // Stop refreshing when leaving the page.
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readStatus: true }
            : notification
        )
      );
    } catch (err) {
      console.error(err);
      alert("Unable to mark notification as read.");
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(
      (notification) => !notification.readStatus
    );

    for (const notification of unread) {
      try {
        await api.put(
          `/api/notifications/${notification.id}/read`
        );
      } catch (err) {
        console.error(err);
      }
    }

    await fetchNotifications();
  };

  return (
    <div style={styles.page}>
      <nav style={styles.navbar}>
        <h2
          style={styles.logo}
          onClick={() => navigate("/dashboard")}
        >
          CampusConnect
        </h2>

        <button
          style={styles.backButton}
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </nav>

      <main style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>Notifications</h1>
            <p style={styles.subtitle}>
              Stay updated about your reported issues.
            </p>
          </div>

          <button
            style={styles.markAllButton}
            onClick={markAllAsRead}
            disabled={
              !notifications.some((n) => !n.readStatus)
            }
          >
            Mark all as read
          </button>
        </div>

        {loading && <p>Loading notifications...</p>}

        {error && <p style={styles.error}>{error}</p>}

        {!loading && !error && notifications.length === 0 && (
          <div style={styles.empty}>
            <h3>No notifications yet</h3>
            <p>
              Updates about your issues will appear here.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                ...styles.card,
                background: notification.readStatus
                  ? "#ffffff"
                  : "#eff6ff",
                borderLeft: notification.readStatus
                  ? "4px solid #d1d5db"
                  : "4px solid #2563eb",
              }}
            >
              <div style={styles.cardContent}>
                <div style={styles.cardTop}>
                  <strong style={styles.message}>
                    {notification.message}
                  </strong>

                  {!notification.readStatus && (
                    <span style={styles.unread}>New</span>
                  )}
                </div>

                <p style={styles.date}>
                  {notification.createdAt
                    ? new Date(
                        notification.createdAt
                      ).toLocaleString()
                    : ""}
                </p>

                <div style={styles.actions}>
                  <button
                    style={styles.trackButton}
                    onClick={() =>
                      navigate(
                        `/track-issue/${notification.issueId}`
                      )
                    }
                  >
                    Track issue
                  </button>

                  {!notification.readStatus && (
                    <button
                      style={styles.readButton}
                      onClick={() =>
                        markAsRead(notification.id)
                      }
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    fontFamily: "Arial, sans-serif",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 6%",
    background: "#ffffff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  logo: {
    margin: 0,
    color: "#2563eb",
    cursor: "pointer",
  },
  backButton: {
    padding: "10px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#ffffff",
    cursor: "pointer",
  },
  container: {
    maxWidth: "900px",
    margin: "35px auto",
    padding: "0 20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "25px",
  },
  heading: {
    marginBottom: "8px",
    color: "#111827",
  },
  subtitle: {
    margin: 0,
    color: "#6b7280",
  },
  markAllButton: {
    padding: "10px 15px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  card: {
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  message: {
    color: "#1f2937",
    lineHeight: 1.5,
  },
  unread: {
    color: "#1d4ed8",
    background: "#dbeafe",
    borderRadius: "20px",
    padding: "4px 10px",
    fontSize: "12px",
  },
  date: {
    margin: 0,
    fontSize: "13px",
    color: "#6b7280",
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  trackButton: {
    padding: "9px 14px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
  },
  readButton: {
    padding: "9px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "#ffffff",
    cursor: "pointer",
  },
  empty: {
    background: "#ffffff",
    padding: "35px",
    textAlign: "center",
    borderRadius: "10px",
    color: "#6b7280",
  },
  error: {
    color: "#dc2626",
  },
};

export default Notifications;