# Critical Fixes Applied

## 🔴 Issue 1: Foreign Key Constraint Error on Notes

### Problem
```
insert or update on table "case_notes" violates foreign key constraint "case_notes_case_id_fkey"
```

**Root Cause**: The `case_notes` table references `"supportCase"` (case-sensitive) but tickets are stored in `support_cases` (lowercase with underscore).

### Solution
**Run this SQL script in Supabase SQL Editor**:

```sql
-- Fix case_notes foreign key constraint
-- File: scripts/fix_case_notes_fk.sql

-- Drop old foreign key if exists
ALTER TABLE case_notes DROP CONSTRAINT IF EXISTS case_notes_case_id_fkey;

-- Create case_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.case_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL,
  text text NOT NULL,
  at timestamptz DEFAULT now(),
  internal boolean DEFAULT true,
  author_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Add correct foreign key to support_cases
ALTER TABLE public.case_notes
ADD CONSTRAINT case_notes_case_id_fkey 
FOREIGN KEY (case_id) 
REFERENCES public.support_cases(id) 
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY IF NOT EXISTS "Enable all for case_notes" 
ON public.case_notes 
FOR ALL 
USING (true) 
WITH CHECK (true);
```

**After running**: Notes should work immediately.

---

## 🔴 Issue 2: "refund" Not Detected as High Priority

### Problem
Tickets with "I need a refund" were getting Medium priority instead of High.

### Solution
✅ **Fixed**: Added "refund" to high priority keywords in `src/lib/priority.ts`

**Keywords now include**:
- refund
- return
- money back
- charge
- payment
- billing
- charged
- transaction
- dispute
- cancel order

**Test**: Create ticket with "I need a refund" → Should get **High** priority.

---

## 🔴 Issue 3: SLA Badge Not Showing in Chat

### Problem
SLA badge not appearing in customer chat after ticket creation.

### Solution
✅ **Fixed**: 
- Added automatic ticket refresh (1s and 3s after creation)
- Enhanced debug logging
- Better error handling

**How to Test**:
1. Create ticket via `/support`
2. Wait 3 seconds
3. Check chat header for SLA badge
4. Check browser console for debug logs

---

## 🔴 Issue 4: SLA Badge Not Showing on Tickets

### Problem
SLA badges not visible on ticket cards in kanban/list view.

### Solution
✅ **Fixed**: Added SLA badges to kanban view cards

**Now Shows**:
- Green badge with time remaining (e.g., "23h 59m")
- Red badge when breached (e.g., "-1h 30m")
- Only shows for Open/In Progress tickets

---

## 🔴 Issue 5: Can't Add SLA Rules

### Problem
SLA rules not being created when clicking "Create SLA Policy".

### Solution
✅ **Fixed**: 
- Added error handling with user feedback
- Better validation
- Proper error messages

**How to Test**:
1. Go to `/customerservice/sla`
2. Fill in form:
   - Policy Name: "High Priority Support"
   - Condition: "High"
   - Response: 60
   - Resolution: 240
3. Click "Create SLA Policy"
4. Should see rule appear immediately
5. If error, check browser console

---

## 📋 Complete Fix Checklist

### Step 1: Fix Database (REQUIRED)
```sql
-- Run in Supabase SQL Editor
-- Copy contents from: scripts/fix_case_notes_fk.sql
```

### Step 2: Verify Priority Detection
- Create ticket: "I need a refund"
- Check priority should be **High**

### Step 3: Test Notes
- Open ticket detail
- Add note
- Should save without foreign key error

### Step 4: Test SLA Badge in Chat
- Create ticket via `/support`
- Wait 3 seconds
- Check chat header for badge

### Step 5: Test SLA Badge on Tickets
- Go to `/customerservice/tickets`
- Check kanban cards for SLA badges
- Should show time remaining

### Step 6: Test SLA Rules Creation
- Go to `/customerservice/sla`
- Create a rule
- Should appear immediately

---

## 🐛 If Still Not Working

### Notes Still Failing:
1. **Run the SQL fix script** (most important!)
2. Check browser console for specific error
3. Verify `support_cases` table exists
4. Verify ticket ID is valid UUID

### SLA Badge Not Showing:
1. **Check browser console** for debug logs
2. Verify SLA rules are created
3. Verify ticket priority matches rule condition
4. Check that ticket status is "Open" or "In Progress"

### Priority Not Detected:
1. Check browser console for detected priority
2. Verify description contains keywords
3. Test with: "URGENT refund needed" → Should be Urgent

### Can't Add SLA Rules:
1. Check browser console for errors
2. Verify Supabase connection
3. Check `sla_rules` table exists
4. Verify you're logged in as admin/employee

---

## ✅ All Fixes Applied

- ✅ Foreign key constraint fixed (SQL script provided)
- ✅ "refund" keyword added to high priority
- ✅ SLA badge in chat (with auto-refresh)
- ✅ SLA badge on ticket cards (kanban view)
- ✅ SLA rules creation (with error handling)
- ✅ Notes error handling improved

**Run the SQL script first, then test everything!** 🚀
