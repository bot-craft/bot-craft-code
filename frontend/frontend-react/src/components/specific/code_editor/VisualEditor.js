// src/components/specific/code_editor/VisualEditor.js
import React, { useCallback } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  applyEdgeChanges, 
  applyNodeChanges,
  Handle, 
  Position 
} from 'reactflow';
import 'reactflow/dist/style.css';
import './VisualEditor.css';

// --- Custom Node Component ---
const CustomNode = ({ data }) => {
  // Determine if this is a python node
  const isPython = data.type === 'python-script';
  const label = data.label;
  const content = data.content || {};

  // Extract simple list of items/data to show in body
  const renderBody = () => {
     if (isPython) return <div style={{opacity: 0.7}}>Python Script</div>;

     if (content.kind === 'menu' && content.items) {
         return (
             <ul style={{margin:0, paddingLeft: 15}}>
                 {content.items.map((it, i) => (
                     <li key={i}>{it.title?.substring(0, 15)}...</li>
                 ))}
             </ul>
         );
     }
     
     if (content.data) {
         return (
             <div style={{fontSize: 10}}>
                 {content.data.map((d, i) => {
                     const key = Object.keys(d)[0];
                     return <div key={i}>• {key}</div>;
                 })}
             </div>
         );
     }
     
     return <div style={{fontStyle: 'italic'}}>{content.kind}</div>;
  };

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div className="node-wrapper">
        <div className="node-header">
          <span>{label}</span>
          <span style={{fontSize: '0.8em', opacity: 0.8}}>{isPython ? 'PY' : ''}</span>
        </div>
        <div className="node-body">
            {renderBody()}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// --- Visual Editor Component ---
const VisualEditor = ({ nodes, edges, onNodesChange, onEdgesChange }) => {
  
  const handleNodesChange = useCallback(
    (changes) => onNodesChange(applyNodeChanges(changes, nodes)),
    [nodes, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes) => onEdgesChange(applyEdgeChanges(changes, edges)),
    [edges, onEdgesChange]
  );

  return (
    <div style={{ width: '100%', height: '100%', background: '#1e1e1e' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default VisualEditor;
