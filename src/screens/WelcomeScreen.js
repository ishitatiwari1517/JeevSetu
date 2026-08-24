import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { COLORS } from '../theme/colors';

const WelcomeScreen = ({ user, onGoToPet }) => {
  const [userName, setUserName] = React.useState('Pet Guardian');
  const petName = "your pet";

  React.useEffect(() => {
    const getUserInfo = async () => {
      try {
        const attributes = await fetchUserAttributes();
        if (attributes.name) {
          setUserName(attributes.name);
        } else if (attributes.email) {
          setUserName(attributes.email.split('@')[0]);
        } else {
          setUserName('User');
        }
      } catch (error) {
        // If the user pool client lacks the 'aws.cognito.signin.user.admin' scope
        // or the session is stale, fetchUserAttributes may throw NotAuthorizedException.
        // We fall back to "Pet Guardian" and log other errors more noticeably.
        if (error.name !== 'NotAuthorizedException' && error.code !== 'NotAuthorizedException') {
          console.warn('[WelcomeScreen] Error fetching attributes:', error);
        }
      }
    };
    getUserInfo();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log('Sign out error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Profile Image Section */}
          <View style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
              <Image 
                source={require('../assets/dashboardpic.png')} 
                style={styles.dogImage}
                resizeMode="cover"
              />
            </View>
            {/* Vitals Badge */}
            <View style={styles.vitalsBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.vitalsText}>ALL VITALS HEALTHY</Text>
            </View>
          </View>

          {/* Welcome Text */}
          <View style={styles.textSection}>
            <Text style={styles.welcomeTitle}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}!</Text>
            
            <Text style={styles.description}>
              We're here to make sure <Text style={styles.boldText}>{petName}</Text> stays happy, healthy, and loved every single day.
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>YOUR PET'S WELLBEING IS OUR PROMISE.</Text>
            <View style={styles.line} />
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.mainButton} onPress={onGoToPet}>
            <Text style={styles.buttonText}>Go to my pet   →</Text>
          </TouchableOpacity>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Not {userName}? </Text>
            <TouchableOpacity onPress={handleSignOut}>
              <Text style={styles.switchAccountText}>Switch account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Chat Icon (as per design) */}
      <TouchableOpacity style={styles.chatFab}>
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/589/589708.png' }} 
          style={styles.chatIcon}
          tintColor="#5DA7D3"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FDFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  imageWrapper: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FFFFFF',
    padding: 10,
    elevation: 15,
    shadowColor: '#5DA7D3',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogImage: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  vitalsBadge: {
    position: 'absolute',
    bottom: 20,
    right: -10,
    backgroundColor: '#C8F4E9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 25,
    zIndex: 999,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D9C82',
    marginRight: 8,
  },
  vitalsText: {
    color: '#2D9C82',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1A1A',
    fontFamily: 'System',
  },
  userName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#5DA7D3',
    marginTop: -5,
  },
  description: {
    fontSize: 17,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 26,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  boldText: {
    fontWeight: '700',
    color: '#333333',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  dividerText: {
    fontSize: 10,
    color: '#999999',
    marginHorizontal: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  mainButton: {
    backgroundColor: '#5DA7D3',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#5DA7D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    color: '#666666',
    fontSize: 14,
  },
  switchAccountText: {
    color: '#5DA7D3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chatFab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIcon: {
    width: 25,
    height: 25,
  },
});

export default WelcomeScreen;
