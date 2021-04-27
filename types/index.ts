/**
 * Options for updating record sets in a Route53 Hosted Zone
 */
export type UpdateRecordSetOptions = {
    /**
     * The hosted zone in Route53 where record sets will be created/updated
     */
    readonly hostedZoneId: string;
    /**
     * The domain name. Must be a FQDN or subdomain of the root FQDN.
     */
    readonly domain: string;
    /**
     * The TTL (optional, will default to "60" seconds if not set)
     */
    readonly ttl: string;
    /**
     * The DNS record set type to create/update (optional, will use "A" if not set)
     */
    readonly type:
        | 'A'
        | 'AAAA'
        | 'CAA'
        | 'CNAME'
        | 'DS'
        | 'MX'
        | 'NAPTR'
        | 'NS'
        | 'PTR'
        | 'SOA'
        | 'SPF'
        | 'SRV'
        | 'TXT';
    /**
     * The IAM profile that is configured for use to interact with the target AWS account (optional, will use "default" if not set)
     */
    readonly profile: string;
    /**
     * The region that the AWS SDK should operate in when running commands (optional, will use "ap-southeast-1" if not set)
     */
    readonly region: string;
};
