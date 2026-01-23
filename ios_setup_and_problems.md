# iOS APP STORE SUBMISSION GUIDE
## Всичко което трябва да знаеш за iOS аповете

### 🚨 КРИТИЧНО - Какво НЕ трябва да се прави:

#### 1. IAP проблеми които водят до rejection:
- ❌ **НЕ** показвай error messages на потребителя при IAP failure
- ❌ **НЕ** използвай `print()` или `debugPrint()` в production код
- ❌ **НЕ** показвай цени ($4.99) в UI или скрийншоти
- ❌ **НЕ** декларирай UIBackgroundModes в Info.plist без реална нужда
- ❌ **НЕ** зареждай premium status от SharedPreferences при startup (винаги започвай с false, само IAP events активират premium)
- ❌ **НЕ** извиквай buyPremium() без delays и retry logic

#### 2. StoreKit специфики:
- ❌ **НЕ** очаквай че StoreKit е готов веднага - винаги използвай delays (500ms при init, 1000ms преди load products)
- ❌ **НЕ** прекратявай retry logic преди 5 опита с 3 секунди delay между тях
- ❌ **НЕ** забравяй да извикваш restorePurchases() при initialize() за автоматична активация на активни subscriptions

#### 3. UI и UX проблеми:
- ❌ **НЕ** използвай SnackBar за показване на IAP грешки
- ❌ **НЕ** показвай грешки при покупка дори и да fail-не
- ❌ **НЕ** оставяй loading state да остане зависнал ако покупката fail-не

---

### ✅ ПРАВИЛЕН IAP PATTERN (използван в BrainZen/MoodSnap/Decibel Meter):

#### Стъпка 1: InAppPurchaseService структура:

```dart
class InAppPurchaseService {
  // CRITICAL: Започва винаги с false, не чете от SharedPreferences!
  bool _isPremium = false;  // Започва с false!
  
  Future<void> initialize() async {
    // CRITICAL DELAY #1: StoreKit не е готов веднага
    await Future.delayed(const Duration(milliseconds: 500));
    
    _isAvailable = await _inAppPurchase.isAvailable();
    if (!_isAvailable) return;
    
    // Listen to purchase updates
    _subscription = _inAppPurchase.purchaseStream.listen(_handlePurchaseUpdate);
    
    // CRITICAL DELAY #2: Още малко време за StoreKit
    await Future.delayed(const Duration(milliseconds: 1000));
    
    // Load products с RETRY LOGIC (5 опита, 3 сек delay)
    await _loadProducts();
    
    // CRITICAL: Винаги restore purchases при init
    await restorePurchases();
  }
  
  Future<void> _loadProducts() async {
    // RETRY LOGIC: 5 опита, 3 секунди между тях
    for (int attempt = 1; attempt <= 5; attempt++) {
      try {
        final response = await _inAppPurchase.queryProductDetails(_productIds);
        if (response.productDetails.isNotEmpty) {
          _products = response.productDetails;
          return; // Success!
        }
        // Retry ако няма products
        if (attempt < 5) {
          await Future.delayed(const Duration(seconds: 3));
        }
      } catch (e) {
        if (attempt < 5) {
          await Future.delayed(const Duration(seconds: 3));
        }
      }
    }
  }
  
  Future<void> _handlePurchaseUpdate(List<PurchaseDetails> purchaseDetailsList) async {
    for (final PurchaseDetails purchaseDetails in purchaseDetailsList) {
      if (purchaseDetails.status == PurchaseStatus.purchased || 
          purchaseDetails.status == PurchaseStatus.restored) {
        
        // CRITICAL: Записваме premium status ПРЕДИ callback
        await SubscriptionService.setPro(true);  // Или PremiumService, etc.
        
        // iOS callback - извиква се ВЕДНАГА след setPro()
        if (Platform.isIOS) {
          onPurchaseCompleted?.call();
        }
        
        // Complete purchase
        if (purchaseDetails.pendingCompletePurchase) {
          await _inAppPurchase.completePurchase(purchaseDetails);
        }
      }
    }
  }
  
  Future<bool> purchaseProduct(String productId) async {
    // CRITICAL: Silent fail - НЕ хвърляй exceptions!
    if (!_isAvailable || _products.isEmpty) {
      return false; // Silent fail
    }
    
    // CRITICAL: Използвай buyNonConsumable за subscriptions
    await _inAppPurchase.buyNonConsumable(purchaseParam: purchaseParam);
    return true; // Всичко се обработва в purchaseStream
  }
  
  // Callbacks за iOS
  Function()? onPurchaseCompleted;
}
```

#### Стъпка 2: Provider структура:

```dart
class SubscriptionProvider extends ChangeNotifier {
  bool _isPro = false;  // ВИНАГИ започва с false!
  
  SubscriptionProvider() {
    // CRITICAL: НЕ зареждай от SharedPreferences в constructor!
    // Само IAP events обновяват това!
    _loadSubscriptionStatus();
  }
  
  Future<void> refresh() async {
    _isPro = await SubscriptionService.isPro();
    _remainingSessions = await SubscriptionService.getRemainingSessions();
    notifyListeners(); // CRITICAL: Винаги notifyListeners!
  }
}
```

#### Стъпка 3: Premium Screen (Upgrade Screen) с iOS callback:

```dart
class UpgradeScreen extends StatefulWidget {
  @override
  void initState() {
    super.initState();
    
    // CRITICAL: iOS callback за моментално обновяване
    if (Platform.isIOS) {
      final purchaseService = InAppPurchaseService();
      purchaseService.onPurchaseCompleted = () async {
        if (mounted) {
          final subscription = Provider.of<SubscriptionProvider>(context, listen: false);
          
          // CRITICAL: Чакай refresh да завърши!
          await subscription.refresh();
          
          // CRITICAL: Малко delay за UI update
          await Future.delayed(const Duration(milliseconds: 200));
          
          // CRITICAL: Pop екрана СЛЕД refresh
          if (mounted) {
            Navigator.pop(context);
          }
        }
      };
    }
  }
  
  @override
  void dispose() {
    // CRITICAL: Cleanup callback
    if (Platform.isIOS) {
      final purchaseService = InAppPurchaseService();
      purchaseService.onPurchaseCompleted = null;
    }
    super.dispose();
  }
  
  Future<void> _handlePurchase() async {
    // CRITICAL: Silent fail - НЕ показвай грешки!
    try {
      await purchaseService.purchaseProduct(productId);
      // НЕ показвай success тук - callback-а ще се погрижи
    } catch (e) {
      // Silent fail - нищо не правим
    }
  }
}
```

---

### 📱 APP STORE CONNECT SETUP:

#### Subscription Group и Product IDs:
1. Създаваш Subscription Group в App Store Connect
2. Product ID формат: `com.yourcompany.appname.premium.monthly.v2` (винаги `.v2` ако има стар subscription)
3. Ако има проблем с "Product ID already in use" - триеш старата група и subscription, правиш нова
4. Review Information - добавяш screenshot, description (минимално)
5. Localization - добавяш за всички езици които поддържаш

#### Pricing:
- App Price: ВИНАГИ "Free" (не $4.99!)
- Subscription Price: Set in subscription plan

#### Required Links:
- Privacy Policy URL: `https://dechm.github.io/appname-privacy/`
- Terms of Use: `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/` (iOS default)
- Support URL: Функционален URL (GitHub Pages: `https://dechm.github.io/appname-support/`)

---

### ⚠️ ВСИЧКИ APPLE REJECTIONS И РЕШЕНИЯ:

#### Guideline 2.1 - Performance - App Completeness
**Проблем:** "Unable to open purchase dialog" / "IAP bug"
**Решение:**
- Delays при StoreKit init (500ms + 1000ms)
- Retry logic за product loading (5 опита, 3 сек)
- restorePurchases() при initialize()
- Silent fail при buyPremium() errors

#### Guideline 2.3.7 - Performance - Accurate Metadata
**Проблем:** "Price in screenshots"
**Решение:**
- НЕ показвай цени в UI (премахни "$4.99/month" от buttons и текстове)
- НЕ качвай скрийншоти с цени
- Скрийншоти трябва да са: 1242×2688px, 2688×1242px, 1284×2778px или 2778×1284px

#### Guideline 2.5.4 - Performance - Software Requirements
**Проблем:** "UIBackgroundModes audio declared but no feature requires it"
**Решение:**
- Премахни `<key>UIBackgroundModes</key>` от Info.plist ако не използваш background audio

#### Guideline 3.1.2 - Business - Payments
**Проблем:** "Missing Terms of Use and Privacy Policy links"
**Решение:**
- Добави Terms of Use link (Apple default)
- Добави Privacy Policy link (GitHub Pages)
- Всички links трябва да са функционални

#### Guideline 1.5 - Safety
**Проблем:** "Support URL not functional"
**Решение:**
- Създай GitHub Pages репо за support: `appname-support`
- Активирай GitHub Pages (main branch, /root)
- Обнови Support URL в App Store Connect

---

### ✅ ПРЕД SUBMISSION ЧЕКЛИСТ:

- [ ] Версията е обновена в pubspec.yaml (`version: 1.0.0+X`)
- [ ] `flutter clean` + `flutter pub get` + `pod install`
- [ ] Всички `debugPrint`/`print` statements са премахнати
- [ ] Цените са премахнати от UI и скрийншоти
- [ ] UIBackgroundModes е премахнат (ако не е нужен)
- [ ] Launch screen показва правилното име (не "FlowZen" ако е "BrainZen")
- [ ] IAP Product IDs в кода съвпадат с App Store Connect
- [ ] Privacy Policy и Terms of Use links са добавени и функционални
- [ ] Support URL е функционален
- [ ] App Price е "Free" (не $4.99)
- [ ] Билдът компилира без грешки
- [ ] Тестван IAP flow на real device (sandbox account)

---

### 💡 КЛЮЧОВИ LESSONS LEARNED:

1. **StoreKit не е синхронен** - винаги използвай delays
2. **Premium status = false при startup**, само IAP events го активират
3. **iOS callbacks са критични** за моментално UI update - ВИНАГИ използвай `onPurchaseCompleted` callback за iOS в Premium screen (виж Стъпка 3). БЕЗ него UI не се обновява моментално след покупка (Decibel Meter пример - работи но не е оптимално, трябва да се върне на home screen за да се обнови)
4. **Silent fail винаги** - НЕ показвай грешки на потребителя
5. **restorePurchases() автоматично активира** активни subscriptions
6. **НЕ показвай цени в UI или скрийншоти**
7. **Всички external links трябва да са функционални**
8. **App price трябва да е "Free"** ако имаш IAP subscriptions

---

### ⚠️ ITMS-91061: Missing privacy manifest за third-party SDKs

#### Проблем: "Missing privacy manifest - Your app includes share_plus.framework/share_plus"

**Грешка от Apple:**
```
ITMS-91061: Missing privacy manifest - Your app includes "Frameworks/share_plus.framework/share_plus", 
which includes share_plus, an SDK that was identified in the documentation as a commonly used third-party SDK. 
If a new app includes a commonly used third-party SDK, or an app update adds a commonly used third-party SDK, 
the SDK must include a privacy manifest file.
```

**Причина:**
- Apple изисква privacy manifest файлове за определени third-party SDKs (виж: https://developer.apple.com/support/third-party-SDK-requirements)
- Privacy manifest файлът трябва да е **вграден вътре в SDK framework-а**, не само в приложението
- Старите версии на `share_plus` (преди 10.1.2) нямат privacy manifest

**Решение:**

1. **Ъпдейтни SDK-то до версия, която има privacy manifest вграден:**
   - За `share_plus`: използвай версия `>= 10.1.2` или по-нова (препоръчително: `^12.0.1`)
   - В `pubspec.yaml`: `share_plus: ^12.0.1`

2. **Почисти кеша и направи чиста инсталация:**
   ```bash
   flutter clean
   rm -rf ios/Pods ios/Podfile.lock
   rm -rf ~/Library/Developer/Xcode/DerivedData
   flutter pub get
   cd ios && pod install --repo-update && cd ..
   ```

3. **Тествай че privacy manifest файлът е в build-а:**
   ```bash
   # Провери в build директорията:
   find build/ios/iphoneos -path "*share_plus.framework*" -name "PrivacyInfo.xcprivacy"
   
   # Трябва да видиш:
   # build/ios/iphoneos/Runner.app/Frameworks/share_plus.framework/share_plus_privacy.bundle/PrivacyInfo.xcprivacy
   ```

4. **Провери в архива (след архивиране в Xcode):**
   ```bash
   ls -la ~/Library/Developer/Xcode/Archives/[дата]/[архив].xcarchive/Products/Applications/Runner.app/Frameworks/share_plus.framework/
   ls -la ~/Library/Developer/Xcode/Archives/[дата]/[архив].xcarchive/Products/Applications/Runner.app/Frameworks/share_plus.framework/share_plus_privacy.bundle/
   ```
   
   Трябва да видиш `share_plus_privacy.bundle/PrivacyInfo.xcprivacy` в framework-а.

**ВАЖНО:**
- ❌ **НЕ** добавяй PrivacyInfo.xcprivacy файл в Runner target - това НЕ работи
- ✅ Privacy manifest файлът трябва да е **вграден в SDK framework-а**
- ✅ Ъпдейтвай SDK-то до версия, която има privacy manifest (най-лесното решение)

**Списък на SDKs, които изискват privacy manifest:**
- Виж: https://developer.apple.com/support/third-party-SDK-requirements
- Включва: `share_plus`, `file_picker`, `sqflite`, `flutter_local_notifications`, и много други

**Референции:**
- Apple документация: https://developer.apple.com/support/third-party-SDK-requirements
- WWDC видео: https://developer.apple.com/videos/play/wwdc2023/10060/
- Privacy manifests: https://developer.apple.com/documentation/bundleresources/describing-data-use-in-privacy-manifests

---

### ⚠️ Guideline 3.1.2 - Business - Payments - Subscriptions: Missing Terms of Use в App Store metadata

**Проблем:** "The submission did not include all the required information for apps offering auto-renewable subscriptions. A functional link to the Terms of Use (EULA) needs to be included in the App Store metadata."

**Решение:**
- Добави Terms of Use линк в **App Store Connect → App Description**
- Стандартният Apple Terms of Use линк: `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`
- Ако използваш custom EULA, качи го в EULA field в App Store Connect

**ВАЖНО:** Това е само metadata промяна - НЕ изисква нов билд, само обновяване на App Description в App Store Connect.

---

### ⚠️ Guideline 3.1.2 - Business - Payments - Subscriptions: Required Information in App

**Проблем:** "The submission did not include all the required information for apps offering auto-renewable subscriptions. The following information needs to be included within the app: - Title of auto-renewing subscription - Length of subscription - Price of subscription"

**Решение:**
- ✅ **Title, Length, и Price трябва да се взимат ДИНАМИЧНО от RevenueCat/StoreKit**, не да са hardcoded
- ✅ Използвай `Package.storeProduct.priceString` за цената (локализирана от StoreKit)
- ✅ Използвай `Package.storeProduct.title` за заглавието (ако е нужно)
- ✅ Използвай `Package.storeProduct.subscriptionPeriod` за дължината (ако е нужно)
- ❌ **НЕ** hardcode-вай цени като `'\$4.99'` в UI
- ❌ **НЕ** hardcode-вай subscription title или length

**Пример (RevenueCat):**
```dart
// В Premium Screen initState():
Future<void> _loadPackageInfo() async {
  try {
    final package = await _revenueCatService.getMonthlyPackage();
    if (mounted) {
      setState(() {
        _monthlyPackage = package;
        _isLoadingPackage = false;
      });
    }
  } catch (e) {
    if (mounted) {
      setState(() {
        _isLoadingPackage = false;
      });
    }
  }
}

// В UI:
String subscriptionPrice = 'Loading...';
if (_monthlyPackage != null) {
  subscriptionPrice = _monthlyPackage!.storeProduct.priceString; // Dynamic from StoreKit
} else if (!_isLoadingPackage) {
  subscriptionPrice = '—'; // Fallback
}
```

**ВАЖНО:** Apple изисква всички subscription details (title, length, price) да се показват в app-а и да са динамични от StoreKit, не hardcoded.

---

### ⚠️ Black Screen After Successful Purchase (RevenueCat + iOS)

**Проблем:** След успешна покупка (когато се показва "All set" от StoreKit), ап-ът показва черен екран и остава такъв.

**Причина:**
1. **Двойно викане на `Navigator.pop()`:**
   - iOS callback `onPurchaseCompleted` вика `Navigator.pop(context, true)` (след refresh)
   - `_handlePurchase()` също вика `navigator.pop(true)` (след успешна покупка)
   - Резултат: два пъти `Navigator.pop()` → може да се затвори и Home screen-ът

2. **MaterialApp rebuild по време на покупката:**
   - RevenueCat `addCustomerInfoUpdateListener` вика `onSubscriptionStatusChanged`
   - Това вика `notifyListeners()` в SubscriptionProvider
   - MaterialApp се rebuild-ва (Consumer2 реагира на notifyListeners)
   - Когато MaterialApp се rebuild-ва, navigator stack-ът може да се загуби
   - Когато се вика `Navigator.pop()` два пъти, може да се затвори целия navigator stack

**Решение:**

1. **Премахни `Navigator.pop()` от iOS callback-а:**
   ```dart
   // iOS callback for immediate UI update
   // CRITICAL: Only refresh subscription status, do NOT call Navigator.pop() here
   // Navigator.pop() is handled in _handlePurchase() to avoid double pop and black screen
   if (Platform.isIOS) {
     _revenueCatService.onPurchaseCompleted = () async {
       if (mounted) {
         final subscription = Provider.of<SubscriptionProvider>(context, listen: false);
         await subscription.refresh();
         // Do NOT call Navigator.pop() here - it's handled in _handlePurchase()
       }
     };
   }
   ```

2. **Остави само `Navigator.pop()` в `_handlePurchase()` с guard check:**
   ```dart
   if (mounted) {
     setState(() {
       _isPurchasing = false;
     });
     
     // CRITICAL: Guard check to prevent pop when no route in stack (prevents black screen)
     if (subscription.isPro && navigator.canPop()) {
       navigator.pop(true);
     }
   }
   ```

**Правила:**
- ✅ iOS callback-ът само refresh-ва subscription status, без navigation
- ✅ `Navigator.pop()` се вика само веднъж в `_handlePurchase()` с guard check
- ✅ Guard check `navigator.canPop()` предотвратява pop когато няма route в stack-а

**ВАЖНО:** Винаги използвай guard check `Navigator.of(context).canPop()` преди `Navigator.pop()` за да избегнеш black screen при navigation errors.
