// Re-export AuthContext as DemoUserContext for complete backward compatibility
export {
  AuthProvider as DemoUserProvider,
  useAuth as useDemoUser,
  useAuth,
  AuthProvider,
} from './AuthContext';
