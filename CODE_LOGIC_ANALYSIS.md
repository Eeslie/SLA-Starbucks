# Code Logic Analysis: Priority Assignment & SLA Rules

## 🔍 Problem: Why Only Medium Cases?

### Root Causes

1. **Hardcoded Priority in Support Page** (`src/app/support/page.tsx:216`)
   - When customers create tickets via the support page, priority is hardcoded to `'medium'`
   - No logic to determine priority based on issue type, urgency keywords, or customer tier

2. **Database Default** (`db_setup.sql:23`)
   - The database schema sets `priority text DEFAULT 'Medium'`
   - If no priority is specified, it defaults to Medium

3. **Fallback Defaults** (`src/lib/data.ts`)
   - Line 55: When fetching tickets, unmatched priorities default to `'Medium'`
   - Line 98: When creating tickets, unmatched priorities default to `'medium'`

### Where Priority Should Be Determined

Currently, there is **NO automatic priority assignment logic** based on:
- Customer loyalty level (VIP, Gold, Green tier)
- Issue urgency keywords in description
- Ticket channel (chat, email, phone)
- Customer history (repeat issues, high-value customers)
- Issue category or type

---

## 📋 SLA Rules: Purpose & Functionality

### What SLA Rules Do

1. **Define Time Targets**
   - **Response Time**: Maximum time allowed for first agent reply
   - **Resolution Time**: Maximum time allowed to completely solve the issue

2. **Target Specific Ticket Types**
   - Rules can target tickets by priority using:
     - `condition_field = 'priority'`
     - `condition_value = 'Low' | 'Medium' | 'High'`
   - Allows different SLA targets for different priority levels

3. **Track Compliance**
   - System calculates deadlines based on:
     - **Response deadline**: Ticket creation time + response_mins
     - **Resolution deadline**: Ticket creation time + resolution_mins
   - Flags tickets as "breached" when deadlines are exceeded
   - Displays real-time SLA status on tickets (time remaining, breached status)

### How SLA Rules Work

#### Rule Structure (`sla_rules` table)
```sql
- id: UUID
- name: e.g., "High Priority VIP"
- condition_field: e.g., "priority"
- condition_value: e.g., "High"
- response_mins: e.g., 30 (30 minutes for first reply)
- resolution_mins: e.g., 240 (4 hours to resolve)
```

#### Matching Logic (`src/app/customerservice/sla/page.tsx:28-42`)
```typescript
// Tickets are matched to rules based on:
if (rule.conditionField === 'priority' && rule.conditionValue) {
    return t.priority.toLowerCase() === rule.conditionValue.toLowerCase();
}
```

#### SLA Display (`src/components/TicketCard.tsx:18-47`)
- Shows time remaining or breached status
- Color-coded badges:
  - 🟢 Green: On track
  - 🟡 Amber: Warning (< 1 hour remaining)
  - 🔴 Red: Breached

### Example SLA Rule Scenarios

1. **High Priority Tickets**
   - Response: 1 hour
   - Resolution: 4 hours
   - Targets tickets with `priority = 'High'`

2. **Medium Priority Tickets**
   - Response: 4 hours
   - Resolution: 24 hours
   - Targets tickets with `priority = 'Medium'`

3. **Low Priority Tickets**
   - Response: 24 hours
   - Resolution: 48 hours
   - Targets tickets with `priority = 'Low'`

---

## 🔧 Current Code Flow

### Ticket Creation Flow

1. **Customer creates ticket** (`src/app/support/page.tsx`)
   ```
   Support Page → createTicket() → Hardcoded priority: 'medium'
   ```

2. **Ticket saved to database** (`src/lib/data.ts:93-103`)
   ```
   addTicket() → Maps priority → Defaults to 'medium' if invalid
   ```

3. **Ticket fetched and displayed** (`src/lib/data.ts:49-58`)
   ```
   fetchTickets() → Maps DB priority → Defaults to 'Medium' if invalid
   ```

### SLA Calculation Flow

1. **Rule matching** (`src/app/customerservice/sla/page.tsx:28-42`)
   - Finds rules where `condition_field = 'priority'` matches ticket priority

2. **Deadline calculation** (`src/components/TicketCard.tsx:24-25`)
   - Resolution deadline = `createdAt + (rule.resolutionMins * 60000)`

3. **Status display** (`src/components/TicketCard.tsx:37-46`)
   - Shows time remaining or breached status with visual indicators

---

## 💡 Recommendations

### To Fix "Only Medium Cases" Issue

1. **Add Priority Assignment Logic**
   - Implement automatic priority detection based on:
     - Customer loyalty tier (VIP → High, Gold → Medium, Green → Low)
     - Urgency keywords in description (urgent, critical, emergency → High)
     - Issue category (technical issues → High, general questions → Low)
     - Customer value (high-spending customers → High)

2. **Update Support Page** (`src/app/support/page.tsx:216`)
   ```typescript
   // Instead of hardcoded 'medium', calculate priority:
   const priority = determinePriority(desc, customerId);
   ```

3. **Add Priority Selection** (Optional)
   - Allow customers to select priority during ticket creation
   - Or allow agents to adjust priority when reviewing tickets

### To Enhance SLA Rules

1. **Add More Condition Fields**
   - Target by customer tier (loyalty_level)
   - Target by issue category
   - Target by ticket channel (chat, email, phone)

2. **Automatic Rule Application**
   - Apply SLA rules automatically when tickets are created
   - Store `sla_policy_id` and `sla_due_at` on ticket creation

3. **Escalation Logic**
   - Automatically escalate tickets that breach SLA
   - Notify supervisors when breaches occur

---

## 📊 Key Files

- **Priority Assignment**: `src/app/support/page.tsx:216`, `src/lib/data.ts:98`
- **SLA Rules Management**: `src/app/customerservice/sla/page.tsx`
- **SLA Display**: `src/components/TicketCard.tsx:18-47`
- **Database Schema**: `db_setup.sql:23, 46-54`
- **Types**: `src/lib/types.ts:2, 29-36`
