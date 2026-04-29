module.exports = {
  apps: [
    {
      name: 'be_lacosta',
      script: 'dist/src/main.js',
      cwd: 'C:\\Users\\edu_c\\Documents\\eduardo-segel\\sco-lacosta\\lacosta\\be_lacosta',
      env_file: '.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
    },
  ],
};
