# Dependencies & Extensions Check

## ✅ All Required Dependencies

### Production Dependencies
```json
{
  "@hello-pangea/dnd": "^18.0.1",        // Drag and drop for Kanban
  "@supabase/supabase-js": "^2.89.0",    // Supabase client
  "@tailwindcss/typography": "^0.5.19",  // Typography plugin
  "classnames": "^2.5.1",                // CSS class utilities
  "date-fns": "^4.1.0",                  // Date formatting
  "dotenv": "^17.2.3",                   // Environment variables
  "lucide-react": "^0.562.0",            // Icons
  "next": "15.5.4",                      // Next.js framework
  "nodemailer": "^6.9.8",                // Email sending (REQUIRED)
  "react": "19.1.0",                     // React
  "react-dom": "19.1.0",                 // React DOM
  "react-markdown": "^10.1.0",           // Markdown rendering
  "remark-breaks": "^4.0.0",             // Markdown breaks
  "uuid": "^13.0.0",                     // UUID generation
  "zustand": "^5.0.8"                   // State management
}
```

### Development Dependencies
```json
{
  "@eslint/eslintrc": "^3",              // ESLint config
  "@tailwindcss/postcss": "^4",          // Tailwind PostCSS
  "@types/node": "^20",                  // Node.js types
  "@types/nodemailer": "^6.4.14",       // Nodemailer types (REQUIRED)
  "@types/react": "^19",                 // React types
  "@types/react-dom": "^19",             // React DOM types
  "eslint": "^9",                        // Linter
  "eslint-config-next": "15.5.4",        // Next.js ESLint config
  "tailwindcss": "^4",                   // Tailwind CSS
  "typescript": "^5"                     // TypeScript
}
```

## 🔧 Installation Steps

### 1. Install All Dependencies
```bash
npm install
```

### 2. Install Missing Dependencies (if needed)
```bash
npm install nodemailer @types/nodemailer
```

### 3. Verify Installation
```bash
npm list --depth=0
```

## 📋 Required Environment Variables

Create `.env.local` file in project root:

```env
# Email Configuration (REQUIRED for email notifications)
EMAIL_USER=main.justin.villagracia@cvsu.edu.ph
EMAIL_PASSWORD=psbi nocr ncdb jodx

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🐛 Common Issues & Fixes

### Issue 1: Missing nodemailer
**Error**: `Cannot find module 'nodemailer'`
**Fix**: 
```bash
npm install nodemailer @types/nodemailer
```

### Issue 2: Missing @types/nodemailer
**Error**: `Cannot find module '@types/nodemailer'`
**Fix**:
```bash
npm install --save-dev @types/nodemailer
```

### Issue 3: Duplicate imports
**Error**: `'Clock' is already declared`
**Fix**: Remove duplicate imports (already fixed in code)

### Issue 4: Module resolution errors
**Error**: `Cannot resolve module '@/lib/...'`
**Fix**: Check `tsconfig.json` has correct paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 🚀 Run Commands

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

### Lint
```bash
npm run lint
```

## 📦 Node.js Version

**Required**: Node.js 18.x or higher

Check version:
```bash
node --version
```

## 🔍 Verification Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] `.env.local` file created with email credentials
- [ ] Supabase credentials configured
- [ ] Node.js version >= 18
- [ ] No duplicate imports
- [ ] TypeScript compiles without errors (`npm run build`)

## 🛠️ If Still Having Issues

1. **Clear node_modules and reinstall**:
```bash
rm -rf node_modules package-lock.json
npm install
```

2. **Check for TypeScript errors**:
```bash
npx tsc --noEmit
```

3. **Check Next.js build**:
```bash
npm run build
```

4. **Check for missing types**:
```bash
npm install --save-dev @types/node @types/react @types/react-dom @types/nodemailer
```

## 📝 File Extensions Used

- `.ts` - TypeScript files
- `.tsx` - TypeScript React components
- `.js` - JavaScript files (if any)
- `.json` - Configuration files
- `.css` - Stylesheets
- `.md` - Markdown documentation

## 🔗 Key Imports to Verify

### Priority Detection
- `@/lib/priority` - Priority detection functions

### Email Service
- `@/lib/email` - Email notification functions
- `nodemailer` - Email sending library

### Data Hooks
- `@/lib/data` - useTickets, useRules, useCustomers hooks

### UI Components
- `lucide-react` - Icons
- `next/image` - Next.js Image component
- `next/link` - Next.js Link component

### Utilities
- `uuid` - UUID generation
- `@supabase/supabase-js` - Supabase client

---

**All dependencies should now be properly installed!** ✅
