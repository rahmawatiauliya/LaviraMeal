import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import apiClient, { IMAGE_BASE_URL } from '../../../api/client';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_DARK = '#0F172A';
const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';
const SUCCESS = '#10B981';

const { width } = Dimensions.get('window');

export default function CanteenFeedbackScreen({ route, navigation }) {
  const { kantin_id, nama_kantin, foto_kantin } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total_feedbacks: 0,
    average_rating: 0,
    stars_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [kantin_id]);

  const fetchFeedbacks = async () => {
    if (!kantin_id) return;
    try {
      const response = await apiClient.get(`shared/get_canteen_feedbacks.php?kantin_id=${kantin_id}`);
      if (response.data && response.data.status === 'success') {
        setStats(response.data.stats);
        setFeedbacks(response.data.feedbacks || []);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeedbacks();
  };

  const parseSafeDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const safeStr = dateStr.replace(' ', 'T');
      const date = new Date(safeStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const renderStars = (count, size = 12) => {
    return (
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Ionicons
            key={s}
            name={s <= count ? "star" : "star-outline"}
            size={size}
            color={GOLD}
          />
        ))}
      </View>
    );
  };

  const getProgressWidth = (count) => {
    if (stats.total_feedbacks === 0) return '0%';
    const pct = (count / stats.total_feedbacks) * 100;
    return `${pct}%`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BLUE_PRIMARY} />
        <Text style={styles.loadingText}>Memuat ulasan kantin...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER SECTION */}
      <View style={styles.headerArea}>
        <View style={styles.headerBg}>
          <Image
            source={require('../../../../assets/batik_cirebon.png')}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.12, resizeMode: 'repeat' }]}
          />
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnAction}>
                <Feather name="arrow-left" size={24} color={WHITE} />
              </TouchableOpacity>
              <Text style={styles.headerTitleTxt} numberOfLines={1}>Ulasan {nama_kantin || 'Kantin'}</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />
        }
      >
        {/* OVERALL RATING CARD */}
        <View style={styles.ratingOverviewCard}>
          <View style={styles.ratingNumberBox}>
            <Text style={styles.avgRatingValue}>{stats.average_rating.toFixed(1)}</Text>
            {renderStars(Math.round(stats.average_rating), 18)}
            <Text style={styles.totalReviewsLabel}>{stats.total_feedbacks} Ulasan</Text>
          </View>

          <View style={styles.dividerVertical} />

          <View style={styles.ratingBarsBox}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.stars_distribution[star] || 0;
              return (
                <View key={star} style={styles.ratingBarRow}>
                  <Text style={styles.starRowLabel}>{star}</Text>
                  <Ionicons name="star" size={10} color={GOLD} style={{ marginRight: 6 }} />
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: getProgressWidth(count) }]} />
                  </View>
                  <Text style={styles.starRowCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* FEEDBACKS LIST SECTION */}
        <Text style={styles.sectionTitle}>Semua Ulasan Pelanggan</Text>

        {feedbacks.length > 0 ? (
          feedbacks.map((item) => (
            <View key={item.id} style={styles.reviewItemCard}>
              <View style={styles.reviewHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewerName}>{item.reviewer_name || 'Anonim'}</Text>
                  <Text style={styles.reviewDate}>{parseSafeDate(item.created_at)}</Text>
                </View>
                {renderStars(item.rating, 14)}
              </View>

              <Text style={styles.reviewComment}>{item.review || 'Tidak ada komentar ulasan.'}</Text>

              {item.photo && (
                <TouchableOpacity
                  style={styles.reviewPhotoContainer}
                  onPress={() => setSelectedPhoto(`${IMAGE_BASE_URL}${item.photo}`)}
                >
                  <Image
                    source={{ uri: `${IMAGE_BASE_URL}${item.photo}` }}
                    style={styles.reviewPhoto}
                    resizeMode="cover"
                  />
                  <View style={styles.zoomOverlay}>
                    <Ionicons name="scan-outline" size={20} color={WHITE} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbox-ellipses-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Belum ada ulasan untuk kantin ini.</Text>
          </View>
        )}
      </ScrollView>

      {/* PHOTO ZOOM MODAL */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedPhoto(null)}>
            <Feather name="x" size={28} color={WHITE} />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.zoomedImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: SOFT_BG },
  loadingText: { fontSize: 13, color: '#94A3B8', fontWeight: 'bold', marginTop: 10 },
  headerArea: { height: 120, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', elevation: 15 },
  headerBg: { flex: 1, backgroundColor: BLUE_PRIMARY, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25 },
  backBtnAction: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitleTxt: { fontSize: 18, fontWeight: '900', color: WHITE, flex: 1, textAlign: 'center' },
  scrollContainer: { padding: 20, paddingBottom: 50 },
  
  ratingOverviewCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  ratingNumberBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '35%'
  },
  avgRatingValue: {
    fontSize: 38,
    fontWeight: '900',
    color: BLUE_DARK,
    marginBottom: 4
  },
  totalReviewsLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: 'bold',
    marginTop: 6
  },
  dividerVertical: {
    width: 1,
    height: 100,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 15
  },
  ratingBarsBox: {
    flex: 1,
    justifyContent: 'center'
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2
  },
  starRowLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    width: 12,
    textAlign: 'center'
  },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 3
  },
  starRowCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    width: 20,
    textAlign: 'right',
    marginLeft: 6
  },
  
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: BLUE_DARK,
    marginBottom: 15
  },
  
  reviewItemCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: BLUE_DARK
  },
  reviewDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600'
  },
  reviewComment: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18
  },
  
  reviewPhotoContainer: {
    marginTop: 12,
    width: 120,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  reviewPhoto: {
    width: '100%',
    height: '100%'
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(11,30,63,0.6)',
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: WHITE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: 'bold',
    marginTop: 10
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },
  zoomedImage: {
    width: '100%',
    height: '80%'
  }
});
