import axios from "axios";
const API_PORT = import.meta.env.VITE_API_PORT || "5000";
const API_BASE_URL = `http://127.0.0.1:${API_PORT}`;

// API Response interface
export interface ApiResponse {
  reply: string;
  model: string;
  status: string;
}

// Error response interface
export interface ApiError {
  error: string;
  example?: { text: string };
}

// Diagnostic interfaces
export interface DiagnosticQuestion {
  question: string;
  raw_question?: string;
  index: number;
  complete: boolean;
}

export interface DiagnosticRecommendation {
  recommendation: string;
  score: number;
  reasoning: string;
}

export interface DiagnosticStartResponse {
  question: string;
  index: number;
  complete: boolean;
  session_id: string;
  status: string;
}

export interface DiagnosticAnswerResponse {
  complete: boolean;
  next_question: DiagnosticQuestion | null;
  recommendation: DiagnosticRecommendation | null;
  status: string;
}

/**
 * Sends a message to the local Flask server and returns the response.
 * @param {string} message - The message to send.
 * @returns {Promise<ApiResponse>} - The response from the server.
 */
export async function sendMessage(message: string): Promise<ApiResponse> {
  try {
    const response = await axios.post(`${API_BASE_URL}/message`, { text: message });
    return response.data as ApiResponse; // Returns JSON with reply, model, and status
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Start a new diagnostic session.
 * @param {string} sessionId - Unique session identifier.
 * @returns {Promise<DiagnosticStartResponse>} - The first question and session info.
 */
export async function startDiagnostic(sessionId: string): Promise<DiagnosticStartResponse> {
  try {
    const response = await axios.post(`${API_BASE_URL}/diagnostic/start`, { session_id: sessionId });
    return response.data as DiagnosticStartResponse;
  } catch (error) {
    console.error("Error starting diagnostic:", error);
    throw error;
  }
}

/**
 * Answer a diagnostic question.
 * @param {string} sessionId - The session identifier.
 * @param {boolean} answer - The user's answer (true/false).
 * @returns {Promise<DiagnosticAnswerResponse>} - Next question or final recommendation.
 */
export async function answerDiagnosticQuestion(sessionId: string, answer: string): Promise<DiagnosticAnswerResponse> {
  try {
    const response = await axios.post(`${API_BASE_URL}/diagnostic/answer`, { 
      session_id: sessionId, 
      answer: answer 
    });
    return response.data as DiagnosticAnswerResponse;
  } catch (error) {
    console.error("Error answering diagnostic question:", error);
    throw error;
  }
}

/**
 * Get the status of a diagnostic session.
 * @param {string} sessionId - The session identifier.
 * @returns {Promise<any>} - Session status and current question.
 */
export async function getDiagnosticStatus(sessionId: string): Promise<any> {
  try {
    const response = await axios.get(`${API_BASE_URL}/diagnostic/status/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting diagnostic status:", error);
    throw error;
  }
}

/**
 * Get the initial greeting message.
 * @returns {Promise<any>} - The greeting message.
 */
export async function getGreeting(): Promise<any> {
  try {
    const response = await axios.get(`${API_BASE_URL}/greeting`);
    return response.data;
  } catch (error) {
    console.error("Error getting greeting:", error);
    throw error;
  }
}

/**
 * Handle the user's initial response to the greeting.
 * @param {string} message - The user's initial message.
 * @param {string} sessionId - The session identifier.
 * @returns {Promise<any>} - Response and whether to start diagnostic.
 */
export async function handleInitialResponse(message: string, sessionId: string): Promise<any> {
  try {
    const response = await axios.post(`${API_BASE_URL}/initial`, { 
      message: message,
      session_id: sessionId 
    });
    return response.data;
  } catch (error) {
    console.error("Error handling initial response:", error);
    throw error;
  }
}

