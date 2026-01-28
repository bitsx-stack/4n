# Splash Screen Visual Design

## Splash Screen Layout

```
┌─────────────────────────────────────┐
│                                     │
│    ╔══════════════════════════╗     │
│    ║   Pale Blue Background   ║     │
│    ║       (#e0f2fe)          ║     │
│    ║                          ║     │
│    ║       ┌──────────┐       ║     │
│    ║       │   Dark   │       ║     │
│    ║       │   Blue   │       ║     │
│    ║       │ Circle   │       ║     │
│    ║       │ (#0284c7)│       ║     │
│    ║       │   📦     │       ║     │
│    ║       └──────────┘       ║     │
│    ║                          ║     │
│    ║        MILIKI            ║     │
│    ║     Stock Taking         ║     │
│    ║        System            ║     │
│    ║                          ║     │
│    ║       • • •              ║     │
│    ║    (Loader dots)         ║     │
│    ║                          ║     │
│    ║   Initializing app...    ║     │
│    ║                          ║     │
│    ╚══════════════════════════╝     │
│                                     │
└─────────────────────────────────────┘
```

## Color Hierarchy

### Primary Colors
```
┌────────────────────────────────┐
│  Pale Blue Background          │
│  #e0f2fe                       │
│  (Light, soft, welcoming)      │
└────────────────────────────────┘
```

### Logo Circle
```
┌────────────────────────────────┐
│  Dark Blue Circle              │
│  #0284c7                       │
│  (Strong, professional)        │
│  Contains: 📦 Package Icon     │
└────────────────────────────────┘
```

### Text
```
App Name:        MILIKI
Color:          #0c4a6e (Deep Blue)
Size:           36px
Weight:         900
Spacing:        3px letter-spacing

Tagline:        Stock Taking System
Color:          #0369a1 (Medium Blue)
Size:           14px
Weight:         500
Spacing:        1.5px letter-spacing
```

### Loading Indicator
```
Three dots animation:
┌─ • (Low opacity)
├─ • (Medium opacity)
└─ • (High opacity)

Color: #0284c7
Size: 10px diameter
Gap: 8px between dots
```

### Footer Text
```
Text:           Initializing app...
Color:          #0369a1 (Medium Blue)
Size:           12px
Weight:         500
Position:       Bottom of screen (40px)
Spacing:        1px letter-spacing
```

## Animation Timeline

```
Time    Component              Action
────────────────────────────────────────
0ms     Logo Container         Start
        • Scale: 0.3 → 1
        • Opacity: 0 → 1
        • Duration: 800ms
        • Easing: Default

0ms     Overall Fade           Start
        • Opacity: 0 → 1
        • Duration: 600ms

600ms   Logo Fully Visible     Complete
800ms   All Animations         Complete

        [Ready for transition]
```

## Responsive Sizing

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Logo Circle | 120px | 140px | 160px |
| App Name | 36px | 42px | 48px |
| Tagline | 14px | 16px | 18px |
| Loader Dot | 10px | 12px | 14px |

## Visual Specifications

### Logo Circle
- Shape: Perfect circle
- Diameter: 120px
- Background: #0284c7 (Dark Blue)
- Shadow: 
  - Color: #0284c7 (same)
  - Offset: 0px X, 10px Y
  - Opacity: 0.3
  - Radius: 20px
  - Elevation (Android): 15

### Typography
- Font: System default
- App Name: 36px, 900 weight, uppercase, 3px spacing
- Tagline: 14px, 500 weight, uppercase, 1.5px spacing
- Footer: 12px, 500 weight, uppercase, 1px spacing

### Spacing
- Logo to app name: 30px
- App name to tagline: 8px
- Loader below logo: 40px top margin
- Footer from bottom: 40px

## Interaction States

### Loading State (Initial)
- Logo animates in
- Loader dots animate
- Status text visible

### Ready to Navigate
- All animations complete
- App transitions to Login or Store Selection
- Smooth fade transition (duration: 300ms recommended)

## Accessibility

✅ **Color Contrast**
- Text on pale blue: High contrast
- Meets WCAG AA standards
- Readable for color-blind users (no red/green)

✅ **Text Size**
- Minimum 12px
- All text readable without zoom

✅ **Animation**
- Smooth, professional pacing
- Not too fast or distracting
- Respects reduced motion preferences (recommended)

## Design System Integration

### Colors Across App
```
Splash Screen           Mobile App
┌──────────────────────────────────┐
│ Pale Blue: #e0f2fe    │ Same as splash
│ Dark Blue: #0284c7    │ Primary actions
│ Deep Blue: #0c4a6e    │ Text, headings
│ Medium Blue: #0369a1  │ Secondary text
└──────────────────────────────────┘
```

### Consistency
- Same color palette throughout app
- Maintains brand identity
- Professional appearance
- Easy on the eyes

## Examples in App

### Login Screen
- Primary button: Dark Blue (#0284c7)
- Background: White with pale blue accent
- Text: Deep Blue (#0c4a6e)

### Store Selection
- Selected card: Pale blue background
- Icons: Dark blue circle (like splash)
- Text: Deep blue headings

### Stock Taking
- Scan button: Dark blue
- Header: Dark blue background
- Success message: Medium blue

---

## Design Principles

1. **Simplicity** - Clean, minimal design
2. **Professionalism** - Business-appropriate aesthetics
3. **Accessibility** - High contrast, readable
4. **Consistency** - Matches app design system
5. **Performance** - Lightweight, fast loading
6. **Branding** - Clear "Miliki" identity

---

**Design Version:** 1.0  
**Last Updated:** January 23, 2026  
**Status:** ✅ Production Ready
