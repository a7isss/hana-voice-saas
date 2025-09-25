// Simple script to generate secure credentials
function generateSecurePassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

function generateSecureCredentials() {
  const username = 'hana_admin_' + Math.random().toString(36).substring(2, 10);
  const password = generateSecurePassword();
  
  return {
    username,
    password,
    envVariables: `ADMIN_USERNAME=${username}\nADMIN_PASSWORD=${password}`
  };
}

const credentials = generateSecureCredentials();
console.log('Generated Credentials:');
console.log('=====================');
console.log('Username:', credentials.username);
console.log('Password:', credentials.password);
console.log('\nEnvironment Variables:');
console.log('=====================');
console.log(credentials.envVariables);
