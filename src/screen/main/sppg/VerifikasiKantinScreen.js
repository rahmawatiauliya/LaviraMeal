import React, { useState, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   ScrollView,
   StatusBar,
   Image,
   useWindowDimensions,
   Alert,
   ActivityIndicator,
   ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_ACCENT = '#3b82f6';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';

export default function VerifikasiKantinScreen({ navigation, route }) {
   const { width } = useWindowDimensions();
   const { canteen } = route.params || { canteen: {} };
   const [loading, setLoading] = useState(false);
   const [verified, setVerified] = useState(canteen?.verified_by_sppg || false);

   const handleVerify = async () => {
      try {
         setLoading(true);
         await new Promise(resolve => setTimeout(resolve, 1500));
         setVerified(true);

         const savedNotifs = await AsyncStorage.getItem('@notifications');
         let notifs = savedNotifs ? JSON.parse(savedNotifs) : [];
         notifs.unshift({
            id: Date.now(),
            title: 'Verifikasi Berhasil',
            message: `${canteen?.nama_kantin} telah diverifikasi secara digital oleh SPPG.`,
            time: 'Baru saja',
            type: 'success'
         });
         await AsyncStorage.setItem('@notifications', JSON.stringify(notifs));

         Alert.alert("Konfirmasi Digital", "Sertifikasi Kantin MBG telah resmi diterbitkan.");
      } catch (error) { Alert.alert("Error", "Gagal melakukan verifikasi."); }
      finally { setLoading(false); }
   };

   return (
      <SafeAreaView style={styles.container}>
         <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

         <View style={styles.header}>
            <ImageBackground source={require('../../../../assets/batik_cirebon.png')} style={styles.headerBg} imageStyle={styles.batikImage}>
               <SafeAreaView style={{ flex: 1 }}>
                  <View style={styles.headerContent}>
                     <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={WHITE} />
                     </TouchableOpacity>
                     <View style={styles.headerText}>
                        <Text style={styles.hTitle}>Terminal Verifikasi</Text>
                        <Text style={styles.hSub}>ID Dokumen: MBG-KLR-{canteen?.id || '000'}</Text>
                     </View>
                  </View>
               </SafeAreaView>
            </ImageBackground>
         </View>

         <ScrollView contentContainerStyle={{ padding: 25, paddingBottom: 100 }}>
            {/* DOCUMENTATION PANEL */}
            <View style={styles.docPanel}>
               <Image source={{ uri: canteen?.foto_kantin || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500' }} style={styles.heroImg} />
               <View style={styles.overlayId}>
                  <Text style={styles.idBadge}>FOTO UNIT PROD.</Text>
               </View>
            </View>

            <View style={styles.infoCard}>
               <View style={styles.infoRow}>
                  <View style={styles.iconBox}><Ionicons name="restaurant" size={20} color={BLUE_PRIMARY} /></View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                     <Text style={styles.schTag}>{canteen?.sekolah || 'Satuan Pendidikan'}</Text>
                     <Text style={styles.kantinName}>{canteen?.nama_kantin}</Text>
                  </View>
               </View>
               <View style={styles.statsStrip}>
                  <View style={styles.stat}>
                     <Text style={styles.statVal}>4.8/5</Text>
                     <Text style={styles.statLab}>RATING</Text>
                  </View>
                  <View style={styles.div} />
                  <View style={styles.stat}>
                     <Text style={styles.statVal}>{canteen?.porsi || 350}</Text>
                     <Text style={styles.statLab}>KAPASITAS</Text>
                  </View>
                  <View style={styles.div} />
                  <View style={styles.stat}>
                     <Text style={[styles.statVal, { color: '#10b981' }]}>Certified</Text>
                     <Text style={styles.statLab}>HEALTH</Text>
                  </View>
               </View>
            </View>

            {/* AUDIT TIMELINE */}
            <View style={styles.auditCard}>
               <Text style={styles.auditTitle}>Status Audit Sertifikasi</Text>

               <View style={styles.step}>
                  <View style={[styles.stepDot, { backgroundColor: '#10b981' }]}><Ionicons name="checkmark" size={12} color={WHITE} /></View>
                  <View style={styles.stepContent}>
                     <Text style={styles.stepName}>Registrasi Berkas</Text>
                     <Text style={styles.stepTime}>Diterima 12 Apr 2024</Text>
                  </View>
               </View>

               <View style={styles.step}>
                  <View style={[styles.stepDot, { backgroundColor: canteen?.verified_by_school ? '#10b981' : '#e2e8f0' }]}>
                     {canteen?.verified_by_school ? <Ionicons name="checkmark" size={12} color={WHITE} /> : null}
                  </View>
                  <View style={styles.stepContent}>
                     <Text style={styles.stepName}>Audit Admin Sekolah</Text>
                     <Text style={styles.stepTime}>{canteen?.verified_by_school ? 'Lolos Verifikasi' : 'Tahap Review'}</Text>
                  </View>
               </View>

               <View style={styles.stepLast}>
                  <View style={[styles.stepDot, { backgroundColor: verified ? '#10b981' : '#3b82f6' }]}>
                     {verified ? <Ionicons name="checkmark" size={12} color={WHITE} /> : <View style={styles.pulseDot} />}
                  </View>
                  <View style={styles.stepContent}>
                     <Text style={styles.stepName}>Verifikasi Akhir SPPG</Text>
                     <Text style={styles.stepTime}>{verified ? 'Sertifikat Diterbitkan' : 'Menunggu Otoritas'}</Text>
                  </View>
               </View>
            </View>

            {/* ACTION BUTTON */}
            {!verified && (
               <TouchableOpacity
                  style={[styles.verifyBtn, !canteen?.verified_by_school && { opacity: 0.5 }]}
                  onPress={handleVerify}
                  disabled={loading || !canteen?.verified_by_school}
               >
                  {loading ? <ActivityIndicator color={WHITE} /> : (
                     <>
                        <Ionicons name="ribbon-outline" size={22} color={WHITE} />
                        <Text style={styles.verifyBtnTxt}>Terbitkan Sertifikasi MBG</Text>
                     </>
                  )}
               </TouchableOpacity>
            )}

            {verified && (
               <View style={styles.successPanel}>
                  <Ionicons name="shield-checkmark" size={40} color="#10b981" />
                  <Text style={styles.successTxt}>UNIT PROD. TERVERIFIKASI</Text>
               </View>
            )}
         </ScrollView>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: SOFT_BG },
   header: { height: 180, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, overflow: 'hidden', elevation: 20 },
   headerBg: { flex: 1, backgroundColor: BLUE_PRIMARY, paddingHorizontal: 25 },
   batikImage: { opacity: 0.3, resizeMode: 'cover', tintColor: 'rgba(255,255,255,0.3)' },
   headerContent: { flexDirection: 'row', alignItems: 'center', marginTop: 45 },
   backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
   headerText: { marginLeft: 15 },
   hTitle: { color: WHITE, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
   hSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold', marginTop: 2, letterSpacing: 1 },
   docPanel: { marginHorizontal: 25, height: 200, borderRadius: 30, overflow: 'hidden', marginTop: -40, elevation: 20 },
   heroImg: { width: '100%', height: '100%' },
   overlayId: { position: 'absolute', top: 20, right: 20 },
   idBadge: { backgroundColor: 'rgba(11,30,63,0.8)', color: WHITE, fontSize: 9, fontWeight: '900', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
   infoCard: { backgroundColor: WHITE, marginHorizontal: 25, borderRadius: 30, padding: 25, marginTop: 20, elevation: 5 },
   infoRow: { flexDirection: 'row', alignItems: 'center' },
   iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
   schTag: { fontSize: 10, fontWeight: 'bold', color: BLUE_ACCENT, textTransform: 'uppercase' },
   kantinName: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginTop: 2 },
   statsStrip: { flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
   stat: { flex: 1, alignItems: 'center' },
   statVal: { fontSize: 14, fontWeight: '900', color: BLUE_PRIMARY },
   statLab: { fontSize: 8, color: '#94a3b8', fontWeight: 'bold', marginTop: 2 },
   div: { width: 1, height: '60%', backgroundColor: '#f1f5f9', alignSelf: 'center' },
   auditCard: { backgroundColor: WHITE, marginHorizontal: 25, borderRadius: 30, padding: 25, marginTop: 20, elevation: 3 },
   auditTitle: { fontSize: 14, fontWeight: '900', color: '#1e293b', marginBottom: 20 },
   step: { flexDirection: 'row', gap: 15, paddingBottom: 25, borderLeftWidth: 2, borderLeftColor: '#f1f5f9', marginLeft: 10 },
   stepLast: { flexDirection: 'row', gap: 15, marginLeft: 10 },
   stepDot: { width: 22, height: 22, borderRadius: 11, marginLeft: -12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
   stepContent: { marginTop: -2 },
   stepName: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
   stepTime: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
   pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: WHITE },
   verifyBtn: { backgroundColor: BLUE_PRIMARY, margin: 25, height: 64, borderRadius: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 10, shadowColor: BLUE_PRIMARY, shadowOpacity: 0.3, shadowRadius: 15 },
   verifyBtnTxt: { color: WHITE, fontSize: 16, fontWeight: '900' },
   successPanel: { alignItems: 'center', marginTop: 20, padding: 20 },
   successTxt: { fontSize: 12, fontWeight: '900', color: '#10b981', marginTop: 10, letterSpacing: 2 }
});
