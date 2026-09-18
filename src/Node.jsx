import React, { useRef } from "react";

function Node({ id, label, x, y, onPortClick, onPositionChange, onDelete, isDragging, onDragStateChange }) {
  const nodeRef = useRef(null);
  const dragRef = useRef(null);

  const handlePointerDown = (e) => {
    if (e.target.classList.contains("port")) {
      e.stopPropagation();
      if (onPortClick) onPortClick(e, id, e.target.classList.contains("input-port") ? "input" : "output");
      return;
    }
    if (e.target.closest(".node-delete-btn")) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = x;
    const origY = y;
    dragRef.current = { startX, startY, origX, origY };
    onDragStateChange?.(id, true);
    try { nodeRef.current?.setPointerCapture(e.pointerId); } catch {}
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = Math.max(0, dragRef.current.origX + dx);
    const newY = Math.max(0, dragRef.current.origY + dy);
    onPositionChange?.(id, newX, newY);
  };

  const handlePointerUp = (e) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    onDragStateChange?.(id, false);
    try { nodeRef.current?.releasePointerCapture(e.pointerId); } catch {}
  };

  const handlePointerCancel = (e) => {
    dragRef.current = null;
    onDragStateChange?.(id, false);
    try { nodeRef.current?.releasePointerCapture(e.pointerId); } catch {}
  };

  return (
    <div
      ref={nodeRef}
      className={`node ${isDragging ? "dragging" : ""}`}
      style={{ left: `${x}px`, top: `${y}px` }}
      role="button"
      aria-label={`Node ${label}`}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <button className="node-delete-btn" onClick={(e) => { e.stopPropagation(); onDelete?.(id); }} aria-label={`Delete node ${label}`}>×</button>
      <div className="node-body"><div className="node-label">{label.includes("A") ? "A" : label.includes("B") ? "B" : label}</div></div>
      <div className="node-ports">
        <div className="port input-port" onPointerDown={(e) => { e.stopPropagation(); onPortClick?.(e, id, "input"); }} />
        <div className="port output-port" onPointerDown={(e) => { e.stopPropagation(); onPortClick?.(e, id, "output"); }} />
      </div>
    </div>
  );
}
export { Node };

