# Environment Variables Setup

## ⚠️ Error: "System is currently offline"

This error occurs when Supabase is not properly configured. You need to add Supabase credentials to your `.env.local` file.

## 📋 Required Environment Variables

Your `.env.local` file should contain:

```env
# Email Configuration
EMAIL_USER=main.justin.villagracia@cvsu.edu.ph
EMAIL_PASSWORD=psbi nocr ncdb jodx

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🔧 How to Get Supabase Credentials

1. **Go to your Supabase project**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Settings → API**
4. **Copy the following**:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📝 Example .env.local

```env
# Email Configuration
EMAIL_USER=main.justin.villagracia@cvsu.edu.ph
EMAIL_PASSWORD=psbi nocr ncdb jodx

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTIzNDU2NywiZXhwIjoxOTU2ODEwNTY3fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## ⚡ After Adding Credentials

1. **Save the `.env.local` file**
2. **Restart your dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

## ✅ Verification

After restarting, the chat should work and you should be able to create tickets without the "System is currently offline" error.

## 🔍 Troubleshooting

### Still seeing the error?
1. Make sure `.env.local` is in the project root (same folder as `package.json`)
2. Make sure variable names start with `NEXT_PUBLIC_` (required for client-side access)
3. Make sure there are no spaces around the `=` sign
4. Restart the dev server after making changes
5. Check browser console for more detailed error messages

### Check if Supabase is initialized:
Open browser console and type:
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```
If it shows `undefined`, the environment variables are not loaded.
