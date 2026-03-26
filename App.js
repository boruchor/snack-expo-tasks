import * as React from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from "react-native";
import {
  Provider as PaperProvider,
  Text,
  Card,
  Appbar,
  Button,
} from "react-native-paper";

export default function App() {
  const [screen, setScreen] = React.useState("list");
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMatch, setSelectedMatch] = React.useState(null);

  React.useEffect(() => {
    fetch(
      "https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328"
    )
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // main page
  if (screen === "list") {
    return (
      <PaperProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, padding: 16 }}>
            <Text variant="headlineMedium" style={{ marginBottom: 16 }}>
              Premier League Fixtures
            </Text>

            {loading ? (
              <ActivityIndicator />
            ) : (
              <FlatList
                data={matches}
                keyExtractor={(item) => item.idEvent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedMatch(item);
                      setScreen("match");
                    }}
                  >
                    <Card style={{ marginBottom: 16 }}>
                      <Card.Content>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <TeamBlock
                            teamId={item.idHomeTeam}
                            teamName={item.strHomeTeam}
                          />
                          <Text>VS</Text>
                          <TeamBlock
                            teamId={item.idAwayTeam}
                            teamName={item.strAwayTeam}
                          />
                        </View>

                        <Text
                          style={{
                            marginTop: 12,
                            textAlign: "center",
                            opacity: 0.7,
                          }}
                        >
                          {item.dateEvent} • {item.strTime}
                        </Text>
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  // match
  if (screen === "match" && selectedMatch) {
    return (
      <PaperProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <MatchScreen
            match={selectedMatch}
            goBack={() => {
              setSelectedMatch(null);
              setScreen("list");
            }}
          />
        </SafeAreaView>
      </PaperProvider>
    );
  }

  return null;
}

function TeamBlock({ teamId, teamName }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Image
        source={{
          uri: `https://www.thesportsdb.com/images/media/team/badge/${teamId}.png`,
        }}
        style={{ width: 50, height: 50, resizeMode: "contain" }}
      />
      <Text style={{ marginTop: 6, textAlign: "center" }}>
        {teamName}
      </Text>
    </View>
  );
}

function MatchScreen({ match, goBack }) {
  const [tab, setTab] = React.useState("details");
  const [homePlayers, setHomePlayers] = React.useState([]);
  const [awayPlayers, setAwayPlayers] = React.useState([]);
  const [loadingHome, setLoadingHome] = React.useState(true);
  const [loadingAway, setLoadingAway] = React.useState(true);
  const [selectedTeam, setSelectedTeam] = React.useState("home");

  React.useEffect(() => {
    setLoadingHome(true);
    fetch(
      `https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${match.idHomeTeam}`
    )
      .then((res) => res.json())
      .then((data) => {
        setHomePlayers(data.player || []);
        setLoadingHome(false);
      })
      .catch(() => setLoadingHome(false));
  }, [match]);

  React.useEffect(() => {
    setLoadingAway(true);
    fetch(
      `https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${match.idAwayTeam}`
    )
      .then((res) => res.json())
      .then((data) => {
        setAwayPlayers(data.player || []);
        setLoadingAway(false);
      })
      .catch(() => setLoadingAway(false));
  }, [match]);

  const renderContent = () => {
    if (tab === "details") {
      return (
        <View style={{ padding: 20 }}>
          <Text variant="titleLarge">
            {match.strHomeTeam} vs {match.strAwayTeam}
          </Text>
          <Text>Stadium: {match.strVenue || "Not available"}</Text>
          <Text>Date: {match.dateEvent}</Text>
          <Text>Time: {match.strTime}</Text>
          <Text>League: {match.strLeague}</Text>
        </View>
      );
    }

    if (tab === "squad") {
      const players = selectedTeam === "home" ? homePlayers : awayPlayers;
      const loading = selectedTeam === "home" ? loadingHome : loadingAway;

      return (
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginVertical: 10,
            }}
          >
            <Button
              mode={selectedTeam === "home" ? "contained" : "outlined"}
              onPress={() => setSelectedTeam("home")}
            >
              {match.strHomeTeam}
            </Button>
            <Button
              mode={selectedTeam === "away" ? "contained" : "outlined"}
              onPress={() => setSelectedTeam("away")}
            >
              {match.strAwayTeam}
            </Button>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={players}
              keyExtractor={(item) => item.idPlayer}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <Card style={{ marginBottom: 12 }}>
                  <Card.Content>
                    <Text>{item.strPlayer}</Text>
                    <Text style={{ opacity: 0.7 }}>
                      Position: {item.strPosition}
                    </Text>
                  </Card.Content>
                </Card>
              )}
            />
          )}
        </View>
      );
    }

    if (tab === "stats") {
      return (
        <View style={{ padding: 20 }}>
          <Text>Season: {match.strSeason}</Text>
          <Text>Status: {match.strStatus || "Upcoming"}</Text>
          <Text>Round: {match.intRound}</Text>
        </View>
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={goBack} />
        <Appbar.Content
          title={`${match.strHomeTeam} vs ${match.strAwayTeam}`}
        />
      </Appbar.Header>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 10,
        }}
      >
        <Button
          mode={tab === "details" ? "contained" : "outlined"}
          onPress={() => setTab("details")}
        >
          Details
        </Button>
        <Button
          mode={tab === "squad" ? "contained" : "outlined"}
          onPress={() => setTab("squad")}
        >
          Squad
        </Button>
        <Button
          mode={tab === "stats" ? "contained" : "outlined"}
          onPress={() => setTab("stats")}
        >
          Stats
        </Button>
      </View>

      <View style={{ flex: 1 }}>{renderContent()}</View>
    </View>
  );
}

