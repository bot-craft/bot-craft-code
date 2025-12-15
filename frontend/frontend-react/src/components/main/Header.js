// components/main/Header.js

import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
// import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Header = ({ onToggleHomeButton, title, username, onAvatarClick }) => {
  return (
    <AppBar position="static" elevation={4}>
      <Toolbar>
        <IconButton 
          edge="start" 
          color="inherit" 
          aria-label="menu" 
          sx={{ mr: 2 }}
          onClick={onToggleHomeButton}
        >
          <HomeIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
          {title}
        </Typography>
        <Typography variant="subtitle1" sx={{ mr: 2 }}>
          {username}
        </Typography>
        <IconButton color="inherit" onClick={onAvatarClick}>
          <AccountCircleIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Header;