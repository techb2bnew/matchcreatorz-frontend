module.exports = {
  apps: [
    {
      name: 'matchcreatorz-frontend',
      cwd: __dirname,
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      kill_timeout: 10000,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
