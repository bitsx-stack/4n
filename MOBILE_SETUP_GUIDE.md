# Mobile App Configuration Guide

## Quick Start

### 1. Install Mobile Dependencies
```bash
cd mobile
npm install
```

This installs all required packages including:
- `axios` - HTTP client
- `@react-native-async-storage/async-storage` - Secure local storage
- `expo-camera` & `expo-barcode-scanner` - Camera and scanning

### 2. Update Backend API URL
Edit `mobile/util/api.ts` and set your backend URL:

```typescript
// For local development (running on same machine as emulator)
const API_BASE_URL = 'http://10.0.2.2:8000/api'; // Android Emulator

// For physical device on local network
const API_BASE_URL = 'http://192.168.1.100:8000/api'; // Replace IP

// For production
const API_BASE_URL = 'https://your-api.com/api';
```

### 3. Start the Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Run the Mobile App
```bash
cd mobile
npm start

# For Android emulator
npm run android

# For iOS simulator
npm run ios

# Or scan QR code with Expo Go app
```

## Backend Requirements Check

Ensure backend has:

### ✅ Authentication API
```python
POST /api/auth/login           # Login endpoint
GET /api/users/me              # Get current user
POST /api/auth/logout          # Logout endpoint
```

### ✅ Store API
```python
GET /api/stores                # List all stores
```

### ✅ IMEI/Product API
```python
GET /api/imeis                 # List all products
GET /api/imeis/code/{code}     # Get by barcode
POST /api/imeis                # Create product
```

### ✅ Transaction API
```python
POST /api/transactions         # Create transaction
GET /api/transactions          # List transactions
```

## Backend Configuration for Mobile

### 1. CORS Setup
Update `backend/app/main.py` to allow mobile app requests:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (restrict in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Check Auth Endpoint Response
Login should return access token:
```python
# backend/app/api/auth.py
@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # ... validation ...
    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token)
```

### 3. Ensure GET /users/me Works
The app calls this after login to get user details:
```python
# Check backend has this endpoint
@router.get("/me", response_model=UserRead)
@auth_required
async def me(request: Request, db: Session = Depends(get_db)):
    id = request.state.user["sub"]
    crud = UserCRUD(db)
    return crud.get_by_id(id)
```

If it's at `/api/users/me`, update in `mobile/util/api.ts`:
```typescript
export const authApi = {
  getMe: () => api.get('/users/me'),  // Adjust path as needed
};
```

## Typical User Flow

```
1. App Loads
   ↓ [Check AsyncStorage for token]
   
2. No Token Found
   ↓
   Login Screen
   ├─ Enter phone: 07XXXXXXXX
   ├─ Enter password: ****
   └─ Tap "Login"
   
3. API Call: POST /auth/login
   ← Response: { access_token: "eyJ..." }
   
4. API Call: GET /users/me
   ← Response: { id: 1, phone_number: "07...", ... }
   
5. Store Selection Screen
   ├─ API: GET /stores
   └─ Select store
   
6. Brand & Model Selection
   ├─ Select brand
   └─ Select model
   
7. Stock Taking Screen
   ├─ Scan barcode (or manual entry)
   ├─ Add multiple items
   └─ Submit
   
8. Submit Transaction
   ├─ API: POST /transactions (for each item)
   └─ Success → Back to store selection
```

## Test Data Setup

Create test stores and products in backend:

```python
# backend/app/crud/store.py
# Create test stores
StoreCRUD(db).create(name="Main Warehouse", type="warehouse")
StoreCRUD(db).create(name="Shop 1", type="shop")

# backend/app/crud/imei.py
# Create test products
ImeiCRUD(db).create(code="123456789", brand="Apple", model="iPhone 15")
ImeiCRUD(db).create(code="987654321", brand="Samsung", model="Galaxy S24")
```

Or use the Frontend admin panel to create test data.

## Debugging

### Enable Debug Logging
```typescript
// mobile/util/api.ts
// Add detailed logging for requests/responses
api.interceptors.request.use((config) => {
  console.log('API Request:', config.url, config.method);
  return config;
});

api.interceptors.response.use((response) => {
  console.log('API Response:', response.status, response.data);
  return response;
});
```

### Check Network in Emulator
```bash
# Android Emulator
adb shell netstat | grep 8000

# iOS Simulator - use Console app
```

### View AsyncStorage
```typescript
// In any screen - temporarily add for debugging
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const data = await AsyncStorage.multiGet(keys);
  console.log('AsyncStorage:', data);
};
```

## Troubleshooting

### "Connection refused" Error
- ✓ Verify backend is running
- ✓ Check API URL is correct
- ✓ On Android emulator, use `10.0.2.2` instead of `localhost`
- ✓ On physical device, use device IP (check network settings)

### "Unauthorized" or "401" Error
- ✓ Token expired - log out and log in again
- ✓ Backend token validation issue - check backend logs
- ✓ Token not being sent - check request interceptor

### "Camera permission denied"
- ✓ Grant permission in app settings
- ✓ Restart app
- ✓ Use manual barcode entry instead

### "Store not loading"
- ✓ Create test store in backend
- ✓ Check API endpoint exists
- ✓ Verify authentication token works

## Environment Setup Files

### .env.example
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
EXPO_PUBLIC_APP_ENV=development
```

### Development vs Production

**Development:**
- Use local IP for API
- Enable debug logging
- No code obfuscation

**Production:**
- Use HTTPS with domain
- Disable debug logging
- Enable code optimization
- Use secure storage

## Next Steps

1. ✅ Complete mobile app implementation
2. ⏭️ Test with backend
3. ⏭️ Add offline capability (SQLite)
4. ⏭️ Implement product image support
5. ⏭️ Add advanced filtering
6. ⏭️ Build production APK/IPA
