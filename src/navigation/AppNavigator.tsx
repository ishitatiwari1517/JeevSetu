import React from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../theme/colors';

// ── Screens ───────────────────────────────────────────────────────────────────
import TodayScreen               from '../screens/TodayScreen';
import AnimalRosterScreen        from '../screens/AnimalRosterScreen';
import AnimalIntakeScreen        from '../screens/AnimalIntakeScreen';
import AnimalDetailScreen        from '../screens/AnimalDetailScreen';
import ScanProcessingScreen      from '../screens/ScanProcessingScreen';
import ScanResultScreen          from '../screens/ScanResultScreen';
import MultiImageCaptureScreen   from '../screens/MultiImageCaptureScreen';
import AddMedicalRecordScreen    from '../screens/AddMedicalRecordScreen';
import MedicationScheduleScreen  from '../screens/MedicationScheduleScreen';

// People tab (volunteers only now)
import PeopleHomeScreen          from '../screens/PeopleHomeScreen';
import VolunteerListScreen       from '../screens/VolunteerListScreen';
import AddVolunteerScreen        from '../screens/AddVolunteerScreen';
import VolunteerDetailScreen     from '../screens/VolunteerDetailScreen';
import AssignTaskScreen          from '../screens/AssignTaskScreen';

// Adoption tab (new 4th tab)
import AdoptionShowcaseScreen       from '../screens/AdoptionShowcaseScreen';
import AnimalAdoptionProfileScreen  from '../screens/AnimalAdoptionProfileScreen';

// Booking & Intake Form screens
import BookScreen                   from '../screens/BookScreen';
import BookingConfirmationScreen    from '../screens/BookingConfirmationScreen';
import IntakeFormScreen             from '../screens/IntakeFormScreen';

// ── Stack navigators ──────────────────────────────────────────────────────────
const Tab           = createBottomTabNavigator();
const TodayStack    = createNativeStackNavigator();
const AnimalsStack  = createNativeStackNavigator();
const PeopleStack   = createNativeStackNavigator();
const AdoptionStack = createNativeStackNavigator();

// ── Today tab ─────────────────────────────────────────────────────────────────
const TodayStackNavigator = () => (
  <TodayStack.Navigator screenOptions={{ headerShown: false }}>
    <TodayStack.Screen name="TodayMain"              component={TodayScreen} />
    <TodayStack.Screen name="Scan"                   component={MultiImageCaptureScreen} />
    <TodayStack.Screen name="ScanProcessing"         component={ScanProcessingScreen} />
    <TodayStack.Screen name="ScanResult"             component={ScanResultScreen} />
    <TodayStack.Screen name="AnimalDetail"           component={AnimalDetailScreen} />
    <TodayStack.Screen name="AddMedicalRecord"       component={AddMedicalRecordScreen} />
    <TodayStack.Screen name="MedicationSchedule"     component={MedicationScheduleScreen} />
    <TodayStack.Screen name="AnimalAdoptionProfile"  component={AnimalAdoptionProfileScreen} />
    <TodayStack.Screen name="Book"                   component={BookScreen} />
    <TodayStack.Screen name="BookingConfirmation"    component={BookingConfirmationScreen} />
    <TodayStack.Screen name="IntakeForm"             component={IntakeFormScreen} />
  </TodayStack.Navigator>
);

// ── Animals tab ───────────────────────────────────────────────────────────────
const AnimalsStackNavigator = () => (
  <AnimalsStack.Navigator screenOptions={{ headerShown: false }}>
    <AnimalsStack.Screen name="AnimalRoster"         component={AnimalRosterScreen} />
    <AnimalsStack.Screen name="AnimalDetail"         component={AnimalDetailScreen} />
    <AnimalsStack.Screen name="AnimalIntake"         component={AnimalIntakeScreen} />
    <AnimalsStack.Screen name="AddMedicalRecord"     component={AddMedicalRecordScreen} />
    <AnimalsStack.Screen name="MedicationSchedule"   component={MedicationScheduleScreen} />
    <AnimalsStack.Screen name="Scan"                 component={MultiImageCaptureScreen} />
    <AnimalsStack.Screen name="ScanProcessing"       component={ScanProcessingScreen} />
    <AnimalsStack.Screen name="ScanResult"           component={ScanResultScreen} />
    <AnimalsStack.Screen name="AnimalAdoptionProfile" component={AnimalAdoptionProfileScreen} />
    <AnimalsStack.Screen name="Book"                 component={BookScreen} />
    <AnimalsStack.Screen name="BookingConfirmation"  component={BookingConfirmationScreen} />
    <AnimalsStack.Screen name="IntakeForm"           component={IntakeFormScreen} />
  </AnimalsStack.Navigator>
);


// ── People tab (Volunteers only) ──────────────────────────────────────────────
const PeopleStackNavigator = () => (
  <PeopleStack.Navigator screenOptions={{ headerShown: false }}>
    <PeopleStack.Screen name="PeopleMain"        component={PeopleHomeScreen} />
    <PeopleStack.Screen name="VolunteerList"      component={VolunteerListScreen} />
    <PeopleStack.Screen name="AddVolunteer"       component={AddVolunteerScreen} />
    <PeopleStack.Screen name="VolunteerDetail"    component={VolunteerDetailScreen} />
    <PeopleStack.Screen name="AssignTask"         component={AssignTaskScreen} />
    <PeopleStack.Screen name="MedicationSchedule" component={MedicationScheduleScreen} />
    <PeopleStack.Screen name="AnimalDetail"       component={AnimalDetailScreen} />
    <PeopleStack.Screen name="AddMedicalRecord"   component={AddMedicalRecordScreen} />
  </PeopleStack.Navigator>
);

// ── Adoption tab (showcase for adopters) ──────────────────────────────────────
const AdoptionStackNavigator = () => (
  <AdoptionStack.Navigator screenOptions={{ headerShown: false }}>
    <AdoptionStack.Screen name="AdoptionShowcase"      component={AdoptionShowcaseScreen} />
    <AdoptionStack.Screen name="AnimalAdoptionProfile" component={AnimalAdoptionProfileScreen} />
  </AdoptionStack.Navigator>
);

// ── Tab icons ─────────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, string> = {
  Today:    'clipboard-check-outline',
  Animals:  'paw-outline',
  People:   'account-group-outline',
  Adoption: 'heart-circle-outline',
};

const TAB_BAR_STYLE = {
  backgroundColor: COLORS.surface,
  borderTopColor:  COLORS.border,
  height: 64,
  paddingBottom: 8,
  paddingTop: 6,
};

const TAB_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: '600' as const,
};

// ── Deep link config ─────────────────────────────────────────────────────────
// petvue://animal/{animalId}  →  AnimalAdoptionProfile screen
const linking = {
  prefixes: ['petvue://'],
  config: {
    screens: {
      Today: {
        screens: {
          AnimalAdoptionProfile: 'animal/:animalId',
        },
      },
      Animals: {
        screens: {
          AnimalAdoptionProfile: 'animal/:animalId',
        },
      },
      Adoption: {
        screens: {
          AnimalAdoptionProfile: 'animal/:animalId',
        },
      },
    },
  },
};

// ── Root navigator ────────────────────────────────────────────────────────────
const AppNavigator = () => (
  <NavigationContainer linking={linking} onUnhandledAction={() => {}}>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.brand,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle:      TAB_BAR_STYLE,
        tabBarLabelStyle: TAB_LABEL_STYLE,
        tabBarIcon: ({ color, size }) => (
          <Icon name={TAB_ICONS[route.name] || 'circle-outline'} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Today"
        component={TodayStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Today', { screen: 'TodayMain' });
          },
        })}
      />
      <Tab.Screen
        name="Animals"
        component={AnimalsStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Animals', { screen: 'AnimalRoster' });
          },
        })}
      />
      <Tab.Screen
        name="People"
        component={PeopleStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('People', { screen: 'PeopleMain' });
          },
        })}
      />
      <Tab.Screen
        name="Adoption"
        component={AdoptionStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Adoption', { screen: 'AdoptionShowcase' });
          },
        })}
      />
    </Tab.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
