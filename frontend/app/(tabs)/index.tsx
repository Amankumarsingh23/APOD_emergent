import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../src/store/appStore';
import { getTodayAPOD, APODData } from '../../src/services/api';
import { APODCard } from '../../src/components/APODCard';
import { APODLoadingSkeleton } from '../../src/components/LoadingSkeleton';
import { Ionicons } from '@expo/vector-icons';

export default function TodayScreen() {
  const theme = useAppStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const [apod, setApod] = useState<APODData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayAPOD = async () => {
    try {
      setError(null);
      const data = await getTodayAPOD();
      setApod(data);
    } catch (err: any) {
      console.error('Error fetching APOD:', err);
      setError(err.response?.data?.detail || 'Failed to fetch today\'s image');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTodayAPOD();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTodayAPOD();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerContent}>
            <Ionicons name="planet" size={32} color={theme.accent} />
            <View>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                APOD Explorer
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Astronomy Picture of the Day
              </Text>
            </View>
          </View>
        </View>
        <APODLoadingSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerContent}>
            <Ionicons name="planet" size={32} color={theme.accent} />
            <View>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                APOD Explorer
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Astronomy Picture of the Day
              </Text>
            </View>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={styles.errorContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
            />
          }
        >
          <Ionicons name="cloud-offline" size={64} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.textPrimary }]}>
            Unable to load image
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>
            {error}
          </Text>
          <Text style={[styles.pullText, { color: theme.textSecondary }]}>
            Pull down to retry
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Ionicons name="planet" size={32} color={theme.accent} />
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              APOD Explorer
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Astronomy Picture of the Day
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {apod && <APODCard apod={apod} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  pullText: {
    fontSize: 12,
    marginTop: 8,
  },
});
