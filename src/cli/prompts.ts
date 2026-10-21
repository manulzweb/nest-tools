import * as p from '@clack/prompts';
import pc from 'picocolors';
import { generateResource } from '../core/generator/generate-resource';
import { generateCleanArchitecture } from '../core/generator/generate-clean-architecture';
import { runDoctor } from '../core/diagnostics/doctor';
import { createDefaultConfig } from '../core/config';

export async function runInteractive(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' @manulz/nest-tools ')));

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'clean', label: 'Generate Clean Architecture / Hexagonal Module (src/modules/<name>)' },
      { value: 'resource', label: 'Generate Standard Resource (Module + Controller + Service)' },
      { value: 'init', label: 'Initialize nest-tools.json config file' },
      { value: 'doctor', label: 'Run project diagnostics (Doctor)' },
    ],
  });

  if (p.isCancel(action)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  if (action === 'doctor') {
    await runDoctor();
    p.outro(pc.green('Diagnostics completed!'));
    return;
  }

  if (action === 'init') {
    const configPath = await createDefaultConfig();
    p.outro(pc.green(`Created config at: ${configPath}`));
    return;
  }

  const name = await p.text({
    message: 'What is the name of the resource/module?',
    placeholder: 'e.g. users, products, auth',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Please enter a valid name';
      }
    },
  });

  if (p.isCancel(name)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  if (action === 'resource') {
    const spec = await p.confirm({
      message: 'Do you want to generate spec/test files?',
      initialValue: false,
    });

    if (p.isCancel(spec)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }

    const s = p.spinner();
    s.start(`Generating resource "${name}"...`);
    try {
      await generateResource({ name: name as string, spec: Boolean(spec) });
      s.stop(`Resource "${name}" generated!`);
      p.outro(pc.green('Done!'));
    } catch (err: any) {
      s.stop(pc.red('Generation failed.'));
      p.cancel(err.message);
      process.exit(1);
    }
  } else if (action === 'clean') {
    const s = p.spinner();
    s.start(`Generating Clean Architecture module "${name}"...`);
    try {
      await generateCleanArchitecture({ name: name as string });
      s.stop(`Clean Architecture module "${name}" generated!`);
      p.outro(pc.green('Done!'));
    } catch (err: any) {
      s.stop(pc.red('Generation failed.'));
      p.cancel(err.message);
      process.exit(1);
    }
  }
}
