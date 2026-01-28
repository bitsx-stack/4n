# Mobile App - Stock Taking System

A complete React Native mobile application for stock taking with barcode scanning capabilities. Built with Expo, integrated with the backend API for authentication and data persistence.

## Features

### 1. Authentication
- User login with phone number and password
- Secure token storage in AsyncStorage
- Auto-login on app startup if token exists
- Automatic logout when token expires
- Error handling with user-friendly messages

### 2. Stock Taking Workflow
The app follows a 3-step workflow:

1. **Store Selection** - Choose which store to perform stock taking
2. **Brand & Model Selection** - Select the product brand and model
3. **Barcode Scanning** - Scan barcodes and save items to database

### 3. Barcode Scanning
- Real-time barcode scanning using device camera
- Manual barcode entry via keyboard
- Support for multiple barcode formats (CODE128, EAN13, EAN8, UPC-A, CODE39)
- Visual feedback for scanned items
- Remove items from list before submission
- Clear view of all scanned items with timestamps

### 4. Data Persistence
- All scanned items are sent to backend API
- Transaction records created with proper references
- Items linked to selected store, brand, and model
- Timestamps recorded for each scan

## Project Structure

```
mobile/
├── app/
│   ├── Index.tsx                 # Main app wrapper with navigation
│   └── screens/
│       ├── Login.tsx             # Authentication screen
│       ├── StoreSelection.tsx     # Store selection screen
│       ├── BrandModelSelection.tsx # Brand & model selection
│       ├── StockTakingScreen.tsx  # Barcode scanning screen
│       ├── Stock.tsx             # Legacy screen
│       └── Navigation.tsx         # Route configuration
├── context/
│   └── auth_context.tsx          # Authentication context & actions
├── reducer/
│   └── auth_reducer.tsx          # Auth state management
├── util/
│   ├── api.ts                    # API client with interceptors
│   └── barcode.ts                # Barcode utilities
├── components/
│   └── atomics/                  # Reusable UI components
├── hooks/
├── constants/
├── assets/
├── package.json
└── tsconfig.json
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- Physical device or emulator with Expo Go app

### Steps

1. **Install Dependencies**
```bash
cd mobile
npm install
```

2. **Configure API URL**
Update the API base URL in `util/api.ts`:
```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:8000/api';
```

Replace with your backend server IP/URL.

3. **Start the App**
```bash
npm start
```

4. **Run on Device**
- Scan the QR code with Expo Go app (iOS/Android)
- Or run on emulator: `npm run android` or `npm run ios`

## API Integration

### Authentication Endpoints
- `POST /auth/login` - User login
- `GET /users/me` - Get current user
- `POST /auth/logout` - User logout

### Store Endpoints
- `GET /stores` - Get all stores

### IMEI/Product Endpoints
- `GET /imeis` - Get all products
- `GET /imeis/code/{code}` - Get product by barcode
- `GET /imeis/id/{id}` - Get product by ID
- `GET /imeis/stores/{storeId}` - Get products for store

### Transaction Endpoints
- `POST /transactions` - Create stock taking transaction

## Authentication Flow

```
User launches app
    ↓
[Check stored token]
    ↓
├─ Token exists & valid → Navigate to Store Selection
└─ Token missing/invalid → Navigate to Login
    ↓
[User enters credentials]
    ↓
[API validates & returns token]
    ↓
[Token stored in AsyncStorage]
    ↓
Navigate to Store Selection
```

## Stock Taking Workflow

```
Store Selection Screen
    ↓
Brand & Model Selection Screen
    ↓
Stock Taking Screen
    ├─ Camera Scanner (active)
    ├─ Manual Barcode Entry
    └─ List of Scanned Items
    ↓
Submit to Backend
    ↓
Success → Navigate back to Store Selection
Error → Display error message
```

## Key Technologies

- **React Native** - Cross-platform mobile app framework
- **Expo** - Development and deployment platform
- **React Navigation** - Navigation library for mobile apps
- **Axios** - HTTP client for API communication
- **AsyncStorage** - Secure local storage
- **expo-camera** - Camera integration
- **expo-barcode-scanner** - Barcode scanning

## API Request/Response Examples

### Login
```typescript
// Request
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=07XXXXXXXX&password=yourpassword

// Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Create Transaction
```typescript
// Request
POST /transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "ref": "STK-1234567890-abc123def",
  "type": "stock_in",
  "quantity": 1,
  "amount": 0,
  "status": "completed",
  "user_id": 1,
  "imei_code": "123456789012",
  "store_id": 1
}

// Response
{
  "id": 1,
  "code": "550e8400-e29b-41d4-a716-446655440000",
  "ref": "STK-1234567890-abc123def",
  "type": "stock_in",
  "quantity": 1,
  "amount": 0,
  "status": "completed",
  "created_at": "2024-01-23T10:30:00",
  "updated_at": "2024-01-23T10:30:00",
  "user_id": 1,
  "store_id": 1
}
```

## Error Handling

The app handles various error scenarios:

1. **Network Errors** - Displayed as user-friendly messages
2. **Authentication Errors** - Redirects to login if token is invalid
3. **API Errors** - Shows backend error messages
4. **Camera Permission** - Requests permission and shows fallback manual entry
5. **Validation Errors** - Input validation before submission

## Security

- Tokens stored securely in AsyncStorage
- Token automatically added to all API requests
- Automatic token refresh on app launch
- Logout clears token from storage
- HTTPS recommended for production

## Environment Variables

Create `.env` file if needed:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

## Troubleshooting

### Camera not working
- Check camera permissions in app settings
- Ensure Expo has camera permission
- Try restarting the app

### API Connection Failed
- Verify backend server is running
- Check API_BASE_URL is correct
- Ensure device can reach backend (same network)
- Check firewall settings

### Login Failed
- Verify credentials with backend user
- Check backend is running
- Check network connection
- Review backend logs for errors

### Barcode Not Scanning
- Ensure good lighting
- Try manual entry instead
- Different barcode formats may not work on older devices
- Check camera lens is clean

## Development Notes

### Adding New Screens
1. Create screen component in `app/screens/`
2. Add screen to `Navigation.tsx` Stack.Screen
3. Update navigation types if needed

### Adding New API Endpoints
1. Create new function in `util/api.ts`
2. Use existing `api` instance
3. Handle errors with try-catch

### State Management
Currently using React Context + useReducer for auth. For more complex state, consider Redux or Zustand.

## Performance Optimization

- Lazy load screens
- Optimize re-renders with React.memo
- Use FlatList for large lists
- Debounce search inputs

## Future Enhancements

- [ ] Offline mode with local SQLite
- [ ] Batch upload when connection restored
- [ ] Product image preview
- [ ] Barcode history
- [ ] Advanced filtering & search
- [ ] Export reports
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Push notifications for pending uploads

## Support

For issues or questions:
1. Check the error message and logs
2. Review backend API status
3. Check network connectivity
4. Clear AsyncStorage if stuck in auth state
