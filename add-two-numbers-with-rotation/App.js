import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useState } from 'react';

export default function App() {
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [result, setResult] = useState(null);

  const addNumbers = () => {
    const sum = Number(num1) + Number(num2);
    setResult(sum);
  };

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const inputStyle = {
    width: isLandscape ? '20%' : '80%',
    marginHorizontal: isLandscape ? 10 : 0,
  };

  const buttonContainerStyle = {
    marginVertical: isLandscape ? 0 : 10,
    marginHorizontal: isLandscape ? 10 : 0,
  };

  const resultStyle = {
    marginTop: isLandscape ? 0 : 10,
    marginLeft: isLandscape ? 10 : 0,
    fontSize: 18,
    textAlign: 'center',
  };

  const contentStyle = {
    flexDirection: isLandscape ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isLandscape ? '#e0f7fa' : '#ffecb3' },
      ]}
    >
      <Image
        source={require('./assets/calc.webp')}
        style={styles.image}
        resizeMode="contain"
      />

      <View style={contentStyle}>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="Enter first number"
          keyboardType="numeric"
          value={num1}
          onChangeText={setNum1}
        />

        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="Enter second number"
          keyboardType="numeric"
          value={num2}
          onChangeText={setNum2}
        />

        <View style={buttonContainerStyle}>
          <Button title="Add" onPress={addNumbers} />
        </View>

        {result !== null && (
          <Text style={resultStyle}>Result: {result}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  image: {
    width: '100%',
    height: 120,
    marginBottom: 10,
  },
});
