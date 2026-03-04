import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAppStore } from '../../src/store/appStore';
import { getAPODByDate, APODData } from '../../src/services/api';
import { APODCard } from '../../src/components/APODCard';
import { APODLoadingSkeleton } from '../../src/components/LoadingSkeleton';

export default function ArchiveScreen() {
  const theme = useAppStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [apod, setApod] = useState<APODData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // APOD started on June 16, 1995
  const minDate = new Date(1995, 5, 16);
  const maxDate = new Date();

  const fetchAPODByDate = async (date: Date) => {
    setLoading(true);
    setError(null);
    setApod(null);
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const data = await getAPODByDate(formattedDate);
      setApod(data);
    } catch (err: any) {
      console.error('Error fetching APOD:', err);
      setError(err.response?.data?.detail || 'Failed to fetch image for this date');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      fetchAPODByDate(date);
    }
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    if (newDate >= minDate) {
      setSelectedDate(newDate);
      fetchAPODByDate(newDate);
    }
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    if (newDate <= maxDate) {
      setSelectedDate(newDate);
      fetchAPODByDate(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    fetchAPODByDate(today);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Ionicons name="calendar" size={32} color={theme.accent} />
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Archive
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Browse past astronomy pictures
            </Text>
          </View>
        </View>
      </View>

      {/* Date Picker Section */}
      <View style={[styles.dateSection, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.dateNavigation}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.border }]}
            onPress={goToPreviousDay}
            disabled={selectedDate <= minDate}
          >
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: theme.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.accent} />
            <Text style={[styles.dateText, { color: theme.textPrimary }]}>
              {format(selectedDate, 'MMMM d, yyyy')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.border }]}
            onPress={goToNextDay}
            disabled={selectedDate >= maxDate}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.todayButton, { backgroundColor: theme.accent }]}
          onPress={goToToday}
        >
          <Ionicons name="today" size={18} color="#FFFFFF" />
          <Text style={styles.todayButtonText}>Go to Today</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minDate}
          maximumDate={maxDate}
          themeVariant="dark"
        />
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!apod && !loading && !error && (
          <View style={styles.placeholderContainer}>
            <Ionicons name="telescope" size={64} color={theme.textSecondary} />
            <Text style={[styles.placeholderText, { color: theme.textPrimary }]}>
              Select a date to explore
            </Text>
            <Text style={[styles.placeholderSubtext, { color: theme.textSecondary }]}>
              Use the date picker above to browse the archive from June 16, 1995 to today
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
          </View>
        )}

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
  dateSection: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    gap: 12,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    padding: 10,
    borderRadius: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: 16,
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
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
});
