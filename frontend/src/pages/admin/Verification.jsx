import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { API_URL } from "../../api";

function Verification() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/verification`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch pending users");
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      alert(error.message || "Unable to load pending users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const updateStatus = async (userId, status) => {
    try {
      setUpdatingId(userId);

      const response = await fetch(
        `${API_URL}/admin/verification/${userId}?status=${status}`,
        { method: "PUT" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update user status");
      }

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== userId)
      );

      alert(
        status === "VERIFIED"
          ? "User approved successfully."
          : "User rejected successfully."
      );
    } catch (error) {
      console.error("Error updating user:", error);
      alert(error.message || "Unable to update user status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole =
      roleFilter === "all" ||
      (user.role && user.role.toLowerCase() === roleFilter.toLowerCase());

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.phone && user.phone.toLowerCase().includes(term)) ||
      (user.city && user.city.toLowerCase().includes(term)) ||
      String(user.id || "").includes(term);

    return matchesRole && matchesSearch;
  });

  return (
    <div role="ADMIN">
      <div className="manage-loads-page">
        <div className="page-header">
          <div>
            <h1>Verification</h1>
            <p>Review and verify newly registered drivers and loaders.</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search pending users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-filter"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Roles</option>
              <option value="driver">Drivers</option>
              <option value="loader">Loaders</option>
            </select>

            <span className="load-count">{filteredUsers.length} Pending</span>
          </div>
        </div>

        <div className="my-loads-section">
          <div className="loads-grid">
            {loading ? (
              <p>Loading pending users...</p>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                <h3>No Pending Verification Requests</h3>
                <p>All registered users have been reviewed or match no search filter.</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id}>
                  <div className="load-header">
                    <span className="load-id">
                      USER # {String(user.id || "N/A").padStart(3, "0")}
                    </span>
                    <div className="route">
                      <span>{user.name || "Anonymous User"}</span>
                    </div>
                    <span className={`status ${user.role ? user.role.toLowerCase() : ""}`}>
                      {user.role || "USER"}
                    </span>
                  </div>

                  <div className="driver-info">
                    <div className="info-column">
                      <div className="driver-title">User Details</div>
                      <div className="driver-row">
                        <span>Email:</span>
                        <strong>{user.email || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>Phone No:</span>
                        <strong>{user.phone || "Not provided"}</strong>
                      </div>
                    </div>

                    <div className="info-column">
                      <div className="driver-title">Account Details</div>
                      <div className="driver-row">
                        <span>City:</span>
                        <strong>{user.city || "Not provided"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>Registered:</span>
                        <strong>{user.createdAt || "N/A"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="action-footer">
                    <button
                      className="action-btn approve-btn"
                      disabled={updatingId === user.id}
                      onClick={() => updateStatus(user.id, "VERIFIED")}
                    >
                      {updatingId === user.id ? "Updating..." : "Approve"}
                    </button>

                    <button
                      className="action-btn reject-btn"
                      disabled={updatingId === user.id}
                      onClick={() => updateStatus(user.id, "REJECTED")}
                    >
                      Reject
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .manage-loads-page { width: 100%; }
        .page-header { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding-bottom: 8px; border-bottom: 1px solid black; }
        .page-header h1 { margin: 0 0 4px; font-size: 24px; font-weight: 800; }
        .page-header p { margin: 0; color: #666; }
        .search-filter { padding: 6px 12px; border-radius: 6px; border: 1px solid #ccc; font-size: 14px; outline: none; min-width: 180px; }
        .status-filter { padding: 6px 12px; border-radius: 6px; border: 1px solid #ccc; background: white; font-size: 14px; font-weight: 600; cursor: pointer; outline: none; }
        .load-id { display: block; color: #6b7280; font-size: 12px; font-weight: 600; background: #d2d8e5; padding: 4px 8px; border-radius: 5px; }
        .my-loads-section { margin-top: 10px; }
        .load-count { padding: 6px 8px; background: #eee; border: 1px solid #a9a8a8; border-radius: 6px; font-size: 14px; font-weight: 600; }
        .loads-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 10px; }
        .load-header { display: flex; justify-content: space-between; align-items: center; gap: 15px; padding-bottom: 8px; margin-bottom: 2px; border-bottom: 1px solid black; }
        .route { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 800; }
        .status { padding: 4px 8px; border-radius: 5px; font-size: 12px; font-weight: 600; white-space: nowrap; text-transform: uppercase; }
        .status.driver { background: #e0e7ff; color: #3730a3; }
        .status.loader { background: #fef3c7; color: #92400e; }
        .driver-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 8px; background: #f5f6f8; border-radius: 7px; margin-bottom: 8px; }
        .info-column:first-child { padding-right: 12px; border-right: 1px solid #e0e0e0; }
        .driver-title { font-size: 14px; font-weight: 700; margin-bottom: 6px; color: #222; text-decoration: underline; text-align: center; }
        .driver-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px; }
        .driver-row:last-child { margin-bottom: 0; }
        .driver-row span { color: #666; font-size: 12px; }
        .driver-row strong { font-size: 12px; text-align: right; color: #111; word-break: break-word; }
        .action-footer { display: flex; gap: 10px; justify-content: center; align-items: center; }
        .action-btn { flex: 1; padding: 8px 0; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .approve-btn { background: #16a34a; color: white; }
        .approve-btn:hover:not(:disabled) { background: #15803d; }
        .reject-btn { background: #dc2626; color: white; }
        .reject-btn:hover:not(:disabled) { background: #b91c1c; }
        .empty-state { grid-column: 1 / -1; background: white; border: 1px solid #ddd; border-radius: 8px; padding: 40px; text-align: center; }
        .empty-state h3 { margin-bottom: 8px; }
        .empty-state p { margin: 0; color: #666; }
      `}</style>
    </div>
  );
}

export default Verification;