import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from 'src/utils/api';

interface User {
  id: string;
  fullname: string;
  phone: string;
  role: string;
  tags?: string;
  is_active: boolean;
  permissions?: string[];
  client?: any
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthResponse {
  token: string
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk<
  AuthResponse,                               // return type
  { phone: string; password: string },        // argument type
  { rejectValue: string }                     // reject type
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post<AuthResponse>('auth/login', credentials);

      return response.data;

    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data?.message || 'Login failed');
      }

      return rejectWithValue(error.message || 'Something went wrong');
    }
  }
);


// export const registerUser = createAsyncThunk(
//   'auth/register',
//   async (userData: { name: string; email: string; password: string }, { rejectWithValue }) => {
//     try {
//       const response = await fetch('/api/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(userData),
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         return rejectWithValue(error.message || 'Registration failed');
//       }

//       const data = await response.json();
//       return data;
//     } catch (error: any) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  // Call logout API if needed
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
    //   .addCase(registerUser.pending, (state) => {
    //     state.isLoading = true;
    //     state.error = null;
    //   })
    //   .addCase(registerUser.fulfilled, (state, action) => {
    //     state.isLoading = false;
    //     state.isAuthenticated = true;
    //     state.user = action.payload.user;
    //     state.token = action.payload.token;
    //     localStorage.setItem('token', action.payload.token);
    //     localStorage.setItem('user', JSON.stringify(action.payload.user));
    //   })
    //   .addCase(registerUser.rejected, (state, action) => {
    //     state.isLoading = false;
    //     state.error = action.payload as string;
    //   })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
