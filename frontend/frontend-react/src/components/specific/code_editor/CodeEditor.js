// components/specific/code_editor/CodeEditor.js

import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
import axios from '../../../services/axios';
import { Box } from '@mui/material';
import Editor from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import FileExplorer from './FileExplorer';
import EditorTabs from './EditorTabs';
import StatusBar from './StatusBar';

import ChatBtn from '../../generic/ChatBtn';
import ChatToggleButton from './chat/ChatToggleButton';
import EditorChat from './chat/EditorChat';
import ThemeToggleButton from './ThemeToggleButton'; // Importar nuevo componente

import { configureYamlEditor } from './yamlEditorConfig';
import VisualEditor from './VisualEditor';
import { yamlToNodes, nodesToYaml } from '../../../utils/yamlHelper';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import EditIcon from '@mui/icons-material/Edit';
import { IconButton, Tooltip } from '@mui/material';

// Definición de temas
const themes = {
  dark: {
    mode: 'dark',
    bg: '#1e1e1e',
    text: '#d4d4d4',
    border: '#363636',
    explorerBg: '#252526',
    tabBg: '#2d2d2d',
    monacoTheme: 'vs-dark',
    chatBg: '#0d1117',
    chatHeader: '#161b22',
    chatBorder: '#30363d',
    iconColor: '#969696',
    hoverBg: 'rgba(255, 255, 255, 0.04)',
    selectedBg: 'rgba(255, 255, 255, 0.08)',
    chatMessageColor: '#d4d4d4', // Color estándar claro para fondo oscuro
    codeBg: '#161b22' // Fondo para bloques de código en chat
  },
  light: {
    mode: 'light',
    bg: '#ffffff',
    text: '#24292f',
    border: '#e1e4e8',
    explorerBg: '#f6f8fa',
    tabBg: '#ffffff',
    monacoTheme: 'light',
    chatBg: '#ffffff',
    chatHeader: '#f6f8fa',
    chatBorder: '#d0d7de',
    iconColor: '#57606a',
    hoverBg: 'rgba(0, 0, 0, 0.04)',
    selectedBg: 'rgba(0, 0, 0, 0.08)',
    chatMessageColor: '#0451a5', // Azul oscuro (VS Code Light YAML Value Color)
    codeBg: '#f6f8fa' // Fondo para bloques de código en chat
  }
};

const CodeEditor = ({ projectSlug }) => {
  const [files, setFiles] = useState([]);
  // const [files, setFiles] = useState(filesExample);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  // const [editorLayout, setEditorLayout] = useState({
  //   explorer: 20, // width percentage
  //   editors: 80,
  // });

  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [moduleType, setModuleType] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [editorContext, setEditorContext] = useState(null);
  
  // Estado para el tema (por defecto oscuro)
  const [isDarkMode, setIsDarkMode] = useState(true);
  const currentTheme = isDarkMode ? themes.dark : themes.light;

  // Visual Editor State
  const [isVisualMode, setIsVisualMode] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  // History State
  const [history, setHistory] = useState({ past: [], future: [] });

  const isYaml = activeFile && (activeFile.endsWith('.yaml') || activeFile.endsWith('.yml'));

  // Utility to find all yaml files in the file tree
  const getAllYamlFiles = (filesList) => {
    let yamls = [];
    filesList.forEach(file => {
      if (file.type === 'directory' && file.children) {
        yamls = [...yamls, ...getAllYamlFiles(file.children)];
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        yamls.push(file);
      }
    });
    return yamls;
  };

  const handleToggleVisualMode = async () => {
    // Switch logic
    if (!isVisualMode) {
      // CODE -> VISUAL: Gather all YAML content
      const allYamlFiles = getAllYamlFiles(files);
      
      const filesWithContent = await Promise.all(allYamlFiles.map(async (f) => {
          // Check if open first
          const openFile = openFiles.find(of => of.path === f.path);
          if (openFile) return { path: f.path, content: openFile.content };
          
          // Fetch if not open
          const content = await fetchFileContent(f.path);
          return { path: f.path, content: content };
      }));

      const { nodes: newNodes, edges: newEdges } = yamlToNodes(filesWithContent);

      // --- Load Layout ---
      try {
        const layoutRes = await axios.get(`/api/projects/${projectSlug}/files/.bot-craft/visual-layout.json/get`);
        if (layoutRes.data && layoutRes.data.content) {
             const layout = JSON.parse(layoutRes.data.content);
             
             if (layout.viewport) {
                 visualViewportRef.current = layout.viewport;
             }
             
             if (layout.nodes) {
                 const posMap = new Map(layout.nodes.map(n => [n.id, n.position]));
                 newNodes.forEach(n => {
                     if (posMap.has(n.id)) {
                         n.position = posMap.get(n.id);
                     }
                 });
             }
        }
      } catch (e) {
         // No stored layout, use defaults
         visualViewportRef.current = null;
      }
      // -------------------

      setNodes(newNodes);
      setEdges(newEdges);
      
      setIsVisualMode(true);
    } else {
      // VISUAL -> CODE
      // Disable auto-sync for MVP as requested to avoid conflicts
      // const yamlContent = nodesToYaml(nodes, edges);
      // handleContentChange(yamlContent, activeFile);
      
      setIsVisualMode(false);
    }
  };

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
        // Here we could trigger auto-save if we wanted real-time sync
        return nds; 
    });
    // However, reactflow helper applyNodeChanges needs to be called in VisualEditor or here.
    // We pass the raw handler to VisualEditor which calls applyNodeChanges, so we should just update state?
    // VisualEditor code: onNodesChange(applyNodeChanges(changes, nodes))
    // So VisualEditor expects us to set state.
    // Correction: VisualEditor uses: onNodesChange={handleNodesChange} where handleNodesChange calls setNodes(apply...)
    // Wait, my VisualEditor implementation accepts `onNodesChange` and calls it with RESULT of applyNodeChanges?
    // Let's check VisualEditor.js: 
    // const handleNodesChange = (changes) => onNodesChange(applyNodeChanges(changes, nodes));
    // So yes, `onNodesChange` prop here should take the NEW nodes list.
  }, []);

  // Debounced save for layout
  const debouncedSaveLayout = useCallback(
    debounce(async (currentNodes, currentViewport) => {
        const layoutData = {
            viewport: currentViewport,
            nodes: currentNodes.map(n => ({ id: n.id, position: n.position }))
        };
        const folderPath = '.bot-craft';
        const fileName = 'visual-layout.json';
        const fullPath = `${folderPath}/${fileName}`;
        const contentStr = JSON.stringify(layoutData, null, 2);
        
        try {
            // Try to update file directly
            await axios.put(`/api/projects/${projectSlug}/files/${fullPath}/update`, {
                body: JSON.stringify({ content: contentStr })
            });
        } catch(e) {
            // If failed, it might not exist.
            // Create folder first just in case?
            // The create_file endpoint handles parent creation for files: full_path.parent.mkdir(parents=True, exist_ok=True)
            // So we can just try creating the file.
            try {
             await axios.post(`/api/projects/${projectSlug}/files`, {
                body: JSON.stringify({
                    path: fullPath,
                    type: 'file',
                    content: contentStr
                })
             });
            } catch (err) { console.error("Failed to save layout:", err); }
        }
    }, 1000), [projectSlug]);

  // We need distinct handlers for the VisualEditor prop
  const handleNodesChangeState = useCallback((newNodes) => {
      setNodes(newNodes);
      debouncedSaveLayout(newNodes, visualViewportRef.current); 
  }, [debouncedSaveLayout]); 

  const handleViewportChange = useCallback((event, viewport) => {
      if (viewport) {
          visualViewportRef.current = viewport;
          debouncedSaveLayout(nodesRef.current, viewport);
      }
  }, [debouncedSaveLayout]);

  const handleEdgesChangeState = useCallback((newEdges) => {
      setEdges(newEdges);
      // Optional: Debounce save
  }, []); 

  // --- History Management ---
  const handleRecordHistory = useCallback(() => {
    setHistory(curr => {
        const newPast = [...curr.past, { nodes, edges }];
        // Limit history size to 50
        if (newPast.length > 50) newPast.shift();
        return {
            past: newPast,
            future: []
        };
    });
  }, [nodes, edges]);

  const handleUndo = useCallback(() => {
    setHistory(curr => {
        if (curr.past.length === 0) return curr;
        const previous = curr.past[curr.past.length - 1];
        const newPast = curr.past.slice(0, -1);
        
        setNodes(previous.nodes);
        setEdges(previous.edges);
        
        // Save layout after undo
        debouncedSaveLayout(previous.nodes, visualViewportRef.current);
        
        return {
            past: newPast,
            future: [{ nodes, edges }, ...curr.future]
        };
    });
  }, [nodes, edges, debouncedSaveLayout]);

  const handleRedo = useCallback(() => {
    setHistory(curr => {
        if (curr.future.length === 0) return curr;
        const next = curr.future[0];
        const newFuture = curr.future.slice(1);
        
        setNodes(next.nodes);
        setEdges(next.edges);
        
        // Save layout after redo
        debouncedSaveLayout(next.nodes, visualViewportRef.current);
        
        return {
            past: [...curr.past, { nodes, edges }],
            future: newFuture
        };
    });
  }, [nodes, edges, debouncedSaveLayout]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    if (!isVisualMode) return;
    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
             e.preventDefault();
             handleUndo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { 
             e.preventDefault();
             handleRedo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisualMode, handleUndo, handleRedo]);
  // --------------------------

  const editorDisposables = React.useRef([]);
  const yamlEditorRef = React.useRef(null);
  
  // Refs for Visual Editor persistence
  const visualViewportRef = React.useRef({ x: 0, y: 0, zoom: 1 });
  const nodesRef = React.useRef(nodes);

  // Update nodesRef when nodes change
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Crear un ref para mantener los archivos actualizados
  const filesRef = React.useRef(files);

  // Solución eficiente para el error "ResizeObserver loop completed with undelivered notifications"
  // Este error es benigno y ocurre comúnmente al combinar react-resizable-panels con Monaco Editor
  useEffect(() => {
    const handleError = (e) => {
      // Filtramos específicamente el error de ResizeObserver
      if (
        e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
        e.message === 'ResizeObserver loop limit exceeded'
      ) {
        // Detenemos la propagación para que no llegue a la consola o overlays de error
        const resizeObserverErrDiv = document.getElementById(
          'webpack-dev-server-client-overlay-div'
        );
        const resizeObserverErr = document.getElementById(
          'webpack-dev-server-client-overlay'
        );
        if (resizeObserverErr) {
          resizeObserverErr.setAttribute('style', 'display: none');
        }
        if (resizeObserverErrDiv) {
          resizeObserverErrDiv.setAttribute('style', 'display: none');
        }
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  // Actualizar el ref cuando files cambie y forzar revalidación
  useEffect(() => {
    filesRef.current = files;
    // Forzar actualización del DOM para que el MutationObserver lo detecte
    filesRef.current = [...filesRef.current];
    // Actualizar validaciones si el editor YAML está configurado
    if (yamlEditorRef.current?.updateValidation) {
      yamlEditorRef.current.updateValidation();
    }
  }, [files]);

  const filterHiddenFiles = (items) => {
    if (!items) return [];
    return items.filter(item => item.name !== '.bot-craft' && item.name !== '.layout.json').map(item => ({
        ...item,
        children: item.children ? filterHiddenFiles(item.children) : undefined
    }));
  };

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectSlug}/files`);
      const data = response.data;
      const filtered = filterHiddenFiles(data);
      setFiles(filtered);
    } catch (error) {
      console.error(`Error in (fetchFiles): ${error}`);
    }
  };
  
  const handleCreateModule = async () => {
    if (!moduleName || !moduleType) return;
    
    try {
        let basePath = "";
        if (selectedNode) {
            if (selectedNode.type === "directory") {
                basePath = selectedNode.path;
            } else {
                // Si es un archivo, usar su directorio padre
                basePath = selectedNode.path.split("/").slice(0, -1).join("/");
            }
        }

        await axios.post(`/api/projects/${projectSlug}/modules`, {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: moduleName,
                type: moduleType,
                path: basePath
            })
        });

        // Actualizar la vista del explorador de archivos
        fetchFiles();
        
        // Limpiar el estado
        setModuleDialogOpen(false);
        setModuleName('');
        setModuleType('');
        setSelectedNode(null);
    } catch (error) {
        console.error('Error creating module:', error);
    }
};

  // Monaco editor instance reference
  const editorRef = React.useRef(null);

  useEffect(() => {
    // console.log(`projectSlug (useEffect): ${projectSlug}`);
    if (projectSlug) {
      fetchFiles();
      
      // const fetchFilesAux = fetchFiles;

      // fetchFilesAux();

      // console.log("activeFile:");
      // console.log(activeFile);
    }
  }, [projectSlug]);
  // }, [projectSlug, activeFile]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      yamlEditorRef.current = null;
      editorDisposables.current.forEach(d => d.dispose());
      editorDisposables.current = [];
    };
  }, []);

  // Efecto para actualizar el tema de Monaco cuando cambia el estado
  useEffect(() => {
    if (window.monaco && window.monaco.editor) {
      window.monaco.editor.setTheme(currentTheme.monacoTheme);
    }
  }, [isDarkMode, currentTheme.monacoTheme]);

  const handleEditorDidMount = (editor, monaco) => { // Añadimos monaco como argumento si es necesario
    editorRef.current = editor;
    // Configurar el tema y opciones del editor
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 21,
      fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
      minimap: {
        enabled: true
      },
      scrollBeyondLastLine: true,
      renderLineHighlight: 'all',
      occurrencesHighlight: true,
      tabSize: 2,
      wordWrap: 'on',
      theme: currentTheme.monacoTheme, // Usar tema dinámico
    });

  };

  // const handleCreateModule = async (name, type, path) => {
  //   try {
  //     await axios.post(`/api/projects/${projectSlug}/modules`, {
  //       name,
  //       type,
  //       path
  //     });
  //     fetchFiles();
  //   } catch (error) {
  //     console.error('Error creating module:', error);
  //   }
  // };

  const fetchFileContent = async (filePath) => {
    try {
      const response = await axios.get(`/api/projects/${projectSlug}/files/${filePath}/get`);
      // const response = await fetch(`/api/projects/${projectSlug}/files/${filePath}`);
      // if (response.ok) {
      //   const { content } = await response.json();
      //   return content;
      // }
      // return '';

      const { content } = await response.data;
      return content;

    } catch (error) {
      console.error('Error fetching file content:', error);
      return '';
    }
  };

  const handleFileOpen = async (filePath) => {
    // Ensure we are in Code Mode when opening a file
    if (isVisualMode) {
        setIsVisualMode(false);
    }

    if (!openFiles.find(f => f.path === filePath)) {
      const content = await fetchFileContent(filePath);
      const newFile = {
        path: filePath,
        content, // Aquí cargarías el contenido real del archivo
        language: getLanguageFromPath(filePath),
      };
      setOpenFiles([...openFiles, newFile]);
    }
    setActiveFile(filePath);
  };

  const handleFileClose = (filePath) => {
    const newOpenFiles = openFiles.filter(f => f.path !== filePath);
    setOpenFiles(newOpenFiles);
    
    if (activeFile === filePath) {
      // Switch to the last opened file or null if no files remain
      const nextFile = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null;
      setActiveFile(nextFile ? nextFile.path : null);
    }
  };

  const handleCloseAllFiles = () => {
    setOpenFiles([]);
    setActiveFile(null);
  };

  const debouncedSave = useCallback(
    debounce(async (value, path) => {
      setOpenFiles(openFiles.map(f =>
        f.path === path ? { ...f, content: value } : f
      ));

      try {
        // console.log("value:");
        // console.log(value);
        // console.log("path:");
        // console.log(path);
        const response = await axios.put(`/api/projects/${projectSlug}/files/${path}/update`, {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: value })
        });
        // console.log("data", response.data);
      } catch (error) {
        console.error('Error:', error);
      }
    }, 1000),
    [openFiles, projectSlug]
  );

  const handleContentChange = useCallback((value, path) => {
    if (!debouncedSave) {
      console.warn('Debounced save not initialized');
      return;
    }

    debouncedSave(value, path);
  }, [debouncedSave]);

  // -------------------------

  function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }


  const getLanguageFromPath = (path) => {
    const ext = path.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'py': 'python',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'css': 'css',
      'html': 'html',
    };
    return languageMap[ext] || 'plaintext';
  };

  // Chat toggle handler
  const toggleChat = () => {
    setChatOpen(prev => !prev);
    if (!chatOpen) {
      setUnreadMessages(0);
    }
  };
  
  const handleNewMessage = () => {
    if (!chatOpen) {
      setUnreadMessages(prev => prev + 1);
    }
  };

  // Actualizar el contexto del editor cuando cambia el archivo activo
  useEffect(() => {
    if (activeFile) {
      setEditorContext({
        projectSlug,
        path: activeFile.path,
        content: activeFile.content,
        files: files
      });
    }
  }, [activeFile, files, projectSlug]);

  // Agregar esta nueva función para actualizar archivos abiertos
  const handleUpdateOpenFile = useCallback((filePath, newContent) => {
    setOpenFiles(prevFiles => 
      prevFiles.map(file => 
        file.path === filePath 
          ? { ...file, content: newContent }
          : file
      )
    );
  }, []);

  const handleNodeClick = useCallback((event, node) => {
      if (node.data?.filePath) {
          handleFileOpen(node.data.filePath);
          setIsVisualMode(false);
      }
  }, [handleFileOpen]);

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: currentTheme.bg, // Usar tema
      color: currentTheme.text, // Usar tema
      position: 'relative'
    }}>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={10}>
          <FileExplorer
            files={files}
            onFileSelect={handleFileOpen}
            activeFile={activeFile}
            projectSlug={projectSlug}
            onFileSystemChange={fetchFiles}
            ChatBtn={<ChatBtn projectSlug={projectSlug}/>}

            moduleDialogOpen={moduleDialogOpen}
            setModuleDialogOpen={setModuleDialogOpen}
            moduleName={moduleName}
            setModuleName={setModuleName}
            moduleType={moduleType}
            setModuleType={setModuleType}
            onCreateModule={handleCreateModule}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            onCloseAllFiles={handleCloseAllFiles}
            isVisualMode={isVisualMode}
            theme={currentTheme} // Pasar tema
          />
        </Panel>
        
        <PanelResizeHandle 
          style={{
            width: '4px',
            background: currentTheme.border, // Usar tema
            cursor: 'col-resize'
          }}
        />
        
        <Panel defaultSize={80}>
          <PanelGroup direction="horizontal">
            <Panel minSize={30}>
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: currentTheme.border, overflow: 'hidden' }}>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    {!isVisualMode && (
                      <EditorTabs
                        openFiles={openFiles}
                        activeFile={activeFile}
                        onFileSelect={setActiveFile}
                        onFileClose={handleFileClose}
                        theme={currentTheme} // Pasar tema (necesitará actualización en siguiente paso)
                      />
                    )}
                    {isVisualMode && (
                        <Box sx={{ p: 1, px: 2, fontWeight: 'bold', color: currentTheme.text }}>
                             Visual Architecture Map (Global View)
                        </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, px: 1 }}>
                    <Tooltip title={isVisualMode ? "Switch to Code" : "Switch to Visual"}>
                      <IconButton onClick={handleToggleVisualMode} size="small" sx={{ color: currentTheme.iconColor, mr: 1 }}>
                        {isVisualMode ? <EditIcon /> : <AccountTreeIcon />}
                      </IconButton>
                    </Tooltip>
                    <ThemeToggleButton 
                      isDarkMode={isDarkMode} 
                      onToggle={() => setIsDarkMode(!isDarkMode)} 
                    />
                    <ChatToggleButton 
                      onClick={toggleChat} 
                      isOpen={chatOpen}
                      unreadCount={unreadMessages}
                    />
                  </Box>
                </Box>
                
                {/* Content Area */}
                {/* Visual Mode: Show Graph | Code Mode: Show Editor only if activeFile */}
                {isVisualMode ? (
                   <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
                      <VisualEditor 
                        nodes={nodes} 
                        edges={edges} 
                        onNodesChange={handleNodesChangeState} 
                        onEdgesChange={handleEdgesChangeState} 
                        onNodeClick={handleNodeClick}
                        theme={currentTheme}
                        onViewViewport={handleViewportChange}
                        defaultViewport={visualViewportRef.current || undefined}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={history.past.length > 0}
                        canRedo={history.future.length > 0}
                        onRecordHistory={handleRecordHistory}
                      />
                   </Box>
                ) : (
                  activeFile && (
                  <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
                    <Editor
                      height="100%"
                      defaultLanguage={getLanguageFromPath(activeFile)}
                      path={activeFile}
                      value={openFiles.find(f => f.path === activeFile)?.content || ''}
                      theme={currentTheme.monacoTheme} // Usar tema dinámico
                      options={{
                        readOnly: false,
                        minimap: { enabled: true },
                      }}
                      onChange={(value) => handleContentChange(value, activeFile)}
                      onMount={handleEditorDidMount}
                      beforeMount={(monaco) => {
                        if (getLanguageFromPath(activeFile) === 'yaml') {
                          // Cleanup previous disposables
                          editorDisposables.current.forEach(d => {
                            try {
                              d.dispose();
                            } catch (e) {
                              console.warn('Error disposing editor resource:', e);
                            }
                          });
                          editorDisposables.current = [];

                          const disposable = configureYamlEditor(monaco, projectSlug, filesRef, {
                              setModuleDialogOpen,
                              setModuleName,
                              setModuleType,
                              setSelectedNode, // Añadir esta función
                              handleCreateModule
                          });

                          // Guardar la referencia al editor YAML
                          yamlEditorRef.current = disposable;
                          editorDisposables.current.push(disposable);
                        }
                      }}
                    />
                  </Box>
                  )
                )}
              </Box>
            </Panel>

            <PanelResizeHandle 
              style={{
                width: '4px',
                background: currentTheme.border, // Usar tema
                cursor: 'col-resize',
                display: chatOpen ? 'block' : 'none'
              }}
            />
            <Panel 
              defaultSize={35} 
              minSize={20} 
              maxSize={50}
              style={{ display: chatOpen ? 'block' : 'none' }}
            >
              <EditorChat 
                isOpen={chatOpen} 
                onClose={() => setChatOpen(false)} 
                projectSlug={projectSlug}
                editorContent={openFiles.find(f => f.path === activeFile)?.content || ''}
                files={files}
                onFileSystemChange={fetchFiles}
                onUpdateOpenFile={handleUpdateOpenFile}
                openFiles={openFiles}
                theme={currentTheme} // Pasar tema
                isDarkMode={isDarkMode}
                onToggleTheme={() => setIsDarkMode(!isDarkMode)}
              />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>

      {/* Status Bar */}
      <StatusBar theme={currentTheme} /> 
      
    </Box>
      
  );
};

export default CodeEditor;