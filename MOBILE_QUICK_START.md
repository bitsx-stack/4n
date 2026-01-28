# Mobile App - Quick Reference

## 🚀 Start Here

### 1. Install & Run
```bash
cd mobile
npm install
npm start
```

### 2. Configure Backend URL
Edit `mobile/util/api.ts` - line 3:
```typescript
const API_BASE_URL = 'http://192.168.1.100:8000/api'; // Change this!
```

### 3. Run Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Login with Test User
Create user in backend or use existing credentials:
- **Phone:** `07XXXXXXXX`
- **Password:** `your_password`

## 📱 App Workflow

```
Login → Store → Brand/Model → Scan Barcodes → Submit
```

1. **Login** - Phone number + password
2. **Select Store** - Choose warehouse/shop
3. **Select Brand & Model** - Choose product type
4. **Scan Barcodes** - Use camera or manual entry
5. **Submit** - Save all items to database

## 🎯 Key Features

| Feature | Status | File |
|---------|--------|------|
| Authentication | ✅ Complete | `context/auth_context.tsx` |
| Store Selection | ✅ Complete | `screens/StoreSelection.tsx` |
| Brand/Model Selection | ✅ Complete | `screens/BrandModelSelection.tsx` |
| Barcode Scanning | ✅ Complete | `screens/StockTakingScreen.tsx` |
| Manual Entry | ✅ Complete | `screens/StockTakingScreen.tsx` |
| Auto-login | ✅ Complete | `context/auth_context.tsx` |
| Error Handling | ✅ Complete | Throughout |
| API Integration | ✅ Complete | `util/api.ts` |

## 🔑 Important Files

| File | Purpose |
|------|---------|
| `util/api.ts` | API client & endpoints |
| `context/auth_context.tsx` | Authentication provider |
| `reducer/auth_reducer.tsx` | Auth state management |
| `screens/Login.tsx` | Login UI |
| `screens/StoreSelection.tsx` | Store selection UI |
| `screens/BrandModelSelection.tsx` | Brand/model selection UI |
| `screens/StockTakingScreen.tsx` | Barcode scanning UI |
| `screens/Navigation.tsx` | Route configuration |

## 📝 API Endpoints

### Authentication
```
POST /auth/login              → { access_token }
GET /users/me                 → { user data }
POST /auth/logout             → { message }
```

### Stores
```
GET /stores                   → [ { id, name, type } ]
```

### Products
```
GET /imeis                    → { data: [...], total }
GET /imeis/code/{code}        → { product }
```

### Transactions
```
POST /transactions            → { transaction }
GET /transactions             → [ transactions ]
```

## 🎨 Color Scheme

- **Primary:** `#1e40af` (Blue)
- **Success:** `#059669` (Green)
- **Error:** `#dc2626` (Red)
- **Background:** `#f5f5f5` (Light Gray)
- **Text:** `#1f2937` (Dark Gray)

## 📲 Screen Names (for navigation)

```typescript
navigation.navigate("LoginScreen")
navigation.navigate("StoreSelection")
navigation.navigate("BrandModelSelection")
navigation.navigate("StockTaking")
```

## 🔗 Update Backend URL

### Find this line:
`mobile/util/api.ts` - **Line 3**

### Replace:
```typescript
// ❌ Before
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:8000/api';

// ✅ After (use your IP)
const API_BASE_URL = 'http://YOUR_IP_HERE:8000/api';
```

### Common IPs:
- **Same PC (Android Emulator):** `http://10.0.2.2:8000/api`
- **Same Network (Physical):** `http://192.168.x.x:8000/api`
- **Docker:** `http://host.docker.internal:8000/api`
- **Production:** `https://your-domain.com/api`

## 🧪 Testing Checklist

- [ ] Login with valid credentials
- [ ] Automatic login on app restart
- [ ] Store list loads from API
- [ ] Can select store
- [ ] Brand list appears
- [ ] Can select brand
- [ ] Model list appears
- [ ] Can select model
- [ ] Camera scanner works
- [ ] Manual barcode entry works
- [ ] Items appear in list
- [ ] Can remove items
- [ ] Submit saves to database
- [ ] Success message appears
- [ ] Logout works
- [ ] Token cleared from storage

## ⚙️ Environment Variables

Optional - create `.env` file:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
EXPO_PUBLIC_APP_ENV=development
```

## 🔴 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login | Check API URL, verify credentials, check backend running |
| Stores don't load | Create test stores in backend via admin panel |
| Camera won't open | Grant camera permission in app settings |
| Connection failed | Check network, ensure backend is accessible |
| Token errors | Log out and log back in |

## 💾 Dependencies Added

```json
{
  "@react-native-async-storage/async-storage": "^1.23.1",
  "axios": "^1.7.7"
}
```

Run `npm install` after pulling to get these.

## 📞 Quick Help

### Check Backend URL
```bash
# Test connection
curl http://192.168.1.100:8000/api/stores
```

### View App Logs
```bash
# Expo CLI shows logs
npm start
# Check console output
```

### Reset AsyncStorage (Clear stuck auth)
```typescript
// Add to any screen temporarily:
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
```

## 🎯 Next Tasks

1. **Test** - Run app with backend
2. **Create test data** - Add stores/products
3. **Verify API** - Test all endpoints
4. **Test scanning** - Try barcode scanning
5. **Offline mode** - Consider adding SQLite
6. **Build release** - Create APK/IPA

## 📚 Documentation

Full guides available:
- `mobile/MOBILE_APP_SETUP.md` - Complete setup guide
- `MOBILE_SETUP_GUIDE.md` - Backend configuration
- `IMPLEMENTATION_SUMMARY.md` - Full implementation details

---

**Last Updated:** January 23, 2026
**Status:** Ready for Testing ✅
