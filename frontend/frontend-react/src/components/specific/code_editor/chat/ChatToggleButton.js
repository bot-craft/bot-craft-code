import React from 'react';
import { IconButton, Tooltip, Badge } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy'; // Usar icono más estilo GitHub Copilot

const ChatToggleButton = ({ onClick, isOpen, unreadCount = 0 }) => {
  return (
    <Tooltip title={isOpen ? "Close Taskyto Assistant" : "Open Taskyto Assistant"}>
      <IconButton
        onClick={onClick}
        sx={{ 
          color: isOpen ? '#58a6ff' : '#c9d1d9', // GitHub blue when active
          '&:hover': {
            backgroundColor: 'rgba(56, 139, 253, 0.15)' // GitHub style hover
          }
        }}
      >
        <Badge badgeContent={unreadCount} color="error" invisible={unreadCount === 0}>
          <SmartToyIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default ChatToggleButton;