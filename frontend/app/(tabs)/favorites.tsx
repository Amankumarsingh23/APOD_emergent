import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAppStore } from '../../src/store/appStore';
import { getFavorites, removeFavorite, Favorite, APODData } from '../../src/services/api';
import { APODCard } from '../../src/components/APODCard';
import { LoadingSkeleton } from '../../src/components/LoadingSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FavoritesScreen() {
  const theme = useAppStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState<Favorite | null>(null);

  const fetchFavorites = async () => {
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (date: string) => {
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this image from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFavorite(date);
              setFavorites(favorites.filter((fav) => fav.date !== date));
              if (selectedFavorite?.date === date) {
                setSelectedFavorite(null);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to remove from favorites');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  if (selectedFavorite) {
    const apodData: APODData = {
      date: selectedFavorite.date,
      title: selectedFavorite.title,
      explanation: selectedFavorite.explanation,
      url: selectedFavorite.url,
      hdurl: selectedFavorite.hdurl,
      media_type: selectedFavorite.media_type,
      copyright: selectedFavorite.copyright,
    };

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.detailHeader, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.cardBackground }]}
            onPress={() => setSelectedFavorite(null)}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.detailTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {selectedFavorite.title}
          </Text>
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: theme.error }]}
            onPress={() => handleRemoveFavorite(selectedFavorite.date)}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <APODCard apod={apodData} onFavoriteChange={fetchFavorites} />
      </View>
    );
  }

  const renderFavoriteItem = ({ item }: { item: Favorite }) => (
    <TouchableOpacity
      style={[styles.favoriteCard, { backgroundColor: theme.cardBackground }]}
      onPress={() => setSelectedFavorite(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.thumbnail}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.favoriteInfo}>
        <Text style={[styles.favoriteTitle, { color: theme.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.favoriteDate, { color: theme.accent }]}>
          {formatDate(item.date)}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.removeIconButton, { backgroundColor: theme.border }]}
        onPress={(e) => {
          e.stopPropagation();
          handleRemoveFavorite(item.date);
        }}
      >
        <Ionicons name="heart-dislike" size={18} color={theme.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Ionicons name="heart" size={32} color={theme.accent} />
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Favorites
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {favorites.length} saved {favorites.length === 1 ? 'image' : 'images'}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.skeletonCard, { backgroundColor: theme.cardBackground }]}>
              <LoadingSkeleton width={100} height={100} borderRadius={12} />
              <View style={styles.skeletonInfo}>
                <LoadingSkeleton width="80%" height={20} />
                <LoadingSkeleton width="40%" height={16} style={{ marginTop: 8 }} />
              </View>
            </View>
          ))}
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textPrimary }]}>
            No favorites yet
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Save your favorite astronomy pictures to view them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
            />
          }
        />
      )}
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
  listContainer: {
    padding: 16,
    gap: 12,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  favoriteInfo: {
    flex: 1,
    gap: 4,
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  favoriteDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeIconButton: {
    padding: 10,
    borderRadius: 12,
  },
  loadingContainer: {
    padding: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    marginBottom: 12,
  },
  skeletonInfo: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
  },
  detailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  removeButton: {
    padding: 10,
    borderRadius: 12,
  },
});
