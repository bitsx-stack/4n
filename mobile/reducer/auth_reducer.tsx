type ActionType =
  | "LOGIN"
  | "LOGOUT"
  | "SET_LOADING"
  | "SET_ERROR"
  | "CLEAR_ERROR";

export type User = {
  id: number;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

export const authReducer = (
  state: AuthContextType,
  action: { type: ActionType; payload?: any },
): AuthContextType => {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
        isLoading: false,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
};
