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
import ManajemenGuruScreen from './src/screen/main/admin_sekolah/ManajemenGuruScreen';
import HomeScreenGuru from './src/screen/main/guru/HomeScreenGuru';
import DaftarSiswaWaliScreen from './src/screen/main/guru/DaftarSiswaWaliScreen';
import AbsensiKonsumsiScreen from './src/screen/main/guru/AbsensiKonsumsiScreen';
import RekapKelasScreen from './src/screen/main/guru/RekapKelasScreen';
import AturJadwalPoinScreen from './src/screen/main/sppg/AturJadwalPoinScreen';
import MonitoringMenuScreen from './src/screen/main/shared/MonitoringMenuScreen';
import MenuDetailScreen from './src/screen/main/shared/MenuDetailScreen';
import KantinApprovalScreen from './src/screen/main/admin_sekolah/KantinApprovalScreen';
import RegisterScreen from './src/screen/auth/RegisterScreen';
import RegisterGuruScreen from './src/screen/auth/RegisterGuruScreen';

import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" translucent={true} />
        <Stack.Navigator initialRouteName="Login">
          {/* ... existing screens ... */}
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
            component= {AuditSekolahMenuScreen}
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
            name="HomeGuru"
            component={HomeScreenGuru}
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
            name="RegisterScreen"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegisterGuruScreen"
            component={RegisterGuruScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

