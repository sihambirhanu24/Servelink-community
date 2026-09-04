// Single implementation lives in auth/guards so suspension enforcement cannot be bypassed
// by importing a different guard class.
export { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
