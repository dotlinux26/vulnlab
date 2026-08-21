package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

var flag = getenv("FLAG", "FLAG{c9}")

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok","uptime":"stable"}`)
	})

	mux.HandleFunc("/info", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"service":"flag-service","version":"1.0.0","region":"internal-dc1","owner":"platform-team"}`)
	})

	mux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		fmt.Fprint(w, "# HELP http_requests_total Total requests\n# TYPE http_requests_total counter\nhttp_requests_total{endpoint=\"health\"} 18234\nhttp_requests_total{endpoint=\"info\"} 912\ngo_goroutines 7\n")
	})

	mux.HandleFunc("/flag", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		fmt.Fprintf(w, "%s\n", flag)
	})

	log.Println("flag-service listening on :8080 (INTERNAL ONLY)")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
