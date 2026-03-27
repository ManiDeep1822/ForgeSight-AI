import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const detectAnomaly = (window, machine_type) => 
    apiClient.post('/anomaly/detect', { window, machine_type });

export const predictFailure = (window, machine_type) => 
    apiClient.post('/failure/predict', { window, machine_type });

export const classifyFailure = (window, machine_type) => 
    apiClient.post('/classification/classify', { window, machine_type });

export const estimateRUL = (window, machine_type) => 
    apiClient.post('/rul/estimate', { window, machine_type });

export const scoreHealth = (anomaly_score, failure_prob, rul, class_confidence) => 
    apiClient.post('/health/score', { anomaly_score, failure_prob, rul, class_confidence });

export const estimateCost = (failure_type, health_index, rul, machine_type) => 
    apiClient.post('/cost/estimate', { failure_type, health_index, rul, machine_type });

export const suggestMaintenance = (health_index, rul, failure_type) => 
    apiClient.post('/maintenance/suggest', { health_index, rul, failure_type });

export const getExplanation = (window, machine_type) => 
    apiClient.post('/explain/', { window, machine_type });
