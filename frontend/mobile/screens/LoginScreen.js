import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from './styles/loginScreen';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useFocusEffect(
  useCallback(() => {
    return () => {
      setUsername('');
      setPassword('');
      setError('');
    };
  }, [])
);

  const handleLogin = async () => {
    try {
      const response = await fetch('http://10.0.202.231:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        navigation.navigate('Home', { user: data.user }); 
      } else {
        setError(data.message || 'Pogrešni podaci za prijavu');
      }
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../public/centrometalLogo.png')} style={styles.logo} />
      <TextInput style={[styles.input, error && styles.inputError]} placeholder="Ime korisnika" value={username} onChangeText={setUsername} />
      <TextInput style={[styles.input, error && styles.inputError]} placeholder="Šifra" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Prijavi se</Text>
      </TouchableOpacity>
    </View>
  );
}'#1ca8b2'