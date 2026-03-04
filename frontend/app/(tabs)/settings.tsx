import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '../../src/store/appStore';
import { getPreferences, updatePreferences, UserPreferences } from '../../src/services/api';

export default function SettingsScreen() {
  const theme = useAppStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const { isDeepBlackMode, setDeepBlackMode, notificationsEnabled, setNotificationsEnabled } = useAppStore();
  
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getPreferences();
      setPreferences(prefs);
      setDeepBlackMode(prefs.deep_black_mode);
      setNotificationsEnabled(prefs.notifications_enabled);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepBlackToggle = async (value: boolean) => {
    setDeepBlackMode(value);
    try {
      await updatePreferences({ deep_black_mode: value });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive daily APOD reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      // Schedule daily notification at 8 PM IST (14:30 UTC)
      await scheduleDailyNotification();
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }

    setNotificationsEnabled(value);
    try {
      await updatePreferences({ notifications_enabled: value });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const scheduleDailyNotification = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌌 New Astronomy Picture!',
        body: 'Today\'s Astronomy Picture of the Day is ready. Tap to explore the cosmos!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20, // 8 PM
        minute: 0,
      },
    });
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
    isSwitch = true,
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    isSwitch?: boolean;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={isSwitch ? 1 : 0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.border }]}>
        <Ionicons name={icon as any} size={22} color={theme.accent} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {isSwitch && onValueChange && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.border, true: theme.accent }}
          thumbColor="#FFFFFF"
        />
      )}
      {!isSwitch && (
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="settings" size={32} color={theme.accent} />
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Settings
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Customize your experience
            </Text>
          </View>
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          APPEARANCE
        </Text>
        <SettingItem
          icon="moon"
          title="Deep Black Mode"
          subtitle="Use pure black background for OLED screens"
          value={isDeepBlackMode}
          onValueChange={handleDeepBlackToggle}
        />
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          NOTIFICATIONS
        </Text>
        <SettingItem
          icon="notifications"
          title="Daily Reminder"
          subtitle="Get notified at 8 PM about new APOD"
          value={notificationsEnabled}
          onValueChange={handleNotificationsToggle}
        />
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ABOUT
        </Text>
        <SettingItem
          icon="information-circle"
          title="About APOD"
          subtitle="Learn about NASA's APOD program"
          isSwitch={false}
          onPress={() => Linking.openURL('https://apod.nasa.gov/apod/astropix.html')}
        />
        <SettingItem
          icon="globe"
          title="Visit NASA"
          subtitle="Explore more from NASA"
          isSwitch={false}
          onPress={() => Linking.openURL('https://www.nasa.gov')}
        />
        <SettingItem
          icon="code-slash"
          title="API Documentation"
          subtitle="NASA Open APIs"
          isSwitch={false}
          onPress={() => Linking.openURL('https://api.nasa.gov')}
        />
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Ionicons name="planet" size={48} color={theme.accent} />
        <Text style={[styles.appName, { color: theme.textPrimary }]}>APOD Explorer</Text>
        <Text style={[styles.appVersion, { color: theme.textSecondary }]}>Version 1.0.0</Text>
        <Text style={[styles.appCredit, { color: theme.textSecondary }]}>
          Powered by NASA APOD API
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  appVersion: {
    fontSize: 14,
  },
  appCredit: {
    fontSize: 12,
    marginTop: 4,
  },
});
