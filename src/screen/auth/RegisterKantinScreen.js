import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  StatusBar, SafeAreaView, Alert, ActivityIndicator, Image, 
  Dimensions, KeyboardAvoidingView, Platform, Modal, FlatList
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../api/client';

const { width } = Dimensions.get('window');

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_ACCENT = '#38BDF8';
const GOLD = '#F59E0B';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';
const TEXT_MAIN = '#1E293B';
const TEXT_MUTED = '#64748B';
const BORDER_LIGHT = '#E2E8F0';
const ACCENT_GREEN = '#10B981';

export default function RegisterKantinScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama_pemilik: '',
    email_pemilik: '',
    nama_kantin: '',
    wilayah_id: '',
    wilayah_nama: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [fotoKantin, setFotoKantin] = useState(null);
  const [fotoMenu, setFotoMenu] = useState(null);
  const [wilayahModal, setWilayahModal] = useState(false);
  const [pickerModal, setPickerModal] = useState({ visible: false, type: '' });
  const [wilayahList, setWilayahList] = useState([]);
  const [loadingWilayah, setLoadingWilayah] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    fetchWilayah();
  }, []);

  const fetchWilayah = async () => {
    setLoadingWilayah(true);
    try {
      const response = await apiClient.get('sppg/sppg_api_sekolah_klari.php');
      if (response.data.status === 'success') {
        setWilayahList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching wilayah:", error);
    } finally {
      setLoadingWilayah(false);
    }
  };

  const requestPermissions = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    return lib.status === 'granted' && cam.status === 'granted';
  };

  const handleImagePick = async (source) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Izin Ditolak', 'Kami butuh izin kamera dan galeri untuk melanjutkan.');
      return;
    }

    let result;
    const options = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    };

    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (pickerModal.type === 'kantin') {
        setFotoKantin(result.assets[0]);
      } else {
        setFotoMenu(result.assets[0]);
      }
    }
    setPickerModal({ visible: false, type: '' });
  };

  const handleRegister = async () => {
    const { nama_pemilik, email_pemilik, nama_kantin, wilayah_id, username, password, confirmPassword } = formData;

    if (!nama_pemilik || !email_pemilik || !nama_kantin || !wilayah_id || !username || !password) {
      Alert.alert("Lengkapi Data", "Semua kolom wajib diisi.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Konfirmasi password tidak cocok.");
      return;
    }

    if (!fotoKantin || !fotoMenu) {
      Alert.alert("Foto Diperlukan", "Harap unggah foto kantin dan foto menu Anda.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('nama_pemilik', nama_pemilik);
      data.append('email_pemilik', email_pemilik);
      data.append('nama_kantin', nama_kantin);
      data.append('wilayah_id', wilayah_id);
      data.append('username', username);
      data.append('password', password);
      
      // Append Foto Kantin
      const uriK = fotoKantin.uri;
      data.append('foto_kantin', { 
        uri: uriK, 
        name: uriK.split('/').pop(), 
        type: `image/${uriK.split('.').pop()}` 
      });

      // Append Foto Menu
      const uriM = fotoMenu.uri;
      data.append('foto_menu', { 
        uri: uriM, 
        name: uriM.split('/').pop(), 
        type: `image/${uriM.split('.').pop()}` 
      });

      const response = await apiClient.post('auth/register_kantin.php', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 'success') {
        Alert.alert("Pendaftaran Berhasil", response.data.message, [
          { text: "Kembali ke Login", onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert("Gagal", response.data.message);
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Gagal mendaftar ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.headerHero}>
         <Image 
           source={require('../../../assets/batik_cirebon.png')} 
           style={[StyleSheet.absoluteFillObject, { opacity: 0.1, resizeMode: 'repeat' }]} 
         />
         <SafeAreaView style={styles.headerContent}>
            <View style={styles.headerTop}>
               <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={24} color={WHITE} />
               </TouchableOpacity>
               <Text style={styles.brandTitle}>Merchant <Text style={styles.brandSub}>Register</Text></Text>
               <View style={{ width: 24 }} />
            </View>

            <View style={styles.stepInfo}>
               <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="store-edit" size={32} color={GOLD} />
               </View>
               <View style={styles.titleArea}>
                  <Text style={styles.stepTitle}>Registrasi Kantin MBG</Text>
                  <Text style={styles.stepCount}>Sistem LaviraMeal v2.6</Text>
               </View>
            </View>
         </SafeAreaView>
      </View>

      <View style={styles.formWrapper}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
           <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>INFORMASI PEMILIK</Text>
           </View>

           <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Pemilik</Text>
              <View style={styles.inputBox}>
                 <Feather name="user" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                 <TextInput 
                   style={styles.textInput}
                   placeholder="Nama lengkap Anda"
                   value={formData.nama_pemilik}
                   onChangeText={(t) => setFormData({...formData, nama_pemilik: t})}
                 />
              </View>
           </View>

           <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Pemilik</Text>
              <View style={styles.inputBox}>
                 <Feather name="mail" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                 <TextInput 
                   style={styles.textInput}
                   placeholder="email@contoh.com"
                   keyboardType="email-address"
                   value={formData.email_pemilik}
                   onChangeText={(t) => setFormData({...formData, email_pemilik: t})}
                 />
              </View>
           </View>

           <View style={[styles.sectionHeader, { marginTop: 10 }]}>
              <Text style={styles.sectionTitle}>DETAIL KANTIN & LOKASI</Text>
           </View>

           <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Kantin</Text>
              <View style={styles.inputBox}>
                 <MaterialCommunityIcons name="store" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                 <TextInput 
                   style={styles.textInput}
                   placeholder="Contoh: Kantin Sehat 1"
                   value={formData.nama_kantin}
                   onChangeText={(t) => setFormData({...formData, nama_kantin: t})}
                 />
              </View>
           </View>

           <View style={styles.inputGroup}>
              <Text style={styles.label}>Wilayah Sekolah (Kec. Klari)</Text>
              <TouchableOpacity 
                style={styles.inputBox}
                onPress={() => setWilayahModal(true)}
              >
                 <Feather name="map-pin" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                 <Text style={[styles.textInput, !formData.wilayah_nama && { color: TEXT_MUTED }]}>
                    {formData.wilayah_nama || "Pilih lokasi sekolah"}
                 </Text>
                 <Ionicons name="chevron-down" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
           </View>

           <View style={styles.photoGrid}>
             <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Foto Kantin</Text>
                <TouchableOpacity style={styles.uploadAreaSmall} onPress={() => setPickerModal({ visible: true, type: 'kantin' })}>
                   {fotoKantin ? (
                     <Image source={{ uri: fotoKantin.uri }} style={styles.uploadedImg} />
                   ) : (
                     <View style={styles.uploadPlaceholder}>
                        <Ionicons name="camera" size={24} color={TEXT_MUTED} />
                        <Text style={styles.uploadHintSmall}>Ambil Foto</Text>
                     </View>
                   )}
                </TouchableOpacity>
             </View>

             <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Foto Menu</Text>
                <TouchableOpacity style={styles.uploadAreaSmall} onPress={() => setPickerModal({ visible: true, type: 'menu' })}>
                   {fotoMenu ? (
                     <Image source={{ uri: fotoMenu.uri }} style={styles.uploadedImg} />
                   ) : (
                     <View style={styles.uploadPlaceholder}>
                        <Ionicons name="restaurant" size={24} color={TEXT_MUTED} />
                        <Text style={styles.uploadHintSmall}>Ambil Foto</Text>
                     </View>
                   )}
                </TouchableOpacity>
             </View>
           </View>

           <View style={[styles.sectionHeader, { marginTop: 10 }]}>
              <Text style={styles.sectionTitle}>AKSES KEAMANAN</Text>
           </View>

           <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputBox}>
                 <Feather name="at-sign" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                 <TextInput 
                   style={styles.textInput}
                   placeholder="Buat username login"
                   autoCapitalize="none"
                   value={formData.username}
                   onChangeText={(t) => setFormData({...formData, username: t})}
                 />
              </View>
           </View>

           <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputBox}>
                 <Feather name="lock" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                 <TextInput 
                   style={styles.textInput}
                   placeholder="Min 8 Karakter"
                   secureTextEntry={!showPass}
                   value={formData.password}
                   onChangeText={(t) => setFormData({...formData, password: t})}
                 />
                 <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? "eye-off" : "eye"} size={18} color={TEXT_MUTED} />
                 </TouchableOpacity>
              </View>
           </View>

           <View style={styles.inputGroup}>
              <Text style={styles.label}>Konfirmasi Password</Text>
              <View style={styles.inputBox}>
                 <Feather name="shield" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                 <TextInput 
                   style={styles.textInput}
                   placeholder="Ulangi password"
                   secureTextEntry={!showPass}
                   value={formData.confirmPassword}
                   onChangeText={(t) => setFormData({...formData, confirmPassword: t})}
                 />
              </View>
           </View>

           <TouchableOpacity 
             style={styles.submitBtn} 
             onPress={handleRegister}
             disabled={loading}
           >
              {loading ? <ActivityIndicator color={WHITE} /> : (
                <>
                  <Text style={styles.submitBtnText}>AJUKAN PENDAFTARAN</Text>
                  <Ionicons name="paper-plane" size={20} color={WHITE} />
                </>
              )}
           </TouchableOpacity>

           <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={16} color={GOLD} />
              <Text style={styles.infoNoteTxt}>
                Data pendaftaran dan foto menu akan diperiksa secara manual oleh tim verifikator.
              </Text>
           </View>
           
           <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* MODAL PICKER SUMBER FOTO */}
      <Modal visible={pickerModal.visible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setPickerModal({ visible: false, type: '' })}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Pilih Sumber Foto</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity style={styles.pickerItem} onPress={() => handleImagePick('camera')}>
                <View style={[styles.pickerIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="camera" size={30} color={ACCENT_GREEN} />
                </View>
                <Text style={styles.pickerText}>Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerItem} onPress={() => handleImagePick('gallery')}>
                <View style={[styles.pickerIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="images" size={30} color={BLUE_ACCENT} />
                </View>
                <Text style={styles.pickerText}>Galeri</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL WILAYAH */}
      <Modal visible={wilayahModal} animationType="slide" transparent={true}>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Pilih Lokasi Sekolah</Text>
                  <TouchableOpacity onPress={() => setWilayahModal(false)}>
                     <Ionicons name="close" size={24} color={TEXT_MAIN} />
                  </TouchableOpacity>
               </View>
               
               {loadingWilayah ? (
                  <ActivityIndicator size="large" color={BLUE_PRIMARY} style={{ margin: 40 }} />
               ) : (
                  <FlatList 
                    data={wilayahList}
                    keyExtractor={(item) => item.npsn}
                    renderItem={({ item }) => (
                       <TouchableOpacity 
                         style={styles.wilayahItem}
                         onPress={() => {
                            setFormData({...formData, wilayah_id: item.npsn, wilayah_nama: item.nama});
                            setWilayahModal(false);
                         }}
                       >
                          <Ionicons name="business" size={20} color={BLUE_PRIMARY} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.wilayahTxt}>{item.nama}</Text>
                            <Text style={{ fontSize: 10, color: TEXT_MUTED }}>NPSN: {item.npsn}</Text>
                          </View>
                       </TouchableOpacity>
                    )}
                  />
               )}
            </View>
         </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLUE_PRIMARY },
  headerHero: { height: 230, justifyContent: 'center' },
  headerContent: { paddingHorizontal: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandTitle: { color: WHITE, fontSize: 24, fontWeight: '900' },
  brandSub: { color: BLUE_ACCENT },
  stepInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 25 },
  iconBox: { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  titleArea: { marginLeft: 15 },
  stepTitle: { color: WHITE, fontSize: 18, fontWeight: 'bold' },
  stepCount: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 4 },

  formWrapper: { flex: 1, backgroundColor: WHITE, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -30 },
  scrollContent: { padding: 30 },
  sectionHeader: { marginBottom: 15, borderLeftWidth: 3, borderLeftColor: GOLD, paddingLeft: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: 'bold', color: TEXT_MAIN, marginBottom: 8 },
  inputBox: { height: 60, backgroundColor: SOFT_BG, borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: BORDER_LIGHT },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 15, fontWeight: '600', color: TEXT_MAIN },
  
  photoGrid: { flexDirection: 'row', gap: 15 },
  uploadAreaSmall: { height: 120, backgroundColor: SOFT_BG, borderRadius: 20, borderWidth: 2, borderColor: BORDER_LIGHT, borderStyle: 'dashed', overflow: 'hidden' },
  uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  uploadHintSmall: { color: TEXT_MUTED, fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  uploadedImg: { width: '100%', height: '100%' },

  submitBtn: { height: 65, backgroundColor: BLUE_PRIMARY, borderRadius: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 12, elevation: 8, shadowColor: BLUE_PRIMARY, shadowOpacity: 0.3, shadowRadius: 10 },
  submitBtnText: { color: WHITE, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  
  infoNote: { flexDirection: 'row', backgroundColor: '#FFFBEB', padding: 15, borderRadius: 18, marginTop: 20, gap: 10 },
  infoNoteTxt: { flex: 1, color: '#92400E', fontSize: 11, fontWeight: '600', lineHeight: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 30, 63, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: TEXT_MAIN },
  wilayahItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: BORDER_LIGHT, gap: 15 },
  wilayahTxt: { fontSize: 16, fontWeight: '600', color: TEXT_MAIN },

  pickerContent: { backgroundColor: WHITE, padding: 30, borderRadius: 35, margin: 20, marginBottom: 50 },
  pickerTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 25, color: TEXT_MAIN },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-around' },
  pickerItem: { alignItems: 'center' },
  pickerIcon: { width: 70, height: 70, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  pickerText: { fontSize: 14, fontWeight: 'bold', color: TEXT_MAIN }
});
