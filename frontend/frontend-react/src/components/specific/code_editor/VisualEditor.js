// src/components/specific/code_editor/VisualEditor.js
import React, { useCallback } from 'react';
import ReactFlow, { 
  Controls, 
  Panel,
  Background, 
  applyEdgeChanges, 
  applyNodeChanges,
  Handle, 
  Position,
  MarkerType
} from 'reactflow';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import EditNoteIcon from '@mui/icons-material/EditNote';
import QuizIcon from '@mui/icons-material/Quiz';
import BoltIcon from '@mui/icons-material/Bolt';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { IconButton, Tooltip } from '@mui/material';
import 'reactflow/dist/style.css';
import './VisualEditor.css';

// --- Custom Node Component ---
const CustomNode = ({ data }) => {
  // Determine if this is a python node
  const isPython = data.type === 'python-script';
  const label = data.label;
  const content = data.content || {};

  const getBadge = (nodeType) => {
    switch (nodeType) {
      case 'menu':
        return { icon: <AltRouteIcon fontSize="inherit" />, className: 'node-badge-menu' };
      case 'data_gathering':
        return { icon: <EditNoteIcon fontSize="inherit" />, className: 'node-badge-data-gathering' };
      case 'question_answering':
        return { icon: <QuizIcon fontSize="inherit" />, className: 'node-badge-question-answering' };
      case 'action':
        return { icon: <BoltIcon fontSize="inherit" />, className: 'node-badge-action' };
      default:
        return null;
    }
  };

  const badge = isPython
    ? { text: 'PY', className: 'node-badge-python' }
    : getBadge(data.type);

  // Extract simple list of items/data to show in body
  const renderBody = () => {
     if (isPython) return <div style={{opacity: 0.7}}>Python Script</div>;

     if (content.kind === 'menu' && content.items) {
         return (
             <ul style={{margin:0, paddingLeft: 15}}>
                 {content.items.map((it, i) => (
             <li key={i}>{it.title}</li>
                 ))}
             </ul>
         );
     }
     
     if (content.kind === 'question_answering' && content.questions) {
         return (
             <ul style={{margin:0, paddingLeft: 15}}>
                 {content.questions.map((q, i) => (
                     <li key={i} style={{marginBottom: 4}}>
                        <strong>Q:</strong> {q.question} <br/>
                        <span style={{opacity: 0.8}}>A: {q.answer}</span>
                     </li>
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
          {badge && (
            <span className={`node-badge ${badge.className}`}>
              {badge.text || badge.icon}
            </span>
          )}
        </div>
        <div className="node-body nowheel" style={{ maxHeight: '200px', overflowY: 'auto' }}>
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
const VisualEditor = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  theme, 
  onNodeClick, 
  onViewViewport, 
  defaultViewport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onRecordHistory
}) => {
  
  const handleNodesChange = useCallback(
    (changes) => {
        // Snapshot history for structural changes
        // Position changes are handled by DragStart interaction
        const significant = changes.some(c => c.type === 'remove' || c.type === 'add' || c.type === 'reset');
        if (significant && onRecordHistory) {
            onRecordHistory();
        }
        onNodesChange(applyNodeChanges(changes, nodes));
    },
    [nodes, onNodesChange, onRecordHistory]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
        const significant = changes.some(c => c.type === 'remove' || c.type === 'add');
        if (significant && onRecordHistory) {
            onRecordHistory();
        }
        onEdgesChange(applyEdgeChanges(changes, edges));
    },
    [edges, onEdgesChange, onRecordHistory]
  );
  
  const onNodeDragStart = useCallback(() => {
      if (onRecordHistory) onRecordHistory();
  }, [onRecordHistory]);

  const mode = theme?.mode || 'dark';
  const backgroundColor = theme?.bg || '#1e1e1e';
  const gridColor = mode === 'light' ? (theme?.text || '#24292f') : '#aaa';
  const edgeColor = mode === 'light' ? '#24292f' : '#e6edf3';

  const themedEdges = edges.map((edge) => ({
    ...edge,
    type: 'bezier',
    style: {
      ...edge.style,
      stroke: edgeColor
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeColor,
      width: 18,
      height: 18
    }
  }));

  return (
    <div
      className={`visual-editor ${mode}`}
      style={{ width: '100%', height: '100%', background: backgroundColor }}
    >
      <ReactFlow
        nodes={nodes}
        edges={themedEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={onNodeClick}
        onMoveEnd={onViewViewport}
        onNodeDragStart={onNodeDragStart}
        defaultViewport={defaultViewport}
        nodeTypes={nodeTypes}
        fitView={!defaultViewport}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={gridColor} gap={16} />
        <Controls />
        <Panel position="top-left" style={{ display: 'flex', gap: '8px' }}>
            <Tooltip title="Undo (Ctrl+Z)">
                <span>
                 <IconButton onClick={onUndo} disabled={!canUndo} size="small" sx={{ bgcolor: 'background.default', boxShadow: 1, '&:hover': { bgcolor: 'action.hover' }, color: 'text.primary' }}>
                    <UndoIcon fontSize="small" />
                 </IconButton>
                </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
                 <span>
                 <IconButton onClick={onRedo} disabled={!canRedo} size="small" sx={{ bgcolor: 'background.default', boxShadow: 1, '&:hover': { bgcolor: 'action.hover' }, color: 'text.primary' }}>
                    <RedoIcon fontSize="small" />
                 </IconButton>
                 </span>
            </Tooltip>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default VisualEditor;
