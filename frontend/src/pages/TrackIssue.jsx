
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function TrackIssue() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentMessage, setCommentMessage] = useState("");

  // Rating state
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");
  const [existingRating, setExistingRating] = useState(false);

  const isResolved =
    issue?.status?.toUpperCase() === "RESOLVED";

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await api.get(
        `/api/issues/${id}/comments`
      );
      setComments(response.data);
    } catch (err) {
      console.error(err);
      setCommentError("Unable to load comments.");
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchRating = async () => {
    try {
      setRatingLoading(true);
      setRatingError("");

      const response = await api.get(
        `/api/issues/${id}/rating`
      );

      if (response.data) {
        setRating(response.data.rating || 0);
        setFeedback(response.data.feedback || "");
        setExistingRating(true);
      } else {
        setRating(0);
        setFeedback("");
        setExistingRating(false);
      }
    } catch (err) {
      console.error(err);
      setRatingError(
        err.response?.data?.message ||
        "Unable to load your rating."
      );
    } finally {
      setRatingLoading(false);
    }
  };

  useEffect(() => {
    const fetchIssueTracking = async () => {
      try {
        setLoading(true);
        setError("");

        const [issueResponse, historyResponse] =
          await Promise.all([
            api.get(`/api/issues/${id}`),
            api.get(`/api/issues/${id}/history`),
          ]);

        setIssue(issueResponse.data);
        setHistory(historyResponse.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load issue tracking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchIssueTracking();
  }, [id]);

  useEffect(() => {
    fetchComments();
  }, [id]);

  // Load the student's rating after the issue is resolved
  useEffect(() => {
    if (isResolved) {
      fetchRating();
    } else {
      setRating(0);
      setFeedback("");
      setExistingRating(false);
      setRatingMessage("");
      setRatingError("");
    }
  }, [id, isResolved]);

  const submitComment = async (e) => {
    e.preventDefault();

    const message = comment.trim();

    if (!message) {
      setCommentError("Please enter a comment.");
      return;
    }

    try {
      setSubmitting(true);
      setCommentError("");
      setCommentMessage("");

      await api.post(`/api/issues/${id}/comments`, {
        message,
      });

      setComment("");
      setCommentMessage("Comment added successfully.");
      await fetchComments();
    } catch (err) {
      console.error(err);
      setCommentError(
        err.response?.data?.message ||
        "Unable to add comment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitRating = async (e) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      setRatingError("Please select a rating from 1 to 5 stars.");
      return;
    }

    try {
      setRatingSubmitting(true);
      setRatingError("");
      setRatingMessage("");

      await api.post(`/api/issues/${id}/rating`, {
        rating,
        feedback: feedback.trim(),
      });

      setExistingRating(true);
      setRatingMessage(
        "Your rating and feedback have been saved successfully!"
      );
    } catch (err) {
      console.error(err);
      setRatingError(
        err.response?.data?.message ||
        "Unable to save your rating. Please try again."
      );
    } finally {
      setRatingSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "RESOLVED":
        return "#16a34a";
      case "IN_PROGRESS":
        return "#2563eb";
      case "PENDING":
        return "#d97706";
      default:
        return "#6b7280";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";
    return new Date(date).toLocaleString();
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
          onClick={() => navigate("/my-issues")}
        >
          ← My Issues
        </button>
      </nav>

      <main style={styles.container}>
        {loading && (
          <div style={styles.messageBox}>
            Loading issue tracking...
          </div>
        )}

        {!loading && error && (
          <div style={styles.errorBox}>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button
              style={styles.primaryButton}
              onClick={() => navigate("/my-issues")}
            >
              Back to My Issues
            </button>
          </div>
        )}

        {!loading && !error && issue && (
          <>
            <div style={styles.pageHeader}>
              <div>
                <p style={styles.eyebrow}>ISSUE TRACKING</p>
                <h1 style={styles.heading}>Track Your Issue</h1>
                <p style={styles.subtitle}>
                  Follow every update from reporting to resolution.
                </p>
              </div>

              <span
                style={{
                  ...styles.statusBadge,
                  background: getStatusColor(issue.status),
                }}
              >
                {formatStatus(issue.status)}
              </span>
            </div>

            {/* Issue Details */}
            <section style={styles.issueCard}>
              <div style={styles.issueTop}>
                <div>
                  <p style={styles.issueLabel}>ISSUE ID</p>
                  <h2 style={styles.issueId}>#{issue.id}</h2>
                </div>

                <span style={styles.priorityBadge}>
                  {issue.priority || "MEDIUM"} PRIORITY
                </span>
              </div>

              <h2 style={styles.issueTitle}>{issue.title}</h2>

              <p style={styles.description}>
                {issue.description}
              </p>

              {issue.imageUrl && (
                <img
                  src={issue.imageUrl}
                  alt="Issue attachment"
                  style={styles.issueImage}
                />
              )}

              <div style={styles.detailsGrid}>
                <div>
                  <p style={styles.detailLabel}>Category</p>
                  <strong>{issue.category || "—"}</strong>
                </div>

                <div>
                  <p style={styles.detailLabel}>Location</p>
                  <strong>{issue.location || "—"}</strong>
                </div>

                <div>
                  <p style={styles.detailLabel}>Assigned Staff</p>
                  <strong>
                    {issue.assignedStaffName || "Not assigned"}
                  </strong>
                </div>

                <div>
                  <p style={styles.detailLabel}>Reported On</p>
                  <strong>{formatDate(issue.createdAt)}</strong>
                </div>
              </div>
            </section>

            {/* Progress Timeline */}
            <section style={styles.timelineCard}>
              <div style={styles.timelineHeader}>
                <div>
                  <h2 style={styles.timelineTitle}>
                    Progress Timeline
                  </h2>
                  <p style={styles.timelineSubtitle}>
                    {history.length} update
                    {history.length !== 1 ? "s" : ""} recorded
                  </p>
                </div>
                <span style={styles.timelineIcon}>↗</span>
              </div>

              {history.length === 0 ? (
                <div style={styles.empty}>
                  <h3>No timeline updates yet</h3>
                  <p>
                    Updates will appear here as your issue progresses.
                  </p>
                </div>
              ) : (
                <div style={styles.timeline}>
                  {history.map((item, index) => (
                    <div
                      key={item.id}
                      style={styles.timelineItem}
                    >
                      <div style={styles.timelineRail}>
                        <div
                          style={{
                            ...styles.timelineDot,
                            background: getStatusColor(item.status),
                          }}
                        >
                          ✓
                        </div>

                        {index !== history.length - 1 && (
                          <div style={styles.timelineLine} />
                        )}
                      </div>

                      <div style={styles.eventCard}>
                        <div style={styles.eventTop}>
                          <span
                            style={{
                              ...styles.eventStatus,
                              color: getStatusColor(item.status),
                            }}
                          >
                            {formatStatus(item.status)}
                          </span>

                          <span style={styles.eventDate}>
                            {formatDate(item.createdAt)}
                          </span>
                        </div>

                        <p style={styles.eventMessage}>
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Comments */}
            <section style={styles.commentsCard}>
              <h2 style={styles.timelineTitle}>
                Comments & Updates
              </h2>
              <p style={styles.timelineSubtitle}>
                Communicate with staff about this issue.
              </p>

              <form onSubmit={submitComment}>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  maxLength={2000}
                  rows={4}
                  style={styles.commentInput}
                />

                <div style={styles.commentFormBottom}>
                  <span style={styles.characterCount}>
                    {comment.length}/2000
                  </span>

                  <button
                    type="submit"
                    style={styles.primaryButton}
                    disabled={submitting}
                  >
                    {submitting ? "Sending..." : "Add Comment"}
                  </button>
                </div>
              </form>

              {commentError && (
                <p style={styles.errorText}>{commentError}</p>
              )}

              {commentMessage && (
                <p style={styles.successText}>
                  {commentMessage}
                </p>
              )}

              <div style={styles.commentList}>
                {commentsLoading ? (
                  <p>Loading comments...</p>
                ) : comments.length === 0 ? (
                  <div style={styles.empty}>
                    <h3>No comments yet</h3>
                    <p>Be the first to add an update.</p>
                  </div>
                ) : (
                  comments.map((item) => (
                    <article
                      key={item.id}
                      style={styles.commentItem}
                    >
                      <div style={styles.commentHeader}>
                        <strong>
                          {item.userName || "CampusConnect user"}
                        </strong>
                        <span style={styles.roleBadge}>
                          {item.userRole || "USER"}
                        </span>
                      </div>

                      <p style={styles.commentText}>
                        {item.message}
                      </p>

                      <span style={styles.commentDate}>
                        {formatDate(item.createdAt)}
                      </span>
                    </article>
                  ))
                )}
              </div>
            </section>

            {/* ⭐ Resolution Rating */}
            {isResolved && (
              <section style={styles.ratingCard}>
                <h2 style={styles.timelineTitle}>
                  ⭐ Rate Your Resolution
                </h2>

                <p style={styles.timelineSubtitle}>
                  Your feedback helps us improve campus services.
                </p>

                {ratingLoading ? (
                  <p>Loading your rating...</p>
                ) : (
                  <form onSubmit={submitRating}>
                    <p style={styles.ratingQuestion}>
                      How satisfied are you with the resolution?
                    </p>

                    <div style={styles.stars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setRating(star);
                            setRatingError("");
                            setRatingMessage("");
                          }}
                          aria-label={`Rate ${star} out of 5 stars`}
                          aria-pressed={rating === star}
                          style={{
                            ...styles.starButton,
                            color:
                              star <= rating
                                ? "#f59e0b"
                                : "#d1d5db",
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <p style={styles.ratingHint}>
                      {rating === 0
                        ? "Select a star rating"
                        : `${rating} out of 5 stars`}
                    </p>

                    <label style={styles.feedbackLabel}>
                      Feedback (optional)
                    </label>

                    <textarea
                      value={feedback}
                      onChange={(e) =>
                        setFeedback(e.target.value)
                      }
                      placeholder="Tell us about your experience..."
                      maxLength={2000}
                      rows={4}
                      style={styles.commentInput}
                    />

                    <div style={styles.commentFormBottom}>
                      <span style={styles.characterCount}>
                        {feedback.length}/2000
                      </span>

                      <button
                        type="submit"
                        style={styles.primaryButton}
                        disabled={
                          ratingSubmitting || ratingLoading
                        }
                      >
                        {ratingSubmitting
                          ? "Saving..."
                          : existingRating
                          ? "Update Rating"
                          : "Submit Rating"}
                      </button>
                    </div>
                  </form>
                )}

                {ratingError && (
                  <p style={styles.errorText}>{ratingError}</p>
                )}

                {ratingMessage && (
                  <p style={styles.successText}>
                    {ratingMessage}
                  </p>
                )}
              </section>
            )}

            <div style={styles.bottomActions}>
              <button
                style={styles.primaryButton}
                onClick={() => navigate("/my-issues")}
              >
                ← Back to My Issues
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => navigate("/notifications")}
              >
                View Notifications
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    fontFamily: "Arial, sans-serif",
    color: "#111827",
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
    maxWidth: "950px",
    margin: "35px auto",
    padding: "0 20px 40px",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "25px",
  },
  eyebrow: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: "12px",
    letterSpacing: "1.5px",
    marginBottom: "8px",
  },
  heading: {
    margin: "0 0 8px",
    fontSize: "30px",
  },
  subtitle: {
    color: "#6b7280",
    margin: 0,
    lineHeight: 1.5,
  },
  statusBadge: {
    color: "#ffffff",
    padding: "9px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  issueCard: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "25px",
    marginBottom: "25px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },
  issueTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  issueLabel: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 5px",
  },
  issueId: {
    margin: 0,
    color: "#2563eb",
  },
  priorityBadge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  issueTitle: {
    margin: "22px 0 10px",
    fontSize: "23px",
  },
  description: {
    color: "#4b5563",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
  },
  issueImage: {
    display: "block",
    width: "100%",
    maxWidth: "400px",
    maxHeight: "300px",
    objectFit: "contain",
    borderRadius: "10px",
    marginTop: "12px",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "22px",
    marginTop: "25px",
    paddingTop: "22px",
    borderTop: "1px solid #e5e7eb",
  },
  detailLabel: {
    color: "#6b7280",
    fontSize: "13px",
    margin: "0 0 7px",
  },
  timelineCard: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "25px",
    marginBottom: "25px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },
  timelineHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
  },
  timelineTitle: {
    margin: "0 0 7px",
    fontSize: "22px",
  },
  timelineSubtitle: {
    color: "#6b7280",
    margin: "0 0 18px",
    fontSize: "14px",
  },
  timelineIcon: {
    fontSize: "25px",
    color: "#2563eb",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
  },
  timelineItem: {
    display: "flex",
    gap: "16px",
    minHeight: "105px",
  },
  timelineRail: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "28px",
    flexShrink: 0,
  },
  timelineDot: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold",
    flexShrink: 0,
  },
  timelineLine: {
    width: "2px",
    flex: 1,
    minHeight: "65px",
    background: "#dbeafe",
  },
  eventCard: {
    flex: 1,
    padding: "0 0 28px",
  },
  eventTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  eventStatus: {
    fontWeight: "bold",
    fontSize: "15px",
  },
  eventDate: {
    color: "#6b7280",
    fontSize: "12px",
  },
  eventMessage: {
    margin: 0,
    color: "#374151",
    lineHeight: 1.6,
    background: "#f9fafb",
    borderRadius: "8px",
    padding: "13px 15px",
  },
  commentsCard: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "25px",
    marginTop: "25px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },
  ratingCard: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "25px",
    marginTop: "25px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
    border: "1px solid #fde68a",
  },
  ratingQuestion: {
    fontWeight: "bold",
    marginBottom: "12px",
  },
  stars: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  starButton: {
    background: "transparent",
    border: "none",
    fontSize: "40px",
    cursor: "pointer",
    padding: "0 3px",
    lineHeight: 1.2,
  },
  ratingHint: {
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "6px",
    marginBottom: "20px",
  },
  feedbackLabel: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "8px",
    marginTop: "18px",
  },
  commentInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    resize: "vertical",
    font: "inherit",
    marginTop: "10px",
  },
  commentFormBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginTop: "10px",
    flexWrap: "wrap",
  },
  characterCount: {
    color: "#6b7280",
    fontSize: "12px",
  },
  commentList: {
    marginTop: "25px",
  },
  commentItem: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
    marginTop: "12px",
  },
  commentHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  roleBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  commentText: {
    color: "#374151",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
  commentDate: {
    color: "#6b7280",
    fontSize: "12px",
  },
  errorText: {
    color: "#b91c1c",
    marginTop: "12px",
  },
  successText: {
    color: "#15803d",
    marginTop: "12px",
  },
  empty: {
    textAlign: "center",
    padding: "30px 15px",
    color: "#6b7280",
  },
  messageBox: {
    background: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
    textAlign: "center",
  },
  errorBox: {
    background: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
    textAlign: "center",
  },
  primaryButton: {
    padding: "11px 17px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "11px 17px",
    background: "#ffffff",
    color: "#2563eb",
    border: "1px solid #2563eb",
    borderRadius: "8px",
    cursor: "pointer",
  },
  bottomActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "25px",
  },
};

export default TrackIssue;