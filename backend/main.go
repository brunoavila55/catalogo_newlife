package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "modernc.org/sqlite"
)

var db *sql.DB

func main() {
	var err error
	os.MkdirAll("./data", os.ModePerm)
	db, err = sql.Open("sqlite", "./data/catalogo.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	initDB()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	
	allowedOrigins := []string{"*"}
	if os.Getenv("ENV") == "production" {
		allowedOrigins = []string{"https://catalogo.newlifefibra.com.br"}
	}
	
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: allowedOrigins,
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
	}))

	r.Get("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// Static route for uploads
	os.MkdirAll("./data/uploads", os.ModePerm)
	fs := http.StripPrefix("/uploads/", http.FileServer(http.Dir("./data/uploads")))
	r.Get("/uploads/*", func(w http.ResponseWriter, r *http.Request) {
		fs.ServeHTTP(w, r)
	})

	// Public GET routes
	r.Get("/api/v1/products", getProductsHandler)
	r.Get("/api/v1/products/{slug}", getProductBySlugHandler)
	r.Get("/api/v1/products/{slug}/pdf", generateProductPDFHandler)
	r.Get("/api/v1/categories", getCategoriesHandler)
	r.Get("/api/v1/tags", getTagsHandler)
	r.Get("/api/v1/types", getProductTypesHandler)
	
	// Login is public but rate limited
	r.With(RateLimitMiddleware).Post("/api/v1/admin/login", loginHandler)
	
	// Project PDF generation is public but rate limited
	r.With(RateLimitMiddleware).Post("/api/v1/projects/pdf", generateProjectPDFHandler)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(AuthMiddleware)
		
		r.Get("/api/v1/admin/stats", getAdminStatsHandler)
		
		r.Post("/api/v1/products", createProductHandler)
		r.Put("/api/v1/products/{id}", updateProductHandler)
		r.Delete("/api/v1/products/{id}", deleteProductHandler)
		
		r.Post("/api/v1/categories", createCategoryHandler)
		r.Put("/api/v1/categories/{id}", updateCategoryHandler)
		r.Delete("/api/v1/categories/{id}", deleteCategoryHandler)
		
		r.Post("/api/v1/tags", createTagHandler)
		r.Put("/api/v1/tags/{id}", updateTagHandler)
		r.Delete("/api/v1/tags/{id}", deleteTagHandler)
		
		r.Post("/api/v1/upload", uploadImageHandler)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	http.ListenAndServe(":"+port, r)
}

func initDB() {
	query := `
	CREATE TABLE IF NOT EXISTS categories (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT UNIQUE
	);

	CREATE TABLE IF NOT EXISTS tags (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT UNIQUE
	);

	CREATE TABLE IF NOT EXISTS products (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		slug TEXT UNIQUE,
		name TEXT,
		category TEXT,
		brand TEXT,
		specs TEXT,
		status TEXT,
		image_url TEXT,
		tags TEXT, -- JSON array of tags e.g. ["Wifi-6", "Datacenter"]
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS admin_users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err := db.Exec(query)
	if err != nil {
		log.Fatalf("Error creating table: %v", err)
	}

	// Add deleted_at columns for soft delete if they don't exist
	_, _ = db.Exec("ALTER TABLE categories ADD COLUMN deleted_at DATETIME DEFAULT NULL;")
	_, _ = db.Exec("ALTER TABLE tags ADD COLUMN deleted_at DATETIME DEFAULT NULL;")
	_, _ = db.Exec("ALTER TABLE products ADD COLUMN deleted_at DATETIME DEFAULT NULL;")
	
	// Add JSON columns for P1 features
	_, _ = db.Exec("ALTER TABLE products ADD COLUMN images_json TEXT DEFAULT '[]';")
	_, _ = db.Exec("ALTER TABLE products ADD COLUMN specs_json TEXT DEFAULT '{}';")

	// Performance Optimization PRAGMAS
	_, err = db.Exec(`
		PRAGMA journal_mode = WAL;
		PRAGMA synchronous = NORMAL;
		PRAGMA busy_timeout = 5000;
	`)
	if err != nil {
		log.Printf("Warning: Could not set PRAGMAs: %v", err)
	}

	// Create Indexes
	indexes := `
	CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
	CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
	CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
	CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
	`
	_, err = db.Exec(indexes)
	if err != nil {
		log.Printf("Warning: Could not create indexes: %v", err)
	}
}
