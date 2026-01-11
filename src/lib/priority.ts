/**
 * Priority Detection Utility
 * Automatically determines ticket priority based on:
 * - Urgency keywords in description
 * - Customer loyalty tier
 * - Issue category/type
 */

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

interface PriorityDetectionParams {
  description: string;
  customerLoyaltyLevel?: string;
  customerTotalSpent?: number;
  customerTotalOrders?: number;
}

/**
 * Detect priority based on urgency keywords in description
 */
function detectUrgencyKeywords(description: string): PriorityLevel {
  const lowerDesc = description.toLowerCase();
  
  // Urgent keywords - critical issues
  const urgentKeywords = [
    'urgent', 'critical', 'emergency', 'asap', 'immediately', 'now',
    'hacked', 'stolen', 'fraud', 'unauthorized', 'breach', 'security',
    'payment failed', 'account compromised', 'stolen card'
  ];
  
  // High priority keywords
  const highKeywords = [
    'not working', 'broken', 'error', 'bug', 'crash', 'down', 'outage',
    'cannot', "can't", 'unable', 'failed', 'issue', 'problem',
    'app not', 'website not', 'login', 'password', 'access',
    'order', 'delivery', 'missing order', 'wrong order',
    'refund', 'return', 'money back', 'charge', 'payment', 'billing',
    'charged', 'transaction', 'dispute', 'cancel order'
  ];
  
  // Medium priority keywords (general issues that need attention but not urgent)
  const mediumKeywords = [
    'help', 'assistance', 'support', 'need help', 'confused', 'unclear',
    'slow', 'delay', 'late', 'waiting', 'concern', 'worry',
    'complaint', 'dissatisfied', 'unhappy', 'not satisfied',
    'change', 'modify', 'update', 'edit', 'cancel', 'modification'
  ];
  
  // Low priority keywords
  const lowKeywords = [
    'question', 'info', 'information', 'how to', 'where', 'what',
    'curious', 'wondering', 'just asking', 'general', 'feedback',
    'suggestion', 'menu', 'nutrition', 'ingredients', 'hours',
    'inquiry', 'ask', 'wondering', 'curiosity'
  ];
  
  // Check for urgent keywords
  if (urgentKeywords.some(keyword => lowerDesc.includes(keyword))) {
    return 'urgent';
  }
  
  // Check for high priority keywords
  if (highKeywords.some(keyword => lowerDesc.includes(keyword))) {
    return 'high';
  }
  
  // Check for low priority keywords
  if (lowKeywords.some(keyword => lowerDesc.includes(keyword))) {
    return 'low';
  }
  
  // Check for medium priority keywords
  if (mediumKeywords.some(keyword => lowerDesc.includes(keyword))) {
    return 'medium';
  }
  
  // Default to medium if no keywords match
  return 'medium';
}

/**
 * Adjust priority based on customer loyalty tier
 */
function adjustByCustomerTier(
  basePriority: PriorityLevel,
  loyaltyLevel?: string,
  totalSpent?: number,
  totalOrders?: number
): PriorityLevel {
  // VIP/Gold customers get priority boost
  if (loyaltyLevel) {
    const lowerLoyalty = loyaltyLevel.toLowerCase();
    if (lowerLoyalty.includes('vip') || lowerLoyalty.includes('gold')) {
      // Boost priority by one level (max urgent)
      if (basePriority === 'low') return 'medium';
      if (basePriority === 'medium') return 'high';
      if (basePriority === 'high') return 'urgent';
      return 'urgent';
    }
  }
  
  // High-value customers (spent > $500 or > 50 orders)
  if (totalSpent && totalSpent > 500) {
    if (basePriority === 'low') return 'medium';
    if (basePriority === 'medium') return 'high';
  }
  
  if (totalOrders && totalOrders > 50) {
    if (basePriority === 'low') return 'medium';
    if (basePriority === 'medium') return 'high';
  }
  
  return basePriority;
}

/**
 * Main priority detection function
 */
export function detectPriority(params: PriorityDetectionParams): PriorityLevel {
  const { description, customerLoyaltyLevel, customerTotalSpent, customerTotalOrders } = params;
  
  // Step 1: Detect base priority from description
  let priority = detectUrgencyKeywords(description);
  
  // Step 2: Adjust based on customer tier
  priority = adjustByCustomerTier(
    priority,
    customerLoyaltyLevel,
    customerTotalSpent,
    customerTotalOrders
  );
  
  return priority;
}

/**
 * Convert priority to database format
 */
export function priorityToDb(priority: PriorityLevel): string {
  return priority.toLowerCase();
}

/**
 * Convert database priority to app format
 */
export function priorityFromDb(priority: string): 'Low' | 'Medium' | 'High' | 'Urgent' {
  const lower = priority.toLowerCase();
  if (lower === 'urgent') return 'Urgent';
  if (lower === 'high') return 'High';
  if (lower === 'low') return 'Low';
  return 'Medium';
}
