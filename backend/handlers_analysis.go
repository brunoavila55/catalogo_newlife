package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type EquipmentAnalysis struct {
	ID            int       `json:"id"`
	ProductID     int       `json:"product_id"`
	SpeedTest1Img string    `json:"speed_test_1_img"`
	SpeedTest2Img string    `json:"speed_test_2_img"`
	SpeedTest3Img string    `json:"speed_test_3_img"`
	Observations  string    `json:"observations"`
	CreatedAt     time.Time `json:"created_at"`
	
	// Optional joined fields for list
	ProductName string `json:"product_name,omitempty"`
	ProductSlug string `json:"product_slug,omitempty"`
}

func getAnalysisByProductHandler(w http.ResponseWriter, r *http.Request) {
	productIDStr := chi.URLParam(r, "productId")
	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		writeJSONError(w, "invalid_product_id", http.StatusBadRequest)
		return
	}

	var a EquipmentAnalysis
	var createdAt string
	var st1, st2, st3, obs sql.NullString

	err = db.QueryRow("SELECT id, product_id, speed_test_1_img, speed_test_2_img, speed_test_3_img, observations, created_at FROM equipment_analysis WHERE product_id = ?", productID).
		Scan(&a.ID, &a.ProductID, &st1, &st2, &st3, &obs, &createdAt)
	
	if err != nil {
		if err == sql.ErrNoRows {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": "analysis_not_found"})
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	a.SpeedTest1Img = st1.String
	a.SpeedTest2Img = st2.String
	a.SpeedTest3Img = st3.String
	a.Observations = obs.String
	t, _ := time.Parse(time.RFC3339, createdAt)
	a.CreatedAt = t

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(a)
}

func getAllAnalysisHandler(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT a.id, a.product_id, a.speed_test_1_img, a.speed_test_2_img, a.speed_test_3_img, a.observations, a.created_at, p.name, p.slug
		FROM equipment_analysis a
		JOIN products p ON a.product_id = p.id
		ORDER BY a.created_at DESC
	`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var analyses []EquipmentAnalysis
	for rows.Next() {
		var a EquipmentAnalysis
		var createdAt string
		var st1, st2, st3, obs sql.NullString
		
		if err := rows.Scan(&a.ID, &a.ProductID, &st1, &st2, &st3, &obs, &createdAt, &a.ProductName, &a.ProductSlug); err != nil {
			continue
		}
		
		a.SpeedTest1Img = st1.String
		a.SpeedTest2Img = st2.String
		a.SpeedTest3Img = st3.String
		a.Observations = obs.String
		t, _ := time.Parse(time.RFC3339, createdAt)
		a.CreatedAt = t
		
		analyses = append(analyses, a)
	}

	if analyses == nil {
		analyses = []EquipmentAnalysis{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analyses)
}

func createOrUpdateAnalysisHandler(w http.ResponseWriter, r *http.Request) {
	var req EquipmentAnalysis
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "bad_request", http.StatusBadRequest)
		return
	}

	if req.ProductID <= 0 {
		writeJSONValidationError(w, "product_id", "Produto é obrigatório")
		return
	}

	// Check if product exists
	var exists int
	err := db.QueryRow("SELECT 1 FROM products WHERE id = ? AND deleted_at IS NULL", req.ProductID).Scan(&exists)
	if err != nil {
		if err == sql.ErrNoRows {
			writeJSONValidationError(w, "product_id", "Produto não encontrado")
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Upsert query
	query := `
		INSERT INTO equipment_analysis (product_id, speed_test_1_img, speed_test_2_img, speed_test_3_img, observations)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(product_id) DO UPDATE SET
			speed_test_1_img = excluded.speed_test_1_img,
			speed_test_2_img = excluded.speed_test_2_img,
			speed_test_3_img = excluded.speed_test_3_img,
			observations = excluded.observations;
	`
	
	_, err = db.Exec(query, req.ProductID, req.SpeedTest1Img, req.SpeedTest2Img, req.SpeedTest3Img, req.Observations)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func deleteAnalysisHandler(w http.ResponseWriter, r *http.Request) {
	productIDStr := chi.URLParam(r, "productId")
	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		writeJSONError(w, "invalid_product_id", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM equipment_analysis WHERE product_id = ?", productID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
