# Inactivity Timeout - User Guide

## Overview

Your FinanceFlow application now includes an automatic logout feature to protect your financial data. If you don't interact with the application for 2 minutes, you will be automatically signed out for security purposes.

---

## How It Works

### Automatic Logout
- **Timeout Duration:** 2 minutes (120 seconds)
- **When It Activates:** After 2 minutes of no activity
- **What Happens:** You'll see a message and be redirected to the login page

### What Counts as Activity?
The following actions reset the 2-minute timer:
- 🖱️ Moving your mouse
- 🖱️ Clicking anywhere on the page
- ⌨️ Typing on your keyboard
- 📜 Scrolling the page
- 📱 Touching the screen (mobile devices)

### When Does It NOT Activate?
The timeout is **disabled** on these pages:
- Login page (`/login`)
- Sign up page (`/signup`)
- Password reset page (`/reset-password`)
- Update password page (`/update-password`)

---

## What to Expect

### Normal Usage
If you're actively using the application (clicking, typing, scrolling), you'll never see the timeout. The timer resets every time you interact with the app.

### Idle Period
If you step away from your computer or stop interacting with the app:
1. **At 2 minutes:** You'll see an alert message
2. **Alert says:** "You were signed out due to 2 minutes of inactivity. Please sign in again."
3. **You'll be redirected** to the login page
4. **Sign in again** to continue using the app

### Browser Notification (Optional)
If you've allowed browser notifications, you may also see a desktop notification when you're signed out due to inactivity.

---

## Multiple Browser Tabs

### How It Works
If you have the application open in multiple browser tabs:
- Activity in **any tab** resets the timer for **all tabs**
- If you're inactive in **all tabs** for 2 minutes, **all tabs** will log you out
- This keeps your session synchronized across tabs

### Example Scenarios

**Scenario 1: Active in One Tab**
- Tab A: You're working
- Tab B: Open but idle
- Result: Both tabs stay logged in (Tab A activity resets both timers)

**Scenario 2: Idle in All Tabs**
- Tab A: Idle for 2 minutes
- Tab B: Idle for 2 minutes
- Result: Both tabs log you out

---

## Hidden Tabs

### What Happens When You Switch Tabs?
If you switch to another browser tab or application:
- The inactivity timer **pauses** while the tab is hidden
- When you return to the FinanceFlow tab:
  - If you were gone for **less than 2 minutes**: Timer resumes normally
  - If you were gone for **2+ minutes**: You'll be logged out immediately

### Example
1. You're working in FinanceFlow
2. You switch to another tab to check email
3. You return after 3 minutes
4. **Result:** You're logged out and need to sign in again

---

## Your Data is Safe

### What Happens to Your Data?
- ✅ **All your data is saved** in the cloud database
- ✅ **Nothing is deleted** when you're logged out
- ✅ **You can sign back in** and access all your data
- ✅ **No data loss** occurs due to inactivity timeout

### What Gets Cleared?
When you're logged out due to inactivity:
- ❌ Your session token is invalidated
- ❌ Temporary data in your browser's memory is cleared
- ✅ Your actual financial data remains safe in the cloud database

---

## How to Avoid Automatic Logout

### Stay Active
Simply interact with the application periodically:
- Move your mouse
- Click on something
- Type in a field
- Scroll the page

Any of these actions will reset the 2-minute timer.

### Quick Tips
1. **Keep the tab visible** - Don't switch to other tabs for extended periods
2. **Interact regularly** - Even a small click resets the timer
3. **Save your work** - If you're entering data, save it before stepping away

---

## What If I Get Logged Out?

### Don't Worry!
Getting logged out is normal and expected after 2 minutes of inactivity. Here's what to do:

1. **You'll see a message:** "You were signed out due to 2 minutes of inactivity. Please sign in again."
2. **You'll be on the login page**
3. **Enter your credentials** (email and password)
4. **Click "Sign in"**
5. **You're back in!** All your data is still there

### Your Data is Still There
Even though you were logged out:
- All your expenses are saved
- All your debts are saved
- All your categories are saved
- All your reports are available
- Nothing was deleted or lost

---

## Frequently Asked Questions

### Q: Why do I need to log in again?
**A:** This is a security feature to protect your financial data. If you step away from your computer, automatic logout prevents unauthorized access to your account.

### Q: Can I disable the automatic logout?
**A:** Currently, the 2-minute timeout is a security requirement and cannot be disabled. This protects your financial data from unauthorized access.

### Q: Will I lose my data if I'm logged out?
**A:** No! All your data is safely stored in the cloud database. You can sign back in and access everything as before.

### Q: Does the timeout work on my phone?
**A:** Yes! The timeout works on all devices - desktop, tablet, and mobile. Touch interactions (tapping, scrolling) count as activity.

### Q: What if I'm reading a long report?
**A:** If you're actively scrolling or interacting with the page, the timer resets. If you stop interacting for 2 minutes, you'll be logged out.

### Q: Can I extend the timeout duration?
**A:** The timeout is set to 2 minutes for security purposes and cannot be changed by users.

### Q: Does this happen if I'm on a call?
**A:** If you're not interacting with the application (no mouse/keyboard/touch activity) for 2 minutes, yes, you'll be logged out.

### Q: What if I have multiple tabs open?
**A:** Activity in any tab resets the timer for all tabs. If all tabs are idle for 2 minutes, all will log you out.

---

## Security Benefits

### Why This Feature Exists
1. **Protects your data** - Prevents unauthorized access if you step away
2. **Compliance** - Meets security best practices for financial applications
3. **Peace of mind** - Know your data is secure even if you forget to log out
4. **Session management** - Automatically manages session lifecycle

### What This Prevents
- ❌ Unauthorized access to your financial data
- ❌ Accidental data exposure on shared computers
- ❌ Session hijacking from idle sessions
- ❌ Data breaches from forgotten logins

---

## Troubleshooting

### Issue: I'm being logged out too quickly
**Possible Causes:**
- You're not interacting with the page (no mouse/keyboard activity)
- You switched to another tab for more than 2 minutes
- Your browser is in the background

**Solution:**
- Interact with the page regularly (click, type, scroll)
- Keep the FinanceFlow tab visible and active
- If you need to switch tabs, try to return within 2 minutes

### Issue: I'm not being logged out after 2 minutes
**Possible Causes:**
- You're on a public route (login, signup, etc.)
- Background processes are triggering activity events
- Browser extensions are simulating activity

**Solution:**
- This is normal on public routes
- Check if you're actually idle (no mouse/keyboard activity)
- Try disabling browser extensions temporarily

### Issue: I got logged out but didn't see the message
**Possible Causes:**
- Browser notifications were blocked
- You were in another tab when logout occurred
- Alert was dismissed automatically

**Solution:**
- Allow browser notifications for the site
- Check if you're on the login page (you were logged out)
- Sign in again to continue

### Issue: My data seems to be missing after login
**Possible Causes:**
- You're logged in as a different user
- Data is still loading
- Browser cache issue

**Solution:**
- Verify you're logged in with the correct email
- Wait a few seconds for data to load
- Refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Check the database in Supabase Dashboard

---

## Best Practices

### For Security
1. ✅ **Log out manually** when you're done using the app
2. ✅ **Use strong passwords** for your account
3. ✅ **Don't share your login credentials** with anyone
4. ✅ **Check your session** periodically to ensure you're logged in as the correct user

### For Convenience
1. ✅ **Keep the tab active** if you're working on something
2. ✅ **Save your work** before stepping away
3. ✅ **Use a password manager** to quickly log back in
4. ✅ **Bookmark the login page** for quick access

### For Multiple Devices
1. ✅ **Log out on all devices** when switching devices
2. ✅ **Use the same browser** on each device for consistency
3. ✅ **Keep sessions synchronized** by being active in one tab

---

## Technical Details (For Advanced Users)

### How It Works
- **Timer:** JavaScript `setTimeout` with 120,000ms (2 minutes)
- **Activity Detection:** Event listeners for mouse, keyboard, scroll, touch
- **Storage:** Uses `sessionStorage` for cross-tab synchronization
- **Visibility API:** Uses `document.visibilityState` to detect hidden tabs
- **Authentication:** Uses Supabase Auth for session management

### Browser Compatibility
- ✅ Chrome/Edge (Chromium) - Full support
- ✅ Firefox - Full support
- ✅ Safari - Full support
- ✅ Mobile browsers - Full support with touch events

### Performance Impact
- **CPU Usage:** Negligible (only checks timestamps)
- **Memory Usage:** Minimal (stores last activity timestamp)
- **Network Usage:** None (all client-side)
- **Battery Impact:** Negligible on mobile devices

---

## Support

### Need Help?
If you have questions or issues with the inactivity timeout:

1. **Check this guide** - Most questions are answered here
2. **Review the troubleshooting section** - Common issues and solutions
3. **Contact support** - If you need additional help

### Feedback
We're always improving! If you have suggestions for the inactivity timeout feature:
- Let us know if the 2-minute duration is too short or too long
- Tell us if there are scenarios where the timeout doesn't work as expected
- Share any ideas for improving the user experience

---

## Summary

The 2-minute inactivity timeout is a security feature that:
- ✅ Protects your financial data
- ✅ Automatically logs you out after 2 minutes of inactivity
- ✅ Keeps your data safe in the cloud database
- ✅ Works across multiple tabs and devices
- ✅ Pauses when the tab is hidden
- ✅ Resumes when you return

**Remember:** Your data is always safe. Getting logged out is normal and expected. Just sign in again to continue where you left off!

---

**Last Updated:** 2026-01-29  
**Version:** 1.0  
**Feature Status:** ✅ Active and Working
