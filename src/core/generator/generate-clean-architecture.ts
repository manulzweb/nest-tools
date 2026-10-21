import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../../utils/logger';
import { toCamelCase, toKebabCase, toPascalCase } from '../../utils/strings';
import { loadConfig } from '../config';

export interface GenerateCleanArchitectureOptions {
  name: string;
  dryRun?: boolean;
  cwd?: string;
  modulesDir?: string;
  autoImport?: boolean;
}

export async function updateAppModule(
  moduleClassName: string,
  relativeModulePath: string,
  cwd = process.cwd(),
  dryRun = false
): Promise<boolean> {
  const appModulePath = path.join(cwd, 'src', 'app.module.ts');
  try {
    const content = await fs.readFile(appModulePath, 'utf-8');
    if (content.includes(moduleClassName)) {
      return false;
    }

    if (dryRun) {
      logger.info(`[dry-run] Would update src/app.module.ts to import ${moduleClassName}`);
      return true;
    }

    const importStatement = `import { ${moduleClassName} } from '${relativeModulePath}';\n`;

    let updatedContent = '';
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      updatedContent =
        content.slice(0, endOfLastImport + 1) +
        importStatement +
        content.slice(endOfLastImport + 1);
    } else {
      updatedContent = importStatement + content;
    }

    const importsRegex = /imports\s*:\s*\[([^\]]*)\]/;
    if (importsRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(importsRegex, (_, p1) => {
        const trimmed = p1.trim();
        if (trimmed.length === 0) {
          return `imports: [${moduleClassName}]`;
        }
        return `imports: [${moduleClassName}, ${trimmed}]`;
      });
    } else {
      const moduleDecoratorRegex = /@Module\s*\(\s*\{/;
      if (moduleDecoratorRegex.test(updatedContent)) {
        updatedContent = updatedContent.replace(
          moduleDecoratorRegex,
          `@Module({\n  imports: [${moduleClassName}],`
        );
      }
    }

    await fs.writeFile(appModulePath, updatedContent, 'utf-8');
    logger.step(`Updated src/app.module.ts (registered ${moduleClassName})`);
    return true;
  } catch {
    return false;
  }
}

export async function generateCleanArchitecture(
  options: GenerateCleanArchitectureOptions
): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadConfig(cwd);

  const dryRun = options.dryRun ?? false;
  const autoImport = options.autoImport ?? config.autoImportAppModule ?? true;

  // Clean rawName from potential 'src/' or 'modules/' prefixes
  const rawName = options.name.trim().replace(/^(src[/\\])?(modules[/\\])?/, '');
  const kebab = toKebabCase(rawName);
  const pascal = toPascalCase(rawName);
  const camel = toCamelCase(rawName);

  const modulesDir = options.modulesDir ?? config.modulesDir ?? 'src/modules';
  const baseDir = path.isAbsolute(modulesDir)
    ? path.join(modulesDir, kebab)
    : path.join(cwd, modulesDir, kebab);

  const files: { filePath: string; content: string }[] = [
    // 1. Domain Entities
    {
      filePath: path.join(baseDir, 'domain', 'entities', `${kebab}.entity.ts`),
      content: `export class ${pascal}Entity {
  id!: string;
  name!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<${pascal}Entity>) {
    Object.assign(this, partial);
  }
}
`,
    },
    // 2. Domain Value Objects
    {
      filePath: path.join(baseDir, 'domain', 'value-objects', `${kebab}-id.vo.ts`),
      content: `export class ${pascal}Id {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('${pascal}Id cannot be empty');
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  equals(other?: ${pascal}Id): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
`,
    },
    {
      filePath: path.join(baseDir, 'domain', 'value-objects', 'index.ts'),
      content: `export * from './${kebab}-id.vo';
`,
    },
    // 3. Application Ports (Interfaces)
    {
      filePath: path.join(baseDir, 'application', 'ports', `${kebab}.repository.port.ts`),
      content: `import { ${pascal}Entity } from '../../domain/entities/${kebab}.entity';

export const ${pascal.toUpperCase()}_REPOSITORY = Symbol('${pascal.toUpperCase()}_REPOSITORY');

export interface ${pascal}RepositoryPort {
  findById(id: string): Promise<${pascal}Entity | null>;
  findAll(): Promise<${pascal}Entity[]>;
  create(data: Partial<${pascal}Entity>): Promise<${pascal}Entity>;
  delete(id: string): Promise<void>;
}

export type ${pascal}Repository = ${pascal}RepositoryPort;
`,
    },
    {
      filePath: path.join(baseDir, 'application', 'ports', 'index.ts'),
      content: `export * from './${kebab}.repository.port';
`,
    },
    // 4. Application Use Cases
    {
      filePath: path.join(baseDir, 'application', 'use-cases', `create-${kebab}.use-case.ts`),
      content: `import { Inject, Injectable } from '@nestjs/common';
import {
  ${pascal}RepositoryPort,
  ${pascal.toUpperCase()}_REPOSITORY,
} from '../ports/${kebab}.repository.port';
import { ${pascal}Entity } from '../../domain/entities/${kebab}.entity';
import { Create${pascal}Dto } from '../../interfaces/dto/create-${kebab}.dto';

@Injectable()
export class Create${pascal}UseCase {
  constructor(
    @Inject(${pascal.toUpperCase()}_REPOSITORY)
    private readonly repository: ${pascal}RepositoryPort
  ) {}

  async execute(dto: Create${pascal}Dto): Promise<${pascal}Entity> {
    return this.repository.create({
      name: dto.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
`,
    },
    {
      filePath: path.join(baseDir, 'application', 'use-cases', `find-${kebab}.use-case.ts`),
      content: `import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ${pascal}RepositoryPort,
  ${pascal.toUpperCase()}_REPOSITORY,
} from '../ports/${kebab}.repository.port';
import { ${pascal}Entity } from '../../domain/entities/${kebab}.entity';

@Injectable()
export class Find${pascal}UseCase {
  constructor(
    @Inject(${pascal.toUpperCase()}_REPOSITORY)
    private readonly repository: ${pascal}RepositoryPort
  ) {}

  async execute(id: string): Promise<${pascal}Entity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundException(\`${pascal} with id "\${id}" not found\`);
    }
    return item;
  }
}
`,
    },
    {
      filePath: path.join(baseDir, 'application', 'use-cases', 'index.ts'),
      content: `export * from './create-${kebab}.use-case';
export * from './find-${kebab}.use-case';
`,
    },
    // 5. Infrastructure Persistence (Repository Implementation)
    {
      filePath: path.join(
        baseDir,
        'infrastructure',
        'persistence',
        `in-memory-${kebab}.repository.ts`
      ),
      content: `import { Injectable } from '@nestjs/common';
import {
  ${pascal}RepositoryPort,
} from '../../application/ports/${kebab}.repository.port';
import { ${pascal}Entity } from '../../domain/entities/${kebab}.entity';

@Injectable()
export class InMemory${pascal}Repository implements ${pascal}RepositoryPort {
  private readonly items: Map<string, ${pascal}Entity> = new Map();

  async findById(id: string): Promise<${pascal}Entity | null> {
    return this.items.get(id) || null;
  }

  async findAll(): Promise<${pascal}Entity[]> {
    return Array.from(this.items.values());
  }

  async create(data: Partial<${pascal}Entity>): Promise<${pascal}Entity> {
    const id = (this.items.size + 1).toString();
    const entity = new ${pascal}Entity({
      id,
      name: data.name ?? 'Untitled',
      createdAt: data.createdAt ?? new Date(),
      updatedAt: data.updatedAt ?? new Date(),
    });
    this.items.set(id, entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}
`,
    },
    // 6. Interfaces DTOs
    {
      filePath: path.join(baseDir, 'interfaces', 'dto', `create-${kebab}.dto.ts`),
      content: `export class Create${pascal}Dto {
  name!: string;
}
`,
    },
    {
      filePath: path.join(baseDir, 'interfaces', 'dto', `update-${kebab}.dto.ts`),
      content: `export class Update${pascal}Dto {
  name?: string;
}
`,
    },
    {
      filePath: path.join(baseDir, 'interfaces', 'dto', 'index.ts'),
      content: `export * from './create-${kebab}.dto';
export * from './update-${kebab}.dto';
`,
    },
    // 7. Interfaces HTTP Controller
    {
      filePath: path.join(baseDir, 'interfaces', 'http', `${kebab}.controller.ts`),
      content: `import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Create${pascal}UseCase } from '../../application/use-cases/create-${kebab}.use-case';
import { Find${pascal}UseCase } from '../../application/use-cases/find-${kebab}.use-case';
import { Create${pascal}Dto } from '../dto/create-${kebab}.dto';

@Controller('${kebab}')
export class ${pascal}Controller {
  constructor(
    private readonly createUseCase: Create${pascal}UseCase,
    private readonly findUseCase: Find${pascal}UseCase
  ) {}

  @Post()
  create(@Body() dto: Create${pascal}Dto) {
    return this.createUseCase.execute(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.findUseCase.execute(id);
  }
}
`,
    },
    // 8. NestJS Module
    {
      filePath: path.join(baseDir, `${kebab}.module.ts`),
      content: `import { Module } from '@nestjs/common';
import { ${pascal}Controller } from './interfaces/http/${kebab}.controller';
import { Create${pascal}UseCase } from './application/use-cases/create-${kebab}.use-case';
import { Find${pascal}UseCase } from './application/use-cases/find-${kebab}.use-case';
import { ${pascal.toUpperCase()}_REPOSITORY } from './application/ports/${kebab}.repository.port';
import { InMemory${pascal}Repository } from './infrastructure/persistence/in-memory-${kebab}.repository';

@Module({
  controllers: [${pascal}Controller],
  providers: [
    Create${pascal}UseCase,
    Find${pascal}UseCase,
    {
      provide: ${pascal.toUpperCase()}_REPOSITORY,
      useClass: InMemory${pascal}Repository,
    },
  ],
  exports: [Create${pascal}UseCase, Find${pascal}UseCase, ${pascal.toUpperCase()}_REPOSITORY],
})
export class ${pascal}Module {}
`,
    },
  ];

  logger.info(`Generating Clean Architecture module for "${kebab}" at ${baseDir}...`);

  for (const file of files) {
    if (dryRun) {
      logger.info(`[dry-run] Would create: ${path.relative(cwd, file.filePath)}`);
    } else {
      await fs.mkdir(path.dirname(file.filePath), { recursive: true });
      await fs.writeFile(file.filePath, file.content, 'utf-8');
      logger.step(`Created ${path.relative(cwd, file.filePath)}`);
    }
  }

  // Update src/app.module.ts if requested and present
  let importedInApp = false;
  if (autoImport) {
    const appModuleDir = path.join(cwd, 'src');
    const moduleFilePathWithoutExt = path.join(baseDir, `${kebab}.module`);
    let relPath = path.relative(appModuleDir, moduleFilePathWithoutExt).replace(/\\/g, '/');
    if (!relPath.startsWith('.')) {
      relPath = `./${relPath}`;
    }
    importedInApp = await updateAppModule(`${pascal}Module`, relPath, cwd, dryRun);
  }

  if (importedInApp) {
    logger.success(`Clean Architecture structure for "${pascal}Module" generated and registered in AppModule!`);
  } else {
    logger.success(`Clean Architecture structure for "${pascal}Module" generated!`);
    logger.info(`Remember to import ${pascal}Module in your AppModule.`);
  }
}
