# 🚀 START HERE - Mobile App Setup

Welcome! Your mobile app is complete. Here's how to get it running in 5 minutes.

## Step-by-Step Setup

### 1️⃣ Install Mobile Dependencies (2 min)
```bash
cd mobile
npm install
```

### 2️⃣ Configure Backend URL (1 min)
Edit `mobile/util/api.ts` - Line 3

Find this:
```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:8000/api';
```

Replace with your backend IP:
```typescript
const API_BASE_URL = 'http://YOUR_IP_HERE:8000/api';
```

**Find your IP:**
- Windows: Open Command Prompt → `ipconfig` → Look for "IPv4 Address"
- Mac/Linux: Open Terminal → `ifconfig` → Look for "inet"
- Android Emulator: Use `10.0.2.2:8000` instead
- Docker: Use `host.docker.internal:8000`

### 3️⃣ Start Backend (1 min)
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Wait for: `Uvicorn running on http://0.0.0.0:8000`

### 4️⃣ Run Mobile App (1 min)
```bash
cd mobile
npm start
```

You'll see a QR code in terminal.

### 5️⃣ Open on Device (Instant)
**Option A - Physical Device:**
- Download "Expo Go" from App Store or Play Store
- Scan QR code from terminal
- App opens automatically

**Option B - Emulator:**
- Android: `npm run android` (requires Android Studio)
- iOS: `npm run ios` (requires Xcode on Mac)

## ✅ You're Done!

App should now show **Login Screen**

### Test Login
Create a test user in backend first, then:
- Phone: `07XXXXXXXX` (from backend)
- Password: `your_password`
- Tap "Login"

Should see **Store Selection Screen**

## 📚 Documentation

| File | Purpose |
|------|---------|
| [MOBILE_QUICK_START.md](MOBILE_QUICK_START.md) | Quick reference |
| [MOBILE_SETUP_GUIDE.md](MOBILE_SETUP_GUIDE.md) | Backend config |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How it works |
| [FAQ_TROUBLESHOOTING.md](FAQ_TROUBLESHOOTING.md) | Problems? |
| [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) | All docs |

## 🆘 Common Issues

**Issue: Can't connect to backend**
- Verify backend is running
- Check API URL is correct
- Same network? (desktop & phone)

**Issue: Login fails**
- Create test user in backend
- Check password is correct
- Review backend logs

**Issue: Camera doesn't work**
- Grant permission in app settings
- Restart app
- Use manual entry instead

**More help:** See [FAQ_TROUBLESHOOTING.md](FAQ_TROUBLESHOOTING.md)

## 🎯 App Workflow

```
1. Login
   ↓
2. Select Store
   ↓
3. Select Brand & Model
   ↓
4. Scan Barcodes (or manual entry)
   ↓
5. Submit to Database
```

## 🔑 Important Notes

1. **API URL** - Must be updated to your backend IP
2. **Backend** - Must be running before app login
3. **Test User** - Create before testing login
4. **Test Stores** - Create before testing stock taking
5. **Network** - Phone and backend must be on same network (or use localhost for Android emulator)

## 📱 What the App Does

✅ User authentication (phone + password)  
✅ Select which store for stock taking  
✅ Select product brand and model  
✅ Scan barcodes with camera (or manual)  
✅ Save items to database  

Perfect for inventory management!

## 🚀 Next Steps

1. ✅ Complete setup above
2. ✅ Test login
3. ✅ Test store selection
4. ✅ Test barcode scanning
5. ✅ Test submit
6. 📝 Customize (colors, features, etc.)
7. 🏗️ Deploy to production

## 💡 Pro Tips

- Use physical device for better camera experience
- Good lighting helps barcode scanning
- Hold phone 15-20cm from barcode
- Internet connection required only for submit
- Test users can be created via admin panel

## 📞 Still Need Help?

Check these in order:
1. [MOBILE_QUICK_START.md](MOBILE_QUICK_START.md) - Quick answers
2. [FAQ_TROUBLESHOOTING.md](FAQ_TROUBLESHOOTING.md) - Detailed help
3. [ARCHITECTURE.md](ARCHITECTURE.md) - Understanding flows

---

**Version:** 1.0  
**Date:** January 23, 2026  
**Status:** ✅ Ready to Test

🎉 Enjoy your stock taking app!
