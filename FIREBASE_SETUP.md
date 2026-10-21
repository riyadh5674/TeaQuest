# 🔥 Firebase Setup Guide for TeaQuest

This guide will help you set up Firebase for TeaQuest with all the required services.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name: `teaquest` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click **"Create project"**

## 2. Enable Authentication

1. In the left sidebar, go to **Authentication** → **Sign-in method**
2. Click **Email/Password**
3. Enable **"Email/Password"** and **"Email link (passwordless sign-in)"**
4. Save
5. (Optional) Add authorized domains: `localhost`, `your-domain.com`

## 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click **"Create database"**
3. Start in **production mode** (we'll apply security rules)
4. Choose a location close to your users
5. Click **"Enable"**

## 4. Apply Security Rules

1. In Firestore, go to **Rules** tab
2. Replace with the rules from `supabase/schema.sql` (adapted for Firestore):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isAdmin() {
      return exists(/databases/$(database)/documents/profiles/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Profiles: users read/edit themselves, admins read all
    match /profiles/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Products: everyone reads, admins write
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Orders: users read own, admins read all; users create own; admins update
    match /orders/{orderId} {
      allow read: if isOwner(resource.data.user_id) || isAdmin();
      allow create: if isOwner(request.resource.data.user_id);
      allow update: if isOwner(resource.data.user_id) || isAdmin();
      allow delete: if isAdmin();
    }

    // Order items: visible if parent order is visible
    match /order_items/{itemId} {
      allow read: if exists(/databases/$(database)/documents/orders/$(resource.data.order_id)) &&
                      (isOwner(get(/databases/$(database)/documents/orders/$(resource.data.order_id)).data.user_id) || isAdmin());
      allow create: if isOwner(get(/databases/$(database)/documents/orders/$(resource.data.order_id)).data.user_id);
    }

    // Favorites: private to each user
    match /favorites/{userId}/{productId} {
      allow read, write: if isOwner(userId);
    }

    // Friendships
    match /friendships/{friendshipId} {
      allow read: if isOwner(resource.data.requester_id) || isOwner(resource.data.addressee_id);
      allow create: if isOwner(request.resource.data.requester_id);
      allow update: if isOwner(resource.data.addressee_id);
      allow delete: if isOwner(resource.data.requester_id) || isOwner(resource.data.addressee_id);
    }

    // Direct messages: only between buddies
    match /direct_messages/{messageId} {
      allow read: if isOwner(resource.data.sender_id) || isOwner(resource.data.recipient_id);
      allow create: if isOwner(request.resource.data.sender_id) &&
                        isOwner(request.resource.data.recipient_id) == false &&
                        exists(/databases/$(database)/documents/friendships/$(request.resource.data.sender_id)_$(request.resource.data.recipient_id));
      allow delete: if isOwner(resource.data.sender_id);
    }

    // Tavern messages: all authenticated users can read, sender can create/delete
    match /tavern_messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if isOwner(request.resource.data.sender_id);
      allow delete: if isOwner(resource.data.sender_id);
    }

    // Presence: all authenticated users
    match /presence/{userId} {
      allow read: if request.auth != null;
      allow write: if isOwner(userId);
    }
  }
}
```

3. Click **"Publish"**

## 5. Enable Storage

1. Go to **Storage**
2. Click **"Get started"**
3. Start in **production mode**
4. Choose same location as Firestore
4. Go to **Rules** tab and apply:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tavern_media/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth.uid == userId &&
                       request.resource.size < 8 * 1024 * 1024 && // 8MB max
                       request.resource.contentType.matches('image/.*|video/.*|audio/.*|application/pdf|text/plain') &&
                       !request.resource.contentType.matches('image/svg\\+xml');
      allow delete: if request.auth.uid == userId;
    }
  }
}
```

## 6. Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps**
3. Click **Web app** (</>) icon
4. Register app: `TeaQuest Web`
5. Copy the config object

## 7. Configure TeaQuest

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase config:
   ```env
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

3. For local development, add to `index.html` before the Firebase scripts:
   ```html
   <script>
     window.FIREBASE_CONFIG = {
       apiKey: "your-api-key",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "your-sender-id",
       appId: "1:123456789:web:abcdef123456"
     };
   </script>
   ```

## 8. Apply Database Schema

Run the SQL from `supabase/schema.sql` in your Firestore (you'll need to create collections manually or use the Firebase Admin SDK):

Key collections to create:
- `profiles` (auto-created on signup)
- `products` (seed with the 8 teas from schema)
- `orders`
- `order_items`
- `favorites`
- `friendships`
- `direct_messages`
- `tavern_messages`
- `presence`

## 9. Seed Products

In Firebase Console → Firestore, create `products` collection with these documents (use the IDs from schema):

```json
{
  "id": "tea-001",
  "name": "Forest Mint",
  "category": "green",
  "price": 12,
  "icon": "🌿",
  "rating": 4.9,
  "rarity": "common",
  "origin": "Misty Highland Slopes",
  "flavor_notes": "Cool, Grassy, Bright",
  "moods": ["calm", "focused"],
  "flavor_profile": ["fresh"],
  "strength": "light",
  "description": "Fresh mountain green tea with cool mint leaves.",
  "stock": 50,
  "created_at": {"__type__": "server_timestamp"}
}
```
(Repeat for all 8 teas from schema.sql)

## 10. Make First User Admin

After creating your account, run in Firestore console:
```javascript
db.collection('profiles').doc('YOUR_USER_UID').update({role: 'admin'})
```

Or use the SQL from schema.sql:
```sql
update public.profiles set role = 'admin' where email = 'your-email@example.com';
```

## 11. Test Locally

```bash
npm ci
npm run dev
```

Visit `http://localhost:3000` and test:
- ✅ Sign up with new extended form
- ✅ Login/logout
- ✅ Profile page shows all fields
- ✅ Shop, cart, checkout
- ✅ Tavern chat (if enabled)
- ✅ Arcade games

## 12. Deploy to Production

1. Push to GitHub (triggers GitHub Actions)
2. Configure GitHub Secrets:
   - `FIREBASE_SERVICE_ACCOUNT` (from Firebase Console → Project Settings → Service Accounts)
   - `FIREBASE_PROJECT_ID`
   - All FIREBASE_* vars
3. GitHub Actions will build and deploy to Firebase Hosting

## Troubleshooting

**"Cannot reach server" error:**
- Check FIREBASE_CONFIG in index.html or .env.local
- Verify Firestore rules are published
- Check browser console for CORS errors
- Ensure Authentication is enabled

**Signup fails:**
- Check Firestore rules allow profile creation
- Verify email/password auth is enabled
- Check browser console for detailed error

**Tavern not loading:**
- Ensure Realtime Database is enabled (for presence)
- Check Firestore rules for friendships/direct_messages/tavern_messages

## Security Checklist

- [ ] Firestore rules published
- [ ] Storage rules published
- [ ] Auth providers configured
- [ ] Authorized domains set
- [ ] Admin role assigned to your account
- [ ] Products seeded
- [ ] Environment variables set in production
- [ ] GitHub Actions secrets configured