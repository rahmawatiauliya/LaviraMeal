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
    nama: 'Memuat...',
    email: '',
    role: 'sppg',
    displayLembaga: 'Memuat...',
    displayJabatan: 'Memuat...',
    nip: '',
    region: 'Memuat...'
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
        setUserData(prev => ({
          ...prev,
          ...parsed,
          displayLembaga: parsed.role === 'siswa' || parsed.role === 'guru' ? (parsed.nama_sekolah || 'LAVIRA MEAL') : (parsed.nama_lembaga || 'SPPG PUSAT'),
          displayJabatan: parsed.role === 'siswa' ? `Kelas ${parsed.kelas || 'Umum'}` : (parsed.role === 'guru' ? (parsed.jabatan || 'Guru Wali Kelas') : (parsed.jabatan || 'Administrator Sistem')),
          region: parsed.kota ? `${parsed.kota}, ${parsed.provinsi}` : 'Kab. Karawang, Jawa Barat'
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
      const response = await apiClient.post('auth/update_profile.php', {
        id: userData.id,
        role: userData.role,
        sppg_id: userData.sppg_id,
        nama: editedData.nama,
        email: editedData.email,
        nama_lembaga: editedData.nama_lembaga || editedData.displayLembaga,
        jabatan: editedData.jabatan,
        nip: editedData.nip
      });

      if (response.data.status === 'success') {
        const newData = {
          ...userData,
          ...editedData,
          nama_lembaga: editedData.nama_lembaga || editedData.displayLembaga,
        };

        await AsyncStorage.setItem('user_data', JSON.stringify(newData));
        setUserData(newData);
        setEditModal(false);
        Alert.alert("Berhasil", "Data profil telah diperbarui secara permanen.");
      } else {
        Alert.alert("Gagal", response.data.message || "Gagal memperbarui profil di server.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menghubungi server untuk menyimpan perubahan.");
    } finally {
      setLoading(false);
    }
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
                      <Text style={styles.initialsTxt}>{userData.nama?.[0] || 'A'}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.editCamBadge}>
                  <Ionicons name="camera" size={12} color={WHITE} />
                </View>
              </TouchableOpacity>

              <Text style={styles.masterName}>{userData.nama}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeTxt}>
                  {userData.role === 'siswa' ? 'SISWA' : (userData.role === 'guru' ? 'GURU' : 'ADMIN PUSAT')}
                </Text>
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
                <Text style={styles.cardTag}>{userData.role === 'siswa' ? 'KARTU AKSES SISWA' : (userData.role === 'guru' ? 'KARTU AKSES GURU' : 'KARTU IDENTITAS SISTEM')}</Text>
                <Text style={styles.cardInstitution}>{userData.role === 'siswa' || userData.role === 'guru' ? (userData.nama_sekolah || 'LAVIRA MEAL') : userData.displayLembaga}</Text>
              </View>
              <View style={styles.digitalSeal}>
                <MaterialCommunityIcons name="security" size={28} color="rgba(255,255,255,0.2)" />
              </View>
            </View>

            <View style={styles.cardMainInfo}>
              <View style={styles.infoCol}>
                <View style={styles.idItemBox}>
                  <Text style={styles.idItemLabel}>{userData.role === 'siswa' ? 'NIS (NOMOR INDUK SISWA)' : (userData.role === 'guru' ? 'NIP (NOMOR INDUK PEGAWAI)' : 'IDENTIFIKASI UNIK')}</Text>
                  <Text style={styles.idItemVal}>{userData.role === 'siswa' ? (userData.nis || userData.username) : (userData.username || userData.nip || 'N/A')}</Text>
                </View>
                <View style={styles.idItemBox}>
                  <Text style={styles.idItemLabel}>{userData.role === 'siswa' ? 'KELAS' : (userData.role === 'guru' ? 'JABATAN GURU' : 'JABATAN OTORITAS')}</Text>
                  <Text style={styles.idItemVal}>{userData.role === 'siswa' ? (userData.kelas || 'Umum') : userData.displayJabatan}</Text>
                </View>
              </View>

              <View style={styles.cardBarcodeArea}>
                <View style={styles.barcodeBox}>
                  <Ionicons name="qr-code-outline" size={55} color="rgba(255,255,255,0.7)" />
                </View>
                <Text style={styles.barcodeLabel}>{userData.role === 'siswa' ? 'ID SISWA' : (userData.role === 'guru' ? 'ID GURU' : 'ID AMAN')}</Text>
              </View>
            </View>

            <View style={styles.cardBottomBar}>
              <View style={styles.validityBox}>
                <Text style={styles.idItemLabel}>AUTENTIKASI</Text>
                <View style={styles.authRow}>
                  <View style={styles.greenPulse} />
                  <Text style={styles.authStatus}>{userData.role === 'siswa' ? 'SISWA AKTIF' : 'TERVERIFIKASI PENUH'}</Text>
                </View>
              </View>
              <View style={styles.digitalSignature}>
                <Text style={styles.signatureName}>{userData.nama}</Text>
                <Text style={styles.signatureSubtitle}>{userData.role === 'siswa' ? 'IDENTITAS DIGITAL' : 'TANDA TANGAN DIGITAL'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tilesContainer}>
          <Text style={styles.sectionTitleTxt}>PENGATURAN AKUN</Text>
          <View style={styles.tilesRow}>
            <TouchableOpacity
              style={styles.premiumTile}
              onPress={() => {
                setEditedData({
                  nama: userData.nama,
                  email: userData.email,
                  jabatan: userData.displayJabatan,
                  nip: userData.nip,
                  nama_lembaga: userData.nama_lembaga || userData.displayLembaga
                });
                setEditModal(true);
              }}
            >
              <View style={[styles.tileIconBox, { backgroundColor: '#F0F9FF' }]}>
                <Feather name="user" size={20} color="#0EA5E9" />
              </View>
              <Text style={styles.tileMainTxt}>Info Pribadi</Text>
              <Text style={styles.tileSubTxt}>Update identitas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.premiumTile} onPress={() => setPinModal(true)}>
              <View style={[styles.tileIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Feather name="lock" size={20} color="#22C55E" />
              </View>
              <Text style={styles.tileMainTxt}>Akses & Sandi</Text>
              <Text style={styles.tileSubTxt}>Kode keamanan</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.tilesRow, { marginTop: 15 }]}>
            <TouchableOpacity style={styles.premiumTile} onPress={() => Alert.alert("Dukungan", "Menghubungi Lavira Helpdesk...")}>
              <View style={[styles.tileIconBox, { backgroundColor: '#F5F3FF' }]}>
                <Feather name="help-circle" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.tileMainTxt}>Pusat Bantuan</Text>
              <Text style={styles.tileSubTxt}>Tiket dukungan</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.premiumTile} onPress={() => Alert.alert("Privasi", "Enkripsi end-to-end aktif.")}>
              <View style={[styles.tileIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Feather name="shield" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.tileMainTxt}>Kebijakan Privasi</Text>
              <Text style={styles.tileSubTxt}>Legal & Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailListSection}>
          <Text style={styles.sectionTitleTxt}>SPESIFIKASI INTI</Text>
          <View style={styles.infoHub}>
            <View style={styles.infoHubItem}>
              <View style={styles.hubIcon}>
                <Feather name={userData.role === 'siswa' ? 'book' : (userData.role === 'guru' ? 'briefcase' : 'mail')} size={18} color={TEXT_MUTED} />
              </View>
              <View style={styles.hubContent}>
                <Text style={styles.hubLabel}>{userData.role === 'siswa' ? 'KELAS SISWA' : (userData.role === 'guru' ? 'JABATAN GURU' : 'EMAIL KONTAK')}</Text>
                <Text style={styles.hubVal}>{userData.role === 'siswa' ? (userData.kelas || 'Umum') : (userData.role === 'guru' ? userData.displayJabatan : (userData.email || 'N/A'))}</Text>
              </View>
            </View>
            <View style={styles.hubDivider} />
            <View style={styles.infoHubItem}>
              <View style={styles.hubIcon}>
                <Feather name={userData.role === 'siswa' || userData.role === 'guru' ? 'hash' : 'map-pin'} size={18} color={TEXT_MUTED} />
              </View>
              <View style={styles.hubContent}>
                <Text style={styles.hubLabel}>{userData.role === 'siswa' ? 'NOMOR INDUK SISWA (NIS)' : (userData.role === 'guru' ? 'NOMOR INDUK PEGAWAI (NIP)' : 'WILAYAH GEOGRAFIS')}</Text>
                <Text style={styles.hubVal}>{userData.role === 'siswa' || userData.role === 'guru' ? (userData.nis || userData.nip || userData.username) : userData.region}</Text>
              </View>
            </View>
            <View style={styles.hubDivider} />
            <View style={styles.infoHubItem}>
              <View style={styles.hubIcon}>
                <Feather name={userData.role === 'siswa' || userData.role === 'guru' ? 'home' : 'database'} size={18} color={TEXT_MUTED} />
              </View>
              <View style={styles.hubContent}>
                <Text style={styles.hubLabel}>{userData.role === 'siswa' || userData.role === 'guru' ? 'SEKOLAH ASAL' : 'ID SISTEM GLOBAL'}</Text>
                <Text style={styles.hubVal}>{userData.role === 'siswa' || userData.role === 'guru' ? (userData.nama_sekolah || 'LAVIRA MEAL') : (userData.id || 'N/A')}</Text>
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
                <Text style={styles.sheetSubTxt}>{userData.role === 'siswa' ? 'Perbarui spesifikasi profil Siswa' : (userData.role === 'guru' ? 'Perbarui spesifikasi profil Guru' : 'Perbarui spesifikasi profil SPPG')}</Text>
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

              <View style={[styles.formItem, (userData.role === 'siswa' || userData.role === 'guru') && { display: 'none' }]}>
                <Text style={styles.formItemLabel}>NAMA LEMBAGA</Text>
                <View style={styles.formInputWrap}>
                  <Feather name="home" size={18} color={TEXT_MUTED} />
                  <TextInput
                    style={styles.formTextInput}
                    value={editedData.nama_lembaga}
                    onChangeText={(txt) => setEditedData({ ...editedData, nama_lembaga: txt })}
                  />
                </View>
              </View>

              <View style={[styles.formItem, (userData.role === 'siswa' || userData.role === 'guru') && { display: 'none' }]}>
                <Text style={styles.formItemLabel}>JABATAN</Text>
                <View style={styles.formInputWrap}>
                  <Feather name="briefcase" size={18} color={TEXT_MUTED} />
                  <TextInput
                    style={styles.formTextInput}
                    value={editedData.jabatan}
                    onChangeText={(txt) => setEditedData({ ...editedData, jabatan: txt })}
                  />
                </View>
              </View>

              <View style={[styles.formItem, (userData.role === 'siswa' || userData.role === 'guru') && { display: 'none' }]}>
                <Text style={styles.formItemLabel}>ID PEGAWAI / NIP</Text>
                <View style={styles.formInputWrap}>
                  <Feather name="hash" size={18} color={TEXT_MUTED} />
                  <TextInput
                    style={styles.formTextInput}
                    value={editedData.nip}
                    onChangeText={(txt) => setEditedData({ ...editedData, nip: txt })}
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
                <Text style={styles.sheetTitleTxt}>Akses Keamanan</Text>
                <Text style={styles.sheetSubTxt}>Perbarui kata sandi sistem Anda</Text>
              </View>
              <TouchableOpacity onPress={() => setPinModal(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetFormScroll}>
              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>KATA SANDI SAAT INI</Text>
                <TextInput
                  style={styles.minimalistInput}
                  secureTextEntry={!showPins}
                  value={oldPin}
                  onChangeText={setOldPin}
                  placeholder="Sandi Saat Ini"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>KATA SANDI BARU (MIN 8 KARAKTER)</Text>
                <TextInput
                  style={styles.minimalistInput}
                  secureTextEntry={!showPins}
                  value={newPin}
                  onChangeText={setNewPin}
                  placeholder="Minimal 8 Karakter"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>KONFIRMASI KATA SANDI BARU</Text>
                <TextInput
                  style={styles.minimalistInput}
                  secureTextEntry={!showPins}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  placeholder="Ulangi Sandi Baru"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity style={styles.togglePinLink} onPress={() => setShowPins(!showPins)}>
                <Text style={styles.togglePinLinkTxt}>{showPins ? "Sembunyikan" : "Tampilkan"} Sandi</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitIdentityBtn} onPress={handleChangePin} disabled={isChangingPin}>
                {isChangingPin ? <ActivityIndicator color={WHITE} /> : <Text style={styles.submitIdentityTxt}>PERBARUI KATA SANDI SISTEM</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <View style={styles.bottomNavInner}>
          {userData.role === 'siswa' || userData.role === 'guru' ? (
            <>
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeSiswa')}>
                <Ionicons name="grid-outline" size={24} color={TEXT_MUTED} />
                <Text style={styles.navLabel}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('RiwayatSiswa')}>
                <Ionicons name="receipt-outline" size={24} color={TEXT_MUTED} />
                <Text style={styles.navLabel}>Riwayat</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navItem}>
                <Ionicons name="person" size={24} color={BLUE_PRIMARY} />
                <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Profil</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
                <Ionicons name="grid-outline" size={24} color={TEXT_MUTED} />
                <Text style={styles.navLabel}>Beranda</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Sekolah')}>
                <Ionicons name="business-outline" size={24} color={TEXT_MUTED} />
                <Text style={styles.navLabel}>Sekolah</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Laporan')}>
                <Ionicons name="bar-chart-outline" size={24} color={TEXT_MUTED} />
                <Text style={styles.navLabel}>Laporan</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navItem}>
                <Ionicons name="person" size={24} color={BLUE_PRIMARY} />
                <Text style={[styles.navLabel, { color: BLUE_PRIMARY }]}>Profil</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  heroSection: { height: 300, backgroundColor: BLUE_PRIMARY, borderBottomLeftRadius: 45, borderBottomRightRadius: 45, overflow: 'hidden', marginTop: -1 },
  heroBatik: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileMaster: { alignItems: 'center' },
  mainAvatarWrap: { position: 'relative' },
  avatarGlow: { position: 'absolute', top: -10, left: -10, right: -10, bottom: -10, borderRadius: 60, backgroundColor: 'rgba(56, 189, 248, 0.15)' },
  avatarBorder: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  initialsBox: { width: '100%', height: '100%', backgroundColor: BLUE_ACCENT, justifyContent: 'center', alignItems: 'center' },
  initialsTxt: { color: WHITE, fontSize: 42, fontWeight: '900' },
  editCamBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: BLUE_PRIMARY, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: BLUE_PRIMARY },
  masterName: { color: WHITE, fontSize: 24, fontWeight: '900', marginTop: 15 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, marginTop: 8 },
  roleBadgeTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  idCardWrapper: { paddingHorizontal: 25, marginTop: -35 },
  premiumCard: { backgroundColor: '#1C2C5B', borderRadius: 35, padding: 25, elevation: 30, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, overflow: 'hidden' },
  cardPattern: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.02)', opacity: 0.1 },
  cardAura: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(56, 189, 248, 0.05)' },
  cardHeaderArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTag: { color: BLUE_ACCENT, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
  cardInstitution: { color: WHITE, fontSize: 18, fontWeight: 'bold' },
  digitalSeal: { opacity: 0.6 },
  cardMainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25 },
  infoCol: { flex: 1 },
  idItemBox: { marginBottom: 15 },
  idItemLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 7, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  idItemVal: { color: WHITE, fontSize: 14, fontWeight: 'bold' },
  cardBarcodeArea: { alignItems: 'center' },
  barcodeBox: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, marginBottom: 5 },
  barcodeLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 6, fontWeight: '900', letterSpacing: 1 },
  cardBottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  authRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  greenPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT_GREEN },
  authStatus: { color: ACCENT_GREEN, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginLeft: 5 },
  digitalSignature: { alignItems: 'flex-end', flex: 1 },
  signatureName: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 'bold', fontStyle: 'italic', textAlign: 'right' },
  signatureSubtitle: { color: 'rgba(255,255,255,0.2)', fontSize: 7, fontWeight: '900', letterSpacing: 1, marginTop: 2 },

  tilesContainer: { paddingHorizontal: 25, marginTop: 35 },
  sectionTitleTxt: { color: TEXT_MUTED, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20 },
  tilesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  premiumTile: { width: '48%', backgroundColor: WHITE, borderRadius: 28, padding: 22, borderWidth: 1, borderColor: BORDER_LIGHT, elevation: 2 },
  tileIconBox: { width: 45, height: 45, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  tileMainTxt: { color: TEXT_MAIN, fontSize: 15, fontWeight: 'bold' },
  tileSubTxt: { color: TEXT_MUTED, fontSize: 11, marginTop: 2 },

  detailListSection: { paddingHorizontal: 25, marginTop: 35 },
  infoHub: { backgroundColor: WHITE, borderRadius: 30, padding: 25, borderWidth: 1, borderColor: BORDER_LIGHT },
  infoHubItem: { flexDirection: 'row', alignItems: 'center' },
  hubIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: SOFT_BG, justifyContent: 'center', alignItems: 'center' },
  hubContent: { marginLeft: 15 },
  hubLabel: { color: TEXT_MUTED, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  hubVal: { color: TEXT_MAIN, fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  hubDivider: { height: 1, backgroundColor: BORDER_LIGHT, marginVertical: 20, marginHorizontal: 10 },

  exitActionBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginTop: 40, backgroundColor: ACCENT_RED, paddingHorizontal: 25, paddingVertical: 15, borderRadius: 20 },
  exitActionTxt: { color: WHITE, fontSize: 12, fontWeight: '900', marginLeft: 10, letterSpacing: 1 },
  brandingFooter: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
  footerLogo: { width: 40, height: 40, marginBottom: 15 },
  footerVerTxt: { color: TEXT_MAIN, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  footerCopyTxt: { color: TEXT_MUTED, fontSize: 9, marginTop: 5 },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(11, 30, 63, 0.7)', justifyContent: 'flex-end' },
  sheetMain: { backgroundColor: WHITE, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 25, maxHeight: '85%' },
  sheetDragger: { width: 40, height: 5, borderRadius: 3, backgroundColor: BORDER_LIGHT, alignSelf: 'center', marginVertical: 15 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  sheetTitleTxt: { color: TEXT_MAIN, fontSize: 20, fontWeight: 'bold' },
  sheetSubTxt: { color: TEXT_MUTED, fontSize: 13, marginTop: 2 },
  sheetFormScroll: { paddingBottom: 40 },
  formItem: { marginBottom: 20 },
  formItemLabel: { color: TEXT_MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  formInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: SOFT_BG, borderRadius: 20, paddingHorizontal: 15, height: 60, borderWidth: 1, borderColor: BORDER_LIGHT },
  formTextInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: 'bold', color: BLUE_PRIMARY },
  submitIdentityBtn: { backgroundColor: BLUE_PRIMARY, height: 65, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 20, elevation: 8 },
  submitIdentityTxt: { color: WHITE, fontSize: 15, fontWeight: '900', letterSpacing: 1 },

  minimalistInput: { height: 60, backgroundColor: SOFT_BG, borderRadius: 20, paddingHorizontal: 20, fontSize: 16, fontWeight: '600', color: BLUE_PRIMARY, borderWidth: 1, borderColor: BORDER_LIGHT, textAlign: 'center' },
  togglePinLink: { alignSelf: 'center', marginTop: 5, marginBottom: 20 },
  togglePinLinkTxt: { color: BLUE_ACCENT, fontSize: 12, fontWeight: 'bold' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: WHITE, height: 90, borderTopWidth: 1, borderTopColor: BORDER_LIGHT, paddingBottom: 25 },
  bottomNavInner: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center' },
  navLabel: { fontSize: 10, fontWeight: 'bold', color: TEXT_MUTED, marginTop: 4 }
});
