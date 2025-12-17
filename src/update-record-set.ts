import chalk from 'chalk';
import shelljs from 'shelljs';
import validator from 'validator';
import { fromIni } from '@aws-sdk/credential-providers';
import {
    ChangeResourceRecordSetsCommand,
    ListResourceRecordSetsCommand,
    Route53Client
} from '@aws-sdk/client-route-53';

export class UpdateRecordSet {
    private readonly options: UpdateRecordSetOptions;
    private readonly route53Client: Route53Client;

    private _ip: string | undefined;

    constructor(options: UpdateRecordSetOptions) {
        this.options = options;

        console.log(
            chalk.cyan(
                `Running ${process.env.MODULE_NAME}:UpdateRecordSet@${process.env.MODULE_VERSION}`
            )
        );

        const credentials = fromIni({
            profile: this.options.profile
        });

        this.route53Client = new Route53Client({
            credentials,
            region: this.options.region
        });

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
        for await (const checkDomain of this.options.domains) {
            const domainActions =
                await this.validateResourceRecordSet(checkDomain);

            for (const [domain, action] of Object.entries(domainActions)) {
                if (action === 'UPSERT') {
                    await this.pushRecordSet(domain);
                }
            }
        }
    }

    private getIpAddress(): void {
        try {
            if (this.options.ip) {
                if (validator.isIP(this.options.ip, '4')) {
                    this.ip = this.options.ip;
                    console.log(
                        chalk.greenBright(
                            `The user supplied ip address is: ${this.ip}`
                        )
                    );
                } else {
                    throw new Error(
                        `Could not apply the user supplied ip address!`
                    );
                }
            } else {
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
            }
        } catch (e) {
            console.log(
                chalk.redBright(
                    (e as Error).message ??
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
    ): Promise<Record<string, 'COMPLETE' | 'UPSERT'>> {
        const domainOperationMap: Record<string, 'COMPLETE' | 'UPSERT'> = {};

        try {
            const command = new ListResourceRecordSetsCommand({
                HostedZoneId: this.options.hostedZoneId,
                StartRecordName: domain,
                StartRecordType: this.options.type
            });

            const list = await this.route53Client.send(command);

            if (list.ResourceRecordSets) {
                const matchedDomainRecordSet = list.ResourceRecordSets.find(
                    (resourceRecordSet) =>
                        this.stripTrailingDot(resourceRecordSet.Name) === domain
                );

                if (!matchedDomainRecordSet) {
                    domainOperationMap[domain] = 'UPSERT';
                } else {
                    for (const resourceRecordSet of list.ResourceRecordSets.filter(
                        (resourceRecordSet) =>
                            typeof resourceRecordSet.ResourceRecords !==
                            'undefined'
                    )) {
                        for (const resourceRecord of resourceRecordSet?.ResourceRecords ??
                            []) {
                            const { Value: currentIp } = resourceRecord ?? {};

                            if (currentIp === this.ip) {
                                console.log(
                                    chalk.greenBright(
                                        `network public ip address is already the same as the one set in the target resource record for ${domain}, nothing further to do`
                                    )
                                );
                                domainOperationMap[domain] = 'COMPLETE';
                            } else {
                                console.log(
                                    chalk.yellowBright(
                                        `network public ip address is different from the one in the record set for ${domain}, will update the record set`
                                    )
                                );
                                domainOperationMap[domain] = 'UPSERT';
                            }
                        }
                    }
                }
            } else {
                console.log(
                    chalk.yellowBright(
                        `no existing record set for ${domain} in specified hosted zone, will create a new record set`
                    )
                );
                domainOperationMap[domain] = 'UPSERT';
            }

            return domainOperationMap;
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
     * If an IP address is available, insert or update the specified record type in the hosted zone
     * with the IP address.
     */
    private async pushRecordSet(domain: string): Promise<void> {
        try {
            if (typeof this.ip !== 'undefined') {
                const command = new ChangeResourceRecordSetsCommand({
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
                });

                const result = await this.route53Client.send(command);

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

    private stripTrailingDot(fqdn?: string): string | undefined {
        return fqdn?.endsWith('.') ? fqdn.slice(0, -1) : fqdn;
    }
}
