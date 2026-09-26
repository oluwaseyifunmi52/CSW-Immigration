import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import "./index.css";
import { Node } from "./Node";

function Canvas({ objects = [], setObjects, onAddObject, onUpdatePosition, onDeleteObject, connections, setConnections }) {
  const canvasRef = useRef(null);
  const [activeNodeDragId, setActiveNodeDragId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [tempLine, setTempLine] = useState(null);
  const [sidebarDragPreview, setSidebarDragPreview] = useState(null);
  const dragCounterRef = useRef(0);
  const R = 40;
  const SIDEBAR_X = 280;

  const handlePointerDown = useCallback((e, nodeId) => {
    e.stopPropagation();
    setConnecting(true);
    setTempLine({
      fromNodeId: nodeId,
      endX: e.clientX,
      endY: e.clientY,
    });
  }, []);

  const getCanvasCoords = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left + canvas.scrollLeft, y: clientY - rect.top + canvas.scrollTop };
  }, []);

  const getPortCenter = useCallback((nodeId) => {
    const node = objects.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const canvasRect = canvas.getBoundingClientRect();
    const portEl = canvas.querySelector(`.node[id="${nodeId}"] .port`);
    if (!portEl) return { x: 0, y: 0 };
    const portRect = portEl.getBoundingClientRect();
    return {
      x: portRect.left + portRect.width / 2 - canvasRect.left + canvas.scrollLeft,
      y: portRect.top + portRect.height / 2 - canvasRect.top + canvas.scrollTop,
    };
  }, [objects]);

  const getSidebarPortCenter = useCallback((portType) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const canvasRect = canvas.getBoundingClientRect();
    const sidebar = canvas.parentElement?.querySelector(".sidebar");
    if (!sidebar) return null;
    const items = sidebar.querySelectorAll(".palette-item");
    for (const item of items) {
      const label = item.querySelector(".item-label")?.textContent;
      if ((portType === "A" && label?.includes("A")) || (portType === "B" && label?.includes("B"))) {
        const circle = item.querySelector(".object-circle");
        if (!circle) return null;
        const circleRect = circle.getBoundingClientRect();
        return {
          x: circleRect.left + circleRect.width / 2 - canvasRect.left + canvas.scrollLeft,
          y: circleRect.top + circleRect.height / 2 - canvasRect.top + canvas.scrollTop,
        };
      }
    }
    return null;
  }, []);

  const getConnectionPoint = useCallback((conn, isStart) => {
    const nodeId = isStart ? conn.fromNodeId : conn.toNodeId;
    const portType = isStart ? conn.fromPort : conn.toPort;
    if (nodeId === "sidebar") return getSidebarPortCenter(portType);
    return getPortCenter(nodeId);
  }, [getPortCenter, getSidebarPortCenter]);

  const dottedStraightPath = (sx, sy, tx, ty) => `M ${sx},${sy} L ${tx},${ty}`;

  const cCurvePath = (sx, sy, tx, ty) => {
    const dx = tx - sx;
    const dy = ty - sy;
    const bend = Math.max(80, Math.min(220, Math.abs(dx) * 0.5 + 80));
    const cp1x = sx + bend;
    const cp1y = sy;
    const cp2x = tx + bend;
    const cp2y = ty;
    return `M ${sx},${sy} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${tx},${ty}`;
  };

  const tempLineStart = useMemo(() => tempLine ? getPortCenter(tempLine.fromNodeId) : { x: 0, y: 0 }, [tempLine, getPortCenter]);

const renderedConnections = useMemo(() => connections.map((conn) => {
    const from = getConnectionPoint(conn, true);
    const to = getConnectionPoint(conn, false);
    if (!from || !to) return null;
    if (from.x === null || from.y === null || to.x === null || to.y === null) return null;
    const isSidebar = conn.type === "sidebar";
    const d = isSidebar ? dottedStraightPath(from.x, from.y, to.x, to.y) : cCurvePath(from.x, from.y, to.x, to.y);
    const dash = isSidebar ? "6 4" : "6 4";
    return (
      <path
        key={conn.id}
        d={d}
        stroke="#6b46c1"
        strokeWidth={2}
        fill="none"
        strokeDasharray={dash}
        strokeLinecap="round"
        markerEnd={isSidebar ? undefined : "url(#arrowhead)"}
      />
    );
  }), [connections, getConnectionPoint]);

  const dragDropAnnotations = useMemo(() => {
    const annotations = [];

    // "Connecting two dots" annotation for A-B node connection
    const connAtoB = connections.find(
      (c) => c.type === "node" && c.fromNodeId !== "sidebar" && c.toNodeId !== "sidebar"
    );
    if (connAtoB) {
      const from = getConnectionPoint(connAtoB, true);
      const to = getConnectionPoint(connAtoB, false);
      if (from && to) {
        const fx = from.x;
        const fy = from.y;
        const tx = to.x;
        const ty = to.y;
        const mx = (fx + tx) / 2 + 15;
        const my = (fy + ty) / 2;
        const arrowPath = `M ${tx - 10} ${ty - 5} L ${tx} ${ty} L ${tx - 10} ${ty + 5}`;
        annotations.push(
          <g key="connecting-dots" style={{ pointerEvents: "none" }}>
            <path d={arrowPath} stroke="#6b46c1" strokeWidth={1} />
            <text x={mx} y={my} fontSize={10} fill="#6b46c1">Connecting two dots</text>
          </g>
        );
      }
    }

    return annotations;
  }, [objects, connections, getSidebarPortCenter, getPortCenter]);

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!connecting || !tempLine) return;
      const w = getCanvasCoords(e.clientX, e.clientY);
      setTempLine(prev => prev ? { ...prev, endX: w.x, endY: w.y } : null);
    };

    const handlePointerUp = (e) => {
      if (!connecting || !tempLine) {
        setConnecting(false);
        setTempLine(null);
        return;
      }
      const w = getCanvasCoords(e.clientX, e.clientY);
      const overNode = objects.find((node) => {
        const cx = node.x + R, cy = node.y + R;
        return Math.hypot(w.x - cx, w.y - cy) <= R && node.id !== tempLine.fromNodeId;
      });

      setConnecting(false);
      setTempLine(null);

      if (overNode) {
        const nc = { id: `${tempLine.fromNodeId}-${overNode.id}`, fromNodeId: tempLine.fromNodeId, toNodeId: overNode.id };
        setConnections(prev => {
          const exists = prev.some(c => (c.fromNodeId === nc.fromNodeId && c.toNodeId === nc.toNodeId) || (c.fromNodeId === nc.toNodeId && c.toNodeId === nc.fromNodeId));
          return exists ? prev : [...prev, nc];
        });
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("pointerdown", (e) => {
        if (e.target.classList.contains("port")) {
          const nodeId = e.target.closest(".node")?.id;
          if (nodeId) handlePointerDown(e, nodeId);
        }
      });
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerup", handlePointerUp);
      return () => {
        canvas.removeEventListener("pointerdown", () => {});
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [connecting, objects, setConnections, getCanvasCoords, tempLine]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const type = e.dataTransfer.getData("application/x-object-type") || e.dataTransfer.getData("text/plain");
    if (!type || (type !== "objectA" && type !== "objectB")) return;
    const w = getCanvasCoords(e.clientX, e.clientY);
    const sidebarStart = getSidebarPortCenter(type === "objectA" ? "A" : "B");
    setIsDragOver(true);
    setSidebarDragPreview({ type, sx: sidebarStart.x, sy: sidebarStart.y, ex: w.x, ey: w.y });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const w = getCanvasCoords(e.clientX, e.clientY);
    setSidebarDragPreview(prev => prev ? { ...prev, ex: w.x, ey: w.y } : null);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setSidebarDragPreview(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const previewType = sidebarDragPreview?.type;
    setSidebarDragPreview(null);

    let type = e.dataTransfer.getData("application/x-object-type");
    if (!type) type = e.dataTransfer.getData("text/plain");
    if (!type || (type !== "objectA" && type !== "objectB")) return;

    const w = getCanvasCoords(e.clientX, e.clientY);
    const newX = Math.max(0, w.x - R);
    const newY = Math.max(0, w.y - R);

    const newNodeId = onAddObject(type, newX, newY);
    if (newNodeId) {
      const sidebarConn = {
        id: `sidebar-${type}-${newNodeId}`,
        type: "sidebar",
        fromNodeId: "sidebar",
        fromPort: type === "objectA" ? "A" : "B",
        toNodeId: newNodeId,
        toPort: "port",
      };
      setConnections(prev => {
        const exists = prev.some(c => c.id === sidebarConn.id);
        return exists ? prev : [...prev, sidebarConn];
      });
    }
  };

  return (
    <div ref={canvasRef} className={`canvas-wrapper ${isDragOver ? "drag-over" : ""} ${connecting ? "connecting" : ""}`} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <defs>
          <marker markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" id="arrowhead">
            <path d="M 0 0 L 10 3 L 0 6 Z" fill="#6b46c1" />
          </marker>
        </defs>
        {renderedConnections}
        {dragDropAnnotations}
        {tempLine && <path d={cCurvePath(tempLineStart.x, tempLineStart.y, tempLine.endX != null ? tempLine.endX : tempLineStart.x, tempLine.endY != null ? tempLine.endY : tempLineStart.y)} stroke="#6b46c1" strokeWidth={2} fill="none" strokeDasharray="none" strokeLinecap="round" opacity={0.9} marker-end="url(#arrowhead)" />}
        {sidebarDragPreview && <path d={dottedStraightPath(sidebarDragPreview.sx, sidebarDragPreview.sy, sidebarDragPreview.ex, sidebarDragPreview.ey)} stroke="#6b46c1" strokeWidth={2} fill="none" strokeDasharray="6 4" strokeLinecap="round" opacity={0.85} />}
      </svg>
      {objects.map((node) => (
        <Node key={node.id} id={node.id} label={node.label} x={node.x} y={node.y} isDragging={activeNodeDragId === node.id}
          onPositionChange={onUpdatePosition}
          onDelete={onDeleteObject}
          onDragStateChange={(nid, dragging) => setActiveNodeDragId(dragging ? nid : null)}
          onPortDown={(e, nid) => { e.stopPropagation(); handlePointerDown(e, nid); }}
        />
      ))}
      {objects.length === 0 && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#999", pointerEvents: "none", fontSize: "12px" }}>Drag objects here • drag right dot to left dot to connect</div>}
    </div>
  );
}
export { Canvas };