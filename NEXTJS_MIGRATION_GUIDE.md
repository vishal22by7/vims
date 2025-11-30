# Next.js Migration Guide

## Overview
This document outlines the migration from Create React App (CRA) to Next.js for the VIMS frontend.

## Current Stack
- **Frontend**: Create React App (React 18.3.1)
- **Routing**: React Router DOM v6
- **State Management**: React Context API
- **Styling**: CSS files
- **Build Tool**: react-scripts (Webpack)

## Target Stack (Next.js)
- **Framework**: Next.js 14+ (App Router)
- **Routing**: File-based routing
- **State Management**: React Context API (same)
- **Styling**: CSS Modules or Tailwind CSS
- **Build Tool**: Next.js (Turbopack)

## Migration Steps

### Phase 1: Setup Next.js Project
1. Create new Next.js app in `frontend-next` directory
2. Install dependencies
3. Configure TypeScript (optional but recommended)
4. Set up environment variables

### Phase 2: Convert Structure
1. **Pages Migration**:
   - `src/pages/Login.js` → `app/login/page.js`
   - `src/pages/Register.js` → `app/register/page.js`
   - `src/pages/Dashboard.js` → `app/dashboard/page.js`
   - `src/pages/BuyPolicy.js` → `app/buy-policy/page.js`
   - `src/pages/Policies.js` → `app/policies/page.js`
   - `src/pages/Claims.js` → `app/claims/page.js`
   - `src/pages/SubmitClaim.js` → `app/submit-claim/page.js`
   - `src/pages/Profile.js` → `app/profile/page.js`
   - `src/pages/admin/*` → `app/admin/*/page.js`

2. **Components Migration**:
   - `src/components/Navbar.js` → `app/components/Navbar.js`
   - Keep same structure for reusable components

3. **Context Migration**:
   - `src/context/AuthContext.js` → `app/context/AuthContext.js`
   - `src/context/ThemeContext.js` → `app/context/ThemeContext.js`
   - Wrap with Next.js providers

### Phase 3: Routing Changes
- Remove `react-router-dom`
- Use Next.js file-based routing
- Convert `<Link>` from react-router to Next.js `<Link>`
- Convert `useNavigate()` to Next.js `useRouter()`
- Convert `PrivateRoute` to Next.js middleware

### Phase 4: Authentication
- Create `middleware.js` for route protection
- Update AuthContext to work with Next.js
- Handle server-side auth checks

### Phase 5: API Integration
- Keep existing API service (`services/api.js`)
- Optionally create Next.js API routes for proxy
- Update API calls if needed

### Phase 6: Styling
- Convert CSS files to CSS Modules or keep global CSS
- Update imports
- Consider Tailwind CSS for better DX

### Phase 7: Build & Deploy
- Update build scripts
- Test production build
- Update deployment configuration

## File Structure Comparison

### Current (CRA)
```
frontend/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   ├── App.js
│   └── index.js
└── package.json
```

### Next.js (App Router)
```
frontend/
├── public/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.js
│   │   └── register/
│   │       └── page.js
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.js
│   │   ├── buy-policy/
│   │   │   └── page.js
│   │   └── ...
│   ├── admin/
│   │   ├── page.js
│   │   ├── policy-types/
│   │   │   └── page.js
│   │   └── ...
│   ├── components/
│   ├── context/
│   ├── services/
│   ├── layout.js
│   └── page.js
├── middleware.js
└── package.json
```

## Key Code Changes

### Routing
```javascript
// Before (React Router)
import { Link, useNavigate } from 'react-router-dom';
<Link to="/dashboard">Dashboard</Link>
navigate('/dashboard');

// After (Next.js)
import Link from 'next/link';
import { useRouter } from 'next/navigation';
<Link href="/dashboard">Dashboard</Link>
router.push('/dashboard');
```

### Route Protection
```javascript
// Before (React Router)
<PrivateRoute>
  <Dashboard />
</PrivateRoute>

// After (Next.js Middleware)
// middleware.js
export function middleware(request) {
  // Check auth and redirect
}
```

### API Calls
```javascript
// Can keep same or use Next.js API routes
// Option 1: Keep existing API service
import { api } from '@/services/api';

// Option 2: Use Next.js API routes
// app/api/policies/route.js
```

## Estimated Time
- **Small team**: 2-3 days
- **Solo developer**: 4-5 days
- **With testing**: Add 1-2 days

## Risks & Considerations
1. **Breaking Changes**: Some React Router patterns don't translate directly
2. **Learning Curve**: Team needs to learn Next.js patterns
3. **Testing**: All routes need re-testing
4. **Deployment**: Different build/deploy process

## Recommendation
**Pros of Migration:**
- Better SEO (important for insurance platform)
- Modern framework with great DX
- Better performance out of the box
- Production-ready features

**Cons:**
- Significant refactoring effort
- Potential bugs during migration
- Team learning curve

**Recommendation**: 
- ✅ **Migrate if**: You need SEO, want modern features, have time for refactoring
- ❌ **Don't migrate if**: Project is near deadline, team unfamiliar with Next.js, current setup works fine

## Alternative: Incremental Migration
Consider keeping CRA for now and planning migration for next major version, or migrating specific pages incrementally.

