---
title: RDS PostgreSQL
---

In this tutorial, we will configure an AWS RDS PostgreSQL cluster.

In our case, we have multiples projects in multiples AWS accounts, and we wanted a single cluster to all projects.

## Networking

The cluster and the proxy are in a VPC whose CIDR is `10.0.0.0/16`.

To connect to the cluster, each other project has a VPC peering with the cluster VPC.

The rule for project's VCP CIDR is: `10.A.B.0/18`, in which `A` can vary from `1` to `255` (`A` equal `0` is the cluster VPC) and `B` can have 4 values (`0`, `64`, `128`, `192`). This way, each VPC has a range of `16,384` IPs.

Example of VPCs CIDR:

- VPC 1: `10.1.0.0/18`
- VPC 2: `10.1.64.0/18`
- VPC 3: `10.1.128.0/18`
- VPC 4: `10.1.192.0/18`
- VPC 5: `10.2.0.0/18`
- VPC 6: `10.2.64.0/18`
- ...

We need to define these ranges to avoid overlapping between VPCs when we create a VPC peering.

### Creating Peering

To create a peering, we need to request the peering from the project VPC to the cluster VPC.

The cluster VPC needs to accept the peering.

The peering name on the project VPC is `aurora-postgres-cluster-peering` and the peering name on the cluster VPC is `111122223333-aws-account-name-peering`.

Don't forget to update the route tables to allow the traffic between the VPCs. For all security groups associated with the Lambdas or EC2 instances, you need to update the router tables to allow the traffic to the cluster.

Allow the traffic from the project VPC to the cluster VPC on the security group of the proxy.

![alt text](https://cdn.triangulos.tech/assets/proxy_sg_configuration_533d466137.png)

## Secrets

Save database role credentials in AWS Secrets Manager.

Create a `aurora-postgres-credentials/{role}` secret.

On proxy RDS, modify it to use the new secret.
