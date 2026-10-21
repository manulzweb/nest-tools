import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator to easily retrieve the authenticated user from the Request object.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: UserEntity) {
 *   return user;
 * }
 *
 * @Get('id')
 * getId(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  }
);
