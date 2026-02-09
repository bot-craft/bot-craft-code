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
  const rowHeight = 160;

  levelGroups.forEach((group, groupIndex) => {
    group.forEach((node, index) => {
      node.position = {
        x: paddingX + groupIndex * columnWidth,
        y: paddingY + index * rowHeight
      };
    });
  });

  const placedPython = new Set();
  edges.forEach((edge) => {
    const target = nodeMap.get(edge.target);
    const source = nodeMap.get(edge.source);
    if (!target || !source) return;
    if (target.data?.type !== 'python-script') return;
    if (placedPython.has(target.id)) return;
    target.position = {
      x: source.position.x + 260,
      y: source.position.y + 10
    };
    placedPython.add(target.id);
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
  
  // Track python scripts globally to avoid duplicates across files
  const scriptNodes = new Set();
  
  filesData.forEach((file, fileIndex) => {
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
             // Fallback for flat structure without modules key?
             modules = [parsed];
         }
      }

      modules = modules.filter(m => m && m.name);

      modules.forEach((mod, index) => {
        // 1. Create Module Node
        const nodeId = mod.name;
        const type = mod.kind || 'default';
        
        let className = 'node-default';
        if (type === 'menu') className = 'node-menu';
        else if (type === 'sequence') className = 'node-sequence';
        else if (type === 'action') className = 'node-action';
        else if (type === 'data_gathering') className = 'node-data-gathering';
        else if (type === 'question_answering') className = 'node-question-answering'; 

        // Check if node already exists (global uniqueness assumption)
        // If duplicates exist, we might overwrite or skip. Taskyto assumes unique names.
        // We'll skip adding if ID exists to prevent reacting flow errors.
        if (nodes.find(n => n.id === nodeId)) {
            console.warn(`Duplicate module name found: ${nodeId}`);
            return;
        }

        nodes.push({
          id: nodeId,
          type: 'custom',
          position: { x: 0, y: 0 },
          data: { 
            label: mod.name,
            type: type,
            content: mod
          },
          className: `node-${type.replace('_', '-')}`
        });

        // 2. Create Edges
        if (type === 'menu' && mod.items) {
          mod.items.forEach((item, i) => {
            if (item.kind === 'module' && item.reference) {
               edges.push({
                 id: `e-${nodeId}-${item.reference}-${i}`,
                 source: nodeId,
                 target: item.reference,
                 label: item.title?.substring(0, 10) + '...',
                 animated: true
               });
            } else if (item.kind === 'sequence' && item.references) {
               if (item.references.length > 0) {
                 const firstRef = item.references[0];
                 edges.push({
                   id: `e-${nodeId}-${firstRef}-seq-start-${i}`,
                   source: nodeId,
                   target: firstRef,
                   label: '(seq start)',
                   animated: true,
                   style: { stroke: '#6f42c1' }
                 });

                 for (let j = 0; j < item.references.length - 1; j++) {
                   const src = item.references[j];
                   const tgt = item.references[j+1];
                   edges.push({
                     id: `e-${src}-${tgt}-seq-${i}-${j}`,
                     source: src,
                     target: tgt,
                     label: 'next',
                     type: 'step',
                     style: { stroke: '#6f42c1', strokeDasharray: 5 }
                   });
                 }
               }
            }
          });
        }

        if (type === 'sequence' && mod.references) {
            if (mod.references.length > 0) {
               const first = mod.references[0];
               edges.push({
                 id: `e-${nodeId}-${first}-seqroot`,
                 source: nodeId,
                 target: first,
                 label: 'starts',
                 style: { stroke: '#6f42c1' }
               });
               for (let j = 0; j < mod.references.length - 1; j++) {
                 const src = mod.references[j];
                 const tgt = mod.references[j+1];
                 edges.push({
                   id: `e-${src}-${tgt}-seqmod-${nodeId}-${j}`, 
                   source: src,
                   target: tgt,
                   label: 'next',
                   style: { stroke: '#6f42c1', strokeDasharray: 5 }
                 });
               }
            }
        }

        let scriptName = null;
        if (mod['on-success']?.execute?.code) {
          scriptName = mod['on-success'].execute.code;
        } else if (mod.execute?.code) {
          scriptName = mod.execute.code;
        }

        if (scriptName && !scriptName.includes('\n') && scriptName.trim().endsWith('.py')) {
            const pyId = scriptName.trim();
            if (!scriptNodes.has(pyId)) {
              scriptNodes.add(pyId);
              // Position Python Node relative to current file cluster or node?
              // Simple: Near the first usage found.
              nodes.push({
                id: pyId,
                type: 'custom',
                position: { x: 0, y: 0 },
                data: { 
                  label: pyId,
                  type: 'python-script',
                  content: { kind: 'python', name: pyId }
                },
                className: 'node-python'
              });
            }

            edges.push({
              id: `e-${nodeId}-${pyId}-code`,
              source: nodeId,
              target: pyId,
              style: { stroke: '#343a40' },
              label: 'exec'
            });
        }
      });
  });

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
