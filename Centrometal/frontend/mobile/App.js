import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { getSpareParts } from './services/api';

export default function App() {
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    getSpareParts()
      .then(data => setStatus('Connected! Parts found: ' + data.length))
      .catch(err => setStatus('Error: ' + err.message));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{status}</Text>
    </View>
  );
}