import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function DashboardLayout({ role, children }) {
  return (
    <div className="dashboard-layout">
      {/* 30% left */}
      <Navbar role={role} />

      {/* 70% Right */}
      <div className="dashboard-body">
        <Sidebar role={role} />

        <main className="dashboard-content">{children}</main>
      </div>

      <style>{`
        .dashboard-layout {
          min-height: 100vh;
          background: #f5f6f8;
      
        }

        .dashboard-body {
          display: flex;
          min-height: calc(100vh - 60px);
          align-items: flex-start;
        }

        .dashboard-content {
          flex: 1;
          padding:6px 12px;
          min-width: 0;
        }
      `}</style>
    </div>
  );
}

export default DashboardLayout;
