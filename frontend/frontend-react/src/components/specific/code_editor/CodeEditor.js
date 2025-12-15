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

  const editorDisposables = React.useRef([]);
  const yamlEditorRef = React.useRef(null);

  // Crear un ref para mantener los archivos actualizados
  const filesRef = React.useRef(files);
  
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

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectSlug}/files`);

      // console.log(`response.data:`);
      // console.log(response.data);
      // console.log(`response.status: ${response.status}`);
      // console.log(`response.headers.get('Content-Type'): ${response.headers.get('Content-Type')}`);

      const data = response.data;
      // console.log(`data:`);
      // console.log(data);
      setFiles(data);

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
    setOpenFiles(openFiles.filter(f => f.path !== filePath));
    if (activeFile === filePath) {
      setActiveFile(openFiles[0]?.path || null);
    }
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
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: currentTheme.border }}>
              <EditorTabs
                openFiles={openFiles}
                activeFile={activeFile}
                onFileSelect={setActiveFile}
                onFileClose={handleFileClose}
                theme={currentTheme} // Pasar tema (necesitará actualización en siguiente paso)
              />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            
            {activeFile && (
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
            )}
          </Box>
        </Panel>
      </PanelGroup>

      {/* Status Bar */}
      <StatusBar theme={currentTheme} /> 
      
      {/* AI Chat Panel */}
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
    </Box>
  );
};

export default CodeEditor;