FROM golang:alpine AS builder

# Enable CGO for SQLite
ENV CGO_ENABLED=1

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main .
RUN go build -o seedadmin ./cmd/seedadmin/main.go

FROM alpine:3.18
WORKDIR /app
COPY --from=builder /app/main .
COPY --from=builder /app/seedadmin .
COPY --from=builder /app/catalogo.db* ./
COPY --from=builder /app/*.png ./

EXPOSE 8080
CMD ["./main"]
