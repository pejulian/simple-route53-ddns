# Simple Route53 Dynamic DNS

This node module offers a script that allows you to create/update a record set in your Route53 Hosted Zone with your current IP address.

A use case for this script is to have it invoked via a scheduled task (i.e. `crontab`) to keep your FQDN updated with the correct and active IP address of your non static IP server.

This effectively gives you a simple Dynamic DNS service that you can use to ensure that your domain/host is always pointing to the correct 

## Credits

This script is a NodeJS adaptation of a script provided by [Anthony Heddings](https://www.cloudsavvyit.com/3103/how-to-roll-your-own-dynamic-dns-with-aws-route-53/).

## Prerequisites

1. AWS CLI installed and available on your prompt (This script doesn't directly use the CLI, but the CLI is required for setting up your AWS profile configuration on your machine: `aws configure`)
2. An `iam` profile configured that has relevant access to the Route53 service to add/update record sets in a given Hosted Zone 
3. `npm` installed and available on your path
4. An active Hosted Zone in AWS Route53

## Usage

The easiest way to invoke scripts in this module is via `npx`.

### `update-record-set`

Gets the current public ip address of your network and creates or updates a record set in the specified Hosted Zone in Route53.

```bash
npx simple-route53-ddns update-record-set -h YOUR_HOSTED_ZONE_ID -d YOUR_DOMAIN_NAME [-t RECORD_SET_TYPE -l TTL -p YOUR_IAM_PROFILE -r YOUR_AWS_REGION]
```

| Option              | Required           | Description                                                                                                                  |
| ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| -h --hosted-zone-id | :x:                | The hosted zone in Route53 where the record set will be created/updated                                                      |
| -d --domain         | :x:                | Your domain name. Must be a FQDN                                                                                             |
| -t --type           | :heavy_check_mark: | The DNS record set type to create/update (optional, will use `A` if not set)                                                 |
| -l --ttl            | :heavy_check_mark: | The TTL (optional, will default to `60` seconds if not set)                                                                  |
| -p --profile        | :heavy_check_mark: | The IAM profile that is configured for use to interact with the target AWS account (optional, will use `default` if not set) |
| -r --region         | :heavy_check_mark: | The region that the AWS SDK should operate in when running commands (optional, will use `ap-southeast-1` if not set)         |

