import React, { useState, useRef, useEffect } from 'react';
import {
   View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
   StatusBar, SafeAreaView, Alert, ActivityIndicator, Image, Animated,
   Dimensions, KeyboardAvoidingView, Platform, Modal, FlatList
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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

export default function RegisterScreen({ navigation }) {
   const [step, setStep] = useState(1);
   const [loading, setLoading] = useState(false);
   const [success, setSuccess] = useState(false);

   // Form State
   const [formData, setFormData] = useState({
      nama: '',
      nik: '',
      hp: '',
      email: '',
      username: '',
      wilayah: '', // New field
      password: '',
      confirmPassword: ''
   });

   // Visibility Toggles
   const [showPass, setShowPass] = useState(false);
   const [showConfirm, setShowConfirm] = useState(false);

   // Wilayah selection
   const [wilayahModal, setWilayahModal] = useState(false);
   const [wilayahList, setWilayahList] = useState([]);
   const [loadingWilayah, setLoadingWilayah] = useState(false);

   // Animation values
   const translateX = useRef(new Animated.Value(0)).current;

   useEffect(() => {
      fetchWilayah();
   }, []);

   const fetchWilayah = async () => {
      setLoadingWilayah(true);
      try {
         const response = await apiClient.get('sppg/get_wilayah.php');
         if (response.data.status === 'success') {
            setWilayahList(response.data.data);
         }
      } catch (error) {
         console.error("Error fetching wilayah:", error);
      } finally {
         setLoadingWilayah(false);
      }
   };

   const slideTo = (toStep) => {
      const toValue = toStep === 1 ? 0 : -width;
      Animated.timing(translateX, {
         toValue,
         duration: 300,
         useNativeDriver: true
      }).start(() => setStep(toStep));
   };

   const validateStep1 = () => {
      if (!formData.nama || !formData.nik || !formData.hp || !formData.email || !formData.wilayah) {
         Alert.alert("Lengkapi Data", "Harap isi semua kolom data diri dan pilih wilayah.");
         return false;
      }
      if (formData.nik.length !== 16) {
         Alert.alert("NIK Tidak Valid", "NIK harus berjumlah 16 digit.");
         return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
         Alert.alert("Email Tidak Valid", "Gunakan format email yang benar.");
         return false;
      }
      return true;
   };

   const handleNext = () => {
      if (validateStep1()) slideTo(2);
   };

   const handleBack = () => {
      slideTo(1);
   };

   const getPasswordStrength = () => {
      if (formData.password.length === 0) return { label: '', color: TEXT_MUTED, width: '0%' };
      if (formData.password.length < 6) return { label: 'Lemah', color: '#F43F5E', width: '33%' };
      if (formData.password.length < 10) return { label: 'Sedang', color: GOLD, width: '66%' };
      return { label: 'Kuat', color: ACCENT_GREEN, width: '100%' };
   };

   const handleRegister = async () => {
      if (!formData.username || !formData.password || !formData.confirmPassword) {
         Alert.alert("Lengkapi Data", "Harap isi semua kolom keamanan.");
         return;
      }
      if (formData.password !== formData.confirmPassword) {
         Alert.alert("Error", "Konfirmasi password tidak cocok.");
         return;
      }

      setLoading(true);
      try {
         const response = await apiClient.post('auth/register_admin_sppg.php', {
            nama: formData.nama,
            nik: formData.nik,
            hp: formData.hp,
            email: formData.email,
            username: formData.username,
            password: formData.password,
            wilayah: formData.wilayah
         });

         if (response.data.status === 'success') {
            Alert.alert("Registrasi Berhasil", "Akun Admin SPPG Anda telah aktif. Silakan masuk.", [
               { text: "Login", onPress: () => navigation.navigate('Login') }
            ]);
         } else {
            Alert.alert("Registrasi Gagal", response.data.message || "Terjadi kesalahan sistem.");
         }
      } catch (error) {
         const serverMsg = error.response?.data?.message || error.message || "Gagal terhubung ke server.";
         Alert.alert("Error", serverMsg);
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

         {/* HEADER PATTERN */}
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
                  <Text style={styles.brandTitle}>MBG <Text style={styles.brandSub}>Admin</Text></Text>
                  <View style={{ width: 24 }} />
               </View>

               <View style={styles.stepInfo}>
                  <View style={styles.iconBox}>
                     <Ionicons
                        name={step === 1 ? "person-circle" : "shield-checkmark"}
                        size={32}
                        color={GOLD}
                     />
                  </View>
                  <View style={styles.titleArea}>
                     <Text style={styles.stepTitle}>
                        {step === 1 ? "Registrasi Admin SPPG" : "Keamanan Akun"}
                     </Text>
                     <Text style={styles.stepCount}>Step {step} dari 2</Text>
                  </View>
               </View>

               {/* PROGRESS BAR */}
               <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: step === 1 ? '50%' : '100%' }]} />
               </View>
            </SafeAreaView>
         </View>

         <View style={styles.formWrapper}>
            <Animated.View style={[styles.slideContainer, { transform: [{ translateX }] }]}>

               {/* STEP 1: DATA DIRI */}
               <ScrollView
                  style={styles.stepContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
               >
                  <View style={styles.inputGroup}>
                     <Text style={styles.label}>Nama Lengkap</Text>
                     <View style={styles.inputBox}>
                        <Feather name="user" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                        <TextInput
                           style={styles.textInput}
                           placeholder="Masukkan nama lengkap"
                           value={formData.nama}
                           onChangeText={(t) => setFormData({ ...formData, nama: t })}
                        />
                     </View>
                  </View>

                  <View style={styles.inputGroup}>
                     <Text style={styles.label}>NIK (16 Digit)</Text>
                     <View style={styles.inputBox}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                        <TextInput
                           style={styles.textInput}
                           placeholder="Masukkan 16 digit NIK"
                           keyboardType="number-pad"
                           maxLength={16}
                           value={formData.nik}
                           onChangeText={(t) => setFormData({ ...formData, nik: t })}
                        />
                     </View>
                  </View>

                  <View style={styles.inputGroup}>
                     <Text style={styles.label}>No. Handphone</Text>
                     <View style={styles.inputBox}>
                        <Feather name="phone" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                        <TextInput
                           style={styles.textInput}
                           placeholder="Contoh: 08123456789"
                           keyboardType="phone-pad"
                           value={formData.hp}
                           onChangeText={(t) => setFormData({ ...formData, hp: t })}
                        />
                     </View>
                  </View>

                  <View style={styles.inputGroup}>
                     <Text style={styles.label}>Email Aktif</Text>
                     <View style={styles.inputBox}>
                        <Feather name="mail" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                        <TextInput
                           style={styles.textInput}
                           placeholder="Masukkan email aktif"
                           keyboardType="email-address"
                           autoCapitalize="none"
                           value={formData.email}
                           onChangeText={(t) => setFormData({ ...formData, email: t })}
                        />
                     </View>
                  </View>

                  <View style={styles.inputGroup}>
                     <Text style={styles.label}>Wilayah Daerah SPPG</Text>
                     <TouchableOpacity
                        style={[styles.inputBox, !wilayahList.length && !loadingWilayah && { borderColor: '#F43F5E' }]}
                        onPress={() => {
                           setWilayahModal(true);
                           if (!wilayahList.length) fetchWilayah();
                        }}
                        disabled={loadingWilayah}
                     >
                        <MaterialCommunityIcons
                           name={wilayahList.length ? "map-marker-radius" : "refresh"}
                           size={18}
                           color={wilayahList.length ? BLUE_ACCENT : '#F43F5E'}
                           style={styles.inputIcon}
                        />
                        <Text style={[styles.textInput, { color: formData.wilayah ? TEXT_MAIN : (wilayahList.length ? TEXT_MUTED : '#F43F5E') }]}>
                           {formData.wilayah ? formData.wilayah : (wilayahList.length ? "Pilih Wilayah Daerah" : "Gagal memuat. Ketuk untuk coba lagi")}
                        </Text>
                        {loadingWilayah ? <ActivityIndicator size="small" color={BLUE_PRIMARY} /> : <Feather name="chevron-down" size={18} color={TEXT_MUTED} />}
                     </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.mainBtn} onPress={handleNext}>
                     <Text style={styles.mainBtnText}>Selanjutnya</Text>
                     <Feather name="arrow-right" size={18} color={WHITE} />
                  </TouchableOpacity>
               </ScrollView>

               {/* STEP 2: KEAMANAN */}
               <ScrollView
                  style={styles.stepContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
               >
                  <View style={styles.inputGroup}>
                     <Text style={styles.label}>Username</Text>
                     <View style={styles.inputBox}>
                        <Feather name="at-sign" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                        <TextInput
                           style={styles.textInput}
                           placeholder="Buat username unik"
                           autoCapitalize="none"
                           value={formData.username}
                           onChangeText={(t) => setFormData({ ...formData, username: t })}
                        />
                     </View>
                  </View>

                  <View style={styles.inputGroup}>
                     <Text style={styles.label}>Password</Text>
                     <View style={styles.inputBox}>
                        <Feather name="lock" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                        <TextInput
                           style={styles.textInput}
                           placeholder="Buat password"
                           secureTextEntry={!showPass}
                           value={formData.password}
                           onChangeText={(t) => setFormData({ ...formData, password: t })}
                        />
                        <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                           <Feather name={showPass ? "eye" : "eye-off"} size={18} color={TEXT_MUTED} />
                        </TouchableOpacity>
                     </View>
                     {formData.password.length > 0 && (
                        <View style={styles.strengthBox}>
                           <View style={styles.strengthBg}>
                              <View style={[styles.strengthBar, { width: strength.width, backgroundColor: strength.color }]} />
                           </View>
                           <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                        </View>
                     )}
                  </View>

                  <View style={styles.inputGroup}>
                     <Text style={styles.label}>Konfirmasi Password</Text>
                     <View style={styles.inputBox}>
                        <Feather name="shield" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                        <TextInput
                           style={styles.textInput}
                           placeholder="Ulangi password"
                           secureTextEntry={!showConfirm}
                           value={formData.confirmPassword}
                           onChangeText={(t) => setFormData({ ...formData, confirmPassword: t })}
                        />
                        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                           <Feather name={showConfirm ? "eye" : "eye-off"} size={18} color={TEXT_MUTED} />
                        </TouchableOpacity>
                     </View>
                  </View>

                  <View style={styles.infoCard}>
                     <Ionicons name="shield-checkmark-outline" size={20} color={ACCENT_GREEN} />
                     <Text style={styles.infoText}>
                        Pendaftaran Anda akan langsung aktif tanpa perlu verifikasi manual dari pusat.
                     </Text>
                  </View>

                  <View style={styles.btnRow}>
                     <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                        <Feather name="arrow-left" size={20} color={BLUE_PRIMARY} />
                        <Text style={styles.backBtnText}>Kembali</Text>
                     </TouchableOpacity>

                     <TouchableOpacity
                        style={[styles.mainBtn, { flex: 1, marginTop: 0 }]}
                        onPress={handleRegister}
                        disabled={loading}
                     >
                        {loading ? <ActivityIndicator color={WHITE} /> : (
                           <>
                              <Text style={styles.mainBtnText}>Daftar Sekarang</Text>
                              <Ionicons name="cloud-upload-outline" size={18} color={WHITE} />
                           </>
                        )}
                     </TouchableOpacity>
                  </View>
               </ScrollView>
            </Animated.View>
         </View>

         {/* MODAL WILAYAH */}
         <Modal visible={wilayahModal} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
               <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Pilih Wilayah Daerah</Text>
                     <TouchableOpacity onPress={() => setWilayahModal(false)}>
                        <Ionicons name="close" size={24} color={TEXT_MAIN} />
                     </TouchableOpacity>
                  </View>

                  {loadingWilayah ? (
                     <ActivityIndicator size="large" color={BLUE_PRIMARY} style={{ margin: 40 }} />
                  ) : (
                     <FlatList
                        data={wilayahList}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                           <View style={{ alignItems: 'center', padding: 30 }}>
                              <Ionicons name="cloud-offline-outline" size={48} color={BORDER_LIGHT} />
                              <Text style={{ color: TEXT_MUTED, marginTop: 10, textAlign: 'center' }}>
                                 Data wilayah gagal dimuat. Pastikan koneksi internet stabil.
                              </Text>
                              <TouchableOpacity
                                 style={[styles.mainBtn, { width: '100%', height: 50, marginTop: 20 }]}
                                 onPress={fetchWilayah}
                              >
                                 <Text style={styles.mainBtnText}>Coba Lagi</Text>
                              </TouchableOpacity>

                              <View style={{ height: 1, backgroundColor: BORDER_LIGHT, width: '100%', marginVertical: 30 }} />

                              <Text style={{ color: TEXT_MAIN, fontWeight: '700', marginBottom: 15 }}>Atau Masukkan Manual:</Text>
                              <View style={[styles.inputBox, { width: '100%' }]}>
                                 <TextInput
                                    placeholder="Ketik wilayah Anda di sini..."
                                    style={styles.textInput}
                                    onChangeText={(t) => setFormData({ ...formData, wilayah: t })}
                                 />
                                 <TouchableOpacity onPress={() => setWilayahModal(false)}>
                                    <Ionicons name="checkmark-circle" size={24} color={ACCENT_GREEN} />
                                 </TouchableOpacity>
                              </View>
                           </View>
                        }
                        renderItem={({ item }) => (
                           <TouchableOpacity
                              style={styles.wilayahItem}
                              onPress={() => {
                                 setFormData({ ...formData, wilayah: item.nama });
                                 setWilayahModal(false);
                              }}
                           >
                              <MaterialCommunityIcons name="city" size={20} color={TEXT_MUTED} />
                              <Text style={styles.wilayahText}>{item.nama}</Text>
                              {formData.wilayah === item.nama && (
                                 <Ionicons name="checkmark-circle" size={20} color={ACCENT_GREEN} />
                              )}
                           </TouchableOpacity>
                        )}
                        contentContainerStyle={{ paddingBottom: 20 }}
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
   headerHero: { height: 280, backgroundColor: BLUE_PRIMARY, justifyContent: 'flex-end' },
   headerContent: { paddingHorizontal: 30, paddingBottom: 40 },
   headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
   brandTitle: { color: WHITE, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
   brandSub: { color: GOLD },
   stepInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
   iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
   titleArea: { gap: 4 },
   stepTitle: { color: WHITE, fontSize: 20, fontWeight: '900' },
   stepCount: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
   progressContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 20, overflow: 'hidden' },
   progressBar: { height: '100%', backgroundColor: GOLD, borderRadius: 3 },

   formWrapper: { flex: 1, backgroundColor: SOFT_BG, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -30, overflow: 'hidden' },
   slideContainer: { flexDirection: 'row', width: width * 2, flex: 1 },
   stepContent: { width: width, padding: 30 },
   inputGroup: { marginBottom: 20 },
   label: { fontSize: 12, fontWeight: '800', color: TEXT_MAIN, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
   labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
   inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 16, paddingHorizontal: 15, height: 60, borderWidth: 1, borderColor: BORDER_LIGHT },
   inputIcon: { marginRight: 12 },
   textInput: { flex: 1, fontSize: 15, color: TEXT_MAIN, fontWeight: '600' },

   strengthBox: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
   strengthBg: { flex: 1, height: 4, backgroundColor: BORDER_LIGHT, borderRadius: 2 },
   strengthBar: { height: '100%', borderRadius: 2 },
   strengthLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

   mainBtn: { backgroundColor: BLUE_PRIMARY, height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10, elevation: 8, shadowColor: BLUE_PRIMARY, shadowOpacity: 0.3, shadowRadius: 10 },
   mainBtnText: { color: WHITE, fontSize: 16, fontWeight: '900' },
   btnRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
   backBtn: { width: 64, height: 64, borderRadius: 20, borderWeight: 2, borderColor: BORDER_LIGHT, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
   backBtnText: { display: 'none' }, // Using icon only for small screens but label exists

   successWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
   successCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: ACCENT_GREEN, justifyContent: 'center', alignItems: 'center', marginBottom: 30, elevation: 20, shadowColor: ACCENT_GREEN, shadowOpacity: 0.4, shadowRadius: 20 },
   successTitle: { fontSize: 26, fontWeight: '900', color: WHITE, marginBottom: 10 },
   successSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22 },
   backLoginBtn: { backgroundColor: GOLD, height: 60, width: '100%', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
   backLoginText: { color: WHITE, fontSize: 16, fontWeight: '900' },

   // New Styles
   infoCard: { flexDirection: 'row', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: 15, borderRadius: 16, gap: 10, alignItems: 'center', marginBottom: 20 },
   infoText: { flex: 1, fontSize: 13, color: TEXT_MAIN, fontWeight: '500', lineHeight: 18 },
   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
   modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '70%' },
   modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
   modalTitle: { fontSize: 18, fontWeight: '900', color: TEXT_MAIN },
   wilayahItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: BORDER_LIGHT, gap: 15 },
   wilayahText: { flex: 1, fontSize: 16, fontWeight: '600', color: TEXT_MAIN }
});
