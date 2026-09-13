function Card({ title, value, children }) {

  return (
    <div className="dashboard-card">

      {title && (<h3>{title}</h3>)}

      {value !== undefined && (<div className="card-value">{value}</div>)}

      {children}

      <style>{`
        .dashboard-card {
          background: #fff;
          border: 1px solid #bbb;
          border-radius: 10px;
          padding: 14px;
        }

        .dashboard-card h3 {
          text-align:center;
          margin: 0 0 10px;
          font-size: 14px;
          color: #666;
        }

        .card-value {
          text-align:center;
          font-size: 30px;
          font-weight: 700;
          color: #222;
        }
        @media screen and (max-width: 768px) { .dashboard-card { padding: 10px; } .card-value { font-size: 24px; } }
@media screen and (max-width: 480px) { .dashboard-card h3 { font-size: 13px; } .card-value { font-size: 20px; } }
      `}</style>

    </div>
  );
}

export default Card;
