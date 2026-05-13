import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Image,
  Alert,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_ACCENT = '#3b82f6';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';

export default function VerifikasiKantin({ navigation, route }) {
  const { width } = useWindowDimensions();
  const { canteen } = route.params;
  const [loading, setLoading] = useState(false);
  const [verifiedBySppg, setVerifiedBySppg] = useState(canteen.verified_by_sppg);

  const handleVerify = async () => {
    if (!canteen.verified_by_school) {
      Alert.alert("Akses Tertunda", "Verifikasi SPPG hanya dapat diberikan setelah Admin Sekolah menyetujui akun ini.");
      return;
    }

    Alert.alert(
      "Konfirmasi Verifikasi",
      "Apakah Anda sudah meninjau kelayakan fisik dan menu kantin ini?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Verifikasi Sekarang", 
          onPress: async () => {
            try {
              setLoading(true);
              const response = await apiClient.post('sppg/sppg_verify_kantin.php', {
                kantin_id: canteen.id,
                action: 'verify'
              });
              if (response.data && response.data.status === 'success') {
                setVerifiedBySppg(true);
                Alert.alert("Berhasil", "Akun Kantin telah aktif dan bersertifikat MBG.");
              }
            } catch (error) {
              // Local update for simulation
              setVerifiedBySppg(true);
              Alert.alert("Sukses", "Kantin berhasil diverifikasi (Mode Simulasi)");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.header}>
         <Image source={require('../../../../assets/batik_cirebon.png')} style={[StyleSheet.absoluteFillObject, { opacity: 0.05, resizeMode: 'repeat', tintColor: WHITE }]} />
         <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
               <Feather name="arrow-left" size={24} color={WHITE} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 15 }}>
               <Text style={styles.headerTitle}>Detail Verifikasi</Text>
               <Text style={styles.headerSubtitle}>{canteen.nama_kantin}</Text>
            </View>
         </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
         {/* STATUS INDICATOR */}
         <View style={styles.statusHero}>
            <View style={[styles.statusCard, { backgroundColor: verifiedBySppg ? '#dcfce7' : '#fff7ed' }]}>
               <Ionicons name={verifiedBySppg ? "shield-checkmark" : "time"} size={32} color={verifiedBySppg ? "#166534" : "#c2410c"} />
               <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={[styles.statusTitle, { color: verifiedBySppg ? "#166534" : "#c2410c" }]}>
                    {verifiedBySppg ? "Sertifikasi MBG Aktif" : "Menunggu Tinjauan SPPG"}
                  </Text>
                  <Text style={[styles.statusDesc, { color: verifiedBySppg ? "#15803d" : "#9a3412" }]}>
                    {verifiedBySppg ? "Kantin sudah layak beroperasi penuh." : "Silakan periksa rangkuman di bawah."}
                  </Text>
               </View>
            </View>
         </View>

         {/* SUMMARY SECTION */}
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ringkasan Registrasi</Text>
            <View style={styles.infoCard}>
               <View style={styles.infoRow}><Text style={styles.infoLabel}>Pengelola</Text><Text style={styles.infoValue}>{canteen.pengelola}</Text></View>
               <View style={styles.infoRow}><Text style={styles.infoLabel}>Sekolah Induk</Text><Text style={styles.infoValue}>{canteen.sekolah}</Text></View>
               <View style={styles.divider} />
               <Text style={styles.descP}>{canteen.desc}</Text>
            </View>
         </View>

         {/* PHOTO EVIDENCE */}
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dokumentasi Kelayakan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
               <View style={styles.photoBox}>
                  <Image source={{ uri: canteen.foto_kantin }} style={styles.evidenceImg} />
                  <View style={styles.photoLabel}><Text style={styles.photoLabelTxt}>AREA KANTIN</Text></View>
               </View>
               <View style={styles.photoBox}>
                  <Image source={{ uri: canteen.foto_makanan }} style={styles.evidenceImg} />
                  <View style={styles.photoLabel}><Text style={styles.photoLabelTxt}>SAMPEL MENU MBG</Text></View>
               </View>
            </ScrollView>
         </View>

         {/* AUDIT TRAIL */}
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>Laporan Verifikasi Bertingkat</Text>
            <View style={styles.auditItem}>
               <View style={[styles.auditDot, { backgroundColor: canteen.verified_by_school ? '#10b981' : '#cbd5e1' }]} />
               <View style={styles.auditLine} />
               <View style={styles.auditContent}>
                  <Text style={styles.auditRole}>Verifikasi Admin Sekolah</Text>
                  <Text style={styles.auditStatus}>{canteen.verified_by_school ? 'DISETUJUI' : 'MENUNGGU'}</Text>
                  <Text style={styles.auditMeta}>Audit kelayakan fisik harian</Text>
               </View>
               <Ionicons name={canteen.verified_by_school ? "checkmark-circle" : "hourglass-outline"} size={22} color={canteen.verified_by_school ? "#10b981" : "#94a3b8"} />
            </View>
            <View style={styles.auditItem}>
               <View style={[styles.auditDot, { backgroundColor: verifiedBySppg ? '#3b82f6' : '#cbd5e1' }]} />
               <View style={styles.auditContent}>
                  <Text style={styles.auditRole}>Verifikasi Admin SPPG</Text>
                  <Text style={styles.auditStatus}>{verifiedBySppg ? 'AKTIF' : 'MENUNGGU TINJAUAN'}</Text>
                  <Text style={styles.auditMeta}>Audit standar nutrisi & sertifikasi</Text>
               </View>
               <Ionicons name={verifiedBySppg ? "checkmark-circle" : "eye-outline"} size={22} color={verifiedBySppg ? "#3b82f6" : "#94a3b8"} />
            </View>
         </View>
      </ScrollView>

      {/* ACTION FOOTER */}
      {!verifiedBySppg && (
        <View style={styles.footer}>
           <TouchableOpacity 
             style={[styles.verifyBtn, !canteen.verified_by_school && { opacity: 0.6 }]} 
             onPress={handleVerify}
             disabled={loading}
           >
              {loading ? <ActivityIndicator color={WHITE} /> : (
                <>
                  <MaterialCommunityIcons name="clipboard-check" size={24} color={WHITE} />
                  <Text style={styles.verifyBtnTxt}>Verifikasi Layak MBG</Text>
                </>
              )}
           </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_BG },
  header: { backgroundColor: BLUE_PRIMARY, paddingTop: 60, paddingHorizontal: 25, paddingBottom: 30, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  statusHero: { paddingHorizontal: 25, marginTop: -25, zIndex: 10 },
  statusCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 25, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  statusTitle: { fontSize: 16, fontWeight: '900' },
  statusDesc: { fontSize: 12, marginTop: 2 },
  section: { marginTop: 30, paddingHorizontal: 25 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 15 },
  infoCard: { backgroundColor: WHITE, borderRadius: 25, padding: 20, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#1e293b', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },
  descP: { fontSize: 14, color: '#475569', lineHeight: 22 },
  photoList: { marginHorizontal: -5, paddingRight: 25 },
  photoBox: { width: '75%', height: 200, marginRight: 15, borderRadius: 25, overflow: 'hidden', position: 'relative' },
  evidenceImg: { width: '100%', height: '100%' },
  photoLabel: { position: 'absolute', bottom: 15, left: 15, backgroundColor: 'rgba(11,30,63,0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  photoLabelTxt: { color: WHITE, fontSize: 10, fontWeight: '900' },
  auditItem: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  auditDot: { width: 14, height: 14, borderRadius: 7, zIndex: 2, marginTop: 4 },
  auditLine: { position: 'absolute', left: 6, top: 20, bottom: -20, width: 2, backgroundColor: '#f1f5f9' },
  auditContent: { flex: 1, marginLeft: 20 },
  auditRole: { fontSize: 15, fontWeight: '900', color: '#1e293b' },
  auditStatus: { fontSize: 10, fontWeight: '900', color: BLUE_ACCENT, marginTop: 4 },
  auditMeta: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25, backgroundColor: WHITE, paddingBottom: 40, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 40 },
  verifyBtn: { backgroundColor: BLUE_PRIMARY, borderRadius: 20, paddingVertical: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  verifyBtnTxt: { color: WHITE, fontSize: 16, fontWeight: 'bold' },
});
