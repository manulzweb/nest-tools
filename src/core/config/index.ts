import fs from 'node:fs/promises';
import path from 'node:path';

export interface NestToolsConfig {
  spec?: boolean;
  flat?: boolean;
  architecture?: 'standard' | 'clean';
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  modulesDir?: string;
  autoImportAppModule?: boolean;
}

export const DEFAULT_CONFIG: NestToolsConfig = {
  spec: false,
  flat: false,
  architecture: 'clean',
  packageManager: 'npm',
  modulesDir: 'src/modules',
  autoImportAppModule: true,
};

const CONFIG_FILENAMES = ['nest-tools.json', '.nesttoolsrc', '.nesttoolsrc.json'];

export async function loadConfig(cwd = process.cwd()): Promise<NestToolsConfig> {
  for (const filename of CONFIG_FILENAMES) {
    const configPath = path.join(cwd, filename);
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(data);
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch {
      // Continue searching
    }
  }

  return DEFAULT_CONFIG;
}

export async function createDefaultConfig(cwd = process.cwd()): Promise<string> {
  const targetPath = path.join(cwd, 'nest-tools.json');
  const content = JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n';
  await fs.writeFile(targetPath, content, 'utf-8');
  return targetPath;
}
