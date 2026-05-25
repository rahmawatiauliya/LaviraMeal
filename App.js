import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Screens
import LoginScreen from './src/screen/auth/LoginScreen';
import Login1 from './src/screen/auth/login1';
import ForgotPasswordScreen from './src/screen/auth/ForgotPasswordScreen';
import HomeScreen from './src/screen/main/sppg/HomeScreenSppg';
import HomeSekolahScreen from './src/screen/main/admin_sekolah/HomeScreenSekolah';
import SekolahScreen from './src/screen/main/sppg/SekolahScreen';
import TambahSekolahScreen from './src/screen/main/sppg/TambahSekolahScreen';
import DetailSekolahScreen from './src/screen/main/sppg/DetailSekolahScreen';
import LaporanScreen from './src/screen/main/sppg/LaporanScreen';
import ProfilScreen from './src/screen/main/sppg/ProfilScreen';
import ProfilSekolahScreen from './src/screen/main/admin_sekolah/ProfilSekolahScreen';
import ProfilKantinScreen from './src/screen/main/kantin/ProfilKantinScreen';
import KantinScreen from './src/screen/main/sppg/KantinScreen';
import VerifikasiKantinScreen from './src/screen/main/sppg/VerifikasiKantinScreen';
import PersetujuanRegistrasiScreen from './src/screen/main/sppg/PersetujuanRegistrasiScreen';
import AuditSekolahMenuScreen from './src/screen/main/sppg/AuditSekolahMenuScreen';
import ManajemenKelasScreen from './src/screen/main/admin_sekolah/ManajemenKelasScreen';
import LaporanSekolahScreen from './src/screen/main/admin_sekolah/LaporanSekolahScreen';
import RiwayatSekolahScreen from './src/screen/main/admin_sekolah/RiwayatSekolahScreen';
import HomeScreenSiswa from './src/screen/main/siswa/HomeScreenSiswa';
import QRScannerScreen from './src/screen/main/siswa/QRScannerScreen';
import RiwayatSiswaScreen from './src/screen/main/siswa/RiwayatSiswaScreen';
import ProfilSiswaScreen from './src/screen/main/siswa/ProfilSiswaScreen';
import ManajemenGuruScreen from './src/screen/main/admin_sekolah/ManajemenGuruScreen';
import HomeScreenGuru from './src/screen/main/guru/HomeScreenGuru';
import DaftarSiswaWaliScreen from './src/screen/main/guru/DaftarSiswaWaliScreen';
import AbsensiKonsumsiScreen from './src/screen/main/guru/AbsensiKonsumsiScreen';
import RekapKelasScreen from './src/screen/main/guru/RekapKelasScreen';
import ProfilGuruScreen from './src/screen/main/guru/ProfilGuruScreen';
import RiwayatGuruScreen from './src/screen/main/guru/RiwayatGuruScreen';
import AturJadwalPoinScreen from './src/screen/main/sppg/AturJadwalPoinScreen';
import MonitoringMenuScreen from './src/screen/main/shared/MonitoringMenuScreen';
import MenuDetailScreen from './src/screen/main/shared/MenuDetailScreen';
import KantinApprovalScreen from './src/screen/main/admin_sekolah/KantinApprovalScreen';
import RegisterSppgScreen from './src/screen/auth/RegisterSppgScreen';
import RegisterKantinScreen from './src/screen/auth/RegisterKantinScreen';
import HomeScreenKantin from './src/screen/main/kantin/HomeScreenKantin';
import ScannerKantinScreen from './src/screen/main/kantin/ScannerKantinScreen';
import LaporanKantinScreen from './src/screen/main/kantin/LaporanKantinScreen';
import FeedbackScreen from './src/screen/main/siswa/FeedbackScreen';
import CanteenFeedbackScreen from './src/screen/main/shared/CanteenFeedbackScreen';
import ManajemenPoinScreen from './src/screen/main/admin_sekolah/ManajemenPoinScreen';
import PostMenuHarianScreen from './src/screen/main/kantin/PostMenuHarianScreen';
import RiwayatMenuHarianScreen from './src/screen/main/shared/RiwayatMenuHarianScreen';
import NotificationListScreen from './src/screen/main/shared/NotificationListScreen';
import LandingScreen from './src/screen/auth/LandingScreen';

import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" translucent={true} />
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen
            name="Landing"
            component={LandingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login1"
            component={Login1}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HomeSekolah"
            component={HomeSekolahScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Sekolah"
            component={SekolahScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TambahSekolah"
            component={TambahSekolahScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DetailSekolah"
            component={DetailSekolahScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Laporan"
            component={LaporanScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LaporanSekolah"
            component={LaporanSekolahScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManajemenKelas"
            component={ManajemenKelasScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RiwayatSekolah"
            component={RiwayatSekolahScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManajemenGuru"
            component={ManajemenGuruScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profil"
            component={ProfilScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfilSekolah"
            component={ProfilSekolahScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfilKantin"
            component={ProfilKantinScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Kantin"
            component={KantinScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PersetujuanRegistrasi"
            component={PersetujuanRegistrasiScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AuditSekolahMenu"
            component={AuditSekolahMenuScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HomeSiswa"
            component={HomeScreenSiswa}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="QRScanner"
            component={QRScannerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RiwayatSiswa"
            component={RiwayatSiswaScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfilSiswa"
            component={ProfilSiswaScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HomeGuru"
            component={HomeScreenGuru}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfilGuru"
            component={ProfilGuruScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RiwayatGuru"
            component={RiwayatGuruScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DaftarSiswaWali"
            component={DaftarSiswaWaliScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AbsensiKonsumsi"
            component={AbsensiKonsumsiScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RekapKelas"
            component={RekapKelasScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AturJadwalPoin"
            component={AturJadwalPoinScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MonitoringMenu"
            component={MonitoringMenuScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DetailPostinganMenu"
            component={MenuDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VerifikasiKantin"
            component={KantinApprovalScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegisterSppg"
            component={RegisterSppgScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegisterKantin"
            component={RegisterKantinScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HomeKantin"
            component={HomeScreenKantin}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ScannerKantin"
            component={ScannerKantinScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LaporanKantin"
            component={LaporanKantinScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Feedback"
            component={FeedbackScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CanteenFeedback"
            component={CanteenFeedbackScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManajemenPoin"
            component={ManajemenPoinScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PostMenuHarian"
            component={PostMenuHarianScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RiwayatMenuHarian"
            component={RiwayatMenuHarianScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NotificationList"
            component={NotificationListScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

