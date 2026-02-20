import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, List, ListItem, ListItemIcon, ListItemText, Switch, IconButton, InputAdornment, Button, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
// import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileUploadIcon from '@mui/icons-material/FileUpload';
// import CodeIcon from '@mui/icons-material/Code';
import AddIcon from '@mui/icons-material/Add';
import ChatbotPowerSwitch from '../generic/ChatbotPowerSitch';

import MongoDBService from '../../services/MongoDBService';

import ChatBtn from '../generic/ChatBtn';
import CodeEditorBtn from '../generic/CodeEditorBtn';
import ChatbotService from '../../services/ChatbotService';

const API_URL = `http://${process.env.REACT_APP_IP_ADDRESS}:7000/api`;

const ProjectsSelection = ({ onChatbotSelect, onChatbotEdit, onChatbotDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chatbots, setChatbots] = useState([]);
  const [newChatbotName, setNewChatbotName] = useState('');
  const [showNewChatbotDialog, setShowNewChatbotDialog] = useState(false);
  const [chatbotToCopy, setChatbotToCopy] = useState(null);
  const [showCopyChatbotDialog, setShowCopyChatbotDialog] = useState(false);
  const [chatbotToRename, setChatbotToRename] = useState(null);
  const [showRenameChatbotDialog, setShowRenameChatbotDialog] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState(null);
  const [showDeleteChatbotDialog, setShowDeleteChatbotDialog] = useState(false);
  
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const fileInputRef = useRef(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // const response = await fetch(`${API_URL}/projects`);

      // const response = await fetch(`${API_URL}/list_projects`);

      const userInfo = await MongoDBService.getCurrentUser();
      // console.log(`current user: `);
      // console.log(userInfo.username);

      const response = await fetch(`${API_URL}/list_projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ current_user: userInfo.username }),
      });

      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      // console.log(`data: `);
      // console.log(data);
      setChatbots(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching projects:', err);
    }
  };

  const toggleChatbotActive = (slug) => {
    setChatbots(chatbots.map(bot =>
      bot.slug === slug ? { ...bot, active: !bot.active } : bot
    ));
  };

  // const toggleChatbotActive = async (slug) => {
  //   try {
  //     const response = await fetch(`${API_URL}/projects/${slug}/toggle`, {
  //       method: 'PUT',
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error || 'Failed to toggle project');
  //     }
      
  //     const updatedBot = await response.json();
  //     setChatbots(chatbots.map(bot =>
  //       bot.slug === slug ? updatedBot : bot
  //     ));
  //   } catch (err) {
  //     setError(err.message);
  //     console.error('Error toggling project:', err);
  //   }
  // };

  const createNewChatbot = async () => {
    try {
      if (!/^[a-zA-Z0-9-_]+$/.test(newChatbotName)) {
        throw new Error('The chatbot name can only contain letters, numbers, hyphens, and underscores.');
      }

      const userInfo = await MongoDBService.getCurrentUser();

      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            name: newChatbotName,
            current_user: userInfo.username
          }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }
      
      const newBot = await response.json();
      // setChatbots([...chatbots, newBot]);
      fetchProjects()
      setNewChatbotName('');
      setShowNewChatbotDialog(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error creating project:', err);
    }
  };
  
  const copyChatbot = async () => {
    try {
      if (!/^[a-zA-Z0-9-_]+$/.test(newChatbotName)) {
        throw new Error('The chatbot name can only contain letters, numbers, hyphens, and underscores.');
      }

      const userInfo = await MongoDBService.getCurrentUser();

      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            name: newChatbotName,
            current_user: userInfo.username,
            copy_from: chatbotToCopy.slug
          }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to copy project');
      }
      
      fetchProjects();
      setNewChatbotName('');
      setChatbotToCopy(null);
      setShowCopyChatbotDialog(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error copying project:', err);
    }
  };


  const renameChatbot = async () => {
    try {
      if (!/^[a-zA-Z0-9-_]+$/.test(newChatbotName)) {
        throw new Error('The chatbot name can only contain letters, numbers, hyphens, and underscores.');
      }

      const userInfo = await MongoDBService.getCurrentUser();

      const response = await fetch(`${API_URL}/projects/${chatbotToRename.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            name: newChatbotName,
            current_user: userInfo.username
          }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename project');
      }
      
      // const updatedBot = await response.json();
      // setChatbots(chatbots.map(bot =>
      //   bot.slug === chatbotToRename.slug ? updatedBot : bot
      // ));
      
      fetchProjects();
      setChatbotToRename(null);
      setNewChatbotName('');
      setShowRenameChatbotDialog(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error renaming project:', err);
    }
  };

  const deleteChatbot = async () => {
    // Powering off the chatbot first
    try {
      const response = await ChatbotService.powerChatbot(chatbotToDelete.slug, 'off', null);
      // console.log(`response: `);
      // console.log(response);
      // console.log(response.data.success === 1);
    } catch (error) {
      console.error(`Error powering off chatbot {${chatbotToDelete.slug}} before deletion: `, error);

      console.log("response: ");
    }

    const userInfo = await MongoDBService.getCurrentUser();

    try {
      const response = await fetch(`${API_URL}/projects/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            chatbot_to_delete: chatbotToDelete.slug,
            current_user: userInfo.username
          }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }
      
      setChatbots(chatbots.filter(bot => bot.slug !== chatbotToDelete.slug));
      setChatbotToDelete(null);
      setShowDeleteChatbotDialog(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error deleting project:', err);
    }
  };

  const downloadChatbot = async (slug) => {
    try {
      const response = await fetch(`${API_URL}/projects/${slug}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setError(err.message);
      console.error('Error downloading project:', err);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset input value to allow re-upload of same file if needed
    // event.target.value = null; // React handles this usually via controlled/uncontrolled. 
    // Since input is hidden and used imperatively, we should reset it manually if we want to support same file again.
    // However, event.target is read-only in some contexts? No, value is settable.

    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_URL}/projects/import/validate`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Validation failed');
        }

        setImportFile(file);
        setNewChatbotName(data.name);
        setShowImportDialog(true);
        setError(null);

    } catch (err) {
        setImportFile(null);
        setError(`Import error: ${err.message}`);
    }
    
    event.target.value = null;
  };

  const confirmImport = async () => {
     try {
        if (!/^[a-zA-Z0-9-_]+$/.test(newChatbotName)) {
           setError("Project name can only contain alphanumeric characters, hyphens, and underscores.");
           return;
        }

        const userInfo = await MongoDBService.getCurrentUser();
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('name', newChatbotName);
        formData.append('current_user', userInfo.username);

        const response = await fetch(`${API_URL}/projects/import`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Import failed');
        }
        
        setShowImportDialog(false);
        setImportFile(null);
        setNewChatbotName('');
        fetchProjects();
        
     } catch (err) {
        // Maybe keep dialog open?
        // But error shows on main screen.
        setError(err.message);
        console.error('Error importing project:', err);
     }
  };

  const filteredChatbots = chatbots.filter(bot =>
    bot.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Box sx={{ flexGrow: 1, mx: '20%', pt: 'clamp(0.5px,5%,20px)', pb: 1.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h4" sx={{ mb: 'clamp(0.5px,2%,20px)' }}>Projects</Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".zip" 
            onChange={handleFileChange}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'grey.200', borderRadius: 20, p: 0.5, mr: 1, mb: 'clamp(0.5px,10%,10px)', border: '1px solid', borderColor: "grey.300", '&:hover': { borderColor: "black" } }}>
          <Tooltip title="Import Chatbot">
            <IconButton size="small" onClick={handleImportClick}>
              <FileUploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="New Chatbot">
            <IconButton size="small" onClick={() => {
              setNewChatbotName('');
              setShowNewChatbotDialog(true);
            }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <SmartToyOutlinedIcon sx={{ ml: 0.5 }} />
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chatbots"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: { mb: 'clamp(0.5px,10%,10px)', borderRadius: 20, '& fieldset': { borderColor: 'grey.300' } }
          }}
          sx={{ mb: 'clamp(0.5px,1%,5px)' }}
        />
      </Box>
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        {filteredChatbots.length > 0 ? (
          <List>
            {filteredChatbots.map((bot, index) => (
              <ListItem
                key={index}
                sx={{
                  borderRadius: 20,
                  mb: 1,
                  '&:hover': { bgcolor: 'grey.100' },
                  border: '1px solid',
                  borderColor: "lightgrey"
                }}
              >
                <ListItemIcon>
                  {index + 1}.
                  <SmartToyOutlinedIcon />
                </ListItemIcon>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <Tooltip title="Rename Chatbot">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setChatbotToRename(bot);
                        setNewChatbotName(bot.name);
                        setShowRenameChatbotDialog(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <ListItemText primary={bot.name} />
                </Box>
                <Tooltip title={`Create a copy of ${bot.name}`}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setChatbotToCopy(bot);
                      setNewChatbotName(`Copy_of_${bot.name}`);
                      setShowCopyChatbotDialog(true);
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download Chatbot">
                  <IconButton
                    size="small"
                    onClick={() => downloadChatbot(bot.slug)}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <CodeEditorBtn chatbotSlug={bot.slug} />
                <ChatbotPowerSwitch 
                  bot={bot} 
                  onToggle={toggleChatbotActive} 
                />
                <ChatBtn projectSlug={bot.slug} />
                <Tooltip title="Delete Chatbot">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setChatbotToDelete(bot);
                      setShowDeleteChatbotDialog(true);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No chatbots have been found yet 🤖
            </Typography>
            <Typography color="text.secondary">
              To get started, the <AddIcon sx={{ verticalAlign: 'middle' }} fontSize="small" /> button can be clicked.
            </Typography>
          </Box>
        )}
      </Box>
      <Dialog
        open={showNewChatbotDialog}
        onClose={() => setShowNewChatbotDialog(false)}
      >
        <DialogTitle>
          Create New Chatbot
          <IconButton
            aria-label="close"
            onClick={() => setShowNewChatbotDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            X
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Chatbot Name"
            type="text"
            fullWidth
            variant="standard"
            value={newChatbotName}
            onChange={(e) => setNewChatbotName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setShowNewChatbotDialog(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={createNewChatbot}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
      >
        <DialogTitle>
          Title of Imported Chatbot
          <IconButton
            aria-label="close"
            onClick={() => setShowImportDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            X
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Title of Imported Chatbot"
            type="text"
            fullWidth
            variant="standard"
            value={newChatbotName}
            onChange={(e) => setNewChatbotName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setShowImportDialog(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={confirmImport}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={showCopyChatbotDialog}
        onClose={() => setShowCopyChatbotDialog(false)}
      >
        <DialogTitle>
          {chatbotToCopy ? `Copy Chatbot: ${chatbotToCopy.name}` : 'Copy Chatbot'}
          <IconButton
            aria-label="close"
            onClick={() => setShowCopyChatbotDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            X
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Chatbot Name"
            type="text"
            fullWidth
            variant="standard"
            value={newChatbotName}
            onChange={(e) => setNewChatbotName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setShowCopyChatbotDialog(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={copyChatbot}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={showRenameChatbotDialog}
        onClose={() => setShowRenameChatbotDialog(false)}
      >
        <DialogTitle>
          Rename Chatbot
          <IconButton
            aria-label="close"
            onClick={() => setShowRenameChatbotDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            X
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Chatbot Name"
            type="text"
            fullWidth
            variant="standard"
            value={newChatbotName}
            onChange={(e) => setNewChatbotName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setShowRenameChatbotDialog(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={renameChatbot}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={showDeleteChatbotDialog}
        onClose={() => setShowDeleteChatbotDialog(false)}
      >
        <DialogTitle>
          Delete Chatbot
          <IconButton
            aria-label="close"
            onClick={() => setShowDeleteChatbotDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            X
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure the "{chatbotToDelete?.name}" chatbot should be deleted?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setShowDeleteChatbotDialog(false)}>
            Cancel
          </Button>
          <Button color="error" onClick={deleteChatbot}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectsSelection;