import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function setCache(key, data) {
    try {
        const item = {
            data,
            timestamp: Date.now(),
        };
        await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (e) {
        console.log('Cache write error:', e);
    }
}

async function getCache(key) {
    try {
        const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const item = JSON.parse(raw);
        if (Date.now() - item.timestamp > CACHE_TTL) {
            await AsyncStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }
        return item.data;
    } catch (e) {
        console.log('Cache read error:', e);
        return null;
    }
}

// Wrapper: try fetch, fallback to cache
export async function fetchWithCache(key, fetchFn) {
    try {
        const data = await fetchFn();
        await setCache(key, data);
        return data;
    } catch (error) {
        const cached = await getCache(key);
        if (cached) {
            console.log(`Using cached data for: ${key}`);
            return cached;
        }
        throw error;
    }
}

export async function clearCacheByPrefix(prefix) {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const matching = keys.filter(k => k.startsWith(CACHE_PREFIX + prefix));
        if (matching.length > 0) {
            await AsyncStorage.multiRemove(matching);
        }
    } catch (e) {
        console.log('Clear cache by prefix error:', e);
    }
}

export async function clearAllCache() {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
        if (cacheKeys.length > 0) {
            await AsyncStorage.multiRemove(cacheKeys);
        }
    } catch (e) {
        console.log('Clear cache error:', e);
    }
}
