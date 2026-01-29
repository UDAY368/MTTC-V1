import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const quizApi = axios.create({
  baseURL: `${API_URL}/api/public`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default quizApi;
