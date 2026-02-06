// src/utils/yamlHelper.js
import yaml from 'js-yaml';

// Helper to generate coordinates with offset for multiple files
const getLayout = (index, fileIndex = 0) => {
  // Spacing clusters by fileIndex
  const fileOffsetX = fileIndex * 600; 
  const fileOffsetY = 0; // Keep horizontal flow or grid? 
  // Let's grid modules within a file, and shift files horizontally
  return { 
      x: fileOffsetX + 50 + (index % 3) * 350, 
      y: fileOffsetY + 50 + Math.floor(index / 3) * 250 
  };
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
        else if (type === 'question_answering') className = 'node-data-gathering'; 

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
          position: getLayout(index, fileIndex),
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
                position: { 
                    x: getLayout(index, fileIndex).x + 250, 
                    y: getLayout(index, fileIndex).y + 50 
                },
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
