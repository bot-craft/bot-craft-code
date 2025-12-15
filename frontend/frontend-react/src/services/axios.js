import axios from 'axios';

const instance = axios.create({
  baseURL: `http://${process.env.REACT_APP_IP_ADDRESS}:7000`,
  withCredentials: true,  // Esto es crucial para enviar cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar las respuestas
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default instance;