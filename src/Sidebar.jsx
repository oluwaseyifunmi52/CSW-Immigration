import React from "react";
import "./index.css";

function Sidebar() {
  const allObjects = [
    { type: "objectA", label: "Object A" },
    { type: "objectB", label: "Object B" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-icon"></span>
        Objects
      </div>
      <div className="palette">
        {allObjects.map(item => (
          <div
            key={item.type}
            className="palette-item"
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData("application/x-object-type", item.type);
              e.dataTransfer.setData("text/plain", item.type);
              e.dataTransfer.effectAllowed = "copy";
              const img = new Image();
              img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";
              try { e.dataTransfer.setDragImage(img, 0, 0); } catch {}
            }}
            aria-label={`Drag ${item.label} to canvas`}
          >
            <span className="object-circle" style={{ cursor: "grab", userSelect: "none" }} />
            <span className="item-label">{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
export { Sidebar };
