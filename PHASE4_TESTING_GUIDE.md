# Phase 4: Authentication Testing Guide

## Prerequisites

Before testing, ensure:
- ✅ Phase 1 complete (Supabase configured)
- ✅ Phase 2 & 3 complete (Database schema and RLS policies applied)
- ✅ Phase 4 complete (Authentication implemented)
- ✅ Development server running (`npm run dev`)
- ✅ Supabase project has Email provider enabled

## Supabase Configuration Check

### 1. Verify Email Provider is Enabled

1. Go to Supabase Dashboard → Authentication → Providers
2. Ensure "Email" provider is enabled
3. Note the "Confirm email" setting (on/off)

### 2. Configure Site URL

1. Go to Authentication → URL Configuration
2. Set Site URL: `http://localhost:5173`
3. Add Redirect URL: `http://localhost:5173/update-password`

### 3. Optional: Disable Email Confirmation (for easier testing)

1. Go to Authentication → Providers → Email
2. Toggle off "Confirm email"
3. Save changes

**Note:** For production, keep email confirmation enabled for security.

---

## Test Scenario 1: Sign Up Flow

### Steps:

1. **Navigate to Signup Page**
   ```
   Open browser to: http://localhost:5173/signup
   ```
   - ✅ Should see signup form
   - ✅ Should see "Create your account" title
   - ✅ Should see links to login page

2. **Test Validation**
   ```
   Try submitting empty form
   ```
   - ✅ Should show validation errors
   - ✅ Required fields should be marked

3. **Test Password Mismatch**
   ```
   Enter:
   - Email: test@example.com
   - Password: password123
   - Confirm: password456
   Click "Create account"
   ```
   - ✅ Should show "Passwords do not match" error

4. **Test Short Password**
   ```
   Enter:
   - Email: test@example.com
   - Password: 12345
   - Confirm: 12345
   Click "Create account"
   ```
   - ✅ Should show "Password must be at least 6 characters" error

5. **Successful Signup (Email Confirmation OFF)**
   ```
   Enter:
   - Email: test1@example.com
   - Password: password123
   - Confirm: password123
   Click "Create account"
   ```
   - ✅ Should redirect to dashboard
   - ✅ Should see user email in header
   - ✅ Should see user avatar

6. **Successful Signup (Email Confirmation ON)**
   ```
   Enter:
   - Email: test2@example.com
   - Password: password123
   - Confirm: password123
   Click "Create account"
   ```
   - ✅ Should show success message about email confirmation
   - ✅ Should NOT redirect to dashboard
   - Check email inbox for confirmation link
   - Click confirmation link
   - ✅ Should redirect to login page
   - Sign in with credentials
   - ✅ Should redirect to dashboard

### Verification:

Check Supabase Dashboard → Authentication → Users
- ✅ User should appear in users list
- ✅ Email should match
- ✅ Status should be "Confirmed" (if email confirmation enabled and completed)

---

## Test Scenario 2: Sign In Flow

### Steps:

1. **Sign Out First**
   ```
   Click user avatar in header
   Click "Sign out"
   ```
   - ✅ Should redirect to login page

2. **Navigate to Login Page**
   ```
   Open: http://localhost:5173/login
   ```
   - ✅ Should see login form
   - ✅ Should see "Welcome back" title

3. **Test Invalid Credentials**
   ```
   Enter:
   - Email: wrong@example.com
   - Password: wrongpassword
   Click "Sign in"
   ```
   - ✅ Should show error message
   - ✅ Should stay on login page

4. **Successful Sign In**
   ```
   Enter:
   - Email: test1@example.com (from signup)
   - Password: password123
   Click "Sign in"
   ```
   - ✅ Should redirect to dashboard
   - ✅ Should see user email in header
   - ✅ Should see user menu

5. **Test Protected Route Access**
   ```
   Try accessing: http://localhost:5173/expenses
   ```
   - ✅ Should show expenses page (already authenticated)

6. **Sign Out and Test Protection**
   ```
   Sign out
   Try accessing: http://localhost:5173/expenses
   ```
   - ✅ Should redirect to login page
   - ✅ Should NOT show expenses page

---

## Test Scenario 3: Session Persistence

### Steps:

1. **Sign In**
   ```
   Sign in with test1@example.com
   ```
   - ✅ Should be on dashboard

2. **Refresh Page**
   ```
   Press F5 or Ctrl+R
   ```
   - ✅ Should stay on dashboard
   - ✅ Should still be authenticated
   - ✅ Should see user email in header

3. **Close and Reopen Browser**
   ```
   Close browser completely
   Reopen browser
   Navigate to: http://localhost:5173
   ```
   - ✅ Should redirect to dashboard (session persisted)
   - ✅ Should still be authenticated

4. **Check localStorage**
   ```
   Open DevTools → Application → Local Storage
   Look for: sb-*-auth-token
   ```
   - ✅ Should see Supabase session token

---

## Test Scenario 4: Password Reset Flow

### Steps:

1. **Sign Out**
   ```
   Sign out if signed in
   ```

2. **Navigate to Reset Password**
   ```
   Click "Forgot password?" on login page
   OR navigate to: http://localhost:5173/reset-password
   ```
   - ✅ Should see reset password form

3. **Request Password Reset**
   ```
   Enter: test1@example.com
   Click "Send reset link"
   ```
   - ✅ Should show success message
   - ✅ Should NOT redirect

4. **Check Email**
   ```
   Check email inbox for test1@example.com
   ```
   - ✅ Should receive password reset email
   - ✅ Email should contain reset link

5. **Click Reset Link**
   ```
   Click the reset link in email
   ```
   - ✅ Should redirect to: http://localhost:5173/update-password
   - ✅ Should see update password form

6. **Update Password**
   ```
   Enter:
   - New Password: newpassword123
   - Confirm: newpassword123
   Click "Update password"
   ```
   - ✅ Should show success message
   - ✅ Should redirect to dashboard
   - ✅ Should be signed in automatically

7. **Test New Password**
   ```
   Sign out
   Sign in with:
   - Email: test1@example.com
   - Password: newpassword123
   ```
   - ✅ Should sign in successfully

8. **Test Old Password**
   ```
   Sign out
   Try signing in with:
   - Email: test1@example.com
   - Password: password123 (old password)
   ```
   - ✅ Should show error
   - ✅ Old password should not work

---

## Test Scenario 5: Route Protection

### Steps:

1. **Sign Out**
   ```
   Sign out if signed in
   ```

2. **Try Accessing Protected Routes**
   ```
   Try each URL:
   - http://localhost:5173/dashboard
   - http://localhost:5173/expenses
   - http://localhost:5173/reports
   - http://localhost:5173/debts
   - http://localhost:5173/settings
   ```
   - ✅ Each should redirect to login page
   - ✅ Should NOT show page content

3. **Try Accessing Public Routes (While Signed Out)**
   ```
   Try each URL:
   - http://localhost:5173/login
   - http://localhost:5173/signup
   - http://localhost:5173/reset-password
   ```
   - ✅ Each should show the page
   - ✅ Should NOT redirect

4. **Sign In**
   ```
   Sign in with test1@example.com
   ```

5. **Try Accessing Public Routes (While Signed In)**
   ```
   Try each URL:
   - http://localhost:5173/login
   - http://localhost:5173/signup
   - http://localhost:5173/reset-password
   ```
   - ✅ Each should redirect to dashboard
   - ✅ Should NOT show auth pages

---

## Test Scenario 6: User Menu

### Steps:

1. **Sign In**
   ```
   Sign in with any user
   ```

2. **Check Header**
   ```
   Look at top-right of header
   ```
   - ✅ Should see user avatar with initial
   - ✅ Avatar should show first letter of email

3. **Open User Menu**
   ```
   Click on user avatar
   ```
   - ✅ Should show dropdown menu
   - ✅ Should show user email
   - ✅ Should show "Signed in" text
   - ✅ Should show "Sign out" button

4. **Close User Menu**
   ```
   Click outside the menu
   ```
   - ✅ Menu should close

5. **Sign Out from Menu**
   ```
   Click "Sign out" in menu
   ```
   - ✅ Should sign out
   - ✅ Should redirect to login page
   - ✅ Menu should close

---

## Test Scenario 7: Multi-User Isolation

### Steps:

1. **Create Two Test Users**
   ```
   Sign up user1@example.com with password123
   Sign up user2@example.com with password123
   ```

2. **Sign In as User 1**
   ```
   Sign in as user1@example.com
   ```
   - ✅ Should see dashboard
   - ✅ Should see user1@example.com in header

3. **Add Some Data (Future Phase 5)**
   ```
   (This will be tested in Phase 5 when data services are implemented)
   ```

4. **Sign Out and Sign In as User 2**
   ```
   Sign out
   Sign in as user2@example.com
   ```
   - ✅ Should see dashboard
   - ✅ Should see user2@example.com in header
   - ✅ Should NOT see user1's data (when Phase 5 is complete)

---

## Test Scenario 8: Error Handling

### Steps:

1. **Test Network Error**
   ```
   Turn off internet connection
   Try to sign in
   ```
   - ✅ Should show error message
   - ✅ Should not crash

2. **Test Invalid Email Format**
   ```
   Enter: notanemail
   Try to sign up
   ```
   - ✅ Should show validation error

3. **Test Supabase Down**
   ```
   (Simulate by using invalid Supabase URL in .env.local)
   Restart dev server
   Try to sign in
   ```
   - ✅ Should show error message
   - ✅ Should handle gracefully

---

## Test Scenario 9: Responsive Design

### Steps:

1. **Test Mobile View**
   ```
   Resize browser to mobile width (< 640px)
   Navigate to login page
   ```
   - ✅ Form should be responsive
   - ✅ Should be usable on mobile

2. **Test Tablet View**
   ```
   Resize browser to tablet width (640px - 1024px)
   ```
   - ✅ Layout should adapt
   - ✅ Should be usable

3. **Test Desktop View**
   ```
   Resize browser to desktop width (> 1024px)
   ```
   - ✅ Layout should be centered
   - ✅ Should look good

---

## Test Scenario 10: Theme Support

### Steps:

1. **Test Light Mode**
   ```
   Ensure light mode is active
   Navigate to login page
   ```
   - ✅ Should see light theme
   - ✅ All elements should be visible

2. **Test Dark Mode**
   ```
   Click theme toggle
   Navigate to login page
   ```
   - ✅ Should see dark theme
   - ✅ All elements should be visible
   - ✅ Text should be readable

3. **Test All Auth Pages in Both Themes**
   ```
   Check login, signup, reset-password, update-password
   in both light and dark modes
   ```
   - ✅ All pages should work in both themes
   - ✅ Colors should be appropriate
   - ✅ Contrast should be sufficient

---

## Verification Checklist

### Functionality
- [ ] Can sign up with new account
- [ ] Can sign in with existing account
- [ ] Can sign out
- [ ] Can reset password
- [ ] Can update password after reset
- [ ] Session persists after refresh
- [ ] Session persists after browser restart
- [ ] Protected routes redirect to login
- [ ] Public routes redirect to dashboard if authenticated
- [ ] User menu shows user info
- [ ] User menu sign out works

### Validation
- [ ] Email validation works
- [ ] Password match validation works
- [ ] Password length validation works
- [ ] Required field validation works
- [ ] Error messages are clear

### Security
- [ ] Cannot access protected routes without auth
- [ ] Cannot access other users' data (Phase 5)
- [ ] Password is hashed in database
- [ ] Session tokens are secure
- [ ] Sign out invalidates session

### UI/UX
- [ ] Loading states work
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Forms are accessible
- [ ] Responsive design works
- [ ] Theme support works
- [ ] Navigation is intuitive

### Edge Cases
- [ ] Handles network errors
- [ ] Handles invalid credentials
- [ ] Handles expired sessions
- [ ] Handles duplicate signups
- [ ] Handles password reset with invalid token
- [ ] Handles concurrent sessions

---

## Common Issues and Solutions

### Issue: "Invalid login credentials"
**Solution:** Check email and password are correct. Verify user exists in Supabase.

### Issue: "Email not confirmed"
**Solution:** Check email for confirmation link. Or disable email confirmation in Supabase for testing.

### Issue: Session not persisting
**Solution:** Check localStorage is enabled. Check Supabase session settings. Clear browser cache and try again.

### Issue: Password reset link not working
**Solution:** Check redirect URL in Supabase dashboard matches your app URL. Check email template.

### Issue: Redirect loop
**Solution:** Check route configuration in App.jsx. Verify ProtectedRoute and PublicRoute logic.

### Issue: User menu not showing
**Solution:** Check Header component is updated. Check AuthContext is providing user data.

---

## Test Data

### Test Users (Create these during testing)
```
User 1:
- Email: test1@example.com
- Password: password123

User 2:
- Email: test2@example.com
- Password: password123

User 3:
- Email: user1@example.com
- Password: password123

User 4:
- Email: user2@example.com
- Password: password123
```

---

## Next Steps

After completing all tests:
- ✅ Mark all checklist items as complete
- ✅ Document any issues found
- ✅ Proceed to Phase 5 (Data Services)

If tests fail:
- Review the failing test scenario
- Check troubleshooting section
- Review Supabase configuration
- Check browser console for errors
- Review code implementation

---

## Success Criteria

Phase 4 is complete when:
- ✅ All test scenarios pass
- ✅ All checklist items are verified
- ✅ No critical bugs remain
- ✅ Authentication flow is smooth
- ✅ Error handling is robust
- ✅ UI is responsive and accessible
- ✅ Security requirements are met
