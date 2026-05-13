import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  StatusBar, SafeAreaView, Alert, ActivityIndicator, Animated, 
  Dimensions, KeyboardAvoidingView, Platform, Modal, FlatList, Image
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const { width } = Dimensions.get('window');

const COLOR_TEAL = '#0D9488';
const COLOR_TEAL_DARK = '#0F766E';
const COLOR_TEAL_LIGHT = '#F0FDFA';
const COLOR_WHITE = '#FFFFFF';
const COLOR_DARK = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_GREEN_SUCCESS = '#10B981';
const COLOR_YELLOW_WARNING = '#F59E0B';

export default function RegisterGuruScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    hp: '',
    email: '',
    username: '',
    sekolah: null,
    kodeUndangan: '',
    mapel: '',
    kelas: [], 
    password: '',
    confirmPassword: ''
  });

  // UI States
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [schoolModal, setSchoolModal] = useState(false);
  const [searchSchool, setSearchSchool] = useState('');
  const [schoolsList, setSchoolsList] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoadingSchools(true);
    try {
      const response = await apiClient.get('sppg/sppg_api_sekolah_klari.php');
      if (response.data.status === 'success') {
        setSchoolsList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoadingSchools(false);
    }
  };

  const translateX = useRef(new Animated.Value(0)).current;

  const slideTo = (toStep) => {
    const toValue = -(toStep - 1) * width;
    Animated.timing(translateX, {
      toValue,
      duration: 350,
      useNativeDriver: true
    }).start(() => setStep(toStep));
  };

  const validateStep1 = () => {
    if (!formData.nama || !formData.nip || !formData.hp || !formData.email) {
      Alert.alert("Data Belum Lengkap", "Harap lengkapi semua kolom data diri.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Email Tidak Valid", "Format email tidak benar.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.sekolah || !formData.kodeUndangan || !formData.mapel || formData.kelas.length === 0) {
      Alert.alert("Data Belum Lengkap", "Harap lengkapi informasi data mengajar.");
      return false;
    }
    return true;
  };

  const toggleKelas = (item) => {
    let current = [...formData.kelas];
    if (current.includes(item)) {
      current = current.filter(k => k !== item);
    } else {
      current.push(item);
    }
    setFormData({ ...formData, kelas: current });
  };

  const getPasswordStrength = () => {
    if (formData.password.length === 0) return { label: '', color: COLOR_TEXT_MUTED, width: '0%' };
    if (formData.password.length < 6) return { label: 'Lemah', color: '#F43F5E', width: '33%' };
    if (formData.password.length < 10) return { label: 'Sedang', color: COLOR_YELLOW_WARNING, width: '66%' };
    return { label: 'Kuat', color: COLOR_GREEN_SUCCESS, width: '100%' };
  };

  const handleRegister = async () => {
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      Alert.alert("Data Belum Lengkap", "Harap isi semua kolom keamanan.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Gagal", "Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nama_lengkap: formData.nama,
        nip: formData.nip,
        no_hp: formData.hp,
        email: formData.email,
        username: formData.username,
        sekolah_npsn: formData.sekolah?.npsn,
        nama_sekolah: formData.sekolah?.nama,
        kode_undangan: formData.kodeUndangan,
        mata_pelajaran: formData.mapel,
        kelas_diampu: formData.kelas.join(','),
        password: formData.password,
        role: 'guru'
      };
      const response = await apiClient.post('auth/register_guru.php', payload);
      if (response.data.status === 'success') {
        Alert.alert("Registrasi Berhasil", "Akun Guru Anda telah aktif. Silakan masuk.", [
          { text: "Login", onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert("Gagal", response.data.message || "Pendaftaran gagal.");
      }
    } catch (error) {
      const serverMsg = error.response?.data?.message || error.message || "Gagal menghubungi server.";
      Alert.alert("Kesalahan", serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

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
               <TouchableOpacity onPress={() => step > 1 ? slideTo(step - 1) : navigation.goBack()}>
                  <Ionicons name="arrow-back" size={24} color={COLOR_WHITE} />
               </TouchableOpacity>
               <Text style={styles.brandTitle}>MBG <Text style={styles.brandSub}>Teacher</Text></Text>
               <View style={{ width: 24 }} />
            </View>

            <View style={styles.stepInfo}>
               <View style={styles.iconBox}>
                  <Ionicons 
                    name={step === 1 ? "person-circle" : step === 2 ? "school" : "shield-checkmark"} 
                    size={32} 
                    color={COLOR_WHITE} 
                  />
               </View>
               <View style={styles.titleArea}>
                  <Text style={styles.stepTitle}>
                     {step === 1 ? "Data Profil Guru" : step === 2 ? "Informasi Mengajar" : "Keamanan Akun"}
                  </Text>
                  <Text style={styles.stepCount}>Step {step} dari 3</Text>
               </View>
            </View>

            <View style={styles.progressContainer}>
               <View style={[styles.progressBar, { width: (step / 3) * 100 + '%' }]} />
            </View>
         </SafeAreaView>
      </View>

      <View style={styles.formWrapper}>
         <Animated.View style={[styles.slidesWrapper, { transform: [{ translateX }] }]}>
            
            {/* STEP 1: DATA DIRI */}
            <ScrollView style={styles.slide} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nama Lengkap</Text>
                  <View style={styles.inputBox}>
                     <Feather name="user" size={18} color={COLOR_TEAL} style={styles.inputIcon} />
                     <TextInput 
                       style={styles.textInput}
                       placeholder="Masukkan nama lengkap"
                       value={formData.nama}
                       onChangeText={(v) => setFormData({...formData, nama: v})}
                     />
                  </View>
               </View>

               <View style={styles.inputGroup}>
                  <Text style={styles.label}>NIP (Nomor Induk Pegawai)</Text>
                  <View style={styles.inputBox}>
                     <MaterialCommunityIcons name="card-account-details-outline" size={18} color={COLOR_TEAL} style={styles.inputIcon} />
                     <TextInput 
                       style={styles.textInput}
                       placeholder="Masukkan NIP"
                       keyboardType="number-pad"
                       value={formData.nip}
                       onChangeText={(v) => setFormData({...formData, nip: v})}
                     />
                  </View>
               </View>

               <View style={styles.inputGroup}>
                  <Text style={styles.label}>No. Handphone</Text>
                  <View style={styles.inputBox}>
                     <Feather name="phone" size={18} color={COLOR_TEAL} style={styles.inputIcon} />
                     <TextInput 
                       style={styles.textInput}
                       placeholder="Contoh: 08123456789"
                       keyboardType="phone-pad"
                       value={formData.hp}
                       onChangeText={(v) => setFormData({...formData, hp: v})}
                     />
                  </View>
               </View>

               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Institusi/Pribadi</Text>
                  <View style={styles.inputBox}>
                     <Feather name="mail" size={18} color={COLOR_TEAL} style={styles.inputIcon} />
                     <TextInput 
                       style={styles.textInput}
                       placeholder="nama@email.com"
                       keyboardType="email-address"
                       autoCapitalize="none"
                       value={formData.email}
                       onChangeText={(v) => setFormData({...formData, email: v})}
                     />
                  </View>
               </View>

               <TouchableOpacity style={styles.mainBtn} onPress={() => validateStep1() && slideTo(2)}>
                  <Text style={styles.mainBtnText}>Lanjut ke Data Sekolah</Text>
                  <Feather name="arrow-right" size={18} color={COLOR_WHITE} />
               </TouchableOpacity>
            </ScrollView>

            {/* STEP 2: DATA MENGAJAR */}
            <ScrollView style={styles.slide} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Asal Sekolah</Text>
                  <TouchableOpacity style={styles.inputBox} onPress={() => setSchoolModal(true)}>
                     <MaterialCommunityIcons name="office-building" size={20} color={COLOR_TEAL} style={styles.inputIcon} />
                     <Text style={[styles.textInput, { color: formData.sekolah ? COLOR_DARK : COLOR_TEXT_MUTED }]}>
                        {formData.sekolah ? formData.sekolah.nama : "Cari & Pilih Sekolah"}
                     </Text>
                     <Feather name="search" size={18} color={COLOR_TEXT_MUTED} />
                  </TouchableOpacity>
               </View>

               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kode Undangan (Dari Admin)</Text>
                  <View style={styles.inputBox}>
                     <Feather name="key" size={18} color={COLOR_TEAL} style={styles.inputIcon} />
                     <TextInput 
                       style={styles.textInput}
                       placeholder="Masukkan kode unik"
                       autoCapitalize="characters"
                       value={formData.kodeUndangan}
                       onChangeText={(v) => setFormData({...formData, kodeUndangan: v})}
                     />
                  </View>
               </View>

               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mata Pelajaran</Text>
                  <View style={styles.inputBox}>
                     <Ionicons name="book-outline" size={18} color={COLOR_TEAL} style={styles.inputIcon} />
                     <TextInput 
                       style={styles.textInput}
                       placeholder="Cth: Fisika / Matematika"
                       value={formData.mapel}
                       onChangeText={(v) => setFormData({...formData, mapel: v})}
                     />
                  </View>
               </View>

               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kelas yang Diampu</Text>
                  <View style={styles.chipRow}>
                     {['X', 'XI', 'XII'].map((kls) => (
                        <TouchableOpacity 
                          key={kls}
                          style={[styles.chip, formData.kelas.includes(kls) && styles.chipActive]}
                          onPress={() => toggleKelas(kls)}
                        >
                           <Text style={[styles.chipText, formData.kelas.includes(kls) && styles.chipTextActive]}>Kelas {kls}</Text>
                        </TouchableOpacity>
                     ))}
                  </View>
               </View>

               <TouchableOpacity style={styles.mainBtn} onPress={() => validateStep2() && slideTo(3)}>
                  <Text style={styles.mainBtnText}>Lanjut ke Keamanan</Text>
                  <Feather name="arrow-right" size={18} color={COLOR_WHITE} />
               </TouchableOpacity>
            </ScrollView>

            {/* STEP 3: KEAMANAN */}
            <ScrollView style={styles.slide} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputBox}>
                     <Feather name="at-sign" size={18} color={COLOR_TEAL} style={styles.inputIcon} />
                     <TextInput 
                       style={styles.textInput}
                       placeholder="Buat username unik"
                       autoCapitalize="none"
                       value={formData.username}
                       onChangeText={(v) => setFormData({...formData, username: v})}
                     />
                  </View>
               </View>

               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kata Sandi</Text>
                  <View style={styles.inputBox}>
                     <Feather name="lock" size={18} color={COLOR_TEAL} style={styles.inputIcon} />
                     <TextInput 
                       style={styles.textInput}
                       placeholder="Buat sandi baru"
                       secureTextEntry={!showPass}
                       value={formData.password}
                       onChangeText={(v) => setFormData({...formData, password: v})}
                     />
                     <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                        <Ionicons name={showPass ? "eye-outline" : "eye-off-outline"} size={22} color={COLOR_TEXT_MUTED} />
                     </TouchableOpacity>
                  </View>
                  {formData.password.length > 0 && (
                     <View style={styles.strengthRow}>
                        <View style={styles.strengthTrack}>
                           <View style={[styles.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
                        </View>
                        <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                     </View>
                  )}
               </View>

               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Konfirmasi Kata Sandi</Text>
                  <View style={styles.inputBox}>
                     <Feather name="shield" size={18} color={COLOR_TEAL} style={styles.inputIcon} />
                     <TextInput 
                       style={styles.textInput}
                       placeholder="Ulangi sandi"
                       secureTextEntry={!showConfirm}
                       value={formData.confirmPassword}
                       onChangeText={(v) => setFormData({...formData, confirmPassword: v})}
                     />
                     <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                        <Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={22} color={COLOR_TEXT_MUTED} />
                     </TouchableOpacity>
                  </View>
               </View>

               <View style={styles.infoCard}>
                  <Ionicons name="sparkles" size={20} color={COLOR_TEAL} />
                  <Text style={styles.infoText}>
                     Pendaftaran Anda akan diproses secara instan dan dapat langsung digunakan.
                  </Text>
               </View>

               <TouchableOpacity 
                 style={[styles.mainBtn, { backgroundColor: COLOR_DARK }]} 
                 onPress={handleRegister}
                 disabled={loading}
               >
                  {loading ? <ActivityIndicator color={COLOR_WHITE} /> : (
                    <>
                       <Text style={styles.mainBtnText}>Selesaikan Pendaftaran</Text>
                       <Ionicons name="checkmark-circle" size={20} color={COLOR_WHITE} />
                    </>
                  )}
               </TouchableOpacity>
            </ScrollView>

         </Animated.View>
      </View>

      {/* SCHOOL MODAL */}
      <Modal visible={schoolModal} animationType="slide">
         <SafeAreaView style={{ flex: 1, backgroundColor: COLOR_WHITE }}>
            <View style={styles.modalHeader}>
               <TouchableOpacity onPress={() => setSchoolModal(false)}>
                  <Ionicons name="close" size={28} color={COLOR_DARK} />
               </TouchableOpacity>
               <Text style={styles.modalTitle}>Pilih Institusi Sekolah</Text>
               <View style={{ width: 28 }} />
            </View>
            <View style={styles.searchBox}>
               <Ionicons name="search" size={20} color={COLOR_TEXT_MUTED} />
               <TextInput 
                 style={styles.searchInput}
                 placeholder="Cari berdasarkan nama atau NPSN..."
                 value={searchSchool}
                 onChangeText={setSearchSchool}
               />
            </View>
            {loadingSchools ? (
               <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator color={COLOR_TEAL} size="large" />
                  <Text style={{ marginTop: 15, color: COLOR_TEXT_MUTED, fontWeight: '600' }}>Menghubungkan ke basis data...</Text>
               </View>
            ) : (
               <FlatList 
                  data={schoolsList.filter(s => s.nama.toLowerCase().includes(searchSchool.toLowerCase()) || s.npsn.includes(searchSchool))}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                     <TouchableOpacity 
                        style={styles.schoolItem}
                        onPress={() => {
                           setFormData({ ...formData, sekolah: item });
                           setSchoolModal(false);
                        }}
                     >
                        <View style={styles.schoolIcon}>
                           <MaterialCommunityIcons name="school" size={24} color={COLOR_TEAL} />
                        </View>
                        <View style={{ flex: 1 }}>
                           <Text style={styles.schoolItemText}>{item.nama}</Text>
                           <Text style={{ fontSize: 12, color: COLOR_TEXT_MUTED, marginTop: 2 }}>NPSN: {item.npsn} • Klari, Karawang</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={COLOR_BORDER} />
                     </TouchableOpacity>
                  )}
                  contentContainerStyle={{ padding: 25 }}
                  ListEmptyComponent={
                     <View style={{ alignItems: 'center', marginTop: 60 }}>
                        <MaterialCommunityIcons name="database-search" size={64} color={COLOR_BORDER} />
                        <Text style={{ color: COLOR_TEXT_MUTED, marginTop: 15, fontSize: 16, fontWeight: '600' }}>Sekolah tidak ditemukan</Text>
                     </View>
                  }
               />
            )}
         </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR_TEAL },
  headerHero: { height: 260, backgroundColor: COLOR_TEAL, justifyContent: 'flex-end' },
  headerContent: { paddingHorizontal: 30, paddingBottom: 40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  brandTitle: { color: COLOR_WHITE, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  brandSub: { color: 'rgba(255,255,255,0.6)' },
  stepInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  titleArea: { gap: 4 },
  stepTitle: { color: COLOR_WHITE, fontSize: 22, fontWeight: '900' },
  stepCount: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  progressContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginTop: 20, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: COLOR_WHITE, borderRadius: 3 },

  formWrapper: { flex: 1, backgroundColor: COLOR_TEAL_LIGHT, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -30, overflow: 'hidden' },
  slidesWrapper: { flexDirection: 'row', width: width * 3, flex: 1 },
  slide: { width: width, padding: 30 },
  inputGroup: { marginBottom: 22 },
  label: { fontSize: 12, fontWeight: '900', color: COLOR_DARK, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLOR_WHITE, borderRadius: 18, paddingHorizontal: 18, height: 62, borderWidth: 1.5, borderColor: COLOR_BORDER, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  inputIcon: { marginRight: 15 },
  textInput: { flex: 1, fontSize: 15, color: COLOR_DARK, fontWeight: '700' },
  
  chipRow: { flexDirection: 'row', gap: 12, marginTop: 5 },
  chip: { paddingHorizontal: 22, paddingVertical: 14, borderRadius: 15, backgroundColor: COLOR_WHITE, borderWidth: 1.5, borderColor: COLOR_BORDER },
  chipActive: { backgroundColor: COLOR_TEAL, borderColor: COLOR_TEAL },
  chipText: { fontSize: 14, fontWeight: '800', color: COLOR_TEXT_MUTED },
  chipTextActive: { color: COLOR_WHITE },
  
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  strengthTrack: { flex: 1, height: 5, backgroundColor: COLOR_BORDER, borderRadius: 3 },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },

  mainBtn: { backgroundColor: COLOR_TEAL, height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 15, elevation: 8, shadowColor: COLOR_TEAL, shadowOpacity: 0.3, shadowRadius: 10 },
  mainBtnText: { color: COLOR_WHITE, fontSize: 16, fontWeight: '900' },

  infoCard: { flexDirection: 'row', backgroundColor: 'rgba(13, 148, 136, 0.1)', padding: 18, borderRadius: 20, gap: 12, alignItems: 'center', marginBottom: 25 },
  infoText: { flex: 1, fontSize: 13, color: COLOR_DARK, fontWeight: '600', lineHeight: 20 },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: COLOR_BORDER },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLOR_DARK },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLOR_TEAL_LIGHT, marginHorizontal: 25, marginTop: 20, paddingHorizontal: 18, height: 56, borderRadius: 15, borderWidth: 1, borderColor: COLOR_BORDER },
  searchInput: { flex: 1, marginLeft: 12, fontWeight: '700', fontSize: 15 },
  schoolItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1.5, borderBottomColor: COLOR_BORDER },
  schoolIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: COLOR_TEAL_LIGHT, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  schoolItemText: { fontSize: 16, fontWeight: '800', color: COLOR_DARK },
});
