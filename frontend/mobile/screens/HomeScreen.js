import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import styles from './styles/homeScreen';

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


