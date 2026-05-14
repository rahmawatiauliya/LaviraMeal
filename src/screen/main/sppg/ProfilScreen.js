import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  useWindowDimensions,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../api/client';
import * as ImagePicker from 'expo-image-picker';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_ACCENT = '#38BDF8';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';
const TEXT_MAIN = '#1E293B';
const TEXT_MUTED = '#64748B';
const BORDER_LIGHT = '#E2E8F0';
const ACCENT_GREEN = '#10B981';
const ACCENT_RED = '#F43F5E';
const ACCENT_YELLOW = '#F59E0B';

export default function ProfilScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    nama: 'Admin Otoritas',
    email: 'admin@sppg.id',
    role: 'sppg',
    nama_lembaga: 'SPPG PUSAT',
    jabatan: 'Administrator Wilayah',
    nip: 'SPPG-2026-001'
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [pinModal, setPinModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [showPins, setShowPins] = useState(false);

  useEffect(() => {
    loadUserData();
    AsyncStorage.getItem('@profile_image').then(img => img && setProfileImage(img));
  }, []);

  const loadUserData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('user_data');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setUserData(prev => ({
          ...prev,
          ...parsed,
          displayLembaga: parsed.nama_lembaga || parsed.displayLembaga || 'SPPG PUSAT',
          displayJabatan: parsed.jabatan || parsed.displayJabatan || 'Administrator Sistem'
        }));
      }
    } catch (e) { console.error('Error loading user data:', e); }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin galeri untuk mengubah foto profil.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      setProfileImage(selectedUri);
      await AsyncStorage.setItem('@profile_image', selectedUri);
      Alert.alert("Berhasil", "Foto profil Anda telah diperbarui.");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin mengakhiri sesi ini?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Keluar", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('user_data');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } 
        }
      ]
    );
  };

  const handleChangePin = async () => {
    if (!oldPin || !newPin || !confirmPin) {
      Alert.alert("Gagal", "Silakan lengkapi semua data pengamanan.");
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert("Gagal", "Konfirmasi sandi baru tidak sesuai.");
      return;
    }

    setIsChangingPin(true);
    try {
      const response = await apiClient.post('auth/change_password.php', {
        user_id: userData.id,
        old_password: oldPin,
        new_password: newPin
      });

      if (response.data.status === 'success') {
        Alert.alert("Berhasil", "Sandi pengamanan telah diperbarui.");
        setPinModal(false);
        setOldPin(''); setNewPin(''); setConfirmPin('');
      } else {
        Alert.alert("Gagal", response.data.message || "Sandi lama tidak valid.");
      }
    } catch (error) {
      Alert.alert("Kesalahan", "Gagal menghubungi server keamanan.");
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedData.nama || !editedData.email) {
      Alert.alert("Gagal", "Nama dan Email wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      // Simpan ke AsyncStorage
      const newData = { ...userData, ...editedData };
      await AsyncStorage.setItem('user_data', JSON.stringify(newData));
      setUserData(newData);
      setEditModal(false);
      Alert.alert("Berhasil", "Data profil telah diperbarui secara lokal.");
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan perubahan.");
    } finally {
      setLoading(false);
    }
  };

  const renderInfoCard = (label, value, icon, color) => (
    <View style={styles.infoCard}>
      <View style={[styles.infoIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabelText}>{label}</Text>
        <Text style={styles.infoValueText}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        {/* PREMIUM HEADER HERO */}
        <View style={styles.headerHero}>
           <ImageBackground 
             source={require('../../../../assets/batik_cirebon.png')} 
             style={styles.batikHeader}
             imageStyle={{ opacity: 0.15, resizeMode: 'repeat' }}
           >
             <SafeAreaView style={styles.safeHeader}>
                <View style={styles.headerTop}>
                   <TouchableOpacity onPress={() => navigation.goBack()}>
                      <Ionicons name="arrow-back" size={24} color={WHITE} />
                   </TouchableOpacity>
                   <Text style={styles.headerMainTitle}>PROFIL AKUN</Text>
                   <TouchableOpacity onPress={handleLogout}>
                      <Ionicons name="log-out-outline" size={24} color={WHITE} />
                   </TouchableOpacity>
                </View>

                <View style={styles.profileSection}>
                   <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
                      <View style={styles.avatarFrame}>
                         {profileImage ? (
                           <Image source={{ uri: profileImage }} style={styles.avatarImg} />
                         ) : (
                           <View style={styles.avatarPlaceholder}>
                             <Text style={styles.avatarInitial}>{userData.nama?.[0] || 'A'}</Text>
                           </View>
                         )}
                      </View>
                      <View style={styles.editBadge}>
                         <Ionicons name="camera" size={14} color={WHITE} />
                      </View>
                   </TouchableOpacity>
                   <Text style={styles.profileName}>{userData.nama}</Text>
                   <View style={styles.badgeRow}>
                      <View style={styles.premiumBadge}>
                         <MaterialCommunityIcons name="shield-check" size={12} color={BLUE_ACCENT} />
                         <Text style={styles.premiumBadgeText}>{userData.role?.toUpperCase()}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.editActionBtn}
                        onPress={() => {
                          setEditedData({ 
                            nama: userData.nama, 
                            email: userData.email, 
                            jabatan: userData.displayJabatan,
                            nip: userData.nip 
                          });
                          setEditModal(true);
                        }}
                      >
                         <Feather name="edit-3" size={12} color={WHITE} />
                         <Text style={styles.editActionText}>Edit Data</Text>
                      </TouchableOpacity>
                   </View>
                </View>
             </SafeAreaView>
           </ImageBackground>
        </View>

        {/* IDENTITY CARD - DIGITAL ID STYLE */}
        <View style={styles.cardWrapper}>
           <View style={styles.digitalIdCard}>
              <View style={styles.idCardHeader}>
                 <View>
                    <Text style={styles.idLembaga}>{userData.displayLembaga}</Text>
                    <Text style={styles.idSystem}>
                      {userData.role === 'kantin' ? 'LaviraMeal Merchant Partner' : 
                       userData.role === 'siswa' ? 'LaviraMeal Student Card' : 
                       'LaviraMeal Authority System'}
                    </Text>
                 </View>
                 <MaterialCommunityIcons name="integrated-circuit-chip" size={36} color={ACCENT_YELLOW} />
              </View>
              
              <View style={styles.idDivider} />

              <View style={styles.idDetails}>
                 <View style={styles.idField}>
                    <Text style={styles.idLabel}>
                      {userData.role === 'kantin' ? 'KODE IDENTITAS KANTIN' : 
                       userData.role === 'siswa' ? 'NOMOR INDUK SISWA (NIS)' : 
                       'NOMOR INDUK PEGAWAI (NIP)'}
                    </Text>
                    <Text style={styles.idValue}>{userData.username || userData.nip || 'N/A'}</Text>
                 </View>
                 <View style={styles.idField}>
                    <Text style={styles.idLabel}>JABATAN STRUKTUR</Text>
                    <Text style={styles.idValue}>{userData.displayJabatan}</Text>
                 </View>
              </View>

              <View style={styles.idFooter}>
                 <View style={styles.footerInfo}>
                    <Text style={styles.idLabel}>STATUS</Text>
                    <View style={styles.statusRow}>
                       <View style={styles.activeDot} />
                       <Text style={styles.statusText}>AKTIF & TERVERIFIKASI</Text>
                    </View>
                 </View>
                 <Image 
                   source={require('../../../../assets/batik_cirebon.png')} 
                   style={styles.watermark} 
                 />
              </View>
           </View>
        </View>

        {/* ACCOUNT INFO SECTION */}
        <View style={styles.section}>
           <Text style={styles.sectionHeading}>INFORMASI AKUN</Text>
           {renderInfoCard('Alamat Email', userData.email || '-', 'mail-outline', BLUE_ACCENT)}
           {renderInfoCard('ID Pengguna', userData.id || 'N/A', 'finger-print-outline', ACCENT_GREEN)}
        </View>

        {/* SETTINGS SECTION */}
        <View style={styles.section}>
           <Text style={styles.sectionHeading}>KEAMANAN & PENGATURAN</Text>
           <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setPinModal(true)}>
                 <View style={[styles.menuIconBox, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#4F46E5" />
                 </View>
                 <Text style={styles.menuText}>Ubah PIN Pengamanan</Text>
                 <Ionicons name="chevron-forward" size={20} color={BORDER_LIGHT} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Pusat Bantuan", "Hubungi admin IT LaviraMeal untuk bantuan teknis.")}>
                 <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="help-buoy-outline" size={20} color={ACCENT_GREEN} />
                 </View>
                 <Text style={styles.menuText}>Bantuan & Dukungan</Text>
                 <Ionicons name="chevron-forward" size={20} color={BORDER_LIGHT} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Privasi", "Data anda dienkripsi menggunakan standar AES-256.")}>
                 <View style={[styles.menuIconBox, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={ACCENT_YELLOW} />
                 </View>
                 <Text style={styles.menuText}>Kebijakan Privasi</Text>
                 <Ionicons name="chevron-forward" size={20} color={BORDER_LIGHT} />
              </TouchableOpacity>
           </View>

           <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
              <Ionicons name="power" size={20} color={WHITE} />
              <Text style={styles.dangerBtnText}>KELUAR</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.footerApp}>
           <Text style={styles.appVer}>LaviraMeal Professional v2.5.0</Text>
           <Text style={styles.appCopy}>© 2026 PT Lavira Digital Indonesia</Text>
        </View>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
           <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                 <Text style={styles.modalTitleText}>Edit Profil</Text>
                 <TouchableOpacity onPress={() => setEditModal(false)}>
                    <Ionicons name="close-circle" size={28} color={TEXT_MUTED} />
                 </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                 <View style={styles.inputBox}>
                    <Text style={styles.inputLabelText}>NAMA LENGKAP</Text>
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder="Masukkan nama lengkap"
                      value={editedData.nama}
                      onChangeText={(txt) => setEditedData({...editedData, nama: txt})}
                    />
                 </View>
                 <View style={styles.inputBox}>
                    <Text style={styles.inputLabelText}>EMAIL AKTIF</Text>
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder="Masukkan email"
                      keyboardType="email-address"
                      value={editedData.email}
                      onChangeText={(txt) => setEditedData({...editedData, email: txt})}
                    />
                 </View>
                 <View style={styles.inputBox}>
                    <Text style={styles.inputLabelText}>JABATAN</Text>
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder="Contoh: Administrator Wilayah"
                      value={editedData.jabatan}
                      onChangeText={(txt) => setEditedData({...editedData, jabatan: txt})}
                    />
                 </View>
                 <View style={styles.inputBox}>
                    <Text style={styles.inputLabelText}>NIP / NOMOR PEGAWAI</Text>
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder="Contoh: SPPG-2026-001"
                      value={editedData.nip}
                      onChangeText={(txt) => setEditedData({...editedData, nip: txt})}
                    />
                 </View>

                 <TouchableOpacity style={styles.modalActionBtn} onPress={handleSaveProfile} disabled={loading}>
                    {loading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.modalActionBtnText}>SIMPAN PERUBAHAN</Text>}
                 </TouchableOpacity>
                 <View style={{ height: 50 }} />
              </ScrollView>
           </View>
        </View>
      </Modal>

      {/* PIN UPDATE MODAL */}
      <Modal visible={pinModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
           <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                 <Text style={styles.modalTitleText}>Update Keamanan</Text>
                 <TouchableOpacity onPress={() => setPinModal(false)}>
                    <Ionicons name="close-circle" size={28} color={TEXT_MUTED} />
                 </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                 <View style={styles.inputBox}>
                    <Text style={styles.inputLabelText}>SANDI LAMA</Text>
                    <TextInput 
                      style={styles.modalInput} 
                      secureTextEntry={!showPins} 
                      placeholder="Masukkan sandi lama"
                      value={oldPin}
                      onChangeText={setOldPin}
                    />
                 </View>
                 <View style={styles.inputBox}>
                    <Text style={styles.inputLabelText}>SANDI BARU</Text>
                    <TextInput 
                      style={styles.modalInput} 
                      secureTextEntry={!showPins} 
                      placeholder="Masukkan sandi baru"
                      value={newPin}
                      onChangeText={setNewPin}
                    />
                 </View>
                 <View style={styles.inputBox}>
                    <Text style={styles.inputLabelText}>KONFIRMASI SANDI</Text>
                    <TextInput 
                      style={styles.modalInput} 
                      secureTextEntry={!showPins} 
                      placeholder="Ulangi sandi baru"
                      value={confirmPin}
                      onChangeText={setConfirmPin}
                    />
                 </View>
                 <TouchableOpacity style={styles.showPinBtn} onPress={() => setShowPins(!showPins)}>
                    <Ionicons name={showPins ? "eye-off" : "eye"} size={16} color={BLUE_ACCENT} />
                    <Text style={styles.showPinText}>{showPins ? "Sembunyikan" : "Tampilkan"} Sandi</Text>
                 </TouchableOpacity>

                 <TouchableOpacity style={styles.modalActionBtn} onPress={handleChangePin} disabled={isChangingPin}>
                    {isChangingPin ? <ActivityIndicator color={WHITE} /> : <Text style={styles.modalActionBtnText}>SIMPAN PERUBAHAN</Text>}
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      {/* BOTTOM NAV RE-IMPLEMENTED FOR CONSISTENCY */}
      <View style={styles.bottomNav}>
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate(userData.role === 'sppg' ? 'Home' : userData.role === 'sekolah' ? 'HomeSekolah' : userData.role === 'kantin' ? 'HomeKantin' : 'HomeSiswa')}>
            <Ionicons name="home-outline" size={24} color={TEXT_MUTED} />
            <Text style={styles.navLabelText}>Beranda</Text>
         </TouchableOpacity>
         {(userData.role !== 'kantin' && userData.role !== 'siswa') && (
           <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate(userData.role === 'sppg' ? 'Sekolah' : 'ManajemenKelas')}>
              <Ionicons name={userData.role === 'sppg' ? "business-outline" : "layers-outline"} size={24} color={TEXT_MUTED} />
              <Text style={styles.navLabelText}>{userData.role === 'sppg' ? 'Sekolah' : 'Kelas'}</Text>
           </TouchableOpacity>
         )}
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate(userData.role === 'sppg' ? 'Laporan' : userData.role === 'sekolah' ? 'LaporanSekolah' : 'LaporanKantin')}>
            <Ionicons name="bar-chart-outline" size={24} color={TEXT_MUTED} />
            <Text style={styles.navLabelText}>Laporan</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.navItem}>
            <Ionicons name="person" size={24} color={BLUE_PRIMARY} />
            <Text style={[styles.navLabelText, { color: BLUE_PRIMARY, fontWeight: '900' }]}>Profil</Text>
            <View style={styles.activeDotNav} />
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  headerHero: { height: 380, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, overflow: 'hidden', elevation: 20 },
  batikHeader: { flex: 1, backgroundColor: BLUE_PRIMARY },
  safeHeader: { flex: 1, paddingHorizontal: 25 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  headerMainTitle: { color: WHITE, fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  profileSection: { alignItems: 'center', marginTop: 20 },
  avatarWrapper: { position: 'relative' },
  avatarFrame: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: BLUE_ACCENT, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: WHITE, fontSize: 44, fontWeight: 'bold' },
  editBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: BLUE_PRIMARY, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: WHITE },
  profileName: { color: WHITE, fontSize: 22, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 8, flexWrap: 'wrap' },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  premiumBadgeText: { color: WHITE, fontSize: 9, fontWeight: '900' },
  idText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 'bold' },
  editActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, gap: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  editActionText: { color: WHITE, fontSize: 9, fontWeight: '900' },

  cardWrapper: { paddingHorizontal: 25, marginTop: -50 },
  digitalIdCard: { backgroundColor: BLUE_PRIMARY, borderRadius: 30, padding: 25, elevation: 15, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 },
  idCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  idLembaga: { color: WHITE, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  idSystem: { color: BLUE_ACCENT, fontSize: 10, fontWeight: '700', marginTop: 2 },
  idDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  idDetails: { gap: 15 },
  idField: { gap: 4 },
  idLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  idValue: { color: WHITE, fontSize: 15, fontWeight: 'bold' },
  idFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, alignItems: 'flex-end' },
  footerInfo: { gap: 5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT_GREEN },
  statusText: { color: ACCENT_GREEN, fontSize: 10, fontWeight: '900' },
  watermark: { width: 50, height: 50, opacity: 0.1, position: 'absolute', right: -10, bottom: -10 },

  section: { paddingHorizontal: 25, marginTop: 35 },
  sectionHeading: { fontSize: 12, fontWeight: '900', color: TEXT_MUTED, marginBottom: 15, letterSpacing: 1 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, padding: 15, borderRadius: 20, marginBottom: 12, elevation: 2 },
  infoIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoContent: { flex: 1 },
  infoLabelText: { fontSize: 10, color: TEXT_MUTED, fontWeight: '700' },
  infoValueText: { fontSize: 14, color: TEXT_MAIN, fontWeight: '900', marginTop: 2 },

  menuContainer: { backgroundColor: WHITE, borderRadius: 25, overflow: 'hidden', elevation: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 14, color: TEXT_MAIN, fontWeight: '700' },
  menuDivider: { height: 1, backgroundColor: SOFT_BG, marginHorizontal: 20 },

  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT_RED, height: 60, borderRadius: 20, gap: 10, marginTop: 25, elevation: 5 },
  dangerBtnText: { color: WHITE, fontSize: 14, fontWeight: '900' },

  footerApp: { alignItems: 'center', marginTop: 40, gap: 5 },
  appVer: { fontSize: 11, color: BORDER_LIGHT, fontWeight: 'bold' },
  appCopy: { fontSize: 10, color: BORDER_LIGHT, fontWeight: '600' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitleText: { fontSize: 20, fontWeight: '900', color: BLUE_PRIMARY },
  modalBody: { gap: 20 },
  inputBox: { gap: 8 },
  inputLabelText: { fontSize: 10, fontWeight: '900', color: TEXT_MUTED },
  modalInput: { height: 55, backgroundColor: SOFT_BG, borderRadius: 16, paddingHorizontal: 20, fontSize: 14, fontWeight: 'bold', color: BLUE_PRIMARY, borderWidth: 1, borderColor: BORDER_LIGHT },
  showPinBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-end' },
  showPinText: { fontSize: 12, fontWeight: '700', color: BLUE_ACCENT },
  modalActionBtn: { backgroundColor: BLUE_PRIMARY, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  modalActionBtnText: { color: WHITE, fontSize: 15, fontWeight: '900' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: WHITE, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 25, borderTopLeftRadius: 40, borderTopRightRadius: 40, elevation: 50, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10 },
  navLabelText: { fontSize: 10, fontWeight: '700', color: TEXT_MUTED, marginTop: 4 },
  activeDotNav: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BLUE_PRIMARY, marginTop: 4 },
});
