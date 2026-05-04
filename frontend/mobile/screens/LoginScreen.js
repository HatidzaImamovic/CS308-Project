import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://10.0.87.105:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        navigation.navigate('Home', { user: data.user }); 
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../public/centrometalLogo.png')} style={styles.logo} />
      <TextInput style={styles.input} placeholder="Ime korisnika" value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Šifra" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Prijavi se" onPress={handleLogin} color='#1ca8b2' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  logo: { width: 300, height: 100, marginBottom: 20, alignSelf: 'center',  resizeMode: 'contain', marginTop: -150, },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  error: { color: 'red', marginBottom: 10 },
});