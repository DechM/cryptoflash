# Volume Booster App - Пълен Development Plan

## 🎯 Обща концепция

Volume Booster е iOS приложение за in-app audio enhancement с local file import. App-ът обработва audio само в-app (не system-wide), което е легално и безопасно за App Store.

## 🏗️ АРХИТЕКТУРА - Free-First Approach

### Core Principle:
**Free и Pro използват СЪЩИЯ audio engine. Pro само unlock-ва features/parameters, не е отделна система.**

### Development Strategy:
1. **Free-first** → validate → stabilize
2. **Само след като Free е stable** → build Pro features
3. **Step-by-step** с тестване между всяка стъпка

### Technical Stack:
- **Language:** Swift
- **UI:** SwiftUI only
- **Platform:** iOS
- **Audio Stack:** AudioKit + AVFoundation
- **Monetization:** RevenueCat (later phase)

### Project Structure:
- **Local Folder:** `volume-booster/` в `cryptoflash/` папката
- **Git Repo:** https://github.com/DechM/volume-booster.git

---

## 🆓 FREE ВЕРСИЯ - Features

### Core Features:
1. **1 Preset: "Boost Lite"**
   - Pre-configured boost настройка
   - Ограничен boost level

2. **1 Intensity Knob (0-30%)**
   - Circular knob с gradient indicator
   - Smooth animations
   - Visual feedback
   - Максимален boost: 30%

3. **1 Visualization**
   - Spectrum analyzer (bar graph)
   - Real-time audio levels
   - Smooth animations
   - Blue-to-green gradient

4. **File Limit: 1-2 audio файла**
   - Потребителят може да импортира максимум 1-2 файла
   - Local files import (Files app, iCloud, device)

5. **Watermark UX**
   - "Unlock Pro" watermark/overlay
   - Visual indication на Pro features
   - Non-intrusive, но видимо

### UI Screens (Free):
- **Home** → Boost knob + spectrum visualization
- **Player** → Basic playback controls
- **Settings** → Basic settings
- **Paywall** → Upgrade to Pro screen

---

## 💎 PRO ВЕРСИЯ - Features

### Core Features:
1. **Full EQ (10-band)**
   - 10 frequency bands с individual sliders
   - Smooth slider interactions
   - Basic presets (Flat, Bass Boost, Treble, Vocal)
   - Smooth animations (spring animations)
   - Haptic feedback

2. **Bass Booster**
   - Dedicated bass enhancement
   - Adjustable bass level
   - Smooth controls

3. **3D Stereo Widen**
   - Stereo widening effect
   - Adjustable width
   - Spatial audio enhancement

4. **Gain + Limiter**
   - Gain control за volume boost
   - Limiter за предотвратяване на clipping
   - Automatic gain adjustment

5. **Presets System**
   - Basic presets (Flat, Bass Boost, Treble, Vocal)
   - Smooth transitions между presets
   - Visual preset indicators

6. **Unlimited Files**
   - Няма лимит на импортирани файлове
   - File management UI

7. **MAX Boost Mode**
   - Maximum boost capability
   - Simple dB gain mapping
   - "MAX MODE" toggle/button
   - Software gain boost

8. **No Ads**
   - Ad-free experience

9. **No Limits**
   - Всички features unlocked
   - Full functionality

### UI Screens (Pro):
- **Home** → Boost knob + MAX mode + spectrum
- **EQ** → 10-band sliders + preset buttons (Flat, Bass Boost, Treble, Vocal)
- **Player** → Full playback controls
- **Paywall** → Subscription management (restore, manage)
- **Settings** → Full settings

---

## 🎨 ДИЗАЙН ИЗИСКВАНИЯ

### Visual Design:
- **Dark Theme** (primary)
- **Modern, Clean UI**
- **Gradient Accents** (blue-to-green)
- **Smooth Animations** навсякъде където е необходимо

### Анимации - Къде са необходими:

#### 1. Volume Knob:
- ✅ Smooth rotation при drag
- ✅ Gradient color transition с volume change
- ✅ Haptic feedback при preset buttons
- ✅ Scale animation при tap
- ✅ Spring animations за natural feel

#### 2. Spectrum Analyzer:
- ✅ Smooth bar transitions (не instant jumps)
- ✅ Color transitions (blue → green с volume)
- ✅ Pulse effect при high frequencies
- ✅ Real-time updates (throttled за performance)

#### 3. EQ Sliders:
- ✅ Smooth value changes
- ✅ Spring animations
- ✅ Haptic feedback при adjustment
- ✅ Visual feedback (color change)
- ✅ Real-time slider value updates

#### 4. Screen Transitions:
- ✅ Smooth navigation между screens
- ✅ Fade transitions
- ✅ Slide animations
- ✅ No jarring movements

#### 5. Player Controls:
- ✅ Play/pause button animation
- ✅ Progress bar smooth updates
- ✅ Smooth seek interactions

#### 6. Preset Buttons:
- ✅ Smooth highlight animations
- ✅ Transition animations при preset change
- ✅ Visual indication на active preset

### Animation Standards:
- **Smooth** (spring animations)
- **Responsive** (haptic feedback)
- **Visual** (gradients, transitions)
- **Performance-optimized** (60fps, throttled updates)

---

## 🎛️ EQ ИЗИСКВАНИЯ

### Technical Requirements:
- **10-Band Equalizer**
  - Individual frequency bands
  - Gain range: -12dB to +12dB (или подобно)
  - Real-time processing
  - Smooth slider interactions

### Visual Requirements:
- **Smooth Sliders**
  - Vertical sliders за всяка честота
  - Spring animations
  - Visual feedback
  - Clear frequency labels

- **Preset Buttons**
  - Quick preset buttons (Flat, Bass Boost, Treble, Vocal)
  - Smooth transitions между presets
  - Visual preset indicators

### UX Requirements:
- **Smooth Interactions**
  - Spring animations за sliders
  - Haptic feedback при preset selection
  - Visual feedback при промяна
  - No lag или stuttering

- **Visual Design**
  - Dark theme с accent colors
  - Gradient indicators за boost/cut
  - Clear frequency labels
  - Preset buttons с icons

- **Performance**
  - Throttle updates (не всеки frame)
  - Optimize rendering за стари устройства
  - Smooth 60fps animations

---

## 🧰 TECH STACK

### Core:
- **AudioKit** - Core audio processing
- **AudioKitEX** - Extensions (ако е необходимо)
- **SoundpipeAudioKit** - Effects и filters

### UI:
- **AudioKitUI** - Visualization components (spectrum analyzer, FFTTap)
- **EqualizerIndicatorView** - EQ visualization (reference, не dependency)
- **swiftui-sliders** - Custom slider components

### Player:
- **AVFoundation** - Audio playback
- **Custom Player** - Built with AVFoundation + AudioKit (не SwiftUI-Music-Player dependency)

### Monetization:
- **RevenueCat** - Subscription management

---

## 📱 SCREENS STRUCTURE

### Free Version Screens:
1. **Home Screen**
   - Boost knob (0-30% max)
   - Spectrum visualization
   - Quick volume buttons (Mute, 30%, 60%, 100%)
   - "Unlock Pro" watermark
   - Music player integration

2. **Player Screen**
   - Basic playback controls
   - Current file info
   - Basic progress bar

3. **Settings Screen**
   - Basic settings
   - About
   - Upgrade to Pro button

4. **Paywall Screen**
   - Pro features list
   - Subscription options
   - Restore purchases

### Pro Version Screens (допълнителни):
5. **EQ Screen**
   - 10-band sliders
   - Preset buttons (Flat, Bass Boost, Treble, Vocal)
   - Smooth animations

6. **Settings Screen (Extended)**
   - Advanced settings
   - Subscription management

---

## 🚀 DEVELOPMENT PHASES - Free-First Approach

### STEP 1: Core Audio Engine POC
**Goal:** Validate audio pipeline и core functionality

**Tasks:**
- [ ] Xcode project setup
- [ ] Git repo connection (https://github.com/DechM/volume-booster.git)
- [ ] AudioKit + AudioKitEX + SoundpipeAudioKit SPM integration
- [ ] AVFoundation setup
- [ ] File import (Files app) - basic implementation
- [ ] Basic audio player (AVFoundation + AudioKit)
- [ ] Audio pipeline setup:
  - [ ] Gain node
  - [ ] Limiter node
  - [ ] Audio chain validation
- [ ] Basic audio playback testing
- [ ] Audio quality validation

**Deliverables:**
- Working audio engine
- File import functional
- Audio pipeline validated
- Ready for Free app build

**Testing:**
- ✅ Audio plays correctly
- ✅ No artifacts или clipping
- ✅ File import works
- ✅ Audio engine stable

---

### STEP 2: Free App Build ✅ COMPLETE
**Goal:** Complete Free version с всички features

**Tasks:**
- [x] SwiftUI app structure
- [x] Navigation structure (TabView)
- [x] Home Screen:
  - [x] Boost knob UI (0-30% max)
  - [x] Spectrum visualization (placeholder)
  - [x] Quick volume buttons (Mute, 30%, 60%, 100%)
  - [x] "Boost Lite" preset implementation
- [x] Player Screen:
  - [x] Play/pause controls
  - [x] Seek bar
  - [x] Current file info
- [x] File Import:
  - [x] Files app integration
  - [x] File limit enforcement (1 file for Free)
  - [x] File management UI
  - [x] Format validation (MP3, M4A for Free)
  - [x] Upgrade prompt for unsupported formats
- [x] Settings Screen:
  - [x] Basic settings
  - [x] About section
  - [x] "Upgrade to Pro" button
- [x] Watermark UX:
  - [x] "Unlock Pro" overlay/watermark
  - [x] Visual indication на locked features
- [x] Audio Engine:
  - [x] Mute functionality (gain = 0 pauses playback)
  - [x] Auto-resume after mute (when increasing gain)
  - [x] Play button disabled when gain = 0
  - [x] All print statements wrapped in #if DEBUG

**Deliverables:**
- ✅ Complete Free version
- ✅ All Free features working
- ✅ UI polished
- ✅ Ready for monetization shell

**Testing:**
- ✅ All Free features work
- ✅ File limit enforced (1 file)
- ✅ Watermark visible
- ✅ UI smooth и responsive
- ✅ Mute/auto-resume working
- ✅ Play button disabled at 0% gain

---

### STEP 3: Free Monetization Shell
**Goal:** Paywall UI и gating logic (без purchases още)

**Tasks:**
- [ ] Paywall Screen:
  - [ ] Pro features list
  - [ ] Subscription UI (без RevenueCat още)
  - [ ] "Subscribe" button (placeholder)
- [ ] Gating Logic:
  - [ ] Pro/Free state management
  - [ ] Feature locking (EQ, Bass, Stereo, MAX mode)
  - [ ] Navigation to Paywall от locked features
- [ ] Settings integration:
  - [ ] "Upgrade to Pro" button
  - [ ] Subscription status display (placeholder)

**Deliverables:**
- Paywall UI complete
- Gating logic working
- All Pro features locked
- Ready for RevenueCat integration

**Testing:**
- ✅ Pro features locked
- ✅ Paywall accessible
- ✅ Gating logic works
- ✅ No crashes

---

### STEP 4: Pro Features Build
**Goal:** Implement всички Pro features (само след като Free е stable!)

**Prerequisites:**
- ✅ Free version stable
- ✅ Free version tested
- ✅ Monetization shell working

**Tasks:**
- [ ] 10-Band EQ:
  - [ ] EQ sliders (AudioKit Equalizer)
  - [ ] Smooth slider animations
  - [ ] Preset buttons (Flat, Bass Boost, Treble, Vocal)
  - [ ] Haptic feedback
- [ ] Bass Booster:
  - [ ] Bass enhancement node
  - [ ] Adjustable bass level
  - [ ] Smooth controls
- [ ] 3D Stereo Widen:
  - [ ] Stereo widening effect
  - [ ] Adjustable width
- [ ] Gain + Limiter (enhancement):
  - [ ] Advanced gain control
  - [ ] Limiter optimization
- [ ] MAX Boost Mode:
  - [ ] dB gain mapping
  - [ ] "MAX MODE" toggle/button
  - [ ] Software gain boost
- [ ] Unlimited Files:
  - [ ] Remove file limit
  - [ ] File management enhancements

**Deliverables:**
- All Pro features implemented
- Pro features unlockable (чрез gating logic)
- Audio engine supports all features

**Testing:**
- ✅ All Pro features work
- ✅ Features unlock correctly
- ✅ Audio quality maintained
- ✅ No performance issues

---

### STEP 5: Animations & Polish
**Goal:** Smooth animations и UI polish

**Tasks:**
- [ ] Smooth knob animations (spring animations)
- [ ] Spectrum analyzer smooth updates
- [ ] EQ slider spring animations
- [ ] Screen transition animations
- [ ] Haptic feedback implementation
- [ ] Gradient transitions
- [ ] Performance optimization
- [ ] UI polish (spacing, colors, typography)

**Deliverables:**
- Smooth, polished UI
- All animations working
- Performance optimized

---

### STEP 6: RevenueCat Integration
**Goal:** Complete monetization с RevenueCat

**Tasks:**
- [ ] RevenueCat setup
- [ ] KeychainAppUserID implementation
- [ ] SubscriptionManager implementation
- [ ] PaywallView integration с RevenueCat
- [ ] Pro/Free gating logic integration
- [ ] Direct paywall (no trial)
- [ ] Restore purchases
- [ ] Subscription management

**Deliverables:**
- Complete monetization
- Pro/Free switching working
- RevenueCat integrated

---

### STEP 7: Testing & Submission
**Goal:** Testing, optimization, App Store submission

**Tasks:**
- [ ] Testing на различни устройства
- [ ] Performance testing
- [ ] Audio quality testing
- [ ] Edge cases testing
- [ ] App Store Connect setup
- [ ] Privacy Policy creation
- [ ] Screenshots preparation
- [ ] App Store submission
- [ ] TestFlight testing

**Deliverables:**
- App готов за submission
- All tests passed
- App Store Connect configured

---

## 📊 TIMELINE SUMMARY

| Step | Duration | Focus | Testing Required |
|------|----------|-------|------------------|
| Step 1: Core Audio Engine POC | 1 week | Audio pipeline validation | ✅ Yes |
| Step 2: Free App Build | 2 weeks | Complete Free version | ✅ Yes |
| Step 3: Free Monetization Shell | 1 week | Paywall UI + gating | ✅ Yes |
| Step 4: Pro Features Build | 2 weeks | Pro features (after Free stable) | ✅ Yes |
| Step 5: Animations & Polish | 1 week | UI polish | ✅ Yes |
| Step 6: RevenueCat Integration | 1 week | Monetization | ✅ Yes |
| Step 7: Testing & Submission | 2 weeks | Testing & submission | ✅ Yes |
| **TOTAL** | **10 weeks** | **Complete MVP** | **Step-by-step testing** |

### Important:
- **Тестваме след всяка стъпка** преди да продължим
- **Free version трябва да е stable** преди Pro features
- **Не пропускаме стъпки** - последователност е критична

---

## ✅ KEY REQUIREMENTS

### Audio Processing:
- ✅ In-app processing only (не system-wide)
- ✅ Real-time audio processing
- ✅ Support multiple audio formats (MP3, M4A, WAV, FLAC)
- ✅ No audio quality loss (или minimal)
- ✅ Smooth audio transitions

### UI/UX:
- ✅ Smooth animations навсякъде
- ✅ Haptic feedback за interactions
- ✅ Dark theme (primary)
- ✅ Modern, clean design
- ✅ Responsive на всички iPhone sizes
- ✅ Performance optimized (60fps)

### EQ Specific:
- ✅ Smooth 10-band EQ
- ✅ Basic preset management (Flat, Bass Boost, Treble, Vocal)
- ✅ Smooth slider interactions
- ✅ Spring animations

### Monetization:
- ✅ RevenueCat integration
- ✅ Monthly subscription only
- ✅ Direct paywall (NO trial)
- ✅ Pro/Free gating
- ✅ Restore purchases

---

## 🎯 SUCCESS CRITERIA

### Technical:
- [ ] Audio processing работи без artifacts
- [ ] Smooth 60fps animations
- [ ] No crashes или memory leaks
- [ ] Works на стари устройства (iPhone SE и по-нови)
- [ ] File import работи reliable

### UX:
- [ ] Smooth, responsive UI
- [ ] Intuitive navigation
- [ ] Clear Pro/Free distinction
- [ ] Beautiful, modern design
- [ ] Haptic feedback working

### Business:
- [ ] RevenueCat integration working
- [ ] Pro/Free switching seamless
- [ ] Direct paywall working (no trial)
- [ ] App Store ready

---

## 📝 NOTES

### Important:
- **НЕ** използвай system-wide audio claims
- **НЕ** показвай цени в UI или screenshots
- **НЕ** hardcode subscription details
- **ВИНАГИ** използвай stable App User ID (Keychain)
- **ВИНАГИ** smooth animations
- **ВИНАГИ** performance optimization

### Design Philosophy:
- **Smooth over fast** - по-добре smooth animations отколкото instant updates
- **Visual feedback** - винаги показвай какво се случва
- **Haptic feedback** - използвай за important interactions
- **Performance first** - оптимизирай за стари устройства

---

## 📁 PROJECT SETUP

### Local Structure:
```
cryptoflash/
└── volume-booster/
    ├── VolumeBooster.xcodeproj
    ├── VolumeBooster/
    │   ├── App/
    │   ├── Core/
    │   ├── Audio/
    │   ├── UI/
    │   └── Services/
    └── README.md
```

### Git Repository:
- **Remote:** https://github.com/DechM/volume-booster.git
- **Branch Strategy:** main branch, feature branches за всяка стъпка

### SPM Dependencies (всички библиотеки):
- AudioKit (https://github.com/AudioKit/AudioKit)
- AudioKitEX (https://github.com/AudioKit/AudioKitEX)
- SoundpipeAudioKit (https://github.com/AudioKit/SoundpipeAudioKit)
- AudioKitUI (https://github.com/AudioKit/AudioKitUI)
- swiftui-sliders (https://github.com/spacenation/swiftui-sliders)
- RevenueCat (https://github.com/RevenueCat/purchases-ios) - Step 6

### Reference (не dependencies):
- EqualizerIndicatorView (https://github.com/AlexGivens/EqualizerIndicatorView) - reference only
- SwiftUI-Music-Player (https://github.com/SwiftieDev/SwiftUI-Music-Player) - reference only

---

## 🚀 READY TO START

Всичко е планирано и готово за implementation. 

**Следваща стъпка:** Step 1 - Core Audio Engine POC

Когато кажеш "GO", започваме с:
1. Xcode project setup
2. Git repo connection
3. SPM dependencies integration
4. Core audio engine POC

🎧
