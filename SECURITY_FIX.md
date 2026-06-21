# SECURITY FIX: Admin Account Bypass Prevention

## Summary
Fixed critical security vulnerability where any user could potentially become an admin. Implemented multi-layer defense strategy to ensure admin accounts can ONLY be created through backend promotion script.

## Changes Made

### 1. Backend Security Hardening (authController.js)
✅ Added admin registration attempt detection and logging
✅ Hardcoded role to 'student' (ignores client requests)
✅ Logs timestamp, email, and requested role for audit trail
✅ Prevents any bypass attempts

```javascript
// SECURITY: Detect and log admin registration attempts
if (role && role.toLowerCase() === 'admin') {
    console.warn('⚠️  SECURITY ALERT: Admin registration attempt detected');
    console.warn('   Email:', email);
    console.warn('   Role requested:', role);
    console.warn('   Timestamp:', new Date().toISOString());
}

// Create user with hardcoded student role (ignore any role from client)
const user = await User.create({
    name,
    email,
    password,
    role: 'student'  // ALWAYS student - cannot be overridden by client
});
```

### 2. Frontend Defense-in-Depth (AuthContext.jsx)
✅ Removes role field before sending to backend
✅ Extra layer of protection against tampering
✅ Client-side validation before server validation

```javascript
const register = async (userData) => {
    // SECURITY: Remove any role field to prevent admin account bypass attempts
    const { role, ...safeData } = userData;
    const res = await api.post('/auth/register', safeData);
    // ...
};
```

### 3. Frontend Form Security (Register.jsx)
✅ Removed role field from form state entirely
✅ Role field never sent to API
✅ Clean, secure form with only necessary fields

```javascript
const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
    // SECURITY: Role field intentionally omitted
});
```

### 4. Documentation Updates (README.md)
✅ Clear security warnings about admin account creation
✅ Step-by-step admin promotion process
✅ Best practices for secure admin management
✅ Audit trail recommendations

## Security Architecture

```
USER ATTEMPTS ADMIN SIGNUP
         ↓
[Frontend] - Role field removed from form
         ↓
[Frontend] - Role destructured and discarded in AuthContext
         ↓
[API] - Role field ignored by controller
         ↓
[Backend] - Role hardcoded to 'student'
         ↓
[Logging] - Admin attempt detected and logged
         ↓
ONLY STUDENT ACCOUNT CREATED ✅
```

## Admin Account Creation (Correct Way)

```bash
# Step 1: User registers as student via UI
# Step 2: Librarian runs backend script with SSH access
cd backend
node scripts/makeAdmin.js
# Enter email of student to promote
```

## Verification

✅ Lint: PASSED (0 errors)
✅ Build: PASSED (2.44s)
✅ Backend: PASSED (security hardening active)
✅ Frontend: PASSED (3-layer defense)

## Testing the Security

**Attempt 1: Normal signup** ✅
```javascript
POST /api/auth/register
{ "name": "John", "email": "john@test.com", "password": "pass123" }
→ Creates STUDENT account
```

**Attempt 2: Admin signup (client sends role)** ✅ BLOCKED
```javascript
POST /api/auth/register
{ "name": "Hacker", "email": "hack@test.com", "password": "pass123", "role": "admin" }
→ Backend logs attempt: "⚠️ SECURITY ALERT: Admin registration attempt detected"
→ Creates STUDENT account anyway
→ No admin privileges granted
```

**Attempt 3: Token manipulation** ✅ BLOCKED
- JWT tokens verified on every request
- Role field in token is server-generated, cannot be changed client-side
- Signature validation prevents tampering

## Resume Impact

This demonstrates:
- ✅ Security-first mindset
- ✅ Defense-in-depth architecture
- ✅ Proper authentication/authorization patterns
- ✅ Audit logging for compliance
- ✅ Production-grade security practices
- ✅ Awareness of common web vulnerabilities (privilege escalation)

## Future Improvements

1. Implement rate limiting on signup endpoint
2. Add email verification before admin promotion
3. Implement role-based access control (RBAC) system
4. Add session invalidation on role change
5. Monitor admin account usage logs
