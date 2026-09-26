import React, { useRef, useState, useEffect } from "react";
import "./index.css";
import { Node } from "./Node";

function Canvas({ objects = [], onAddObject, onUpdatePosition, onDeleteObject, connections, setConnections }) {
  const canvasRef = useRef(null);
  const [activeNodeDragId, setActiveNodeDragId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sidebarDrag, setSidebarDrag] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [tempLine, setTempLine] = useState(null);
  const dragCounterRef = useRef(0);
  const R = 40;

  const getWorldCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left + canvas.scrollLeft, y: e.clientY - rect.top + canvas.scrollTop };
  };

  const getPortCenter = (nodeId) => {
    const node = objects.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const canvasRect = canvas?.getBoundingClientRect();
    if (!canvasRect || !canvas) return { x: 0, y: 0 };
    const allPorts = canvas.querySelectorAll(".port");
    if (allPorts) {
      for (const p of allPorts) {
        const parentNode = p.closest(".node");
        if (parentNode && parentNode.id === nodeId) {
          const portRect = p.getBoundingClientRect();
          const x = portRect.left + portRect.width / 2 - canvasRect.left + canvas.scrollLeft;
          const y = portRect.top + portRect.height / 2 - canvasRect.top + canvas.scrollTop;
          return { x, y };
        }
      }
    }
    return { x: 0, y: 0 };
  };

  const dottedStraightPath = (sx, sy, tx, ty) => `M ${sx},${sy} L ${tx},${ty}`;

  const cCurvePath = (sx, sy, tx, ty) => {
    const offsetX = 180;
    const cp1x = sx - offsetX;
    const cp1y = sy + (ty - sy) * 0.3;
    const cp2x = tx - offsetX;
    const cp2y = ty - (ty - sy) * 0.3;
    return `M ${sx},${sy} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${tx},${ty}`;
  };

  const tempLineStart = tempLine ? getPortCenter(tempLine.fromNodeId) : { x: 0, y: 0 };

  const renderedConnections = connections.map((conn) => {
    const fromCenter = getPortCenter(conn.fromNodeId);
    const toCenter = getPortCenter(conn.toNodeId);
    if (fromCenter.x === 0 && fromCenter.y === 0) return null;
    if (toCenter.x === 0 && toCenter.y === 0) return null;
    return <path key={conn.id} d={cCurvePath(fromCenter.x, fromCenter.y, toCenter.x, toCenter.y)} stroke="#6b46c1" strokeWidth={2} fill="none" strokeDasharray="5 5" strokeLinecap="round" />;
  });

  useEffect(() => {
    let cleanup = false;

    const handlePointerDown = (e, nodeId) => {
      e.stopPropagation();
      setConnecting(true);
      setTempLine({ nodeId, endX: 0, endY: 0 });
    };

    const handlePointerMove = (e) => {
      if (!connecting || !tempLine) return;
      const w = getWorldCoords(e);
      setTempLine(prev => prev ? { ...prev, endX: w.x, endY: w.y } : { startX: w.x, startY: w.y, endX: w.x, endY: w.y });
    };

    const handlePointerUp = (e) => {
      if (!connecting || !tempLine) {
        setConnecting(false);
        setTempLine(null);
        return;
      }
      const w = getWorldCoords(e);
      const overNode = objects.find((node) => {
        const cx = node.x + R, cy = node.y + R;
        return Math.hypot(w.x - cx, w.y - cy) <= R && node.id !== tempLine.nodeId;
      });

      setConnecting(false);
      setTempLine(null);

      if (overNode) {
        const nc = { id: `${tempLine.nodeId}-${overNode.id}`, fromNodeId: tempLine.nodeId, toNodeId: overNode.id };
        setConnections((prev) => {
          const exists = prev.some((c) => (c.fromNodeId === nc.fromNodeId && c.toNodeId === nc.toNodeId) || (c.fromNodeId === nc.toNodeId && c.toNodeId === nc.fromNodeId));
          return exists ? prev : [...prev, nc];
        });
      }
    };

    if (canvasRef.current) {
      canvasRef.current.addEventListener("pointerdown", (e) => {
        const target = e.target;
        if (target.classList.contains("port")) {
          const nodeId = target.parentNode.parentNode.id;
          handlePointerDown(e, nodeId);
        }
      });

      canvasRef.current.addEventListener("pointermove", (e) => {
        handlePointerMove(e);
      });

      canvasRef.current.addEventListener("pointerup", (e) => {
        handlePointerUp(e);
      });
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("pointerdown", (e) => { });
        canvasRef.current.removeEventListener("pointermove", (e) => { });
        canvasRef.current.removeEventListener("pointerup", (e) => { });
      }
    };
  }, [connecting, objects, setConnections]);

  const handleDragEnter = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy";
    const w = getWorldCoords(e);
    setIsDragOver(true);
  };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy";
    const w = getWorldCoords(e);
    setSidebarDrag(prev => prev ? { ...prev, ex: w.x, ey: w.y } : { sx: w.x, sy: w.y, ex: w.x, ey: w.y });
  };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); setSidebarDrag(null); };
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
    onAddObject(type, Math.max(0, world.x - R), Math.max(0, world.y - R));
  };

  return (
    <div ref={canvasRef} className={`canvas-wrapper ${isDragOver ? "drag-over" : ""} ${connecting ? "connecting" : ""}`} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {renderedConnections}
        {tempLine && <path d={cCurvePath(tempLineStart.x, tempLineStart.y, tempLine.endX != null ? tempLine.endX : tempLineStart.x, tempLine.endY != null ? tempLine.endY : tempLineStart.y)} stroke="#6b46c1" strokeWidth={2} fill="none" strokeDasharray="6 4" strokeLinecap="round" opacity={0.9} />}
        {sidebarDrag && <path d={dottedStraightPath(sidebarDrag.sx, sidebarDrag.sy, sidebarDrag.ex, sidebarDrag.ey)} stroke="#6b46c1" strokeWidth={2} fill="none" strokeDasharray="6 4" strokeLinecap="round" opacity={0.85} />}
      </svg>
      {objects.map((node) => (
        <Node key={node.id} id={node.id} label={node.label} x={node.x} y={node.y} isDragging={activeNodeDragId === node.id}
          onPositionChange={onUpdatePosition}
          onDelete={onDeleteObject}
          onDragStateChange={(nid, dragging) => setActiveNodeDragId(dragging ? nid : null)}
          onPortDown={(e, nid) => {
            e.stopPropagation();
            handlePointerDown(e, nid);
          }}
        />
      ))}
      {objects.length === 0 && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#999", pointerEvents: "none", fontSize: "12px" }}>Drag objects here • drag right dot to left dot to connect</div>}
    </div>
  );
}
export { Canvas };
