/**
 * API service for communicating with the Sports-Intel backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Games API endpoints
 */
export const gamesApi = {
  /**
   * Get a list of upcoming games
   */
  getUpcomingGames: async (): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/games/upcoming`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch upcoming games:', error);
      return [];
    }
  },

  /**
   * Get details for a specific game
   */
  getGameDetails: async (eventId: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/games/${eventId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch game details for ${eventId}:`, error);
      throw error;
    }
  },
};

/**
 * Player Props API endpoints
 */
export const playerPropsApi = {
  /**
   * Get player props for a specific game
   */
  getGamePlayerProps: async (eventId: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/player-props/games/${eventId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch player props for game ${eventId}:`, error);
      return [];
    }
  },

  /**
   * Get player props for a specific market
   */
  getMarketPlayerProps: async (market: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/player-props/markets/${market}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch player props for market ${market}:`, error);
      return [];
    }
  },
};

/**
 * Players API endpoints
 */
export const playersApi = {
  /**
   * Get player history
   */
  getPlayerHistory: async (playerId: number): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/players/${playerId}/history`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch history for player ${playerId}:`, error);
      return [];
    }
  },
};

/**
 * API Status endpoints
 */
export const apiStatus = {
  /**
   * Check if the API is online
   */
  checkStatus: async (): Promise<{ status: string; version: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to check API status:', error);
      throw error;
    }
  },
};
