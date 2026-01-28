# Mobile App - FAQ & Troubleshooting

## Frequently Asked Questions

### Setup & Installation

**Q: Do I need to install anything else besides npm packages?**
A: You need:
- Node.js v16+ (for npm packages)
- Expo CLI (optional, but helpful)
- Physical device or emulator with Expo Go app
- Backend server running FastAPI
- Internet connection (for first load)

**Q: How do I get Expo CLI?**
A:
```bash
npm install -g expo-cli
```

**Q: What's the difference between running locally vs production?**
A:
- **Local:** API URL = `http://192.168.1.100:8000/api` (your PC IP)
- **Production:** API URL = `https://yourdomain.com/api` (HTTPS required)

**Q: Can I use the app on iOS/Android?**
A: Yes, with Expo Go app:
- Download "Expo Go" from App Store or Play Store
- Scan QR code from `npm start`

---

### Authentication

**Q: How do I reset my password?**
A: Currently not implemented in mobile app. You need to:
1. Use frontend admin panel
2. Or directly reset in database
3. Or use "Forgot Password" on frontend app first

**Q: Where is the login token stored?**
A: Stored in `AsyncStorage` (device's secure key-value storage)

**Q: What happens if I force-quit the app?**
A: Token stays in storage, you'll be auto-logged in on restart

**Q: How do I log out?**
A: 
1. Add logout button to app (currently not visible)
2. Or clear AsyncStorage to simulate logout

---

### Stores & Products

**Q: Why don't my stores appear?**
A: Check:
1. Is backend running? `curl http://localhost:8000/api/stores`
2. Are there stores in database? Add via frontend admin
3. Is API_BASE_URL correct?
4. Are you authenticated?

**Q: Can I create stores from the mobile app?**
A: No, currently read-only. Create stores in:
- Frontend admin panel
- Direct database insert
- Backend API

**Q: How do I add new brands/models?**
A: Currently hardcoded in `screens/BrandModelSelection.tsx`. To make dynamic:
1. Create API endpoint in backend
2. Update screen to fetch from API
3. Add caching for performance

---

### Barcode Scanning

**Q: Why doesn't the camera work?**
A: 
1. **Permission denied:** Go to Settings → Apps → App Permissions → Camera → Enable
2. **Camera unavailable:** Device may not have camera or it's in use
3. **Expo Go issue:** Try reinstalling Expo Go
4. **Poor lighting:** Ensure good lighting on barcode

**Q: What barcode formats are supported?**
A: The app supports:
- EAN13, EAN8 (retail)
- CODE128, CODE39 (logistics)
- UPC-A (US products)
- Custom formats via manual entry

**Q: What if I don't have a barcode scanner?**
A: Use manual entry - type barcode in the text field

**Q: Can I scan multiple times quickly?**
A: Yes, after each scan:
1. Camera closes
2. Item added to list
3. Tap "Open Camera Scanner" again

**Q: How many items can I scan?**
A: No limit, but performance may degrade with 1000+ items

---

### Data & Transactions

**Q: Where do my scanned items go?**
A: After clicking "Submit":
1. Each item creates a transaction record
2. Stored in backend database
3. Can view via `GET /api/transactions`
4. Frontend admin panel shows transaction history

**Q: What if I scan the same barcode twice?**
A: Two separate transaction records are created. This is correct for stock taking.

**Q: Can I edit items after submitting?**
A: No, edit/delete must be done through admin panel or API

**Q: Do I need internet to scan?**
A: Only when you click "Submit". Scanning works offline (data held locally until submit)

**Q: What happens if submit fails?**
A: Error shown, items stay in list. You can:
1. Try again with better connection
2. Clear items and rescan
3. Check backend logs for errors

---

### Performance

**Q: Why is the app slow?**
A:
1. Poor internet connection - check signal
2. Backend not responding - check backend
3. Too many items in list - try submitting
4. Old device - some features may be slow

**Q: Can I use the app offline?**
A: 
- Scanning: Yes (camera works offline)
- Submit: No (requires internet)
- Currently no offline queue

---

### Backend Integration

**Q: How do I verify the backend is working?**
A:
```bash
# Check all endpoints
curl http://localhost:8000/api/stores
curl http://localhost:8000/api/imeis
curl http://localhost:8000/api/auth/login -X POST

# Check backend logs
# Should see request logs from mobile app
```

**Q: What version of Python is needed?**
A: Python 3.8+ (check `backend/requirements.txt`)

**Q: How do I check the database?**
A:
```bash
# If using SQLite:
sqlite3 database.db

# If using PostgreSQL:
psql -U user -d database_name

# Check tables:
# SELECT * FROM transaction;
# SELECT * FROM imei;
# SELECT * FROM store;
```

**Q: Can I use a different database?**
A: Yes, change in `backend/app/core/database.py`:
```python
DATABASE_URL = "postgresql://user:pass@localhost/db"
```

---

## Troubleshooting Guide

### Problem: "Cannot connect to backend"

**Symptoms:** 
- "Connection refused" error
- All API calls fail
- Error even with correct URL

**Solutions:**
1. **Verify backend is running:**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. **Check API URL:**
   - Edit `mobile/util/api.ts`
   - Verify URL is correct
   - For emulator: use `10.0.2.2:8000/api` (Android) or `localhost:8000/api` (iOS)
   - For physical device: use your PC IP (find with `ipconfig` or `ifconfig`)

3. **Check network:**
   - Is app connected to internet?
   - Is backend on same network?
   - Firewall blocking port 8000?

4. **Test with curl:**
   ```bash
   curl http://YOUR_IP:8000/api/stores
   # Should return list of stores (may need auth)
   ```

---

### Problem: "Login failed - Invalid credentials"

**Symptoms:**
- "Incorrect credentials" error
- Can't log in even with correct password

**Solutions:**
1. **Verify user exists:**
   - Check backend user table
   - Create new test user if needed

2. **Check password:**
   - Passwords are case-sensitive
   - No spaces before/after
   - Check for caps lock

3. **Verify backend auth:**
   ```bash
   # Check auth endpoint in backend
   # Test with curl:
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=07XXXXXXXX&password=yourpassword"
   ```

4. **Check backend logs:**
   - Look for error messages
   - Verify database has users table

---

### Problem: "Stores not loading"

**Symptoms:**
- Store selection screen shows empty list
- Loading indicator spins forever

**Solutions:**
1. **Create test stores:**
   ```bash
   # Via Python shell:
   from backend.app.crud.store import StoreCRUD
   from backend.app.core.database import get_db
   
   db = get_db()
   StoreCRUD(db).create(name="Test Warehouse", type="warehouse")
   ```

2. **Check API endpoint:**
   ```bash
   curl http://localhost:8000/api/stores
   # Should return JSON array
   ```

3. **Check authentication:**
   - Is token being sent?
   - Is token valid?
   - Check `Authorization` header

---

### Problem: "Camera not working"

**Symptoms:**
- "Camera permission denied"
- Camera opens but no video
- Only black screen

**Solutions:**
1. **Grant permission:**
   - Go to Settings → Apps → [App Name] → Permissions
   - Enable Camera permission
   - Restart app

2. **Check camera hardware:**
   - Device actually has camera
   - Camera not in use by another app
   - Camera lens not covered

3. **Try fallback:**
   - Use manual barcode entry instead
   - Type barcode in text field

4. **Restart:**
   - Close Expo Go completely
   - Relaunch app
   - Tap "Open Camera Scanner" again

---

### Problem: "Barcode not scanning"

**Symptoms:**
- Camera opens but doesn't detect barcodes
- Manual entry works fine

**Solutions:**
1. **Check barcode quality:**
   - Barcode must be clear/not damaged
   - Good lighting (not backlit)
   - Straight angle (not at extreme angle)
   - Full barcode visible (not cropped)

2. **Try different barcode format:**
   - EAN13 (most common)
   - Try manual entry with same barcode

3. **Hold camera properly:**
   - 15-20cm away from barcode
   - Keep steady (avoid shaking)
   - Center barcode in frame

4. **Check device camera:**
   - Try camera app (native)
   - If native works but app doesn't, may be app issue
   - Try restarting device

---

### Problem: "Token expired - Unauthorized"

**Symptoms:**
- Was logged in, but now getting 401 errors
- Can't access stores after a while

**Solutions:**
1. **Log out and log back in:**
   - Close app
   - Clear AsyncStorage (advanced)
   - Reopen and log in again

2. **Check token expiry time:**
   - Default may be short (e.g., 1 hour)
   - Update in backend `create_access_token()`

3. **Check server time:**
   - Server and phone time must be in sync
   - Adjust phone clock if needed

---

### Problem: "Submit failed - Items not saved"

**Symptoms:**
- Items list has data
- Click Submit
- Error message appears
- Items are still in list

**Solutions:**
1. **Check error message:**
   - Different errors have different causes
   - Read error message carefully

2. **Verify authentication:**
   - Are you still logged in?
   - Token might have expired

3. **Check backend:**
   ```bash
   # Is backend running?
   # Check endpoint exists:
   curl http://localhost:8000/api/transactions -X POST
   
   # Check logs for errors
   ```

4. **Check network:**
   - Internet connection active?
   - Try submit again
   - Check backend can reach database

5. **Try removing one item:**
   - Click "Remove" on one item
   - Try Submit again
   - One problematic item may be blocking all

---

### Problem: "App crashes on startup"

**Symptoms:**
- App opens then immediately closes
- White screen then back to home

**Solutions:**
1. **Check dependencies installed:**
   ```bash
   cd mobile
   npm install
   npm start
   ```

2. **Clear cache:**
   ```bash
   # Stop the app
   # In Expo CLI, press 'c' to clear cache
   npm start --clear
   ```

3. **Check node_modules:**
   ```bash
   rm -rf node_modules
   npm install
   npm start
   ```

4. **Check for syntax errors:**
   - Review recent changes in screens
   - Check console for specific error
   - Comment out problematic code

5. **Restart device:**
   - Close Expo Go completely
   - Restart phone
   - Reopen app

---

### Problem: "AsyncStorage errors"

**Symptoms:**
- "AsyncStorage is not defined"
- Cannot save/retrieve token
- App won't start

**Solutions:**
1. **Install package:**
   ```bash
   npm install @react-native-async-storage/async-storage
   npm start --clear
   ```

2. **Check import:**
   ```typescript
   // Correct:
   import AsyncStorage from '@react-native-async-storage/async-storage';
   
   // NOT:
   import AsyncStorage from 'react-native';
   ```

3. **Verify in package.json:**
   - Check if package is listed in dependencies
   - If not: `npm install @react-native-async-storage/async-storage`

---

## Performance Tips

1. **Reduce re-renders:**
   - Use `React.memo()` for screens
   - Optimize state updates
   - Avoid inline function definitions

2. **Optimize lists:**
   - Use `FlatList` instead of `ScrollView` + map
   - Set `removeClippedSubviews={true}`
   - Use `keyExtractor` properly

3. **Network optimization:**
   - Cache API responses
   - Reduce request payload size
   - Batch API calls if possible

4. **Battery optimization:**
   - Close camera when not in use
   - Stop location updates when not needed
   - Reduce update frequency

---

## Debug Tips

### Enable Debug Logging

Add to `mobile/util/api.ts`:
```typescript
api.interceptors.request.use((config) => {
  console.log('📤 API Request:', config.url);
  return config;
});

api.interceptors.response.use((response) => {
  console.log('📥 API Response:', response.status);
  return response;
});
```

### View AsyncStorage
```typescript
// Add to any screen
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const data = await AsyncStorage.multiGet(keys);
  console.log('Storage:', JSON.stringify(data, null, 2));
};

// Call in useEffect or button press
```

### Check Network
```typescript
import { AppState } from 'react-native';

AppState.addEventListener('change', (state) => {
  console.log('App state:', state); // active, inactive, background
});
```

---

## Getting Help

1. **Check logs:** Examine Expo console output
2. **Review files:** Compare with expected structure
3. **Test endpoints:** Use curl to test API
4. **Check backend:** Review backend logs
5. **Forum:** Search online for similar issues
6. **Docs:** Check Expo and React Navigation docs

---

**Last Updated:** January 23, 2026
**Version:** 1.0
