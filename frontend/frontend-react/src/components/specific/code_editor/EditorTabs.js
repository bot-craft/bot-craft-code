// components/specific/code_editor/EditorTabs.js

import React from 'react';
import { Box, Tab, Tabs, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const EditorTabs = ({ openFiles, activeFile, onFileSelect, onFileClose, theme }) => {
  return (
    <Box sx={{ 
      bgcolor: theme.tabBg,
      borderBottom: 1,
      borderColor: theme.border
    }}>
      <Tabs
        value={activeFile}
        onChange={(e, newValue) => onFileSelect(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: '35px',
          '.MuiTab-root': {
            minHeight: '35px',
            fontSize: '13px',
            color: theme.iconColor,
            textTransform: 'none',
            '&.Mui-selected': {
              color: theme.text,
              bgcolor: theme.bg
            }
          }
        }}
      >
        {openFiles.map((file) => (
          <Tab
            key={file.path}
            value={file.path}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {file.path.split('/').pop()}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClose(file.path);
                  }}
                  component="span"
                  sx={{ 
                    ml: 1, 
                    p: 0.2,
                    color: theme.iconColor,
                    '&:hover': {
                      bgcolor: theme.hoverBg,
                      color: theme.text
                    }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            }
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default EditorTabs;