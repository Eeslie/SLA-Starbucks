# Test Scenario: Priority Assignment & SLA Rules

This document provides a comprehensive test scenario to verify priority assignment, SLA rules, and ticket tracking functionality.

---

## 🎯 Test Scenario Overview

**Scenario**: A busy day at Starbucks Support Center
- Different customers create tickets with varying urgency
- System should assign priorities based on customer tier and issue type
- SLA rules should track response and resolution times
- Test breach detection and compliance reporting

---

## 📋 Pre-Test Setup

### Step 1: Set Up SLA Rules

1. **Navigate to SLA Page** (`/customerservice/sla`)

2. **Create SLA Rules** (If not already created):

   **Rule 1: High Priority**
   - Policy Name: `High Priority Support`
   - Condition (Priority): `High`
   - Response (min): `60` (1 hour)
   - Resolution (min): `240` (4 hours)

   **Rule 2: Medium Priority** (Default)
   - Policy Name: `Standard Support`
   - Condition (Priority): `Medium`
   - Response (min): `240` (4 hours)
   - Resolution (min): `1440` (24 hours)

   **Rule 3: Low Priority**
   - Policy Name: `Low Priority Support`
   - Condition (Priority): `Low`
   - Response (min): `1440` (24 hours)
   - Resolution (min): `2880` (48 hours)

### Step 2: Verify Customer Tiers (Optional)

Check database for customer loyalty levels:
- VIP/Gold customers should get higher priority
- Green members get standard priority

---

## 🧪 Test Cases

### Test Case 1: High Priority Ticket (VIP Customer)

**Goal**: Test if VIP customers get High priority and proper SLA tracking

**Steps**:
1. **Create Ticket via Support Page** (`/support`)
   - Use email: `vip.customer@example.com`
   - Description: `URGENT: My app crashed and I lost $50 in rewards points!`
   - Create ticket

2. **Expected Behavior** (Currently):
   - ❌ Priority defaults to `Medium` (BUG: should be High for VIP)
   - ✅ Ticket created successfully
   - ✅ SLA rule matches Medium priority rule
   - ✅ Resolution deadline: 24 hours from creation

3. **Check Ticket in Dashboard** (`/customerservice/tickets`)
   - View ticket details
   - Verify priority badge shows "Medium" (red/amber/gray)
   - Check SLA badge shows time remaining

4. **Verify SLA Compliance**
   - Navigate to SLA page (`/customerservice/sla`)
   - Check "Standard Support" rule stats
   - Should show 1 active case
   - Monitor compliance percentage

**Notes**: Currently all tickets default to Medium priority. After fixing priority logic, VIP customers should get High priority automatically.

---

### Test Case 2: Medium Priority Ticket (Standard Customer)

**Goal**: Test standard ticket creation and SLA tracking

**Steps**:
1. **Create Ticket via Support Page** (`/support`)
   - Use email: `customer@gmail.com`
   - Description: `I need help resetting my password`
   - Create ticket

2. **Expected Behavior**:
   - ✅ Priority: `Medium` (correct default)
   - ✅ Ticket created successfully
   - ✅ SLA rule matches: "Standard Support"
   - ✅ Resolution deadline: 24 hours from creation

3. **Check SLA Status**
   - View ticket card/kanban board
   - Verify green SLA badge shows "23h 59m left" (approximately)
   - Badge should be green (on track)

4. **Simulate Response**
   - Assign ticket to an agent
   - Change status to "In Progress"
   - SLA should still track resolution time

---

### Test Case 3: Low Priority Ticket

**Goal**: Test low priority assignment and tracking

**Steps**:
1. **Create Ticket via Support Page** (`/support`)
   - Use email: `general.customer@example.com`
   - Description: `Where can I find nutritional information?`
   - Create ticket

2. **Expected Behavior** (Currently):
   - ❌ Priority defaults to `Medium` (BUG: should be Low for general inquiries)
   - ✅ Ticket created
   - ✅ SLA rule matches Medium rule

3. **Manual Priority Change** (If ticket detail modal supports it):
   - Open ticket detail modal
   - Change priority to "Low"
   - Verify SLA rule updates to "Low Priority Support"
   - Resolution deadline should update to 48 hours

---

### Test Case 4: SLA Breach Detection

**Goal**: Test if system correctly identifies breached tickets

**Steps**:
1. **Create Test Ticket with Short SLA**
   - Create a new SLA rule:
     - Name: `Test Quick SLA`
     - Priority: `Medium`
     - Response: `5` minutes (for testing)
     - Resolution: `10` minutes (for testing)

2. **Create Ticket**
   - Create a medium priority ticket
   - Note the creation time

3. **Wait for Breach**
   - Wait 5+ minutes (or manually update ticket `created_at` in database for testing)
   - Refresh ticket list

4. **Expected Behavior**:
   - ✅ SLA badge should turn red
   - ✅ Show "Breached by Xh Xm"
   - ✅ Ticket should be highlighted/flagged

5. **Check SLA Dashboard**
   - Navigate to SLA page
   - Check "Test Quick SLA" rule
   - Breached count should be 1
   - Compliance should be < 100%

---

### Test Case 5: Multiple Priority Levels

**Goal**: Verify SLA rules correctly match different priorities

**Steps**:
1. **Create 3 Tickets**:
   - High Priority: `URGENT payment issue`
   - Medium Priority: `Password reset help`
   - Low Priority: `General question about menu`

2. **Expected Behavior** (After Priority Fix):
   - ✅ High ticket → "High Priority Support" rule → 1 hour response
   - ✅ Medium ticket → "Standard Support" rule → 4 hour response
   - ✅ Low ticket → "Low Priority Support" rule → 24 hour response

3. **Check SLA Dashboard**
   - Each rule should show:
     - Total active cases
     - Breached count
     - Compliance percentage

4. **Current Behavior** (Before Fix):
   - ❌ All tickets show Medium priority
   - ❌ All match "Standard Support" rule
   - ❌ Cannot test different SLA targets

---

### Test Case 6: Chat Session SLA Tracking

**Goal**: Test SLA tracking in chat sessions

**Steps**:
1. **Navigate to Chat Page** (`/customerservice/chat`)

2. **Start Chat Session**
   - Select a chat session with linked ticket
   - View active session

3. **Expected Behavior**:
   - ✅ SLA status displayed at top of chat
   - ✅ Shows matching rule name
   - ✅ Shows response time remaining/breached
   - ✅ Uses ticket priority to match rule

4. **Test Response Time**
   - If no agent response in response_mins, should show breached
   - Chat should highlight when SLA is at risk

---

### Test Case 7: Ticket Priority Update

**Goal**: Test if SLA updates when priority changes

**Steps**:
1. **Create Medium Priority Ticket**
   - Description: `Normal support request`

2. **Update Priority to High**
   - Open ticket detail modal
   - Change priority dropdown to "High" (if available)
   - Save changes

3. **Expected Behavior**:
   - ✅ Ticket priority updated
   - ✅ SLA rule should re-match to "High Priority Support"
   - ✅ Resolution deadline should update (shorter)
   - ✅ Badge should reflect new deadline

**Note**: This requires priority update functionality in ticket detail modal.

---

### Test Case 8: SLA Compliance Reporting

**Goal**: Test SLA dashboard statistics

**Steps**:
1. **Navigate to SLA Page** (`/customerservice/sla`)

2. **Review Statistics for Each Rule**:
   - Total active cases
   - Breached count
   - Compliance percentage (should be ≥90% for healthy)

3. **Create Mix of Tickets**:
   - 3 Medium priority tickets
   - Wait for 1 to breach (or manually adjust timestamps)
   - Expected compliance: 66.7% (2 of 3 on track)

4. **Verify Calculations**:
   - Compliance = (Total - Breached) / Total * 100
   - Health indicator: Green if ≥90%, Red if <90%

---

## 🔧 Manual Database Testing (Advanced)

### Test Priority Assignment Fix

If you want to test priority logic before implementing:

1. **Manually Set Priority in Database**:
```sql
-- Connect to Supabase database
-- Update a ticket to High priority
UPDATE support_cases 
SET priority = 'high' 
WHERE id = '<ticket-id>';

-- Verify SLA rule matching works
SELECT 
    sc.id,
    sc.priority,
    sr.name as sla_rule_name,
    sr.resolution_mins
FROM support_cases sc
LEFT JOIN sla_rules sr 
    ON sr.condition_field = 'priority' 
    AND LOWER(sr.condition_value) = LOWER(sc.priority)
WHERE sc.status != 'closed';
```

2. **Create Old Tickets to Test Breach**:
```sql
-- Create ticket with old timestamp
INSERT INTO support_cases (
    title, 
    description, 
    priority, 
    status, 
    created_at
) VALUES (
    'Old Test Ticket',
    'This ticket is old',
    'medium',
    'open',
    NOW() - INTERVAL '25 hours'  -- 25 hours ago
);

-- This ticket should show as breached (24 hour SLA exceeded)
```

---

## ✅ Expected Test Results Summary

### Current System (Before Priority Fix):
- ❌ All tickets created with `Medium` priority
- ✅ SLA rules match correctly by priority
- ✅ SLA tracking works for Medium priority
- ❌ Cannot test High/Low priority SLAs
- ✅ Breach detection works correctly
- ✅ SLA dashboard shows accurate stats

### After Priority Fix (Expected):
- ✅ Tickets assigned priority based on:
  - Customer loyalty tier
  - Urgency keywords
  - Issue category
- ✅ Different SLA rules apply correctly
- ✅ VIP customers get High priority → 1 hour response
- ✅ General inquiries get Low priority → 24 hour response

---

## 📊 Test Checklist

- [ ] SLA rules created (High, Medium, Low)
- [ ] Ticket created via support page
- [ ] Priority displays correctly (currently all Medium)
- [ ] SLA badge shows on ticket card
- [ ] SLA badge updates in real-time
- [ ] Breach detection works (test with old ticket)
- [ ] SLA dashboard shows correct stats
- [ ] Chat session shows SLA status
- [ ] Multiple priorities tested (after fix)
- [ ] Priority update updates SLA (if feature exists)

---

## 🐛 Known Issues to Verify

1. **Priority Assignment**: All tickets default to Medium
   - ✅ Verify: Create ticket, check priority
   - 📝 Fix: Add priority logic in `src/app/support/page.tsx:216`

2. **SLA Rule Matching**: Works correctly when priority is set
   - ✅ Verify: Set priority manually, check SLA matches

3. **Breach Detection**: Should flag tickets past deadline
   - ✅ Verify: Create old ticket, check badge turns red

4. **Real-time Updates**: SLA badges should update without refresh
   - ✅ Verify: Wait and watch badge countdown

---

## 🎬 Quick Test Script

**Run this in sequence to test everything:**

1. **Setup** (2 minutes):
   ```
   - Go to /customerservice/sla
   - Create High, Medium, Low SLA rules
   ```

2. **Create Tickets** (3 minutes):
   ```
   - Go to /support
   - Create 3 tickets with different descriptions
   - Note: All will be Medium priority currently
   ```

3. **Verify SLA** (2 minutes):
   ```
   - Go to /customerservice/tickets
   - Check SLA badges on each ticket
   - Verify all show "Standard Support" rule
   ```

4. **Test Breach** (5 minutes):
   ```
   - Create test ticket with 5-minute SLA rule
   - Wait 6 minutes
   - Check badge turns red
   ```

5. **Check Dashboard** (1 minute):
   ```
   - Go to /customerservice/sla
   - Verify stats show correct counts
   ```

**Total Test Time**: ~15 minutes

---

## 📝 Notes

- **Priority Fix Required**: Currently all tickets are Medium priority. To test different SLAs, you'll need to manually update ticket priorities in the database or implement the priority assignment logic.

- **Time-based Testing**: For breach testing, you can either wait for real time to pass or manually adjust ticket `created_at` timestamps in the database for faster testing.

- **SLA Calculation**: The system calculates deadlines from ticket `created_at` time. Resolution deadline = `created_at + resolution_mins * 60000` milliseconds.

---

## 🔗 Related Files

- Ticket Creation: `src/app/support/page.tsx:216`
- SLA Rules: `src/app/customerservice/sla/page.tsx`
- SLA Display: `src/components/TicketCard.tsx:18-47`
- Data Layer: `src/lib/data.ts`

---

**Happy Testing! 🧪✨**
