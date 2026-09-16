import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { API_URL } from "../../api";

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [filter, setFilter] = useState("pending"); // "pending", "resolved", "all"
  const [searchTerm, setSearchTerm] = useState("");

  const fetchContacts = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/contacts?status=${filter}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch contact requests");
      }

      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      alert("Unable to load contact requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [filter]);

  const resolveContact = async (contactId) => {
    setResolvingId(contactId);

    try {
      const response = await fetch(`${API_URL}/admin/contacts/${contactId}/resolve`, {
        method: "PUT",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to resolve contact");
      }

      fetchContacts();
      alert("Contact marked as resolved.");
    } catch (error) {
      console.error("Error resolving contact:", error);
      alert(error.message || "Failed to resolve contact");
    } finally {
      setResolvingId(null);
    }
  };

  const getStatusClass = (status) => {
    if (!status) return "pending";
    const lower = status.toLowerCase();
    if (lower === "closed" || lower === "resolved") return "verified";
    return "pending";
  };

  const filteredContacts = contacts.filter((contact) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;

    return (
      (contact.name && contact.name.toLowerCase().includes(term)) ||
      (contact.email && contact.email.toLowerCase().includes(term)) ||
      (contact.phone && contact.phone.toLowerCase().includes(term)) ||
      (contact.message && contact.message.toLowerCase().includes(term)) ||
      String(contact.id || "").includes(term)
    );
  });

  return (
    <div role="ADMIN">
      <div className="manage-loads-page">
        <div className="page-header">
          <div>
            <h1>Contacts</h1>
            <p>Manage user questions and support requests.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-filter"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="status-filter"
            >
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="all">All Statuses</option>
            </select>

            <span className="load-count">{filteredContacts.length} Requests</span>
          </div>
        </div>

        <div className="my-loads-section">
          <div className="loads-grid">
            {loading ? (
              <p>Loading contact requests...</p>
            ) : filteredContacts.length === 0 ? (
              <div className="empty-state">
                <h3>No Contact Requests</h3>
                <p>There are no support requests matching the criteria.</p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isResolved =
                  contact.status === "CLOSED" ||
                  contact.status === "closed" ||
                  contact.status === "resolved" ||
                  contact.status === "RESOLVED";

                return (
                  <Card key={contact.id}>
                    <div className="load-header">
                      <span className="load-id">
                        REQ # {String(contact.id || "N/A").padStart(3, "0")}
                      </span>
                      <div className="route">
                        <span>{contact.name || "Anonymous User"}</span>
                      </div>
                      <span className={`status ${getStatusClass(contact.status)}`}>
                        {contact.status || "PENDING"}
                      </span>
                    </div>

                    <div className="driver-info">
                      <div className="info-column">
                        <div className="driver-title">Contact Info</div>
                        <div className="driver-row">
                          <span>Email:</span>
                          <strong title={contact.email || "N/A"}>{contact.email || "N/A"}</strong>
                        </div>
                        <div className="driver-row">
                          <span>Phone No:</span>
                          <strong>{contact.phone || "Not provided"}</strong>
                        </div>
                      </div>

                      <div className="info-column">
                        <div className="driver-title">Request Meta</div>
                         <div className="driver-row">
                          <span>Subject:</span>
                          <strong>{contact.subject || "Support Inquiry"}</strong>
                        </div>
                        <div className="driver-row">
                          <span>Date:</span>
                          <strong>{contact.createdAt || "N/A"}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="message-box">
                      <span className="message-label">Message:</span>
                      <p className="message-text">{contact.message || "No message content."}</p>
                    </div>

                    <div className="action-footer">
                      {isResolved ? (
                        <span className="resolved-badge">✓ Resolved</span>
                      ) : (
                        <button
                          className="resolve-btn"
                          onClick={() => resolveContact(contact.id)}
                          disabled={resolvingId === contact.id}
                        >
                          {resolvingId === contact.id ? "Resolving..." : "Mark as Resolved"}
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })
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
        .pending { background: #fef3c7; color: #92400e; }
        .verified { background: #dbeafe; color: #1d4ed8; }
        .driver-info { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; padding: 8px; background: #f5f6f8; border-radius: 7px; margin-bottom: 8px; }
        .info-column { min-width: 0; }
        .info-column:first-child { padding-right: 12px; border-right: 1px solid #e0e0e0; }
        .driver-title { font-size: 14px; font-weight: 700; margin-bottom: 6px; color: #222; text-decoration: underline; text-align: center; }
        .driver-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px; min-width: 0; }
        .driver-row:last-child { margin-bottom: 0; }
        .driver-row span { color: #666; font-size: 12px; flex-shrink: 0; }
        .driver-row strong { font-size: 12px; text-align: right; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-grow: 1; min-width: 0; }
        .message-box { padding: 8px 10px; background: #ffffff; border: 1px solid #e2e2e2; border-radius: 6px; margin-bottom: 8px; }
        .message-label { display: block; font-size: 10px; font-weight: 700; color: #666;  margin-bottom: 2px; }
        .message-text { margin: 0; font-size: 13px; color: #333; line-height: 1.4; word-break: break-word; }
        .action-footer { display: flex; justify-content: center; align-items: center; }
        .resolve-btn { width: 100%; padding: 8px 0; border: none; border-radius: 6px; background: #1d4ed8; color: white; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .resolve-btn:hover { background: #1e40af; }
        .resolve-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .resolved-badge { width: 100%; text-align: center; padding: 8px 0; border-radius: 6px; border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; font-size: 14px; font-weight: 600; }
        .empty-state { grid-column: 1 / -1; background: white; border: 1px solid #ddd; border-radius: 8px; padding: 40px; text-align: center; }
        .empty-state h3 { margin-bottom: 8px; }
        .empty-state p { margin: 0; color: #666; }
      `}</style>
    </div>
  );
}

export default Contacts;
