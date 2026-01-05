import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    try {
        const response = await api.get('/restaurants/');
        return response.data;
    } catch (error) {
        console.error('Get Restaurants Error:', error);
        throw error;
    }
};

export const getDishes = async () => {
    try {
        const response = await api.get('/dishes/');
        return response.data;
    } catch (error) {
        console.error('Get Dishes Error:', error);
        throw error;
    }
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

// Placeholder for future ML endpoints
export const getRecommendations = async (category = null) => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return getDishes(); // Fallback if no user logged in

        let url = `/recommendations/${userId}`;
        if (category && category !== 'Recomendado') {
            url += `?category=${encodeURIComponent(category)}`;
        }

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Get Recommendations Error:', error);
        // Fallback to all dishes if recommendation fails
        return getDishes();
    }
};

export const getChatResponse = async (message, history = []) => {
    try {
        const response = await api.post('/chat/', { message, history });
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
