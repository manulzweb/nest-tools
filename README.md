# @manulz/nest-tools

> Developer utilities, Clean Architecture generator, and runtime helpers for NestJS projects.

[![npm version](https://img.shields.io/npm/v/@manulz/nest-tools.svg)](https://www.npmjs.com/package/@manulz/nest-tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Features

- ⚡ **Interactive CLI**: Run without arguments for an interactive step-by-step wizard.
- 📦 **Resource Generator**: Create Module, Controller, and Service with a single command (configurable tests, flat structure, and dry-run).
- 🏛 **Clean Architecture / Hexagonal Generator**: Scaffold Domain Entities, Repository Interfaces, Application Use Cases, DTOs, and Infrastructure Controllers/Repositories in one go.
- 🩺 **Doctor Diagnostics**: Inspect your NestJS project for common issues, missing configs, or unimported modules.
- 🛠 **Runtime NestJS Helpers**:
  - `@Public()` decorator for auth bypass.
  - `@CurrentUser()` parameter decorator.
  - `TransformResponseInterceptor` for standardized JSON envelopes.
  - `PaginationQueryDto` and `createPaginatedResponse()` for turnkey pagination.
- 🔌 **Programmatic API**: Every feature is exported as a TypeScript module for use in CI, scripts, or build pipelines.

---

## 📦 Installation

### Global or CLI via npx
```bash
# Run interactively without installing
npx @manulz/nest-tools

# Or install globally
npm install -g @manulz/nest-tools
```

### In a NestJS Project (CLI + Runtime Helpers)
```bash
npm install @manulz/nest-tools
```

---

## 💻 CLI Usage

### 1. Interactive Mode
Simply run the command with no arguments:
```bash
nest-tools
```

### 2. Standard Resource Generation
Generates `module`, `controller`, and `service`:
```bash
nest-tools g users
nest-tools generate users --spec      # include tests
nest-tools generate users --flat      # flat layout
nest-tools generate users --dry-run   # preview only
```

### 3. Clean Architecture / Hexagonal Module
Generates a complete DDD / Clean Architecture structure inside `src/modules/<name>/` (`domain/`, `application/`, `infrastructure/`, `interfaces/`) and automatically registers it into `src/app.module.ts`:
```bash
nest-tools hex orders
nest-tools clean products
nest-tools g users --clean
```

Generated structure:
```text
src/
├── modules/
│   ├── orders/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── orders.entity.ts
│   │   │   └── value-objects/
│   │   │       ├── orders-id.vo.ts
│   │   │       └── index.ts
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   ├── create-orders.use-case.ts
│   │   │   │   ├── find-orders.use-case.ts
│   │   │   │   └── index.ts
│   │   │   └── ports/
│   │   │       ├── orders.repository.port.ts
│   │   │       └── index.ts
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       └── in-memory-orders.repository.ts
│   │   ├── interfaces/
│   │   │   ├── http/
│   │   │   │   └── orders.controller.ts
│   │   │   └── dto/
│   │   │       ├── create-orders.dto.ts
│   │   │       ├── update-orders.dto.ts
│   │   │       └── index.ts
│   │   └── orders.module.ts
│   │
│   ├── products/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── interfaces/
│   │   └── products.module.ts
│   │
│   └── users/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       ├── interfaces/
│       └── users.module.ts
│
├── app.module.ts
└── main.ts
```

### 4. Diagnostics (`doctor`)
Inspect your current project health:
```bash
nest-tools doctor
```

### 5. Config Init
Create a `nest-tools.json` file in your root:
```bash
nest-tools init
```

---

## 🛠 Programmatic API & Runtime Helpers

You can import generators, diagnostics, and NestJS runtime helpers in your TypeScript code:

```typescript
import {
  // Generators
  generateResource,
  generateCleanArchitecture,
  // Diagnostics
  runDoctor,
  // Decorators
  Public,
  CurrentUser,
  // Interceptors
  TransformResponseInterceptor,
  // Pagination
  PaginationQueryDto,
  createPaginatedResponse,
} from '@manulz/nest-tools';
```

### Decorators
```typescript
import { Controller, Get } from '@nestjs/common';
import { Public, CurrentUser } from '@manulz/nest-tools';

@Controller('users')
export class UsersController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
```

### Response Interceptor
```typescript
// In main.ts
import { TransformResponseInterceptor } from '@manulz/nest-tools';

app.useGlobalInterceptors(new TransformResponseInterceptor());
// Wraps output in: { statusCode: 200, success: true, data: ..., timestamp: '...' }
```

### Pagination Helper
```typescript
import { PaginationQueryDto, createPaginatedResponse } from '@manulz/nest-tools';

@Get()
async findAll(@Query() query: PaginationQueryDto) {
  const [items, total] = await this.service.findAndCount({
    skip: query.skip,
    take: query.take,
  });

  return createPaginatedResponse(items, total, query.page, query.limit);
}
```

---

## 📄 License

MIT © [Manulz](https://github.com/manulzweb)
