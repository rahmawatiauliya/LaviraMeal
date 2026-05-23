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
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../api/client';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';

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

export default function ProfilGuruScreen({ navigation }) {
   const { width } = useWindowDimensions();
   const [loading, setLoading] = useState(false);
   const [userData, setUserData] = useState({
      nama: 'Memuat...',
      email: '',
      role: 'guru',
      displayLembaga: 'Memuat...',
      displayJabatan: 'Memuat...',
      nip: '',
   });

   const [profileImage, setProfileImage] = useState(null);
   const [editModal, setEditModal] = useState(false);
   const [pinModal, setPinModal] = useState(false);
   const [oldPin, setOldPin] = useState('');
   const [newPin, setNewPin] = useState('');
   const [confirmPin, setConfirmPin] = useState('');
   const [isChangingPin, setIsChangingPin] = useState(false);
   const [showPins, setShowPins] = useState(false);
   const [editedData, setEditedData] = useState({});

   useFocusEffect(
      React.useCallback(() => {
         loadUserData();
         AsyncStorage.getItem('@profile_image').then(img => img && setProfileImage(img));
      }, [])
   );

   const loadUserData = async () => {
      try {
         const dataStr = await AsyncStorage.getItem('user_data');
         if (dataStr) {
            const parsed = JSON.parse(dataStr);
            setUserData({
               ...parsed,
               displayLembaga: parsed.nama_sekolah || 'LAVIRA MEAL',
               displayJabatan: parsed.jabatan || 'Guru Wali Kelas',
            });
            setEditedData(parsed);

            // Fetch real-time data from PHP API
            const response = await apiClient.get(`guru/guru_get_stats.php?user_id=${parsed.id}`);
            if (response.data && response.data.status === 'success') {
               const liveGuru = response.data.data.guru;
               const updated = {
                  ...parsed,
                  nama: liveGuru.nama,
                  nip: liveGuru.nip,
                  mata_pelajaran: liveGuru.mata_pelajaran,
                  kelas_wali: liveGuru.kelas_wali,
                  no_telp: liveGuru.no_telp,
                  nama_sekolah: liveGuru.nama_sekolah,
                  displayLembaga: liveGuru.nama_sekolah || 'LAVIRA MEAL',
                  displayJabatan: liveGuru.mata_pelajaran ? `Guru ${liveGuru.mata_pelajaran}` : 'Guru Wali Kelas',
               };
               setUserData(updated);
               setEditedData(updated);
               await AsyncStorage.setItem('user_data', JSON.stringify(updated));
            }
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

   const handleSaveProfile = async () => {
      if (!editedData.nama) {
         Alert.alert("Error", "Nama lengkap tidak boleh kosong.");
         return;
      }

      setLoading(true);
      try {
         const response = await apiClient.post('auth/update_profile.php', {
            id: userData.id,
            role: 'guru',
            nama: editedData.nama,
            email: editedData.email,
            no_telp: editedData.no_telp
         });

         if (response.data.status === 'success') {
            const updated = {
               ...userData,
               nama: editedData.nama,
               email: editedData.email,
               no_telp: editedData.no_telp
            };
            await AsyncStorage.setItem('user_data', JSON.stringify(updated));
            setUserData(updated);
            setEditModal(false);
            Alert.alert("Sukses", "Profil berhasil diperbarui.");
         } else {
            Alert.alert("Gagal", response.data.message || "Gagal memperbarui profil.");
         }
      } catch (error) {
         console.error(error);
         Alert.alert("Error", "Terjadi kesalahan koneksi server.");
      } finally {
         setLoading(false);
      }
   };

   const handleChangePin = async () => {
      if (!oldPin || !newPin || !confirmPin) {
         Alert.alert("Gagal", "Silakan lengkapi semua data kata sandi.");
         return;
      }
      if (newPin.length < 8) {
         Alert.alert("Gagal", "Sandi baru minimal harus 8 karakter.");
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
            Alert.alert("Berhasil", "Kata sandi Anda telah diperbarui.");
            setPinModal(false);
            setOldPin(''); setNewPin(''); setConfirmPin('');
         } else {
            Alert.alert("Gagal", response.data.message || "Sandi lama tidak valid.");
         }
      } catch (error) {
         Alert.alert("Kesalahan", "Gagal menghubungi server.");
      } finally {
         setIsChangingPin(false);
      }
   };

   const handleLogout = () => {
      Alert.alert("Konfirmasi", "Apakah Anda yakin ingin keluar?", [
         { text: "Batal", style: "cancel" },
         {
            text: "Keluar",
            style: 'destructive',
            onPress: async () => {
               await AsyncStorage.clear();
               navigation.replace('Login');
            }
         }
      ]);
   };

   return (
      <View style={styles.container}>
         <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

         <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150 }}
         >
            <View style={styles.heroSection}>
               <ImageBackground
                  source={require('../../../../assets/batik_cirebon.png')}
                  style={styles.heroBatik}
                  imageStyle={{ opacity: 0.04, resizeMode: 'repeat' }}
               >
                  <View style={styles.profileMaster}>
                     <TouchableOpacity style={styles.mainAvatarWrap} onPress={pickImage}>
                        <View style={styles.avatarGlow} />
                        <View style={styles.avatarBorder}>
                           {profileImage ? (
                              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                           ) : (
                              <View style={styles.initialsBox}>
                                 <Text style={styles.initialsTxt}>{userData.nama?.[0] || 'G'}</Text>
                              </View>
                           )}
                        </View>
                        <View style={styles.editCamBadge}>
                           <Ionicons name="camera" size={12} color={WHITE} />
                        </View>
                     </TouchableOpacity>

                     <Text style={styles.masterName}>{userData.nama}</Text>
                     <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeTxt}>GURU</Text>
                     </View>
                  </View>
               </ImageBackground>
            </View>

            <View style={styles.idCardWrapper}>
               <View style={styles.premiumCard}>
                  <View style={styles.cardPattern} />
                  <View style={styles.cardAura} />

                  <View style={styles.cardHeaderArea}>
                     <View>
                        <Text style={styles.cardTag}>KARTU AKSES GURU</Text>
                        <Text style={styles.cardInstitution}>{userData.displayLembaga}</Text>
                     </View>
                     <View style={styles.digitalSeal}>
                        <MaterialCommunityIcons name="security" size={28} color="rgba(255,255,255,0.2)" />
                     </View>
                  </View>

                  <View style={styles.cardMainInfo}>
                     <View style={styles.infoColGrid}>
                        <View style={styles.gridRow}>
                           <View style={styles.gridCol}>
                              <Text style={styles.idItemLabel}>NIP</Text>
                              <Text style={styles.idItemVal} numberOfLines={1}>{userData.nip || userData.username || "N/A"}</Text>
                           </View>
                           <View style={styles.gridCol}>
                              <Text style={styles.idItemLabel}>MAPEL</Text>
                              <Text style={styles.idItemVal} numberOfLines={1}>{userData.mata_pelajaran || "Umum"}</Text>
                           </View>
                        </View>
                        <View style={styles.gridRow}>
                           <View style={styles.gridCol}>
                              <Text style={styles.idItemLabel}>WALI KELAS</Text>
                              <Text style={styles.idItemVal} numberOfLines={1}>{userData.kelas_wali || "-"}</Text>
                           </View>
                           <View style={styles.gridCol}>
                              <Text style={styles.idItemLabel}>SEKOLAH</Text>
                              <Text style={styles.idItemVal} numberOfLines={1}>{userData.nama_sekolah || "LAVIRA MEAL"}</Text>
                           </View>
                        </View>
                     </View>
                  </View>

                  <View style={styles.cardBottomBar}>
                     <View style={styles.validityBox}>
                        <Text style={styles.idItemLabel}>AUTENTIKASI</Text>
                        <View style={styles.authRow}>
                           <Ionicons name="checkmark-circle" size={14} color={ACCENT_GREEN} />
                           <Text style={styles.authStatusTxt}>PEGAWAI AKTIF</Text>
                        </View>
                     </View>
                     <View style={styles.cardLogoArea}>
                        <Text style={styles.cardLogoTxt}>Lavira<Text style={{ fontWeight: '300' }}>Meal</Text></Text>
                     </View>
                  </View>
               </View>
            </View>

            <View style={styles.quickActionsContainer}>
               <Text style={styles.sectionTitleTxt}>PENGATURAN AKUN</Text>
               <View style={styles.actionGrid}>
                  <TouchableOpacity style={styles.actionCard} onPress={() => setEditModal(true)}>
                     <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                        <Feather name="edit-3" size={20} color="#3B82F6" />
                     </View>
                     <Text style={styles.actionLabel}>Ubah Profil</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionCard} onPress={() => setPinModal(true)}>
                     <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
                        <Feather name="lock" size={20} color="#D97706" />
                     </View>
                     <Text style={styles.actionLabel}>Sandi Akun</Text>
                  </TouchableOpacity>
               </View>
            </View>




            <View style={styles.detailListSection}>
               <Text style={styles.sectionTitleTxt}>HUB KONTAK & AKUN</Text>
               <View style={styles.infoHub}>
                  <View style={styles.infoHubItem}>
                     <View style={styles.hubIcon}>
                        <Feather name="mail" size={18} color={TEXT_MUTED} />
                     </View>
                     <View style={styles.hubContent}>
                        <Text style={styles.hubLabel}>ALAMAT EMAIL RESMI</Text>
                        <Text style={styles.hubVal}>{userData.email || "belum_diatur@lavirameal.id"}</Text>
                     </View>
                  </View>
                  <View style={styles.hubDivider} />
                  <View style={styles.infoHubItem}>
                     <View style={styles.hubIcon}>
                        <Feather name="phone" size={18} color={TEXT_MUTED} />
                     </View>
                     <View style={styles.hubContent}>
                        <Text style={styles.hubLabel}>NOMOR TELEPON AKTIF</Text>
                        <Text style={styles.hubVal}>{userData.no_telp || "belum diatur"}</Text>
                     </View>
                  </View>
                  <View style={styles.hubDivider} />
                  <View style={styles.infoHubItem}>
                     <View style={styles.hubIcon}>
                        <Feather name="shield" size={18} color={TEXT_MUTED} />
                     </View>
                     <View style={styles.hubContent}>
                        <Text style={styles.hubLabel}>HAK AKSES / PERAN</Text>
                        <Text style={styles.hubVal}>GURU UTAMA (PEMBINA)</Text>
                     </View>
                  </View>
               </View>
            </View>

            <TouchableOpacity style={styles.exitActionBtn} onPress={handleLogout}>
               <Feather name="power" size={18} color={WHITE} />
               <Text style={styles.exitActionTxt}>Keluar</Text>
            </TouchableOpacity>

            <View style={styles.brandingFooter}>
               <Image
                  source={require('../../../../assets/icon.png')}
                  style={styles.footerLogo}
                  resizeMode="contain"
               />
               <Text style={styles.footerVerTxt}>LaviraMeal Enterprise v2.5.0</Text>
               <Text style={styles.footerCopyTxt}>© 2026 PT Lavira Digital Indonesia</Text>
            </View>
         </ScrollView>

         <Modal visible={editModal} transparent animationType="slide">
            <View style={styles.sheetOverlay}>
               <View style={styles.sheetMain}>
                  <View style={styles.sheetDragger} />
                  <View style={styles.sheetHead}>
                     <View>
                        <Text style={styles.sheetTitleTxt}>Ubah Identitas</Text>
                        <Text style={styles.sheetSubTxt}>Perbarui spesifikasi profil Guru</Text>
                     </View>
                     <TouchableOpacity onPress={() => setEditModal(false)} style={styles.sheetCloseBtn}>
                        <Ionicons name="close" size={22} color={TEXT_MUTED} />
                     </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.sheetFormScroll} showsVerticalScrollIndicator={false}>
                     <View style={styles.formItem}>
                        <Text style={styles.formItemLabel}>NAMA LENGKAP</Text>
                        <View style={styles.formInputWrap}>
                           <Feather name="user" size={18} color={TEXT_MUTED} />
                           <TextInput
                              style={styles.formTextInput}
                              value={editedData.nama}
                              onChangeText={(txt) => setEditedData({ ...editedData, nama: txt })}
                           />
                        </View>
                     </View>

                     <View style={styles.formItem}>
                        <Text style={styles.formItemLabel}>ALAMAT EMAIL</Text>
                        <View style={styles.formInputWrap}>
                           <Feather name="mail" size={18} color={TEXT_MUTED} />
                           <TextInput
                              style={styles.formTextInput}
                              value={editedData.email}
                              onChangeText={(txt) => setEditedData({ ...editedData, email: txt })}
                              keyboardType="email-address"
                           />
                        </View>
                     </View>

                     <View style={styles.formItem}>
                        <Text style={styles.formItemLabel}>NOMOR TELEPON</Text>
                        <View style={styles.formInputWrap}>
                           <Feather name="phone" size={18} color={TEXT_MUTED} />
                           <TextInput
                              style={styles.formTextInput}
                              value={editedData.no_telp}
                              onChangeText={(txt) => setEditedData({ ...editedData, no_telp: txt })}
                              keyboardType="phone-pad"
                           />
                        </View>
                     </View>

                     <TouchableOpacity style={styles.submitIdentityBtn} onPress={handleSaveProfile} disabled={loading}>
                        {loading ? <ActivityIndicator color={WHITE} /> : (
                           <Text style={styles.submitIdentityTxt}>SIMPAN PERUBAHAN</Text>
                        )}
                     </TouchableOpacity>
                     <View style={{ height: 40 }} />
                  </ScrollView>
               </View>
            </View>
         </Modal>


         <Modal visible={pinModal} transparent animationType="slide">
            <View style={styles.sheetOverlay}>
               <View style={styles.sheetMain}>
                  <View style={styles.sheetDragger} />
                  <View style={styles.sheetHead}>
                     <View>
                        <Text style={styles.sheetTitleTxt}>Ubah Kata Sandi</Text>
                        <Text style={styles.sheetSubTxt}>Perbarui kata sandi akun Anda</Text>
                     </View>
                     <TouchableOpacity onPress={() => { setPinModal(false); setOldPin(''); setNewPin(''); setConfirmPin(''); }} style={styles.sheetCloseBtn}>
                        <Ionicons name="close" size={22} color={TEXT_MUTED} />
                     </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.sheetFormScroll} showsVerticalScrollIndicator={false}>
                     <View style={styles.formItem}>
                        <Text style={styles.formItemLabel}>KATA SANDI SEKARANG</Text>
                        <View style={styles.formInputWrap}>
                           <Feather name="lock" size={18} color={TEXT_MUTED} />
                           <TextInput
                              style={styles.formTextInput}
                              value={oldPin}
                              onChangeText={setOldPin}
                              placeholder="Masukkan sandi saat ini"
                              secureTextEntry={!showPins}
                              autoCapitalize="none"
                           />
                        </View>
                     </View>

                     <View style={styles.formItem}>
                        <Text style={styles.formItemLabel}>KATA SANDI BARU (MIN 8 KARAKTER)</Text>
                        <View style={styles.formInputWrap}>
                           <Feather name="shield" size={18} color={TEXT_MUTED} />
                           <TextInput
                              style={styles.formTextInput}
                              value={newPin}
                              onChangeText={setNewPin}
                              placeholder="Minimal 8 Karakter"
                              secureTextEntry={!showPins}
                              autoCapitalize="none"
                           />
                        </View>
                     </View>

                     <View style={styles.formItem}>
                        <Text style={styles.formItemLabel}>KONFIRMASI KATA SANDI BARU</Text>
                        <View style={styles.formInputWrap}>
                           <Feather name="shield" size={18} color={TEXT_MUTED} />
                           <TextInput
                              style={styles.formTextInput}
                              value={confirmPin}
                              onChangeText={setConfirmPin}
                              placeholder="Ulangi sandi baru"
                              secureTextEntry={!showPins}
                              autoCapitalize="none"
                           />
                        </View>
                     </View>

                     <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 20 }} onPress={() => setShowPins(!showPins)}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: BLUE_PRIMARY }}>{showPins ? "Sembunyikan" : "Tampilkan"} Sandi</Text>
                     </TouchableOpacity>

                     <TouchableOpacity style={styles.submitIdentityBtn} onPress={handleChangePin} disabled={isChangingPin}>
                        {isChangingPin ? <ActivityIndicator color={WHITE} /> : (
                           <Text style={styles.submitIdentityTxt}>PERBARUI KATA SANDI</Text>
                        )}
                     </TouchableOpacity>
                     <View style={{ height: 40 }} />
                  </ScrollView>
               </View>
            </View>
         </Modal>

         <View style={styles.bottomNav}>
            <View style={styles.bottomNavInner}>
               <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeGuru')}>
                  <Ionicons name="grid-outline" size={24} color={TEXT_MUTED} />
                  <Text style={styles.navLabel}>Home</Text>
               </TouchableOpacity>

               <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('RiwayatGuru')}>
                  <Ionicons name="receipt-outline" size={24} color={TEXT_MUTED} />
                  <Text style={styles.navLabel}>Riwayat</Text>
               </TouchableOpacity>

               <TouchableOpacity style={styles.navItem}>
                  <Ionicons name="person" size={24} color={BLUE_PRIMARY} />
                  <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Profil</Text>
               </TouchableOpacity>
            </View>
         </View>
      </View>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: SOFT_BG },
   heroSection: { height: 260, backgroundColor: BLUE_PRIMARY, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, overflow: 'hidden', elevation: 15 },
   heroBatik: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   profileMaster: { alignItems: 'center', marginTop: 40 },
   mainAvatarWrap: { position: 'relative', width: 90, height: 90, marginBottom: 12 },
   avatarGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: BLUE_ACCENT, borderRadius: 30, opacity: 0.15, transform: [{ scale: 1.1 }] },
   avatarBorder: { flex: 1, borderRadius: 28, borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)', overflow: 'hidden', backgroundColor: '#F1F5F9' },
   avatarImage: { width: '100%', height: '100%' },
   initialsBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BLUE_PRIMARY },
   initialsTxt: { fontSize: 34, fontWeight: 'bold', color: WHITE },
   editCamBadge: { position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: BLUE_ACCENT, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: BLUE_PRIMARY, elevation: 3 },
   masterName: { fontSize: 20, fontWeight: 'bold', color: WHITE, textShadowColor: 'rgba(0,0,0,0.15)', textShadowRadius: 4 },
   roleBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   roleBadgeTxt: { fontSize: 10, fontWeight: 'bold', color: WHITE, letterSpacing: 2 },

   idCardWrapper: { paddingHorizontal: 25, marginTop: -35 },
   premiumCard: { height: 200, backgroundColor: '#0f172a', borderRadius: 30, padding: 22, overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, position: 'relative' },
   cardPattern: { ...StyleSheet.absoluteFillObject, opacity: 0.05, resizeMode: 'cover' },
   cardAura: { position: 'absolute', top: -100, right: -100, width: 250, height: 250, borderRadius: 125, backgroundColor: BLUE_ACCENT, opacity: 0.15, filter: 'blur(30px)' },
   cardHeaderArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 12 },
   cardTag: { fontSize: 9, fontWeight: '900', color: BLUE_ACCENT, letterSpacing: 1.5, textTransform: 'uppercase' },
   cardInstitution: { fontSize: 14, fontWeight: 'bold', color: WHITE, marginTop: 2 },
   digitalSeal: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
   cardMainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
   infoCol: { flex: 1, gap: 10 },
   idItemBox: { gap: 2 },
   idItemLabel: { fontSize: 8, fontWeight: '800', color: TEXT_MUTED, letterSpacing: 1 },
   idItemVal: { fontSize: 13, fontWeight: 'bold', color: WHITE },
   cardBarcodeArea: { alignItems: 'center', gap: 6 },
   barcodeBox: { width: 68, height: 68, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   barcodeLabel: { fontSize: 8, fontWeight: '800', color: BLUE_ACCENT, letterSpacing: 1 },
   cardBottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12 },
   validityBox: { gap: 2 },
   authRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
   authStatusTxt: { fontSize: 9, fontWeight: '900', color: ACCENT_GREEN },
   cardLogoArea: { alignSelf: 'flex-end' },
   cardLogoTxt: { fontSize: 14, fontWeight: '900', color: WHITE, letterSpacing: 0.5 },

   quickActionsContainer: { paddingHorizontal: 25, marginTop: 25 },
   sectionTitleTxt: { fontSize: 12, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 1.5, marginBottom: 12 },
   actionGrid: { flexDirection: 'row', gap: 15 },
   actionCard: { flex: 1, backgroundColor: WHITE, padding: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
   actionIconBox: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
   actionLabel: { fontSize: 13, fontWeight: '700', color: TEXT_MAIN },

   detailListSection: { paddingHorizontal: 25, marginTop: 25 },
   infoHub: { backgroundColor: WHITE, borderRadius: 28, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
   infoHubItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 },
   hubIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: SOFT_BG, justifyContent: 'center', alignItems: 'center' },
   hubContent: { gap: 2 },
   hubLabel: { fontSize: 9, fontWeight: '800', color: TEXT_MUTED, letterSpacing: 1 },
   hubVal: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
   hubDivider: { height: 1, backgroundColor: BORDER_LIGHT, marginVertical: 12 },

   exitActionBtn: { marginHorizontal: 25, marginTop: 30, height: 56, borderRadius: 20, backgroundColor: ACCENT_RED, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 8, shadowColor: ACCENT_RED, shadowOpacity: 0.25, shadowRadius: 10 },
   exitActionTxt: { color: WHITE, fontSize: 15, fontWeight: 'bold' },
   brandingFooter: { alignItems: 'center', marginVertical: 35, gap: 6 },
   footerLogo: { width: 34, height: 34, opacity: 0.7 },
   footerVerTxt: { fontSize: 11, fontWeight: 'bold', color: TEXT_MAIN },
   footerCopyTxt: { fontSize: 9, fontWeight: '600', color: TEXT_MUTED },

   sheetOverlay: { flex: 1, backgroundColor: 'rgba(11, 30, 63, 0.5)', justifyContent: 'flex-end' },
   sheetMain: { backgroundColor: WHITE, borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, minHeight: 300, elevation: 25 },
   sheetDragger: { width: 40, height: 5, backgroundColor: BORDER_LIGHT, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
   sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
   sheetTitleTxt: { fontSize: 18, fontWeight: '900', color: TEXT_MAIN },
   sheetSubTxt: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
   sheetCloseBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: SOFT_BG, justifyContent: 'center', alignItems: 'center' },
   sheetFormScroll: { maxHeight: 400 },
   formItem: { marginBottom: 20 },
   formItemLabel: { fontSize: 10, fontWeight: '800', color: TEXT_MUTED, letterSpacing: 1.5, marginBottom: 8 },
   formInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER_LIGHT, borderRadius: 18, paddingHorizontal: 15, height: 54, gap: 12 },
   formTextInput: { flex: 1, fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
   submitIdentityBtn: { backgroundColor: BLUE_PRIMARY, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 8, shadowColor: BLUE_PRIMARY, shadowOpacity: 0.2 },
   submitIdentityTxt: { color: WHITE, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

   bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: WHITE, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 40, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
   bottomNavInner: { flex: 1, flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
   navItem: { flex: 1, alignItems: 'center', gap: 4 },
   navLabel: { fontSize: 10, fontWeight: 'bold', color: TEXT_MUTED },
   infoColGrid: { flex: 1, gap: 10, marginRight: 15 },
   gridRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
   gridCol: { flex: 1, gap: 1 }
});
