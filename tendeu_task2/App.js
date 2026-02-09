import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function App() {
  const [x, setX] = useState('');
  const [result, setResult] = useState('');

  const calculate = () => {
    const value = parseFloat(x);

    if (isNaN(value)) {
      setResult('San engiziniz');
      return;
    }

    if (value < 0) {
      setResult('Shart qate: x ≥ 0 bolu kerek');
      return;
    }

    const y = 2 * value + 3;
    setResult(`Result: y = ${y}`);
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>y=2x+3</Text>

      <View style={styles.tableRow}>
        <Text style={styles.label}>x:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={x}
          onChangeText={setX}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Esepteu" onPress={calculate} />
      </View>

      <Text style={styles.result}>{result}</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 20
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  label: {
    width: 50,
    fontSize: 16
  },
  input: {
    borderWidth: 1,
    padding: 8,
    flex: 1
  },
  buttonContainer: {
    marginVertical: 15,
    alignItems: 'center'
  },
  result: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10
  }
});
