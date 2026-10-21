import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from '../../utils/logger';

const execAsync = promisify(exec);

export interface RunCommandOptions {
  cwd?: string;
  dryRun?: boolean;
  silent?: boolean;
}

export async function runCommand(
  command: string,
  options: RunCommandOptions = {}
): Promise<{ stdout: string; stderr: string }> {
  const { cwd = process.cwd(), dryRun = false, silent = false } = options;

  if (dryRun) {
    logger.info(`[dry-run] Would execute: ${command}`);
    return { stdout: '', stderr: '' };
  }

  if (!silent) {
    logger.step(command);
  }

  try {
    const result = await execAsync(command, { cwd });
    return result;
  } catch (error: any) {
    const message = error.stderr || error.message || 'Command failed';
    throw new Error(`Failed to execute: "${command}"\n${message}`);
  }
}
