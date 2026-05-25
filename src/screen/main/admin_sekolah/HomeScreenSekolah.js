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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#1C2C5B';
const BLUE_DARK = '#0F172A';
const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';
const DANGER = '#F43F5E';
const SOFT_BG = '#F5F7FA';

export default function HomeScreenSekolah({ navigation }) {
  const { width } = useWindowDimensions();
  const [selectedKelas, setSelectedKelas] = useState('All');
  const [selectedTanggal, setSelectedTanggal] = useState('');
  const [stats, setStats] = useState({
    total_siswa: 0,
    total_guru: 0,
    guru_aktif: 0,
    saldo: 0,
    pengambilan_hari_ini: 0,
    status_distribusi: 'Menunggu',
    menus: [],
    total_kantin: 0,
    pending_kantin: 0,
    kantin_list: [],
    chart_data: { labels: [], claimed: [], unclaimed: [] },
    pie_chart: { taking: 0, not_taking: 0 },
    daftar_kelas: [],
    daftar_tanggal: []
  });
  
  const [kantinModalVisible, setKantinModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [deletingKantinId, setDeletingKantinId] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const daysArray = [];
    
    // Padding
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push({ day: null, dateStr: null });
    }
    
    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const dString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      daysArray.push({ day: d, dateStr: dString });
    }
    
    return daysArray;
  };

  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);

  const fetchStats = async (kelasParam = selectedKelas, tanggalParam = selectedTanggal) => {
    try {
      const storedUser = await AsyncStorage.getItem('user_data');
      if (!storedUser) {
        setLoading(false);
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      setUserData(parsedUser);
      
      let url = `sekolah/sekolah_get_stats.php?sekolah_id=${parsedUser.sekolah_id}`;
      if (kelasParam && kelasParam !== 'All') {
        url += `&kelas=${encodeURIComponent(kelasParam)}`;
      }
      if (tanggalParam && tanggalParam !== '') {
        url += `&tanggal=${encodeURIComponent(tanggalParam)}`;
      }
      
      const response = await apiClient.get(url);
      if (response.data && response.data.status === 'success') {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchStats(selectedKelas, selectedTanggal);
      const interval = setInterval(() => {
        fetchStats(selectedKelas, selectedTanggal);
      }, 5000);
      return () => clearInterval(interval);
    }, [selectedKelas, selectedTanggal])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats(selectedKelas, selectedTanggal).then(() => setRefreshing(false));
  };

  const handleDeleteKantin = (kantin) => {
    Alert.alert(
      'Hapus Kantin',
      `Apakah Anda yakin ingin menghapus "${kantin.nama_kantin}" dari daftar sekolah? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingKantinId(kantin.id);
              const storedUser = await AsyncStorage.getItem('user_data');
              const parsedUser = JSON.parse(storedUser);
              const response = await apiClient.post('sekolah/sekolah_delete_kantin.php', {
                kantin_id: kantin.id,
                sekolah_id: parsedUser.sekolah_id,
              });
              if (response.data && response.data.status === 'success') {
                Alert.alert('Berhasil', response.data.message);
                fetchStats(selectedKelas, selectedTanggal);
              } else {
                Alert.alert('Gagal', response.data.message || 'Terjadi kesalahan.');
              }
            } catch (err) {
              Alert.alert('Error', 'Gagal menghapus kantin.');
            } finally {
              setDeletingKantinId(null);
            }
          },
        },
      ]
    );
  };

  const formatPTS = (val) => `${parseInt(val || 0).toLocaleString('id-ID')} PTS`;
  const isLargeScreen = width > 768;

  // Dynamic Pie Chart metrics calculation
  const taking = stats.pie_chart ? stats.pie_chart.taking : 0;
  const notTaking = stats.pie_chart ? stats.pie_chart.not_taking : 0;
  const totalPie = (taking + notTaking) || 1;
  const takingPercent = Math.round((taking / totalPie) * 100);
  const notTakingPercent = Math.max(0, 100 - takingPercent);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* HEADER AREA */}
      <View style={styles.headerArea}>
        <Image source={require('../../../../assets/batik_cirebon.png')} style={styles.batikOverlay} />
        <SafeAreaView>
          <View style={[styles.headerTop, isLargeScreen && styles.centeredContent]}>
            <View style={styles.userInfo}>
              <View style={styles.avatarWrap}>
                {userData?.foto ? (
                  <Image source={{ uri: userData.foto }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitials}>{(userData?.nama || 'A').charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View>
                <Text style={styles.greeting}>Selamat datang,</Text>
                <Text style={styles.adminName}>Admin {userData?.nama || 'Sekolah'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('NotificationList')}>
               <Ionicons name="notifications-outline" size={24} color={WHITE} />
               {(stats.notifikasi && stats.notifikasi.length > 0) && (
                 <View style={styles.dotNotif}>
                   <Text style={{ color: WHITE, fontSize: 8, fontWeight: 'bold', textAlign: 'center' }}>{stats.notifikasi.length}</Text>
                 </View>
               )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
 
      {/* MAIN BODY */}
      <View style={styles.mainBody}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE_PRIMARY]} />}
          contentContainerStyle={[styles.scrollContent, isLargeScreen && styles.centeredContent]}
        >
          {/* 1. SALDO CARD */}
          <View style={styles.walletCardOuter}>
            <View style={styles.walletCard}>
              <View style={styles.walletHeader}>
                <Text style={styles.walletLabel}>POINT OPERASIONAL</Text>
                <MaterialCommunityIcons name="integrated-circuit-chip" size={32} color="rgba(255,255,255,0.3)" />
              </View>
              <Text style={styles.walletValue}>{formatPTS(stats.saldo)}</Text>
              <View style={styles.walletFooter}>
                 <View style={styles.syncRow}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.syncText}>Live Sync</Text>
                 </View>
                 <Text style={styles.schoolName}>{userData?.nama_sekolah || 'LAVIRA MEAL'}</Text>
              </View>
            </View>
          </View>
 
          {/* 2. ACTION BUTTONS */}
          <View style={styles.actionGrid}>
             <View style={styles.rowBetween}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ManajemenPoin')}>
                   <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}><Ionicons name="calendar" size={20} color="#4F46E5" /></View>
                   <Text style={styles.actionBtnText}>Jadwal Poin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EC4899' }]} onPress={() => navigation.navigate('MonitoringMenu')}>
                   <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}><Ionicons name="restaurant" size={20} color={WHITE} /></View>
                   <Text style={[styles.actionBtnText, { color: WHITE }]}>Pantau Menu</Text>
                </TouchableOpacity>
             </View>
             <TouchableOpacity style={styles.btnVerif} onPress={() => navigation.navigate('VerifikasiKantin')}>
                <Ionicons name="shield-checkmark" size={20} color={WHITE} />
                <Text style={styles.btnVerifText}>Verifikasi Kantin Terpadu</Text>
                {stats.pending_kantin > 0 && <View style={styles.badgeCount}><Text style={styles.badgeText}>{stats.pending_kantin}</Text></View>}
             </TouchableOpacity>
          </View>
 
          {/* 3. QUICK METRICS */}
          <View style={styles.metricsGrid}>
             <TouchableOpacity style={styles.metricItem} onPress={() => navigation.navigate('ManajemenKelas')}>
                <View style={[styles.mIcon, { backgroundColor: '#EEF2FF' }]}><Ionicons name="people" size={18} color="#4F46E5" /></View>
                <View><Text style={styles.mVal}>{stats.total_siswa}</Text><Text style={styles.mLab}>Siswa</Text></View>
             </TouchableOpacity>
             <TouchableOpacity style={styles.metricItem} onPress={() => navigation.navigate('ManajemenKelas')}>
                <View style={[styles.mIcon, { backgroundColor: '#E0F2FE' }]}><Ionicons name="school" size={18} color="#0284C7" /></View>
                <View><Text style={styles.mVal}>{stats.guru_aktif || 0}</Text><Text style={styles.mLab}>Guru Aktif</Text></View>
             </TouchableOpacity>
             <TouchableOpacity style={styles.metricItem} onPress={() => setKantinModalVisible(true)}>
                <View style={[styles.mIcon, { backgroundColor: '#F0FDF4' }]}><Ionicons name="storefront" size={18} color="#10B981" /></View>
                <View><Text style={styles.mVal}>{stats.total_kantin || 0}</Text><Text style={styles.mLab}>Kantin</Text></View>
             </TouchableOpacity>
             <TouchableOpacity style={styles.metricItem} onPress={() => navigation.navigate('VerifikasiKantin')}>
                <View style={[styles.mIcon, { backgroundColor: '#FFF7ED' }]}><Ionicons name="time" size={18} color="#F59E0B" /></View>
                <View><Text style={stats.pending_kantin > 0 ? [styles.mVal, { color: DANGER }] : styles.mVal}>{stats.pending_kantin || 0}</Text><Text style={styles.mLab}>Pending</Text></View>
             </TouchableOpacity>
          </View>

          {/* 4. PARTICIPATION PIE CHART / GAUGES WITH DROPDOWNS */}
          <View style={styles.pieContainer}>
             <View style={styles.pieHeader}>
                <View style={{ flex: 1, paddingRight: 5 }}>
                   <Text style={styles.pieTitle}>Persentase Partisipasi</Text>
                   <Text style={styles.pieSubtitle}>
                      {selectedTanggal === '' ? 'Hari Ini' : new Date(selectedTanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })} ({selectedKelas === 'All' ? 'Semua Kelas' : `Kelas ${selectedKelas}`})
                   </Text>
                </View>
                
                {/* SELECT TRIGGERS (DATE + CLASS) */}
                <View style={{ flexDirection: 'row', gap: 6, zIndex: 10 }}>
                   {/* DATE SELECT TRIGGER (OPENS CALENDAR MODAL) */}
                   <TouchableOpacity 
                      style={[styles.dropdownTrigger, { minWidth: 95 }]} 
                      onPress={() => {
                         setCalendarModalVisible(true);
                         setDropdownVisible(false);
                      }}
                   >
                      <Ionicons name="calendar-outline" size={11} color="#10B981" style={{ marginRight: 4 }} />
                      <Text style={styles.dropdownTriggerText} numberOfLines={1}>
                         {selectedTanggal === '' ? 'Hari Ini' : new Date(selectedTanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </Text>
                      <Ionicons name="chevron-down" size={11} color="#64748B" style={{ marginLeft: 4 }} />
                   </TouchableOpacity>

                   {/* CLASS SELECT TRIGGER */}
                   <TouchableOpacity 
                      style={[styles.dropdownTrigger, { minWidth: 95 }]} 
                      onPress={() => {
                         setDropdownVisible(!dropdownVisible);
                      }}
                   >
                      <Ionicons name="funnel-outline" size={11} color="#4F46E5" style={{ marginRight: 4 }} />
                      <Text style={styles.dropdownTriggerText} numberOfLines={1}>
                         {selectedKelas === 'All' ? 'Kelas' : selectedKelas}
                      </Text>
                      <Ionicons name={dropdownVisible ? "chevron-up" : "chevron-down"} size={11} color="#64748B" style={{ marginLeft: 4 }} />
                   </TouchableOpacity>
                </View>
             </View>

             {/* FLOATING CLASS DROPDOWN LIST */}
             {dropdownVisible && (
                <View style={[styles.dropdownListContainer, { right: 22, width: 130 }]}>
                   <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} contentContainerStyle={{ paddingVertical: 4 }}>
                      <TouchableOpacity 
                         style={[styles.dropdownItem, selectedKelas === 'All' && styles.dropdownItemActive]}
                         onPress={() => {
                            setSelectedKelas('All');
                            setDropdownVisible(false);
                         }}
                      >
                         <Text style={[styles.dropdownItemText, selectedKelas === 'All' && styles.dropdownItemTextActive]}>Semua Kelas</Text>
                         {selectedKelas === 'All' && <Ionicons name="checkmark-circle" size={14} color="#4F46E5" />}
                      </TouchableOpacity>
                      {stats.daftar_kelas && stats.daftar_kelas.map((kelas, idx) => (
                         <TouchableOpacity 
                            key={idx} 
                            style={[styles.dropdownItem, selectedKelas === kelas && styles.dropdownItemActive]}
                            onPress={() => {
                               setSelectedKelas(kelas);
                               setDropdownVisible(false);
                            }}
                         >
                            <Text style={[styles.dropdownItemText, selectedKelas === kelas && styles.dropdownItemTextActive]}>{kelas}</Text>
                            {selectedKelas === kelas && <Ionicons name="checkmark-circle" size={14} color="#4F46E5" />}
                         </TouchableOpacity>
                      ))}
                   </ScrollView>
                </View>
             )}
             
             <View style={styles.pieBody}>
                {/* Concentric Donut representation */}
                <View style={[styles.donutOuter, { borderColor: takingPercent >= 70 ? '#10B981' : '#4F46E5' }]}>
                   <View style={styles.donutInner}>
                      <Text style={styles.donutPercentText}>{takingPercent}%</Text>
                      <Text style={styles.donutLabelText}>Mengambil</Text>
                   </View>
                </View>

                {/* Progress Indicators & Detailed Legend */}
                <View style={styles.pieDetails}>
                   {/* Row 1: Taking MBG */}
                   <View style={styles.pieDetailRow}>
                      <View style={styles.pieDetailHeader}>
                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.legendDot, { backgroundColor: takingPercent >= 70 ? '#10B981' : '#4F46E5' }]} />
                            <Text style={styles.pieDetailLabel}>Mengambil</Text>
                         </View>
                         <Text style={styles.pieDetailValue}>{taking} Siswa ({takingPercent}%)</Text>
                      </View>
                      <View style={styles.pieProgressBarOuter}>
                         <View style={[styles.pieProgressBarInner, { width: `${takingPercent}%`, backgroundColor: takingPercent >= 70 ? '#10B981' : '#4F46E5' }]} />
                      </View>
                   </View>

                   {/* Row 2: Not Taking MBG */}
                   <View style={styles.pieDetailRow}>
                      <View style={styles.pieDetailHeader}>
                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.legendDot, { backgroundColor: '#F43F5E' }]} />
                            <Text style={styles.pieDetailLabel}>Tidak Mengambil</Text>
                         </View>
                         <Text style={styles.pieDetailValue}>{notTaking} Siswa ({notTakingPercent}%)</Text>
                      </View>
                      <View style={styles.pieProgressBarOuter}>
                         <View style={[styles.pieProgressBarInner, { width: `${notTakingPercent}%`, backgroundColor: '#F43F5E' }]} />
                      </View>
                   </View>
                </View>
             </View>
          </View>
        </ScrollView>
      </View>

      {/* BOTTOM NAVIGATION (SYNCHRONIZED STYLE) */}
      <View style={styles.bottomNav}>
        <View style={[styles.bottomNavInner, isLargeScreen && styles.centeredContent]}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="grid" size={24} color={BLUE_PRIMARY} />
            <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Beranda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ManajemenKelas')}>
            <Ionicons name="layers-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Kelas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('LaporanSekolah')}>
            <Ionicons name="bar-chart-outline" size={24} color="#94A3B8" />
            <Text style={styles.navLabel}>Laporan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfilSekolah')}>
            <Ionicons name="person-outline" size={24} color="#94a3b8" />
            <Text style={styles.navLabel}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KANTIN MODAL */}
      <Modal visible={kantinModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.kantinModalSheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Mitra Kantin</Text>
                <Text style={styles.sheetSubtitle}>{stats.kantin_aktif || 0} Aktif dari {stats.total_kantin || 0} Terdaftar</Text>
              </View>
              <TouchableOpacity onPress={() => setKantinModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={BLUE_DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {stats.kantin_list && stats.kantin_list.length > 0 ? (
                <View style={{ gap: 12, paddingBottom: 20 }}>
                  {stats.kantin_list.map((k, idx) => (
                    <View key={idx} style={styles.kantinListItem}>
                      <View style={[styles.mIcon, { backgroundColor: '#F0FDF4', marginRight: 15 }]}>
                         <Ionicons name="storefront" size={20} color={SUCCESS} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: BLUE_DARK }}>{k.nama_kantin}</Text>
                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600' }}>PIC: {k.penanggung_jawab}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: k.is_aktif ? '#DCFCE7' : '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: k.is_aktif ? SUCCESS : DANGER }} />
                          <Text style={{ fontSize: 10, fontWeight: 'bold', color: k.is_aktif ? SUCCESS : DANGER }}>{k.is_aktif ? 'Aktif' : 'Non-Aktif'}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteKantin(k)}
                          disabled={deletingKantinId === k.id}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                        >
                          {deletingKantinId === k.id
                            ? <ActivityIndicator size={10} color={DANGER} />
                            : <Ionicons name="trash-outline" size={12} color={DANGER} />}
                          <Text style={{ fontSize: 10, fontWeight: 'bold', color: DANGER }}>Hapus</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Ionicons name="storefront-outline" size={48} color="#CBD5E1" />
                  <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 10, fontWeight: '600' }}>Belum ada kantin terdaftar</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 5. GORGEOUS CUSTOM CALENDAR GRID PICKER MODAL */}
      <Modal
        visible={calendarModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarModalSheet}>
            {/* Calendar Header */}
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
                <Ionicons name="chevron-back" size={20} color={BLUE_DARK} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {calendarDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn}>
                <Ionicons name="chevron-forward" size={20} color={BLUE_DARK} />
              </TouchableOpacity>
            </View>

            {/* Weekday Row Header */}
            <View style={styles.weekdayRow}>
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((w, idx) => (
                <Text key={idx} style={styles.weekdayLabel}>{w}</Text>
              ))}
            </View>

            {/* Grid of Days */}
            <View style={styles.calendarGrid}>
              {getCalendarDays().map((item, idx) => {
                const isSelected = item.dateStr === selectedTanggal;
                const localToday = (() => {
                  const d = new Date();
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                })();
                const isToday = item.dateStr === localToday;
                return (
                  <View key={idx} style={styles.dayGridCell}>
                    {item.day ? (
                      <TouchableOpacity
                        style={[
                          styles.dayCellBtn,
                          isSelected && styles.dayCellBtnSelected,
                          !isSelected && isToday && styles.dayCellBtnToday
                        ]}
                        onPress={() => {
                          setSelectedTanggal(item.dateStr);
                          setCalendarModalVisible(false);
                        }}
                      >
                        <Text style={[
                          styles.dayCellText,
                          isSelected && styles.dayCellTextSelected,
                          !isSelected && isToday && styles.dayCellTextToday
                        ]}>
                          {item.day}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {/* Calendar Footer Controls */}
            <View style={styles.calendarFooter}>
              <TouchableOpacity 
                style={styles.calendarResetBtn}
                onPress={() => {
                  setSelectedTanggal('');
                  setCalendarModalVisible(false);
                }}
              >
                <Text style={styles.calendarResetBtnText}>Reset (Hari Ini)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.calendarCloseBtn}
                onPress={() => setCalendarModalVisible(false)}
              >
                <Text style={styles.calendarCloseBtnText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLUE_PRIMARY },
  centeredContent: { width: '100%', maxWidth: 1000, alignSelf: 'center' },
  headerArea: { height: 180, backgroundColor: BLUE_PRIMARY, borderBottomLeftRadius: 45, borderBottomRightRadius: 45, overflow: 'hidden' },
  batikOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, paddingHorizontal: 25 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { width: 45, height: 45, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImg: { width: '100%', height: '100%', borderRadius: 12 },
  avatarInitials: { color: WHITE, fontWeight: 'bold', fontSize: 18 },
  greeting: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' },
  adminName: { fontSize: 16, fontWeight: 'bold', color: WHITE },
  notifBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  dotNotif: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: DANGER, borderWidth: 2, borderColor: BLUE_PRIMARY },

  mainBody: { flex: 1, backgroundColor: SOFT_BG, borderTopLeftRadius: 45, borderTopRightRadius: 45, marginTop: -40 },
  scrollContent: { paddingBottom: 120 },
  
  walletCardOuter: { marginHorizontal: 25, marginTop: 25 },
  walletCard: { backgroundColor: '#1C2C5B', borderRadius: 32, padding: 25, elevation: 15, shadowOpacity: 0.3, shadowRadius: 15 },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  walletValue: { fontSize: 32, fontWeight: '900', color: WHITE, marginTop: 10 },
  walletFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  syncRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SUCCESS, marginRight: 6 },
  syncText: { fontSize: 9, color: WHITE, fontWeight: 'bold' },
  schoolName: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' },

  actionGrid: { paddingHorizontal: 25, marginTop: 25, gap: 12 },
  rowBetween: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 55, backgroundColor: WHITE, borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, elevation: 3 },
  iconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  actionBtnText: { fontSize: 12, fontWeight: 'bold', color: BLUE_DARK },
  btnVerif: { width: '100%', height: 55, backgroundColor: BLUE_PRIMARY, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  btnVerifText: { color: WHITE, fontSize: 13, fontWeight: 'bold', marginLeft: 10 },
  badgeCount: { marginLeft: 10, backgroundColor: DANGER, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { color: WHITE, fontSize: 10, fontWeight: 'bold' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 25, marginTop: 25 },
  metricItem: { width: '48%', backgroundColor: WHITE, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  mIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  mVal: { fontSize: 18, fontWeight: '900', color: BLUE_DARK },
  mLab: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 35, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: BLUE_DARK },
  seeAll: { fontSize: 12, color: BLUE_PRIMARY, fontWeight: 'bold' },
  chartContainer: { marginHorizontal: 25, marginTop: 30, backgroundColor: WHITE, borderRadius: 32, padding: 22, elevation: 4, shadowColor: BLUE_PRIMARY, shadowOpacity: 0.08, shadowRadius: 15 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: '900', color: BLUE_DARK },
  chartSubtitle: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  badgeTotalSiswa: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeTotalSiswaText: { fontSize: 11, fontWeight: '800', color: '#4F46E5' },
  
  chartLegend: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: '#64748B', fontWeight: 'bold' },

  chartBodyWrapper: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  yAxisLabels: { height: 120, justifyContent: 'space-between', paddingRight: 10, alignItems: 'flex-end', width: 35 },
  yAxisText: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8' },
  
  chartArea: { flex: 1, height: 120, position: 'relative' },
  gridLinesContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', height: 120 },
  gridLine: { height: 1, borderTopWidth: 1, borderColor: '#F1F5F9' },
  
  chartBarsWrapper: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  chartColumn: { alignItems: 'center', flex: 1, height: 120, justifyContent: 'flex-end' },
  barsContainer: { height: 120, justifyContent: 'flex-end', width: '100%', alignItems: 'center', position: 'relative', paddingBottom: 10 },
  
  stackedCapsule: { width: 22, height: 90, borderRadius: 11, backgroundColor: '#F1F5F9', overflow: 'hidden', flexDirection: 'column-reverse' },
  capsulePortionClaimed: { backgroundColor: '#4F46E5', width: '100%' },
  capsulePortionUnclaimed: { backgroundColor: '#E2E8F0', width: '100%' },
  
  barBadgeText: { fontSize: 9, fontWeight: '900', color: '#4F46E5', position: 'absolute', top: 0, alignSelf: 'center' },
  columnLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginTop: 6 },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 50, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  bottomNavInner: { flex: 1, flexDirection: 'row', paddingBottom: 20, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  kantinModalSheet: { backgroundColor: WHITE, borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, maxHeight: '80%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: BLUE_DARK },
  sheetSubtitle: { fontSize: 12, color: '#64748B', fontWeight: 'bold', marginTop: 4 },
  closeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: SOFT_BG, justifyContent: 'center', alignItems: 'center' },
  kantinListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: SOFT_BG, padding: 15, borderRadius: 18, elevation: 1 },

  // Class & Date Dropdown Selector Styles
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2FD', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#EEF2FF', justifyContent: 'space-between' },
  dropdownTriggerText: { fontSize: 10, fontWeight: '800', color: '#64748B', maxWidth: 65 },
  
  dropdownListContainer: { position: 'absolute', top: 65, right: 22, width: 140, zIndex: 999, backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 10, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, paddingHorizontal: 4, paddingVertical: 2 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, marginVertical: 1 },
  dropdownItemActive: { backgroundColor: '#EEF2FF' },
  dropdownItemText: { fontSize: 11, fontWeight: '700', color: '#64748B', flex: 1 },
  dropdownItemTextActive: { color: '#4F46E5' },

  // Participation Pie Chart Styles
  pieContainer: { marginHorizontal: 25, marginTop: 25, backgroundColor: WHITE, borderRadius: 32, padding: 22, elevation: 4, shadowColor: BLUE_PRIMARY, shadowOpacity: 0.08, shadowRadius: 15, position: 'relative', overflow: 'visible' },
  pieHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pieTitle: { fontSize: 16, fontWeight: '900', color: BLUE_DARK },
  pieSubtitle: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  badgeDate: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  badgeDateText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  pieBody: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  donutOuter: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.05, shadowRadius: 5 },
  donutInner: { width: 84, height: 84, borderRadius: 42, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center' },
  donutPercentText: { fontSize: 18, fontWeight: '900', color: BLUE_DARK },
  donutLabelText: { fontSize: 8, fontWeight: 'bold', color: '#94A3B8', marginTop: 2 },
  pieDetails: { flex: 1, gap: 15 },
  pieDetailRow: { width: '100%' },
  pieDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  pieDetailLabel: { fontSize: 11, fontWeight: 'bold', color: BLUE_DARK },
  pieDetailValue: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  pieProgressBarOuter: { height: 6, width: '100%', backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  pieProgressBarInner: { height: '100%', borderRadius: 3 },

  // Custom Calendar Modal Styles
  calendarOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  calendarModalSheet: { backgroundColor: WHITE, borderRadius: 28, padding: 22, width: '100%', maxWidth: 340, elevation: 25, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 20 },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  monthNavBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SOFT_BG, justifyContent: 'center', alignItems: 'center' },
  calendarMonthTitle: { fontSize: 15, fontWeight: '900', color: BLUE_DARK },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: '#94A3B8' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 },
  dayGridCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  dayCellBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dayCellBtnSelected: { backgroundColor: '#10B981', elevation: 4, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 5 },
  dayCellBtnToday: { borderWidth: 1, borderColor: '#10B981' },
  dayCellText: { fontSize: 11, fontWeight: '800', color: BLUE_DARK },
  dayCellTextSelected: { color: WHITE },
  dayCellTextToday: { color: '#10B981' },
  calendarFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  calendarResetBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  calendarResetBtnText: { fontSize: 11, fontWeight: 'bold', color: '#10B981' },
  calendarCloseBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: BLUE_DARK, justifyContent: 'center', alignItems: 'center' },
  calendarCloseBtnText: { fontSize: 11, fontWeight: 'bold', color: WHITE },
});
