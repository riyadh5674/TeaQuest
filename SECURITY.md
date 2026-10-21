# TeaQuest Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please do NOT open a public issue for security vulnerabilities.**

Instead, please report security vulnerabilities via:

1. **GitHub Security Advisories** (preferred): Go to the [Security tab](https://github.com/riyadh5674/TeaQuest/security) and click "Report a vulnerability"
2. **Email**: security@teaquest.example.com (replace with actual email)

### What to Include

Please include as much of the following as possible:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes
- Your contact information for follow-up

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: Within 7 days
  - High: Within 14 days
  - Medium: Within 30 days
  - Low: Within 90 days

## Security Features

TeaQuest implements several security measures:

### Authentication & Authorization
- Firebase Authentication with email/password
- Password reset via secure email links
- Role-based access control (player/admin)
- First account auto-becomes admin (Guild Master)
- Admin role changes require existing admin privileges

### Data Protection
- Row Level Security (RLS) on all database tables
- Users can only access their own data
- Admins can access all data
- Friendships and private messages restricted to buddies only
- No email addresses exposed in player directory

### Input Validation & Sanitization
- Client-side XSS prevention via escapeHTML
- Server-side validation via database constraints
- File upload restrictions (8MB max, no SVGs, type validation)
- CSRF tokens on all forms
- Rate limiting on API endpoints

### Content Security Policy
Strict CSP headers preventing:
- Inline script execution (except explicitly allowed)
- External resource loading from untrusted domains
- Frame embedding (clickjacking protection)
- Object/plugin execution

### Secure Communication
- HTTPS enforced in production
- Secure cookies with SameSite attributes
- Firebase tokens transmitted securely
- WebSocket connections over WSS

### Payment Security
- Stripe Elements for PCI-compliant card handling
- No card data touches our servers
- Payment intents created server-side
- Webhook signature verification

## Security Headers

The following headers are set via CSP meta tag:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com wss://*.firebaseio.com;
  media-src 'self' https://*.firebasestorage.googleapis.com blob:;
  frame-src 'self' https://*.firebaseapp.com;
  worker-src 'self' blob:;
  manifest-src 'self';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

## Known Limitations

- Development mode uses `'unsafe-inline'` for scripts (required for vanilla JS without build step)
- Firebase config exposed in client (standard for Firebase web apps)
- LocalStorage used for offline caching (not encrypted)

## Security Checklist for Contributors

When contributing code, ensure:

- [ ] No `eval()`, `new Function()`, or `innerHTML` with user data
- [ ] All user inputs escaped via `Security.escapeHTML()` or `escapeHTML()`
- [ ] URLs validated via `Security.sanitizeURL()`
- [ ] Forms include CSRF tokens
- [ ] Rate limiting considered for new endpoints
- [ ] Database queries use parameterized statements (via Firebase SDK)
- [ ] New tables have RLS policies
- [ ] File uploads validated for type and size
- [ ] No secrets committed to repository
- [ ] Dependencies updated regularly

## Security Tools

- **ESLint** with security rules
- **npm audit** in CI pipeline
- **Snyk** scanning (optional)
- **Dependabot** for automated dependency updates
- **CSP** enforcement in production

## Contact

For security questions or concerns, open a [Security Advisory](https://github.com/riyadh5674/TeaQuest/security/advisories/new) or email the maintainers.