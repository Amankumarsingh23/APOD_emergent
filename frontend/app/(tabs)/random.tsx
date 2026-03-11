import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/appStore';
import { getRandomAPOD, APODData } from '../../src/services/api';
import { APODCard } from '../../src/components/APODCard';
import { APODLoadingSkeleton } from '../../src/components/LoadingSkeleton';

export default function RandomScreen() {
  const theme = useAppStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const [apod, setApod] = useState<APODData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomAPOD = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRandomAPOD();
      setApod(data);
    } catch (err: any) {
      console.error('Error fetching random APOD:', err);
      setError(err.response?.data?.detail || 'Failed to fetch random image');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRandomAPOD();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Ionicons name="shuffle" size={32} color={theme.accent} />
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Random APOD
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Discover astronomy through time
            </Text>
          </View>
        </View>
      </View>

      {/* Shuffle Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.shuffleButton, { backgroundColor: theme.accent }]}
          onPress={fetchRandomAPOD}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={loading ? "hourglass" : "shuffle"} 
            size={24} 
            color="#FFFFFF" 
          />
          <Text style={styles.shuffleButtonText}>
            {loading ? 'Loading...' : apod ? 'Shuffle Again' : 'Get Random APOD'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          apod ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
            />
          ) : undefined
        }
      >
        {!apod && !loading && !error && (
          <View style={styles.placeholderContainer}>
            <Ionicons name="dice" size={80} color={theme.textSecondary} />
            <Text style={[styles.placeholderText, { color: theme.textPrimary }]}>
              Ready to explore?
            </Text>
            <Text style={[styles.placeholderSubtext, { color: theme.textSecondary }]}>
              Tap the button above to discover a random astronomy picture from over 30 years of NASA's archive
            </Text>
          </View>
        )}

        {loading && <APODLoadingSkeleton />}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.textPrimary }]}>
              Unable to load image
            </Text>
            <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.accent }]}
              onPress={fetchRandomAPOD}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {apod && !loading && <APODCard apod={apod} />}
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
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
  },
  shuffleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingTop: 64,
    gap: 12,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
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
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
