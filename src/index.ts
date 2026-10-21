// Core Generators
export {
  generateResource,
  type GenerateResourceOptions,
} from './core/generator/generate-resource';
export {
  generateCleanArchitecture,
  updateAppModule,
  type GenerateCleanArchitectureOptions,
} from './core/generator/generate-clean-architecture';

// Runner & Utils
export { runCommand, type RunCommandOptions } from './core/runner/command-runner';
export { logger } from './utils/logger';
export * from './utils/strings';

// Config
export {
  loadConfig,
  createDefaultConfig,
  type NestToolsConfig,
  DEFAULT_CONFIG,
} from './core/config';

// Diagnostics
export { runDoctor, type DoctorReport } from './core/diagnostics/doctor';

// Runtime Decorators
export { Public, IS_PUBLIC_KEY } from './runtime/decorators/public.decorator';
export { CurrentUser } from './runtime/decorators/current-user.decorator';

// Runtime Interceptors
export {
  TransformResponseInterceptor,
  type StandardApiResponse,
} from './runtime/interceptors/transform-response.interceptor';

// Runtime Pagination
export { PaginationQueryDto, type SortOrder } from './runtime/pagination/pagination.dto';
export {
  createPaginatedResponse,
  type PaginatedResult,
  type PaginationMeta,
} from './runtime/pagination/pagination.helper';
