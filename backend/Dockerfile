FROM golang:1.21-alpine AS builder

# Enable CGO for SQLite
ENV CGO_ENABLED=1

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main .

FROM alpine:3.18
WORKDIR /app
COPY --from=builder /app/main .
COPY --from=builder /app/catalogo.db* ./

EXPOSE 8080
CMD ["./main"]
