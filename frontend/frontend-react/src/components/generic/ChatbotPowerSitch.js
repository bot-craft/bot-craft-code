import React, { useState, useEffect } from 'react';
import { Switch, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton, CircularProgress, Box } from '@mui/material';
import { Close } from '@mui/icons-material';
import MongoDBService from '../../services/MongoDBService';
import axios from '../../services/axios';
import ChatbotService from '../../services/ChatbotService';

const ChatbotPowerSwitch = ({ bot, onToggle }) => {
  const [isOn, setIsOn] = useState(bot.active);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showStartingDialog, setShowStartingDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        setIsLoading(true);
        const status = await ChatbotService.checkChatbotStatus(bot.slug);
        setIsOn(status === 'on' ? true : false);
      } catch (error) {
        console.error('Error checking initial chatbot status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialStatus();
  }, [bot.slug]);

  const controlChatbotPower = async (chatbotSlug, powerState, api_key) => {
    try {
      const response = await ChatbotService.powerChatbot(chatbotSlug, powerState, api_key);
      
      if (response.data.success === 0) {
        setErrorMessage(response.data.debug_msg || 'An error occurred while controlling the chatbot.');
        setShowErrorDialog(true);
      }

      return response.data.success === 1;
    } catch (error) {
      console.error(`Error turning ${powerState} chatbot:`, error);
      throw error;
    }
  };

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newPowerState = isOn ? 'off' : 'on';

      if (newPowerState === 'off') {
        // Apagar sin animación
        await MongoDBService.markConversationsDead(bot.slug);
        
        const userData = await MongoDBService.getCurrentUser();
        const api_key = userData?.api_key;

        const powerControlSuccess = await controlChatbotPower(bot.slug, newPowerState, api_key);

        if (powerControlSuccess) {
          onToggle(bot.slug);
          setIsOn(false);
        }
        setIsLoading(false);
      } else {
        // Encender con animación
        const userData = await MongoDBService.getCurrentUser();
        const api_key = userData?.api_key;

        if (!api_key || api_key.trim() === '') {
          setErrorMessage('Cannot turn on chatbot: API key is missing or invalid.');
          setShowErrorDialog(true);
          setIsLoading(false);
          return;
        }
        
        setShowStartingDialog(true);
      }
    } catch (error) {
      console.error('Error toggling chatbot:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setShowErrorDialog(true);
      setIsLoading(false);
    }
  };

  const confirmStartChatbot = async () => {
    setShowStartingDialog(false);
    setIsStarting(true);
    setIsLoading(false);

    try {
      const userData = await MongoDBService.getCurrentUser();
      const api_key = userData?.api_key;

      const isValidKey = await ChatbotService.checkAPIKey(api_key);
      
      if (!isValidKey) {
        setErrorMessage('Cannot turn on chatbot: API key is invalid.');
        setShowErrorDialog(true);
        setIsStarting(false);
        return;
      }

      const powerControlSuccess = await controlChatbotPower(bot.slug, 'on', api_key);

      if (powerControlSuccess) {
        onToggle(bot.slug);
        setIsOn(true);
        
        // Simular un pequeño delay para mostrar el progreso antes de cambiar a ON
        setTimeout(() => {
          setIsStarting(false);
        }, 1500);
      } else {
        setIsStarting(false);
      }
    } catch (error) {
      console.error('Error starting chatbot:', error);
      setErrorMessage('An unexpected error occurred while starting the chatbot.');
      setShowErrorDialog(true);
      setIsStarting(false);
    }
  };

  const cancelStartChatbot = () => {
    setShowStartingDialog(false);
    setIsLoading(false);
  };

  return (
    <>
      {isStarting ? (
        <Tooltip title="Chatbot is starting...">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 58, height: 38 }}>
            <CircularProgress size={20} />
          </Box>
        </Tooltip>
      ) : (
        <Tooltip title={isOn ? 'Turn Off Chatbot' : 'Turn On Chatbot'}>
          <Switch
            checked={isOn}
            onChange={handleToggle}
            disabled={isLoading}
            size="small"
          />
        </Tooltip>
      )}

      {/* Confirm Starting Chatbot Dialog */}
      <Dialog open={showStartingDialog} onClose={cancelStartChatbot}>
        <DialogTitle>
          Start Chatbot
          <IconButton
            aria-label="close"
            onClick={cancelStartChatbot}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>
            The chatbot will start in the background. You can continue using the application while it starts.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={cancelStartChatbot}>
            Cancel
          </Button>
          <Button color="primary" onClick={confirmStartChatbot} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onClose={() => setShowErrorDialog(false)}>
        <DialogTitle>
          Error
          <IconButton
            aria-label="close"
            onClick={() => setShowErrorDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography color="error">{errorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={() => setShowErrorDialog(false)}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatbotPowerSwitch;