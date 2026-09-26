import React, { useRef, useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";

const NODE_TYPES = {
  objectA: { label: "Object A" },
  objectB: { label: "Object B" },
};

export default function App() {
  const [objects, setObjects] = useState([]);
  const [connections, setConnections] = useState([]);

  const genId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`);
  const addObject = useCallback((type, worldX, worldY) => {
    if (!NODE_TYPES[type]) return null;
    const newObject = {
      id: genId(),
      type,
      label: NODE_TYPES[type].label,
      x: worldX,
      y: worldY,
    };
    setObjects(prev => [...prev, newObject]);
    return newObject.id;
  }, []);

  const updateObjectPosition = useCallback((id, x, y) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, x, y } : o));
  }, []);

  const deleteObject = useCallback((id) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    setConnections(prev => prev.filter(c => c.fromNodeId !== id && c.toNodeId !== id));
  }, []);

  return (
    <div className="app" id="workflow-app">
      <Sidebar />
      <Canvas
        objects={objects}
        setObjects={setObjects}
        onAddObject={addObject}
        onUpdatePosition={updateObjectPosition}
        onDeleteObject={deleteObject}
        connections={connections}
        setConnections={setConnections}
      />
    </div>
  );
}