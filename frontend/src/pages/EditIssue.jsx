import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function EditIssue() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "HOSTEL",
    location: "",
    priority: "MEDIUM",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (!userData) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(userData);

    const loadIssue = async () => {
      try {
        const response = await api.get(`/api/issues/${id}`);

        const issue = response.data;

        if (issue.reportedBy !== user.id) {
          setMessage(
            "You are not allowed to edit this issue."
          );

          setCanEdit(false);
          setLoading(false);
          return;
        }

        if (issue.status !== "PENDING") {
          setMessage(
            "This issue can no longer be edited because processing has started."
          );

          setCanEdit(false);
          setLoading(false);
          return;
        }

        setFormData({
          title: issue.title || "",
          description: issue.description || "",
          category: issue.category || "HOSTEL",
          location: issue.location || "",
          priority: issue.priority || "MEDIUM",
        });

        setLoading(false);

      } catch (error) {
        console.error(error);

        setMessage(
          "Unable to load the issue."
        );

        setCanEdit(false);
        setLoading(false);
      }
    };

    loadIssue();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      await api.put(
        `/api/issues/${id}`,
        formData
      );

      setMessage(
        "Issue updated successfully!"
      );

      setTimeout(() => {
        navigate("/my-issues");
      }, 700);

    } catch (error) {
      console.error(error);

      if (error.response?.data?.message) {
        setMessage(
          error.response.data.message
        );
      } else {
        setMessage(
          "Failed to update issue."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  if (loading) {
    return (
      <div className="dashboard-page">

        <nav className="navbar">

          <div className="nav-logo">

            <div className="logo-icon small">
              C
            </div>

            <span>
              CampusConnect
            </span>

          </div>

        </nav>

        <main className="issue-container">

          <div className="empty-state">

            <div className="loading-spinner">
              ⏳
            </div>

            <p>
              Loading issue...
            </p>

          </div>

        </main>

      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="dashboard-page">

        <nav className="navbar">

          <div className="nav-logo">

            <div className="logo-icon small">
              C
            </div>

            <span>
              CampusConnect
            </span>

          </div>

          <div className="nav-right">

            <span className="user-name">
              {user?.name || "User"}
            </span>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        </nav>

        <main className="issue-container">

          <div className="empty-state">

            <div className="empty-icon">
              ⚠️
            </div>

            <h2>
              Unable to Edit Issue
            </h2>

            <p>
              {message}
            </p>

            <button
              className="primary-btn empty-action-btn"
              onClick={() => navigate("/my-issues")}
            >
              Back to My Issues
            </button>

          </div>

        </main>

      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <nav className="navbar">

        <div className="nav-logo">

          <div className="logo-icon small">
            C
          </div>

          <span>
            CampusConnect
          </span>

        </div>

        <div className="nav-right">

          <span className="user-name">
            {user?.name || "User"}
          </span>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>

      <main className="issue-container">

        <button
          className="back-btn"
          onClick={() => navigate("/my-issues")}
        >
          ← Back to My Issues
        </button>

        <div className="issue-form-card">

          <div className="page-heading">

            <div className="page-heading-icon">
              ✏️
            </div>

            <div>

              <h1>
                Edit Issue
              </h1>

              <p>
                Correct the details of your reported issue.
              </p>

            </div>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <label>
                Issue Title
              </label>

              <input
                type="text"
                name="title"
                placeholder="Example: Wi-Fi not working"
                value={formData.title}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-group">

              <label>
                Description
              </label>

              <textarea
                name="description"
                placeholder="Describe the issue in detail..."
                value={formData.description}
                onChange={handleChange}
                rows="5"
                required
              />

            </div>

            <div className="form-row">

              <div className="form-group">

                <label>
                  Category
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="HOSTEL">
                    Hostel
                  </option>

                  <option value="CLASSROOM">
                    Classroom
                  </option>

                  <option value="WIFI">
                    Wi-Fi / Internet
                  </option>

                  <option value="ELECTRICAL">
                    Electrical
                  </option>

                  <option value="PLUMBING">
                    Plumbing
                  </option>

                  <option value="TRANSPORT">
                    Transport
                  </option>

                  <option value="CLEANLINESS">
                    Cleanliness
                  </option>

                  <option value="SECURITY">
                    Security
                  </option>

                  <option value="OTHER">
                    Other
                  </option>

                </select>

              </div>

              <div className="form-group">

                <label>
                  Priority
                </label>

                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >

                  <option value="LOW">
                    Low
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HIGH">
                    High
                  </option>

                  <option value="URGENT">
                    Urgent
                  </option>

                </select>

              </div>

            </div>

            <div className="form-group">

              <label>
                Location
              </label>

              <input
                type="text"
                name="location"
                placeholder="Example: Hostel Block A, Room 204"
                value={formData.location}
                onChange={handleChange}
                required
              />

            </div>

            <div className="issue-submit-section">

              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/my-issues")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-btn issue-submit-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "💾 Save Changes"}
              </button>

            </div>

          </form>

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

        </div>

      </main>

    </div>
  );
}

export default EditIssue;