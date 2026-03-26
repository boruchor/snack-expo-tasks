import { useState } from 'react';
import { Text, View, ScrollView, TextInput, Button } from 'react-native';
import cheerio from 'cheerio-without-node-native';

export default function App() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState([]);

  const fetchData = () => {
    let fixedUrl = url;
    if (!fixedUrl.startsWith('http')) {
      fixedUrl = 'https://' + fixedUrl;
    }

    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(fixedUrl);

    fetch(proxyUrl)
      .then(response => response.text())
      .then(html => {
        const $ = cheerio.load(html);

        let data = [];

        const title = $('h1').first().text();
        if (title) data.push('Title: ' + title);

        $('p').each((i, el) => {
          const text = $(el).text().trim();
          if (text) data.push(text);
        });

        setContent(data.length ? data : ['No content found']);
      })
      .catch(err => {
        console.log(err);
        setContent(['Error loading website']);
      });
  };

  return (
    <View style={{ flex: 1, padding: 20, marginTop: 120, }}>
      <TextInput
        placeholder="Enter website URL"
        value={url}
        onChangeText={setUrl}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 10,
          borderRadius: 5
        }}
      />

      <Button title="Fetch & Parse" onPress={fetchData} />

      <ScrollView style={{ marginTop: 20 }}>
        {content.map((item, index) => (
          <Text key={index} style={{ marginBottom: 10 }}>
            {item}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}