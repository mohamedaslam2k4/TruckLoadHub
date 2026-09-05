import { useEffect, useState, useMemo } from "react";
import Card from "../../components/Card";
import { API_URL } from "../../api";

function MyDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [loadFilter, setLoadFilter] = useState("ALL");
  const [completingDeal, setCompletingDeal] = useState(null);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const driverId = currentUser.profileId;

  const fetchDeals = async () => {
    if (!driverId) {
      console.error("Driver ID missing. User payload in sessionStorage:", currentUser);
      alert("Driver information not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/deals/driver/${driverId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned status ${response.status}`);
      }
      const data = await response.json();

      setDeals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching deals:", error);
      alert(`Unable to load your deals: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [driverId]);

  // Extract unique Load IDs for the dropdown filter
  const uniqueLoadIds = useMemo(() => {
    const ids = deals.map((deal) => deal.loadId).filter(Boolean);
    return Array.from(new Set(ids)).sort((a, b) => a - b);
  }, [deals]);

  const handleComplete = async (dealId) => {
    const confirmComplete = window.confirm(
      "Are you sure you want to mark this trip as completed?"
    );
    if (!confirmComplete) return;

    try {
      setCompletingDeal(dealId);
      const response = await fetch(`${API_URL}/deals/${dealId}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to complete trip");
      }

      setDeals((previousDeals) =>
        previousDeals.map((deal) =>
          deal.dealId === dealId ? { ...deal, status: "COMPLETED" } : deal
        )
      );
      alert("Trip completed successfully");
    } catch (error) {
      console.error("Complete deal error:", error);
      alert(error.message || "Unable to complete trip");
    } finally {
      setCompletingDeal(null);
    }
  };

  // Combined Status and Load filter
  const filteredDeals = deals.filter((deal) => {
    const matchesStatus = filter === "ALL" || deal.status === filter;
    const matchesLoad = loadFilter === "ALL" || String(deal.loadId) === String(loadFilter);
    return matchesStatus && matchesLoad;
  });

  return (
    <div role="DRIVER">
      <div className="manage-loads-page">
        <div className="page-header">
          <div>
            <h1>My Deals</h1>
            <p>Manage and Track your ongoing loads.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Load Filter */}
            <select
              className="filter-select"
              value={loadFilter}
              onChange={(e) => setLoadFilter(e.target.value)}
            >
              <option value="ALL">All Loads</option>
              {uniqueLoadIds.map((id) => (
                <option key={id} value={id}>
                  Load #{id}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="IN TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <span className="load-count">{filteredDeals.length} Deals</span>
          </div>
        </div>

        <div className="my-loads-section">
          <div className="loads-grid">
            {loading ? (
              <p>Loading your deals...</p>
            ) : filteredDeals.length === 0 ? (
              <div className="empty-state">
                <h3>No Deals Found</h3>
                <p>No deals match the selected filter criteria.</p>
              </div>
            ) : (
              filteredDeals.map((deal) => (
                <Card key={deal.dealId}>
                  <div className="load-header">
                    <span className="load-id">Deal # {deal.dealId}</span>
                    <div className="route">
                      <span>{deal.pickup}</span>
                      <span className="arrow">→</span>
                      <span>{deal.destination}</span>
                    </div>
                    <span className={`status ${(deal.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
                      {deal.status}
                    </span>
                  </div>
                  <div className="load">Load # {deal.loadId}</div>
                  <div className="load-details">
                    <div className="detail">
                      <strong>Load Type : </strong>
                      <span>{deal.loadType || "N/A"}</span>
                    </div>
                    <div className="detail">
                      <strong>Weight :</strong>
                      <span>
                        {deal.weight !== null && deal.weight !== undefined
                          ? `${deal.weight} Tons`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="detail">
                      <strong>Truck Type :</strong>
                      <span>{deal.truckType || "N/A"}</span>
                    </div>
                    <div className="detail">
                      <strong>Pickup Date :</strong>
                      <span>{deal.pickupDate}</span>
                    </div>
                  </div>

                  {/* LOADER & COMPANY INFORMATION CARD */}
                  <div className="driver-info">
                    <div className="info-column">
                      <div className="driver-title">Loader Details</div>
                      <div className="driver-row">
                        <span>Name:</span>
                        <strong>{deal.loaderName || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>Phone No:</span>
                        <strong>{deal.loaderPhone || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>City:</span>
                        <strong>{deal.loaderCity || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>Address:</span>
                        <strong>{deal.companyAddress || "N/A"}</strong>
                      </div>
                    </div>

                    <div className="info-column">
                      <div className="driver-title">Company Details</div>
                      <div className="driver-row">
                        <span>Company:</span>
                        <strong>{deal.companyName || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>Type:</span>
                        <strong>{deal.businessType || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>GST No:</span>
                        <strong>{deal.gstNumber || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>Hours:</span>
                        <strong>{deal.operatingHours || "N/A"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="price">
                    <strong>Your Agreed Deal Price :</strong>
                    <strong>
                      ₹{Number(deal.dealPrice || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  {deal.status === "PENDING" && (
                    <div className="pending-message">
                      Waiting for loader confirmation.
                    </div>
                  )}

                  {deal.status === "ACCEPTED" && (
                    <div className="accepted-message">
                      Deal accepted by loader.<br />
                      Waiting for trip to start.
                    </div>
                  )}

                  {deal.status === "IN TRANSIT" && (
                    <button
                      type="button"
                      className="complete-button"
                      onClick={() => handleComplete(deal.dealId)}
                      disabled={completingDeal === deal.dealId}
                    >
                      {completingDeal === deal.dealId
                        ? "Completing..."
                        : "Complete Trip"}
                    </button>
                  )}

                  {deal.status === "COMPLETED" && (
                    <div className="completed-message">✓ Trip Completed</div>
                  )}

                  {deal.status === "REJECTED" && (
                    <div className="rejected-message">Deal Rejected</div>
                  )}
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
        .load-id { display: block; color: #6b7280; font-size: 12px; font-weight: 600; background: #d2d8e5; padding: 4px 8px; border-radius: 5px; }
        .my-loads-section { margin-top: 10px; }
        .filter-select { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 10px; background: #fff; font-size: 14px; cursor: pointer; }
        .load-count { padding: 6px 8px; background: #eee; border: 1px solid #a9a8a8; border-radius: 6px; font-size: 14px; font-weight: 600; }
        .loads-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 10px; }
        .load-header { display: flex; justify-content: space-between; align-items: center; gap: 15px; padding-bottom: 8px; margin-bottom: 2px; border-bottom: 1px solid black; }
        .route { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 800; }
        .arrow { color: #444; }
        .status { padding: 4px 8px; border-radius: 5px; font-size: 12px; font-weight: 600; white-space: wrap; }
        .pending { background: #fef3c7; color: #92400e; }
        .accepted { background: #dbeafe; color: #1d4ed8; }
        .in-transit { background: #e6f4ea; color: #137333; }
        .completed { background: #e8eaf6; color: #3f51b5; }
        .rejected { background: #fce8e6; color: #c5221f; }
        .load { text-align: center; color: #222; text-decoration: underline; font-size: 14px; font-weight: 700; margin-bottom: 2px; }
        .load-details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
        .detail { display: flex; align-items: center; gap: 5px; }
        .detail span { font-size: 13px; color: #777; }
        .detail strong { font-size: 14px; }
        .driver-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 4px 8px; background: #f5f6f8; border-radius: 7px; margin-bottom: 8px; }
        .info-column:first-child { padding-right: 12px; border-right: 1px solid #e0e0e0; }
        .driver-title { font-size: 14px; font-weight: 700; margin-bottom: 2px; color: #222; text-decoration: underline; text-align: center; }
        .driver-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 2px; }
        .driver-row:last-child { margin-bottom: 0; }
        .driver-row span { color: #666; font-size: 12px; }
        .driver-row strong { font-size: 12px; text-align: right; color: #111; }
        .price { display: flex; justify-content: space-evenly; align-items: center; padding: 8px 0; border-radius: 6px; border: 1px solid #e2e2e2; margin-bottom: 8px; background: #e7efff; }
        .price strong { font-size: 16px; font-weight: 800; }
        .complete-button { width: 100%; padding: 8px; border: none; border-radius: 6px; background: #222; color: white; font-weight: 600; cursor: pointer; font-size: 14px; }
        .complete-button:disabled { opacity: 0.6; cursor: not-allowed; }
        .pending-message { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 6px; background: #fef3c7; color: #92400e; text-align: center; font-size: 12px; font-weight: 600; }
        .accepted-message { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 6px; background: #dbeafe; color: #1d4ed8; text-align: center; font-size: 12px; font-weight: 600; line-height: 1.4; }
        .completed-message { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 6px; background: #e8eaf6; color: #3f51b5; text-align: center; font-size: 12px; font-weight: 600; }
        .rejected-message { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 6px; background: #fce8e6; color: #c5221f; text-align: center; font-size: 12px; font-weight: 600; }
        .empty-state { grid-column: 1 / -1; background: white; border: 1px solid #ddd; border-radius: 8px; padding: 40px; text-align: center; }
        .empty-state h3 { margin-bottom: 8px; }
        .empty-state p { margin: 0; color: #666; }
      `}</style>
    </div>
  );
}

export default MyDeals;