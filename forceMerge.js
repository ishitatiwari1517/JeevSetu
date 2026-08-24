const AsyncStorage = require('@react-native-async-storage/async-storage');
AsyncStorage.removeItem('@petvue_migration_v2_done').then(() => console.log('Flag removed!'));
