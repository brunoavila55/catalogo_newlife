package main

import (
	"encoding/json"
	"fmt"
	"image/jpeg"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/phpdave11/gofpdf"
)

func findImageFile(names ...string) string {
	for _, name := range names {
		if _, err := os.Stat(name); err == nil { return name }
		if _, err := os.Stat(filepath.Join("backend", name)); err == nil { return filepath.Join("backend", name) }
	}
	return ""
}

func uploadImageHandler(w http.ResponseWriter, r *http.Request) {
	// Parse max 5MB form
	err := r.ParseMultipartForm(5 << 20)
	if err != nil {
		writeJSONError(w, "file_too_large", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		writeJSONError(w, "missing_image", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if header.Size > 5<<20 {
		writeJSONError(w, "file_too_large", http.StatusBadRequest)
		return
	}

	contentType := header.Header.Get("Content-Type")
	if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp" && contentType != "application/pdf" {
		writeJSONError(w, "invalid_content_type", http.StatusBadRequest)
		return
	}

	// Ensure upload directory exists
	uploadDir := "./data/uploads"
	os.MkdirAll(uploadDir, os.ModePerm)

	// Create a unique filename
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		ext = ".jpg"
	}
	uid := uuid.New().String()

	if contentType == "application/pdf" {
		filename := uid + ".pdf"
		outPath := filepath.Join(uploadDir, filename)
		outFile, err := os.Create(outPath)
		if err != nil {
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}
		defer outFile.Close()
		
		_, err = io.Copy(outFile, file)
		if err != nil {
			http.Error(w, "Failed to save file", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"url": "/api/v1/uploads/" + filename,
		})
		return
	}

	filename := uid + ".jpg"
	thumbFilename := uid + "_thumb.jpg"
	
	// Open and decode image
	srcImage, err := imaging.Decode(file)
	if err != nil {
		http.Error(w, "Invalid image format", http.StatusBadRequest)
		return
	}

	// Save optimized original (e.g. max 1920px width)
	var resized = srcImage
	if srcImage.Bounds().Dx() > 1920 {
		resized = imaging.Resize(srcImage, 1920, 0, imaging.Lanczos)
	}
	
	outPath := filepath.Join(uploadDir, filename)
	outFile, err := os.Create(outPath)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	defer outFile.Close()
	jpeg.Encode(outFile, resized, &jpeg.Options{Quality: 85})

	// Save Thumbnail (400px width)
	thumbImage := imaging.Resize(srcImage, 400, 0, imaging.Lanczos)
	thumbPath := filepath.Join(uploadDir, thumbFilename)
	thumbFile, err := os.Create(thumbPath)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	defer thumbFile.Close()
	jpeg.Encode(thumbFile, thumbImage, &jpeg.Options{Quality: 80})

	// Return the URLs
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"url":       "/api/v1/uploads/" + filename,
		"thumb_url": "/api/v1/uploads/" + thumbFilename,
	})
}

func generateProductPDFHandler(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	var p Product
	var tagsJSON, imagesJSON, specsJSON string
	err := db.QueryRow("SELECT id, slug, name, category, brand, status, image_url, specs, tags, images_json, specs_json FROM products WHERE slug = ? AND deleted_at IS NULL", slug).
		Scan(&p.ID, &p.Slug, &p.Name, &p.Category, &p.Brand, &p.Status, &p.ImageURL, &p.Specs, &tagsJSON, &imagesJSON, &specsJSON)
	
	if err != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	json.Unmarshal([]byte(tagsJSON), &p.Tags)
	json.Unmarshal([]byte(imagesJSON), &p.Images)
	json.Unmarshal([]byte(specsJSON), &p.SpecsMap)

	pdf := gofpdf.New("P", "mm", "A4", "")

	headerImage := findImageFile("header.png", "header.jpg")
	footerImage := findImageFile("footer.png", "footer.jpg")

	if headerImage != "" || footerImage != "" {
		pdf.SetHeaderFunc(func() {
			if headerImage != "" { pdf.Image(headerImage, 0, 0, 210, 0, false, "", 0, "") }
		})
		pdf.SetFooterFunc(func() {
			if footerImage != "" {
				info := pdf.RegisterImage(footerImage, "")
				if info != nil {
					h := info.Height() * (210.0 / info.Width())
					pdf.Image(footerImage, 0, 297-h, 210, 0, false, "", 0, "")
				}
			}
		})
		if headerImage != "" { pdf.SetTopMargin(35) }
		if footerImage != "" { pdf.SetAutoPageBreak(true, 30) }
	}

	pdf.AddPage()
	tr := pdf.UnicodeTranslatorFromDescriptor("")
	
	pdf.SetFont("Arial", "B", 24)
	pdf.CellFormat(190, 15, tr("Ficha Técnica: "+p.Name), "0", 1, "C", false, 0, "")
	
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(190, 10, tr("Marca: "+p.Brand+" | Categoria: "+p.Category), "0", 1, "C", false, 0, "")
	
	// If it has images, we could load them, but drawing images from remote/local URLs in gofpdf 
	// can be tricky. Let's just output text specs for now.
	pdf.Ln(10)
	
	pdf.SetFont("Arial", "B", 14)
	pdf.CellFormat(190, 10, tr("Especificações:"), "B", 1, "L", false, 0, "")
	
	pdf.SetFont("Arial", "", 12)
	if len(p.SpecsMap) > 0 {
		for key, val := range p.SpecsMap {
			pdf.SetFont("Arial", "B", 12)
			pdf.CellFormat(60, 10, tr(key)+":", "1", 0, "L", false, 0, "")
			pdf.SetFont("Arial", "", 12)
			pdf.CellFormat(130, 10, tr(val), "1", 1, "L", false, 0, "")
		}
	} else if p.Specs != "" {
		pdf.MultiCell(190, 10, tr(p.Specs), "0", "L", false)
	} else {
		pdf.CellFormat(190, 10, tr("Nenhuma especificação detalhada."), "0", 1, "L", false, 0, "")
	}

	pdf.Ln(10)
	pdf.SetFont("Arial", "B", 14)
	pdf.CellFormat(190, 10, tr("Tags:"), "B", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 12)
	if len(p.Tags) > 0 {
		pdf.MultiCell(190, 10, tr(strings.Join(p.Tags, ", ")), "0", "L", false)
	}

	pdf.Ln(20)
	pdf.SetFont("Arial", "I", 10)
	pdf.CellFormat(190, 10, tr("Documento gerado pelo sistema New Life Catálogo"), "0", 1, "C", false, 0, "")

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.pdf\"", p.Slug))
	
	err = pdf.Output(w)
	if err != nil {
		http.Error(w, "Failed to generate PDF", http.StatusInternalServerError)
	}
}

type ProjectItemRequest struct {
	ProductID int `json:"product_id"`
	Quantity  int `json:"quantity"`
}

type ProjectPDFRequest struct {
	ProjectName string               `json:"project_name"`
	ClientName  string               `json:"client_name"`
	Responsible string               `json:"responsible"`
	Notes       string               `json:"notes"`
	Items       []ProjectItemRequest `json:"items"`
}

func generateProjectPDFHandler(w http.ResponseWriter, r *http.Request) {
	var req ProjectPDFRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if len(req.Items) == 0 {
		http.Error(w, "A lista de itens não pode estar vazia", http.StatusBadRequest)
		return
	}
	if len(req.Items) > 50 {
		http.Error(w, "Limite máximo de 50 itens distintos por projeto", http.StatusBadRequest)
		return
	}

	// Validate strings length
	if len(req.ProjectName) > 200 { req.ProjectName = req.ProjectName[:200] }
	if len(req.ClientName) > 200 { req.ClientName = req.ClientName[:200] }
	if len(req.Responsible) > 200 { req.Responsible = req.Responsible[:200] }
	if len(req.Notes) > 2000 { req.Notes = req.Notes[:2000] }

	// Collect unique product IDs and check max quant
	productIDs := []int{}
	quantities := make(map[int]int)
	for _, item := range req.Items {
		if item.Quantity <= 0 || item.Quantity > 9999 {
			http.Error(w, "Quantidade inválida para o produto ID: "+fmt.Sprint(item.ProductID), http.StatusBadRequest)
			return
		}
		productIDs = append(productIDs, item.ProductID)
		quantities[item.ProductID] = item.Quantity
	}

	// Build placeholders (?,?,?)
	placeholders := make([]string, len(productIDs))
	args := make([]interface{}, len(productIDs))
	for i, id := range productIDs {
		placeholders[i] = "?"
		args[i] = id
	}

	query := fmt.Sprintf("SELECT id, name, brand, specs_json FROM products WHERE id IN (%s) AND deleted_at IS NULL", strings.Join(placeholders, ","))
	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, "Erro ao consultar produtos no banco", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type ProductData struct {
		ID        int
		Name      string
		Brand     string
		SpecsJson string
	}
	
	foundProducts := make(map[int]ProductData)
	for rows.Next() {
		var pd ProductData
		if err := rows.Scan(&pd.ID, &pd.Name, &pd.Brand, &pd.SpecsJson); err == nil {
			foundProducts[pd.ID] = pd
		}
	}

	// Check if any product is missing
	var missing []string
	for _, id := range productIDs {
		if _, ok := foundProducts[id]; !ok {
			missing = append(missing, fmt.Sprint(id))
		}
	}
	if len(missing) > 0 {
		http.Error(w, `{"message":"Alguns produtos não estão mais disponíveis no catálogo: `+strings.Join(missing, ", ")+`"}`, http.StatusBadRequest)
		return
	}

	// Generate PDF
	pdf := gofpdf.New("P", "mm", "A4", "")

	headerImage := findImageFile("header.png", "header.jpg")
	footerImage := findImageFile("footer.png", "footer.jpg")

	if headerImage != "" || footerImage != "" {
		pdf.SetHeaderFunc(func() {
			if headerImage != "" { pdf.Image(headerImage, 0, 0, 210, 0, false, "", 0, "") }
		})
		pdf.SetFooterFunc(func() {
			if footerImage != "" {
				info := pdf.RegisterImage(footerImage, "")
				if info != nil {
					h := info.Height() * (210.0 / info.Width())
					pdf.Image(footerImage, 0, 297-h, 210, 0, false, "", 0, "")
				}
			}
		})
		if headerImage != "" { pdf.SetTopMargin(35) }
		if footerImage != "" { pdf.SetAutoPageBreak(true, 30) }
	}

	pdf.AddPage()
	tr := pdf.UnicodeTranslatorFromDescriptor("")

	pdf.SetFont("Arial", "B", 24)
	title := req.ProjectName
	if title == "" { title = "Projeto Técnico" }
	pdf.CellFormat(190, 15, tr(title), "0", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "", 12)
	pdf.CellFormat(190, 10, tr("Data: "+time.Now().Format("02/01/2006")), "0", 1, "C", false, 0, "")
	pdf.Ln(5)

	if req.ClientName != "" {
		pdf.SetFont("Arial", "B", 12)
		pdf.CellFormat(40, 10, tr("Cliente:"), "0", 0, "L", false, 0, "")
		pdf.SetFont("Arial", "", 12)
		pdf.CellFormat(150, 10, tr(req.ClientName), "0", 1, "L", false, 0, "")
	}

	if req.Responsible != "" {
		pdf.SetFont("Arial", "B", 12)
		pdf.CellFormat(40, 10, tr("Responsável:"), "0", 0, "L", false, 0, "")
		pdf.SetFont("Arial", "", 12)
		pdf.CellFormat(150, 10, tr(req.Responsible), "0", 1, "L", false, 0, "")
	}

	if req.Notes != "" {
		pdf.SetFont("Arial", "B", 12)
		pdf.CellFormat(40, 10, tr("Observações:"), "0", 0, "L", false, 0, "")
		pdf.SetFont("Arial", "", 12)
		pdf.MultiCell(150, 10, tr(req.Notes), "0", "L", false)
	}
	
	pdf.Ln(10)
	pdf.SetFont("Arial", "B", 14)
	pdf.CellFormat(190, 10, tr("Lista de Equipamentos"), "B", 1, "L", false, 0, "")
	
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(100, 10, tr("Produto / Marca"), "1", 0, "L", false, 0, "")
	pdf.CellFormat(20, 10, tr("Qtd"), "1", 0, "C", false, 0, "")
	pdf.CellFormat(35, 10, tr("V. Unitário"), "1", 0, "R", false, 0, "")
	pdf.CellFormat(35, 10, tr("Subtotal"), "1", 1, "R", false, 0, "")

	pdf.SetFont("Arial", "", 10)
	var grandTotal float64

	for _, id := range productIDs {
		pd := foundProducts[id]
		qtd := quantities[id]
		
		var specs map[string]string
		json.Unmarshal([]byte(pd.SpecsJson), &specs)
		priceStr := specs["_price"]
		
		var unitPrice float64
		if priceStr != "" {
			cleanStr := strings.ReplaceAll(priceStr, "R$", "")
			cleanStr = strings.ReplaceAll(cleanStr, " ", "")
			cleanStr = strings.ReplaceAll(cleanStr, ".", "")
			cleanStr = strings.ReplaceAll(cleanStr, ",", ".")
			fmt.Sscanf(cleanStr, "%f", &unitPrice)
		}

		subtotal := unitPrice * float64(qtd)
		grandTotal += subtotal

		pdf.CellFormat(100, 10, tr(pd.Name+" ("+pd.Brand+")"), "1", 0, "L", false, 0, "")
		pdf.CellFormat(20, 10, tr(fmt.Sprint(qtd)), "1", 0, "C", false, 0, "")
		
		unitPriceStr := "R$ 0,00"
		if unitPrice > 0 { unitPriceStr = fmt.Sprintf("R$ %.2f", unitPrice) }
		unitPriceStr = strings.ReplaceAll(unitPriceStr, ".", ",")
		pdf.CellFormat(35, 10, unitPriceStr, "1", 0, "R", false, 0, "")
		
		subtotalStr := "R$ 0,00"
		if subtotal > 0 { subtotalStr = fmt.Sprintf("R$ %.2f", subtotal) }
		subtotalStr = strings.ReplaceAll(subtotalStr, ".", ",")
		pdf.CellFormat(35, 10, subtotalStr, "1", 1, "R", false, 0, "")
	}

	pdf.Ln(5)
	pdf.SetFont("Arial", "B", 12)
	grandTotalStr := "R$ 0,00"
	if grandTotal > 0 { grandTotalStr = fmt.Sprintf("R$ %.2f", grandTotal) }
	grandTotalStr = strings.ReplaceAll(grandTotalStr, ".", ",")
	pdf.CellFormat(155, 10, tr("Total Geral:"), "0", 0, "R", false, 0, "")
	pdf.CellFormat(35, 10, grandTotalStr, "0", 1, "R", false, 0, "")

	pdf.Ln(15)
	pdf.SetFont("Arial", "I", 10)
	pdf.CellFormat(190, 10, tr("New Life Fibra - Documento gerado automaticamente"), "0", 1, "C", false, 0, "")

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=\"projeto.pdf\"")
	
	err = pdf.Output(w)
	if err != nil {
		http.Error(w, "Failed to generate PDF", http.StatusInternalServerError)
	}
}
