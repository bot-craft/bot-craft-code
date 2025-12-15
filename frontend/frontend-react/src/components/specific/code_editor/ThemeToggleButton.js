import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Sol
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Luna

const ThemeToggleButton = ({ isDarkMode, onToggle }) => {
  return (
    <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
      <IconButton
        onClick={onToggle}
        sx={{ 
          color: isDarkMode ? '#c9d1d9' : '#57606a',
          '&:hover': {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }
        }}
      >
        {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;