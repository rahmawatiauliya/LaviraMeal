import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  Animated,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const BLUE_PRIMARY = '#0A1931';
const BLUE_DARK = '#000C24';
const GOLD = '#E2B13C';
const WHITE = '#FFFFFF';
const ACCENT = '#38BDF8';

export default function LandingScreen({ navigation }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* BACKGROUND AREA */}
      <ImageBackground 
        source={require('../../../assets/batik_cirebon.png')} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.12, resizeMode: 'cover' }}
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          
          {/* HEADER / LOGO */}
          <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
            <View style={styles.logoBadge}>
               <Image 
                 source={require('../../../assets/LOGO_LAVIRAMEAL_TRANSPARENT.png')} 
                 style={{ width: 36, height: 36, resizeMode: 'contain' }} 
               />
            </View>
            <Text style={styles.brandTitle}>
              LAVIRA<Text style={{ color: GOLD }}>MEAL</Text>
            </Text>
            <Text style={styles.brandSubtitle}>Makan Sehat · Anak Bangsa Hebat</Text>
          </Animated.View>

          {/* MAIN CONTENT CENTER */}
          <Animated.View style={[styles.centerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.iconShowcase}>
               {/* Ambient Glow behind the logo */}
               <View style={styles.ambientGlow} />
               <Image 
                 source={require('../../../assets/LOGO_LAVIRAMEAL_TRANSPARENT.png')} 
                 style={styles.heroLogo} 
               />
               {/* Floating elements */}
               <View style={[styles.floatBadge, { top: -5, right: -5 }]}>
                  <Feather name="shield" size={14} color={WHITE} />
               </View>
               <View style={[styles.floatBadge, { bottom: -5, left: -5, backgroundColor: GOLD }]}>
                  <Ionicons name="star" size={14} color={BLUE_DARK} />
               </View>
            </View>

            <Text style={styles.heroText}>
              Gizi Terbaik Untuk{"\n"}
              <Text style={{ color: GOLD }}>Generasi Bangsa</Text>
            </Text>
            
            <Text style={styles.descText}>
              Platform manajemen terpadu distribusi makan bergizi gratis, terintegrasi langsung dengan kantin mitra bersertifikasi.
            </Text>
          </Animated.View>

          {/* BOTTOM ACTIONS */}
          <Animated.View style={[styles.bottomSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.featureRow}>
               <View style={styles.featureItem}>
                 <Ionicons name="scan" size={20} color={ACCENT} />
                 <Text style={styles.featureText}>QR Scan</Text>
               </View>
               <View style={styles.featureItem}>
                 <MaterialCommunityIcons name="finance" size={20} color={ACCENT} />
                 <Text style={styles.featureText}>Laporan</Text>
               </View>
               <View style={styles.featureItem}>
                 <Feather name="shield" size={20} color={ACCENT} />
                 <Text style={styles.featureText}>Aman</Text>
               </View>
            </View>

            <TouchableOpacity 
              style={styles.mainButton}
              activeOpacity={0.8}
              onPress={() => navigation.replace('Login')}
            >
               <Text style={styles.mainButtonText}>Mulai Masuk Aplikasi</Text>
               <Ionicons name="arrow-forward" size={20} color={BLUE_DARK} />
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Versi 1.0.0 · Bekerja sama dengan Pemerintah Pusat
            </Text>
          </Animated.View>

        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLUE_DARK,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 8, 24, 0.88)', // Deep navy wash for batik
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(226, 177, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 177, 60, 0.35)',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  centerSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconShowcase: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(56, 189, 248, 0.12)', // Subtle royal cyan ambient glow
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 15,
  },
  heroLogo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  floatBadge: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  heroText: {
    fontSize: 32,
    fontWeight: '800',
    color: WHITE,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 16,
  },
  descText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  mainButton: {
    backgroundColor: GOLD,
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  mainButtonText: {
    color: BLUE_DARK,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  footerText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 10,
    marginTop: 24,
    fontWeight: '500',
  }
});
