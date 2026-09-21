
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ReportIssue() {
  const navigate = useNavigate();

  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "HOSTEL",
    location: "",
    priority: "MEDIUM",
  });

  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Smart Issue Classification states
  const [classifying, setClassifying] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [classificationError, setClassificationError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear old suggestions when the title or description changes
    if (name === "title" || name === "description") {
      setSuggestion(null);
      setClassificationError("");
    }
  };

  // Smart Issue Classification
  const handleClassify = async () => {
    if (
      !formData.title.trim() ||
      !formData.description.trim()
    ) {
      setClassificationError(
        "Please enter the issue title and description first."
      );
      setSuggestion(null);
      return;
    }

    setClassifying(true);
    setClassificationError("");
    setSuggestion(null);

    try {
      const response = await api.post(
        "/api/issues/classify",
        {
          title: formData.title,
          description: formData.description,
        }
      );

      setSuggestion(response.data);
    } catch (error) {
      console.error("Classification error:", error);

      setClassificationError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to classify this issue. Please try again."
      );
    } finally {
      setClassifying(false);
    }
  };

  // Apply suggested category and priority
  const applySuggestion = () => {
    if (!suggestion) return;

    setFormData((previous) => ({
      ...previous,
      category: suggestion.category,
      priority: suggestion.priority,
    }));

    setMessage(
      "Suggestions applied. You can still edit them."
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let imageUrl = "";

      // Step 1: Upload image to Cloudinary
      if (image) {
        const imageFormData = new FormData();
        imageFormData.append("image", image);

        const uploadResponse = await api.post(
          "/api/uploads/image",
          imageFormData
        );

        imageUrl = uploadResponse.data.imageUrl;
      }

      // Step 2: Create issue with the returned image URL
      const issueData = {
        ...formData,
        imageUrl: imageUrl || null,
        reportedBy: user.id,
        reporterName: user.name,
        reporterEmail: user.email,
      };

      await api.post("/api/issues", issueData);

      setMessage("Issue reported successfully!");

      setTimeout(() => {
        navigate("/my-issues");
      }, 800);
    } catch (error) {
      console.error("Issue submission error:", error);

      setMessage(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to report issue. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="issue-container">
        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <div className="issue-form-card">
          <div className="page-heading">
            <div className="page-heading-icon">🚨</div>

            <div>
              <h1>Report an Issue</h1>
              <p>
                Tell us about a problem on campus so the
                concerned department can resolve it.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Issue Title */}
            <div className="form-group">
              <label>Issue Title</label>

              <input
                type="text"
                name="title"
                placeholder="Example: Wi-Fi not working"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Issue Description */}
            <div className="form-group">
              <label>Description</label>

              <textarea
                name="description"
                placeholder="Describe the issue in detail..."
                value={formData.description}
                onChange={handleChange}
                rows="5"
                required
              />
            </div>

            {/* Smart Issue Classification */}
            <div className="form-group">
              <button
                type="button"
                className="primary-btn"
                onClick={handleClassify}
                disabled={classifying || loading}
              >
                {classifying
                  ? "Analyzing issue..."
                  : "✨ Suggest Category & Priority"}
              </button>

              {classificationError && (
                <p className="error-message">
                  {classificationError}
                </p>
              )}

              {suggestion && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "16px",
                    border: suggestion.ambiguous
                      ? "1px solid #f59e0b"
                      : "1px solid #bfdbfe",
                    borderRadius: "10px",
                    background: suggestion.ambiguous
                      ? "#fffbeb"
                      : "#eff6ff",
                    color: "#1f2937",
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>
                    ✨ Classification Suggestion
                  </h3>

                  <p>
                    <strong>Suggested Category:</strong>{" "}
                    {suggestion.category}
                  </p>

                  <p>
                    <strong>Suggested Priority:</strong>{" "}
                    {suggestion.priority}
                  </p>

                  <p>
                    <strong>Confidence indicator:</strong>{" "}
                    {suggestion.confidence}%
                  </p>

                  <p>
                    <strong>Why this suggestion?</strong>{" "}
                    {suggestion.explanation}
                  </p>

                  {suggestion.matchedKeywords?.length > 0 && (
                    <p>
                      <strong>Matched keywords:</strong>{" "}
                      {suggestion.matchedKeywords.join(", ")}
                    </p>
                  )}

                  {suggestion.ambiguous && (
                    <div
                      style={{
                        padding: "12px",
                        background: "#fef3c7",
                        borderRadius: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <strong>
                        ⚠️ Ambiguous classification
                      </strong>

                      <p style={{ marginBottom: 0 }}>
                        These categories have the same score:{" "}
                        {suggestion.topCategories?.join(", ")}.
                        Please review the suggested category.
                      </p>
                    </div>
                  )}

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#4b5563",
                    }}
                  >
                    This is an automated keyword-based suggestion.
                    Please review it before applying.
                  </p>

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={applySuggestion}
                  >
                    Apply Suggestions
                  </button>
                </div>
              )}
            </div>

            {/* Category and Priority */}
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="HOSTEL">Hostel</option>
                  <option value="CLASSROOM">Classroom</option>
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
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>

                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label>Location</label>

              <input
                type="text"
                name="location"
                placeholder="Example: Hostel Block A, Room 204"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label>Attach Image (Optional)</label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];

                  if (!selectedFile) {
                    setImage(null);
                    return;
                  }

                  if (selectedFile.size > 5 * 1024 * 1024) {
                    setMessage(
                      "Image must be 5 MB or smaller."
                    );
                    e.target.value = "";
                    setImage(null);
                    return;
                  }

                  setMessage("");
                  setImage(selectedFile);
                }}
              />

              {image && (
                <p>
                  Selected image: {image.name}
                </p>
              )}
            </div>

            {/* Submit and Cancel */}
            <div className="issue-submit-section">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-btn issue-submit-btn"
                disabled={loading || classifying}
              >
                {loading
                  ? image
                    ? "Uploading image & submitting..."
                    : "Submitting..."
                  : "🚨 Submit Issue"}
              </button>
            </div>
          </form>

          {/* Messages */}
          {message && (
            <div
              className={
                message === "Issue reported successfully!"
                  ? "success-message"
                  : "error-message"
              }
            >
              {message}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ReportIssue;