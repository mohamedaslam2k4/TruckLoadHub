import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { API_URL } from "../../api";

function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/drivers`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch drivers");
      }

      setDrivers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      alert("Unable to load drivers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const getStatusClass = (status) => {
    if (!status) return "pending";
    return status.toLowerCase().replace(/\s+/g, "-");
  };

  // Combined Status & Search Filtering Logic
  const filteredDrivers = drivers.filter((driver) => {
    const matchesStatus =
      selectedStatus === "ALL" ||
      (driver.status || "PENDING").toUpperCase() === selectedStatus;

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (driver.name && driver.name.toLowerCase().includes(term)) ||
      (driver.email && driver.email.toLowerCase().includes(term)) ||
      (driver.phone && driver.phone.toLowerCase().includes(term)) ||
      (driver.city && driver.city.toLowerCase().includes(term)) ||
      (driver.truckNumber && driver.truckNumber.toLowerCase().includes(term)) ||
      (driver.licenseNumber && driver.licenseNumber.toLowerCase().includes(term)) ||
      String(driver.driverId || driver.id).includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div role="ADMIN">
      <div className="manage-loads-page">
        <div className="page-header">
          <div>
            <h1>Drivers</h1>
            <p>View registered driver profiles and truck details.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Search Input Filter */}
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-filter"
            />

            {/* Status Dropdown Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="status-filter"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <span className="load-count">{filteredDrivers.length} Drivers</span>
          </div>
        </div>

        <div className="my-loads-section">
          <div className="loads-grid">
            {loading ? (
              <p>Loading drivers...</p>
            ) : filteredDrivers.length === 0 ? (
              <div className="empty-state">
                <h3>No Drivers Found</h3>
                <p>There are no drivers matching the selected criteria.</p>
              </div>
            ) : (
              filteredDrivers.map((driver) => (
                <Card key={driver.id || driver.driverId}>
                  <div className="load-header">
                    <span className="load-id">
                      DRV # {String(driver.driverId || driver.id || "N/A").padStart(3, "0")}
                    </span>
                    <div className="route">
                      <span>{driver.name || "N/A"}</span>
                    </div>
                    <span className={`status ${getStatusClass(driver.status)}`}>
                      {driver.status || "PENDING"}
                    </span>
                  </div>

                  <div className="driver-info">
                    <div className="info-column">
                      <div className="driver-title">Driver Details</div>
                      <div className="driver-row">
                        <span>Email:</span>
                        <strong>{driver.email || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>Phone No:</span>
                        <strong>{driver.phone || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>City:</span>
                        <strong>{driver.city || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>Experience:</span>
                        <strong>
                          {driver.experience !== null && driver.experience !== undefined
                            ? `${driver.experience} Yrs`
                            : "N/A"}
                        </strong>
                      </div>
                    </div>

                    <div className="info-column">
                      <div className="driver-title">Truck Details</div>
                      <div className="driver-row">
                        <span>License No:</span>
                        <strong>{driver.licenseNumber || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>Truck No:</span>
                        <strong>{driver.truckNumber || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>Truck Type:</span>
                        <strong>{driver.truckType || "N/A"}</strong>
                      </div>
                      <div className="driver-row">
                        <span>Capacity:</span>
                        <strong>
                          {driver.capacity !== null && driver.capacity !== undefined
                            ? `${driver.capacity} Tons`
                            : "N/A"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="price">
                    <strong>Total Loads Completed :</strong>
                    <strong>{driver.totalLoads ?? driver.completedLoads ?? 0}</strong>
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
        .search-filter { padding: 8px 10px; border-radius: 6px; border: 1px solid #ccc; font-size: 14px; outline: none; min-width: 180px; }
        .status-filter { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 10px; background: #fff; font-size: 14px; cursor: pointer; }
        .load-id { display: block; color: #6b7280; font-size: 12px; font-weight: 600; background: #d2d8e5; padding: 4px 8px; border-radius: 5px; }
        .my-loads-section { margin-top: 10px; }
        .load-count { padding: 6px 8px; background: #eee; border: 1px solid #a9a8a8; border-radius: 6px; font-size: 14px; font-weight: 600; }
        .loads-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 10px; }
        .load-header { display: flex; justify-content: space-between; align-items: center; gap: 15px; padding-bottom: 8px; margin-bottom: 2px; border-bottom: 1px solid black; }
        .route { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 800; }
        .status { padding: 4px 8px; border-radius: 5px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .pending { background: #fef3c7; color: #92400e; }
        .verified { background: #dbeafe; color: #1d4ed8; }
        .rejected { background: #fce8e6; color: #c5221f; }
        .driver-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 8px; background: #f5f6f8; border-radius: 7px; margin-bottom: 8px; }
        .info-column:first-child { padding-right: 12px; border-right: 1px solid #e0e0e0; }
        .driver-title { font-size: 14px; font-weight: 700; margin-bottom: 6px; color: #222; text-decoration: underline; text-align: center; }
        .driver-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px; }
        .driver-row:last-child { margin-bottom: 0; }
        .driver-row span { color: #666; font-size: 12px; }
        .driver-row strong { font-size: 12px; text-align: right; color: #111; word-break: break-word; }
        .price { display: flex; justify-content: center; align-items: center; gap:4px; padding: 8px 0; border-radius: 6px; border: 1px solid #e2e2e2; background: #e7efff; }
        .price strong { font-size: 14px; font-weight: 800; }
        .empty-state { grid-column: 1 / -1; background: white; border: 1px solid #ddd; border-radius: 8px; padding: 40px; text-align: center; }
        .empty-state h3 { margin-bottom: 8px; }
        .empty-state p { margin: 0; color: #666; }
      `}</style>
    </div>
  );
}

export default Drivers;