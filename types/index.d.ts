/**
 * Options for updating record sets in a Route53 Hosted Zone
 */
type UpdateRecordSetOptions = Readonly<{
    /**
     * The hosted zone in Route53 where record sets will be created/updated
     */
    hostedZoneId: string;
    /**
     * Comma delimited string of domain names. Each entry must be a FQDN or subdomain of the root FQDN.
     */
    domains: Array<string>;
    /**
     * The IP address to set as the value of the record set created (NOTE: Setting this will override the internal IP lookup mechanism).
     */
    ip?: string;
    /**
     * The TTL (optional, will default to "60" seconds if not set)
     */
    ttl: string;
    /**
     * The DNS record set type to create/update (optional, will use "A" if not set)
     */
    type:
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
    profile: string;
    /**
     * The region that the AWS SDK should operate in when running commands (optional, will use "ap-southeast-1" if not set)
     */
    region: string;
}>;

declare namespace NodeJS {
    export interface ProcessEnv {
        /**
         * The name of this node module as defined in package.json
         */
        readonly MODULE_NAME: string;
        /**
         * The version of this node module as defined in package.json
         */
        readonly MODULE_VERSION: string;
        /**
         * The description of this node module as defined in package.json
         */
        readonly MODULE_DESCRIPTION: string;
    }
}
