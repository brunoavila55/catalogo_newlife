package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Tag struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Product struct {
	ID       int               `json:"id"`
	Slug     string            `json:"slug"`
	Name     string            `json:"name"`
	Category string            `json:"category"`
	Brand    string            `json:"brand"`
	Specs    string            `json:"specs,omitempty"`
	Status   string            `json:"status"`
	ImageURL string            `json:"image_url"`
	Tags     []string          `json:"tags"`
	Images   []string          `json:"images_json"`
	SpecsMap map[string]string `json:"specs_json"`
}

type PaginatedResponse struct {
	Data       []Product `json:"data"`
	Total      int       `json:"total"`
	Page       int       `json:"page"`
	TotalPages int       `json:"total_pages"`
}

func writeJSONValidationError(w http.ResponseWriter, field, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error": "validation_failed",
		"fields": map[string]string{
			field: message,
		},
	})
}

// Handlers for products
func getProductsHandler(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	q := r.URL.Query().Get("q")
	filter := r.URL.Query().Get("filter")

	page := 1
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	limit := 10
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}
	offset := (page - 1) * limit

	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}

	if q != "" {
		whereClause += " AND (name LIKE ? OR brand LIKE ?)"
		searchQuery := "%" + q + "%"
		args = append(args, searchQuery, searchQuery)
	}

	if filter == "no-image" {
		whereClause += " AND (images_json = '[]' OR images_json IS NULL)"
	} else if filter == "no-specs" {
		whereClause += " AND (specs_json = '{}' OR specs_json IS NULL)"
	} else if filter == "out-of-stock" {
		whereClause += " AND status = 'Em falta'"
	} else if filter == "in-stock" {
		whereClause += " AND status = 'Em estoque'"
	}

	var total int
	err := db.QueryRow("SELECT COUNT(*) FROM products "+whereClause, args...).Scan(&total)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	query := "SELECT id, slug, name, category, brand, status, image_url, specs, tags, images_json, specs_json FROM products " + whereClause + " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		var tagsJSON, imagesJSON, specsJSON string
		if err := rows.Scan(&p.ID, &p.Slug, &p.Name, &p.Category, &p.Brand, &p.Status, &p.ImageURL, &p.Specs, &tagsJSON, &imagesJSON, &specsJSON); err != nil {
			continue
		}
		
		json.Unmarshal([]byte(tagsJSON), &p.Tags)
		if p.Tags == nil {
			p.Tags = []string{}
		}

		json.Unmarshal([]byte(imagesJSON), &p.Images)
		if p.Images == nil {
			p.Images = []string{}
		}

		json.Unmarshal([]byte(specsJSON), &p.SpecsMap)
		if p.SpecsMap == nil {
			p.SpecsMap = make(map[string]string)
		}
		
		products = append(products, p)
	}
	if products == nil {
		products = []Product{}
	}

	response := PaginatedResponse{
		Data:       products,
		Total:      total,
		Page:       page,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func createProductHandler(w http.ResponseWriter, r *http.Request) {
	var p Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		writeJSONError(w, "bad_request", http.StatusBadRequest)
		return
	}

	p.Name = strings.TrimSpace(p.Name)
	p.Category = strings.TrimSpace(p.Category)

	if p.Name == "" {
		writeJSONValidationError(w, "name", "Nome é obrigatório")
		return
	}
	if len(p.Name) > 200 {
		writeJSONValidationError(w, "name", "Nome não pode ter mais que 200 caracteres")
		return
	}
	if p.Category == "" {
		writeJSONValidationError(w, "category", "Categoria é obrigatória")
		return
	}
	if len(p.Specs) > 5000 {
		writeJSONValidationError(w, "specs", "Especificações não podem exceder 5000 caracteres")
		return
	}

	p.Slug = strings.ToLower(strings.ReplaceAll(p.Name, " ", "-"))
	p.Slug = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return -1
	}, p.Slug)
	
	if p.Tags == nil { p.Tags = []string{} }
	tagsJSON, _ := json.Marshal(p.Tags)

	if p.Images == nil { p.Images = []string{} }
	imagesJSON, _ := json.Marshal(p.Images)

	if p.SpecsMap == nil { p.SpecsMap = make(map[string]string) }
	specsJSON, _ := json.Marshal(p.SpecsMap)

	stmt, err := db.Prepare("INSERT INTO products (slug, name, category, brand, specs, status, image_url, tags, images_json, specs_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(p.Slug, p.Name, p.Category, p.Brand, p.Specs, p.Status, p.ImageURL, string(tagsJSON), string(imagesJSON), string(specsJSON))
	if err != nil {
		log.Printf("DB Exec Error: %v\n", err)
		http.Error(w, "Erro ao salvar no banco", http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	p.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

func updateProductHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var p Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		writeJSONError(w, "bad_request", http.StatusBadRequest)
		return
	}

	p.Name = strings.TrimSpace(p.Name)
	p.Category = strings.TrimSpace(p.Category)

	if p.Name == "" {
		writeJSONValidationError(w, "name", "Nome é obrigatório")
		return
	}
	if len(p.Name) > 200 {
		writeJSONValidationError(w, "name", "Nome não pode ter mais que 200 caracteres")
		return
	}
	if p.Category == "" {
		writeJSONValidationError(w, "category", "Categoria é obrigatória")
		return
	}
	if len(p.Specs) > 5000 {
		writeJSONValidationError(w, "specs", "Especificações não podem exceder 5000 caracteres")
		return
	}

	p.Slug = strings.ToLower(strings.ReplaceAll(p.Name, " ", "-"))
	p.Slug = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return -1
	}, p.Slug)
	
	if p.Tags == nil { p.Tags = []string{} }
	tagsJSON, _ := json.Marshal(p.Tags)

	if p.Images == nil { p.Images = []string{} }
	imagesJSON, _ := json.Marshal(p.Images)

	if p.SpecsMap == nil { p.SpecsMap = make(map[string]string) }
	specsJSON, _ := json.Marshal(p.SpecsMap)

	stmt, err := db.Prepare("UPDATE products SET slug=?, name=?, category=?, brand=?, specs=?, status=?, image_url=?, tags=?, images_json=?, specs_json=? WHERE id=? AND deleted_at IS NULL")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(p.Slug, p.Name, p.Category, p.Brand, p.Specs, p.Status, p.ImageURL, string(tagsJSON), string(imagesJSON), string(specsJSON), id)
	if err != nil {
		http.Error(w, "Erro ao atualizar banco", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Produto não encontrado", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

func deleteProductHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	// Fetch and delete images from disk
	var imageUrl string
	var imagesJson string
	err := db.QueryRow("SELECT image_url, images_json FROM products WHERE id = ?", id).Scan(&imageUrl, &imagesJson)
	if err == nil {
		if imageUrl != "" && strings.HasPrefix(imageUrl, "/uploads/") {
			os.Remove("./data" + imageUrl)
			os.Remove("./data" + strings.Replace(imageUrl, ".jpg", "_thumb.jpg", 1))
		}
		var images []string
		if err := json.Unmarshal([]byte(imagesJson), &images); err == nil {
			for _, img := range images {
				if strings.HasPrefix(img, "/uploads/") {
					os.Remove("./data" + img)
					os.Remove("./data" + strings.Replace(img, ".jpg", "_thumb.jpg", 1))
				}
			}
		}
	}

	stmt, err := db.Prepare("UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL")
	if err != nil {
		writeJSONError(w, "internal_error", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(id)
	if err != nil {
		http.Error(w, "Erro ao deletar", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Produto não encontrado", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Handlers for categories
func getCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name FROM categories WHERE deleted_at IS NULL")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name); err != nil {
			continue
		}
		categories = append(categories, c)
	}
	if categories == nil {
		categories = []Category{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func createCategoryHandler(w http.ResponseWriter, r *http.Request) {
	var c Category
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		writeJSONError(w, "bad_request", http.StatusBadRequest)
		return
	}

	c.Name = strings.TrimSpace(c.Name)
	if c.Name == "" {
		writeJSONValidationError(w, "name", "Nome da categoria obrigatório")
		return
	}
	if len(c.Name) > 50 {
		writeJSONValidationError(w, "name", "Nome deve ter no máximo 50 caracteres")
		return
	}

	stmt, err := db.Prepare("INSERT INTO categories (name) VALUES (?)")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(strings.TrimSpace(c.Name))
	if err != nil {
		http.Error(w, "Erro ao criar categoria ou já existente", http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	c.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

func updateCategoryHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var c Category
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		writeJSONError(w, "bad_request", http.StatusBadRequest)
		return
	}

	c.Name = strings.TrimSpace(c.Name)
	if c.Name == "" {
		writeJSONValidationError(w, "name", "Nome da categoria obrigatório")
		return
	}
	if len(c.Name) > 50 {
		writeJSONValidationError(w, "name", "Nome deve ter no máximo 50 caracteres")
		return
	}

	stmt, err := db.Prepare("UPDATE categories SET name=? WHERE id=? AND deleted_at IS NULL")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(strings.TrimSpace(c.Name), id)
	if err != nil {
		http.Error(w, "Erro ao atualizar categoria", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Categoria não encontrada", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

func deleteCategoryHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	var catName string
	err := db.QueryRow("SELECT name FROM categories WHERE id = ? AND deleted_at IS NULL", id).Scan(&catName)
	if err != nil {
		http.Error(w, "Categoria não encontrada", http.StatusNotFound)
		return
	}

	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM products WHERE category = ? AND deleted_at IS NULL", catName).Scan(&count)
	if err == nil && count > 0 {
		http.Error(w, "Existem produtos atrelados a esta categoria. Impossível excluir.", http.StatusConflict)
		return
	}
	
	stmt, err := db.Prepare("UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(id)
	if err != nil {
		http.Error(w, "Erro ao deletar categoria", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Handlers for tags
func getTagsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name FROM tags WHERE deleted_at IS NULL")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tags []Tag
	for rows.Next() {
		var t Tag
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			continue
		}
		tags = append(tags, t)
	}
	if tags == nil {
		tags = []Tag{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}

func getProductBySlugHandler(w http.ResponseWriter, r *http.Request) {
	slugParam := chi.URLParam(r, "slug")
	var p Product
	var tagsJSON, imagesJSON, specsJSON string

	query := "SELECT id, slug, name, category, brand, status, image_url, specs, tags, images_json, specs_json FROM products WHERE slug = ? AND deleted_at IS NULL"
	err := db.QueryRow(query, slugParam).Scan(&p.ID, &p.Slug, &p.Name, &p.Category, &p.Brand, &p.Status, &p.ImageURL, &p.Specs, &tagsJSON, &imagesJSON, &specsJSON)
	
	if err == sql.ErrNoRows {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.Unmarshal([]byte(tagsJSON), &p.Tags)
	if p.Tags == nil { p.Tags = []string{} }

	json.Unmarshal([]byte(imagesJSON), &p.Images)
	if p.Images == nil { p.Images = []string{} }

	json.Unmarshal([]byte(specsJSON), &p.SpecsMap)
	if p.SpecsMap == nil { p.SpecsMap = make(map[string]string) }

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

func getProductTypesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`SELECT DISTINCT json_extract(specs_json, '$._type') FROM products WHERE json_extract(specs_json, '$._type') IS NOT NULL AND json_extract(specs_json, '$._type') != '' AND deleted_at IS NULL`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var types []string
	for rows.Next() {
		var t sql.NullString
		if err := rows.Scan(&t); err == nil && t.Valid {
			types = append(types, t.String)
		}
	}
	if types == nil {
		types = []string{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(types)
}

func createTagHandler(w http.ResponseWriter, r *http.Request) {
	var t Tag
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		writeJSONError(w, "bad_request", http.StatusBadRequest)
		return
	}

	t.Name = strings.TrimSpace(t.Name)
	if t.Name == "" {
		writeJSONValidationError(w, "name", "Nome da tag obrigatório")
		return
	}
	if len(t.Name) > 50 {
		writeJSONValidationError(w, "name", "Nome deve ter no máximo 50 caracteres")
		return
	}

	stmt, err := db.Prepare("INSERT INTO tags (name) VALUES (?)")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(strings.TrimSpace(t.Name))
	if err != nil {
		http.Error(w, "Erro ao criar tag ou já existente", http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	t.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(t)
}

func updateTagHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var t Tag
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		writeJSONError(w, "bad_request", http.StatusBadRequest)
		return
	}

	t.Name = strings.TrimSpace(t.Name)
	if t.Name == "" {
		writeJSONValidationError(w, "name", "Nome da tag obrigatório")
		return
	}
	if len(t.Name) > 50 {
		writeJSONValidationError(w, "name", "Nome deve ter no máximo 50 caracteres")
		return
	}

	stmt, err := db.Prepare("UPDATE tags SET name=? WHERE id=? AND deleted_at IS NULL")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(strings.TrimSpace(t.Name), id)
	if err != nil {
		http.Error(w, "Erro ao atualizar tag", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Tag não encontrada", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(t)
}

func deleteTagHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	var tagName string
	err := db.QueryRow("SELECT name FROM tags WHERE id = ? AND deleted_at IS NULL", id).Scan(&tagName)
	if err != nil {
		http.Error(w, "Tag não encontrada", http.StatusNotFound)
		return
	}

	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM products WHERE tags LIKE ? AND deleted_at IS NULL", "%\""+tagName+"\"%").Scan(&count)
	if err == nil && count > 0 {
		rows, err := db.Query("SELECT id, tags FROM products WHERE tags LIKE ? AND deleted_at IS NULL", "%\""+tagName+"\"%")
		if err == nil {
			for rows.Next() {
				var pId int
				var pTags string
				if err := rows.Scan(&pId, &pTags); err == nil {
					var tagList []string
					if err := json.Unmarshal([]byte(pTags), &tagList); err == nil {
						var newList []string
						for _, t := range tagList {
							if t != tagName {
								newList = append(newList, t)
							}
						}
						if newList == nil { newList = []string{} }
						newTagsJSON, _ := json.Marshal(newList)
						db.Exec("UPDATE products SET tags = ? WHERE id = ?", string(newTagsJSON), pId)
					}
				}
			}
			rows.Close()
		}
	}

	stmt, err := db.Prepare("UPDATE tags SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(id)
	if err != nil {
		http.Error(w, "Erro ao deletar tag", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		writeJSONError(w, "bad_request", http.StatusBadRequest)
		return
	}

	var hash string
	err := db.QueryRow("SELECT password_hash FROM admin_users WHERE username = ?", creds.Username).Scan(&hash)
	if err != nil {
		writeJSONError(w, "invalid_credentials", http.StatusUnauthorized)
		return
	}

	if !CheckPasswordHash(creds.Password, hash) {
		writeJSONError(w, "invalid_credentials", http.StatusUnauthorized)
		return
	}

	token, err := GenerateJWT(creds.Username)
	if err != nil {
		writeJSONError(w, "internal_error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token": token,
	})
}
