import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithCache } from './offlineCache';

// URL for Android Emulator (10.0.2.2) vs iOS Simulator (localhost) vs Physical Device (Your IP)
// If you are running on a physical device, change this to your computer's LAN IP (e.g., http://192.168.1.5:8000)
const DEV_API_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api'
    : 'http://localhost:8000/api';

const api = axios.create({
    baseURL: DEV_API_URL,
    timeout: 60000, // Increased to 60s for AI generation
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, user_id, name, is_profile_complete } = response.data;
        await AsyncStorage.setItem('userToken', access_token);
        await AsyncStorage.setItem('userId', String(user_id));
        await AsyncStorage.setItem('userName', name);
        await AsyncStorage.setItem('isProfileComplete', String(is_profile_complete));
        return response.data;
    } catch (error) {
        console.error('Login Error:', error.response?.data || error.message);
        throw error;
    }
};

export const register = async (userData) => {
    try {
        const response = await api.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        console.error('Register Error:', error.response?.data || error.message);
        throw error;
    }
};

export const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userName');
};

export const getRestaurants = async () => {
    return fetchWithCache('restaurants', async () => {
        const response = await api.get('/restaurants/');
        return response.data;
    });
};

export const getDishes = async () => {
    return fetchWithCache('dishes_all', async () => {
        const response = await api.get('/dishes/');
        return response.data;
    });
};

export const getDishDetails = async (dishId) => {
    try {
        const response = await api.get(`/dishes/${dishId}`);
        return response.data;
    } catch (error) {
        console.error('Get Dish Details Error:', error);
        throw error;
    }
};

export const getUserProfile = async () => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) throw new Error("No user logged in");
        
        const response = await api.get(`/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Get User Profile Error:', error);
        throw error;
    }
};

export const updateUserProfile = async (data) => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) throw new Error("No user logged in");
        const response = await api.put(`/users/${userId}`, data);
        return response.data;
    } catch (error) {
        console.error('Update User Profile Error:', error);
        throw error;
    }
};

export const searchDishes = async (query = '', skip = 0, limit = 50) => {
    try {
        const params = { skip, limit };
        if (query) params.search = query;
        const response = await api.get('/dishes/', { params });
        return response.data;
    } catch (error) {
        console.error('Search Dishes Error:', error);
        throw error;
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        console.error('Forgot Password Error:', error);
        throw error;
    }
};

// ====== FAVORITES ======
export const getFavorites = async () => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return [];
        const response = await api.get(`/favorites/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Get Favorites Error:', error);
        return [];
    }
};

export const addFavorite = async (dishId) => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) throw new Error("No user logged in");
        const response = await api.post(`/favorites/${userId}/${dishId}`);
        return response.data;
    } catch (error) {
        console.error('Add Favorite Error:', error);
        throw error;
    }
};

export const removeFavorite = async (dishId) => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) throw new Error("No user logged in");
        const response = await api.delete(`/favorites/${userId}/${dishId}`);
        return response.data;
    } catch (error) {
        console.error('Remove Favorite Error:', error);
        throw error;
    }
};

export const checkFavorite = async (dishId) => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return false;
        const response = await api.get(`/favorites/${userId}/check/${dishId}`);
        return response.data.is_favorite;
    } catch (error) {
        return false;
    }
};

// ====== REVIEWS ======
export const getDishReviews = async (dishId) => {
    try {
        const response = await api.get(`/reviews/dish/${dishId}`);
        return response.data;
    } catch (error) {
        console.error('Get Reviews Error:', error);
        return [];
    }
};

export const createReview = async (dishId, rating, comment = '') => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) throw new Error("No user logged in");
        const response = await api.post('/reviews/', {
            user_id: parseInt(userId),
            dish_id: dishId,
            rating,
            comment
        });
        return response.data;
    } catch (error) {
        console.error('Create Review Error:', error);
        throw error;
    }
};

// ====== CHAT HISTORY ======
export const getChatHistory = async () => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return [];
        const response = await api.get(`/chat/history/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Get Chat History Error:', error);
        return [];
    }
};

export const clearChatHistory = async () => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;
        await api.delete(`/chat/history/${userId}`);
    } catch (error) {
        console.error('Clear Chat History Error:', error);
    }
};

// ====== FILTERED DISHES ======
export const getFilteredDishes = async (filters = {}) => {
    try {
        const params = {};
        if (filters.search) params.search = filters.search;
        if (filters.cuisine_type) params.cuisine_type = filters.cuisine_type;
        if (filters.price_min != null) params.price_min = filters.price_min;
        if (filters.price_max != null) params.price_max = filters.price_max;
        if (filters.is_regional != null) params.is_regional = filters.is_regional;
        if (filters.min_rating != null) params.min_rating = filters.min_rating;
        const response = await api.get('/dishes/', { params });
        return response.data;
    } catch (error) {
        console.error('Get Filtered Dishes Error:', error);
        return [];
    }
};

// Punto de entrada de recomendaciones (rule-based o ML según backend)
export const getRecommendations = async (category = null) => {
    const cacheKey = `recommendations_${category || 'all'}`;
    return fetchWithCache(cacheKey, async () => {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return getDishes();

        let url = `/recommendations/${userId}`;
        if (category && category !== 'Recomendado') {
            url += `?category=${encodeURIComponent(category)}`;
        }

        const response = await api.get(url);
        return response.data;
    });
};

export const getChatResponse = async (message, history = []) => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        const response = await api.post('/chat/', {
            message,
            history,
            user_id: userId ? parseInt(userId) : null
        });
        return {
            text: response.data.response,
            sender: 'bot'
        };
    } catch (error) {
        console.error('Chat Error:', error);
        throw error;
    }
};

export const getEnrichedDishDetails = async (dishId) => {
    try {
        const response = await api.get(`/dishes/${dishId}/enrich`);
        return response.data;
    } catch (error) {
        console.error('Get Enriched Dish Details Error:', error);
        throw error;
    }
};

export const getItinerary = async (days = 1) => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
            console.warn("getItinerary: No userId found in AsyncStorage");
            throw new Error("No user logged in");
        }

        console.log(`Requesting itinerary for user ${userId}, days: ${days}`);
        const response = await api.post(`/itinerary/generate/${userId}`, { days });
        console.log("Itinerary response:", response.status);
        return response.data;
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Get Itinerary Error Data:', error.response.data);
            console.error('Get Itinerary Error Status:', error.response.status);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Get Itinerary Error: No response received', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Get Itinerary Error Message:', error.message);
        }
        throw error;
    }
};

export default api;
