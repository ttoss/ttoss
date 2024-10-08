---
title: Setting Up a Multi-Purpose Server with Amazon EC2, Docker, and Traefik
description: Learn how to set up a versatile server using Amazon EC2, Docker, and Traefik. This guide walks you through creating a environment to manage multiple services, websites, or applications on a single server, leveraging Docker containers and Traefik for efficient routing and service discovery.
authors:
  - arantespp
tags:
  - aws
  - docker
  - traefik
  - reverse-proxy
---

Efficient infrastructure is crucial for running multiple applications smoothly. In this guide, we’ll show how to set up [Amazon EC2](https://aws.amazon.com/ec2/) with [Docker](https://www.docker.com/) and [Traefik](https://traefik.io/) to containerize services and manage routing efficiently. This streamlined approach simplifies deployment, optimizes server use, and ensures agility for a dynamic work environment.

<!-- truncate -->

## Objectives

The main goal of this guide is to establish a streamlined process for deploying web applications with minimal effort. Using [Amazon EC2](https://aws.amazon.com/ec2/) with [Docker](https://www.docker.com/) and [Traefik](https://traefik.io/) as a reverse proxy, we will create a flexible server environment that supports multiple web applications and services, including databases like PostgreSQL, on different ports. This setup will ensure smooth deployment workflows, easy [vertical scaling](https://www.cloudzero.com/blog/horizontal-vs-vertical-scaling/), and adaptable management of routing for various services, allowing for efficient expansion and integration of additional components as needed.

## Amazon EC2

:::info[Section Objectives]

- **Provision EC2 Instance**: Launch and configure an Amazon EC2 instance with the desired specifications.
- **Set Up Security Group**: Configure inbound and outbound rules for secure access and traffic management.
- **Install Docker**: Install Docker on the EC2 instance to facilitate containerized deployments.
- **Verify Configuration**: Ensure Docker is running correctly and accessible by deploying a test container, such as Nginx.
- **Associate Elastic IP**: Allocate and associate an Elastic IP address for a static and reliable IP connection.

:::

Create an EC2 instance on AWS with your desired configuration. I've chosen a T3a family instance ([check for others general purpose families here](https://docs.aws.amazon.com/ec2/latest/instancetypes/gp.html)) running [Ubuntu 24.04 LTS](https://ubuntu.com/blog/tag/ubuntu-24-04-lts). Ensure that the instance has a public IP address and that you have the key pair file to access it. I named my instance `general-purpose-server` and used the key pair file `general-purpose-server.pem`.

### Security Group

For the VPC, I used the default VPC and for the security group, I created a new security group, named `general-purpose-server-sg` and described it as "General purpose server security group", with the following inbound rules:

- SSH (22) from anywhere
- HTTP (80) from anywhere
- HTTPS (443) from anywhere

Outbound rules were left "All traffic" to anywhere.

Use your key pair file to SSH into the instance:

```bash
chmod 400 general-purpose-server.pem
ssh -i general-purpose-server.pem <user>@<public-ip>
```

### Docker

Install Docker on the instance following the official documentation: https://docs.docker.com/engine/install/

Once Docker is installed, check if the Docker installation and the security group `general-purpose-server-sg` configuration is correct by running the following command:

```bash
docker run -d -p 80:80 --name nginx nginx
```

This command will run a Nginx container on the instance and expose it on port 80. You can check if the Nginx server is running by visiting the public IP of the instance in your browser.

### Elastic IP Address and Domain Name

Associate an [Elastic IP address](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html) to the instance to have a static IP address. This is necessary because we'll use domain names to access the server and services running on it.

Create a domain or subdomain name and point it to the Elastic IP address. Create a `A` record in the DNS settings of the domain registrar and point it to the Elastic IP address. For example, `general-purpose-server.your-domain.com` pointing to the Elastic IP address.

To check that the domain name is pointing to the correct IP address, you can use it to SSH into the instance:

```bash
ssh -i general-purpose-server.pem <user>@general-purpose-server.your-domain.com
```

Also, you can use the domain name in your browser to access the Nginx server running on the instance.

### Stop the Nginx container

Stop the Nginx container because we'll need the port 80 for the Traefik container.

```bash
docker stop nginx
```

## Traefik

:::info[Section Objectives]

- **Set Up Traefik**: Install and configure Traefik as a reverse proxy and load balancer to manage routing for multiple services.
- **Configure Traefik Dashboard**: Enable and secure the Traefik dashboard for monitoring and managing the routing setup.
- **Add Services**: Integrate web services, like Nginx, and route traffic based on domain names.
- **Enable HTTPS**: Configure Traefik to handle HTTPS connections using Let's Encrypt for secure communication.
- **Implement Dynamic Configuration**: Use dynamic configuration to enhance security and manage service routing efficiently.

:::

What to do if you want to run multiple web services that use the same port (e.g., port 80 or 443) on the same server and expose them on different domains? You can use [Traefik](https://traefik.io/), a reverse proxy and load balancer that can route traffic to different services based on the domain name.

### Traefik Hello World

Let's configure Traefik "Hello World" as its [dashboard](https://doc.traefik.io/traefik/operations/dashboard) running properly.

Create a folder named `apps` to store the configuration files for the services you want to run.

Create a network named `traefik-network`. This network will be used by Traefik to communicate with the services.

```bash
docker network create traefik-network
```

Inside the `apps` folder, create a folder named `traefik`, create another folder named `config`, and a file named `traefik.yaml` inside the `apps/traefik/config/` folder:

```yaml
# accessLog: {}  # uncomment this line to enable access log
log:
  level: WARN # ERROR, DEBUG, PANIC, FATAL, ERROR, WARN, INFO
providers:
  docker:
    exposedByDefault: false
    endpoint: 'unix:///var/run/docker.sock'
    network: traefik-network
api:
  dashboard: true
  insecure: true
entryPoints:
  web:
    address: ':80'
```

Create a `docker-compose.yaml` file inside the `apps/traefik` folder:

```yaml
services:
  traefik:
    image: traefik:comte
    container_name: traefik
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro # It's not recommended mounting the docker socket into a container -> see https://github.com/wollomatic/traefik2-hardened
      - ./config/traefik.yaml:/etc/traefik/traefik.yaml:ro # static traefik configuration

    labels:
      - 'traefik.enable=true'

      # define basic auth middleware for dashboard
      - 'traefik.http.middlewares.traefik-auth.basicauth.removeheader=true'
      # how to set a real password:
      # sudo apt-get install apache2-utils
      # htpasswd -Bnb username password | sed -e s/\\$/\\$\\$/g
      - 'traefik.http.middlewares.traefik-auth.basicauth.users=${DASHBOARD_BASIC_AUTH}'

      # define traefik dashboard router and service
      - 'traefik.http.routers.traefik.rule=Host(`${DASHBOARD_DOMAIN}`)'
      - 'traefik.http.routers.traefik.service=api@internal'
      - 'traefik.http.routers.traefik.entrypoints=web'
      - 'traefik.http.routers.traefik.middlewares=traefik-auth'

    networks:
      - traefik-network
    ports:
      - '80:80'
      - '443:443'

networks:
  traefik-network:
    external: true
    name:
      # create this network before running this deployment:
      # docker network create traefik-network
      traefik-network
```

Create a basic auth password. You can generate a new password using the following command:

```bash
htpasswd -Bnb username password | sed -e s/\\$/\\$\\$/g
```

:::tip

If you don't want to create a new hashed, you can use the following value to have username `traefik` and password `traefik`:

```bash
DASHBOARD_BASIC_AUTH=traefik:$$2y$$05$$g/gjHa7nEKLXXL8tIOpk1uOpyKowZ7i5rj9YqnCGTrfSga1WqT8U.
```

:::

Create a `.env` file inside the `apps/traefik` folder:

```bash
DASHBOARD_BASIC_AUTH=your-username:your-hash-password
DASHBOARD_DOMAIN=general-purpose-server.your-domain.com
```

Run the Traefik container:

```bash
docker-compose up -d
```

If everything is running properly, you can access the Traefik dashboard by visiting the domain name you created for the server and adding `/dashboard` at the end. For example, `general-purpose-server.your-domain.com/dashboard`. You'll be prompted to enter the username and password you set in the `.env` file.

### Create More Services

Now let's create a Nginx service, named `example1`, and expose it on the domain `example1.com`, with Traefik as the reverse proxy.

Create a folder named `example1` inside the `apps` folder. Inside the `example1` folder, create a `docker-compose.yaml` file inside `apps/example1` folder:

```yaml
services:
  nginx:
    image: nginx
    container_name: example1-nginx
    restart: unless-stopped
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.example1-insecure.rule=Host(`example1.com`)'
      - 'traefik.http.routers.example1-insecure.entrypoints=web'
    networks:
      - traefik-network
    ports:
      - '3000:80'
networks:
  traefik-network:
    external: true
    name: traefik-network
```

You configured the Traefik service to route traffic based on the domain name `example1.com` using the [routing rule `Host`](https://doc.traefik.io/traefik/routing/routers/#host-and-hostregexp) and the [entrypoint](https://doc.traefik.io/traefik/routing/routers/#entrypoints) `web` that you defined in the `apps/traefik/config/traefik.yaml` file.

Configure your DNS to `example1.com` to point to the server's IP address.

Run the Nginx service:

```bash
docker-compose up -d
```

If everything is running properly, you can access the Nginx server by visiting `example1.com`.

#### What is happening?

When you run the Nginx service, Docker exposes the service on the `traefik-network` network on port 3000. Traefik is listening to the `traefik-network` network and when it sees a new service running, it reads the labels of the service and creates a new router for the service. In this case, Traefik creates a new router named `example1-insecure` and routes the traffic to the Nginx service when the domain `example1.com` is accessed.

_**Challenge**: Create a new service named `example2` and expose it on the domain `example2.com`._

### HTTPS

To enable HTTPS, you need to have a valid SSL certificate. You can use [Let's Encrypt](https://letsencrypt.org/) to get a free SSL certificate. Traefik handles the SSL certificate automatically using Let's Encrypt (check the [official documentation](https://doc.traefik.io/traefik/https/acme/)).

First, create a `acme.json` file inside the `apps/traefik/config` folder:

```bash
touch acme.json
chmod 600 acme.json
```

Update the `apps/traefik/config/traefik.yaml` file to include the Let's Encrypt configuration:

```yaml
# accessLog: {}  # uncomment this line to enable access log
log:
  level: WARN # ERROR, DEBUG, PANIC, FATAL, ERROR, WARN, INFO
providers:
  docker:
    exposedByDefault: false
    endpoint: 'unix:///var/run/docker.sock'
    network: traefik-network
api:
  dashboard: true
  insecure: true
entryPoints:
  web:
    address: ':80'
  web-secure:
    address: ':443' # https
certificatesResolvers:
  tlschallenge:
    acme:
      email: <your-email>
      storage: /etc/traefik/acme.json # chmod 600 this file on the host system
      tlsChallenge: {}
```

Update the `apps/traefik/docker-compose.yaml` file to include the configuration for `web-secure`.

1. Add `acme.json` as a volume in the Traefik service.
2. Add the labels for the HTTPS router.

The `docker-compose.yaml` file should look like this:

```yaml
services:
  traefik:
    image: traefik:comte
    container_name: traefik
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro # It's not recommended mounting the docker socket into a container -> see https://github.com/wollomatic/traefik2-hardened
      - ./config/traefik.yaml:/etc/traefik/traefik.yaml:ro # static traefik configuration
      - ./config/acme.json:/etc/traefik/acme.json # TLS certificate storage

    labels:
      - 'traefik.enable=true'

      # define basic auth middleware for dashboard
      - 'traefik.http.middlewares.traefik-auth.basicauth.removeheader=true'
      # how to set a real password:
      # sudo apt-get install apache2-utils
      # htpasswd -Bnb username password | sed -e s/\\$/\\$\\$/g
      # CHANGE PASSWORD!! (username: traefik / password: traefik)
      - 'traefik.http.middlewares.traefik-auth.basicauth.users=${DASHBOARD_BASIC_AUTH}'

      # define traefik dashboard router and service
      - 'traefik.http.routers.traefik.rule=Host(`${DASHBOARD_DOMAIN}`)'
      - 'traefik.http.routers.traefik.service=api@internal'
      - 'traefik.http.routers.traefik.entrypoints=web-secure'
      - 'traefik.http.routers.traefik.tls.certresolver=tlschallenge'
      - 'traefik.http.routers.traefik.middlewares=traefik-auth'

    networks:
      - traefik-network
    ports:
      - '80:80'
      - '443:443'

networks:
  traefik-network:
    external: true
    name:
      # create this network before running this deployment:
      # docker network create traefik-network
      traefik-network
```

:::warning

Before running the Traefik container, be careful with Let's Encrypt rate limits. Check the [official documentation](https://letsencrypt.org/docs/rate-limits/) for more information.

If Traefik requests new certificates each time it starts up, a crash-looping container can quickly reach Let's Encrypt's [rate limits](https://letsencrypt.org/docs/rate-limits/). To configure where certificates are stored, create the `acme.json` file and mount it as a volume in the Traefik container as shown above (check the [storage official documentation](https://doc.traefik.io/traefik/https/acme/#storage)).

Use Let's Encrypt staging server with the [caServer](https://doc.traefik.io/traefik/https/acme/#caserver) configuration option when experimenting to avoid hitting this limit too fast.

:::

:::tip

I suggest not adding the label `- 'traefik.http.routers.YOUR_SERVICE.tls.certresolver=tlschallenge'` to your service's `docker-compose.yaml` file until you make sure it is running properly with HTTP. Once you confirm that the service is running properly, you can add the label to allow Let's Encrypt make its queries and issue the certificate.

:::

Run the Traefik container:

```bash
docker compose up -d
```

See logs to check if the container is running properly:

```bash
docker logs traefik
```

If everything is running properly, you can access the Traefik dashboard using HTTPS by visiting the domain name you created for the server and adding `/dashboard` at the end. For example, `https://general-purpose-server.your-domain.com/dashboard`.

You should also see the certificates in the `acme.json` file.

#### Add HTTPS to the Nginx service

To add HTTPS to the Nginx service, add the following labels to the `docker-compose.yaml` file inside the `apps/example1` folder:

```yaml
- 'traefik.http.routers.example1.rule=Host(`example1.com`)'
- 'traefik.http.routers.example1.entrypoints=web-secure'
- 'traefik.http.routers.example1.tls.certresolver=tlschallenge'
```

The `apps/example1/docker-compose.yaml` file should look like this:

```yaml
services:
  nginx:
    image: nginx
    container_name: example1-nginx
    restart: unless-stopped
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.example1-insecure.rule=Host(`example1.com`)'
      - 'traefik.http.routers.example1-insecure.entrypoints=web'
      - 'traefik.http.routers.example1.rule=Host(`example1.com`)'
      - 'traefik.http.routers.example1.entrypoints=web-secure'
      - 'traefik.http.routers.example1.tls.certresolver=tlschallenge'
    networks:
      - traefik-network
    ports:
      - '3000:80'
networks:
  traefik-network:
    external: true
    name: traefik-network
```

Run the Nginx service:

```bash
docker-compose up -d
```

If everything is running properly, you can access the Nginx server by visiting `https://example1.com`.

### Dynamic Configuration

You can use [dynamic configuration](https://doc.traefik.io/traefik/getting-started/configuration-overview/#the-dynamic-configuration) to improve the security of your services.

Create a file named `dynamic.yaml` inside the `apps/traefik/config` folder:

```yaml
# set more secure TLS options,
# see https://doc.traefik.io/traefik/v2.5/https/tls/
tls:
  options:
    default:
      minVersion: VersionTLS12
      cipherSuites:
        - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
        - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
        - TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305
        - TLS_AES_128_GCM_SHA256
        - TLS_AES_256_GCM_SHA384
        - TLS_CHACHA20_POLY1305_SHA256
      curvePreferences:
        - CurveP521
        - CurveP384

http:
  # define middlewares
  middlewares:
    # define some security header options,
    # see https://doc.traefik.io/traefik/v2.5/middlewares/http/headers/
    secHeaders:
      headers:
        browserXssFilter: true
        contentTypeNosniff: true
        frameDeny: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 31536000
        customFrameOptionsValue: 'SAMEORIGIN'
        customResponseHeaders:
          # prevent some applications to expose too much information by removing thise headers:
          server: ''
          x-powered-by: ''
    autodetectContenttype: # needed for traefik v3 - see https://doc.traefik.io/traefik/v3.0/migration/v2-to-v3/
      contentType: {}
```

Update the `apps/traefik/config/traefik.yaml` file to include the dynamic configuration as a file provider:

```yaml
# ...rest of the file
providers:
  docker:
    exposedByDefault: false
    endpoint: 'unix:///var/run/docker.sock'
    network: traefik-servicenet
  file:
    filename: /etc/traefik/dynamic.yaml
    watch: true
# ...rest of the file
```

Update the `apps/traefik/docker-compose.yaml` file to include the dynamic configuration as a volume in the Traefik service:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro # It's not recommended mounting the docker socket into a container -> see https://github.com/wollomatic/traefik2-hardened
  - ./config/traefik.yaml:/etc/traefik/traefik.yaml:ro # static traefik configuration
  - ./config/acme.json:/etc/traefik/acme.json # TLS certificate storage
  - ./config/dynamic.yaml:/etc/traefik/dynamic.yaml:ro # dynamic traefik configuration
```

Run the Traefik container:

```bash
docker-compose up -d
```

Now, every time you want to add the middleware you defined in the `dynamic.yaml` file, you can add the middleware to the labels of the service you want. For example, to add the `secHeaders` and `autodetectContenttype` middleware to the Nginx service, you can add the following label:

```yaml
- 'traefik.http.routers.example1.middlewares=secHeaders@file, autodetectContenttype@file'
```

Restart the Nginx service:

```bash
docker-compose up -d
```

:::note

Note that `@file` is the key of the provider `file` of the dynamic config `apps/traefik/config/dynamic.yaml`.

:::

### Redirect to HTTPS

Your Nginx service is accessible via HTTP and HTTPS. You can redirect all HTTP traffic to HTTPS by adding the following labels to the `traefik/config/dynamic.yaml` file:

```yaml
http:
  # ... rest of the file
  middlewares:
    redirectToHttps:
      redirectScheme:
        scheme: https
```

Update the `docker-compose.yaml` file inside the `example1` folder to include the middleware:

```yaml
services:
  nginx:
    # ... rest of the file
    labels:
      # ... rest of the file
      - 'traefik.http.routers.example1-insecure.middlewares=redirectToHttps@file'
```

## Hosting Additional Non-Web Services

In addition to web applications, you may need to host other services such as databases on your EC2 instance. For instance, running a PostgreSQL database can be easily achieved by deploying it in a Docker container. Unlike web services that require routing through Traefik, non-web services such as databases don’t need to interact with the reverse proxy.

To host these additional services:

- **Deploy the Service**: Use Docker to run your desired service (e.g., PostgreSQL) in a container.
- **Configure Security Group**: Ensure that the required ports for the service are open in the EC2 security group. For PostgreSQL, this typically involves allowing inbound traffic on port 5432.

This setup enables you to leverage the same EC2 instance for various types of services, enhancing flexibility and reducing resource overhead. However, it's important to note that this configuration is not highly available since it relies on a single EC2 instance. For higher availability and fault tolerance, consider additional measures or architectures.

## Conclusion

This setup provides a flexible and efficient environment for running multiple web services on a single EC2 instance. By utilizing Docker and Traefik, you can easily deploy, manage, and route various applications and services, including web servers and databases, with minimal overhead.

However, it is important to note that this configuration relies on a single EC2 instance, which may not offer high availability or fault tolerance. While this approach is suitable for development, testing, and small-scale deployments, it may not meet the needs of production environments requiring high availability and redundancy. To achieve greater reliability and uptime, consider deploying across multiple instances or leveraging additional AWS services designed for high availability.
