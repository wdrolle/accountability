const environments = {
  production: {
    local: {
      url: 'http://localhost:3000',
      port: 3000
    },
    cloud: {
      url: 'https://3000-01jgesrqxqw7pr48rhr6s37tms.cloudspaces.litng.ai',
      port: 3000
    },
    name: 'Production'
  },
  development: {
    local: {
      url: 'http://localhost:3001',
      port: 3001
    },
    cloud: {
      url: 'https://3001-01jh464cqfyzfc1pqz1njma00c.cloudspaces.litng.ai',
      port: 3001
    },
    name: 'Development'
  }
};

module.exports = environments; 