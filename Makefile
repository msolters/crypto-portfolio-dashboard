.PHONY: cleanup build deploy
PROJECT_ID=`gcloud config get-value project -q`

build:
	docker build -t gcr.io/$(PROJECT_ID)/crypto-portfolio-dashboard:latest .
	docker build -t gcr.io/$(PROJECT_ID)/crypto-proxy:latest ./proxy/

deploy:
	gcloud docker -- push gcr.io/$(PROJECT_ID)/crypto-portfolio-dashboard:latest
	gcloud docker -- push gcr.io/$(PROJECT_ID)/crypto-proxy:latest
	kubectl apply -f k8s/

all: build deploy
