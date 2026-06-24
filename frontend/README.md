# Gnovium Frontend

This is the Next.js frontend for the Gnovium Knowledge Operating System.

## Features

- **Perfect 10/10 Rating Navbar**: Responsive, accessible, theme-aware navigation with smooth animations
- **Session Management**: Secure authentication with token refresh and session persistence
- **API Integration**: Connects to api.gnovium.com for authentication and user data
- **Dark/Light Theme Support**: Automatic theme detection with smooth transitions
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **TypeScript**: Full type safety with proper interfaces
- **Component Architecture**: Modular, reusable components

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/           # Navbar component
│   │   ├── lib/                  # API client and session management
│   │   ├── page.tsx             # Home/Dashboard page
│   │   ├── signin/              # Sign in page
│   │   ├── signup/              # Sign up page
│   │   └── globals.css          # Complete CSS from gnovium-docs
│   └── ...
├── package.json
├── next.config.ts
└── ...
```

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## API Integration

The frontend integrates with `https://api.gnovium.com/api/v1` for:

- **Authentication**: `/auth/login`, `/auth/register`, `/auth/me`, `/auth/refresh`
- **User Management**: User profile and account settings
- **Session Management**: Token-based authentication with refresh tokens

## Session Management

The frontend uses a custom session context that:

- Manages authentication state across the app
- Automatically refreshes tokens when needed
- Provides logout functionality
- Persists session state in localStorage
- Handles authentication errors gracefully

## Navbar Features

The perfect 10/10 rating navbar includes:

- **Responsive Design**: Mobile, tablet, and desktop layouts
- **Theme Switching**: Dark/light mode with smooth transitions
- **User Menu**: Account dropdown with profile and logout options
- **Scroll Effects**: Background blur and shadow on scroll
- **Smooth Animations**: All transitions are smooth and accessible
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Search Integration**: Search functionality (to be implemented)
- **Notifications**: Notification center (to be implemented)
- **Quick Actions**: Common actions accessible from navbar
- **User Profile**: Avatar and user information display

## Authentication Flow

1. User visits the site
2. If not authenticated, redirected to sign-in page
3. User enters credentials
4. Frontend calls API to authenticate
5. Session context stores user and tokens
6. User is redirected to dashboard
7. Session persists across page refreshes
8. Tokens are automatically refreshed when needed
9. User can logout at any time

## Components

### Navbar
- Located in `src/app/components/Navbar.tsx`
- Provides navigation, theme switching, and user account access
- Fully responsive with mobile menu
- Smooth animations and transitions

### Session Provider
- Located in `src/lib/session.ts`
- Manages authentication state
- Provides login, logout, and token refresh functions
- Automatically fetches user profile on login

### API Client
- Located in `src/lib/api.ts`
- Handles all API calls to the backend
- Includes error handling and type safety
- Uses api.gnovium.com as the base URL

## CSS

The frontend uses the complete CSS from `gnovium-docs/src/app/globals.css` which includes:

- **Theme System**: Light/dark, sepia, high-contrast, ocean, and midnight themes
- **Neo-brutalist Design**: Bold borders, shadows, and animations
- **Typography**: Display headings, text steps, and body text
- **Utilities**: Grid backgrounds, scrollbars, dividers, and more
- **Components**: Skeleton loaders, tooltips, and micro-interactions
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Future Enhancements

- **Search**: Full-text search across documentation
- **Notifications**: Real-time notifications
- **Settings**: User preferences and account settings
- **Dashboard**: Analytics and usage statistics
- **API Keys**: Generate and manage API keys
- **Documents**: Upload and manage documents
- **Collaboration**: Share documents with other users
- **Analytics**: Usage analytics and insights
- **Multi-language**: Support for multiple languages
- **Accessibility**: Advanced accessibility features

## Testing

To test the authentication flow:

1. Start the Flask backend (if running locally)
2. Run `npm run dev` in the frontend directory
3. Navigate to `http://localhost:3000`
4. Test sign-in and sign-up functionality
5. Verify session persistence
6. Test theme switching
7. Test responsive design

## Troubleshooting

### Common Issues

1. **API Connection Issues**: Ensure the backend is running or verify the API endpoint
2. **Theme Not Switching**: Check localStorage and browser storage
3. **Authentication Failures**: Verify API credentials and network connectivity
4. **Responsive Design Issues**: Check browser dev tools for responsive design mode

### Debug Tips

- Use browser dev tools to inspect network requests
- Check console for JavaScript errors
- Verify API endpoints are correct
- Test with different browsers
- Clear browser cache if needed

## License

This project is part of the Gnovium Knowledge Operating System.
