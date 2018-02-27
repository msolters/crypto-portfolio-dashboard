.PHONY: cleanup build deploy

cleanup:
	rm -rf /tmp/build
	rm -rf ./bundle

build: cleanup
	meteor build /tmp/build --architecture os.linux.x86_64
	tar -xzf /tmp/build/crypto-portfolio-dashboard.tar.gz -C ./

deploy:
	heroku container:push web
