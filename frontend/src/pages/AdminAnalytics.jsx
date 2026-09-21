
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import api from "../services/api";

function AdminAnalytics() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await api.get("/api/admin/analytics");
        setAnalytics(response.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const statusCards = [
    {
      label: "Total Issues",
      value: analytics?.totalIssues ?? 0,
      color: "#2563eb",
      icon: "📋",
    },
    {
      label: "Pending",
      value: analytics?.pending ?? 0,
      color: "#d97706",
      icon: "⏳",
    },
    {
      label: "In Progress",
      value: analytics?.inProgress ?? 0,
      color: "#7c3aed",
      icon: "🔧",
    },
    {
      label: "Resolved",
      value: analytics?.resolved ?? 0,
      color: "#16a34a",
      icon: "✅",
    },
    {
      label: "Rejected",
      value: analytics?.rejected ?? 0,
      color: "#dc2626",
      icon: "❌",
    },
  ];

  const statusColors = [
    "#d97706",
    "#7c3aed",
    "#16a34a",
    "#dc2626",
  ];

  const categoryColors = [
    "#2563eb",
    "#7c3aed",
    "#0891b2",
    "#16a34a",
    "#ea580c",
  ];

  const getPercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  const statusData = analytics
    ? [
      { name: "Pending", value: analytics.pending ?? 0 },
      { name: "In Progress", value: analytics.inProgress ?? 0 },
      { name: "Resolved", value: analytics.resolved ?? 0 },
      { name: "Rejected", value: analytics.rejected ?? 0 },
    ].filter((item) => item.value > 0)
    : [];

  const categoryData = Object.entries(
    analytics?.categoryStats || {}
  ).map(([name, count]) => ({
    name,
    count,
  }));

  const priorityData = Object.entries(
    analytics?.priorityStats || {}
  ).map(([name, count]) => ({
    name,
    count,
  }));

  const staffData = Object.entries(
    analytics?.staffWorkload || {}
  ).map(([name, count]) => ({
    name,
    count,
  }));

  const renderBreakdown = (data, colors) => {
    const entries = Object.entries(data || {});
    const total = entries.reduce(
      (sum, [, value]) => sum + value,
      0
    );

    if (entries.length === 0) {
      return <p style={styles.muted}>No data available.</p>;
    }

    return entries.map(([label, value], index) => {
      const percentage = getPercentage(value, total);

      return (
        <div key={label} style={styles.breakdownItem}>
          <div style={styles.breakdownTop}>
            <span style={styles.breakdownLabel}>{label}</span>
            <strong>{value}</strong>
          </div>

          <div style={styles.progressBackground}>
            <div
              style={{
                ...styles.progressFill,
                width: `${percentage}%`,
                background: colors[index % colors.length],
              }}
            />
          </div>

          <small style={styles.percentage}>
            {percentage}% of issues
          </small>
        </div>
      );
    });
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
          onClick={() => navigate("/admin-dashboard")}
        >
          ← Admin Dashboard
        </button>
      </nav>

      <main style={styles.container}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>ADMINISTRATION</p>
            <h1 style={styles.heading}>Analytics Dashboard</h1>
            <p style={styles.subtitle}>
              Monitor campus issues, priorities, and staff workload.
            </p>
          </div>

          <button
            style={styles.refreshButton}
            onClick={() => window.location.reload()}
          >
            ↻ Refresh
          </button>
        </div>

        {loading && (
          <div style={styles.messageBox}>
            Loading analytics...
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {!loading && !error && analytics && (
          <>
            <section style={styles.statsGrid}>
              {statusCards.map((card) => (
                <div key={card.label} style={styles.statCard}>
                  <div style={styles.statTop}>
                    <span style={styles.statLabel}>
                      {card.label}
                    </span>
                    <span style={styles.statIcon}>
                      {card.icon}
                    </span>
                  </div>

                  <h2
                    style={{
                      ...styles.statValue,
                      color: card.color,
                    }}
                  >
                    {card.value}
                  </h2>
                </div>
              ))}
            </section>

            <section style={styles.overviewCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>
                    Resolution Overview
                  </h2>
                  <p style={styles.muted}>
                    Share of issues currently resolved.
                  </p>
                </div>

                <strong style={styles.resolutionNumber}>
                  {getPercentage(
                    analytics.resolved,
                    analytics.totalIssues
                  )}%
                </strong>
              </div>

              <div style={styles.progressBackgroundLarge}>
                <div
                  style={{
                    ...styles.progressFillLarge,
                    width: `${getPercentage(
                      analytics.resolved,
                      analytics.totalIssues
                    )}%`,
                  }}
                />
              </div>

              <p style={styles.muted}>
                {analytics.resolved} of {analytics.totalIssues} issues
                resolved
              </p>
            </section>

            {/* NEW: Status Pie Chart */}
            <section style={styles.chartsGrid}>
              <div style={styles.chartCard}>
                <h2 style={styles.sectionTitle}>
                  Issue Status Distribution
                </h2>

                <p style={styles.muted}>
                  Visual breakdown of issues by current status.
                </p>

                {statusData.length === 0 ? (
                  <div style={styles.empty}>
                    No issue status data available.
                  </div>
                ) : (
                  <div style={styles.pieChartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius="75%"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {statusData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={statusColors[index % statusColors.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* NEW: Category Bar Chart */}
              <div style={styles.chartCard}>
                <h2 style={styles.sectionTitle}>
                  Issues by Category
                </h2>

                <p style={styles.muted}>
                  Compare the number of reported issues in each category.
                </p>

                {categoryData.length === 0 ? (
                  <div style={styles.empty}>
                    No category data available.
                  </div>
                ) : (
                  <div style={styles.barChartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryData}
                        margin={{
                          top: 15,
                          right: 10,
                          left: 0,
                          bottom: 25,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-20}
                          textAnchor="end"
                          interval={0}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          name="Issues"
                          fill="#2563eb"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            {/* Existing Category and Priority Breakdowns */}
            <section style={styles.chartsGrid}>
              <div style={styles.chartCard}>
                <h2 style={styles.sectionTitle}>
                  Category Breakdown
                </h2>

                <p style={styles.muted}>
                  Distribution of reported issue types.
                </p>

                <div style={styles.breakdownList}>
                  {renderBreakdown(
                    analytics.categoryStats,
                    categoryColors
                  )}
                </div>
              </div>

              <div style={styles.chartCard}>
                <h2 style={styles.sectionTitle}>
                  Issues by Priority
                </h2>

                <p style={styles.muted}>
                  Distribution by reported priority.
                </p>

                {priorityData.length === 0 ? (
                  <p style={styles.muted}>No priority data available.</p>
                ) : (
                  <div style={styles.breakdownList}>
                    {renderBreakdown(
                      analytics.priorityStats,
                      ["#dc2626", "#ea580c", "#d97706", "#16a34a"]
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* NEW: Staff Workload Bar Chart */}
            <section style={styles.staffCard}>
              <h2 style={styles.sectionTitle}>
                Staff Workload
              </h2>

              <p style={styles.muted}>
                Total issues assigned to each staff member,
                including resolved issues.
              </p>

              {staffData.length === 0 ? (
                <div style={styles.empty}>
                  No issues have been assigned to staff yet.
                </div>
              ) : (
                <div style={styles.staffChartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={staffData}
                      margin={{
                        top: 15,
                        right: 20,
                        left: 0,
                        bottom: 25,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Assigned Issues"
                        fill="#7c3aed"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {staffData.length > 0 && (
                <div style={styles.staffGrid}>
                  {staffData.map((staff) => (
                    <div key={staff.name} style={styles.staffItem}>
                      <div style={styles.staffIcon}>👤</div>

                      <div style={styles.staffInfo}>
                        <strong>{staff.name}</strong>
                        <span style={styles.muted}>
                          {staff.count} assigned issue
                          {staff.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
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
    maxWidth: "1200px",
    margin: "35px auto",
    padding: "0 20px 40px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px",
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
  refreshButton: {
    padding: "11px 16px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "22px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },
  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: "#6b7280",
    fontSize: "14px",
  },
  statIcon: {
    fontSize: "22px",
  },
  statValue: {
    fontSize: "32px",
    margin: "18px 0 0",
  },
  overviewCard: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
  },
  muted: {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: 1.5,
    margin: "0 0 12px",
  },
  resolutionNumber: {
    fontSize: "28px",
    color: "#16a34a",
  },
  progressBackground: {
    height: "9px",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
    marginTop: "10px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "20px",
    transition: "width 0.3s ease",
  },
  progressBackgroundLarge: {
    height: "14px",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
    margin: "20px 0 12px",
  },
  progressFillLarge: {
    height: "100%",
    background: "#16a34a",
    borderRadius: "20px",
    transition: "width 0.3s ease",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },
  chartCard: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
    minWidth: 0,
  },
  pieChartContainer: {
    width: "100%",
    height: "320px",
    marginTop: "15px",
  },
  barChartContainer: {
    width: "100%",
    height: "320px",
    marginTop: "15px",
  },
  breakdownList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginTop: "25px",
  },
  breakdownItem: {
    display: "flex",
    flexDirection: "column",
  },
  breakdownTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
  },
  breakdownLabel: {
    fontSize: "14px",
    color: "#374151",
  },
  percentage: {
    color: "#9ca3af",
    fontSize: "12px",
    marginTop: "6px",
  },
  staffCard: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
    marginBottom: "24px",
  },
  staffChartContainer: {
    width: "100%",
    height: "320px",
    marginTop: "20px",
  },
  staffGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "15px",
    marginTop: "22px",
  },
  staffItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  },
  staffIcon: {
    fontSize: "25px",
    background: "#eff6ff",
    padding: "10px",
    borderRadius: "10px",
  },
  staffInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  empty: {
    padding: "25px",
    textAlign: "center",
    color: "#6b7280",
    background: "#f9fafb",
    borderRadius: "8px",
    marginTop: "18px",
  },
  messageBox: {
    background: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
    textAlign: "center",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "18px",
    borderRadius: "10px",
  },
};

export default AdminAnalytics;