import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Snackbar, Alert } from '@mui/material';
import MongoDBService from '../../../services/MongoDBService';

const UserSettings = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await MongoDBService.getCurrentUser();
        setUsername(userData.username);
        setApiKey(userData.api_key);
      } catch (err) {
        setError('Error loading user data');
      }
    };
    loadUserData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await MongoDBService.updateUserSettings(username, password, apiKey);
      setSuccess(true);
      if (onClose) setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settings');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 3,
        maxWidth: 400,
        mx: 'auto'
      }}
    >
      <Typography variant="h6" component="h2">
        User Settings
      </Typography>
      
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      <TextField
        fullWidth
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <TextField
        fullWidth
        type="password"
        label="New Password (optional)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {password && (
        <TextField
          fullWidth
          type="password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      )}

      <TextField
        fullWidth
        label="API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />

      <Button type="submit" variant="contained" color="primary">
        Confirm Changes
      </Button>

      <Snackbar
        open={success}
        autoHideDuration={2000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success">Settings updated successfully!</Alert>
      </Snackbar>
    </Box>
  );
};

export default UserSettings;