import pc from 'picocolors';

export const logger = {
  info: (msg: string) => console.log(pc.cyan('ℹ ') + msg),
  success: (msg: string) => console.log(pc.green('✔ ') + pc.bold(msg)),
  warn: (msg: string) => console.log(pc.yellow('⚠ ') + msg),
  error: (msg: string) => console.error(pc.red('✖ ') + pc.bold(msg)),
  step: (step: string, detail?: string) => {
    console.log(pc.blue('▶ ') + pc.bold(step) + (detail ? pc.dim(` (${detail})`) : ''));
  },
};
