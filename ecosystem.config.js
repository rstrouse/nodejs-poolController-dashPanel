module.exports = {
  apps: [
    {
      name: "dashPanel",
      script: "npm",
      args: ["start"],
      cwd: "/app/nodejs-poolcontroller-dashpanel",
      restart_delay: 10000,
      watch: ["pages", "scripts", "server", "package.json"],
      watch_delay: 5000,
      kill_timeout: 15000,
    },
  ],
};
