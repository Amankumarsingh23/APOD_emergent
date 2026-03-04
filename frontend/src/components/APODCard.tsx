import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useAppStore } from '../store/appStore';
import { APODData, addFavorite, removeFavorite, checkFavorite } from '../services/api';
import { format } from 'date-fns';
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface APODCardProps {
  apod: APODData;
  showActions?: boolean;
  onFavoriteChange?: () => void;
}

export const APODCard: React.FC<APODCardProps> = ({
  apod,
  showActions = true,
  onFavoriteChange,
}) => {
  const theme = useAppStore((state) => state.theme);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  React.useEffect(() => {
    checkIfFavorite();
  }, [apod.date]);

  const checkIfFavorite = async () => {
    try {
      const result = await checkFavorite(apod.date);
      setIsFavorite(result);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const handleToggleFavorite = async () => {
    setIsLoading(true);
    try {
      if (isFavorite) {
        await removeFavorite(apod.date);
        setIsFavorite(false);
      } else {
        await addFavorite(apod);
        setIsFavorite(true);
      }
      onFavoriteChange?.();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `${apod.title}\n\nDate: ${apod.date}\n\n${apod.explanation.substring(0, 200)}...\n\nView more: ${apod.url}`;
      
      if (await Sharing.isAvailableAsync()) {
        // Download image first
        const filename = `apod_${apod.date}.jpg`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        
        await FileSystem.downloadAsync(apod.url, fileUri);
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/jpeg',
          dialogTitle: apod.title,
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const handleSetWallpaper = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant media library access to save the image');
        return;
      }

      setIsLoading(true);
      const filename = `apod_${apod.date}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.downloadAsync(apod.hdurl || apod.url, fileUri);
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      
      Alert.alert(
        'Image Saved!',
        'The image has been saved to your gallery. You can set it as wallpaper from your device settings.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error setting wallpaper:', error);
      Alert.alert('Error', 'Failed to save image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLearnMore = () => {
    const searchTerm = encodeURIComponent(apod.title.replace(/\s+/g, '_'));
    const wikiUrl = `https://en.wikipedia.org/wiki/${searchTerm}`;
    setShowWebView(true);
  };

  const formattedDate = () => {
    try {
      const date = new Date(apod.date);
      return format(date, 'MMMM d, yyyy');
    } catch {
      return apod.date;
    }
  };

  if (showWebView) {
    const searchTerm = encodeURIComponent(apod.title.replace(/\s+/g, '_'));
    const wikiUrl = `https://en.wikipedia.org/wiki/${searchTerm}`;
    
    return (
      <View style={[styles.webViewContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.webViewHeader, { backgroundColor: theme.cardBackground }]}>
          <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.webViewTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            Learn More: {apod.title}
          </Text>
        </View>
        <WebView source={{ uri: wikiUrl }} style={styles.webView} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {apod.media_type === 'video' ? (
          <View style={[styles.videoPlaceholder, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="videocam" size={48} color={theme.accent} />
            <Text style={[styles.videoText, { color: theme.textSecondary }]}>
              Video content - Tap to view
            </Text>
            <TouchableOpacity
              style={[styles.videoButton, { backgroundColor: theme.accent }]}
              onPress={() => Linking.openURL(apod.url)}
            >
              <Text style={styles.videoButtonText}>Open Video</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Image
            source={{ uri: apod.url }}
            style={styles.image}
            contentFit="cover"
            transition={500}
            onLoad={() => setImageLoaded(true)}
          />
        )}
      </View>

      {/* Content */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{apod.title}</Text>
        <Text style={[styles.date, { color: theme.accent }]}>{formattedDate()}</Text>
        
        {apod.copyright && (
          <Text style={[styles.copyright, { color: theme.textSecondary }]}>
            © {apod.copyright}
          </Text>
        )}

        <Text style={[styles.explanation, { color: theme.textSecondary }]}>
          {apod.explanation}
        </Text>

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isFavorite ? theme.accent : theme.border }]}
              onPress={handleToggleFavorite}
              disabled={isLoading}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? '#FFFFFF' : theme.textPrimary}
              />
              <Text style={[styles.actionText, { color: isFavorite ? '#FFFFFF' : theme.textPrimary }]}>
                {isFavorite ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.border }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color={theme.textPrimary} />
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>Share</Text>
            </TouchableOpacity>

            {Platform.OS === 'android' && apod.media_type === 'image' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.border }]}
                onPress={handleSetWallpaper}
                disabled={isLoading}
              >
                <Ionicons name="image-outline" size={20} color={theme.textPrimary} />
                <Text style={[styles.actionText, { color: theme.textPrimary }]}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Learn More Button */}
        <TouchableOpacity
          style={[styles.learnMoreButton, { backgroundColor: theme.accent }]}
          onPress={handleLearnMore}
        >
          <Ionicons name="book-outline" size={20} color="#FFFFFF" />
          <Text style={styles.learnMoreText}>Learn More</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  videoText: {
    fontSize: 16,
  },
  videoButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  card: {
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  explanation: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  learnMoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webViewContainer: {
    flex: 1,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
  },
  backButton: {
    marginRight: 12,
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});
