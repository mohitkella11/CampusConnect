
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const response = await api.get(
        `/api/notifications/user/${userId}/unread-count`
      );

      const data = response.data;

      const count =
        typeof data === "number"
          ? data
          : typeof data === "object" && data !== null
            ? Number(
                data.unreadCount ??
                data.count ??
                data.unread ??
                0
              )
            : Number(data);

      setUnreadCount(
        Number.isFinite(count) ? Math.max(0, count) : 0
      );
    } catch (error) {
      console.error("Failed to load unread notifications:", error);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (!userData) {
      navigate("/login");
      return;
    }

    let loggedInUser;

    try {
      loggedInUser = JSON.parse(userData);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    setUser(loggedInUser);

    const loadIssues = async () => {
      try {
        const response = await api.get(
          `/api/issues/user/${loggedInUser.id}`
        );

        setIssues(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (error) {
        console.error(
          "Failed to load dashboard issues:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
    loadUnreadCount(loggedInUser.id);

    const intervalId = setInterval(() => {
      loadUnreadCount(loggedInUser.id);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [navigate, loadUnreadCount]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const totalIssues = issues.length;

  const pendingIssues = issues.filter(
    (issue) => issue.status === "PENDING"
  ).length;

  const resolvedIssues = issues.filter(
    (issue) => issue.status === "RESOLVED"
  ).length;

  const inProgressIssues = issues.filter(
    (issue) => issue.status === "IN_PROGRESS"
  ).length;

  return (
    <div className="dashboard-page">
      <nav className="navbar">
        <div className="nav-logo">
          <div className="logo-icon small">C</div>
          <span>CampusConnect</span>
        </div>

        <div className="nav-right">
          <span className="user-name">
            {user?.name || "User"}
          </span>

          <button
            className="logout-btn"
            onClick={() => navigate("/notifications")}
            style={styles.notificationButton}
          >
            🔔 Notifications
            {unreadCount > 0 && (
              <span style={styles.badge}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-container">
        <section className="welcome-section">
          <div>
            <p className="welcome-label">DASHBOARD</p>

            <h1>
              Welcome, {user?.name || "User"} 👋
            </h1>

            <p>
              Manage campus services, report issues,
              and track your requests.
            </p>
          </div>

          <div className="role-badge">
            {user?.role || "STUDENT"}
          </div>
        </section>

        <section className="stats-grid">
          <div
            className="stat-card clickable"
            onClick={() => navigate("/my-issues")}
          >
            <div className="stat-icon">📋</div>
            <div>
              <h3>{loading ? "..." : totalIssues}</h3>
              <p>My Issues</p>
            </div>
          </div>

          <div
            className="stat-card clickable"
            onClick={() => navigate("/my-issues")}
          >
            <div className="stat-icon">⏳</div>
            <div>
              <h3>{loading ? "..." : pendingIssues}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div
            className="stat-card clickable"
            onClick={() => navigate("/my-issues")}
          >
            <div className="stat-icon">✅</div>
            <div>
              <h3>{loading ? "..." : resolvedIssues}</h3>
              <p>Resolved</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div>
              <h3>0</h3>
              <p>Ratings</p>
            </div>
          </div>
        </section>

        {!loading && inProgressIssues > 0 && (
          <div className="progress-info">
            <span>🔄</span>
            <div>
              <strong>
                {inProgressIssues} issue
                {inProgressIssues !== 1 ? "s" : ""} in progress
              </strong>
              <p>
                The concerned department is currently
                working on your issue
                {inProgressIssues !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        )}

        <section className="quick-actions">
          <h2>Quick Actions</h2>

          <div className="action-grid">
            <button
              className="action-card"
              onClick={() => navigate("/report-issue")}
            >
              <span>🚨</span>
              <h3>Report an Issue</h3>
              <p>Report a problem on campus.</p>
            </button>

            <button
              className="action-card"
              onClick={() => navigate("/my-issues")}
            >
              <span>📋</span>
              <h3>My Issues</h3>
              <p>Track your reported issues.</p>
            </button>

            <button
              className="action-card"
              onClick={() => navigate("/my-issues")}
            >
              <span>🔍</span>
              <h3>Track Issue</h3>
              <p>Check the status of a request.</p>
            </button>

            <button
              className="action-card"
              onClick={() => navigate("/notifications")}
            >
              <span style={styles.bellContainer}>
                🔔
                {unreadCount > 0 && (
                  <span style={styles.badge}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>

              <h3>Notifications</h3>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount !== 1 ? "s" : ""
                    }`
                  : "You're all caught up."}
              </p>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  notificationButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  bellContainer: {
    position: "relative",
    display: "inline-block",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "20px",
    height: "20px",
    padding: "0 5px",
    borderRadius: "999px",
    background: "#dc2626",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: 1,
  },
};

export default Dashboard;