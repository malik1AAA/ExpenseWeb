# Performance Testing Guide

## Overview

This guide provides comprehensive performance testing scenarios to ensure the application performs well under various conditions and scales effectively.

---

## Performance Metrics

### Target Metrics

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Initial Page Load | < 2s | > 5s |
| Data Load (100 records) | < 1s | > 3s |
| Data Load (1000 records) | < 3s | > 5s |
| Data Load (10000 records) | < 5s | > 10s |
| Filter Operation | < 500ms | > 2s |
| Sort Operation | < 500ms | > 2s |
| CRUD Operation | < 1s | > 3s |
| Excel Export (100 records) | < 2s | > 5s |
| Excel Export (1000 records) | < 5s | > 10s |
| Excel Import (100 records) | < 3s | > 10s |
| Excel Import (1000 records) | < 10s | > 30s |
| Migration (1000 records) | < 15s | > 30s |
| Memory Usage | < 200MB | > 500MB |
| CPU Usage (idle) | < 5% | > 20% |
| CPU Usage (active) | < 50% | > 80% |

---

## Test Scenarios

### 1. Initial Load Performance

#### Test 1.1: Cold Start
**Objective:** Measure initial application load time

**Steps:**
1. Clear browser cache
2. Clear localStorage
3. Open application
4. Measure time to interactive

**Expected:** < 2 seconds

**Measurement:**
```javascript
// In browser console
performance.mark('start');
// Wait for app to load
performance.mark('end');
performance.measure('load', 'start', 'end');
console.log(performance.getEntriesByName('load')[0].duration);
```

#### Test 1.2: Warm Start
**Objective:** Measure load time with cached resources

**Steps:**
1. Load application once
2. Close browser
3. Reopen browser
4. Navigate to application
5. Measure time to interactive

**Expected:** < 1 second

#### Test 1.3: Authenticated Load
**Objective:** Measure load time after authentication

**Steps:**
1. Log in to application
2. Measure time to dashboard load
3. Measure time to data load

**Expected:** 
- Dashboard: < 1s
- Data load: < 2s (100 records), < 3s (1000 records)

---

### 2. Data Operations Performance

#### Test 2.1: List Rendering (100 records)
**Objective:** Measure rendering performance with 100 records

**Setup:**
```javascript
// Create 100 test expenses
for (let i = 0; i < 100; i++) {
  await addExpense({
    ExpenseID: `EXP_PERF_${i}`,
    Date: '2024-01-15',
    Description: `Test Expense ${i}`,
    Category: 'food',
    Amount: 10 + i,
    PaymentMethod: 'Cash',
  });
}
```

**Steps:**
1. Navigate to Expenses page
2. Measure render time
3. Scroll through list
4. Measure scroll performance

**Expected:**
- Render: < 500ms
- Scroll: 60 FPS

**Measurement:**
```javascript
// Using React DevTools Profiler
// Or browser Performance tab
```

#### Test 2.2: List Rendering (1000 records)
**Objective:** Measure rendering performance with 1000 records

**Setup:** Create 1000 test expenses

**Steps:** Same as Test 2.1

**Expected:**
- Render: < 2s
- Scroll: 60 FPS (may drop to 30 FPS with virtualization)

**Note:** Consider implementing virtualization for > 500 records

#### Test 2.3: List Rendering (10000 records)
**Objective:** Measure rendering performance with 10000 records

**Setup:** Create 10000 test expenses

**Steps:** Same as Test 2.1

**Expected:**
- Render: < 5s
- Scroll: 30+ FPS

**Recommendation:** Implement pagination or virtualization

#### Test 2.4: Filter Performance
**Objective:** Measure filter operation speed

**Setup:** 1000 expenses

**Steps:**
1. Apply date filter
2. Measure filter time
3. Apply category filter
4. Measure filter time
5. Apply multiple filters
6. Measure filter time

**Expected:** < 500ms for each filter operation

**Measurement:**
```javascript
console.time('filter');
// Apply filter
console.timeEnd('filter');
```

#### Test 2.5: Sort Performance
**Objective:** Measure sort operation speed

**Setup:** 1000 expenses

**Steps:**
1. Sort by date
2. Measure sort time
3. Sort by amount
4. Measure sort time
5. Sort by description
6. Measure sort time

**Expected:** < 500ms for each sort operation

#### Test 2.6: Search Performance
**Objective:** Measure search operation speed

**Setup:** 1000 expenses

**Steps:**
1. Search for common term
2. Measure search time
3. Search for rare term
4. Measure search time
5. Search with no results
6. Measure search time

**Expected:** < 500ms for each search operation

---

### 3. CRUD Operations Performance

#### Test 3.1: Create Operation
**Objective:** Measure time to create records

**Steps:**
1. Create 1 expense
2. Measure time
3. Create 10 expenses
4. Measure average time
5. Create 100 expenses
6. Measure average time

**Expected:**
- 1 expense: < 1s
- 10 expenses: < 500ms each
- 100 expenses: < 500ms each

**Measurement:**
```javascript
console.time('create');
await addExpense(expenseData);
console.timeEnd('create');
```

#### Test 3.2: Update Operation
**Objective:** Measure time to update records

**Steps:**
1. Update 1 expense
2. Measure time
3. Update 10 expenses
4. Measure average time
5. Update 100 expenses
6. Measure average time

**Expected:**
- 1 expense: < 1s
- 10 expenses: < 500ms each
- 100 expenses: < 500ms each

#### Test 3.3: Delete Operation
**Objective:** Measure time to delete records

**Steps:**
1. Delete 1 expense
2. Measure time
3. Delete 10 expenses
4. Measure average time
5. Delete 100 expenses
6. Measure average time

**Expected:**
- 1 expense: < 1s
- 10 expenses: < 500ms each
- 100 expenses: < 500ms each

---

### 4. Excel Operations Performance

#### Test 4.1: Export Performance (100 records)
**Objective:** Measure Excel export time

**Setup:** 100 expenses, 50 debts, 30 returns, 20 categories

**Steps:**
1. Navigate to Settings
2. Click "Export Current Excel"
3. Measure export time
4. Verify file size

**Expected:**
- Export time: < 2s
- File size: < 1MB

**Measurement:**
```javascript
console.time('export');
await exportToExcel(data);
console.timeEnd('export');
```

#### Test 4.2: Export Performance (1000 records)
**Objective:** Measure Excel export time with large dataset

**Setup:** 1000 expenses, 500 debts, 300 returns, 100 categories

**Steps:** Same as Test 4.1

**Expected:**
- Export time: < 5s
- File size: < 5MB

#### Test 4.3: Import Performance (100 records)
**Objective:** Measure Excel import time

**Setup:** Excel file with 100 expenses, 50 debts, 30 returns, 20 categories

**Steps:**
1. Navigate to Settings
2. Upload Excel file
3. Click "Import"
4. Measure import time
5. Verify data loaded

**Expected:**
- Import time: < 3s
- All data loaded correctly

#### Test 4.4: Import Performance (1000 records)
**Objective:** Measure Excel import time with large dataset

**Setup:** Excel file with 1000 expenses, 500 debts, 300 returns, 100 categories

**Steps:** Same as Test 4.3

**Expected:**
- Import time: < 10s
- All data loaded correctly

#### Test 4.5: Import Validation Performance
**Objective:** Measure validation time

**Setup:** Excel file with 1000 records

**Steps:**
1. Upload Excel file
2. Click "Validate"
3. Measure validation time

**Expected:** < 2s

---

### 5. Migration Performance

#### Test 5.1: Migration Detection
**Objective:** Measure local data detection time

**Setup:** 1000 records in localStorage

**Steps:**
1. Navigate to Settings → Migration
2. Measure detection time

**Expected:** < 500ms

#### Test 5.2: Migration Validation
**Objective:** Measure validation time

**Setup:** 1000 records in localStorage

**Steps:**
1. Click "Validate Data"
2. Measure validation time

**Expected:** < 2s

#### Test 5.3: Migration Execution
**Objective:** Measure migration time

**Setup:** 1000 records in localStorage

**Steps:**
1. Click "Migrate to Supabase"
2. Measure migration time
3. Verify data in Supabase

**Expected:**
- Migration time: < 15s
- All data migrated correctly

#### Test 5.4: Large Migration (10000 records)
**Objective:** Measure migration time with very large dataset

**Setup:** 10000 records in localStorage

**Steps:** Same as Test 5.3

**Expected:**
- Migration time: < 60s
- All data migrated correctly

---

### 6. Memory Performance

#### Test 6.1: Memory Usage (Idle)
**Objective:** Measure memory usage when idle

**Steps:**
1. Open application
2. Log in
3. Wait 1 minute
4. Measure memory usage

**Expected:** < 100MB

**Measurement:**
```javascript
// Chrome DevTools → Memory tab
// Or use performance.memory
console.log(performance.memory.usedJSHeapSize / 1024 / 1024 + ' MB');
```

#### Test 6.2: Memory Usage (Active)
**Objective:** Measure memory usage during operations

**Steps:**
1. Perform various operations
2. Create 100 records
3. Update 100 records
4. Delete 100 records
5. Measure memory usage

**Expected:** < 200MB

#### Test 6.3: Memory Leaks
**Objective:** Check for memory leaks

**Steps:**
1. Record initial memory
2. Perform operations repeatedly (10 times)
3. Record final memory
4. Compare

**Expected:** Memory should not grow significantly

**Measurement:**
```javascript
const initialMemory = performance.memory.usedJSHeapSize;
// Perform operations
const finalMemory = performance.memory.usedJSHeapSize;
const growth = (finalMemory - initialMemory) / 1024 / 1024;
console.log(`Memory growth: ${growth} MB`);
```

#### Test 6.4: Garbage Collection
**Objective:** Verify garbage collection works

**Steps:**
1. Create many records
2. Delete all records
3. Force garbage collection
4. Measure memory

**Expected:** Memory should return to baseline

---

### 7. Network Performance

#### Test 7.1: API Response Time
**Objective:** Measure Supabase API response times

**Steps:**
1. Perform CRUD operations
2. Measure each API call
3. Calculate average

**Expected:**
- GET: < 500ms
- POST: < 1s
- PUT: < 1s
- DELETE: < 500ms

**Measurement:**
```javascript
// Browser DevTools → Network tab
// Or use performance API
```

#### Test 7.2: Batch Operations
**Objective:** Measure batch operation performance

**Steps:**
1. Create 100 records one by one
2. Measure total time
3. Create 100 records in batch
4. Measure total time
5. Compare

**Expected:** Batch operation should be 5-10x faster

#### Test 7.3: Network Throttling
**Objective:** Test performance on slow networks

**Steps:**
1. Enable 3G throttling in DevTools
2. Perform operations
3. Measure performance
4. Enable offline mode
5. Verify graceful degradation

**Expected:**
- 3G: Operations should complete within 10s
- Offline: App should handle gracefully

---

### 8. Concurrent Operations

#### Test 8.1: Multiple Tabs
**Objective:** Test performance with multiple tabs

**Steps:**
1. Open 5 tabs
2. Log in to each
3. Perform operations in each
4. Measure performance

**Expected:** No significant performance degradation

#### Test 8.2: Multiple Users
**Objective:** Test performance with multiple users

**Steps:**
1. Create 10 test users
2. Log in as each user
3. Perform operations
4. Measure performance

**Expected:** No cross-user performance impact

#### Test 8.3: Rapid Operations
**Objective:** Test performance with rapid operations

**Steps:**
1. Perform 100 operations in quick succession
2. Measure performance
3. Check for errors
4. Verify data consistency

**Expected:**
- All operations complete
- No errors
- Data consistent

---

### 9. Browser Compatibility

#### Test 9.1: Chrome Performance
**Objective:** Test performance in Chrome

**Steps:** Run all performance tests in Chrome

**Expected:** Meet all target metrics

#### Test 9.2: Firefox Performance
**Objective:** Test performance in Firefox

**Steps:** Run all performance tests in Firefox

**Expected:** Meet all target metrics

#### Test 9.3: Safari Performance
**Objective:** Test performance in Safari

**Steps:** Run all performance tests in Safari

**Expected:** Meet all target metrics

#### Test 9.4: Edge Performance
**Objective:** Test performance in Edge

**Steps:** Run all performance tests in Edge

**Expected:** Meet all target metrics

---

### 10. Mobile Performance

#### Test 10.1: Mobile Load Time
**Objective:** Measure load time on mobile

**Steps:**
1. Open application on mobile device
2. Measure load time
3. Test on 3G network
4. Test on 4G network
5. Test on WiFi

**Expected:**
- WiFi: < 3s
- 4G: < 5s
- 3G: < 10s

#### Test 10.2: Mobile Interactions
**Objective:** Measure interaction performance on mobile

**Steps:**
1. Perform CRUD operations
2. Measure response time
3. Test scrolling
4. Test filtering

**Expected:**
- Interactions: < 1s
- Scrolling: 60 FPS
- Filtering: < 1s

#### Test 10.3: Mobile Memory
**Objective:** Measure memory usage on mobile

**Steps:**
1. Use application extensively
2. Monitor memory usage
3. Check for crashes

**Expected:**
- Memory: < 150MB
- No crashes

---

## Performance Testing Tools

### Browser DevTools
- **Performance Tab:** Record and analyze performance
- **Memory Tab:** Monitor memory usage
- **Network Tab:** Analyze network requests
- **Lighthouse:** Automated performance audit

### Chrome DevTools Commands
```javascript
// Performance monitoring
performance.mark('start');
// ... operation ...
performance.mark('end');
performance.measure('operation', 'start', 'end');
console.log(performance.getEntriesByName('operation')[0].duration);

// Memory monitoring
console.log(`Heap: ${performance.memory.usedJSHeapSize / 1024 / 1024} MB`);
console.log(`Total: ${performance.memory.totalJSHeapSize / 1024 / 1024} MB`);
```

### Lighthouse Audit
```bash
# Run Lighthouse from command line
lighthouse https://your-app.com --output html
```

### WebPageTest
- Online tool for comprehensive performance testing
- Tests from multiple locations
- Provides detailed waterfall charts

### GTmetrix
- Performance grading
- Recommendations for improvement
- Historical tracking

---

## Performance Optimization Checklist

### Frontend Optimization
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Image optimization
- [ ] Bundle size < 500KB
- [ ] Tree shaking enabled
- [ ] Minification enabled
- [ ] Compression enabled (gzip/brotli)
- [ ] Caching headers set
- [ ] CDN used for static assets

### React Optimization
- [ ] React.memo used for pure components
- [ ] useMemo for expensive calculations
- [ ] useCallback for event handlers
- [ ] Virtualization for large lists
- [ ] Debouncing for search/filter
- [ ] Throttling for scroll/resize
- [ ] Avoid unnecessary re-renders
- [ ] Keys properly set in lists

### Database Optimization
- [ ] Indexes on frequently queried columns
- [ ] Queries optimized
- [ ] N+1 queries eliminated
- [ ] Batch operations used
- [ ] Connection pooling configured
- [ ] Read replicas used (if needed)
- [ ] Query caching enabled

### Network Optimization
- [ ] API calls minimized
- [ ] Requests batched
- [ ] Compression enabled
- [ ] Caching implemented
- [ ] CDN used
- [ ] HTTP/2 enabled
- [ ] Keep-alive connections

### Caching Strategy
- [ ] Browser cache configured
- [ ] Service worker implemented
- [ ] API response caching
- [ ] Static asset caching
- [ ] Cache invalidation strategy
- [ ] Cache size limits

---

## Performance Monitoring

### Real User Monitoring (RUM)
```javascript
// Track page load time
window.addEventListener('load', () => {
  const timing = performance.timing;
  const loadTime = timing.loadEventEnd - timing.navigationStart;
  console.log(`Page load: ${loadTime}ms`);
});

// Track API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const start = performance.now();
  return originalFetch.apply(this, args).then(response => {
    const duration = performance.now() - start;
    console.log(`API call: ${duration}ms`);
    return response;
  });
};
```

### Performance Budget
```javascript
// Set performance budget
const budget = {
  'first-contentful-paint': 2000,
  'largest-contentful-paint': 4000,
  'total-blocking-time': 300,
  'cumulative-layout-shift': 0.1,
  'speed-index': 3000,
};

// Check with Lighthouse
```

---

## Performance Report Template

```markdown
# Performance Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Environment]
**Browser:** [Browser]
**Device:** [Device]

## Summary
- Overall Score: [X/100]
- Status: [Pass/Fail]

## Test Results

| Test | Target | Actual | Status |
|------|--------|--------|--------|
| Initial Load | < 2s | [X]s | [✅/❌] |
| Data Load (100) | < 1s | [X]s | [✅/❌] |
| Data Load (1000) | < 3s | [X]s | [✅/❌] |
| Filter | < 500ms | [X]ms | [✅/❌] |
| Sort | < 500ms | [X]ms | [✅/❌] |
| CRUD | < 1s | [X]s | [✅/❌] |
| Export | < 2s | [X]s | [✅/❌] |
| Import | < 3s | [X]s | [✅/❌] |
| Memory | < 200MB | [X]MB | [✅/❌] |

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Conclusion
[Overall assessment and next steps]
```

---

## Conclusion

This performance testing guide provides comprehensive scenarios to ensure the application performs well under various conditions. Regular performance testing should be conducted to maintain optimal performance as the application grows.

**Testing Frequency:**
- After major changes
- Before releases
- Monthly for production
- When performance issues reported

**Success Criteria:**
- All target metrics met
- No critical performance issues
- Acceptable user experience
- Scalable architecture
