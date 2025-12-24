import axios from 'axios';

const API_URL = import.meta.env.VITE_LARAVEL_API_URL || 'http://beyondchatsbackend.test/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const articleService = {
  /**
   * Fetch all articles
   */
  async getAll() {
    const response = await api.get('/articles');
    return response.data.data;
  },

  /**
   * Fetch single article by ID
   */
  async getById(id) {
    const response = await api.get(`/articles/${id}`);
    return response.data.data;
  },
};

export default api;
