package main

import (
	"encoding/json"
	"net/http"
)

type AdminStats struct {
	TotalProducts     int `json:"total_products"`
	InStock           int `json:"in_stock"`
	OutOfStock        int `json:"out_of_stock"`
	WithoutImages     int `json:"without_images"`
	WithoutSpecs      int `json:"without_specs"`
	EmptyCategories   int `json:"empty_categories"`
}

func getAdminStatsHandler(w http.ResponseWriter, r *http.Request) {
	var stats AdminStats

	err := db.QueryRow("SELECT COUNT(*) FROM products WHERE deleted_at IS NULL").Scan(&stats.TotalProducts)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = db.QueryRow("SELECT COUNT(*) FROM products WHERE status = 'Em estoque' AND deleted_at IS NULL").Scan(&stats.InStock)
	if err == nil {
		stats.OutOfStock = stats.TotalProducts - stats.InStock
	}

	err = db.QueryRow("SELECT COUNT(*) FROM products WHERE (images_json = '[]' OR images_json IS NULL) AND deleted_at IS NULL").Scan(&stats.WithoutImages)
	if err != nil {
		stats.WithoutImages = 0
	}

	err = db.QueryRow("SELECT COUNT(*) FROM products WHERE (specs_json = '{}' OR specs_json IS NULL) AND deleted_at IS NULL").Scan(&stats.WithoutSpecs)
	if err != nil {
		stats.WithoutSpecs = 0
	}

	err = db.QueryRow("SELECT COUNT(*) FROM categories c LEFT JOIN products p ON c.name = p.category AND p.deleted_at IS NULL WHERE p.id IS NULL AND c.deleted_at IS NULL").Scan(&stats.EmptyCategories)
	if err != nil {
		stats.EmptyCategories = 0
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
