
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [issues, setIssues] = useState([]);
  const [ratings, setRatings] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState("");

  const [departmentStaff, setDepartmentStaff] = useState({});
  const [staffLoading, setStaffLoading] = useState({});
  const [staffErrors, setStaffErrors] = useState({});

  const [loading, setLoading] = useState(true);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [ratingsError, setRatingsError] = useState("");

  const [savingAssignment, setSavingAssignment] = useState({});
  const [savingStatus, setSavingStatus] = useState({});
  const [savingPriority, setSavingPriority] = useState({});

  const [assignmentMessage, setAssignmentMessage] = useState({});
  const [filter, setFilter] = useState("ALL");

  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    departmentId: "",
  });

  const [creatingStaff, setCreatingStaff] = useState(false);
  const [createStaffMessage, setCreateStaffMessage] = useState("");
  const [createStaffError, setCreateStaffError] = useState("");

  // LOAD ADMIN DATA
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
      navigate("/login");
      return;
    }

    if (loggedInUser.role !== "ADMIN") {
      navigate("/dashboard");
      return;
    }

    setUser(loggedInUser);

    const loadIssues = async () => {
      try {
        const response = await api.get("/api/issues");
        setIssues(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to load issues:", error);
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
  }, [navigate]);

  // UNREAD NOTIFICATION COUNT
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
    } catch (error) {
      console.error(
        "Failed to load unread notification count:",
        error
      );
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    loadUnreadCount();

    const intervalId = setInterval(loadUnreadCount, 15000);
    return () => clearInterval(intervalId);
  }, [user, loadUnreadCount]);

  // LOAD DEPARTMENTS
  const loadDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    setDepartmentsError("");

    try {
      const response = await api.get("/api/departments");

      setDepartments(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Failed to load departments:", error);

      setDepartmentsError(
        error.response?.data?.message ||
          "Could not load departments. Please refresh."
      );
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadDepartments();
    }
  }, [user, loadDepartments]);

  // LOAD STAFF FOR ISSUE DEPARTMENTS
  const loadDepartmentStaff = useCallback(async (departmentIds) => {
    if (!departmentIds.length) return;

    setStaffLoading((current) => {
      const next = { ...current };

      departmentIds.forEach((id) => {
        next[id] = true;
      });

      return next;
    });

    setStaffErrors((current) => {
      const next = { ...current };

      departmentIds.forEach((id) => {
        delete next[id];
      });

      return next;
    });

    const results = await Promise.all(
      departmentIds.map(async (departmentId) => {
        try {
          const response = await api.get(
            `/api/users/department/${departmentId}/staff`
          );

          return {
            departmentId,
            staff: Array.isArray(response.data)
              ? response.data.filter(
                  (member) =>
                    String(member.role).toUpperCase() === "STAFF"
                )
              : [],
            error: "",
          };
        } catch (error) {
          console.error(
            `Failed to load staff for department ${departmentId}:`,
            error
          );

          return {
            departmentId,
            staff: [],
            error:
              error.response?.data?.message ||
              "Unable to load staff for this department.",
          };
        }
      })
    );

    setDepartmentStaff((current) => {
      const next = { ...current };

      results.forEach(({ departmentId, staff }) => {
        next[departmentId] = staff;
      });

      return next;
    });

    setStaffErrors((current) => {
      const next = { ...current };

      results.forEach(({ departmentId, error }) => {
        if (error) {
          next[departmentId] = error;
        } else {
          delete next[departmentId];
        }
      });

      return next;
    });

    setStaffLoading((current) => {
      const next = { ...current };

      departmentIds.forEach((id) => {
        next[id] = false;
      });

      return next;
    });
  }, []);

  useEffect(() => {
    const departmentIds = [
      ...new Set(
        issues
          .map((issue) => issue.department?.id)
          .filter((id) => id !== null && id !== undefined)
          .map(String)
      ),
    ];

    loadDepartmentStaff(departmentIds);
  }, [
    issues
      .map((issue) => issue.department?.id ?? "")
      .join(","),
    loadDepartmentStaff,
  ]);

  // CREATE STAFF
  const handleStaffInputChange = (event) => {
    const { name, value } = event.target;

    setStaffForm((current) => ({
      ...current,
      [name]: value,
    }));

    setCreateStaffMessage("");
    setCreateStaffError("");
  };

  const handleCreateStaff = async (event) => {
    event.preventDefault();

    setCreateStaffMessage("");
    setCreateStaffError("");

    const name = staffForm.name.trim();
    const email = staffForm.email.trim().toLowerCase();
    const password = staffForm.password;
    const departmentId = staffForm.departmentId;

    if (!name || !email || !password || !departmentId) {
      setCreateStaffError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setCreateStaffError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    setCreatingStaff(true);

    try {
      const response = await api.post("/api/users/staff", {
        name,
        email,
        password,
        departmentId: Number(departmentId),
      });

      const newStaff = response.data;
      const newDepartmentId = String(
        newStaff.department?.id || departmentId
      );

      setDepartmentStaff((current) => {
        const existing = current[newDepartmentId] || [];

        const alreadyExists = existing.some(
          (member) => String(member.id) === String(newStaff.id)
        );

        return {
          ...current,
          [newDepartmentId]: alreadyExists
            ? existing
            : [...existing, newStaff],
        };
      });

      setCreateStaffMessage(
        `Staff account created successfully for ${newStaff.name}.`
      );

      setStaffForm({
        name: "",
        email: "",
        password: "",
        departmentId: "",
      });

      await loadDepartmentStaff([newDepartmentId]);
    } catch (error) {
      console.error("Failed to create staff:", error);

      setCreateStaffError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to create staff account. Please try again."
      );
    } finally {
      setCreatingStaff(false);
    }
  };

  // LOAD STUDENT RATINGS
  const loadRatings = async () => {
    setRatingsLoading(true);
    setRatingsError("");

    try {
      const response = await api.get("/api/admin/ratings");

      setRatings(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Failed to load ratings:", error);

      setRatingsError(
        error.response?.status === 403
          ? "Access denied. Only admins can view ratings."
          : "Failed to load ratings. Please try again."
      );
    } finally {
      setRatingsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadRatings();
    }
  }, [user]);

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // UPDATE ISSUE IN STATE
  const replaceIssue = (updatedIssue) => {
    setIssues((currentIssues) =>
      currentIssues.map((issue) =>
        String(issue.id) === String(updatedIssue.id)
          ? updatedIssue
          : issue
      )
    );
  };

  // UPDATE ISSUE STATUS
  const updateStatus = async (issueId, status) => {
    setSavingStatus((current) => ({
      ...current,
      [issueId]: true,
    }));

    try {
      const response = await api.put(
        `/api/issues/${issueId}/status?status=${status}`
      );

      replaceIssue(response.data);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to update issue status."
      );
    } finally {
      setSavingStatus((current) => ({
        ...current,
        [issueId]: false,
      }));
    }
  };

  // UPDATE ISSUE PRIORITY
  const updatePriority = async (issueId, priority) => {
    setSavingPriority((current) => ({
      ...current,
      [issueId]: true,
    }));

    try {
      const response = await api.put(
        `/api/issues/${issueId}/priority?priority=${priority}`
      );

      replaceIssue(response.data);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to update priority."
      );
    } finally {
      setSavingPriority((current) => ({
        ...current,
        [issueId]: false,
      }));
    }
  };

  // ASSIGN STAFF
  const assignStaff = async (issueId, staffId) => {
    if (!staffId) return;

    setSavingAssignment((current) => ({
      ...current,
      [issueId]: true,
    }));

    setAssignmentMessage((current) => ({
      ...current,
      [issueId]: "",
    }));

    try {
      const response = await api.put(
        `/api/issues/${issueId}/assign/${staffId}`
      );

      replaceIssue(response.data);

      setAssignmentMessage((current) => ({
        ...current,
        [issueId]: "Staff assigned successfully.",
      }));
    } catch (error) {
      console.error(error);

      setAssignmentMessage((current) => ({
        ...current,
        [issueId]:
          error.response?.data?.message ||
          "Failed to assign staff. Please try again.",
      }));
    } finally {
      setSavingAssignment((current) => ({
        ...current,
        [issueId]: false,
      }));
    }
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
      case "REJECTED":
        return "status-rejected";
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
  const formatDate = (dateString) => {
    if (!dateString) return "Date unavailable";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString();
  };

  // FILTER ISSUES
  const filteredIssues =
    filter === "ALL"
      ? issues
      : issues.filter((issue) => issue.status === filter);

  // STATISTICS
  const totalIssues = issues.length;

  const pendingIssues = issues.filter(
    (issue) => issue.status === "PENDING"
  ).length;

  const progressIssues = issues.filter(
    (issue) => issue.status === "IN_PROGRESS"
  ).length;

  const resolvedIssues = issues.filter(
    (issue) => issue.status === "RESOLVED"
  ).length;

  const totalRatings = ratings.length;

  const averageRating =
    totalRatings > 0
      ? (
          ratings.reduce(
            (sum, item) => sum + Number(item.rating || 0),
            0
          ) / totalRatings
        ).toFixed(1)
      : "0.0";

  return (
    <div className="dashboard-page">
      <nav className="navbar">
        <div className="nav-logo">
          <div className="logo-icon small">C</div>
          <span>CampusConnect</span>
        </div>

        <div className="nav-right">
          <span className="user-name">
            {user?.name || "Admin"}
          </span>

          <span className="admin-nav-badge">ADMIN</span>

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
            <p className="welcome-label">ADMINISTRATION</p>
            <h1>Admin Dashboard</h1>
            <p>
              Manage campus issues and coordinate with staff
              members.
            </p>
          </div>

          <button
            onClick={() => navigate("/admin-analytics")}
          >
            📊 View Analytics
          </button>
        </div>

        {/* ISSUE STATISTICS */}
        <section className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📋</div>
            <div>
              <h2>{loading ? "..." : totalIssues}</h2>
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

        {/* CREATE STAFF */}
        <section className="admin-issues-section">
          <div className="admin-section-header">
            <div>
              <h2>👷 Create Staff Account</h2>
              <p>
                Create a staff login and assign the staff member
                to a campus department.
              </p>
            </div>

            <button
              type="button"
              onClick={loadDepartments}
              disabled={departmentsLoading}
            >
              {departmentsLoading
                ? "Loading..."
                : "🔄 Refresh Departments"}
            </button>
          </div>

          {departmentsError && (
            <div className="empty-state">
              <p>{departmentsError}</p>
            </div>
          )}

          <form
            className="admin-controls"
            onSubmit={handleCreateStaff}
          >
            <div className="admin-control">
              <label htmlFor="staff-name">Full Name</label>
              <input
                id="staff-name"
                type="text"
                name="name"
                value={staffForm.name}
                onChange={handleStaffInputChange}
                placeholder="Enter staff name"
                required
                disabled={creatingStaff}
              />
            </div>

            <div className="admin-control">
              <label htmlFor="staff-email">Email</label>
              <input
                id="staff-email"
                type="email"
                name="email"
                value={staffForm.email}
                onChange={handleStaffInputChange}
                placeholder="staff@example.com"
                required
                disabled={creatingStaff}
              />
            </div>

            <div className="admin-control">
              <label htmlFor="staff-password">Password</label>
              <input
                id="staff-password"
                type="password"
                name="password"
                value={staffForm.password}
                onChange={handleStaffInputChange}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
                disabled={creatingStaff}
                autoComplete="new-password"
              />
            </div>

            <div className="admin-control">
              <label htmlFor="staff-department">
                Department
              </label>

              <select
                id="staff-department"
                name="departmentId"
                value={staffForm.departmentId}
                onChange={handleStaffInputChange}
                required
                disabled={
                  creatingStaff ||
                  departmentsLoading ||
                  departments.length === 0
                }
              >
                <option value="">
                  {departmentsLoading
                    ? "Loading departments..."
                    : departments.length === 0
                      ? "No departments available"
                      : "Select Department"}
                </option>

                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={String(department.id)}
                  >
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-control">
              <label>&nbsp;</label>
              <button
                type="submit"
                disabled={
                  creatingStaff ||
                  departmentsLoading ||
                  departments.length === 0
                }
              >
                {creatingStaff
                  ? "Creating Account..."
                  : "➕ Create Staff"}
              </button>
            </div>
          </form>

          {createStaffMessage && (
            <p
              role="status"
              style={{
                color: "green",
                marginTop: "12px",
                fontWeight: "600",
              }}
            >
              {createStaffMessage}
            </p>
          )}

          {createStaffError && (
            <p
              role="alert"
              style={{
                color: "red",
                marginTop: "12px",
                fontWeight: "600",
              }}
            >
              {createStaffError}
            </p>
          )}
        </section>

        {/* ALL CAMPUS ISSUES */}
        <section className="admin-issues-section">
          <div className="admin-section-header">
            <div>
              <h2>All Campus Issues</h2>
              <p>
                Review issues and assign the appropriate
                department staff directly from each issue.
              </p>
            </div>

            <select
              className="admin-filter"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >
              <option value="ALL">All Issues</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {loading && (
            <div className="empty-state">
              <div className="loading-spinner">⏳</div>
              <p>Loading issues...</p>
            </div>
          )}

          {!loading && filteredIssues.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h2>No Issues Found</h2>
              <p>
                There are no issues matching this filter.
              </p>
            </div>
          )}

          {!loading && filteredIssues.length > 0 && (
            <div className="admin-issues-list">
              {filteredIssues.map((issue) => {
                const departmentId = issue.department?.id;

                const departmentKey =
                  departmentId === null ||
                  departmentId === undefined
                    ? ""
                    : String(departmentId);

                const availableStaff =
                  departmentStaff[departmentKey] || [];

                const isStaffLoading =
                  Boolean(staffLoading[departmentKey]);

                const staffError =
                  staffErrors[departmentKey];

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
                          </strong>{" "}
                          {issue.reporterEmail
                            ? `(${issue.reporterEmail})`
                            : ""}
                        </p>
                      </div>

                      <span
                        className={`status-badge ${getStatusClass(
                          issue.status
                        )}`}
                      >
                        {String(issue.status || "").replace(
                          "_",
                          " "
                        )}
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
                        <strong>📂 {issue.category}</strong>
                      </div>

                      <div>
                        <small>Location</small>
                        <strong>📍 {issue.location}</strong>
                      </div>

                      <div>
                        <small>Priority</small>
                        <strong
                          className={getPriorityClass(
                            issue.priority
                          )}
                        >
                          ⚡ {issue.priority}
                        </strong>
                      </div>

                      <div>
                        <small>Department</small>
                        <strong>
                          🏢{" "}
                          {issue.department?.name ||
                            "Not assigned"}
                        </strong>
                      </div>

                      <div>
                        <small>Assigned Staff</small>
                        <strong>
                          👷{" "}
                          {issue.assignedStaffName ||
                            "Not assigned"}
                        </strong>
                      </div>

                      <div>
                        <small>Reported On</small>
                        <strong>
                          {formatDate(issue.createdAt)}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-controls">
                      {/* STATUS */}
                      <div className="admin-control">
                        <label>Status</label>

                        <select
                          value={issue.status || "PENDING"}
                          disabled={Boolean(
                            savingStatus[issue.id]
                          )}
                          onChange={(event) =>
                            updateStatus(
                              issue.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="PENDING">
                            Pending
                          </option>
                          <option value="IN_PROGRESS">
                            In Progress
                          </option>
                          <option value="RESOLVED">
                            Resolved
                          </option>
                          <option value="REJECTED">
                            Rejected
                          </option>
                        </select>

                        {savingStatus[issue.id] && (
                          <small>Updating status...</small>
                        )}
                      </div>

                      {/* PRIORITY */}
                      <div className="admin-control">
                        <label>Priority</label>

                        <select
                          value={issue.priority || "MEDIUM"}
                          disabled={Boolean(
                            savingPriority[issue.id]
                          )}
                          onChange={(event) =>
                            updatePriority(
                              issue.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>

                        {savingPriority[issue.id] && (
                          <small>Updating priority...</small>
                        )}
                      </div>

                      {/* STAFF ASSIGNMENT */}
                      <div className="admin-control staff-control">
                        <label>Assign Department Staff</label>

                        {!departmentKey ? (
                          <select disabled value="">
                            <option value="">
                              No department assigned
                            </option>
                          </select>
                        ) : staffError ? (
                          <select disabled value="">
                            <option value="">
                              Could not load staff
                            </option>
                          </select>
                        ) : isStaffLoading ? (
                          <select disabled value="">
                            <option value="">
                              Loading department staff...
                            </option>
                          </select>
                        ) : availableStaff.length === 0 ? (
                          <select disabled value="">
                            <option value="">
                              No staff in this department
                            </option>
                          </select>
                        ) : (
                          <select
                            value={
                              issue.assignedTo == null
                                ? ""
                                : String(issue.assignedTo)
                            }
                            disabled={Boolean(
                              savingAssignment[issue.id]
                            )}
                            onChange={(event) =>
                              assignStaff(
                                issue.id,
                                event.target.value
                              )
                            }
                          >
                            <option value="">
                              Select Staff
                            </option>

                            {availableStaff.map(
                              (staffMember) => (
                                <option
                                  key={staffMember.id}
                                  value={String(staffMember.id)}
                                >
                                  {staffMember.name}
                                </option>
                              )
                            )}
                          </select>
                        )}

                        <small>
                          Department:{" "}
                          {issue.department?.name ||
                            "Not assigned"}
                        </small>

                        {isStaffLoading && (
                          <small>
                            Fetching staff for this department...
                          </small>
                        )}

                        {staffError && (
                          <small>{staffError}</small>
                        )}

                        {departmentKey &&
                          !isStaffLoading &&
                          !staffError &&
                          availableStaff.length === 0 && (
                            <small>
                              No staff members are assigned to
                              this department yet.
                            </small>
                          )}

                        {savingAssignment[issue.id] && (
                          <small>Assigning staff...</small>
                        )}

                        {assignmentMessage[issue.id] && (
                          <small>
                            {assignmentMessage[issue.id]}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* STUDENT RATINGS */}
        <section className="admin-issues-section">
          <div className="admin-section-header">
            <div>
              <h2>⭐ Student Ratings</h2>
              <p>
                Review feedback submitted for resolved campus
                issues.
              </p>
            </div>

            <button
              type="button"
              onClick={loadRatings}
              disabled={ratingsLoading}
            >
              {ratingsLoading
                ? "Loading..."
                : "🔄 Refresh Ratings"}
            </button>
          </div>

          <section className="admin-stats">
            <div className="admin-stat-card">
              <div className="admin-stat-icon">⭐</div>
              <div>
                <h2>
                  {ratingsLoading
                    ? "..."
                    : `${averageRating}/5`}
                </h2>
                <p>Average Rating</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon">💬</div>
              <div>
                <h2>
                  {ratingsLoading ? "..." : totalRatings}
                </h2>
                <p>Total Ratings</p>
              </div>
            </div>
          </section>

          {ratingsError && (
            <div className="empty-state">
              <p>{ratingsError}</p>
            </div>
          )}

          {!ratingsLoading &&
            !ratingsError &&
            ratings.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">⭐</div>
                <h2>No Ratings Yet</h2>
                <p>
                  Student ratings will appear here after
                  they rate resolved issues.
                </p>
              </div>
            )}

          {!ratingsLoading &&
            !ratingsError &&
            ratings.length > 0 && (
              <div className="admin-issues-list">
                {ratings.map((rating) => (
                  <div
                    className="admin-issue-card"
                    key={rating.id}
                  >
                    <div className="admin-issue-top">
                      <div>
                        <span className="issue-id">
                          ISSUE #{rating.issueId}
                        </span>

                        <h2>{rating.rating} / 5 ⭐</h2>

                        <p className="admin-reporter">
                          Student ID: {rating.studentId}
                        </p>
                      </div>

                      <span className="status-badge status-resolved">
                        RATED
                      </span>
                    </div>

                    <p className="admin-description">
                      <strong>Feedback:</strong>{" "}
                      {rating.feedback?.trim()
                        ? rating.feedback
                        : "No written feedback provided."}
                    </p>

                    <div className="admin-info-grid">
                      <div>
                        <small>Rating</small>
                        <strong>
                          {"⭐".repeat(
                            Math.max(
                              0,
                              Math.min(
                                5,
                                Number(rating.rating) || 0
                              )
                            )
                          )}
                        </strong>
                      </div>

                      <div>
                        <small>Submitted</small>
                        <strong>
                          {formatDate(rating.createdAt)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;