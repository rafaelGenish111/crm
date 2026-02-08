# הוראות פריסה ל-Vercel

מדריך זה מסביר כיצד להעלות את האפליקציה ל-Vercel - גם צד לקוח וגם צד שרת.

## אפשרויות פריסה

יש שתי אפשרויות עיקריות:

### אפשרות 1: Monorepo (מומלץ)
פריסה של כל הפרויקט כ-monorepo אחד ב-Vercel.

### אפשרות 2: שני פרויקטים נפרדים
הפרדה לשתי פרויקטים נפרדים ב-Vercel.

---

## אפשרות 1: Monorepo (מומלץ)

### דרישות מוקדמות
1. חשבון Vercel (חינמי)
2. MongoDB Atlas או MongoDB instance
3. Git repository (GitHub/GitLab/Bitbucket)

### שלבים

#### 1. הכנת הפרויקט

```bash
# ודא שהכל עובד מקומית
npm run build
```

#### 2. יצירת פרויקט ב-Vercel

1. היכנס ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. לחץ על "Add New Project"
3. בחר את ה-repository שלך
4. Vercel יזהה אוטומטית את `vercel.json`

#### 3. הגדרת משתני סביבה

ב-Vercel Dashboard, עבור ל-Settings > Environment Variables והוסף:

**חובה:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm-demo
JWT_SECRET=your-very-secure-secret-key-min-32-chars
NODE_ENV=production
```

**לעוזר AI (בוט סטודנטים):**
```
OPENAI_API_KEY=sk-proj-...
AI_MODEL=gpt-4
```

**אופציונלי:**
```
VITE_API_URL=https://your-project.vercel.app/api
FRONTEND_URL=https://your-project.vercel.app
API_URL=https://your-project.vercel.app
```

#### 4. Build Settings

ב-Vercel, הגדר:
- **Root Directory**: (השאר ריק - root של הפרויקט)
- **Build Command**: `cd client && npm install && npm run build`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install && cd client && npm install && cd ../server && npm install`

#### 5. Deploy

לחץ על "Deploy" ו-Vercel יבנה ויפרס את הפרויקט.

---

## אפשרות 2: שני פרויקטים נפרדים

### Frontend (Client)

#### 1. יצירת פרויקט חדש ב-Vercel
- בחר את ה-repository
- Root Directory: `client`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

#### 2. משתני סביבה
```
VITE_API_URL=https://your-backend.vercel.app/api
```

### Backend (Server)

#### 1. יצירת פרויקט חדש ב-Vercel
- בחר את אותו repository
- Root Directory: `server`
- Framework Preset: Other
- Build Command: (השאר ריק)
- Output Directory: (השאר ריק)

#### 2. יצירת `vercel.json` בתיקיית server

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

#### 3. עדכון `server/index.js` ל-Vercel

```javascript
require('dotenv').config();
const app = require('./src/app');

// Vercel serverless function
module.exports = app;
```

#### 4. משתני סביבה
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
NODE_ENV=production
```

---

## הגדרת MongoDB Atlas

1. היכנס ל-[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. צור cluster חדש (חינמי)
3. צור משתמש database
4. הוסף IP address (0.0.0.0/0 לכל ה-IPs או IP של Vercel)
5. קבל את ה-connection string
6. החלף `<password>` בסיסמה שיצרת

---

## בדיקת הפריסה

לאחר הפריסה:

1. **Frontend**: `https://your-project.vercel.app`
2. **Backend API**: `https://your-project.vercel.app/api/health`

### בדיקות

```bash
# בדיקת health check
curl https://your-project.vercel.app/api/health

# צפוי לקבל:
# {"status":"ok","message":"CRM API is running"}
```

---

## פתרון בעיות נפוצות

### שגיאת MongoDB Connection
- ודא ש-MONGODB_URI נכון
- ודא ש-IP address נוסף ל-whitelist ב-MongoDB Atlas
- ודא שהסיסמה נכונה

### שגיאת CORS
- ודא ש-CORS מוגדר נכון ב-`server/src/app.js`
- הוסף את ה-URL של ה-frontend ל-CORS

### שגיאת Build
- ודא שכל ה-dependencies מותקנים
- בדוק את ה-logs ב-Vercel Dashboard

### שגיאת 404 ב-routes
- ודא ש-`vercel.json` מוגדר נכון
- ודא שה-routes מוגדרים נכון

### הבוט לא מגיב (עוזר AI)
1. **OPENAI_API_KEY** – ודא שהוגדר ב-Vercel: Settings → Environment Variables
2. **מפתח תקין** – וודא שה־API key תקף ובעל יתרה ב־OpenAI
3. **מודל** – AI_MODEL=gpt-4 או gpt-3.5-turbo (gpt-5 לא קיים)

### שגיאת 500 (Internal Server Error)
1. **בדוק את הלוגים** – Vercel Dashboard → Project → Logs (או Deployments → בחר deployment → Function Logs)
2. **משתני סביבה** – ודא ש-MONGODB_URI ו-JWT_SECRET מוגדרים ב-Settings → Environment Variables
3. **MongoDB Atlas** – Network Access חייב לכלול `0.0.0.0/0` (או את IP של Vercel) – Serverless עובד מכל מיקום
4. **בדיקת חיבור** – `curl https://your-project.vercel.app/api/health` – אם מחזיר JSON, השרת רץ

---

## עדכונים עתידיים

לכל push ל-main branch, Vercel יבצע deploy אוטומטי.

---

## תמיכה

לשאלות ותמיכה, בדוק את ה-[Vercel Documentation](https://vercel.com/docs).
