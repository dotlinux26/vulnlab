FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY main.go .
RUN go mod init flagservice && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /flag-service .

FROM scratch
COPY --from=builder /flag-service /flag-service
USER 65534:65534
EXPOSE 8080
ENTRYPOINT ["/flag-service"]
