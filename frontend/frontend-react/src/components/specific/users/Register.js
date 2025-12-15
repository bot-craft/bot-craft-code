import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MongoDBService from '../../../services/MongoDBService';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [apiKey, setApiKey] = useState(''); {/* API Key disabled */}
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await MongoDBService.register(username, password, apiKey);
      navigate('/login');
    } catch (err) {
      // setError(err.response?.data?.error || 'Registration failed');
      setError(`Registration failed: ${err.error}`);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
    }}>
      <Box sx={{ width: '100%', py: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold', 
            textAlign: 'center',
            background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.light} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '2.5rem', md: '3.5rem' },
          }}
        >
          Welcome to Bot-Craft Registration!
        </Typography>
      </Box>
      
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            maxWidth: 400,
            width: '100%',
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            boxShadow: 5,
            mx: 2
          }}
        >
          <Typography variant="h5" component="h2">
            Register
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
            required
          />

          <TextField
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <TextField
            fullWidth
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />

          <Button type="submit" variant="contained" fullWidth>
            Register
          </Button>

          <Typography variant="body2" sx={{ mt: 2 }}>
            Already have an account? {' '}
            <Link href="/login" underline="hover">
              Login
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;