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

