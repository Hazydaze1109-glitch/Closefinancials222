// Production API Configuration
const API_URL = 'https://closefinancials222-2y2s.vercel.app';

// Helper to handle API responses
async function handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }
    return data;
}

// Global Auth Header Helper
function getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}
