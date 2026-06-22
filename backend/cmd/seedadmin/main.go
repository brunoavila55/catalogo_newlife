package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

func main() {
	username := flag.String("user", "admin", "Admin username")
	password := flag.String("pass", "", "Admin password (required)")
	dbPath := flag.String("db", "./data/catalogo.db", "Path to SQLite database")

	flag.Parse()

	if *password == "" {
		fmt.Println("Error: --pass flag is required")
		flag.Usage()
		os.Exit(1)
	}

	db, err := sql.Open("sqlite", *dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Hash password
	bytes, err := bcrypt.GenerateFromPassword([]byte(*password), 12)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}
	hash := string(bytes)

	// Ensure table exists
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS admin_users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		log.Fatalf("Failed to create table: %v", err)
	}

	// Insert or replace
	_, err = db.Exec(`INSERT INTO admin_users (username, password_hash) VALUES (?, ?) 
		ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash`, *username, hash)
	if err != nil {
		log.Fatalf("Failed to insert user: %v", err)
	}

	fmt.Printf("Successfully created/updated admin user: %s\n", *username)
}
