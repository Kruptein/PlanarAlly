CHART_DIR_PATH="./charts/planarally"
CHART_NAME="planarally"
CHART_NAMESPACE="planarally"
MINIKUBE_KUBE_VERSION=1.28.4 # renovate: datasource=github-tags depName=kubernetes/kubernetes
HELM_VERSION=$(shell yq ".version" ${CHART_DIR_PATH}/Chart.yaml | tr -d '"')
#HELM_VERSION=$(shell git describe --abbrev=0)
# Instead of using the --raw-output option tr works with all versions of yq, both the python and go version
APP_VERSION=$(shell yq ".appVersion" ${CHART_DIR_PATH}/Chart.yaml | tr -d '"')
#APP_VERSION=$(shell cat charts/ak/values.yaml | grep -P -o '(?<=ghcr.io/goauthentik/server:).*(?=\")')

.PHONY: help
help: ## display this auto generated help message
	@echo "Please provide a make target:"
	@grep -F -h "##" $(MAKEFILE_LIST) | grep -F -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'


.PHONY: all
all: helm-lint minikube helm-install minikube-addons ## Create minikube cluster and apply operator to it

.PHONY: helm-lint
helm-lint: helm-dependencies ## Lint the helm chart
	helm lint ${CHART_DIR_PATH}/.

.PHONY: helm-dependencies
helm-dependencies:	## Update all helm chart dependencies
	helm dependency update ${CHART_DIR_PATH}/.

.PHONY: helm-install
helm-install: helm-dependencies ## Install the helm chart
	helm upgrade --install --set "ingress.enabled=true" --create-namespace --namespace ${CHART_NAMESPACE} ${CHART_NAME} ${CHART_DIR_PATH}

.PHONY: helm-upgrade
helm-upgrade: helm-install ## Upgrade the helm chart

.PHONY: minikube
minikube: ## Create a local minikube testing cluster
	minikube delete
	minikube start --cni calico --driver=podman --kubernetes-version=${MINIKUBE_KUBE_VERSION}

.PHONY: minikube-addons
minikube-addons: ## Enable our minikube required addons
	minikube addons enable ingress
	minikube addons enable metrics-server

