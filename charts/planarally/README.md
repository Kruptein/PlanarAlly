# PlanarAlly Helm Chart

## Parameters

### Planarly Configuration

| Name                                         | Description                                                                                                            | Value |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----- |
| `replicaCount`                               | Server deployment replica count                                                                                        | `""`  |
| `image.registry`                             | Image container registry                                                                                               | `""`  |
| `image.repository`                           | Image repository                                                                                                       | `""`  |
| `image.pullPolicy`                           | Image pull policy                                                                                                      | `""`  |
| `image.tag`                                  | Overrides the image tag whose default is the chart appVersion.                                                         | `""`  |
| `imagePullSecrets`                           | Image pull secrets                                                                                                     | `[]`  |
| `nameOverride`                               | Partial name override                                                                                                  | `""`  |
| `fullnameOverride`                           | Full name override                                                                                                     | `""`  |
| `serviceAccount.create`                      | Specifies whether a service account should be created                                                                  | `""`  |
| `serviceAccount.annotations`                 | Annotations to add to the service account                                                                              | `{}`  |
| `serviceAccount.name`                        | The name of the service account to use. If not set and create is true, a name is generated using the fullname template | `""`  |
| `podAnnotations`                             | Pod annotations                                                                                                        | `{}`  |
| `podSecurityContext`                         | Pod security context                                                                                                   | `{}`  |
| `securityContext`                            | Security context                                                                                                       | `{}`  |
| `persistence.enabled`                        | Enable persistence (not-yet-implemented)                                                                               | `""`  |
| `service.type`                               | Service type                                                                                                           | `""`  |
| `ports`                                      | Ports to expose, tie to the service, and ingress                                                                       | `[]`  |
| `ingress.enabled`                            | Enable ingress                                                                                                         | `""`  |
| `ingress.className`                          | Ingress class                                                                                                          | `""`  |
| `ingress.annotations`                        | Ingress annotations                                                                                                    | `{}`  |
| `ingress.hosts`                              | Ingress hosts                                                                                                          | `[]`  |
| `ingress.tls`                                | Ingress TLS                                                                                                            | `[]`  |
| `resources`                                  | Resources                                                                                                              | `{}`  |
| `autoscaling.enabled`                        | Enable autoscaling                                                                                                     | `""`  |
| `autoscaling.minReplicas`                    | Minimum number of replicas                                                                                             | `""`  |
| `autoscaling.maxReplicas`                    | Maximum number of replicas                                                                                             | `""`  |
| `autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization percentage                                                                                      | `""`  |
| `nodeSelector`                               | Node selector                                                                                                          | `{}`  |
| `tolerations`                                | Tolerations                                                                                                            | `[]`  |
| `affinity`                                   | Node affinity                                                                                                          | `{}`  |
