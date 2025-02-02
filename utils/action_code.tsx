//This function is used for the logic for sending email verification. The problem is that i need to have deployed firebase project and have a domain name.

const actionCodeSettings = {
    handleCodeInApp: true,
    iOS: {
      bundleId: 'com.example.ios',
      installApp: true
    },
    android: {
      packageName: 'com.example.android',
      installApp: true,
      minimumVersion: '12'
    },
    dynamicLinkDomain: 'example.page.link'
  };