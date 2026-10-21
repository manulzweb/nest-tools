import { runCommand } from '../runner/command-runner';
import { loadConfig } from '../config';
import { logger } from '../../utils/logger';
import { toKebabCase } from '../../utils/strings';

export interface GenerateResourceOptions {
  name: string;
  spec?: boolean;
  flat?: boolean;
  dryRun?: boolean;
  cwd?: string;
  modulesDir?: string;
}

export async function generateResource(options: GenerateResourceOptions): Promise<void> {
  const config = await loadConfig(options.cwd);
  const rawName = options.name.trim().replace(/^(src[/\\])?(modules[/\\])?/, '');
  const name = toKebabCase(rawName);

  const spec = options.spec ?? config.spec ?? false;
  const flat = options.flat ?? config.flat ?? false;
  const dryRun = options.dryRun ?? false;
  const cwd = options.cwd ?? process.cwd();

  const specFlag = spec ? '' : '--no-spec';
  const flatFlag = flat ? '--flat' : '';

  const modulesDir = options.modulesDir ?? config.modulesDir ?? 'src/modules';
  const nestPrefix = modulesDir.replace(/^[/\\]?src[/\\]?/, '').replace(/[/\\]$/, '');
  const targetPath = nestPrefix && !flat ? `${nestPrefix}/${name}` : name;

  const commands = [
    `nest g mo ${targetPath} ${flatFlag}`.trim(),
    `nest g co ${targetPath} ${specFlag} ${flatFlag}`.trim(),
    `nest g s ${targetPath} ${specFlag} ${flatFlag}`.trim(),
  ];

  logger.info(`Generating resource "${name}" at ${targetPath} (spec: ${spec ? 'yes' : 'no'}, flat: ${flat ? 'yes' : 'no'})...`);

  for (const cmd of commands) {
    await runCommand(cmd, { cwd, dryRun });
  }

  logger.success(`Resource "${name}" generated successfully.`);
}
