import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MongoDBService from '../../../services/MongoDBService';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await MongoDBService.login(username, password);
      // Verificar que la sesión se ha establecido correctamente
      const userData = await MongoDBService.getCurrentUser();
      if (userData) {
        navigate('/projects');
      }
    } catch (err) {
      setError(err.response?.data?.error || `Login failed`);
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
          Welcome to Bot-Craft!
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
            Login
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

          <Button type="submit" variant="contained" fullWidth>
            Login
          </Button>

          <Typography variant="body2" sx={{ mt: 2 }}>
            Don't have an account? {' '}
            <Link href="/register" underline="hover">
              Register
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;