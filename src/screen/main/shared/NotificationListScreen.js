import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';
const ACCENT = '#3B82F6';

export default function NotificationListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserAndNotifs();
  }, []);

  const loadUserAndNotifs = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('user_data');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setUser(parsed);
        fetchNotifications(parsed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotifications = async (parsedUser) => {
    try {
      let url = '';
      if (parsedUser.role === 'sppg') {
        url = `sppg/sppg_get_stats.php?sppg_id=${parsedUser.sppg_id}`;
      } else if (parsedUser.role === 'sekolah') {
        url = `sekolah/sekolah_get_stats.php?sekolah_id=${parsedUser.sekolah_id}`;
      } else if (parsedUser.role === 'kantin') {
        url = `kantin/get_notifications.php?user_id=${parsedUser.id}`;
      }

      if (url) {
        const response = await apiClient.get(url);
        if (response.data.status === 'success') {
          setNotifications(response.data.data.notifikasi || []);
          
          // Mark notifications as read in database
          apiClient.post('shared/mark_notifications_read.php', {
            role: parsedUser.role,
            sekolah_id: parsedUser.sekolah_id,
            sppg_id: parsedUser.sppg_id,
            user_id: parsedUser.id
          }).catch(err => console.error("Error marking read:", err));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndNotifs();
  };

  const handleNotifPress = (notif) => {
    // Navigate based on type
    if (notif.type === 'verifikasi_kantin') {
      if (user.role === 'sppg') {
        navigation.navigate('PersetujuanRegistrasi');
      } else {
        navigation.navigate('VerifikasiKantin');
      }
    } else if (notif.type === 'menu_harian') {
      navigation.navigate('MonitoringMenu');
    } else if (notif.type === 'feedback_menu') {
      navigation.navigate('PostMenuHarian');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleNotifPress(item)}>
      <View style={[styles.iconBox, { backgroundColor: item.type === 'verifikasi_kantin' ? '#FFF7ED' : '#EFF6FF' }]}>
        <Ionicons 
            name={item.type === 'verifikasi_kantin' ? 'shield-checkmark' : 'fast-food'} 
            size={24} 
            color={item.type === 'verifikasi_kantin' ? '#F59E0B' : ACCENT} 
        />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.comment}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <View style={styles.dot} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={BLUE_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Belum Ada Notifikasi</Text>
              <Text style={styles.emptySub}>Pemberitahuan penting akan muncul di sini.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: WHITE, elevation: 2 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: BLUE_PRIMARY },
  listPadding: { padding: 20 },
  card: { backgroundColor: WHITE, borderRadius: 20, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textCol: { flex: 1 },
  title: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  message: { fontSize: 13, color: '#64748B', marginTop: 2 },
  date: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT, marginLeft: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748B', marginTop: 15 },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8 },
});
