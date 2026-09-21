
import { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom"; 
import api from "../services/api"; 
 
function MyIssues() { 
  const navigate = useNavigate(); 
 
  const [issues, setIssues] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(""); 
 
  useEffect(() => { 
    const userData = localStorage.getItem("user"); 
 
    if (!userData) { 
      navigate("/login"); 
      return; 
    } 
 
    const user = JSON.parse(userData); 
 
    const loadIssues = async () => { 
      try { 
        const response = await api.get( 
          `/api/issues/user/${user.id}` 
        ); 
 
        setIssues(response.data); 
      } catch (err) { 
        console.error(err); 
        setError("Failed to load your issues."); 
      } finally { 
        setLoading(false); 
      } 
    }; 
 
    loadIssues(); 
  }, [navigate]); 
 
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
 
  const formatDate = (date) => { 
    if (!date) { 
      return "Unknown"; 
    } 
 
    return new Date(date).toLocaleString("en-IN", { 
      dateStyle: "medium", 
      timeStyle: "short", 
    }); 
  }; 
 
  const handleLogout = () => { 
    localStorage.removeItem("user"); 
    navigate("/login"); 
  }; 
 
  const userData = localStorage.getItem("user"); 
  const user = userData ? JSON.parse(userData) : null; 
 
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
 
        <div className="issues-header"> 
 
          <div> 
 
            <button 
              className="back-btn" 
              onClick={() => navigate("/dashboard")} 
            > 
              ← Dashboard 
            </button> 
 
            <h1> 
              My Issues 
            </h1> 
 
            <p> 
              View and track all the issues you have reported. 
            </p> 
 
          </div> 
 
          <button 
            className="primary-btn report-new-btn" 
            onClick={() => navigate("/report-issue")} 
          > 
            🚨 Report New Issue 
          </button> 
 
        </div> 
 
        {loading && ( 
 
          <div className="empty-state"> 
 
            <div className="loading-spinner"> 
              ⏳ 
            </div> 
 
            <p> 
              Loading your issues... 
            </p> 
 
          </div> 
 
        )} 
 
        {error && ( 
 
          <div className="error-message"> 
            {error} 
          </div> 
 
        )} 
 
        {!loading && 
          !error && 
          issues.length === 0 && ( 
 
            <div className="empty-state"> 
 
              <div className="empty-icon"> 
                📋 
              </div> 
 
              <h2> 
                No Issues Reported 
              </h2> 
 
              <p> 
                You haven't reported any campus issues yet. 
              </p> 
 
              <button 
                className="primary-btn empty-action-btn" 
                onClick={() => navigate("/report-issue")} 
              > 
                Report Your First Issue 
              </button> 
 
            </div> 
 
          )} 
 
        {!loading && 
          issues.length > 0 && ( 
 
            <div className="issues-list"> 
 
              {issues.map((issue) => ( 
 
                <div 
                  className="issue-card" 
                  key={issue.id} 
                > 
 
                  <div className="issue-card-top"> 
 
                    <div> 
 
                      <span className="issue-id"> 
                        ISSUE #{issue.id} 
                      </span> 
 
                      <h2> 
                        {issue.title} 
                      </h2> 
 
                    </div> 
 
                    <div className="issue-card-actions"> 
 
                      <span 
                        className={`status-badge ${getStatusClass( 
                          issue.status 
                        )}`} 
                      > 
                        {issue.status.replace("_", " ")} 
                      </span> 
 
                      {issue.status === "PENDING" && ( 
 
                        <button 
                          className="edit-btn" 
                          onClick={() => 
                            navigate( 
                              `/edit-issue/${issue.id}` 
                            ) 
                          } 
                        > 
                          ✏️ Edit 
                        </button> 
 
                      )} 

                      <button
                        className="edit-btn"
                        onClick={() =>
                          navigate(`/track-issue/${issue.id}`)
                        }
                      >
                        📍 Track Issue
                      </button>
 
                    </div> 
 
                  </div> 
 
                  <p className="issue-description"> 
                    {issue.description} 
                  </p> {issue.imageUrl && (
  <div className="issue-image">
    <img
      src={issue.imageUrl}
      alt="Issue attachment"
      style={{
        width: "100%",
        maxWidth: "400px",
        maxHeight: "300px",
        objectFit: "contain",
        borderRadius: "10px",
        marginTop: "12px",
      }}
    />
  </div>
)}
 
                  <div className="issue-details"> 
 
                    <div className="issue-detail"> 
 
                      <span>📂</span> 
 
                      <div> 
 
                        <small> 
                          Category 
                        </small> 
 
                        <strong> 
                          {issue.category} 
                        </strong> 
 
                      </div> 
 
                    </div> 
 
                    <div className="issue-detail"> 
 
                      <span>📍</span> 
 
                      <div> 
 
                        <small> 
                          Location 
                        </small> 
 
                        <strong> 
                          {issue.location} 
                        </strong> 
 
                      </div> 
 
                    </div> 
 
                    <div className="issue-detail"> 
 
                      <span>⚡</span> 
                       
                      <div> 
 
                        <small> 
                          Priority 
                        </small> 
 
                        <strong 
                          className={getPriorityClass( 
                            issue.priority 
                          )} 
                        > 
                          {issue.priority} 
                        </strong> 
 
                      </div> 
 
                    </div> 
 
                    <div className="issue-detail"> 
 
                      <span>📅</span> 
 
                      <div> 
 
                        <small> 
                          Reported 
                        </small> 
 
                        <strong> 
                          {formatDate(issue.createdAt)} 
                        </strong> 
 
                      </div> 
 
                    </div> 
 
                  </div> 
 
                </div> 
 
              ))} 
 
            </div> 
 
          )} 
 
      </main> 
 
    </div> 
  ); 
} 
 
export default MyIssues;