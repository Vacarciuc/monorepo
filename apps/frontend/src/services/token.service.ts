import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';

export const tokenService = {
  saveToken(token: string): void {
    // Save in cookie for 7 days
    Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'strict' });
    // Also save in localStorage as backup
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    // Try to get from cookie first
    const cookieToken = Cookies.get(TOKEN_KEY);
    if (cookieToken) {
      return cookieToken;
    }
    // Fallback to localStorage
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken(): void {
    Cookies.remove(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  hasToken(): boolean {
    return !!this.getToken();
  }
};

