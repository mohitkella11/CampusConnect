
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function StaffDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingIssueId, setUpdatingIssueId] = useState(null);
  const [historyByIssue, setHistoryByIssue] = useState({});
  const [historyLoadingId, setHistoryLoadingId] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

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

    if (loggedInUser.role !== "STAFF") {
      navigate(
        loggedInUser.role === "ADMIN"
          ? "/admin-dashboard"
          : "/dashboard"
      );
      return;
    }

    setUser(loggedInUser);
  }, [navigate]);

  // LOAD ISSUES
  const loadIssues = useCallback(
    async (showLoader = false) => {
      if (!user) return;

      if (showLoader) {
        setRefreshing(true);
      }

      try {
        setError("");

        const response = await api.get("/api/issues");

        setIssues(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (err) {
        console.error("Failed to load issues:", err);

        setError(
          err.response?.data?.message ||
            "Could not load issues. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;

    loadIssues();

    const intervalId = setInterval(() => {
      loadIssues();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [user, loadIssues]);

  // UNREAD NOTIFICATIONS
  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await api.get(
        `/api/notifications/user/${user.id}/unread-count`
      );

      const data = response.data;
      const count =
        typeof data === "number"
          ? data
          : Number(data?.unreadCount ?? data?.count ?? data?.unread ?? 0);

      setUnreadCount(
        Number.isFinite(count) ? Math.max(0, count) : 0
      );
    } catch (err) {
      console.error(
        "Failed to load unread notification count:",
        err
      );
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    loadUnreadCount();

    const intervalId = setInterval(loadUnreadCount, 15000);
    return () => clearInterval(intervalId);
  }, [user, loadUnreadCount]);

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // UPDATE ISSUE STATUS
  const updateStatus = async (issueId, status) => {
    setUpdatingIssueId(issueId);

    try {
      const response = await api.put(
        `/api/issues/${issueId}/status`,
        null,
        {
          params: { status },
        }
      );

      const updatedIssue = response.data;

      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue.id === issueId
            ? { ...issue, ...updatedIssue }
            : issue
        )
      );

      if (expandedHistoryId === issueId) {
        await loadIssueHistory(issueId, true);
      }
    } catch (err) {
      console.error("Failed to update issue status:", err);

      alert(
        err.response?.data?.message ||
          "Failed to update issue status. Check that this issue belongs to your department."
      );
    } finally {
      setUpdatingIssueId(null);
    }
  };

  // LOAD ISSUE HISTORY
  const loadIssueHistory = async (issueId, force = false) => {
    if (!force && historyByIssue[issueId]) {
      return;
    }

    setHistoryLoadingId(issueId);

    try {
      const response = await api.get(
        `/api/issues/${issueId}/history`
      );

      setHistoryByIssue((current) => ({
        ...current,
        [issueId]: Array.isArray(response.data)
          ? response.data
          : [],
      }));
    } catch (err) {
      console.error("Failed to load issue history:", err);

      setHistoryByIssue((current) => ({
        ...current,
        [issueId]: {
          error:
            err.response?.data?.message ||
            "Could not load this issue's history.",
        },
      }));
    } finally {
      setHistoryLoadingId(null);
    }
  };

  const toggleHistory = async (issueId) => {
    if (expandedHistoryId === issueId) {
      setExpandedHistoryId(null);
      return;
    }

    setExpandedHistoryId(issueId);
    await loadIssueHistory(issueId);
  };

  // STATUS CSS
  const getStatusClass = (status) => {
    switch (status) {
      case "PENDING":
        return "status-pending";
      case "IN_PROGRESS":
        return "status-progress";
      case "RESOLVED":
        return "status-resolved";
      default:
        return "status-pending";
    }
  };

  // PRIORITY CSS
  const getPriorityClass = (priority) => {
    switch (priority) {
      case "URGENT":
        return "priority-urgent";
      case "HIGH":
        return "priority-high";
      case "MEDIUM":
        return "priority-medium";
      case "LOW":
        return "priority-low";
      default:
        return "priority-medium";
    }
  };

  // DATE FORMAT
  const formatDate = (dateValue) => {
    if (!dateValue) return "Not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString();
  };

  // DEPARTMENTS
  const departments = useMemo(() => {
    const names = issues
      .map((issue) => issue.department?.name)
      .filter(Boolean);

    return [...new Set(names)].sort();
  }, [issues]);

  // FILTER ISSUES
  const filteredIssues = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesSearch =
        !normalizedSearch ||
        String(issue.id || "").includes(normalizedSearch) ||
        (issue.title || "").toLowerCase().includes(normalizedSearch) ||
        (issue.description || "").toLowerCase().includes(normalizedSearch) ||
        (issue.category || "").toLowerCase().includes(normalizedSearch) ||
        (issue.location || "").toLowerCase().includes(normalizedSearch) ||
        (issue.reporterName || "").toLowerCase().includes(normalizedSearch) ||
        (issue.department?.name || "").toLowerCase().includes(normalizedSearch) ||
        (issue.assignedStaffName || "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        issue.status === statusFilter;

      const matchesDepartment =
        departmentFilter === "ALL" ||
        issue.department?.name === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [issues, searchTerm, statusFilter, departmentFilter]);

  // STATISTICS
  const pendingIssues = issues.filter(
    (issue) => issue.status === "PENDING"
  ).length;

  const progressIssues = issues.filter(
    (issue) => issue.status === "IN_PROGRESS"
  ).length;

  const resolvedIssues = issues.filter(
    (issue) => issue.status === "RESOLVED"
  ).length;

  if (!user) {
    return (
      <div className="empty-state">
        Loading staff dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <nav className="navbar">
        <div className="nav-logo">
          <div className="logo-icon small">C</div>
          <span>CampusConnect</span>
        </div>

        <div className="nav-right">
          <span className="user-name">
            {user.name || "Staff"}
          </span>

          <span className="staff-nav-badge">
            STAFF
          </span>

          <button
            type="button"
            className="logout-btn notification-nav-btn"
            onClick={() => navigate("/notifications")}
            aria-label={`Notifications${
              unreadCount > 0 ? `, ${unreadCount} unread` : ""
            }`}
          >
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="notification-count-badge">
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

      <main className="admin-container">
        <div className="admin-heading">
          <div>
            <p className="welcome-label">STAFF PORTAL</p>

            <h1>Shared Staff Dashboard</h1>

            <p>
              View current and previous campus issues across
              all departments.
            </p>

            <p>
              Your department:{" "}
              <strong>
                {user.department?.name || "Not assigned"}
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadIssues(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "🔄 Refresh Issues"}
          </button>
        </div>

        <section className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📋</div>
            <div>
              <h2>{loading ? "..." : issues.length}</h2>
              <p>Total Issues</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">⏳</div>
            <div>
              <h2>{loading ? "..." : pendingIssues}</h2>
              <p>Pending</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">🔄</div>
            <div>
              <h2>{loading ? "..." : progressIssues}</h2>
              <p>In Progress</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">✅</div>
            <div>
              <h2>{loading ? "..." : resolvedIssues}</h2>
              <p>Resolved</p>
            </div>
          </div>
        </section>

        <section className="admin-issues-section">
          <div className="admin-section-header">
            <div>
              <h2>All Campus Issues</h2>
              <p>
                All departments' issues are shown here, including
                resolved issues and older reports. Staff can update
                issues assigned to their department.
              </p>
            </div>
          </div>

          <div className="staff-filters">
            <input
              type="text"
              placeholder="Search by issue, category, location, reporter..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="empty-state" role="alert">
              <p>{error}</p>

              <button
                type="button"
                onClick={() => loadIssues(true)}
              >
                Try Again
              </button>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <div className="loading-spinner">⏳</div>
              <p>Loading all campus issues...</p>
            </div>
          )}

          {!loading && !error && issues.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h2>No Issues Found</h2>
              <p>
                There are currently no issues in the system.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            issues.length > 0 &&
            filteredIssues.length === 0 && (
              <div className="empty-state">
                <h2>No Matching Issues</h2>
                <p>
                  Try changing the search text or filters.
                </p>
              </div>
            )}

          {!loading && filteredIssues.length > 0 && (
            <div className="admin-issues-list">
              {filteredIssues.map((issue) => {
                const canUpdate =
                  issue.status !== "RESOLVED" &&
                  (
                    !issue.department?.id ||
                    !user.department?.id ||
                    String(issue.department.id) ===
                      String(user.department.id) ||
                    String(issue.assignedTo) === String(user.id)
                  );

                const history = historyByIssue[issue.id];

                return (
                  <div
                    className="admin-issue-card"
                    key={issue.id}
                  >
                    <div className="admin-issue-top">
                      <div>
                        <span className="issue-id">
                          ISSUE #{issue.id}
                        </span>

                        <h2>{issue.title}</h2>

                        <p className="admin-reporter">
                          Reported by{" "}
                          <strong>
                            {issue.reporterName || "Unknown"}
                          </strong>
                        </p>
                      </div>

                      <span
                        className={`status-badge ${getStatusClass(
                          issue.status
                        )}`}
                      >
                        {String(issue.status || "UNKNOWN")
                          .replace("_", " ")}
                      </span>
                    </div>

                    <p className="admin-description">
                      {issue.description}
                    </p>

                    {/* ATTACHED IMAGE */}
                    {issue.imageUrl && (
                      <div style={{ margin: "16px 0" }}>
                        <img
                          src={issue.imageUrl}
                          alt={`Attached image for issue ${issue.id}`}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            maxWidth: "420px",
                            maxHeight: "320px",
                            objectFit: "contain",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            background: "#f8fafc",
                          }}
                        />
                      </div>
                    )}

                    <div className="admin-info-grid">
                      <div>
                        <small>Category</small>
                        <strong>
                          📂 {issue.category || "N/A"}
                        </strong>
                      </div>

                      <div>
                        <small>Location</small>
                        <strong>
                          📍 {issue.location || "N/A"}
                        </strong>
                      </div>

                      <div>
                        <small>Priority</small>
                        <strong
                          className={getPriorityClass(issue.priority)}
                        >
                          ⚡ {issue.priority || "MEDIUM"}
                        </strong>
                      </div>

                      <div>
                        <small>Department</small>
                        <strong>
                          🏢 {issue.department?.name || "Not assigned"}
                        </strong>
                      </div>

                      <div>
                        <small>Assigned Staff</small>
                        <strong>
                          👷 {issue.assignedStaffName || "Not assigned"}
                        </strong>
                      </div>

                      <div>
                        <small>Reported</small>
                        <strong>{formatDate(issue.createdAt)}</strong>
                      </div>
                    </div>

                    <div className="staff-actions">
                      {canUpdate && issue.status === "PENDING" && (
                        <button
                          className="staff-start-btn"
                          disabled={updatingIssueId === issue.id}
                          onClick={() =>
                            updateStatus(issue.id, "IN_PROGRESS")
                          }
                        >
                          {updatingIssueId === issue.id
                            ? "Updating..."
                            : "🔧 Verify / Start Working"}
                        </button>
                      )}

                      {canUpdate && issue.status === "IN_PROGRESS" && (
                        <button
                          className="staff-resolve-btn"
                          disabled={updatingIssueId === issue.id}
                          onClick={() =>
                            updateStatus(issue.id, "RESOLVED")
                          }
                        >
                          {updatingIssueId === issue.id
                            ? "Updating..."
                            : "✅ Mark as Resolved"}
                        </button>
                      )}

                      {issue.status === "RESOLVED" && (
                        <div className="resolved-message">
                          ✅ This issue has been resolved.
                        </div>
                      )}

                      {!canUpdate && issue.status !== "RESOLVED" && (
                        <div className="resolved-message">
                          🔒 View only — this issue belongs to another
                          department.
                        </div>
                      )}

                      <button
                        type="button"
                        className="logout-btn"
                        onClick={() => toggleHistory(issue.id)}
                      >
                        {expandedHistoryId === issue.id
                          ? "Hide History"
                          : "📜 View Issue History"}
                      </button>
                    </div>

                    {expandedHistoryId === issue.id && (
                      <div className="issue-history-panel">
                        <h3>Issue History</h3>

                        {historyLoadingId === issue.id && (
                          <p>Loading history...</p>
                        )}

                        {history?.error && (
                          <p role="alert">{history.error}</p>
                        )}

                        {Array.isArray(history) &&
                          history.length === 0 &&
                          historyLoadingId !== issue.id && (
                            <p>No history records are available.</p>
                          )}

                        {Array.isArray(history) &&
                          history.length > 0 && (
                            <ol className="issue-history-list">
                              {history.map((entry, index) => (
                                <li key={entry.id ?? index}>
                                  <strong>
                                    {entry.status || "Update"}
                                  </strong>

                                  <p>
                                    {entry.description ||
                                      entry.message ||
                                      entry.action ||
                                      "Issue updated"}
                                  </p>

                                  <small>
                                    {formatDate(
                                      entry.createdAt || entry.timestamp
                                    )}
                                  </small>
                                </li>
                              ))}
                            </ol>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StaffDashboard;