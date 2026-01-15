// components/specific/code_editor/chat/FileAttachmentDialog.js

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  List, 
  ListItem, 
  ListItemButton,
  ListItemIcon, 
  ListItemText, 
  Checkbox,
  Box,
  Typography,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const FileAttachmentDialog = ({ open, onClose, files, selectedFiles, onToggleFile, theme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [flatFiles, setFlatFiles] = useState([]);

  useEffect(() => {
    const flatten = (nodes) => {
      let result = [];
      if (!nodes) return result;
      
      nodes.forEach(node => {
        if (node.type === 'file') {
            // Ensure we construct the full path or use the path provided in the node
            // Assuming node.path is the relative path from project root
            result.push(node);
        } else if (node.type === 'directory' && node.children) {
          result = result.concat(flatten(node.children));
        }
      });
      return result;
    };
    
    setFlatFiles(flatten(files));
  }, [files]);

  const filteredFiles = flatFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (file.path && file.path.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      disableRestoreFocus
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.bg,
          color: theme.text,
          backgroundImage: 'none',
          border: `1px solid ${theme.border}`,
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: `1px solid ${theme.border}`, py: 1.5 }}>
        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600 }}>
            Attach Files
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '400px' }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.border}` }}>
            <TextField
                autoFocus
                fullWidth
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.iconColor }} fontSize="small" />
                    </InputAdornment>
                ),
                sx: {
                    color: theme.text,
                    bgcolor: theme.explorerBg,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.border
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.border
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#58a6ff'
                    }
                }
                }}
            />
        </Box>
        
        <List sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            bgcolor: theme.bg,
            py: 0
        }}>
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => {
              const isSelected = selectedFiles.includes(file.path);
              return (
                <ListItem 
                  key={file.path} 
                  disablePadding
                  sx={{ 
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                >
                  <ListItemButton 
                    onClick={() => onToggleFile(file.path)}
                    sx={{ 
                      '&:hover': { bgcolor: theme.hoverBg },
                      py: 1
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox 
                        edge="start"
                        checked={isSelected}
                        tabIndex={-1}
                        disableRipple
                        size="small"
                        sx={{ 
                          color: theme.iconColor,
                          p: 0,
                          '&.Mui-checked': { color: '#58a6ff' }
                        }}
                      />
                    </ListItemIcon>
                    <ListItemIcon sx={{ minWidth: 32, color: theme.iconColor }}>
                      <InsertDriveFileIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={file.name} 
                      secondary={file.path}
                      primaryTypographyProps={{ variant: 'body2', color: theme.text, noWrap: true }}
                      secondaryTypographyProps={{ variant: 'caption', color: theme.iconColor, noWrap: true, display: 'block' }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', color: theme.iconColor }}>
              <Typography variant="body2">No files found</Typography>
            </Box>
          )}
        </List>
      </DialogContent>
      <DialogActions sx={{ borderTop: `1px solid ${theme.border}`, p: 1.5 }}>
        <Button onClick={onClose} size="small" variant="contained" sx={{ textTransform: 'none', bgcolor: '#238636', '&:hover': { bgcolor: '#2ea043' } }}>
            Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileAttachmentDialog;
