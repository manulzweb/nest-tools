#!/usr/bin/env node

import { Command } from 'commander';
import { generateResource } from '../core/generator/generate-resource';
import { generateCleanArchitecture } from '../core/generator/generate-clean-architecture';
import { runDoctor } from '../core/diagnostics/doctor';
import { createDefaultConfig, loadConfig } from '../core/config';
import { runInteractive } from './prompts';
import { logger } from '../utils/logger';

const program = new Command();

program
  .name('nest-tools')
  .description('Developer utilities, clean architecture generator, and runtime helpers for NestJS')
  .version('1.2.0');

// Subcommand: generate (g)
program
  .command('generate <name>')
  .alias('g')
  .description('Generate Module, Controller, and Service for a resource')
  .option('--clean', 'Generate Clean Architecture / Hexagonal module structure (src/modules/<name>)')
  .option('--spec', 'Include unit test files (.spec.ts)')
  .option('--no-spec', 'Exclude unit test files (.spec.ts)')
  .option('--flat', 'Generate elements without creating a subfolder')
  .option('--dry-run', 'Preview the commands without executing them')
  .action(
    async (
      name: string,
      options: { clean?: boolean; spec?: boolean; flat?: boolean; dryRun?: boolean }
    ) => {
      try {
        const config = await loadConfig();
        if (options.clean || config.architecture === 'clean') {
          await generateCleanArchitecture({
            name,
            dryRun: options.dryRun,
          });
        } else {
          await generateResource({
            name,
            spec: options.spec,
            flat: options.flat,
            dryRun: options.dryRun,
          });
        }
      } catch (error: any) {
        logger.error(error.message);
        process.exit(1);
      }
    }
  );

// Subcommand: hex / clean
program
  .command('hex <name>')
  .alias('clean')
  .description('Generate a Clean Architecture / Hexagonal module structure (src/modules/<name>)')
  .option('--dry-run', 'Preview the files to create without writing them')
  .option('--no-import', 'Skip automatic registration in app.module.ts')
  .action(async (name: string, options: { dryRun?: boolean; import?: boolean }) => {
    try {
      await generateCleanArchitecture({
        name,
        dryRun: options.dryRun,
        autoImport: options.import !== false,
      });
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  });

// Subcommand: doctor
program
  .command('doctor')
  .description('Inspect current NestJS project health and check for common issues')
  .action(async () => {
    try {
      await runDoctor();
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  });

// Subcommand: init
program
  .command('init')
  .description('Create default nest-tools.json configuration file')
  .action(async () => {
    try {
      const configPath = await createDefaultConfig();
      logger.success(`Configuration file created at: ${configPath}`);
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  });

// If no arguments provided, launch interactive prompt
if (process.argv.slice(2).length === 0) {
  runInteractive().catch((error) => {
    logger.error(error.message);
    process.exit(1);
  });
} else {
  program.parse(process.argv);
}
