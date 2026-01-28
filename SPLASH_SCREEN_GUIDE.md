# Splash Screen - Miliki App Branding

## Overview
The mobile app now includes a professionally branded splash screen with the Miliki app branding and pale blue color scheme. The splash screen is displayed while the app checks authentication status on startup.

## Features

✅ **Branded Design**
- Miliki app name with premium typography
- Professional package icon emoji
- "Stock Taking System" tagline
- Smooth animations on load

✅ **Color Scheme**
- Pale blue background (`#e0f2fe`)
- Dark blue logo circle (`#0284c7`)
- Deep blue text (`#0c4a6e`)
- Medium blue accents (`#0369a1`)

✅ **Animation**
- Logo scales up smoothly (800ms)
- Fade-in effect (600ms)
- Animated loading dots indicator
- Professional entrance

✅ **User Experience**
- Shows while checking authentication
- "Initializing app..." status text
- Loading indicator with animated dots
- Consistent with app branding

## File Location
```
mobile/app/screens/SplashScreen.tsx
```

## How It Works

1. **App Starts** → App Index.tsx loads
2. **AuthProvider** → Begins checking stored token (`checkAuth()`)
3. **isLoading = true** → Navigation shows SplashScreen
4. **Token Valid** → Transition to Store Selection screen
5. **No Token** → Transition to Login screen

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Pale Blue | `#e0f2fe` | Background |
| Dark Blue | `#0284c7` | Logo circle, primary UI |
| Deep Blue | `#0c4a6e` | Text, headings |
| Medium Blue | `#0369a1` | Accents, subtext |

## Customization

### Change App Name
Edit line 32 in `SplashScreen.tsx`:
```typescript
<Text style={styles.appName}>MILIKI</Text>
```

### Change Colors
Edit the color values in the `styles` object:
```typescript
container: {
  backgroundColor: '#e0f2fe', // Change this
}
```

### Change Logo Icon
Edit line 31:
```typescript
<Text style={styles.logoIcon}>📦</Text>  // Change emoji
```

### Adjust Animation Speed
Edit the animation durations (in milliseconds):
```typescript
duration: 800, // Logo scale duration
duration: 600, // Fade-in duration
```

## Integration Points

### Navigation (app/screens/Navigation.tsx)
```typescript
if (authState.isLoading) {
  return <SplashScreen />;
}
```

### Auth Context (context/auth_context.tsx)
- Sets `isLoading = true` on app start
- Calls `checkAuth()` to verify stored token
- Sets `isLoading = false` after auth check completes

## Responsive Design
- Scales correctly on all screen sizes
- Works on phones and tablets
- Maintains aspect ratio of logo
- Safe area aware

## Performance
- Lightweight component
- Uses native Animated API
- Minimal re-renders
- Fast transition to next screen

## Future Enhancements

Consider adding:
- Loading progress indicator
- Version number display
- Animated brand logo
- Background gradient
- Particle effects
- Sound effect (optional)

## Related Files
- `mobile/app/Index.tsx` - App entry point
- `mobile/context/auth_context.tsx` - Auth state management
- `mobile/app/screens/Navigation.tsx` - Route navigation

---

**Version:** 1.0  
**Date:** January 23, 2026  
**Status:** ✅ Production Ready
