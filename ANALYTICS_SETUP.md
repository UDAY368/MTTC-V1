# Analytics Feature Setup Guide

## Overview

A comprehensive analytics dashboard has been implemented to track user behavior, page visits, and quiz attempts. This feature provides real-time insights with beautiful visualizations and filtering capabilities.

## Features Implemented

### 1. **Analytics Dashboard** (`/dashboard/analytics`)
- **Beautiful Stat Cards**:
  - Total Visits (with filter support)
  - Live Users (last 30 minutes, always live)
  - Total Quiz Attempts (with filter support)
  
- **Filters**:
  - All Time
  - Today
  - Yesterday
  - Last 7 Days
  - Last 30 Days

- **Interactive Charts**:
  - Day-wise and Month-wise views
  - Total Visits chart
  - Quiz Attempts chart
  - Year and Month selectors
  - Animated bar charts with gradients

### 2. **Page Visit Tracking**
Automatically tracks visits to:
- Home page (`/home`)
- Course about pages (`/course/[courseId]`)
- Course learn pages (`/course/[courseId]/learn`)
- Quiz pages (`/quiz/[uniqueUrl]`)
- Flash card pages (`/flash/[uniqueUrl]`)

### 3. **Session Management**
- Unique session IDs for tracking individual users
- 30-minute live user window
- Privacy-conscious tracking (IP addresses can be anonymized)

## Setup Instructions

### Backend Setup

1. **Run Database Migration**:
   ```bash
   cd backend
   npx prisma migrate dev --name add_analytics_tracking
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Restart Backend Server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies** (if not already installed):
   ```bash
   cd frontend
   npm install
   ```

2. **Restart Frontend Server**:
   ```bash
   npm run dev
   ```

## Database Schema

### PageVisit Model
```prisma
model PageVisit {
  id          String   @id @default(cuid())
  pageUrl     String   // URL visited
  pageType    String?  // Type of page (home, course, quiz, flash)
  referrer    String?  // Referrer URL
  userAgent   String?  // Browser user agent
  ipAddress   String?  // IP address (anonymized for privacy)
  sessionId   String?  // Session identifier
  visitedAt   DateTime @default(now())
  
  @@index([visitedAt])
  @@index([pageType])
  @@index([sessionId])
  @@index([pageUrl])
  @@map("page_visits")
}
```

## API Endpoints

### Public Endpoints
- `POST /api/analytics/track` - Track a page visit

### Protected Endpoints (Admin Only)
- `GET /api/analytics/stats?filter=all|today|yesterday|week|month` - Get analytics statistics
- `GET /api/analytics/chart/visits?view=day|month&year=2024&month=1` - Get visits chart data
- `GET /api/analytics/chart/quiz-attempts?view=day|month&year=2024&month=1` - Get quiz attempts chart data

## Usage

### Accessing the Analytics Dashboard

1. Login to the admin panel
2. Click on "Analytics" in the sidebar navigation
3. Use the filters to view different time periods
4. Toggle between Day Wise and Month Wise views
5. Select year and month for detailed analysis
6. Switch between Total Visits and Quiz Attempts charts

### Understanding the Metrics

**Total Visits**: 
- Counts every page visit to the user-facing website
- Affected by the selected filter (All, Today, Yesterday, etc.)

**Live Users**: 
- Shows unique users active in the last 30 minutes
- NOT affected by filters (always shows last 30 minutes)
- Updates in real-time with live indicator

**Quiz Attempts**: 
- Total number of quiz attempts
- Affected by the selected filter

### Chart Configuration

**Day Wise View**:
- Select Year and Month
- Shows daily breakdown for the selected month
- X-axis: Days (1-31)
- Y-axis: Count

**Month Wise View**:
- Select Year only
- Shows monthly breakdown for the entire year
- X-axis: Months (Jan-Dec)
- Y-axis: Count

## Privacy Considerations

The analytics system is designed with privacy in mind:

1. **No Personal Data**: No user names, emails, or personal information is collected
2. **Session-Based**: Uses session IDs instead of persistent user tracking
3. **IP Anonymization**: IP addresses can be anonymized (implement in production)
4. **No Cookies**: Uses sessionStorage instead of cookies
5. **Opt-out Ready**: Easy to disable tracking if needed

## Performance Optimization

The tracking system is optimized for performance:

1. **Async Tracking**: Page visits are tracked asynchronously
2. **Silent Failures**: Tracking errors don't disrupt user experience
3. **Indexed Queries**: Database queries use proper indexes
4. **Efficient Aggregation**: Chart data is aggregated efficiently

## Customization

### Adding New Page Types

To track a new page type:

```typescript
import { trackPageVisit } from '@/lib/analytics';

useEffect(() => {
  trackPageVisit({ 
    pageUrl: '/your-page-url', 
    pageType: 'your-page-type' 
  });
}, []);
```

### Modifying Chart Colors

Edit the chart gradient in `/dashboard/analytics/page.tsx`:

```tsx
className="h-full bg-gradient-to-r from-primary to-primary/70"
```

### Adding New Filters

Add new filter options in the filter dropdown:

```tsx
<SelectItem value="custom">Custom Range</SelectItem>
```

Then handle it in the backend controller.

## Troubleshooting

### Issue: No data showing in charts
**Solution**: 
- Ensure backend migration is complete
- Check that page tracking is working (check browser network tab)
- Verify date/time settings on server

### Issue: Live users count is 0
**Solution**: 
- Visit user-facing pages to generate sessions
- Check that sessionStorage is working in browser
- Verify 30-minute window calculation in backend

### Issue: Charts not loading
**Solution**: 
- Check browser console for errors
- Verify API endpoints are accessible
- Check authentication token is valid

## Future Enhancements

Potential improvements for the analytics system:

1. **Export Data**: Add CSV/Excel export functionality
2. **Custom Date Ranges**: Allow custom date range selection
3. **Real-time Updates**: WebSocket-based live updates
4. **Geographic Data**: Add location-based analytics
5. **User Behavior**: Track user journey and flow
6. **A/B Testing**: Built-in A/B testing support
7. **Alerts**: Set up alerts for traffic spikes or drops
8. **Comparison**: Compare different time periods

## Security Notes

1. **Admin Only**: Analytics dashboard is protected by authentication
2. **Rate Limiting**: Consider adding rate limiting to tracking endpoint
3. **Data Retention**: Implement data retention policies
4. **GDPR Compliance**: Ensure compliance with data protection regulations

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Check browser console and server logs
4. Verify database migrations are complete

---

**Implementation Date**: February 2026
**Version**: 1.0.0
**Status**: Production Ready
