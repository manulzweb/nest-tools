import fs from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';
import { logger } from '../../utils/logger';
import { toPascalCase } from '../../utils/strings';

export interface DoctorReport {
  isNestProject: boolean;
  issues: string[];
  recommendations: string[];
}

export async function runDoctor(cwd = process.cwd()): Promise<DoctorReport> {
  const report: DoctorReport = {
    isNestProject: false,
    issues: [],
    recommendations: [],
  };

  logger.info('Running nest-tools doctor diagnostics...\n');

  // 1. Check package.json
  const pkgPath = path.join(cwd, 'package.json');
  let pkg: any = null;
  try {
    const pkgRaw = await fs.readFile(pkgPath, 'utf-8');
    pkg = JSON.parse(pkgRaw);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['@nestjs/core'] || deps['@nestjs/common']) {
      report.isNestProject = true;
      console.log(pc.green('✔') + ' NestJS dependencies detected in package.json');
    } else {
      report.issues.push('Could not find @nestjs/core or @nestjs/common in package.json.');
    }
  } catch {
    report.issues.push('No package.json found in current working directory.');
  }

  // 2. Check nest-cli.json
  try {
    await fs.access(path.join(cwd, 'nest-cli.json'));
    console.log(pc.green('✔') + ' nest-cli.json configuration found');
  } catch {
    report.recommendations.push('nest-cli.json is missing. Consider generating one with "nest new".');
  }

  // 3. Check tsconfig.json
  try {
    await fs.access(path.join(cwd, 'tsconfig.json'));
    console.log(pc.green('✔') + ' tsconfig.json found');
  } catch {
    report.issues.push('tsconfig.json is missing in project root.');
  }

  // 4. Check .env and .env.example
  try {
    await fs.access(path.join(cwd, '.env'));
    try {
      await fs.access(path.join(cwd, '.env.example'));
      console.log(pc.green('✔') + ' .env and .env.example are present');
    } catch {
      report.recommendations.push(
        '.env exists but .env.example is missing. It is recommended to commit an example file.'
      );
    }
  } catch {
    // No .env, ignore
  }

  // 5. Module check (look for orphan modules)
  try {
    const appModulePath = path.join(cwd, 'src', 'app.module.ts');
    const appModuleContent = await fs.readFile(appModulePath, 'utf-8');

    const checkModuleDir = async (parentDir: string, relativePrefix: string) => {
      try {
        const entries = await fs.readdir(parentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name !== 'modules') {
            const potentialModule = `${entry.name}.module.ts`;
            const moduleFilePath = path.join(parentDir, entry.name, potentialModule);
            try {
              await fs.access(moduleFilePath);
              const modulePascal = toPascalCase(entry.name) + 'Module';
              if (
                !appModuleContent.includes(potentialModule.replace('.ts', '')) &&
                !appModuleContent.includes(entry.name) &&
                !appModuleContent.includes(modulePascal)
              ) {
                report.recommendations.push(
                  `Module "${entry.name}" was found at ${relativePrefix}/${entry.name}/${potentialModule}, but might not be imported in app.module.ts.`
                );
              }
            } catch {
              // not a module dir
            }
          }
        }
      } catch {
        // directory does not exist
      }
    };

    await checkModuleDir(path.join(cwd, 'src'), 'src');
    await checkModuleDir(path.join(cwd, 'src', 'modules'), 'src/modules');
  } catch {
    // app.module.ts doesn't exist or isn't accessible
  }

  console.log('');
  if (report.issues.length > 0) {
    logger.error(`Found ${report.issues.length} issue(s):`);
    for (const issue of report.issues) {
      console.log(pc.red('  ✖ ') + issue);
    }
  } else {
    logger.success('No critical issues found!');
  }

  if (report.recommendations.length > 0) {
    logger.warn(`Found ${report.recommendations.length} recommendation(s):`);
    for (const rec of report.recommendations) {
      console.log(pc.yellow('  ➜ ') + rec);
    }
  }

  return report;
}
