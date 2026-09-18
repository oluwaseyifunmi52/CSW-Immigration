import React, { useRef, useState, useEffect } from "react";
import "./index.css";
import { Node } from "./Node";

function Canvas({ objects = [], onAddObject, onUpdatePosition, onDeleteObject, connections, setConnections, connectingFromRef, tempLineRef }) {
  const canvasRef = useRef(null);
  const [activeNodeDragId, setActiveNodeDragId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const [connecting, setConnecting] = useState(false);
  const [sidebarDrag, setSidebarDrag] = useState(null);
  const [, forceUpdate] = useState(0);

  const genId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`);

  const getWorldCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left + canvas.scrollLeft, y: e.clientY - rect.top + canvas.scrollTop };
  };

  const R = 40;
  const getEdgePoint = (from, to, isSource) => {
    const fx = from.x + R, fy = from.y + R;
    const tx = to.x + R, ty = to.y + R;
    const dx = tx - fx, dy = ty - fy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    return isSource ? { x: fx + ux * R, y: fy + uy * R } : { x: tx - ux * R, y: ty - uy * R };
  };
  const bezierPath = (sx, sy, tx, ty) => {
    const dx = Math.abs(tx - sx);
    const offset = Math.max(40, dx * 0.5);
    return `M ${sx},${sy} C ${sx + offset},${sy} ${tx - offset},${ty} ${tx},${ty}`;
  };
  const renderedConnections = connections.map((conn) => {
    const fromNode = objects.find((n) => n.id === conn.sourceNodeId);
    const toNode = objects.find((n) => n.id === conn.targetNodeId);
    if (!fromNode || !toNode) return null;
    const fromPort = getEdgePoint(fromNode, toNode, true);
    const toPort = getEdgePoint(fromNode, toNode, false);
    return <path key={conn.id} d={bezierPath(fromPort.x, fromPort.y, toPort.x, toPort.y)} stroke="#6b46c1" strokeWidth={2} fill="none" strokeLinecap="round" />;
  });

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!connectingFromRef.current) return;
      const w = getWorldCoords(e);
      tempLineRef.current = { startX: connectingFromRef.current.startX, startY: connectingFromRef.current.startY, endX: w.x, endY: w.y };
      forceUpdate((v) => v + 1);
    };
  const handlePointerUp = (e) => {
      if (!connectingFromRef.current) return;
      const w = getWorldCoords(e);
      const overNode = objects.find((node) => { const cx = node.x + 40, cy = node.y + 40; return Math.hypot(w.x - cx, w.y - cy) <= 40; });
      if (overNode && overNode.id !== connectingFromRef.current.nodeId) {
        const nc = { id: genId(), sourceNodeId: connectingFromRef.current.nodeId, sourcePort: "output", targetNodeId: overNode.id, targetPort: "input" };
        setConnections((prev) => {
          const exists = prev.some((c) => (c.sourceNodeId === nc.sourceNodeId && c.targetNodeId === nc.targetNodeId) || (c.sourceNodeId === nc.targetNodeId && c.targetNodeId === nc.sourceNodeId));
          return exists ? prev : [...prev, nc];
        });
      }
      connectingFromRef.current = null;
      tempLineRef.current = null;
      setConnecting(false);
      forceUpdate((v) => v + 1);
    };
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => { document.removeEventListener("pointermove", handlePointerMove); document.removeEventListener("pointerup", handlePointerUp); };
  }, [objects, setConnections]);

  const handleDragEnter = (e) => { e.preventDefault(); dragCounterRef.current++; setIsDragOver(true); e.dataTransfer.dropEffect = "copy";
    const w = getWorldCoords(e);
    const hasType = e.dataTransfer.types.includes("application/x-object-type") || e.dataTransfer.types.includes("text/plain");
    if (hasType && !sidebarDrag) setSidebarDrag({ sx: w.x, sy: w.y, ex: w.x, ey: w.y });
  };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy";
    const w = getWorldCoords(e);
    setSidebarDrag(prev => prev ? { ...prev, ex: w.x, ey: w.y } : { sx: w.x, sy: w.y, ex: w.x, ey: w.y });
  };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounterRef.current = Math.max(0, dragCounterRef.current - 1); if (dragCounterRef.current === 0) { setIsDragOver(false); setSidebarDrag(null); } };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    setSidebarDrag(null);
    let type = e.dataTransfer.getData("application/x-object-type");
    if (!type) type = e.dataTransfer.getData("text/plain");
    if (!type || (type !== "objectA" && type !== "objectB")) return;
    const world = getWorldCoords(e);
    onAddObject(type, Math.max(0, world.x - 40), Math.max(0, world.y - 40));
  };

  return (
    <div ref={canvasRef} className={`canvas-wrapper ${isDragOver ? "drag-over" : ""} ${connecting ? "connecting" : ""}`} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {renderedConnections}
        {sidebarDrag && <path d={bezierPath(sidebarDrag.sx, sidebarDrag.sy, sidebarDrag.ex, sidebarDrag.ey)} stroke="#6b46c1" strokeWidth={2} fill="none" strokeDasharray="6 4" strokeLinecap="round" opacity={0.85} />}
        {tempLineRef.current && <path d={bezierPath(tempLineRef.current.startX, tempLineRef.current.startY, tempLineRef.current.endX, tempLineRef.current.endY)} stroke="#6b46c1" strokeWidth={2} fill="none" strokeDasharray="6 4" strokeLinecap="round" opacity={0.9} />}
      </svg>
      {objects.map((node) => (
        <Node key={node.id} id={node.id} label={node.label} x={node.x} y={node.y} isDragging={activeNodeDragId === node.id}
          onPositionChange={onUpdatePosition}
          onDelete={onDeleteObject}
          onDragStateChange={(nid, dragging) => setActiveNodeDragId(dragging ? nid : null)}
          onPortClick={(e, nid, portType) => {
            const w = getWorldCoords(e);
            if (portType === "output") {
              const sx = node.x + 40, sy = node.y + 40;
              connectingFromRef.current = { nodeId: nid, startX: sx, startY: sy };
              tempLineRef.current = { startX: sx, startY: sy, endX: w.x, endY: w.y };
              setConnecting(true);
              forceUpdate((v) => v + 1);
            } else if (portType === "input" && connectingFromRef.current) {
              const from = connectingFromRef.current;
              const nc = { id: genId(), sourceNodeId: from.nodeId, sourcePort: "output", targetNodeId: nid, targetPort: "input" };
              setConnections((prev) => {
                const exists = prev.some((c) => (c.sourceNodeId === nc.sourceNodeId && c.targetNodeId === nc.targetNodeId) || (c.sourceNodeId === nc.targetNodeId && c.targetNodeId === nc.sourceNodeId));
                return exists ? prev : [...prev, nc];
              });
              connectingFromRef.current = null; tempLineRef.current = null; setConnecting(false); forceUpdate((v) => v + 1);
            }
          }}
        />
      ))}
      {objects.length === 0 && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#999", pointerEvents: "none", fontSize: "12px" }}>Drag objects here • drag right dot to left dot to connect</div>}
    </div>
  );
}
export { Canvas };
