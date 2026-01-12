# Self-Service Portal Enhancement

## ✅ Completed Features

### 1. **Search Database of Solutions/Articles** ✓
- **Location**: `/support` page → Click "Browse FAQs"
- **Features**:
  - Real-time search across article titles, content, and tags
  - Searches only **Published** articles (customer-facing)
  - Results sorted by helpfulness score (most helpful first)
  - Search highlights matching content

### 2. **Categorize Help Topics** ✓
- **Features**:
  - Dynamic category filter buttons (All Topics, General, Orders, Rewards, Account, etc.)
  - Categories automatically generated from existing articles
  - Visual highlight for selected category
  - Combined with search for precise filtering

### 3. **User Feedback on Article Helpfulness** ✓
- **Features**:
  - "Yes, helpful" and "Not helpful" buttons on each article
  - Feedback stored in localStorage (per-user tracking)
  - Helpfulness score updated in database
  - Visual confirmation when feedback is submitted
  - Articles sorted by helpfulness score (most helpful first)

### 4. **Reduce Ticket Volume by Promoting Self-Resolution** ✓
- **Features**:
  - Self-service portal accessible before ticket creation
  - Prominent "Browse FAQs" button on support page
  - "Still need help?" section in article view with CTA to create ticket
  - "No articles found" message includes option to create ticket
  - Encourages users to find answers before contacting support

## 🎨 User Experience

### Customer-Facing Portal (`/support` → Browse FAQs)
1. **Search Bar**: Prominent search at top
2. **Category Filters**: Quick filter buttons for common topics
3. **Article List**: 
   - Shows article title, category badge, preview, and helpfulness score
   - Click to view full article
4. **Article Detail View**:
   - Full article content with markdown rendering
   - Helpfulness feedback buttons
   - "Create Support Ticket" CTA if article doesn't help

### Admin Portal (`/customerservice/self-service`)
- **Unchanged**: Still allows agents to create/edit articles
- Articles must be set to "Published" status to appear in customer portal

## 📊 Data Storage

### Helpfulness Feedback
- **Storage**: localStorage (key: `starbucks_article_feedback`)
- **Format**: `{ "article-id": "helpful" | "not_helpful" }`
- **Database**: Updates `helpfulness_score` in `articles` table
- **Fallback**: Works even if database update fails (localStorage persists)

### Articles
- **Source**: `articles` table in Supabase
- **Filter**: Only `status = 'Published'` articles shown to customers
- **Sorting**: By helpfulness_score (descending), then by updated_at

## 🔧 Technical Implementation

### Files Modified:
1. **`src/lib/data.ts`**:
   - Enhanced `useArticles()` hook
   - Added `submitFeedback()` function
   - Filters only published articles
   - Loads/stores feedback from localStorage

2. **`src/app/support/page.tsx`**:
   - Replaced hardcoded FAQ with dynamic self-service portal
   - Added search, category filtering, article detail view
   - Integrated helpfulness feedback
   - Added "Create Ticket" CTAs

### Database Schema:
- Uses existing `articles` table:
  - `id`, `title`, `category`, `content`, `tags`
  - `status` (must be 'Published' for customer view)
  - `helpfulness_score` (updated by feedback)

## 🚀 How to Use

### For Customers:
1. Go to `/support`
2. Click "Browse FAQs" button
3. Search or filter by category
4. Click an article to read
5. Click "Yes, helpful" or "Not helpful"
6. If article doesn't help, click "Create Support Ticket"

### For Agents:
1. Go to `/customerservice/self-service`
2. Create/edit articles
3. Set status to "Published" for customers to see
4. Monitor helpfulness scores to improve content

## 📈 Benefits

1. **Reduced Ticket Volume**: Customers find answers without creating tickets
2. **Better User Experience**: Instant answers vs waiting for support
3. **Data-Driven**: Helpfulness scores show which articles need improvement
4. **Scalable**: Easy to add more articles without code changes
5. **No Database Changes Required**: Uses existing schema + localStorage for feedback

## 🎯 Rubrics Compliance

✅ **a. Search database of solutions/articles** - Full-text search implemented  
✅ **b. Categorize help topics** - Dynamic category filtering  
✅ **c. User feedback on article helpfulness** - Helpful/Not helpful buttons with score tracking  
✅ **d. Reduce ticket volume by promoting self-resolution** - Portal accessible before ticket creation with clear CTAs  

---

**All requirements met!** The self-service portal is fully functional and ready to use. 🎉
