package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

// ColorTheme holds a node's primary, secondary, and tertiary colors
type ColorTheme struct {
	Primary   string `json:"primary"`
	Secondary string `json:"secondary"`
	Tertiary  string `json:"tertiary"`
}

// Node represents a cluster node
type Node struct {
	Name  string     `json:"name"`
	IP    string     `json:"ip"`
	Theme ColorTheme `json:"theme"`
}

// PulseData holds real-time status info for a node
type PulseData struct {
	Name       string        `json:"name"`
	Latency    time.Duration `json:"latency"`
	Available  bool          `json:"available"`
	LastUpdate time.Time     `json:"lastUpdate"`
}

var nodes []Node
var pulseMap map[string]PulseData

func main() {
	// Load config
	if err := loadNodeConfig("nodes.json"); err != nil {
		log.Fatalf("Failed to load node config: %v", err)
	}

	// Init pulse map
	pulseMap = make(map[string]PulseData)

	// TODO: Start ping loop here (goroutines, ticker, etc.)

	// Register API routes
	http.HandleFunc("/api/nodes", handleNodes)
	http.HandleFunc("/api/data", handlePulse)

	// Start HTTP server
	port := "5173"
	log.Printf("Starting server on port %s...", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func loadNodeConfig(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, &nodes)
}

func handleNodes(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(nodes)
}

func handlePulse(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(pulseMap)
}
