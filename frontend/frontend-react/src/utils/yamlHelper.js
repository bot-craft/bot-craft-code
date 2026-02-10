// src/utils/yamlHelper.js
import yaml from 'js-yaml';

// Layout nodes left-to-right, top-to-bottom based on edge depth
const applyLayout = (nodes, edges) => {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map();
  const adjacency = new Map();
  const parents = new Map();

  nodes.forEach((node) => {
    incoming.set(node.id, 0);
    adjacency.set(node.id, []);
    parents.set(node.id, []);
  });

  edges.forEach((edge) => {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) return;
    adjacency.get(edge.source).push(edge.target);
    parents.get(edge.target).push(edge.source);
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
  });

  const orderIndex = new Map(nodes.map((node, index) => [node.id, index]));
  const roots = nodes
    .filter((node) => (incoming.get(node.id) || 0) === 0)
    .sort((a, b) => orderIndex.get(a.id) - orderIndex.get(b.id));

  const queue = [...roots];
  const level = new Map(roots.map((node) => [node.id, 0]));
  const inDegree = new Map(incoming);

  while (queue.length) {
    const current = queue.shift();
    const baseLevel = level.get(current.id) || 0;
    adjacency.get(current.id).forEach((targetId) => {
      const nextLevel = baseLevel + 1;
      const existingLevel = level.get(targetId);
      if (existingLevel === undefined || nextLevel > existingLevel) {
        level.set(targetId, nextLevel);
      }
      inDegree.set(targetId, (inDegree.get(targetId) || 0) - 1);
      if ((inDegree.get(targetId) || 0) === 0) {
        queue.push(nodeMap.get(targetId));
      }
    });
  }

  nodes.forEach((node) => {
    if (!level.has(node.id)) level.set(node.id, 0);
  });

  const levelGroups = new Map();
  nodes.forEach((node) => {
    const group = level.get(node.id);
    if (!levelGroups.has(group)) levelGroups.set(group, []);
    levelGroups.get(group).push(node);
  });

  levelGroups.forEach((group) => {
    group.sort((a, b) => orderIndex.get(a.id) - orderIndex.get(b.id));
  });

  const maxLevel = Math.max(0, ...levelGroups.keys());
  const levelOrder = new Map();
  if (levelGroups.has(0)) {
    levelGroups.get(0).forEach((node, index) => {
      levelOrder.set(node.id, index);
    });
  }

  for (let depth = 1; depth <= maxLevel; depth += 1) {
    const group = levelGroups.get(depth);
    if (!group) continue;
    group.sort((a, b) => {
      const parentsA = parents.get(a.id) || [];
      const parentsB = parents.get(b.id) || [];
      const avgA = parentsA.length
        ? parentsA.reduce((acc, id) => acc + (levelOrder.get(id) ?? 0), 0) / parentsA.length
        : 0;
      const avgB = parentsB.length
        ? parentsB.reduce((acc, id) => acc + (levelOrder.get(id) ?? 0), 0) / parentsB.length
        : 0;
      if (avgA !== avgB) return avgA - avgB;
      return orderIndex.get(a.id) - orderIndex.get(b.id);
    });

    group.forEach((node, index) => {
      levelOrder.set(node.id, index);
    });
  }

  const paddingX = 60;
  const paddingY = 60;
  const columnWidth = 360;
  const verticalGap = 40;

  // Helper to estimate height based on content to prevent overlaps
  const getNodeHeight = (node) => {
      const content = node.data?.content || {};
      const type = node.data?.type;
      
      // Python scripts are usually small
      if (type === 'python-script') {
        return 80;
      }
      
      // Base height for Header + Padding
      let h = 80; 
      
      // Generic List Rendering Calculation
      // We check for common array properties that are rendered as lists
      
      // 1. Items (Menu options, lists)
      if (Array.isArray(content.items) && content.items.length > 0) {
          content.items.forEach(it => {
              const text = it.title || (typeof it === 'string' ? it : '');
              const textLen = text.length;
              // Wrapped text estimation: ~30 chars per line
              const lines = Math.max(1, Math.ceil(textLen / 30));
              h += (lines * 22) + 8; // Height per line + gap
          });
      } 
      // 1b. Questions (Question Answering)
      else if (content.kind === 'question_answering' && Array.isArray(content.questions)) {
           content.questions.forEach(q => {
               const qText = q.question || '';
               const aText = q.answer || ''; // Answer might be number or string
               // Estimate lines for Question and Answer
               const qLines = Math.max(1, Math.ceil(qText.toString().length / 30));
               const aLines = Math.max(1, Math.ceil(aText.toString().length / 30));
               
               h += (qLines * 22) + (aLines * 22) + 12; // Gap between QA pairs
           });
      }
      // 2. Data (Attributes, keys)
      // Note: In VisualEditor, data is rendered with smaller font (fontSize: 10)
      else if (Array.isArray(content.data) && content.data.length > 0) {
          content.data.forEach(d => {
             let text = '';
             if (typeof d === 'object' && d !== null) {
                 text = Object.keys(d)[0] || '';
             } else if (typeof d === 'string') {
                 text = d;
             }
             
             const textLen = text.length;
             // Smaller font allows more chars, approx 45 per line
             const lines = Math.max(1, Math.ceil(textLen / 45));
             h += (lines * 16) + 4; 
          });
      }
      // 3. Fallback generic content
      else {
          h += 40; 
      }
      
      // Cap the height to prevent extremely tall nodes
      // Corresponding visual component has scrolling enabled for large content
      return Math.min(h, 250);
  };

  levelGroups.forEach((group, groupIndex) => {
    let currentY = paddingY;

    group.forEach((node) => {
      node.position = {
        x: paddingX + groupIndex * columnWidth,
        y: currentY
      };
      
      const height = getNodeHeight(node);
      currentY += height + verticalGap;
    });
  });
};

// Parse YAML to Nodes and Edges
// Now accepts array of { path, content } to handle full project
export const yamlToNodes = (inputData) => {
  // Normalize input: if string, wrap in array (backward compat), else use array
  let filesData = [];
  if (typeof inputData === 'string') {
      filesData = [{ path: 'temp', content: inputData }];
  } else if (Array.isArray(inputData)) {
      filesData = inputData;
  } else {
      return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];
  
  // Phase 1: Collect all raw modules from all files into a Map
  // Store all definitions. For reference resolution, we default to the first matching name.
  const moduleDefs = new Map();

  filesData.forEach((file) => {
      const { content: yamlString, path } = file;
      if (!yamlString) return;

      let parsed;
      try {
        parsed = yaml.load(yamlString);
      } catch (e) {
        console.error(`YAML Parse Error in ${path}`, e);
        return;
      }

      let modules = [];
      if (parsed?.modules && Array.isArray(parsed.modules)) {
        modules = parsed.modules;
      } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
         if(parsed.kind) {
             modules = [parsed];
         } else {
             modules = [parsed];
         }
      }

      modules = modules.filter(m => m && m.name);
      
      modules.forEach(m => {
          moduleDefs.set(m.name, m);
      });
  });

  // Phase 2: Create Primary Instances for all definitions
  const nodeUsage = new Map(); // NodeID -> usageCount
  
  Array.from(moduleDefs.values()).forEach((mod) => {
      const type = mod.kind || 'default';
      const nodeId = mod.name; // Initial ID is just the name

      nodes.push({
          id: nodeId,
          type: 'custom',
          position: { x: 0, y: 0 },
          data: { 
            label: mod.name,
            type: type,
            content: mod,
            depth: 0 
          },
          className: `node-${type.replace('_', '-')}`
      });
      nodeUsage.set(nodeId, 0);
  });

  // Phase 3: Breadth-First Expansion (Queue-based)
  // Iterate through nodes array (which grows) to resolve references and clone if needed.
  
  const MAX_NODES = 500; 

  for (let i = 0; i < nodes.length; i++) {
        if (nodes.length > MAX_NODES) {
            console.warn('Max nodes limit reached, graph might contain cycles. Stopping expansion.');
            break;
        }

        const currentNode = nodes[i];
        const sourceId = currentNode.id;
        const mod = currentNode.data.content;
        const currentDepth = currentNode.data.depth || 0;
        
        // Stop expanding if too deep (cycle protection)
        if (currentDepth > 20) continue;

        const type = mod.kind;

        // Function to get or create a target node
        const getTargetNodeId = (targetName) => {
            if (!moduleDefs.has(targetName)) return targetName; // External or missing ref
            
            // Check if Primary Node (ID == name) is unused
            if (nodeUsage.has(targetName) && nodeUsage.get(targetName) === 0) {
                nodeUsage.set(targetName, 1);
                return targetName;
            }
            
            // Primary used, Create CLONE
            // We suffix with unique index
            const cloneCount = nodes.filter(n => n.data.label === targetName).length;
            const newId = `${targetName}__copy${cloneCount}`;
            const targetMod = moduleDefs.get(targetName);
            const targetType = targetMod.kind || 'default';
            
            const newNode = {
                id: newId,
                type: 'custom',
                position: { x: 0, y: 0 },
                data: {
                    label: targetName,
                    type: targetType,
                    content: targetMod,
                    depth: currentDepth + 1
                },
                className: `node-${targetType.replace('_', '-')}`
            };
            
            nodes.push(newNode);
            nodeUsage.set(newId, 1);

            return newId;
        };

        // 2. Create Edges logic (adapted for Reference Resolving)
        if (type === 'menu' && mod.items) {
          mod.items.forEach((item, idx) => {
            if (item.kind === 'module' && item.reference) {
               const targetId = getTargetNodeId(item.reference);
               edges.push({
                 id: `e-${sourceId}-${targetId}-${idx}`,
                 source: sourceId,
                 target: targetId,
                 label: item.title?.substring(0, 10) + '...',
                 animated: true
               });
            } else if (item.kind === 'sequence' && item.references) {
               if (item.references.length > 0) {
                 const firstRef = item.references[0];
                 const firstTargetId = getTargetNodeId(firstRef);

                 edges.push({
                   id: `e-${sourceId}-${firstTargetId}-seq-start-${idx}`,
                   source: sourceId,
                   target: firstTargetId,
                   label: '(seq start)',
                   animated: true,
                   style: { stroke: '#6f42c1' }
                 });

                 // Link the sequence chain
                 let prevId = firstTargetId;
                 for (let j = 0; j < item.references.length - 1; j++) {
                   const nextName = item.references[j+1];
                   const nextId = getTargetNodeId(nextName); 
                   
                   edges.push({
                     id: `e-${prevId}-${nextId}-seq-${idx}-${j}`,
                     source: prevId,
                     target: nextId,
                     label: 'next',
                     type: 'step',
                     style: { stroke: '#6f42c1', strokeDasharray: 5 }
                   });
                   prevId = nextId;
                 }
               }
            }
          });
        }

        if (type === 'sequence' && mod.references) {
            if (mod.references.length > 0) {
               const firstRef = mod.references[0];
               const firstTargetId = getTargetNodeId(firstRef);

               edges.push({
                 id: `e-${sourceId}-${firstTargetId}-seqroot`,
                 source: sourceId,
                 target: firstTargetId,
                 label: 'starts',
                 style: { stroke: '#6f42c1' }
               });
               
               let prevId = firstTargetId;
               for (let j = 0; j < mod.references.length - 1; j++) {
                 const nextName = mod.references[j+1];
                 const nextId = getTargetNodeId(nextName);

                 edges.push({
                   id: `e-${prevId}-${nextId}-seqmod-${sourceId}-${j}`, 
                   source: prevId,
                   target: nextId,
                   label: 'next',
                   style: { stroke: '#6f42c1', strokeDasharray: 5 }
                 });
                 prevId = nextId;
               }
            }
        }

        // Python Scripts handling
        let scriptName = null;
        if (mod['on-success']?.execute?.code) {
          scriptName = mod['on-success'].execute.code;
        } else if (mod.execute?.code) {
          scriptName = mod.execute.code;
        }

        if (scriptName && !scriptName.includes('\n') && scriptName.trim().endsWith('.py')) {
            const pyName = scriptName.trim();
            // Clone scripts too for visual fidelity
            const pyId = `${pyName}_${sourceId}`; 
            
            nodes.push({
                id: pyId,
                type: 'custom',
                position: { x: 0, y: 0 },
                data: { 
                  label: pyName,
                  type: 'python-script',
                  content: { kind: 'python', name: pyName }
                },
                className: 'node-python'
            });

            edges.push({
              id: `e-${sourceId}-${pyId}-code`,
              source: sourceId,
              target: pyId,
              style: { stroke: '#343a40' },
              label: 'exec'
            });
        }
  }

  // Remove totally unused primary nodes to clean up roots?
  // Only remove if they are not potentially real start nodes.
  // But hard to know. User can manually delete them or we leave them.
  // The user didn't ask to hide unused roots, so leaving them is safer.

  applyLayout(nodes, edges);
  return { nodes, edges };
};

// Nodes to YAML (Basic Implementation)
export const nodesToYaml = (nodes, edges) => {
  // Extract the original data content from nodes.
  // Note: Reconstructing edges changes into the YAML is advanced. 
  // For MVP, we serialize the nodes' data back to modules list.
  
  const modules = nodes
    .filter(n => n.data.type !== 'python-script') // Filter out the script nodes we added
    .map(n => {
       // Deep Clone to avoid mutating state
       // Logic to update references based on Edges should go here if full sync required
       return n.data.content; 
    });

  // If originally single module, keep format? 
  // For safety, generally return "modules: [...]" list as that is standard Taskyto top_level
  return yaml.dump({ modules: modules });
};
