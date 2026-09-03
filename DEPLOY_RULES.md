# Securing your Firebase project (do this once)

Your data is only as safe as the Firestore rules that are *actually deployed*
on Firebase's servers. The `firestore.rules` file in this repo does nothing
until you push it. Two one-time steps:

## 1. Create your login

This app now requires sign-in. There's no public sign-up screen (on purpose -
this is a solo admin tool), so create your own account:

1. Go to the [Firebase Console](https://console.firebase.google.com/) -> your project (`udhaya-aquatics-orders`).
2. **Authentication** -> **Sign-in method** -> enable **Email/Password**.
3. **Authentication** -> **Users** -> **Add user** -> enter the email and
   password you want to log in with on the website.

## 2. Deploy the security rules

From the project folder:

```bash
npm install -g firebase-tools   # one-time
firebase login
firebase init firestore          # choose your existing project, keep firestore.rules as-is
firebase deploy --only firestore:rules
```

Until you deploy these rules, anyone who has your Firebase config (which is
visible in the browser's network tab, by design) can read and write every
order directly, login screen or not. The login screen keeps honest people
out of the UI; the Firestore rules are what actually enforce it.

## 3. Rotate your API key (recommended, one-time)

Your old Firebase config was committed to this repo's git history with a
hardcoded API key. If this repo has ever been pushed to a public GitHub
remote, treat that key as exposed:

1. Firebase Console -> Project Settings -> General -> your web app -> you
   can't "rotate" a Firebase web API key the way you would a server secret,
   but you *can* (and should) restrict it: go to
   [Google Cloud Console -> APIs & Credentials](https://console.cloud.google.com/apis/credentials),
   find the key, and restrict it to your app's domain(s) under
   "Application restrictions" -> "HTTP referrers".
2. Make sure the Firestore rules above are deployed - that's what actually
   stops unauthorized reads/writes, not the key itself.
