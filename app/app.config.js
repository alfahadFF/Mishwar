// يضيف ملف Firebase تلقائياً لما يكون موجود (google-services.json بجذر المشروع)
const fs = require('fs');
const path = require('path');
module.exports = ({ config }) => {
  if (fs.existsSync(path.join(__dirname, 'google-services.json'))) {
    config.android = { ...config.android, googleServicesFile: './google-services.json' };
  }
  return config;
};
