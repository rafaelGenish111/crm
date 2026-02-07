# CRM Demo

## פריסה ל-Vercel

הפרויקט מוכן לפריסה ל-Vercel. לפרטים מלאים, ראה [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

### פריסה מהירה:

1. **העלה את הקוד ל-GitHub/GitLab/Bitbucket**
2. **היכנס ל-[Vercel Dashboard](https://vercel.com/dashboard)**
3. **לחץ על "Add New Project" ובחר את ה-repository**
4. **הגדר משתני סביבה:**
   - `MONGODB_URI` - כתובת MongoDB Atlas
   - `JWT_SECRET` - מפתח סודי ל-JWT
   - `VITE_API_URL` - כתובת ה-API (לאחר הפריסה)
5. **Deploy!**

לפרטים נוספים, ראה [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

---

# CRM Demo - Monorepo

A modern CRM application built with React and Node.js in a monorepo structure.

## 🏗️ Architecture

```
/ (Root)
├── /client          # React Frontend (Vite)
├── /server          # Node.js/Express Backend
├── .cursor/         # Agent Rules & Skills
└── package.json     # Root workspace scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install all workspace dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your MongoDB connection string
   ```

### Development

**Run both client and server concurrently:**
```bash
npm run dev
```

**Run individually:**
```bash
# Client only (port 5173)
npm run dev:client

# Server only (port 5000)
npm run dev:server
```

### Build

```bash
# Build both
npm run build

# Build individually
npm run build:client
npm run build:server
```

## 📁 Project Structure

### Client (`/client`)
- React application with Vite
- Modern React patterns (Hooks, Context)
- React Router for navigation

### Server (`/server`)
- Express.js REST API
- MongoDB with Mongoose
- Structured folder organization:
  - `src/routes` - API routes
  - `src/controllers` - Business logic
  - `src/models` - Mongoose schemas
  - `src/middleware` - Express middleware
  - `src/services` - External service integrations
  - `src/config` - Configuration files

## 🔧 Tech Stack

- **Frontend**: React, Vite, React Router, Tailwind CSS, PWA Support
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Development**: Nodemon, Concurrently

## 🎓 Student Portal

The application includes a dedicated student portal accessible at `/student/*` routes:

- **Student Authentication**: Login with email/phone and initial password
- **Student Dashboard**: Overview of courses, grades, and recommended workshops
- **Course Management**: View course details, syllabus, and schedule
- **Grades**: View grades by course with charts and statistics
- **Workshops**: Browse and view recommended workshops
- **Profile Management**: Update profile and change password

### Student Portal Routes

- `/student/login` - Student login page
- `/student` - Student dashboard
- `/student/courses` - List of enrolled courses
- `/student/courses/:id` - Course details with syllabus and schedule
- `/student/grades` - All grades with statistics
- `/student/workshops` - Recommended workshops
- `/student/profile` - Student profile
- `/student/change-password` - Change password page

## 📱 PWA Support

The application is configured as a Progressive Web App (PWA):

- **Offline Support**: Service worker with caching strategies
- **Installable**: Can be installed on mobile devices
- **Mobile Optimized**: Responsive design with bottom navigation for mobile
- **Icons**: PWA icons configured (generate PNGs from SVG in `client/public/pwa-icon.svg`)

To generate PWA icons, use the script in `client/public/generate-icons.cjs` or convert the SVG manually.

## 📝 Notes

- This is a strict MONOREPO structure
- No separate git repositories in subfolders
- Authentication modules are within `/server` and `/client`, not separate projects
- Student portal uses separate authentication from admin portal
- PWA configuration is in `client/vite.config.js`
