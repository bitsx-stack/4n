# Mobile App Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Native App                        │
│                   (iOS & Android via Expo)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Navigation Layer                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │Login Screen │→ │Store Selection│→│Brand/Model Sel.│  │  │
│  │  └─────────────┘  └──────────────┘  └────────────────┘  │  │
│  │                          │                    │          │  │
│  │                          └────────┬───────────┘          │  │
│  │                                   ▼                      │  │
│  │                      ┌─────────────────────┐             │  │
│  │                      │Stock Taking (Scan)  │             │  │
│  │                      │ - Camera Scanner    │             │  │
│  │                      │ - Manual Entry      │             │  │
│  │                      │ - Item List         │             │  │
│  │                      └─────────────────────┘             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               State Management Layer                     │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │     Auth Context + Reducer                       │   │  │
│  │  │  - user state                                    │   │  │
│  │  │  - token (stored in AsyncStorage)                │   │  │
│  │  │  - isAuthenticated                               │   │  │
│  │  │  - isLoading, error                              │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Integration Layer                      │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │         Axios HTTP Client (api.ts)              │   │  │
│  │  │  ┌────────────────────────────────────────────┐  │   │  │
│  │  │  │ Interceptors:                              │  │   │  │
│  │  │  │ - Add Bearer token to requests             │  │   │  │
│  │  │  │ - Handle 401 errors                        │  │   │  │
│  │  │  │ - Parse error responses                    │  │   │  │
│  │  │  └────────────────────────────────────────────┘  │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │         API Functions (endpoints):              │   │  │
│  │  │  - authApi.login()                              │   │  │
│  │  │  - authApi.getMe()                              │   │  │
│  │  │  - storeApi.getAll()                            │   │  │
│  │  │  - imeiApi.*()                                  │   │  │
│  │  │  - transactionApi.create()                      │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Local Storage (AsyncStorage)                 │  │
│  │  - auth_token (encrypted)                              │  │
│  │  - user preferences                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP(S)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Endpoints (/api)                       │  │
│  │  - /auth/login, /logout, /me                            │  │
│  │  - /stores                                              │  │
│  │  - /imeis                                               │  │
│  │  - /transactions                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Business Logic (CRUD)                      │  │
│  │  - User authentication & validation                     │  │
│  │  - Store management                                     │  │
│  │  - Product (IMEI) management                            │  │
│  │  - Transaction recording                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Database (SQLModel + SQLAlchemy)           │  │
│  │  - Users                                                │  │
│  │  - Stores                                               │  │
│  │  - IMEIs (products)                                     │  │
│  │  - Transactions                                         │  │
│  │  - TransactionIMEILink (many-to-many)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Authentication Flow
```
┌──────────┐
│  App     │
│ Starts   │
└────┬─────┘
     │
     ▼
┌─────────────────────────┐
│ Check AsyncStorage for  │
│ 'auth_token'            │
└────┬────────────────────┘
     │
     ├─── [Token Found] ───────────────────────┐
     │                                         │
     └─── [No Token] ─┐                        │
                      │                        │
                      ▼                        ▼
              ┌──────────────┐      ┌──────────────────┐
              │ Show Login   │      │ Call GET /me     │
              │ Screen       │      │ to verify token  │
              └────┬─────────┘      └────┬─────────────┘
                   │                      │
                   ▼                      ▼
          ┌────────────────┐      ┌──────────────┐
          │ User enters    │      │ Token Valid? │
          │ phone & pwd    │      └─┬──────────┬─┘
          └────┬───────────┘        │          │
               │                 YES│          │NO
               ▼                    │          │
        ┌─────────────────┐         │          ▼
        │POST /auth/login │         │    Clear token
        │ (credentials)   │         │    Retry login
        └────┬────────────┘         │
             │                      ▼
             ▼              ┌────────────────┐
      ┌──────────────┐      │Show Store      │
      │Response with │      │Selection       │
      │access_token  │      │Screen          │
      └────┬─────────┘      └────────────────┘
           │
           ▼
    ┌────────────────────┐
    │Save token in       │
    │AsyncStorage        │
    └────┬───────────────┘
         │
         ▼
    ┌────────────────────┐
    │Call GET /me        │
    │(get user profile)  │
    └────┬───────────────┘
         │
         ▼
    ┌────────────────────┐
    │Update auth state   │
    │with user data      │
    └────┬───────────────┘
         │
         ▼
    ┌────────────────────┐
    │Navigate to Store   │
    │Selection Screen    │
    └────────────────────┘
```

### 2. Stock Taking Workflow
```
┌──────────────────────────┐
│ Store Selection Screen   │
│ - Fetch stores           │
│ - Display list           │
│ - User selects one       │
└──────────────┬───────────┘
               │ (storeId)
               ▼
┌──────────────────────────┐
│ Brand & Model Selection  │
│ - Show brands            │
│ - User selects brand     │
│ - Show models            │
│ - User selects model     │
└──────────────┬───────────┘
               │ (brand, model)
               ▼
┌──────────────────────────┐
│ Stock Taking Screen      │
│ - Open camera OR         │
│ - Manual barcode entry   │
│                          │
│ For each barcode:        │
│ - Create ScannedItem     │
│ - Add to list            │
│ - Show in FlatList       │
└──────────────┬───────────┘
               │ (scannedItems[])
               │
               ├─ [Remove]──┐
               │            │
               │            ▼
               │       Item deleted
               │       from list
               │
               └─ [Submit]─────────────┐
                                       │
                                       ▼
                          ┌─────────────────────┐
                          │ For each item:      │
                          │ POST /transactions  │
                          │ with:               │
                          │ - imei_code         │
                          │ - store_id          │
                          │ - type: stock_in    │
                          │ - quantity: 1       │
                          │ - user_id           │
                          └────┬────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │All items     │
                        │saved to DB   │
                        └────┬─────────┘
                             │
                             ▼
                        ┌──────────────┐
                        │Success alert │
                        │Reset state   │
                        │Go back       │
                        └──────────────┘
```

### 3. API Request Flow
```
┌──────────────────┐
│ API Call         │
│ (e.g., login)    │
└────────┬─────────┘
         │
         ▼
┌────────────────────────┐
│ Request Interceptor    │
│ - Check token          │
│ - Add auth header      │
│ - Set timeout          │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ HTTP Request           │
│ to Backend             │
└────────┬───────────────┘
         │
    ┌────┴─────────┐
    │              │
    ▼              ▼
[Success]      [Error]
    │              │
    ▼              ▼
 ┌─────┐      ┌─────────────────┐
 │200  │      │Response Handler │
 │201  │      │ - Check status  │
 │etc  │      │ - Log error     │
 └──┬──┘      │ - Return        │
    │         │   Promise.reject│
    ▼         └────────┬────────┘
 ┌──────────┐          │
 │Response  │          ▼
 │Handler   │     ┌─────────────────┐
 │- Parse   │     │Error Caught by  │
 │- Return  │     │Caller with      │
 │  data    │     │helpful message  │
 └────┬─────┘     └─────────────────┘
      │
      ▼
 ┌────────────────┐
 │Component gets  │
 │response data   │
 │or error        │
 │Updates state   │
 └────────────────┘
```

## State Management

### Auth Context Structure
```typescript
interface AuthContextType {
  user: {
    id: number;
    phone_number: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

type Action = 
  | { type: "LOGIN", payload: { user, token } }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING", payload: boolean }
  | { type: "SET_ERROR", payload: string }
  | { type: "CLEAR_ERROR" }
```

## Component Tree
```
App (Index.tsx)
├── AuthProvider (context)
├── NavigationContainer
│   └── StackNavigator
│       ├── LoginScreen
│       │   └── Uses: useAuthContext().login()
│       │
│       ├── StoreSelectionScreen
│       │   ├── Uses: storeApi.getAll()
│       │   └── Navigate to BrandModelSelection
│       │
│       ├── BrandModelSelectionScreen
│       │   └── Navigate to StockTaking
│       │
│       └── StockTakingScreen
│           ├── Uses: CameraView (expo-camera)
│           ├── Uses: transactionApi.create()
│           └── Navigate back to StoreSelection
```

## File Dependencies

```
screens/Navigation.tsx
├── screens/Login.tsx
│   ├── context/auth_context.tsx
│   └── util/api.ts
│
├── screens/StoreSelection.tsx
│   ├── util/api.ts (storeApi)
│   └── context/auth_context.tsx
│
├── screens/BrandModelSelection.tsx
│   └── (no API calls - hardcoded data)
│
└── screens/StockTakingScreen.tsx
    ├── util/api.ts (transactionApi)
    ├── context/auth_context.tsx
    ├── expo-camera
    └── util/barcode.ts
```

## Network & Storage

### API Communication
```
Mobile App ──HTTP(S)──> Backend (FastAPI)
                      ↓
                   Database
```

### Local Storage (AsyncStorage)
```
AsyncStorage
├── auth_token        (JWT token)
└── user_preferences  (optional)
```

---

**Last Updated:** January 23, 2026
**Version:** 1.0
