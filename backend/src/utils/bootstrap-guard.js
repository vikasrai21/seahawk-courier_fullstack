'use strict';

function isTrue(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

function assertSafeBootstrap(scriptName) {
  const isProduction =
    String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production' ||
    String(process.env.APP_ENV || '').trim().toLowerCase() === 'production';

  if (isProduction && !isTrue(process.env.ALLOW_PROD_BOOTSTRAP)) {
    throw new Error(
      `${scriptName} is blocked in production. Set ALLOW_PROD_BOOTSTRAP=true only if you intentionally need this emergency bootstrap flow.`
    );
  }

  return {
    showPasswords: isTrue(process.env.SHOW_BOOTSTRAP_PASSWORDS),
  };
}

module.exports = {
  assertSafeBootstrap,
  isTrue,
};
