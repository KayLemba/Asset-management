import Icon from "./Icon";

export default function TableScroll({ children, minWidth = "900px", className = "" }) {
  return (
    <div className={`table-card table-card-scroll ${className}`.trim()} style={{ "--table-min-width": minWidth }}>
      <div className="table-scroll-caption">
        <Icon name="transfer" size={14} />
        <span>All columns are available; scroll horizontally on smaller screens.</span>
      </div>
      <div className="table-scroll-region">{children}</div>
    </div>
  );
}
