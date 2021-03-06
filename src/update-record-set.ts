import { UpdateRecordSetOptions } from 'types';
import AWS from 'aws-sdk';
import chalk from 'chalk';
import shelljs from 'shelljs';
import validator from 'validator';
import { name, version } from '../package.json';

export class UpdateRecordSet {
    private readonly options: UpdateRecordSetOptions;
    private readonly route53Client: AWS.Route53;

    private _ip: string | undefined;

    constructor(options: UpdateRecordSetOptions) {
        this.options = options;

        console.log(chalk.cyan(`Running ${name}:UpdateRecordSet@${version}`));

        const credentials = new AWS.SharedIniFileCredentials({
            profile: this.options.profile
        });

        AWS.config.credentials = credentials;

        AWS.config.update({ region: this.options.region });

        this.route53Client = new AWS.Route53();

        this.run();
    }

    public get ip(): string | undefined {
        return this._ip;
    }

    public set ip(value: string | undefined) {
        this._ip = value;
    }

    public async run(): Promise<void> {
        this.getIpAddress();

        // Hard limit of five requests per second (per account).
        const action = await this.validateResourceRecordSet(
            this.options.domain
        );
        if (action === 'UPSERT') {
            await this.pushRecordSet(this.options.domain);
        }
    }

    private getIpAddress(): void {
        try {
            const { stdout } = shelljs.exec(
                `curl http://checkip.amazonaws.com/`
            );

            const maybeIp = stdout.trim().replace('\n', '');

            if (validator.isIP(maybeIp, '4')) {
                this.ip = maybeIp;
                console.log(
                    chalk.greenBright(
                        `The current public ip address of this network is: ${this.ip}`
                    )
                );
            } else {
                throw new Error(
                    `Could not resolve public ip address of the current network!`
                );
            }
        } catch (e) {
            console.log(
                chalk.redBright(
                    e.message ??
                        `An error occured when curl(ing) http://checkip.amazonaws.com/`
                ),
                e
            );
            throw e;
        }
    }

    /**
     * Searches if there is an existing record set with the same domain and type as the current update request
     */
    public async validateResourceRecordSet(
        domain: string
    ): Promise<'COMPLETE' | 'UPSERT'> {
        try {
            const list = await this.route53Client
                .listResourceRecordSets({
                    HostedZoneId: this.options.hostedZoneId,
                    StartRecordName: domain,
                    StartRecordType: this.options.type
                })
                .promise();

            if (list.ResourceRecordSets.length > 0) {
                const [resourceRecordSet] = list.ResourceRecordSets;
                const [resourceRecord] =
                    resourceRecordSet.ResourceRecords ?? [];
                const { Value: currentIp } = resourceRecord ?? {};

                if (currentIp === this.ip) {
                    console.log(
                        chalk.greenBright(
                            `network public ip address is already the same as the one set in the target resource record for ${domain}, nothing further to do`
                        )
                    );
                    return 'COMPLETE';
                } else {
                    console.log(
                        chalk.yellowBright(
                            `network public ip address is different from the one in the record set for ${domain}, will update the record set`
                        )
                    );
                    return 'UPSERT';
                }
            } else {
                console.log(
                    chalk.yellowBright(
                        `no existing record set for ${domain} in specified hosted zone, will create a new record set`
                    )
                );
                return 'UPSERT';
            }
        } catch (e) {
            console.log(
                chalk.redBright(
                    `Failed to obtain resource record sets for the given hosted zone`
                ),
                e
            );
            throw e;
        }
    }

    /**
     *
     */
    private async pushRecordSet(domain: string): Promise<void> {
        try {
            if (typeof this.ip !== 'undefined') {
                const result = await this.route53Client
                    .changeResourceRecordSets({
                        HostedZoneId: this.options.hostedZoneId,
                        ChangeBatch: {
                            Comment: `Updating public ip ${
                                this.ip
                            } to resource record set at ${new Date().toUTCString()}`,
                            Changes: [
                                {
                                    Action: 'UPSERT',
                                    ResourceRecordSet: {
                                        Name: domain,
                                        Type: this.options.type,
                                        TTL: Number(this.options.ttl),
                                        ResourceRecords: [
                                            {
                                                Value: this.ip
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    })
                    .promise();

                console.log(
                    chalk.greenBright(
                        `Resource record set for ${domain} has been created/updated!`
                    ),
                    JSON.stringify(result.ChangeInfo, undefined, 4)
                );
            } else {
                console.log(
                    chalk.redBright(
                        `no public ip address available to change the record set, aborting...`
                    )
                );
            }
        } catch (e) {
            console.log(
                chalk.redBright(
                    `Failed to create/update resource record set in specified hosted zone`
                ),
                e
            );
            throw e;
        }
    }
}
