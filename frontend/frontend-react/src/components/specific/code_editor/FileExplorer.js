// components/specific/code_editor/FileExplorer.js

import axios from '../../../services/axios';
// import React from 'react';
import React, { useState } from 'react';
// import { Box, Typography } from '@mui/material';
// import { Box, Typography, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { 
  Box, Typography, Menu, MenuItem, Dialog, 
  DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Select, FormControl, 
  InputLabel, IconButton
} from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
// import { ExpandMore, ChevronRight } from '@mui/icons-material';
import { ExpandMore, ChevronRight, MoreVert } from '@mui/icons-material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import ChatbotPowerSitch from '../../generic/ChatbotPowerSitch';
import { Close } from '@mui/icons-material';


const FileExplorer = ({
  files,
  onFileSelect,
  activeFile,
  projectSlug,
  onFileSystemChange,
  ChatBtn,
  theme, // Recibir prop theme

  moduleDialogOpen,
  setModuleDialogOpen,
  moduleName,
  setModuleName,
  moduleType,
  setModuleType,
  onCreateModule,

  selectedNode,
  setSelectedNode,
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  // const [selectedNode, setSelectedNode] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'new-file', 'new-folder', 'rename'
  const [dialogValue, setDialogValue] = useState('');
  
  // const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  // const [moduleType, setModuleType] = useState('');
  // const [moduleName, setModuleName] = useState('');

  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);

  let auxDraggedItem = null;
  // let auxDropTarget = null;

  // let drop_set = new Set();
  // let drop_list = [];
  // let drop_list_nodes = [];

  // Handler para iniciar el drag
  const handleDragStart = (e, node) => {

    // console.log("draggedItem:");
    // console.log(draggedItem);

    // console.log("auxDraggedItem:");
    // console.log(auxDraggedItem);

    if (auxDraggedItem !== null) return
    
    // if (node.path === ".") return;  // Evitar arrastrar nodo raíz
    // if (node.name == projectSlug) {
    //   console.log("=======ALERT=======")
    //   console.log(node)
    //   console.log("=======*****=======")
    // }
    // if (node.name === projectSlug) return;  // Evitar arrastrar nodo raíz
    
    auxDraggedItem = node;

    // console.log("node:");
    // console.log(node);
    
    e.dataTransfer.setData("text/plain", node.path);
    setDraggedItem(node);
    // console.log("=======*****=======")
  };

  // // Handler para hover durante el drag
  // const handleDragOver = (e, node) => {
  //   e.preventDefault();

  //   // if (node.type !== "directory" && node.path === draggedItem?.path) {
  //     if (node.type !== "directory") {
  //       return
  //     }
  //     // if (node.name === projectSlug) return
      
  //     // console.log("draggedItem:")
  //     // console.log(draggedItem);
  //     // if (node.type === "directory" && node.path !== draggedItem?.path) {
  //       //   setDropTarget(node);
  //       // }
        
  //     drop_list.push(node);
  //     // console.log([...drop_list].reverse());
  //     console.log(drop_list);
  //     console.log("auxDropTarget: ", auxDropTarget);

      

  //     // Fill candidates
  //     if (auxDropTarget === null) {
  //       // drop_set.add(node.name);
        
  //       // console.log(drop_set)
        
  //       let name_already_there = drop_list.slice(0, -1).some(item => item.name === node.name)

  //       console.log("name_already_there: ");
  //       console.log(name_already_there);
        
  //       if ( name_already_there && drop_list.length > 1 ) {
          
  //         // pillar el deepest
  //         console.log("Incoming", node.name)
  //         auxDropTarget = node.name
  //         drop_list = [];
  //         console.log("#################");
  //       }
        
  //     } else {
        
  //       if (drop_list.length >= 4 && !drop_list.includes(auxDropTarget)) {
          
  //         auxDropTarget = null
  //       }
  //     }
      
  //     // drop_list_nodes.push(node);
      
  //     // setDropTarget(node);
  // };
  

  const handleDragOver = (e, node) => {
    e.preventDefault();

    if (node.name === projectSlug) return;

    if (node.type === "directory" && node.path !== draggedItem?.path) {
      setDropTarget(node);
    }
  };

  // Handler para finalizar el drag
  const handleDrop = async (e) => {
    e.preventDefault();
    setShowMoveConfirm(true);
  };

  // Handler para confirmar el movimiento
  const confirmMove = async () => {
    if (!draggedItem || !dropTarget) return;

    try {
      const newPath = `${dropTarget.path}/${draggedItem.name}`;

      // console.log("newPath:");
      // console.log(newPath);
      
      // await axios.put(`/api/projects/${projectSlug}/files/${draggedItem.path}/rename`, {
        await axios.put(`/api/projects/${projectSlug}/files/rename`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          newPath: newPath,
          oldPath: draggedItem.path
         })
        // data: { newPath }
      });

      onFileSystemChange();
    } catch (error) {
      console.error("Error moving item:", error);
    }
    
    setShowMoveConfirm(false);
    setDraggedItem(null);
    setDropTarget(null);
    
    auxDraggedItem = null;
    // auxDropTarget = null;
  };

  // const handleCreateModule = async () => {
  //   if (!moduleName || !moduleType) return;
    
  //   try {

  //     let basePath = "";
  //     if (selectedNode) {
  //       if (selectedNode.type === "directory") {
  //         basePath = selectedNode.path;
  //       } else {
  //         // Si es un archivo, usar su directorio padre
  //         basePath = selectedNode.path.split("/").slice(0, -1).join("/");
  //       }
  //     }

  //     const response = await axios.post(`/api/projects/${projectSlug}/modules`, {
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         name: moduleName,
  //         type: moduleType,
  //         path: basePath
  //       })
  //     });

  //     onFileSystemChange();
  //     setModuleDialogOpen(false);
  //     setModuleName('');
  //     setModuleType('');
  //   } catch (error) {
  //     console.error('Error creating module:', error);
  //   }
  // };

  const handleContextMenu = (event, node) => {
    // console.log("node:");
    // console.log(node);
    
    setSelectedNode(node);
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });

    // console.log("selectedNode:");
    // console.log(selectedNode);

    // console.log("node:");
    // console.log(node);
  };

  const handleClose = () => {
    setContextMenu(null);
    // setSelectedNode(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogValue('');
    setDialogType('');
    setSelectedNode(null);
  };


  const handleCreateFile = async (name, type) => {

    // console.log(`projectSlug: ${projectSlug}`);

    try {
      // console.log("handleCreateFile -> selectedNode:");
      // console.log(selectedNode);

      let newPath;
      if (selectedNode) {
        if (selectedNode.type === 'directory') {
          newPath = `${selectedNode.path}/${name}`;
        } else {
          // Obtener directorio padre si es un archivo
          const parentDir = selectedNode.path.split('/').slice(0, -1).join('/');
          newPath = parentDir ? `${parentDir}/${name}` : name;
        }
      } else {
        newPath = name;
      }

      // const response = await axios.post(`/api/projects/${projectSlug}/files`, {
        const response = await axios.post(`/api/projects/${projectSlug}/files`, {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: newPath,
            type: type,
            content: ''
          })
        });
        
      // console.log("response:");
      // console.log(response);
      // console.log("response.body:");
      // console.log(response.body);

      onFileSystemChange();
      
    } catch (error) {
      console.error('Error:', error);
    }
    handleDialogClose();
  };


  const handleRename = async (newName) => {
    console.log("selectedNode:");
    console.log(selectedNode);
    if (!selectedNode) return;

    // const newPath = selectedNode.path.split('/').slice(0, -1).concat(newName).join('/');
    
    const parentPath = selectedNode.path.split('/').slice(0, -1).join('/');
    const newPath = parentPath ? `${parentPath}/${newName}` : newName;
    
    // console.log("newPath:");
    // console.log(newPath);

    try {
      // const response = await axios.put(`/api/projects/${projectSlug}/files/rename`, {
      await axios.put(`/api/projects/${projectSlug}/files/rename`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newPath: newPath,
          oldPath: selectedNode.path 
        })
        // data: { newPath }
      });

      onFileSystemChange();
    } catch (error) {
      console.error('Error:', error);
    }
    handleDialogClose();
  };

  // Modificar la función handleDelete para que muestre el diálogo de confirmación
  const handleDelete = async () => {
    if (!selectedNode) return;

    setConfirmDeleteDialogOpen(true);
  };

  // Añadir la función que maneja la confirmación de la eliminación
  const handleConfirmDelete = async () => {
    try {
      // const response = await axios.delete(`/api/projects/${projectSlug}/files/${selectedNode.path}/delete`, {
      await axios.delete(`/api/projects/${projectSlug}/files/${selectedNode.path}/delete`, {
        method: 'DELETE'
      });

      onFileSystemChange();
      setConfirmDeleteDialogOpen(false);
      handleClose();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDialogSubmit = () => {
    if (!dialogValue) return;

    switch (dialogType) {
      case 'new-file':
        handleCreateFile(dialogValue, 'file');
        break;
      case 'new-folder':
        handleCreateFile(dialogValue, 'directory');
        break;
      case 'rename':
        // console.log("dialogValue:");
        // console.log(dialogValue);

        // Missing selected Node
        handleRename(dialogValue);
        break;
      default:
        console.error(`handleDialogSubmit() -> ${dialogType} | Invalid dialog type`);
        break;
    }
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const fileTypes = {
      js: 'javascript',
      py: 'python',
      yml: 'yaml',
      yaml: 'yaml',
      json: 'json',
      md: 'markdown',
      txt: 'text'
    };
    return fileTypes[ext] || 'unknown';
  };

  const getFileIconColor = (filename) => {
    const type = getFileType(filename);
    const colorMap = {
      javascript: '#e8d252',
      python: '#519aba',
      yaml: '#6d8086',
      json: '#cbcb41',
      markdown: '#519aba',
      text: '#d4d4d4',
      unknown: '#d4d4d4'
    };
    return colorMap[type] || '#d4d4d4';
  };

  const renderTree = (node) => {
    const isDirectory = node.type === 'directory';
    const fileName = node.name;

    return (
      <TreeItem
        key={node.path}
        itemId={node.path}
        draggable
        onDragStart={(e) => handleDragStart(e, node)}
        onDragOver={(e) => handleDragOver(e, node)}
        onDrop={handleDrop}
        label={
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between', 
            py: 0.5,
            '&:hover': {
              bgcolor: theme.hoverBg // Usar tema
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isDirectory ? (
                <FolderIcon 
                  sx={{ 
                    mr: 1, 
                    color: '#dcb67a', // Mantener color carpeta
                    fontSize: '20px'
                  }} 
                />
              ) : (
                <InsertDriveFileIcon 
                  sx={{ 
                    mr: 1, 
                    color: getFileIconColor(fileName),
                    fontSize: '20px'
                  }} 
                />
              )}
              <Typography
                variant="body2"
                sx={{
                  fontSize: '13px',
                  color: activeFile === node.path ? theme.text : theme.iconColor, // Usar tema
                  fontWeight: activeFile === node.path ? 'bold' : 'normal',
                  fontFamily: "'SF Mono', Monaco, Menlo, Consolas, 'Ubuntu Mono', monospace"
                }}
              >
                {fileName}
              </Typography>
            </Box>
          </Box>
        }
        onClick={() => !isDirectory && onFileSelect(node.path)}
        sx={{
          '.MuiTreeItem-content': {
            p: 0.2,
            '&.Mui-selected': {
              bgcolor: theme.selectedBg // Usar tema
            }
          },
          ...(node.path === dropTarget?.path && {
            backgroundColor: theme.selectedBg,
            outline: "1px solid #2196f3"
          })
        }}
      >
        {Array.isArray(node.children)
          ? node.children.map((child) => renderTree(child))
          : null}
      </TreeItem>
    );
  };

  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'auto',
      bgcolor: theme.explorerBg, // Usar tema
      borderRight: 1,
      borderColor: theme.border // Usar tema
    }}>
      <Box sx={{ 
        p: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography
          variant="caption"
          sx={{
            color: theme.iconColor, // Usar tema
            textTransform: 'uppercase',
            fontSize: '11px',
            letterSpacing: '1px',
            pl: 2
          }}
        >
          {ChatBtn} Explorer
          <ChatbotPowerSitch 
            bot={{slug: projectSlug, name: projectSlug, active: true}}
            onToggle={x => x}
          />
        </Typography>
        <Button
          size="small"
          onClick={(e) => handleContextMenu(e, { path: '' })}
          sx={{ minWidth: 0, p: 0.5 }}
        >
          <MoreVert sx={{ fontSize: 18, color: theme.iconColor }} />
        </Button>
      </Box>

      <SimpleTreeView
        aria-label="file system navigator"
        expandicon={<ChevronRight sx={{ fontSize: 20, color: theme.iconColor }} />}
        collapseicon={<ExpandMore sx={{ fontSize: 20, color: theme.iconColor }} />}
        sx={{ 
          height: 'calc(100% - 40px)',
          color: theme.text, // Usar tema
          '.MuiTreeItem-group': {
            ml: 1.5
          },
          '.MuiTreeItem-content': {
            py: 0.2,
            '&:hover': {
              bgcolor: theme.hoverBg // Usar tema
            },
            '&.Mui-selected': {
              bgcolor: theme.selectedBg // Usar tema
            }
          }
        }}
      > 
        {files.map(file => renderTree(file))}
      </SimpleTreeView>
      
      <Menu
        open={Boolean(contextMenu)}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={() => {
            setDialogType('new-file');
            setDialogOpen(true);
            handleClose();
          }}
        >
          New File
        </MenuItem>
        <MenuItem
          onClick={() => {
            setModuleDialogOpen(true);
            handleClose();
          }}
        >
          New Module
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDialogType('new-folder');
            setDialogOpen(true);
            handleClose();
          }}
        >
          New Folder
        </MenuItem>
        {selectedNode && selectedNode.path && [
          <MenuItem
            key="rename"
            onClick={() => {
              setDialogType('rename');
              setDialogValue(selectedNode.name);
              setDialogOpen(true);
              handleClose();
            }}
            >
            Rename
          </MenuItem>,
          <MenuItem
            key="delete"
            onClick={handleDelete}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        ]}
      </Menu>

      {/* Añadir el diálogo de confirmación en el JSX */}
      <Dialog open={confirmDeleteDialogOpen} onClose={() => setConfirmDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{selectedNode?.name}"? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogType === 'new-file' ? 'New File' :
           dialogType === 'new-folder' ? 'New Folder' :
           'Rename'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={dialogType === 'new-folder' ? 'Folder Name' : 'File Name'}
            type="text"
            fullWidth
            value={dialogValue}
            onChange={(e) => setDialogValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDialogSubmit} variant="contained">
            {dialogType.startsWith('new') ? 'Create' : 'Rename'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={moduleDialogOpen} 
        onClose={() => setModuleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography>New Module</Typography>
          <IconButton onClick={() => setModuleDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Module Name"
            type="text"
            fullWidth
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            sx={{ mb: 2 }}
            // Deshabilitar el campo si viene de un quick fix
            disabled={selectedNode && selectedNode.fromQuickFix}
          />
          
          <FormControl fullWidth>
            <InputLabel>Module Type</InputLabel>
            <Select
              value={moduleType}
              label="Module Type"
              onChange={(e) => setModuleType(e.target.value)}
            >
              <MenuItem value="action">Action</MenuItem>
              <MenuItem value="data_gathering">Data Gathering</MenuItem>
              <MenuItem value="question_answering">Question Answering</MenuItem>
              <MenuItem value="menu">Menu</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setModuleDialogOpen(false)} 
            color="secondary"
          >
            Cancel
          </Button>
          <Button 
            onClick={onCreateModule} 
            // onClick={handleCreateModule} 
            // onClick={() => {
            //   const basePath = selectedNode?.path || '';
            //   onCreateModule(moduleName, moduleType, basePath);
            // }}
            variant="contained" 
            color="primary"
            disabled={!moduleName || !moduleType}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showMoveConfirm} onClose={() => setShowMoveConfirm(false)}>
        <DialogTitle>Confirm Move</DialogTitle>
        <DialogContent>
          <Typography>
            Move "{draggedItem?.name}" to "{dropTarget?.path}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMoveConfirm(false)}>Cancel</Button>
          <Button onClick={confirmMove} color="primary" variant="contained">
            Move
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default FileExplorer;