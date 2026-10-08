module.exports = {
  apps: [
    {
      name: 'matchcreatorz-frontend',
      cwd: __dirname,
      // Next.js standalone server (built in CI — see .github/workflows/ci-cd.yml)
      script: './server.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      kill_timeout: 10000,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
