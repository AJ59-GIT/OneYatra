
import { RouteResponse, SearchParams, ChatMessage } from "../types";
import { getApiHeaders } from "../utils/api";

export const fetchTravelOptions = async (
  params: SearchParams
): Promise<RouteResponse> => {
  try {
    const response = await fetch('/api/travel', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(params),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`[API Error] Status: ${response.status}, Body: ${text}`);
      let errorMsg = 'Failed to fetch travel options';
      try {
        const errorData = JSON.parse(text);
        errorMsg = errorData.error || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error("Client fetchTravelOptions Error:", error);
    throw error;
  }
};

export const chatWithAI = async (message: string, history: ChatMessage[] = []): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ message, history }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to chat with AI');
    }
    
    const data = await response.json();
    return data.response;
  } catch (error: any) {
    console.error("Client chatWithAI Error:", error);
    return "I'm having a bit of trouble connecting to the server. Please try again.";
  }
};
