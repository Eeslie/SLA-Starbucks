# Testing SLA Tickets in Customer Chat

## 🎯 Goal
Test that SLA badges appear in the customer chat interface after creating a ticket.

## 📋 Prerequisites

### 1. Supabase Configuration
- ✅ `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Supabase connection is working

### 2. SLA Rules Created
Before testing, create SLA rules in the system:

1. **Go to**: `/customerservice/sla` (login as admin/agent first)
2. **Create these rules**:

   **Rule 1: Urgent Priority**
   - Policy Name: `Urgent Support`
   - Condition (Priority): `Urgent`
   - Response (min): `30`
   - Resolution (min): `120` (2 hours)

   **Rule 2: High Priority**
   - Policy Name: `High Priority Support`
   - Condition (Priority): `High`
   - Response (min): `60` (1 hour)
   - Resolution (min): `240` (4 hours)

   **Rule 3: Medium Priority** (Default)
   - Policy Name: `Standard Support`
   - Condition (Priority): `Medium`
   - Response (min): `240` (4 hours)
   - Resolution (min): `1440` (24 hours)

   **Rule 4: Low Priority**
   - Policy Name: `Low Priority Support`
   - Condition (Priority): `Low`
   - Response (min): `1440` (24 hours)
   - Resolution (min): `2880` (48 hours)

## 🧪 Step-by-Step Testing

### Test 1: Basic SLA Display

1. **Open Support Page**
   - Navigate to: `http://localhost:3000/support`
   - You should see the chat interface on the right

2. **Create a Ticket**
   - Type in chat: `I need a refund for my order`
   - Press Enter
   - Bot asks for email
   - Type: `test@example.com`
   - Press Enter

3. **Check for SLA Badge**
   - After ticket is created, look at the **chat header** (top of chat box)
   - You should see a **green badge** with time remaining
   - Example: `🕐 23h 59m left`

4. **Expected Result**
   - ✅ SLA badge appears in chat header
   - ✅ Shows time remaining (e.g., "23h 59m left")
   - ✅ Badge is green (on track)

### Test 2: Different Priority Levels

#### Test High Priority
1. Create ticket with: `URGENT: My payment was charged twice!`
2. Expected: Should get "High" or "Urgent" priority
3. SLA badge should show shorter time (1-2 hours)

#### Test Low Priority
1. Create ticket with: `Where can I find menu information?`
2. Expected: Should get "Low" priority
3. SLA badge should show longer time (24-48 hours)

### Test 3: Maximized Chat View

1. **Click the maximize button** (top right of chat)
2. **Check SLA badge** in maximized view header
3. **Expected**: Badge should still appear and update

### Test 4: Real-time Updates

1. Create a ticket
2. Note the time remaining
3. Wait 1-2 minutes
4. Refresh the page
5. **Expected**: Time should decrease

## 🔍 Troubleshooting

### Issue: SLA Badge Not Appearing

#### Check 1: Browser Console
Open browser DevTools (F12) and check console for errors:
```javascript
// Should see no errors related to:
// - useTickets
// - useRules
// - currentTicketId
```

#### Check 2: Verify Data Loading
In browser console, check:
```javascript
// Check if tickets are loading
// Check if rules are loading
// Check if currentTicketId is set
```

#### Check 3: Verify SLA Rules Exist
1. Go to `/customerservice/sla`
2. Verify rules are created
3. Check that `condition_field = 'priority'` and `condition_value` matches ticket priority

#### Check 4: Verify Ticket Priority
1. After creating ticket, go to `/customerservice/tickets`
2. Find your ticket
3. Check the priority badge
4. Verify it matches an SLA rule

### Issue: Wrong Time Displayed

1. **Check SLA Rule**: Verify the rule's `resolution_mins` value
2. **Check Ticket Created Time**: Verify `created_at` timestamp
3. **Check Calculation**: 
   - Resolution deadline = `created_at + resolution_mins * 60000`
   - Time remaining = `deadline - now`

### Issue: Badge Shows "Breached" Immediately

1. **Check Rule Resolution Time**: Might be too short (e.g., 1 minute)
2. **Check Ticket Status**: Only shows for "Open" or "In Progress" tickets
3. **Check Time Calculation**: Verify server time vs client time

## 🐛 Debug Mode

Add this to browser console to debug:

```javascript
// Check tickets
console.log('Tickets:', window.__TICKETS__);

// Check rules  
console.log('Rules:', window.__RULES__);

// Check current ticket ID
console.log('Current Ticket ID:', window.__CURRENT_TICKET_ID__);
```

## 📊 Expected Behavior

### When SLA Badge Should Appear:
- ✅ Ticket is created via support page
- ✅ Ticket status is "Open" or "In Progress"
- ✅ SLA rule exists for ticket's priority
- ✅ Tickets and rules have loaded

### When SLA Badge Should NOT Appear:
- ❌ Ticket is "Closed" or "Resolved"
- ❌ No SLA rule matches ticket priority
- ❌ Tickets or rules haven't loaded yet
- ❌ Ticket was created outside support page

## 🎬 Quick Test Script

**Run this in sequence:**

1. **Setup** (2 min):
   ```
   - Go to /customerservice/sla
   - Create 4 SLA rules (Urgent, High, Medium, Low)
   ```

2. **Test** (3 min):
   ```
   - Go to /support
   - Create ticket: "URGENT payment issue"
   - Enter email: test@example.com
   - Check chat header for SLA badge
   ```

3. **Verify** (1 min):
   ```
   - Badge shows time remaining
   - Badge is green (on track)
   - Time matches rule (e.g., 2h for Urgent)
   ```

**Total Time**: ~6 minutes

## ✅ Success Criteria

- [ ] SLA badge appears in chat header after ticket creation
- [ ] Badge shows correct time remaining
- [ ] Badge color matches status (green = on track, red = breached)
- [ ] Badge appears in both inline and maximized chat views
- [ ] Badge updates when page refreshes
- [ ] Different priorities show different time limits

## 🔧 Manual Database Check (Advanced)

If badge still doesn't appear, check database:

```sql
-- Check if ticket was created
SELECT id, title, priority, status, created_at 
FROM support_cases 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if SLA rules exist
SELECT id, name, condition_field, condition_value, resolution_mins 
FROM sla_rules;

-- Check if ticket matches a rule
SELECT 
    sc.id,
    sc.priority,
    sr.name as sla_rule,
    sr.resolution_mins,
    sc.created_at + (sr.resolution_mins || ' minutes')::interval as deadline
FROM support_cases sc
LEFT JOIN sla_rules sr 
    ON sr.condition_field = 'priority' 
    AND LOWER(sr.condition_value) = LOWER(sc.priority)
WHERE sc.status IN ('open', 'in_progress')
ORDER BY sc.created_at DESC;
```

---

**Happy Testing!** 🧪✨
