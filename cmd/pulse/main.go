package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"sync"
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
	Port  int        `json:"port"`
	Theme ColorTheme `json:"theme"`
}

// PulseData holds real-time status info for a node
type PulseData struct {
	Name       string        `json:"name"`
	Latency    time.Duration `json:"latency"`
	Available  bool          `json:"available"`
	LastUpdate time.Time     `json:"lastUpdate"`
}

var (
	nodes    []Node
	pulseMap map[string]PulseData
	mutex    sync.RWMutex
)

func main() {
	// Load config
	if err := loadNodeConfig("nodes.json"); err != nil {
		log.Fatalf("Failed to load node config: %v", err)
	}

	// Init pulse map
	pulseMap = make(map[string]PulseData)

	// Start ping loop
	go startPingLoop()

	// Register API routes
	http.HandleFunc("/api/nodes", handleNodes)
	http.HandleFunc("/api/data", handlePulse)

	// Serve static files (frontend)
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

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
	mutex.RLock()
	defer mutex.RUnlock()
	json.NewEncoder(w).Encode(pulseMap)
}

func startPingLoop() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		<-ticker.C
		for _, node := range nodes {
			go pingNode(node)
		}
	}
}

func pingNode(node Node) {
	addr := fmt.Sprintf("%s:%d", node.IP, node.Port)
	start := time.Now()
	conn, err := net.DialTimeout("tcp", addr, 2*time.Second)
	latency := time.Since(start)
	if err != nil {
		mutex.Lock()
		pulseMap[node.Name] = PulseData{
			Name:       node.Name,
			Latency:    0,
			Available:  false,
			LastUpdate: time.Now(),
		}
		mutex.Unlock()
		return
	}
	conn.Close()

	mutex.Lock()
	pulseMap[node.Name] = PulseData{
		Name:       node.Name,
		Latency:    latency,
		Available:  true,
		LastUpdate: time.Now(),
	}
	mutex.Unlock()
}
