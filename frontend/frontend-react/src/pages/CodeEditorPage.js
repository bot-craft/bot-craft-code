// pages/CodeEditorPage.js

import React from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import CodeEditor from '../components/specific/code_editor/CodeEditor';

const CodeEditorPage = () => {
  let { chatbotSlug } = useParams();

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <CodeEditor projectSlug={chatbotSlug} />
    </Box>
  );
}

export default CodeEditorPage;