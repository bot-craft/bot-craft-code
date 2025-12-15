import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Menu, MenuItem, Dialog } from '@mui/material';
import Header from './Header';
import UserSettings from '../specific/users/UserSettings';
import MongoDBService from '../../services/MongoDBService';
import { capitalizeString } from '../generic/AuxFunctions';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [openSettings, setOpenSettings] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await MongoDBService.getCurrentUser();
        setUsername(userData.username);
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUser();
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    handleMenuClose();
    setOpenSettings(true);
  };

  const handleLogout = async () => {
    try {
      await MongoDBService.logout();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const getPageTitle = () => {
    const pathParts = location.pathname.split('/');
    const page = pathParts[1];
    const chatbotSlug = pathParts[2];

    const defaultTitle = `${chatbotSlug} - %`;

    switch (page) {

      case 'chat':
        return chatbotSlug ? defaultTitle.replace('%', capitalizeString(page)) : 'Chat';
      case 'editor':
        return chatbotSlug ? defaultTitle.replace('%', 'Code Editor') : 'Code Editor';
      case 'projects':
        return 'Projects';
      default:
        return '';
    }
  };

  const handleHomeClick = () => {
    navigate('/projects');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header 
        onToggleHomeButton={handleHomeClick} 
        title={getPageTitle()} 
        username={username}
        onAvatarClick={handleMenuOpen}
      />
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        <Outlet />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem disabled>{username}</MenuItem>
        <MenuItem onClick={handleSettings}>Settings</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>

      <Dialog 
        open={openSettings} 
        onClose={() => setOpenSettings(false)}
        maxWidth="sm"
        fullWidth
      >
        <UserSettings onClose={() => setOpenSettings(false)} />
      </Dialog>
    </Box>
  );
};

export default MainLayout;