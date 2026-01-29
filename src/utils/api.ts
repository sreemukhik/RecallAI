export const API_BASE_URL = 'http://localhost:8000/api/v1';

export const getAuthHeaders = (token: string | null) => {
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

export interface APIError {
    detail: string;
}

export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('accessToken');

    const headers = {
        ...getAuthHeaders(token),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
            const errorData = await response.json();
            if (errorData.detail) {
                errorMessage = typeof errorData.detail === 'string'
                    ? errorData.detail
                    : JSON.stringify(errorData.detail);
            }
        } catch (e) {
            // If json parsing fails, use status text
            errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
    }

    return response.json();
};
