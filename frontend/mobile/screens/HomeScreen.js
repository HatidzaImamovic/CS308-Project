import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';

const normalizeUserName = (user) => {
  const firstName = user?.fName || user?.fname || user?.firstName || user?.first_name;
  const lastName = user?.lName || user?.lname || user?.lastName || user?.last_name;
  if (firstName && lastName) {
    return { firstName: firstName.trim(), lastName: lastName.trim() };
  }

  const fullName = (user?.name || user?.username || '').trim();
  if (fullName.includes(' ')) {
    const [first, ...rest] = fullName.split(/\s+/);
    return { firstName: first, lastName: rest.join(' ') };
  }

  return { firstName: firstName?.trim() || fullName || '', lastName: lastName?.trim() || '' };
};

const Header = ({ user }) => {
  const { firstName, lastName } = normalizeUserName(user);
  const userRole = user?.role || 'Serviser';

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.headerIconBox}>
          <Image source={require('../public/centrometalLogo.png')} style={styles.logoImage} />
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.headerUserInfo}>
          <Text style={styles.headerUserName}>{firstName && lastName ? `${firstName} ${lastName}` : firstName ? firstName : 'Korisnik'}</Text>
          <Text style={styles.headerUserRole}>{userRole}</Text>
        </View>
      </View>
    </View>
  );
};

const ActionCard = ({ iconSource, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.actionIconBox}>
      <Image source={iconSource} style={styles.actionIcon} />
    </View>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

const StatBox = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export default function HomeScreen({ route, navigation }) {
  const { user } = route?.params || {};

  const handleKreirajNalog = () => {
    // navigation.navigate('KreirajNalog');
    console.log('Kreiraj nalog pressed');
  };

  const handleShop = () => {
    // navigation.navigate('Shop');
    console.log('Shop pressed');
  };

  const handleFinancije = () => {
    // navigation.navigate('Financije');
    console.log('Financije pressed');
  };

  const handleOdjava = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#446977" />
      <Header user={user} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Dobrodošli natrag</Text>
          <Text style={styles.welcomeSubtitle}>Odaberite akciju s kojom želite nastaviti</Text>
        </View>

        <View style={styles.cardsRow}>
          <ActionCard
            iconSource={require('../public/nalog.png')}
            title="Servisni nalog"
            subtitle="Dodaj novi nalog ili nastavi s postojećim"
            onPress={handleKreirajNalog}
          />
          <ActionCard
            iconSource={require('../public/shop.png')}
            title="Shop"
            subtitle="Rezervni dijelovi i oprema"
            onPress={handleShop}
          />
          <ActionCard
            iconSource={require('../public/financije.png')}
            title="Financije"
            subtitle="Računi, plaćanja i izvještaji"
            onPress={handleFinancije}
          />
        </View>

        <View style={styles.quickOverview}>
          <Text style={styles.quickOverviewLabel}>BRZI PREGLED</Text>
          <View style={styles.statsRow}>
            <StatBox label="Otvoreni servisi" value="12" />
            <View style={styles.statDivider} />
            <StatBox label="Završeni servisi" value="38" />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleOdjava} activeOpacity={0.75}>
          <Text style={styles.logoutText}>Odjava</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#446977' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#446977',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#7aa7b8',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBox: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#446977', alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 200, height: 100, resizeMode: 'contain', marginLeft:115 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerUserInfo: { alignItems: 'flex-end' },
  headerUserName: { color: '#ffffff', fontSize: 20, fontWeight: '600' },
  headerUserRole: { color: '#bec5d5', fontSize: 17, marginTop: 1 },
  scrollView: { flex: 1, backgroundColor: '#446977' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  welcomeSection: { marginBottom: 24, marginTop: 8 },
  welcomeTitle: { color: '#ffffff', fontSize: 24, fontWeight: '700', letterSpacing: 0.2 },
  welcomeSubtitle: { color: '#ffffff', fontSize: 14, marginTop: 4 },
  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionCard: { flex: 1, backgroundColor: '#7aa7b8', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#ffffff' },
  actionIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#446977', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionIcon: { width: 28, height: 28, resizeMode: 'contain' },
  actionTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  actionSubtitle: { color: '#ffffff', fontSize: 13, lineHeight: 18 },
  quickOverview: { backgroundColor: '#7aa7b8', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#ffffff', marginBottom: 24 },
  quickOverviewLabel: { color: '#ffffff', fontSize: 14, fontWeight: '700', letterSpacing: 1.2, marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#ffffff', fontSize: 14, textAlign: 'center', marginBottom: 6 },
  statValue: { color: '#ffffff', fontSize: 34, fontWeight: '700' },
  statDivider: { width: 1, height: 40, backgroundColor: '#ffffff' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffffff', borderRadius: 12, paddingVertical: 16, gap: 8, backgroundColor: '#7aa7b8' },
  logoutIcon: { color: '#e05a5a', fontSize: 16, fontWeight: '700' },
  logoutText: { color: '#e05a5a', fontSize: 15, fontWeight: '600' },
});