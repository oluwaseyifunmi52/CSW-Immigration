import React, { useRef } from "react";

function Node({ id, label, x, y, onPositionChange, onDelete, isDragging, onPortDown, onDragStateChange }) {
  const nodeRef = useRef(null);
  const dragRef = useRef(null);

  const handlePointerDown = (e) => {
    if (e.target.classList.contains("port")) {
      e.stopPropagation();
      onPortDown(e, id);
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
      id={id}
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
      <div className="node-body"><div className="node-label">{label.includes("A") ? "A" : label.includes("B") ? "B" : label}</div></div>
      <button className="node-delete-btn" onClick={(e) => { e.stopPropagation(); onDelete?.(id); }} aria-label={`Delete node ${label}`}>×</button>
      <div className="node-port-wrapper">
        <div
          className="port"
          style={{ position: 'absolute', right: -3, top: '50%', transform: 'translateY(-50%)' }}
          onPointerDown={(e) => { e.stopPropagation(); onPortDown?.(e, id); }}
          aria-label={`Connect from ${label}`}
        />
      </div>
    </div>
  );
}
export { Node };