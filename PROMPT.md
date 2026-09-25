# CSW-Immigration Project Prompt

## Project Overview
A React-based drag-and-drop workflow/connection diagram builder where users can:
- Drag objects (Object A, Object B) from sidebar onto canvas
- Drag objects around on canvas
- Connect objects by clicking output ports and then input ports
- Delete objects

## Key Features
1. **Object Management**: Add/remove objects (Object A, Object B) from the workspace
2. **Drag & Drop**: Move objects freely on the canvas
3. **Connection System**: 
   - Click output port (right dot) to start connection
   - Click input port (left dot) on another object to complete connection
   - Prevent duplicate connections
4. **Visual Feedback**: 
   - Bezier curve connections between nodes
   - Temporary line preview while connecting
   - Drag-over states
5. **Sidebar Palette**: Drag objects from sidebar onto canvas

## Component Structure
- **App.jsx**: Main container managing state (objects, connections), handles add/update/delete operations
- **Canvas.jsx**: SVG canvas with connection logic, drag handling, temp line preview
- **Node.jsx**: Individual draggable node with delete button and connection ports
- **Sidebar.jsx**: Palette with draggable object types

## Technical Details
- Uses React hooks (useState, useRef, useCallback, useEffect)
- Custom hook `genId()` for UUID generation with fallback
- Pointer events for drag/connect interactions
- Bezier curve paths for visual connections
- Drag-and-drop with DataTransfer API
- CSS classes for styling (defined in index.css)

## Usage
Users can build workflow diagrams by dragging objects from the sidebar and connecting them to show relationships or processes.

## Potential Prompts for AI Assistance
- "Add a delete confirmation modal before removing objects"
- "Implement zoom and pan functionality on the canvas"
- "Add connection validation to prevent crossing connections"
- "Create a save/load JSON export/import feature"
- "Add tooltips on hover for nodes and connections"
- "Implement right-click menu for additional options"