import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { 
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#446977' 
},
  logo: { 
    width: 300,
    height: 100,
    marginBottom: 20,
    alignSelf: 'center',
    resizeMode: 'contain',
    marginTop: -100,
    marginBottom: 50 
},
  input: { 
    borderWidth: 2,
    borderColor: '#ffffff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 15,
    textDecorationColor: '#ffffff',
    color: '#ffffff',
    placeholderTextColor: '#ffffff',
    backgroundColor: '#7aa7b8',
  },
  error: { 
    color: '#ff3232',
    marginBottom: 10 
},
  inputError: { 
    borderColor: '#ff3232',
    borderWidth: 2 
},
  button: {
    backgroundColor: '#1ca8b2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    width: '70%',
    alignSelf: 'center',
    },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    },
});