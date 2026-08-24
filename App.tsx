import React, { useState, useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { Amplify } from 'aws-amplify';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import awsconfig from './src/aws-exports';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ConfirmEmailScreen from './src/screens/ConfirmEmailScreen';
import PhoneAuthScreen from './src/screens/PhoneAuthScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { __invalidatePetUserCache } from './src/services/petService';
import { __invalidateScanUserCache } from './src/services/scanHistoryService';
import { __invalidateAnimalOrgCache } from './src/services/animalService';
import { ensureDefaultOrganization } from './src/services/orgService';
import { runDataMigrationV2 } from './src/services/dataMigration';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: awsconfig.aws_user_pools_id,
      userPoolClientId: awsconfig.aws_user_pools_web_client_id,
      identityPoolId: awsconfig.aws_cognito_identity_pool_id,
      loginWith: {
        email: true,
        oauth: {
          domain: awsconfig.oauth.domain,
          scopes: awsconfig.oauth.scope,
          redirectSignIn: [awsconfig.oauth.redirectSignIn],
          redirectSignOut: [awsconfig.oauth.redirectSignOut],
          responseType: awsconfig.oauth.responseType,
          providers: ['Google'],
        },
      },
    },
  },
  API: {
    REST: (awsconfig.aws_cloud_logic_custom || []).reduce((acc, api) => {
      acc[api.name] = {
        endpoint: api.endpoint,
        region: api.region,
      };
      return acc;
    }, {}),
  },
});

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Run storage migration FIRST to merge any split animal buckets
    runDataMigrationV2().catch(() => {});

    // Timeout: if Cognito auth check takes >3s, assume logged out and show login
    const timeout = setTimeout(() => setInitializing(false), 3000);

    getCurrentUser()
      .then(u => { clearTimeout(timeout); setUser(u); setInitializing(false); })
      .catch(() => { clearTimeout(timeout); setUser(null); setInitializing(false); });

    const listener = Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signedIn':
          setUser(data);
          // Ensure organization profile exists for new/returning users
          ensureDefaultOrganization().catch(() => {});
          break;
        case 'signedOut':
          setUser(null);
          __invalidatePetUserCache();
          __invalidateScanUserCache();
          __invalidateAnimalOrgCache();
          break;
      }
    });
    return () => { listener(); clearTimeout(timeout); };
  }, []);

  if (initializing) return <View style={styles.container} />;

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        {currentScreen === 'login' ? (
          <LoginScreen
            onSignUpPress={() => setCurrentScreen('signup')}
            onPhonePress={() => setCurrentScreen('phone')}
            onForgotPress={() => setCurrentScreen('forgot_password')}
            onUnconfirmedUser={(email) => {
              setUnconfirmedEmail(email);
              setCurrentScreen('confirm_email');
            }}
          />
        ) : currentScreen === 'signup' ? (
          <SignUpScreen
            onSignInPress={() => setCurrentScreen('login')}
            onPhonePress={() => setCurrentScreen('phone')}
            onSignUpSuccess={(email) => {
              setUnconfirmedEmail(email);
              setCurrentScreen('confirm_email');
            }}
          />
        ) : currentScreen === 'confirm_email' ? (
          <ConfirmEmailScreen
            email={unconfirmedEmail}
            onConfirmSuccess={() => setCurrentScreen('login')}
            onBackPress={() => setCurrentScreen('login')}
          />
        ) : currentScreen === 'forgot_password' ? (
          <ForgotPasswordScreen
            onBackPress={() => setCurrentScreen('login')}
            onCodeSent={(email) => {
              setUnconfirmedEmail(email);
              setCurrentScreen('reset_password');
            }}
          />
        ) : currentScreen === 'reset_password' ? (
          <ResetPasswordScreen
            email={unconfirmedEmail}
            onBackPress={() => setCurrentScreen('forgot_password')}
            onSuccess={() => setCurrentScreen('login')}
          />
        ) : (
          <PhoneAuthScreen onBackPress={() => setCurrentScreen('login')} />
        )}
      </View>
    );
  }

  return <AppNavigator />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
