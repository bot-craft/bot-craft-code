// components/main/MainSidebar.js

import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
// import TextField from '@mui/material/TextField';

const MainSidebar = ({ isVisible, onPageChange, currentPage }) => {
  const pages = [
    { name: 'Projects', icon: FolderOutlinedIcon },
    { name: 'Chat', icon: ChatOutlinedIcon },
    { name: 'Code Editor', icon: CodeOutlinedIcon },
  ];

  return (
    <Box
      sx={{
        width: 280,
        flexShrink: 0,
        bgcolor: 'grey.100',
        display: isVisible ? 'flex' : 'none',
        flexDirection: 'column',
        height: '100%',
        boxShadow: 3,
        position: 'absolute',
        zIndex: 1200,
        left: 0,
        top: 64,
      }}
    >
      <List>
        {pages.map((page) => (
          <ListItemButton
            key={page.name}
            selected={currentPage === page.name}
            onClick={() => onPageChange(page.name)}
            sx={{
              borderRadius: '12px',
              m: 1,
              '&.Mui-selected': {
                bgcolor: 'grey.300',
              },
            }}
          >
            <ListItemIcon>
              <page.icon />
            </ListItemIcon>
            <ListItemText primary={page.name} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

export default MainSidebar;