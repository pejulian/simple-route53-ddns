import { version, name } from '../package.json';
import { Command } from 'commander';
import { UpdateRecordSet } from './update-record-set';

const program = new Command();
program.name(name).version(version);

program
    .command(`update-record-set`)
    .description(
        'Gets the current public ip address of your network and creates or updates a record set in the specified Hosted Zone in Route53'
    )
    .requiredOption(
        `-h, --hosted-zone-id [value]`,
        `The hosted zone in Route53 where the record set will be created/updated`
    )
    .requiredOption(
        `-d, --domain [value]`,
        `The domain name. Must be a FQDN or subdomain of the root FQDN.`
    )
    .option(
        `-t, --type [value]`,
        `The DNS record set type to create/update (optional, will use "A" if not set)`,
        'A'
    )
    .option(
        `-l, --ttl [value]`,
        `The TTL (optional, will default to "60" seconds if not set)`,
        '60'
    )
    .option(
        `-p, --profile [value]`,
        `The IAM profile that is configured for use to interact with the target AWS account (optional, will use "default" if not set)`,
        `default`
    )
    .option(
        `-r, --region [value]`,
        `The region that the AWS SDK should operate in when running commands (optional, will use "ap-southeast-1" if not set)`,
        `ap-southeast-1`
    )
    .action((...args: unknown[]) => {
        new UpdateRecordSet(args[0] as UpdateRecordSetOptions); // Use first index in args array for options because there's no argument defined
    });

program.parse(process.argv);
